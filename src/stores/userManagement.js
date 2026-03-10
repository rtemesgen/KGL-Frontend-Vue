import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { toast } from 'vue3-toastify'
import { usersApiService } from '@/services/api/users'
import { authService } from '@/services/api/auth'
import { getApiMessage } from '@/services/api/client'
import { usePendingRegistrationsStore } from '@/stores/pendingRegistrations'
import { useUsersStore } from '@/stores/users'
import { usersService } from '@/services/users'

const createInitialForm = () => ({
  id: '',
  name: '',
  email: '',
  role: 'MANAGER',
  branch: 'Maganjo',
  password: '',
})

const CENTRAL_ROLES = new Set(['ADMIN', 'DIRECTOR'])
const BRANCH_NAMES = ['Maganjo', 'Matugga']

const roleFromBackend = (role) => {
  const value = String(role || '').trim().toLowerCase().replace(/\s+/g, '-')
  if (value === 'sales-agent') return 'SALES AGENT'
  if (value === 'manager') return 'MANAGER'
  if (value === 'admin') return 'ADMIN'
  if (value === 'director') return 'DIRECTOR'
  return String(role || '').trim().toUpperCase()
}

const branchFromBackend = (branch) => {
  const value = String(branch || '').trim().toLowerCase()
  if (value === 'maganjo') return 'Maganjo'
  if (value === 'matugga') return 'Matugga'
  return 'Central View'
}

const mapUser = (user) => {
  const role = roleFromBackend(user?.role)
  return {
    id: user?._id || user?.id || '',
    name: String(user?.name || 'Unknown User').trim(),
    email: String(user?.email || '').trim().toLowerCase(),
    role,
    branch: branchFromBackend(user?.branch),
    permissions: usersService.getPermissionsForRole(role),
  }
}

export const useUserManagementStore = defineStore('userManagement', () => {
  const usersStore = useUsersStore()
  const pendingRegistrationsStore = usePendingRegistrationsStore()

  const users = ref([])
  const loading = ref(false)
  const initialized = ref(false)
  const searchTerm = ref('')
  const roleFilter = ref('ALL')
  const branchFilter = ref('ALL')
  const showModal = ref(false)
  const modalMode = ref('edit')
  const formError = ref('')
  const form = reactive(createInitialForm())
  const showDeleteConfirm = ref(false)
  const pendingDeleteId = ref('')
  const pendingDeleteName = ref('this user')
  const pendingDeleteEmail = ref('')

  const filteredUsers = computed(() => {
    const q = searchTerm.value.trim().toLowerCase()

    return users.value.filter((user) => {
      const roleOk = roleFilter.value === 'ALL' || user.role === roleFilter.value
      const branchOk = branchFilter.value === 'ALL' || user.branch === branchFilter.value
      const searchOk =
        !q ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.role.toLowerCase().includes(q) ||
        user.branch.toLowerCase().includes(q) ||
        user.id.toLowerCase().includes(q)

      return roleOk && branchOk && searchOk
    })
  })

  const pendingRegistrations = computed(() => pendingRegistrationsStore.sortedItems)
  const pendingRegistrationsCount = computed(() => pendingRegistrationsStore.pendingCount)
  const totalUsers = computed(() => users.value.length)
  const metrics = computed(() => {
    const distinctRoles = new Set(users.value.map((user) => user.role))
    const branchOnlyUsers = users.value.filter((user) => user.branch !== 'Central View')
    const branches = new Set(branchOnlyUsers.map((user) => user.branch))
    return {
      totalUsers: users.value.length,
      activeRoles: distinctRoles.size,
      operationalBranches: branches.size,
    }
  })

  const branchSummaries = computed(() => BRANCH_NAMES.map((branchName) => {
    const branchUsers = users.value.filter((user) => user.branch === branchName)
    const manager = branchUsers.find((user) => user.role === 'MANAGER')?.name || 'Unassigned'
    const salesAgent = branchUsers.find((user) => user.role === 'SALES AGENT')?.name || 'Unassigned'
    return {
      name: branchName,
      manager,
      salesAgent,
      userCount: branchUsers.length,
    }
  }))

  const formBranchDisabled = computed(() => modalMode.value === 'edit' && CENTRAL_ROLES.has(form.role))
  const isAddMode = computed(() => modalMode.value === 'add')

  const syncIntoUsersStore = () => {
    usersStore.users = users.value.map((user) => ({
      ...user,
      password: '',
    }))
    usersStore.rebuildProfiles()
  }

  const initialize = async (force = false) => {
    if (initialized.value && !force) return
    loading.value = true
    try {
      const remoteUsers = await usersApiService.listUsers()
      users.value = remoteUsers.map(mapUser)
      syncIntoUsersStore()
      initialized.value = true
    } catch (error) {
      toast.error(getApiMessage(error, 'Unable to load users.'))
    } finally {
      loading.value = false
    }
  }

  const setSearchTerm = (value) => {
    searchTerm.value = value
  }

  const setRoleFilter = (value) => {
    roleFilter.value = value
  }

  const setBranchFilter = (value) => {
    branchFilter.value = value
  }

  const updateFormField = (key, value) => {
    form[key] = value
  }

  const resetForm = () => {
    Object.assign(form, createInitialForm())
  }

  const openAddModal = () => {
    modalMode.value = 'add'
    formError.value = ''
    resetForm()
    showModal.value = true
  }

  const openEditModal = (user) => {
    modalMode.value = 'edit'
    formError.value = ''
    Object.assign(form, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
      password: '',
    })
    showModal.value = true
  }

  const closeModal = () => {
    showModal.value = false
    formError.value = ''
    resetForm()
  }

  const validateForm = () => {
    if (!form.role) return 'Role is required.'
    if (modalMode.value === 'add') {
      if (!String(form.name || '').trim()) return 'Name is required.'
      if (!String(form.email || '').trim()) return 'Email is required.'
      if (!String(form.password || '').trim()) return 'Password is required.'
      if (String(form.password || '').trim().length < 6) return 'Password must be at least 6 characters.'
    }
    return ''
  }

  const saveUser = async () => {
    formError.value = validateForm()
    if (formError.value) {
      toast.error(formError.value)
      return
    }

    try {
      if (modalMode.value === 'add') {
        await authService.register({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          branch: form.branch,
        })
        await initialize(true)
        toast.success(`User account created for ${form.name}.`)
        closeModal()
        return
      }

      await usersApiService.updateUserRole(form.id, form.role)
      await initialize(true)
      toast.success(`Role updated for ${form.name}.`)
      closeModal()
    } catch (error) {
      formError.value = getApiMessage(error, modalMode.value === 'add' ? 'Unable to create user.' : 'Unable to update user role.')
      toast.error(formError.value)
    }
  }

  const approvePendingRegistration = async (id) => {
    const result = await pendingRegistrationsStore.approvePendingRegistration(id)
    if (!result.ok) {
      toast.error(result.message || 'Unable to approve registration.')
      return result
    }

    await initialize(true)
    toast.success(`${result.pendingRegistration.name} approved and created in backend.`)
    return result
  }

  const rejectPendingRegistration = (id) => {
    const result = pendingRegistrationsStore.rejectPendingRegistration(id)
    if (!result.ok) {
      toast.error(result.message || 'Unable to reject registration.')
      return result
    }

    toast.info(`${result.pendingRegistration.name} removed from pending approvals.`)
    return result
  }

  const requestDelete = (user) => {
    pendingDeleteId.value = String(user?.id || '')
    pendingDeleteName.value = user?.name || 'this user'
    pendingDeleteEmail.value = String(user?.email || '').trim().toLowerCase()
    showDeleteConfirm.value = !!pendingDeleteId.value
  }

  const cancelDelete = () => {
    showDeleteConfirm.value = false
    pendingDeleteId.value = ''
    pendingDeleteName.value = 'this user'
    pendingDeleteEmail.value = ''
  }

  const confirmDelete = async () => {
    if (!pendingDeleteId.value && !pendingDeleteEmail.value) return

    await initialize(true)
    const latestUser = users.value.find((entry) => (
      (pendingDeleteEmail.value && entry.email === pendingDeleteEmail.value)
      || String(entry.id) === String(pendingDeleteId.value)
    ))
    const deleteId = String(latestUser?.id || pendingDeleteId.value || '')
    const deletingCurrentUser = usersStore.currentUser?.email === (latestUser?.email || pendingDeleteEmail.value)

    if (!deleteId) {
      toast.error('Unable to resolve the selected user from backend data.')
      cancelDelete()
      return
    }

    try {
      await usersApiService.deleteUser(deleteId)
      await initialize(true)
      toast.success(`${pendingDeleteName.value} deleted.`)
      cancelDelete()
      if (deletingCurrentUser) {
        usersStore.logout()
      }
    } catch (error) {
      toast.error(getApiMessage(error, 'Unable to delete user.'))
    }
  }

  const roleBadgeClass = (role) => {
    if (role === 'ADMIN') return 'bg-[#e5e7eb] text-[#374151]'
    if (role === 'DIRECTOR') return 'bg-[#ffedd5] text-[#a6651e]'
    if (role === 'MANAGER') return 'bg-[#dbeafe] text-[#2563eb]'
    return 'bg-[#dcfce7] text-[#18803b]'
  }

  return {
    users,
    filteredUsers,
    pendingRegistrations,
    pendingRegistrationsCount,
    totalUsers,
    metrics,
    branchSummaries,
    loading,
    searchTerm,
    roleFilter,
    branchFilter,
    showModal,
    modalMode,
    formError,
    form,
    formBranchDisabled,
    isAddMode,
    showDeleteConfirm,
    pendingDeleteName,
    initialize,
    setSearchTerm,
    setRoleFilter,
    setBranchFilter,
    updateFormField,
    openAddModal,
    openEditModal,
    closeModal,
    saveUser,
    approvePendingRegistration,
    rejectPendingRegistration,
    requestDelete,
    cancelDelete,
    confirmDelete,
    roleBadgeClass,
  }
})

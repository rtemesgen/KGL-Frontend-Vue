import { defineStore } from 'pinia'
import { BRANCH_NAMES, REGISTRATION_ROLES } from '@/constants/users'
import { authService } from '@/services/api/auth'
import { clearAuthToken, getAuthToken, setAuthToken } from '@/services/api/token'
import { getApiMessage } from '@/services/api/client'
import { usePendingRegistrationsStore } from '@/stores/pendingRegistrations'
import { usersService } from '@/services/users'
import { useInventoryStore } from '@/stores/inventory'

const slugify = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const normalizedBranch = (branch) => (branch === 'Central View' ? null : branch)

const backendBranchToFrontend = (branch) => {
  const value = String(branch || '').trim().toLowerCase()
  if (value === 'maganjo') return 'Maganjo'
  if (value === 'matugga') return 'Matugga'
  return 'Central View'
}

const profileTypeFromRole = (role) => {
  const key = String(role || '').trim().toLowerCase().replace(/\s+/g, '-')
  if (key === 'sales-agent') return 'sales'
  if (key === 'manager') return 'manager'
  if (key === 'admin') return 'admin'
  if (key === 'director') return 'director'
  return ''
}

const frontendRoleFromBackend = (role) => {
  const key = String(role || '').trim().toLowerCase().replace(/\s+/g, '-')
  if (key === 'sales-agent') return 'SALES AGENT'
  if (key === 'manager') return 'MANAGER'
  if (key === 'admin') return 'ADMIN'
  if (key === 'director') return 'DIRECTOR'
  return String(role || '').trim().toUpperCase()
}

const profileLabelFromUser = (user) => {
  const roleType = profileTypeFromRole(user.role)
  if (roleType === 'sales') return `Sales Agent (${user.branch})`
  if (roleType === 'manager') return `Manager (${user.branch})`
  if (roleType === 'admin') return 'Admin (Central)'
  if (roleType === 'director') return 'Director (Central)'
  return user.name
}

const profileIdForUser = (user) => {
  const roleType = profileTypeFromRole(user.role)
  const branch = normalizedBranch(user.branch) || 'central'
  return `${roleType}_${slugify(branch)}_${slugify(user.id || user.email || user.name)}`
}

const buildProfiles = (users) => {
  const profiles = {}
  users.forEach((user) => {
    const existing = Object.values(profiles).find((profile) =>
      profile.name === user.name
      && profile.role === profileTypeFromRole(user.role)
      && (profile.branch || null) === normalizedBranch(user.branch),
    )
    if (existing) return
    const id = profileIdForUser(user)
    profiles[id] = {
      id,
      label: profileLabelFromUser(user),
      name: user.name,
      role: profileTypeFromRole(user.role),
      branch: normalizedBranch(user.branch),
    }
  })
  return profiles
}

const mapBackendUserToFrontend = (user) => ({
  id: user?._id || user?.id || `remote-${slugify(user?.email || user?.name)}`,
  name: String(user?.name || 'User').trim(),
  email: String(user?.email || '').trim().toLowerCase(),
  role: frontendRoleFromBackend(user?.role),
  branch: backendBranchToFrontend(user?.branch),
  password: '',
  permissions: usersService.getPermissionsForRole(frontendRoleFromBackend(user?.role)),
})

const userMatches = (user, email) => {
  const value = String(email || '').trim().toLowerCase()
  return String(user.email || '').trim().toLowerCase() === value
}

export const useUsersStore = defineStore('users', {
  state: () => ({
    users: [],
    activeProfileId: null,
    profiles: {},
    isAuthenticated: false,
    authInitialized: false,
    authToken: getAuthToken(),
    sessionUser: null,
  }),

  getters: {
    profileList: (state) => Object.values(state.profiles),
    currentProfile: (state) => (state.activeProfileId ? state.profiles[state.activeProfileId] || null : null),
    profileType() {
      return this.currentProfile?.role || profileTypeFromRole(this.sessionUser?.role)
    },
    currentRole() {
      return this.profileType
    },
    currentUser() {
      return this.sessionUser || (this.currentProfile
        ? this.users.find((user) => (
          user.name === this.currentProfile.name
          && profileTypeFromRole(user.role) === this.currentProfile.role
          && normalizedBranch(user.branch) === (this.currentProfile.branch || null)
        )) || null
        : null)
    },
    assignedBranch() {
      return this.currentProfile?.branch || normalizedBranch(this.sessionUser?.branch) || null
    },
    canSwitchBranch() {
      return this.profileType === 'admin' || this.profileType === 'director'
    },
    currentProfileName() {
      return this.currentProfile?.name || this.sessionUser?.name || 'User'
    },
    currentRoleLabel() {
      if (this.profileType === 'sales') return 'Sales Agent'
      if (this.profileType === 'manager') return 'Manager'
      if (this.profileType === 'admin') return 'Admin'
      if (this.profileType === 'director') return 'Director'
      return 'User'
    },
    viewerLabel() {
      return this.canSwitchBranch ? 'Central Viewer' : this.assignedBranch || 'N/A'
    },
    allowedCardKeys() {
      if (this.profileType === 'sales') return ['sales']
      if (this.profileType === 'manager') return ['sales', 'procurement']
      if (this.profileType === 'admin' || this.profileType === 'director') return ['sales', 'procurement', 'accounting', 'reports', 'users']
      return []
    },
    defaultRouteName() {
      if (this.allowedCardKeys.includes('sales')) return 'Dashboard'
      return 'Auth'
    },
    metrics(state) {
      const distinctRoles = new Set(state.users.map((user) => user.role))
      const branchOnlyUsers = state.users.filter((user) => user.branch !== 'Central View')
      const branches = new Set(branchOnlyUsers.map((user) => user.branch))
      return {
        totalUsers: state.users.length,
        activeRoles: distinctRoles.size,
        operationalBranches: branches.size,
      }
    },
    branchSummaries(state) {
      return BRANCH_NAMES.map((branchName) => {
        const branchUsers = state.users.filter((user) => user.branch === branchName)
        const manager = branchUsers.find((user) => user.role === 'MANAGER')?.name || 'Unassigned'
        const salesAgent = branchUsers.find((user) => user.role === 'SALES AGENT')?.name || 'Unassigned'
        return {
          name: branchName,
          manager,
          salesAgent,
          userCount: branchUsers.length,
        }
      })
    },
  },

  actions: {
    rebuildProfiles() {
      this.profiles = buildProfiles(this.users)
    },
    mergeRemoteUser(remoteUser) {
      const mapped = mapBackendUserToFrontend(remoteUser)
      const index = this.users.findIndex((user) => userMatches(user, mapped.email) || user.id === mapped.id)
      if (index >= 0) this.users[index] = { ...this.users[index], ...mapped }
      else this.users.push(mapped)
      this.rebuildProfiles()
      return mapped
    },
    applyAuthenticatedUser(remoteUser) {
      const mapped = this.mergeRemoteUser(remoteUser)
      this.sessionUser = mapped
      this.isAuthenticated = true
      this.authInitialized = true

      const profile = Object.values(this.profiles).find((candidate) => (
        candidate.name === mapped.name
        && candidate.role === profileTypeFromRole(mapped.role)
        && (candidate.branch || null) === normalizedBranch(mapped.branch)
      ))

      if (profile?.id) this.setProfile(profile.id)
      else {
        this.activeProfileId = null
        const inventory = useInventoryStore()
        if (mapped.branch && mapped.branch !== 'Central View') inventory.activeBranch = mapped.branch
      }

      return true
    },
    setProfile(id) {
      if (!this.profiles[id]) return
      this.activeProfileId = id
      const inventory = useInventoryStore()
      const branch = this.profiles[id]?.branch
      if (branch) inventory.activeBranch = branch
    },
    async hydrateSession(force = false) {
      if (this.authInitialized && !force) return this.isAuthenticated
      if (!this.authToken) {
        this.isAuthenticated = false
        this.sessionUser = null
        this.activeProfileId = null
        this.authInitialized = true
        clearAuthToken()
        return false
      }

      setAuthToken(this.authToken)
      try {
        const user = await authService.me()
        return this.applyAuthenticatedUser(user)
      } catch {
        this.logout(false)
        this.authInitialized = true
        return false
      }
    },
    async login({ email, password }) {
      try {
        const data = await authService.login({ email, password })
        this.authToken = data.token || ''
        setAuthToken(this.authToken)
        this.applyAuthenticatedUser(data.user)
        return { ok: true, user: this.sessionUser }
      } catch (error) {
        return { ok: false, reason: 'invalid_credentials', message: getApiMessage(error, 'Invalid email or password.') }
      }
    },
    logout(resetInit = true) {
      this.isAuthenticated = false
      this.activeProfileId = null
      this.authToken = ''
      this.sessionUser = null
      this.authInitialized = resetInit
      clearAuthToken()
    },
    async register(payload) {
      const name = String(payload.name || '').trim()
      const email = String(payload.email || '').trim().toLowerCase()
      const password = String(payload.password || '').trim()
      const branch = String(payload.branch || '').trim()
      const role = String(payload.role || '').trim().toUpperCase()
      if (!name || !email || !password || !REGISTRATION_ROLES.includes(role) || !BRANCH_NAMES.includes(branch)) {
        return { ok: false, reason: 'invalid', message: 'Invalid registration details.' }
      }

      const pendingRegistrations = usePendingRegistrationsStore()
      const result = pendingRegistrations.queueRegistration({ name, email, password, branch, role })
      if (!result.ok) {
        return result
      }

      return {
        ok: true,
        queued: true,
        pendingRegistration: result.pendingRegistration,
        message: 'Registration submitted for admin approval.',
      }
    },
  },
})

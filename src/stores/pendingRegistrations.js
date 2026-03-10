import { defineStore } from 'pinia'
import { BRANCH_NAMES, REGISTRATION_ROLES } from '@/constants/users'
import { authService } from '@/services/api/auth'
import { getApiMessage } from '@/services/api/client'

const createPendingId = () => `pending-${Date.now()}-${Math.floor(Math.random() * 100000)}`

const normalizeRegistration = (payload = {}) => ({
  id: createPendingId(),
  name: String(payload.name || '').trim(),
  email: String(payload.email || '').trim().toLowerCase(),
  role: String(payload.role || '').trim().toUpperCase(),
  branch: String(payload.branch || '').trim(),
  password: String(payload.password || ''),
  createdAt: new Date().toISOString(),
})

export const usePendingRegistrationsStore = defineStore('pendingRegistrations', {
  state: () => ({
    items: [],
  }),

  getters: {
    sortedItems: (state) => [...state.items].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
    pendingCount: (state) => state.items.length,
    hasPendingEmail: (state) => (email) => state.items.some((item) => String(item.email || '').trim().toLowerCase() === String(email || '').trim().toLowerCase()),
  },

  actions: {
    queueRegistration(payload) {
      const entry = normalizeRegistration(payload)

      if (!entry.name || !entry.email || !entry.password || !REGISTRATION_ROLES.includes(entry.role) || !BRANCH_NAMES.includes(entry.branch)) {
        return { ok: false, reason: 'invalid', message: 'Invalid registration details.' }
      }

      if (this.hasPendingEmail(entry.email)) {
        return { ok: false, reason: 'pending', message: 'A registration request for that email is already awaiting approval.' }
      }

      this.items = [entry, ...this.items.filter((item) => item.email !== entry.email)]
      return { ok: true, pendingRegistration: entry }
    },

    removePendingRegistration(id) {
      this.items = this.items.filter((item) => item.id !== id)
    },

    rejectPendingRegistration(id) {
      const entry = this.items.find((item) => item.id === id)
      if (!entry) return { ok: false, message: 'Pending registration not found.' }
      this.removePendingRegistration(id)
      return { ok: true, pendingRegistration: entry }
    },

    async approvePendingRegistration(id) {
      const entry = this.items.find((item) => item.id === id)
      if (!entry) return { ok: false, message: 'Pending registration not found.' }

      try {
        const data = await authService.register(entry)
        this.removePendingRegistration(id)
        return { ok: true, pendingRegistration: entry, user: data?.user || null }
      } catch (error) {
        return { ok: false, message: getApiMessage(error, 'Unable to approve registration.') }
      }
    },
  },
})

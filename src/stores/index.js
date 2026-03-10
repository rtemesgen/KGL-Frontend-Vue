import { createPinia } from 'pinia'

const STORAGE_PREFIX = 'karibu:pinia:'
const PERSISTED_STORE_IDS = new Set(['users', 'inventory', 'sales', 'credits', 'expenses', 'otherIncome', 'procurement', 'pendingRegistrations'])

const pinia = createPinia()

pinia.use(({ store }) => {
  if (typeof window === 'undefined' || !PERSISTED_STORE_IDS.has(store.$id)) return

  const storageKey = `${STORAGE_PREFIX}${store.$id}`

  try {
    const cached = window.localStorage.getItem(storageKey)
    if (cached) {
      store.$patch(JSON.parse(cached))
    }
  } catch (error) {
    console.warn(`Failed to restore persisted store ${store.$id}.`, error)
  }

  store.$subscribe(
    (_mutation, state) => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(state))
      } catch (error) {
        console.warn(`Failed to persist store ${store.$id}.`, error)
      }
    },
    { detached: true },
  )
})

export { pinia }

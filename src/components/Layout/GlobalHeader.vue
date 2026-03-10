<template>
  <header class="h-[52px] border-b border-[#c7d7cc] bg-[linear-gradient(90deg,#f6e3cf_0%,#d8ecd9_55%,#d4e4f8_100%)] px-4">
    <div class="flex h-full w-full items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1.5">
          <svg class="h-5 w-5" viewBox="0 0 64 64" aria-label="Karibu logo mark">
            <ellipse cx="45" cy="16" rx="9" ry="12" fill="#f4b400" />
            <ellipse cx="35" cy="27" rx="9" ry="12" fill="#f6bf26" />
            <path d="M14 50V13" stroke="#f28c18" stroke-width="2.6" stroke-linecap="round" />
            <path d="M14 20c-6-1-10-6-10-12 6 1 10 6 10 12Z" fill="#f28c18" />
            <path d="M14 29c-6-1-10-6-10-12 6 1 10 6 10 12Z" fill="#f4a11f" />
            <path d="M14 38c-6-1-10-6-10-12 6 1 10 6 10 12Z" fill="#f59e0b" />
            <path d="M18 43c8-9 21-6 24 5-9 4-19 2-24-5Z" fill="#5fae4d" />
            <path d="M42 50c-4-11 2-22 15-24 2 11-3 20-15 24Z" fill="#3f8f3a" />
          </svg>
          <span class="text-base font-bold leading-none text-[#d66b0b]">Karibu <span class="text-[#22863a]">Grocery</span></span>
        </div>

        <button
          v-if="access.canSwitchBranch"
          class="rounded-md border border-[#9fc0a6] bg-[#e7f3e8] px-2 py-0.5 text-[10px] font-semibold text-[#1f5f2e] hover:bg-[#d7ebda]"
          @click="inventory.toggleBranch()"
        >
          Branch: {{ inventory.activeBranch }}
        </button>
        <span
          v-else
          class="rounded-md border border-[#c8d7cc] bg-[#edf3ee] px-2 py-0.5 text-[10px] font-semibold text-[#475f51]"
        >
          Branch: {{ access.assignedBranch || 'N/A' }}
        </span>
      </div>

      <div class="flex items-center gap-3">
        <button class="relative rounded-md p-1.5 text-[#6b7280] hover:bg-white/60">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" />
          </svg>
          <span class="absolute right-[5px] top-[5px] h-1.5 w-1.5 rounded-full border border-white bg-[#ef4444]"></span>
        </button>
        <div class="hidden h-6 w-px bg-[#bfd1c4] md:block"></div>
        <button class="rounded-md border border-[#c8d7cc] bg-[#edf3ee] px-2 py-0.5 text-[10px] font-semibold text-[#475f51] hover:bg-white" @click="logout">Logout</button>
        <div class="flex items-center gap-2 rounded-md bg-[#f4f7ef]/80 px-1.5 py-1">
          <div class="text-right">
            <div class="text-xs font-semibold leading-tight">{{ access.currentProfile?.name || 'User' }}</div>
            <div class="text-[10px] leading-tight text-[#8f96a3]">{{ access.canSwitchBranch ? 'Central Viewer' : (access.assignedBranch || 'N/A') }}</div>
          </div>
          <img src="https://randomuser.me/api/portraits/men/32.jpg" class="h-7 w-7 rounded-full border border-[#e5e7eb] object-cover" alt="User" />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { toast } from 'vue3-toastify'
import { useInventoryStore } from '@/stores/inventory'
import { useUsersStore } from '@/stores/users'
import { canAccessRoute } from '@/router/auth'

const router = useRouter()
const route = useRoute()
const inventory = useInventoryStore()
const access = useUsersStore()

const logout = () => {
  access.logout()
  toast.success('Signed out.')
  router.replace({ name: 'Auth' })
}

const enforceCurrentRoute = () => {
  const canAccess = canAccessRoute(route.meta?.requiredAccess, access.allowedCardKeys)
  if (!canAccess) {
    toast.error('Access denied: your role cannot open this page.')
    router.replace({ name: 'Dashboard' })
  }
}

enforceCurrentRoute()
</script>

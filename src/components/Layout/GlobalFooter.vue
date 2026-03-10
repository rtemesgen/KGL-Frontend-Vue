<template>
  <footer class="border-t border-[#cad8ce] bg-[linear-gradient(90deg,#f5f7f6_0%,#eef5f0_50%,#edf3f9_100%)] px-4 py-2">
    <div class="mx-auto flex w-full max-w-[1480px] flex-col gap-1 text-[11px] text-[#44535f] md:flex-row md:items-center md:justify-between">
      <div class="text-center font-semibold text-[#263a4a] md:text-left">
        Karibu Grocery Management System
      </div>

      <div class="text-center text-[#4f6270] md:text-left">
        Branch: {{ activeBranch }} | Logged in : {{ users.viewerLabel }}
      </div>

      <div class="flex items-center justify-center gap-3 text-[#5f7281] md:justify-end">
        <span>&copy; {{ currentYear }} Karibu Grocery Ltd.</span>
        <span class="inline-flex items-center gap-1">
          <span class="h-2 w-2 rounded-full bg-[#16a34a]"></span>
          System Online
        </span>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useInventoryStore } from '@/stores/inventory'
import { useUsersStore } from '@/stores/users'

const users = useUsersStore()
const inventory = useInventoryStore()
const { activeBranch } = storeToRefs(inventory)
const currentYear = computed(() => new Date().getFullYear())
</script>

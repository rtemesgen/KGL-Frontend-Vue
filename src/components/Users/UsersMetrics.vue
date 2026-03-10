<template>
  <section class="grid grid-cols-1 gap-1.5 lg:grid-cols-3">
    <article class="rounded-xl border border-[#c7d7cc] bg-gradient-to-b from-[#f9f7f1] to-[#e8f1e6] p-2.5">
      <div class="flex items-center gap-2.5">
        <div class="grid h-7 w-7 place-items-center rounded-full bg-[#dce8f6] text-[10px] font-bold text-[#43607a]">U</div>
        <div>
          <small class="text-[10px] text-[#63746d]">Total Users</small>
          <h2 class="m-0 text-[18px] font-semibold text-[#111827]">{{ metrics.totalUsers }} <span class="ml-1 text-[10px] text-[#7f8d96]">Current</span></h2>
        </div>
      </div>
    </article>
    <article class="rounded-xl border border-[#c7d7cc] bg-gradient-to-b from-[#f9f7f1] to-[#e8f1e6] p-2.5">
      <div class="flex items-center gap-2.5">
        <div class="grid h-7 w-7 place-items-center rounded-full bg-[#f7e6cf] text-[10px] font-bold text-[#a6651e]">R</div>
        <div>
          <small class="text-[10px] text-[#63746d]">Active Roles</small>
          <h2 class="m-0 text-[18px] font-semibold text-[#111827]">{{ metrics.activeRoles }} <span class="ml-1 text-[10px] text-[#7f8d96]">Stable</span></h2>
        </div>
      </div>
    </article>
    <article class="rounded-xl border border-[#c7d7cc] bg-gradient-to-b from-[#f9f7f1] to-[#e8f1e6] p-2.5">
      <div class="flex items-center gap-2.5">
        <div class="grid h-7 w-7 place-items-center rounded-full bg-[#dceedd] text-[10px] font-bold text-[#2f6940]">B</div>
        <div>
          <small class="text-[10px] text-[#63746d]">Operational Branches</small>
          <h2 class="m-0 text-[18px] font-semibold text-[#111827]">{{ metrics.operationalBranches }} <span class="ml-1 text-[10px] text-[#7f8d96]">Active</span></h2>
        </div>
      </div>
    </article>
  </section>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useUserManagementStore } from '@/stores/userManagement'

const usersManagement = useUserManagementStore()
const { metrics } = storeToRefs(usersManagement)
</script>

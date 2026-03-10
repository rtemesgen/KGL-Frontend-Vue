<template>
  <section class="overflow-hidden rounded-xl border border-[#c7d7cc] bg-[#f7f6f0f2] flex h-full min-h-0 flex-col">
    <div class="border-b border-[#d3dfd5] bg-gradient-to-r from-[#e3f1df] to-[#f3e2ce] px-2.5 py-1.5">
      <h3 class="m-0 text-[15px] font-semibold text-[#274536]">Branch Summary Overview</h3>
    </div>
    <div class="grid flex-1 min-h-0 content-start grid-cols-1 gap-1.5 overflow-auto p-1.5 2xl:grid-cols-2">
      <article v-for="branch in branchSummaries" :key="branch.name" class="rounded-[10px] border border-[#d3dfd5] bg-gradient-to-b from-[#f8faf4] to-[#edf3ee] p-2.5">
        <h4 class="mb-1 text-[14px] font-semibold text-[#111827]">{{ branch.name }}</h4>
        <p class="text-[11px] leading-6 text-[#4f6259]"><strong>Manager:</strong> {{ branch.manager }}</p>
        <p class="text-[11px] leading-6 text-[#4f6259]"><strong>Sales Agent:</strong> {{ branch.salesAgent }}</p>
        <p class="text-[11px] leading-6 text-[#4f6259]"><strong>Assigned Users:</strong> {{ branch.userCount }}</p>
        <p class="text-[11px] leading-6 text-[#4f6259]"><strong>Central Viewers:</strong> Admin, Director</p>
      </article>
    </div>
  </section>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useUserManagementStore } from '@/stores/userManagement'

const usersManagement = useUserManagementStore()
const { branchSummaries } = storeToRefs(usersManagement)
</script>

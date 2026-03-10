<template>
  <section class="overflow-hidden rounded-xl border border-[#c7d7cc] bg-[#f7f6f0f2] flex flex-col">
    <div class="flex items-center justify-between border-b border-[#d3dfd5] bg-gradient-to-r from-[#e3f1df] to-[#f3e2ce] px-2.5 py-1.5">
      <div>
        <h3 class="m-0 text-[15px] font-semibold text-[#274536]">Pending Approvals</h3>
        <p class="m-0 text-[10px] text-[#5c7368]">Frontend-submitted registrations waiting for admin approval.</p>
      </div>
      <span class="rounded-md bg-[#fff7ed] px-2 py-0.5 text-[10px] font-semibold text-[#c2410c]">{{ pendingRegistrationsCount }} Pending</span>
    </div>

    <div v-if="pendingRegistrations.length" class="divide-y divide-[#dbe6dd]">
      <article v-for="registration in pendingRegistrations" :key="registration.id" class="grid gap-2 px-2.5 py-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div class="min-w-0">
          <div class="text-[13px] font-semibold text-[#111827]">{{ registration.name }}</div>
          <div class="mt-0.5 text-[11px] text-[#475569]">{{ registration.email }}</div>
          <div class="mt-1 flex flex-wrap gap-1.5 text-[10px] text-[#5c7368]">
            <span class="rounded-md bg-[#eef3ef] px-1.5 py-0.5 font-semibold">{{ registration.role }}</span>
            <span class="rounded-md bg-[#eef3ef] px-1.5 py-0.5 font-semibold">{{ registration.branch }}</span>
            <span>Submitted {{ submittedLabel(registration.createdAt) }}</span>
          </div>
        </div>

        <div class="flex gap-2 md:justify-end">
          <button class="h-[30px] rounded-[10px] border border-[#c7d7cc] bg-[#f8faf7] px-3 text-[11px] font-semibold text-[#475f51]" @click="usersManagement.rejectPendingRegistration(registration.id)">Reject</button>
          <button class="h-[30px] rounded-[10px] border border-[#30543e] bg-[#30543e] px-3 text-[11px] font-semibold text-white" @click="usersManagement.approvePendingRegistration(registration.id)">Approve</button>
        </div>
      </article>
    </div>

    <div v-else class="px-3 py-4 text-[11px] text-[#64748b]">No pending registrations waiting for approval.</div>
  </section>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useUserManagementStore } from '@/stores/userManagement'

const usersManagement = useUserManagementStore()
const { pendingRegistrations, pendingRegistrationsCount } = storeToRefs(usersManagement)

const submittedLabel = (value) => {
  if (!value) return 'just now'
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <section class="rounded-xl border border-[#c7d7cc] bg-gradient-to-b from-[#f9f7f1] to-[#e8f1e6] p-2">
    <div class="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex items-center gap-2">
        <RouterLink to="/" class="inline-flex h-10 items-center gap-2 rounded-[12px] border border-[#9fb8a8] bg-[#30543e] px-3 text-white shadow-[0_8px_18px_rgba(48,84,62,0.18)] transition hover:bg-[#274536]" aria-label="Go to dashboard">
          <HomeIcon class="h-4.5 w-4.5" />
          <span class="text-[11px] font-semibold leading-none">Dashboard</span>
        </RouterLink>
        <div class="grid gap-0.5">
          <div class="flex items-center gap-1.5">
            <h1 class="m-0 text-[22px] font-semibold text-[#111827]">Report</h1>
            <span class="inline-flex items-center rounded-full border border-[#b9cabf] bg-[#edf3ee] px-2 py-0.5 text-[9px] font-semibold text-[#30543e]">{{ reports.branchLabel }}</span>
          </div>
        </div>
      </div>

      <div class="flex flex-nowrap items-center justify-end gap-1.5 overflow-x-auto">
        <label class="flex h-[32px] min-w-[154px] items-center gap-1.5 rounded-[10px] border border-[#c7d7cc] bg-[#f8faf7] px-2">
          <span class="text-[9px] text-[#7a8a86]">From</span>
          <input
            :value="reports.filters.from"
            type="date"
            class="w-full border-none bg-transparent text-[11px] text-[#1f2937] outline-none"
            @input="reports.setFrom($event.target.value)"
          />
        </label>

        <label class="flex h-[32px] min-w-[154px] items-center gap-1.5 rounded-[10px] border border-[#c7d7cc] bg-[#f8faf7] px-2">
          <span class="text-[9px] text-[#7a8a86]">To</span>
          <input
            :value="reports.filters.to"
            type="date"
            class="w-full border-none bg-transparent text-[11px] text-[#1f2937] outline-none"
            @input="reports.setTo($event.target.value)"
          />
        </label>

        <label v-if="['credit', 'all'].includes(reports.filters.category)" class="flex h-[32px] min-w-[126px] items-center gap-1.5 rounded-[10px] border border-[#c7d7cc] bg-[#f8faf7] px-2">
          <span class="text-[9px] text-[#7a8a86]">Status</span>
          <select
            :value="reports.filters.creditStatus"
            class="w-full border-none bg-transparent text-[11px] text-[#344640] outline-none"
            @change="reports.setCreditStatus($event.target.value)"
          >
            <option value="ALL">All</option>
            <option value="CLEARED">Cleared</option>
            <option value="PENDING">Pending</option>
          </select>
        </label>

        <label class="flex h-[32px] min-w-[146px] items-center gap-1.5 rounded-[10px] border border-[#c7d7cc] bg-[#f8faf7] px-2">
          <span class="text-[9px] text-[#7a8a86]">Category</span>
          <select
            :value="reports.filters.category"
            class="w-full border-none bg-transparent text-[11px] text-[#344640] outline-none"
            @change="reports.setCategory($event.target.value)"
          >
            <option value="all">All Reports</option>
            <option value="sales">Sales</option>
            <option value="credit">Credit</option>
            <option value="expense">Expenses</option>
            <option value="otherIncome">Other Income</option>
          </select>
        </label>

        <button class="h-[32px] rounded-[10px] border border-[#c7d7cc] bg-[#f8faf7] px-3 text-[11px] font-semibold text-[#344640]" @click="refreshPage">Refresh</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { HomeIcon } from '@heroicons/vue/24/outline'
import { RouterLink } from 'vue-router'
import { useReportsStore } from '@/stores/reports'

const reports = useReportsStore()

const refreshPage = async () => {
  await reports.initialize()
}
</script>

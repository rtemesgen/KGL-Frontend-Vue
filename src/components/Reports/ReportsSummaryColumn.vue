<template>
  <div class="space-y-1">
    <article class="rounded-xl border border-[#cfdccd] bg-[#f6f7f3] px-0.5 py-5 shadow-[0_4px_12px_rgba(16,24,40,0.08)]">
      <h2 class="mb-1 text-[10px] font-semibold tracking-[0.12em] text-[#7a8a80] uppercase">Cash Inflow</h2>
      <div class="space-y-0.5 text-[10px] text-[#45544a]">
        <div class="flex items-center justify-between gap-1"><span>Cash Sales</span><strong>{{ formatAmount(cash.cashSales) }}</strong></div>
        <div class="flex items-center justify-between gap-1"><span>Credit Collections</span><strong>{{ formatAmount(cash.creditCollections) }}</strong></div>
        <div class="flex items-center justify-between gap-1"><span>Other Income</span><strong>{{ formatAmount(cash.otherIncome) }}</strong></div>
      </div>
      <div class="mt-1 border-t border-[#dbe6de] pt-1">
        <div class="flex items-center justify-between gap-1 text-[10px] font-bold text-[#274536]"><span>Total Inflow</span><span>{{ formatAmount(cash.total) }}</span></div>
      </div>
    </article>

    <article class="rounded-xl border border-[#cfdccd] bg-[#f6f7f3] px-0.5 py-5 shadow-[0_4px_12px_rgba(16,24,40,0.08)]">
      <h2 class="mb-1 text-[10px] font-semibold tracking-[0.12em] text-[#7a8a80] uppercase">Outflows</h2>
      <div class="space-y-0.5 text-[10px] text-[#45544a]">
        <div class="flex items-center justify-between gap-1"><span>Recorded Expenses</span><strong>{{ formatAmount(outflows.recordedExpenses) }}</strong></div>
        <div class="flex items-center justify-between gap-1"><span>Outstanding Credit</span><strong>{{ formatAmount(outflows.outstandingCredit) }}</strong></div>
      </div>
      <div class="mt-1 border-t border-[#dbe6de] pt-1">
        <div class="flex items-center justify-between gap-1 text-[10px] font-bold text-[#dc2626]"><span>Total Exposure</span><span>{{ formatAmount(outflows.total) }}</span></div>
      </div>
    </article>

    <article class="relative overflow-hidden rounded-xl border border-[#3f6f55] bg-gradient-to-r from-[#2f6b4d] to-[#4c7a5b] px-0.5 py-2 text-white shadow-[0_8px_18px_rgba(39,80,60,0.22)]">
      <p class="text-[10px] text-white/90">Net Profit</p>
      <p class="mt-0.5 text-[22px] font-bold leading-none">{{ formatAmount(netProfit) }} <span class="text-[10px] font-medium">UGX</span></p>
      <span class="mt-1 inline-flex rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-semibold">Total inflow less total exposure</span>
      <div class="absolute -bottom-8 -right-8 h-20 w-20 rounded-full bg-white/10"></div>
    </article>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { formatAmount } from '@/utils/formatters'
import { useReportsStore } from '@/stores/reports'

const reports = useReportsStore()
const { cash, outflows, netProfit } = storeToRefs(reports)
</script>
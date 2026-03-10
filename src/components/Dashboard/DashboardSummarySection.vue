<template>
  <section class="flex-none">
    <h2 class="mb-0.5 text-[8px] font-semibold tracking-[0.14em] text-[#6b7b86]">HIGH-LEVEL SUMMARY</h2>
    <div class="grid grid-cols-2 gap-1 xl:grid-cols-4">
      <SummaryCard
        v-for="card in summaryCards"
        :key="card.key"
        :title="card.title"
        :value="card.value"
        :icon="card.icon"
        :trend="card.trend"
        :trend-type="card.trendType"
        :compact="true"
      />
    </div>
  </section>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import SummaryCard from '@/components/Dashboard/SummaryCard.vue'
import { useDashboardStore } from '@/stores/dashboard'

const dashboard = useDashboardStore()
const { summaryCards } = storeToRefs(dashboard)
</script>

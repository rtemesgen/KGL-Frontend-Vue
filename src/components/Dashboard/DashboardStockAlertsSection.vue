<template>
  <section class="flex-1 min-h-0 overflow-hidden rounded-xl border border-[#cfd9d1] bg-[linear-gradient(180deg,rgba(250,251,248,0.96)_0%,rgba(242,246,241,0.96)_100%)] shadow-[0_8px_20px_rgba(41,64,52,0.08)]">
    <div class="flex items-center justify-between border-b border-[#dbe4dd] bg-[linear-gradient(90deg,#edf4ec,#f3eadc)] px-3 py-1">
      <h2 class="text-[11px] font-semibold tracking-[0.12em] text-[#395347]">STOCK ALERTS (&lt; 1000KG REMAINING) - {{ activeBranch }}</h2>
    </div>

    <div class="flex h-[calc(100%-34px)] min-h-0 flex-col justify-start divide-y divide-[#dde6df] px-3 overflow-auto pb-1">
      <StockAlertItem
        v-for="item in stockRows"
        :key="item.sku"
        :name="item.name"
        :sku="item.sku"
        :opening-qty="item.openingQty"
        :sold-qty="item.soldQty"
        :remaining-qty="item.remainingQty"
        :status="item.status"
        :cost="formatUGX(item.costPerKg)"
        :selling-price="formatUGX(item.sellingPricePerKg)"
        :compact="true"
      />
    </div>
  </section>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { formatUGX } from '@/utils/formatters'
import StockAlertItem from '@/components/Dashboard/StockAlertItem.vue'
import { useDashboardStore } from '@/stores/dashboard'

const dashboard = useDashboardStore()
const { activeBranch, stockRows } = storeToRefs(dashboard)
</script>

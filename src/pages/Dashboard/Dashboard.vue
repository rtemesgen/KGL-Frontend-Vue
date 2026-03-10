<template>
  <AppPageShell main-class="overflow-hidden w-full px-2 py-1 flex flex-col gap-0.5">
    <DashboardWelcome />
    <DashboardSummarySection />
    <DashboardAppsSection />
    <DashboardStockAlertsSection />
  </AppPageShell>
</template>

<script setup>
import { watch } from 'vue'
import AppPageShell from '@/components/Layout/AppPageShell.vue'
import DashboardAppsSection from '@/components/Dashboard/DashboardAppsSection.vue'
import DashboardStockAlertsSection from '@/components/Dashboard/DashboardStockAlertsSection.vue'
import DashboardSummarySection from '@/components/Dashboard/DashboardSummarySection.vue'
import DashboardWelcome from '@/components/Dashboard/DashboardWelcome.vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useInventoryStore } from '@/stores/inventory'
import { useSalesStore } from '@/stores/sales'

const dashboard = useDashboardStore()
const inventory = useInventoryStore()
const salesStore = useSalesStore()

watch(dashboard.activeBranch, async (branch) => {
  if (!branch) return
  await Promise.all([
    inventory.loadBranchStock(branch, true),
    salesStore.initialize(branch, true),
  ])
}, { immediate: true })
</script>
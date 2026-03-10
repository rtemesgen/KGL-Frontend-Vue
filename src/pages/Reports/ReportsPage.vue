<template>
  <AppPageShell main-class="overflow-x-hidden overflow-y-auto p-1.5 md:p-2 flex flex-col gap-1">
    <ReportsHeader class="flex-none" />

    <section class="min-h-0 flex-1 grid grid-cols-1 gap-1 xl:grid-cols-12">
      <div class="min-w-0 xl:col-span-3">
        <ReportsSummaryColumn />
      </div>

      <div class="min-w-0 xl:col-span-9 flex min-h-0 flex-col gap-1">
        <div class="grid min-w-0 grid-cols-1 gap-1 xl:grid-cols-2">
          <SalesReportCard class="min-w-0" />
          <CreditReportCard class="min-w-0" />
        </div>

        <div class="grid min-w-0 grid-cols-1 gap-1 xl:grid-cols-2">
          <ExpensesReportCard class="min-w-0" />
          <OtherIncomeReportCard class="min-w-0" />
        </div>
      </div>
    </section>
  </AppPageShell>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { toast } from 'vue3-toastify'
import AppPageShell from '@/components/Layout/AppPageShell.vue'
import CreditReportCard from '@/components/Reports/CreditReportCard.vue'
import ExpensesReportCard from '@/components/Reports/ExpensesReportCard.vue'
import OtherIncomeReportCard from '@/components/Reports/OtherIncomeReportCard.vue'
import ReportsHeader from '@/components/Reports/ReportsHeader.vue'
import ReportsSummaryColumn from '@/components/Reports/ReportsSummaryColumn.vue'
import SalesReportCard from '@/components/Reports/SalesReportCard.vue'
import { useInventoryStore } from '@/stores/inventory'
import { useReportsStore } from '@/stores/reports'
import { useUsersStore } from '@/stores/users'

const inventory = useInventoryStore()
const users = useUsersStore()
const reports = useReportsStore()
const activeBranch = computed(() => users.canSwitchBranch ? inventory.activeBranch : (users.assignedBranch || inventory.activeBranch))

const loadReports = async () => {
  const result = await reports.initialize()
  if (!result) {
    toast.error(reports.backendError || 'Backend unavailable. Unable to load report overview.')
  }
}

onMounted(async () => {
  await loadReports()
})

watch(activeBranch, async (branch, previousBranch) => {
  if (!branch || branch === previousBranch) return
  await loadReports()
})
</script>
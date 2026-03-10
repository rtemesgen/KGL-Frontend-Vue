<template>
  <ReportCardTable
    v-if="visibleCategories.expense"
    title="Expenses Report"
    :columns="reports.expenseColumns"
    :rows="expenseRows"
    :max-rows="3"
    :expanded="reports.expanded.expense"
    @export="reports.exportExpensePdf"
  >
    <template #cell-date="{ row }">{{ formatDateShort(row.date) }}</template>
    <template #cell-reason="{ row }"><span class="block truncate whitespace-nowrap" :title="row.reason">{{ row.reason }}</span></template>
    <template #cell-amount="{ row }">{{ formatAmount(row.amount) }}</template>
    <template #cell-paidTo="{ row }"><span class="block truncate whitespace-nowrap" :title="row.paidTo">{{ row.paidTo }}</span></template>
    <template #footer-left>
      <button class="report-toggle-button" @click="reports.toggleExpanded('expense')">{{ reports.expanded.expense ? 'View less' : 'View more' }}</button>
    </template>
    <template #footer-center>
      <span class="report-footer-label">Total Expense</span>
    </template>
    <template #footer-right>
      <span class="report-footer-value report-footer-value--danger">{{ formatAmount(expenseTotal) }}</span>
    </template>
  </ReportCardTable>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { formatAmount, formatDateShort } from '@/utils/formatters'
import ReportCardTable from '@/components/Reports/ReportCardTable.vue'
import { useReportsStore } from '@/stores/reports'

const reports = useReportsStore()
const { visibleCategories, expenseRows, expenseTotal } = storeToRefs(reports)
</script>

<style scoped>
.report-toggle-button {
  min-width: 96px;
  border: 1px solid #8ebda7;
  background: #dff0e6;
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 700;
  color: #1f5138;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(16, 24, 40, 0.12);
}

.report-footer-label {
  display: block;
  white-space: nowrap;
  font-size: 15px;
  font-weight: 700;
  line-height: 1;
  color: #425047;
}

.report-footer-value {
  display: block;
  white-space: nowrap;
  font-size: 17px;
  font-weight: 800;
  line-height: 1;
  min-width: 136px;
  text-align: right;
  color: #274536;
}

.report-footer-value--danger {
  color: #dc2626;
}
</style>

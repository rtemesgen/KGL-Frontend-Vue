<template>
  <ReportCardTable
    v-if="visibleCategories.otherIncome"
    title="Other Income Report"
    :columns="reports.incomeColumns"
    :rows="otherIncomeRows"
    :max-rows="3"
    :expanded="reports.expanded.otherIncome"
    @export="reports.exportOtherIncomePdf"
  >
    <template #cell-date="{ row }">{{ formatDateShort(row.date) }}</template>
    <template #cell-source="{ row }"><span class="block truncate whitespace-nowrap" :title="row.source">{{ row.source }}</span></template>
    <template #cell-details="{ row }"><span class="block truncate whitespace-nowrap" :title="row.details">{{ row.details }}</span></template>
    <template #cell-amount="{ row }">{{ formatAmount(row.amount) }}</template>
    <template #footer-left>
      <button class="report-toggle-button" @click="reports.toggleExpanded('otherIncome')">{{ reports.expanded.otherIncome ? 'View less' : 'View more' }}</button>
    </template>
    <template #footer-center>
      <span class="report-footer-label">Total Income</span>
    </template>
    <template #footer-right>
      <span class="report-footer-value">{{ formatAmount(otherIncomeTotal) }}</span>
    </template>
  </ReportCardTable>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { formatAmount, formatDateShort } from '@/utils/formatters'
import ReportCardTable from '@/components/Reports/ReportCardTable.vue'
import { useReportsStore } from '@/stores/reports'

const reports = useReportsStore()
const { visibleCategories, otherIncomeRows, otherIncomeTotal } = storeToRefs(reports)
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
</style>
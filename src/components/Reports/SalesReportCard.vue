<template>
  <ReportCardTable
    v-if="visibleCategories.sales"
    title="Sales Report"
    :columns="reports.salesColumns"
    :rows="salesRows"
    :max-rows="3"
    :expanded="reports.expanded.sales"
    @export="reports.exportSalesPdf"
  >
    <template #cell-date="{ row }">{{ formatDateShort(row.date) }}</template>
    <template #cell-item="{ row }">{{ row.item }} <span class="text-[9px] text-[#64748b]">({{ row.sku }})</span></template>
    <template #cell-price="{ row }">{{ formatAmount(row.amount) }}</template>
    <template #footer-left>
      <button class="report-toggle-button" @click="reports.toggleExpanded('sales')">{{ reports.expanded.sales ? 'View less' : 'View more' }}</button>
    </template>
    <template #footer-center>
      <span class="report-footer-label">Total</span>
    </template>
    <template #footer-right>
      <span class="report-footer-value">{{ formatAmount(salesTotal) }}</span>
    </template>
  </ReportCardTable>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { formatAmount, formatDateShort } from '@/utils/formatters'
import ReportCardTable from '@/components/Reports/ReportCardTable.vue'
import { useReportsStore } from '@/stores/reports'

const reports = useReportsStore()
const { visibleCategories, salesRows, salesTotal } = storeToRefs(reports)
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
  transition: background-color 140ms ease, border-color 140ms ease;
}

.report-toggle-button:hover {
  border-color: #7aa58f;
  background: #d2e8dc;
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

<template>
  <ReportCardTable
    v-if="visibleCategories.credit"
    class="credit-report-card"
    title="Credit Report"
    :columns="reports.creditColumns"
    :rows="creditRows"
    :max-rows="3"
    :expanded="reports.expanded.credit"
    :compact="true"
    @export="reports.exportCreditPdf"
  >
    <template #cell-date="{ row }">{{ formatDateShort(row.date) }}</template>
    <template #cell-name="{ row }">
      <span class="block truncate whitespace-nowrap" :title="row.name">{{ row.name }}</span>
    </template>
    <template #cell-originalDue="{ row }">{{ formatAmount(row.originalDue) }}</template>
    <template #cell-amountPaid="{ row }">{{ formatAmount(row.amountPaid) }}</template>
    <template #cell-outstandingAmount="{ row }">{{ formatAmount(row.outstandingAmount) }}</template>
    <template #cell-status="{ row }">
      <span :class="row.outstandingAmount <= 0 ? 'credit-status credit-status--cleared' : 'credit-status credit-status--pending'">
        {{ row.outstandingAmount <= 0 ? 'Cleared' : 'Pending' }}
      </span>
    </template>
    <template #footer-left>
      <button class="report-toggle-button" @click="reports.toggleExpanded('credit')">{{ reports.expanded.credit ? 'View less' : 'View more' }}</button>
    </template>
    <template #footer-center>
      <div class="credit-footer-summary" :style="{ gridTemplateColumns: reports.creditFooterTemplate, width: '100%' }">
        <span class="credit-footer-spacer"></span>
        <span class="credit-footer-spacer"></span>
        <div class="credit-footer-stat credit-footer-stat--original">
          <span class="credit-footer-stat-label">Original</span>
          <span class="credit-footer-stat-value">{{ formatAmount(creditOriginalTotal) }}</span>
        </div>
        <div class="credit-footer-stat credit-footer-stat--received">
          <span class="credit-footer-stat-label">Received</span>
          <span class="credit-footer-stat-value">{{ formatAmount(creditPaidTotal) }}</span>
        </div>
        <div class="credit-footer-stat credit-footer-stat--outstanding">
          <span class="credit-footer-stat-label">Outstanding</span>
          <span class="credit-footer-stat-value">{{ formatAmount(creditOutstandingTotal) }}</span>
        </div>
        <span class="credit-footer-spacer"></span>
      </div>
    </template>
  </ReportCardTable>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { formatAmount, formatDateShort } from '@/utils/formatters'
import ReportCardTable from '@/components/Reports/ReportCardTable.vue'
import { useReportsStore } from '@/stores/reports'

const reports = useReportsStore()
const { visibleCategories, creditRows, creditOriginalTotal, creditPaidTotal, creditOutstandingTotal } = storeToRefs(reports)
</script>

<style scoped>
.report-toggle-button {
  min-width: 96px;
  border: 1px solid #8ebda7;
  background: linear-gradient(180deg, #e7f5ee 0%, #d7ede2 100%);
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 700;
  color: #1f5138;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(16, 24, 40, 0.12);
}

.credit-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 9px;
  font-weight: 700;
  white-space: nowrap;
}

.credit-status--pending {
  background: #f4e7ad;
  color: #9a7b13;
  
}

.credit-status--cleared {
  background: #d6f1de;
  color: #0f8a3f;
}

.credit-footer-summary {
  display: grid;
  align-items: start;
  justify-items: center;
  width: 100%;
  min-width: 0;
  margin-left: -270px;
}

.credit-footer-spacer {
  display: block;
  min-height: 1px;
}

.credit-footer-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 3px;
  padding: 2px 0;
}

.credit-footer-stat--original {
  grid-column: 3;
  color: #425047;
}

.credit-footer-stat--received {
  grid-column: 4;
  color: #1b7c43;
}

.credit-footer-stat--outstanding {
  grid-column: 5;
  color: #c12f2f;
}

.credit-footer-stat-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.credit-footer-stat-value {
  font-size: 15px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
}

:deep(.credit-report-card) {
  border-color: #b9d8c6;
  background: linear-gradient(180deg, #f7fbf8 0%, #eef6f1 100%);
  box-shadow: 0 8px 20px rgba(30, 67, 49, 0.12);
}

:deep(.credit-report-card .report-card__head) {
  background: linear-gradient(90deg, #e4f3ea 0%, #f2ead7 100%);
}

:deep(.credit-report-card .report-card__title) {
  color: #284d3c;
}

:deep(.credit-report-card .report-card__export) {
  background: #e4f3ea;
  border-color: #a7ceb8;
}

:deep(.credit-report-card .report-card__thead) {
  background: #edf5f0;
}

:deep(.credit-report-card .report-card__tbody tr:nth-child(even)) {
  background: rgba(216, 236, 224, 0.38);
}

:deep(.credit-report-card .report-card__tbody tr:hover) {
  background: rgba(207, 231, 217, 0.6);
}

:deep(.credit-report-card .report-card__tfoot) {
  background: #edf5f0;
}

:deep(.credit-report-card .report-card__footer) {
  grid-template-columns: 112px minmax(0, 1fr);
  column-gap: 12px;
}

:deep(.credit-report-card .report-card__footer-center) {
  justify-content: flex-start;
  width: 100%;
}

:deep(.credit-report-card .report-card__footer-right) {
  display: none;
}

:deep(.credit-report-card .report-card__th--status),
:deep(.credit-report-card .report-card__td--status) {
  min-width: 92px;
  width: 92px;
}

:deep(.credit-report-card .report-card__td--status) {
  text-align: center;
}
</style>

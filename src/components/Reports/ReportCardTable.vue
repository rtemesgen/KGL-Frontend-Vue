<template>
  <article class="report-card">
    <header :class="['report-card__head', headerPad]">
      <h3 class="report-card__title">{{ title }}</h3>
      <button class="report-card__export" @click="$emit('export')">Export (PDF)</button>
    </header>

    <table class="report-card__table">
      <colgroup>
        <col v-for="c in columns" :key="`col-${c.key}`" :style="c.width ? { width: c.width } : null" />
      </colgroup>

      <thead class="report-card__thead">
        <tr>
          <th
            v-for="c in columns"
            :key="c.key"
            :class="[headCellPad, c.align === 'right' ? 'text-right' : 'text-left', c.nowrap ? 'whitespace-nowrap' : '']"
          >
            {{ c.label }}
          </th>
        </tr>
      </thead>

      <tbody class="report-card__tbody">
        <tr v-for="row in visibleRows" :key="row.id">
          <td
            v-for="c in columns"
            :key="`${row.id}-${c.key}`"
            :class="[
              cellPad,
              c.align === 'right' ? 'text-right' : 'text-left',
              c.nowrap ? 'whitespace-nowrap' : '',
              c.numeric ? 'tabular-nums' : '',
            ]"
          >
            <slot :name="`cell-${c.key}`" :row="row">{{ row[c.key] }}</slot>
          </td>
        </tr>

        <tr v-if="rows.length === 0">
          <td :colspan="columns.length" :class="[emptyCellPad, 'text-center text-[10px] text-[#64748b]']">No records in selected date range.</td>
        </tr>
      </tbody>

      <tfoot v-if="hasFooter" class="report-card__tfoot">
        <tr>
          <td :colspan="columns.length" class="report-card__footer-cell">
            <div class="report-card__footer">
              <div class="report-card__footer-left">
                <slot name="footer-left"></slot>
              </div>
              <div class="report-card__footer-center">
                <slot name="footer-center"></slot>
              </div>
              <div class="report-card__footer-right">
                <slot name="footer-right"></slot>
              </div>
            </div>
          </td>
        </tr>
      </tfoot>
    </table>
  </article>
</template>

<script setup>
import { computed, useSlots } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
  maxRows: { type: Number, default: 3 },
  expanded: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
})

defineEmits(['export'])

const slots = useSlots()

const visibleRows = computed(() => (props.expanded ? props.rows : props.rows.slice(0, props.maxRows)))
const headerPad = computed(() => (props.compact ? 'px-2 py-1.5' : 'px-2.5 py-1.5'))
const headCellPad = computed(() => (props.compact ? 'px-2 py-1' : 'px-2.5 py-1.5'))
const cellPad = computed(() => (props.compact ? 'px-2 py-1' : 'px-2.5 py-1.5'))
const emptyCellPad = computed(() => (props.compact ? 'px-2 py-1.5' : 'px-2.5 py-2'))
const hasFooter = computed(() => Boolean(slots['footer-left'] || slots['footer-center'] || slots['footer-right']))
</script>

<style scoped>
.report-card {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid #c7d7cc;
  background: #f6f7f3;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
  transition: box-shadow 160ms ease, transform 160ms ease;
}

.report-card:hover {
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.16);
  transform: translateY(-1px);
}

.report-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px solid #cfddd2;
  background: linear-gradient(90deg, #e3f1df, #f3e2ce);
}

.report-card__title {
  min-width: 0;
  font-size: 12px;
  font-weight: 700;
  color: #274536;
}

.report-card__export {
  flex-shrink: 0;
  border-radius: 8px;
  border: 1px solid #b8d1c4;
  background: #e3f1df;
  padding: 3px 9px;
  font-size: 9px;
  font-weight: 700;
  color: #274536;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.08);
  transition: background-color 140ms ease, border-color 140ms ease;
}

.report-card__export:hover {
  border-color: #90bea8;
  background: #d9ecde;
}

.report-card__table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}

.report-card__thead {
  background: #eef3ea;
  color: #5a6f8c;
  font-size: 10px;
}

.report-card__thead th {
  font-weight: 700;
  letter-spacing: 0.01em;
}

.report-card__tbody {
  color: #1f2937;
  font-size: 10px;
}

.report-card__tbody tr td {
  border-top: 1px solid #d3dfd5;
  vertical-align: middle;
}

.report-card__tbody tr:nth-child(even) {
  background: rgba(227, 241, 223, 0.24);
}

.report-card__tbody tr:hover {
  background: rgba(227, 241, 223, 0.42);
}

.report-card__tfoot {
  background: #eef3ea;
}

.report-card__tfoot td {
  border-top: 1px solid #cfddd2;
  vertical-align: middle;
}

.report-card__footer-cell {
  padding: 8px 12px;
}

.report-card__footer {
  display: grid;
  grid-template-columns: 102px minmax(0, 1fr) minmax(124px, auto);
  align-items: center;
  column-gap: 12px;
  min-height: 34px;
}

.report-card__footer-left {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-width: 0;
}

.report-card__footer-center {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.report-card__footer-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
}
</style>

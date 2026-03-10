<template>
  <div class="px-0 py-0">
    <div class="border-b border-[#d3dfd5] bg-[#f8faf7] text-[9px] font-semibold uppercase tracking-[0.16em] text-[#5c7368]" :style="gridStyle">
      <div class="border-r border-[#d3dfd5] px-2 py-2 text-center">{{ idHeader }}</div>
      <div class="border-r border-[#d3dfd5] px-3 py-2">{{ itemHeader }}</div>
      <div class="border-r border-[#d3dfd5] px-2 py-2 text-center">{{ qtyHeader }}</div>
      <div
        v-for="column in pricingColumns"
        :key="column.key"
        class="border-r border-[#d3dfd5] px-2 py-2"
        :class="column.align === 'right' ? 'text-right' : 'text-center'"
      >
        {{ column.label }}
      </div>
      <div class="px-2 py-2 text-right">{{ totalHeader }}</div>
    </div>

    <div>
      <div
        v-for="row in rows"
        :key="row.id"
        class="border-b text-[#274536] transition-colors"
        :style="gridStyle"
        :class="row.id === activeRowId ? 'border-[#c8d6cc] bg-[#eef5eb]' : 'border-[#dbe4dd] bg-white'"
      >
        <div
          class="border-r px-2 py-1 text-center text-[10px] font-medium"
          :class="row.id === activeRowId ? 'border-[#c8d6cc] bg-[#e3efe0] text-[#30543e]' : 'border-[#dbe4dd] text-[#6b8076]'"
        >
          {{ formatRowIdentifier(row) }}
        </div>

        <div class="relative border-r px-2 py-0.5" :class="row.id === activeRowId ? 'border-[#c8d6cc]' : 'border-[#dbe4dd]'">
          <input
            :ref="(element) => setProductInputRef(row.id, element)"
            :value="row.query"
            type="text"
            class="h-6 w-full border-0 bg-transparent px-1 text-[11px] text-[#22392e] outline-none placeholder:text-[#92a59b]"
            :placeholder="queryPlaceholder"
            @focus="handleFocus(row.id)"
            @blur="closeSuggestionsLater(row.id)"
            @input="handleQueryInput(row.id, $event.target.value)"
            @keydown.down.prevent="moveSelection(row.id, 1)"
            @keydown.up.prevent="moveSelection(row.id, -1)"
            @keydown.enter.prevent="selectHighlightedProduct(row.id)"
            @keydown.esc.prevent="closeSuggestions(row.id)"
          />

          <div
            v-if="shouldShowSuggestions(row.id)"
            class="absolute left-0 right-0 top-[calc(100%-1px)] z-20 mx-1 overflow-hidden rounded-[10px] border border-[#d3dfd5] bg-white shadow-[0_10px_20px_rgba(40,70,54,0.12)]"
          >
            <button
              v-for="(product, index) in filteredProducts(row.query)"
              :key="`${row.id}-${product.sku}`"
              type="button"
              class="flex w-full items-start justify-between gap-2 border-b border-[#eef2ee] px-2.5 py-2 text-left last:border-b-0"
              :class="index === highlightedProductIndex ? 'bg-[#eef5eb]' : 'hover:bg-[#f4f8f4]'"
              @mousedown.prevent="commitProduct(row.id, product)"
            >
              <span>
                <span class="block text-[11px] font-medium text-[#22392e]">{{ product.name }}</span>
                <span class="block text-[9px] text-[#6f8478]">{{ product.sku }}<span v-if="product.maxQty !== undefined"> | Stock {{ formatAmount(product.maxQty) }}</span></span>
              </span>
              <span class="text-[10px] font-semibold text-[#2f6b4d]">{{ money(product.sellingPrice ?? product.unitPrice ?? product.costPrice ?? 0) }}</span>
            </button>
          </div>
        </div>

        <div class="border-r px-1 py-0.5" :class="row.id === activeRowId ? 'border-[#c8d6cc]' : 'border-[#dbe4dd]'">
          <input
            :value="displayValue(row.qty)"
            type="text"
            inputmode="numeric"
            class="h-6 w-full border-0 bg-transparent px-1 text-center text-[11px] text-[#22392e] outline-none"
            placeholder="0"
            @focus="emit('activate-row', row.id)"
            @input="emit('update-cell', { rowId: row.id, key: 'qty', value: $event.target.value })"
          />
        </div>

        <div
          v-for="column in pricingColumns"
          :key="`${row.id}-${column.key}`"
          class="border-r px-2 py-0.5"
          :class="row.id === activeRowId ? 'border-[#c8d6cc]' : 'border-[#dbe4dd]'"
        >
          <input
            v-if="column.editable"
            :value="displayValue(row[column.key])"
            type="text"
            inputmode="decimal"
            class="h-6 w-full border-0 bg-transparent px-1 text-[10px] text-[#22392e] outline-none"
            :class="column.align === 'right' ? 'text-right' : 'text-center'"
            :placeholder="column.placeholder || '0'"
            @focus="emit('activate-row', row.id)"
            @input="emit('update-cell', { rowId: row.id, key: column.key, value: $event.target.value })"
          />
          <div
            v-else
            class="px-0 py-1 text-[10px] text-[#5c7368]"
            :class="column.align === 'right' ? 'text-right' : 'text-center'"
          >
            {{ row[column.key] ? money(row[column.key], false) : '' }}
          </div>
        </div>

        <div class="px-2 py-1 text-right text-[10px] font-semibold" :class="rowTotal(row) ? 'text-[#2f6b4d]' : 'text-[#93a59b]'">
          {{ rowTotal(row) ? money(rowTotal(row), false) : '' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { formatAmount } from '@/utils/formatters'

const props = defineProps({
  rows: { type: Array, required: true },
  products: { type: Array, default: () => [] },
  activeRowId: { type: [Number, String], default: null },
  pricingColumns: { type: Array, default: () => [] },
  totalValueKey: { type: String, required: true },
  queryPlaceholder: { type: String, default: 'Search by item name or SKU' },
  idHeader: { type: String, default: 'ID' },
  itemHeader: { type: String, default: 'Item Name' },
  qtyHeader: { type: String, default: 'Qty' },
  totalHeader: { type: String, default: 'Total' },
  templateColumns: { type: String, required: true },
  moneyFormatter: { type: Function, default: (value) => String(value ?? '') },
  rowIdentifier: { type: Function, default: (row) => row.sku || row.id },
})

const emit = defineEmits(['activate-row', 'update-query', 'commit-product', 'update-cell', 'clear-row'])

const openSuggestionRowId = ref(null)
const highlightedProductIndex = ref(0)
const productInputRefs = ref({})

const gridStyle = computed(() => ({ display: 'grid', gridTemplateColumns: props.templateColumns }))

const money = (value, prefix = true) => props.moneyFormatter(value, prefix)
const displayValue = (value) => String(value ?? '')
const formatRowIdentifier = (row) => props.rowIdentifier(row)
const rowTotal = (row) => Number(row.qty || 0) * Number(row[props.totalValueKey] || 0)

const setProductInputRef = (rowId, element) => {
  if (element) productInputRefs.value[rowId] = element
}

const filteredProducts = (query) => {
  const needle = String(query || '').trim().toLowerCase()
  const source = props.products.filter((product) => product.name || product.sku)
  const matches = !needle
    ? []
    : source.filter((product) => `${product.name} ${product.sku}`.toLowerCase().includes(needle))
  return matches.slice(0, 8)
}

const handleFocus = (rowId) => {
  emit('activate-row', rowId)
}

const handleQueryInput = (rowId, value) => {
  emit('update-query', { rowId, value })
  const hasValue = String(value || '').trim().length > 0
  openSuggestionRowId.value = hasValue ? rowId : null
  highlightedProductIndex.value = 0
}

const shouldShowSuggestions = (rowId) => {
  const row = props.rows.find((entry) => entry.id === rowId)
  return openSuggestionRowId.value === rowId && String(row?.query || '').trim() && filteredProducts(row?.query).length > 0
}

const closeSuggestions = (rowId) => {
  if (openSuggestionRowId.value === rowId) {
    openSuggestionRowId.value = null
    highlightedProductIndex.value = 0
  }
}

const closeSuggestionsLater = (rowId) => {
  window.setTimeout(() => closeSuggestions(rowId), 120)
}

const moveSelection = (rowId, direction) => {
  const row = props.rows.find((entry) => entry.id === rowId)
  const options = filteredProducts(row?.query)
  if (!options.length) return
  openSuggestionRowId.value = rowId
  emit('activate-row', rowId)
  const total = options.length
  highlightedProductIndex.value = (highlightedProductIndex.value + direction + total) % total
}

const commitProduct = async (rowId, product) => {
  emit('commit-product', { rowId, product })
  closeSuggestions(rowId)
  const currentIndex = props.rows.findIndex((row) => row.id === rowId)
  const nextRow = props.rows[currentIndex + 1]
  if (!nextRow) return
  await nextTick()
  const input = productInputRefs.value[nextRow.id]
  if (input?.focus) input.focus()
}

const selectHighlightedProduct = (rowId) => {
  const row = props.rows.find((entry) => entry.id === rowId)
  const options = filteredProducts(row?.query)
  const product = options[highlightedProductIndex.value] || options[0]
  if (product) commitProduct(rowId, product)
}
</script>

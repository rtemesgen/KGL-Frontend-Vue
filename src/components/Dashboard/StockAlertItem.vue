<template>
  <div class="flex items-center justify-between rounded-none border-0 bg-transparent px-0 py-1.5">
    <div>
      <div class="font-semibold leading-tight text-[#20303b] text-[12px]">{{ name }}</div>
      <div class="text-[#6a7b73] text-[9px]">Selling: {{ safeSellingPrice }} / kg</div>
      <div class="text-[#6a7b73] text-[9px]">Opening: {{ openingDisplay }} kg | Sold: {{ soldDisplay }} kg</div>
    </div>
    <div class="flex items-center gap-1.5">
      <div class="text-right">
        <div class="font-semibold leading-tight text-[#20303b] text-[12px]">{{ remainingDisplay }} kg</div>
        <div class="text-[#91a0ac] text-[9px]">Remaining</div>
      </div>
      <span class="rounded-full font-semibold px-1.5 py-0.5 text-[8px]" :class="badgeClass">{{ status }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: String,
  sku: String,
  status: String,
  cost: String,
  sellingPrice: String,
  openingQty: [String, Number],
  soldQty: [String, Number],
  remainingQty: [String, Number],
  compact: {
    type: Boolean,
    default: false,
  },
})

const toSafe = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const openingDisplay = computed(() => toSafe(props.openingQty).toLocaleString())
const soldDisplay = computed(() => toSafe(props.soldQty).toLocaleString())
const remainingDisplay = computed(() => toSafe(props.remainingQty).toLocaleString())

const safeCost = computed(() => props.cost || 'UGX 0')
const safeSellingPrice = computed(() => props.sellingPrice || 'UGX 0')

const normalizedStatus = computed(() => {
  if (props.status === 'Out of Stock') return 'out'
  if (props.status === 'Low Stock') return 'low'
  return 'in'
})

const badgeClass = computed(() => {
  if (normalizedStatus.value === 'out') return 'bg-[#fbe6ea] text-[#9f1239]'
  if (normalizedStatus.value === 'low') return 'bg-[#f9f0dd] text-[#92400e]'
  return 'bg-[#e7f2ea] text-[#166534]'
})
</script>

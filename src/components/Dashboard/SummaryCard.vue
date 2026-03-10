<template>
  <div
    class="rounded-lg border border-[#d0dbd2] bg-[linear-gradient(180deg,rgba(253,252,249,0.98)_0%,rgba(241,246,240,0.98)_100%)] shadow-[0_10px_20px_rgba(41,64,52,0.07)]"
    :class="compact ? 'p-2.5' : 'p-3'"
  >
    <div class="flex items-center justify-between" :class="compact ? 'mb-1' : 'mb-2'">
      <span class="font-semibold uppercase tracking-[0.06em] text-[#70818b]" :class="compact ? 'text-[9px]' : 'text-[10px]'">{{ title }}</span>
      <span class="flex items-center justify-center rounded-md" :class="[iconBg, compact ? 'h-5 w-5' : 'h-6 w-6']">
        <component :is="iconComponent" class="summary-icon" :class="[iconColor, compact ? 'summary-icon--compact' : '']" />
      </span>
    </div>
    <div class="font-semibold leading-none text-[#22313d]" :class="compact ? 'text-[15px]' : 'text-[18px]'">{{ value }}</div>
    <div class="flex items-center font-semibold" :class="[trendColor, compact ? 'mt-1 gap-0.5 text-[9px]' : 'mt-2 gap-0.5 text-[10px]']">
      <svg v-if="trendType === 'up'" class="h-2.5 w-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12l5-5 4 4 5-5" /></svg>
      <svg v-else-if="trendType === 'critical'" class="h-2.5 w-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 4h.01M10.29 3.86l-7.55 13.1A1 1 0 003.61 18h16.78a1 1 0 00.87-1.5l-7.55-13.1a1 1 0 00-1.74 0z" /></svg>
      <span v-else-if="trendType === 'info'" :class="compact ? 'text-[9px]' : 'text-[10px]'">&#9786;</span>
      <span class="truncate">{{ trend }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { BanknotesIcon, BuildingOffice2Icon, CalculatorIcon, MagnifyingGlassPlusIcon } from '@heroicons/vue/24/outline'

const props = defineProps({ title: String, value: String, icon: String, trend: String, trendType: String, compact: { type: Boolean, default: false } })
const iconMap = { banknotes: BanknotesIcon, cube: BuildingOffice2Icon, search: MagnifyingGlassPlusIcon, calculator: CalculatorIcon }
const iconComponent = computed(() => iconMap[props.icon] || BanknotesIcon)
const iconColor = computed(() => (props.icon === 'banknotes' || props.icon === 'calculator') ? 'text-[#198142]' : props.icon === 'cube' ? 'text-[#c87508]' : props.icon === 'search' ? 'text-[#1f6be8]' : 'text-[#6f7f88]')
const iconBg = computed(() => (props.icon === 'banknotes' || props.icon === 'calculator') ? 'bg-[#d9f0e0]' : props.icon === 'cube' ? 'bg-[#f7e7d3]' : props.icon === 'search' ? 'bg-[#dce8f8]' : 'bg-[#f3f4f6]')
const trendColor = computed(() => props.trendType === 'up' ? 'text-[#198142]' : props.trendType === 'critical' ? 'text-[#c87508]' : props.trendType === 'info' ? 'text-[#1f6be8]' : 'text-[#6b7280]')
</script>

<style scoped>
.summary-icon { width: 10px; height: 10px; }
.summary-icon--compact { width: 9px; height: 9px; }
</style>

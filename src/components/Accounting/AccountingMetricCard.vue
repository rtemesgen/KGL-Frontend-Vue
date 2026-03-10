<template>
  <article class="min-h-[68px] rounded-[10px] border border-[#d8decf] bg-white px-1.5 py-1 shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
    <div class="flex items-start justify-between gap-1.25">
      <div class="flex items-center gap-1.25">
        <span class="flex h-6.5 w-6.5 items-center justify-center rounded-[8px]" :class="iconBg">
          <component :is="iconComponent" class="h-3 w-3" :class="iconColor" />
        </span>
        <div>
          <div class="text-[8px] font-semibold uppercase tracking-[0.08em] text-[#6a7f67]">{{ label }}</div>
          <div class="mt-0.5 text-[16px] font-semibold tracking-[-0.04em] text-[#0f172a]">{{ value }}</div>
        </div>
      </div>
      <span v-if="trend" class="rounded-full px-1.5 py-0.5 text-[7px] font-semibold" :class="trendClass">{{ trend }}</span>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { BanknotesIcon, CalendarDaysIcon, CalendarIcon, PresentationChartLineIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
  icon: { type: String, default: 'calendar' },
  trend: { type: String, default: '' },
})

const iconMap = {
  calendar: CalendarDaysIcon,
  week: CalendarIcon,
  month: PresentationChartLineIcon,
  money: BanknotesIcon,
}

const iconComponent = computed(() => iconMap[props.icon] || CalendarDaysIcon)
const iconBg = computed(() => props.icon === 'calendar'
  ? 'bg-[#d9f0e0]'
  : props.icon === 'week'
    ? 'bg-[#dce8f8]'
    : props.icon === 'month'
      ? 'bg-[#efe1f8]'
      : 'bg-[#e9efe4]')
const iconColor = computed(() => props.icon === 'calendar'
  ? 'text-[#198142]'
  : props.icon === 'week'
    ? 'text-[#1f6be8]'
    : props.icon === 'month'
      ? 'text-[#8b3fe2]'
      : 'text-[#355846]')
const trendClass = computed(() => props.icon === 'month' ? 'bg-[#f3e9fb] text-[#8b3fe2]' : 'bg-[#edf4ee] text-[#198142]')
</script>





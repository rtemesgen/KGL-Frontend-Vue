<template>
  <div
    class="group relative flex flex-col items-center justify-center rounded-xl border border-[#d2ddd4] bg-[linear-gradient(180deg,rgba(252,252,249,0.98)_0%,rgba(239,245,238,0.98)_100%)] text-center shadow-[0_8px_18px_rgba(40,70,54,0.07)] transition-colors"
    :class="[
      compact ? 'min-h-[88px] px-2.5 py-2' : 'min-h-[114px] px-3 py-2.5',
      disabled ? 'opacity-45 grayscale pointer-events-none select-none' : ''
    ]"
    :title="disabled ? 'Access restricted for this role' : label"
  >
    <div class="flex items-center justify-center rounded-xl bg-[linear-gradient(180deg,#e4edf8,#e4efe1)]" :class="compact ? 'mb-1.5 h-6.5 w-6.5' : 'mb-2 h-8 w-8'">
      <component :is="iconComponent" class="icon-lock text-[#667783]" :class="compact ? 'icon-lock--compact' : ''" />
    </div>
    <div class="font-semibold leading-tight text-[#22313d]" :class="compact ? 'text-[12px]' : 'text-[14px]'">{{ label }}</div>
    <div class="font-medium uppercase tracking-[0.03em] text-[#72857b]" :class="compact ? 'mt-0.5 text-[8px]' : 'mt-1 text-[9px]'">{{ desc }}</div>
    <span v-if="disabled" class="rounded-full bg-[#d1d5db] font-semibold text-[#4b5563]" :class="compact ? 'mt-1 px-1.5 py-0.5 text-[6px]' : 'mt-1.5 px-2 py-0.5 text-[7px]'">Locked</span>
  </div>
</template>

<script setup>
import { ArrowTrendingUpIcon, BuildingLibraryIcon, ChartBarIcon, ShoppingCartIcon, UsersIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  label: String,
  desc: String,
  icon: String,
  compact: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const iconMap = {
  'arrow-trending-up': ArrowTrendingUpIcon,
  'shopping-cart': ShoppingCartIcon,
  'building-library': BuildingLibraryIcon,
  'chart-bar': ChartBarIcon,
  users: UsersIcon,
}

const iconComponent = iconMap[props.icon] || ArrowTrendingUpIcon
</script>

<style scoped>
.icon-lock { width: 12px; height: 12px; }
.icon-lock--compact { width: 10px; height: 10px; }
</style>

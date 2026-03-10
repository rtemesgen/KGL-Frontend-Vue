<template>
  <section class="rounded-[12px] border border-[#c7d7cc] bg-gradient-to-b from-[#f9f7f1] to-[#e8f1e6] px-1.25 py-1 shadow-[0_6px_16px_rgba(48,84,62,0.06)]">
    <div class="flex flex-col gap-[3px]">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <RouterLink to="/" class="inline-flex h-8.5 items-center gap-1 rounded-[9px] border border-[#9fb8a8] bg-[#30543e] px-1.5 text-white shadow-[0_8px_18px_rgba(48,84,62,0.18)] transition hover:bg-[#274536]" aria-label="Go to dashboard">
            <HomeIcon class="h-3 w-3" />
            <span class="text-[10px] font-semibold leading-none">Dashboard</span>
          </RouterLink>
          <div>
            <h1 class="m-0 text-[18px] font-semibold tracking-[-0.04em] text-[#111827]">Accounting</h1>
            <p class="m-0 text-[10px] text-[#5f7569]">{{ activeBranch }} branch | {{ userName }}</p>
          </div>
        </div>

        <div class="flex min-w-0 flex-wrap items-center justify-end gap-1">
          <input
            :value="filters.fromDate"
            type="date"
            class="h-8 min-w-[118px] rounded-[9px] border border-[#c7d7cc] bg-[#f8faf7] px-2 text-[10px] text-[#24352f] outline-none"
            @input="$emit('update:from-date', $event.target.value)"
          />
          <input
            :value="filters.toDate"
            type="date"
            class="h-8 min-w-[118px] rounded-[9px] border border-[#c7d7cc] bg-[#f8faf7] px-2 text-[10px] text-[#24352f] outline-none"
            @input="$emit('update:to-date', $event.target.value)"
          />
          <input
            :value="filters.search"
            :placeholder="activeTab === 'credit' ? 'Filter customer...' : 'Search...'"
            type="text"
            class="h-8 min-w-[164px] rounded-[9px] border border-[#c7d7cc] bg-[#f8faf7] px-2 text-[10px] text-[#24352f] outline-none"
            @input="$emit('update:search', $event.target.value)"
          />
          <select
            v-if="activeTab === 'credit'"
            :value="filters.status"
            class="h-8 min-w-[102px] rounded-[9px] border border-[#c7d7cc] bg-[#f8faf7] px-2 text-[10px] text-[#24352f] outline-none"
            @change="$emit('update:status', $event.target.value)"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
          </select>
          <button class="h-8 rounded-[9px] border border-[#c7d7cc] bg-[#f8faf7] px-2.5 text-[10px] font-semibold text-[#355846]" @click="$emit('refresh')">Refresh</button>
        </div>
      </div>

      <div class="inline-flex w-fit rounded-[10px] border border-[#c7d7cc] bg-[#f8faf7] p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
        <button v-for="tab in tabs" :key="tab.key" class="rounded-[8px] px-2 py-0.5 text-[10px] font-semibold transition" :class="activeTab === tab.key ? 'bg-[#30543e] text-white shadow-[0_4px_10px_rgba(48,84,62,0.12)]' : 'text-[#4f6259] hover:bg-white'" @click="$emit('change-tab', tab.key)">
          {{ tab.label }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { HomeIcon } from '@heroicons/vue/24/outline'
import { RouterLink } from 'vue-router'

defineProps({
  activeBranch: { type: String, required: true },
  userName: { type: String, required: true },
  activeTab: { type: String, required: true },
  filters: { type: Object, required: true },
})

defineEmits(['change-tab', 'update:from-date', 'update:to-date', 'update:search', 'update:status', 'refresh'])

const tabs = [
  { key: 'expenses', label: 'Expenses' },
  { key: 'income', label: 'Other Income' },
  { key: 'credit', label: 'Credit Collection' },
]
</script>





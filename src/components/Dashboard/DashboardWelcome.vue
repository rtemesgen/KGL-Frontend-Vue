<template>
  <section class="text-center flex-none">
    <h1 class="font-semibold leading-tight tracking-[-0.01em] text-[12px] md:text-[13px] text-[#1a2b33]">
      Welcome {{ userName }}, <span class="font-medium text-[#6d7d73]">how was your day?</span>
    </h1>
    <p class="mt-0 text-[9px] text-[#64756d]">Current branch: {{ activeBranch }}</p>
  </section>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '@/stores/dashboard'

const dashboard = useDashboardStore()
const { userName, activeBranch } = storeToRefs(dashboard)
</script>

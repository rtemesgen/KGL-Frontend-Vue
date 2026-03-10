<template>
  <div class="flex h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top_right,_#f6ead8_0%,_#e6f1e8_38%,_#e2ebf4_72%,_#edf2f7_100%)] text-[#14212b]">
    <GlobalHeader class="flex-none" />
    <main :class="[mainClass, 'mx-auto w-full min-w-0 max-w-[1480px] flex-1 min-h-0']">
      <slot />
    </main>
    <GlobalFooter class="flex-none" />
  </div>
</template>

<script setup>
import GlobalFooter from '@/components/Layout/GlobalFooter.vue'
import GlobalHeader from '@/components/Layout/GlobalHeader.vue'

defineProps({
  mainClass: {
    type: String,
    default: 'overflow-x-hidden overflow-y-auto p-3',
  },
})
</script>

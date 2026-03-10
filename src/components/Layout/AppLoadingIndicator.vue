<template>
  <transition name="app-loading-fade">
    <div v-if="ui.isLoading" class="pointer-events-auto fixed inset-0 z-[200] cursor-progress" aria-live="polite" aria-busy="true">
      <div class="absolute inset-x-0 top-0 h-1 overflow-hidden bg-[#d9e7dd]/80">
        <div class="app-loading-bar h-full w-[35%]"></div>
      </div>

      <div class="absolute right-4 top-4 rounded-full border border-[#b8d1c4] bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-[#274536] shadow-[0_10px_24px_rgba(15,23,42,0.12)]">
        Loading...
      </div>

      <div class="absolute inset-0 bg-white/12 backdrop-blur-[1px]"></div>
    </div>
  </transition>
</template>

<script setup>
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
</script>

<style scoped>
.app-loading-bar {
  background: linear-gradient(90deg, #30543e 0%, #2a6e51 60%, #a7ceb8 100%);
  animation: app-loading-slide 1.1s ease-in-out infinite;
}

.app-loading-fade-enter-active,
.app-loading-fade-leave-active {
  transition: opacity 160ms ease;
}

.app-loading-fade-enter-from,
.app-loading-fade-leave-to {
  opacity: 0;
}

@keyframes app-loading-slide {
  0% {
    transform: translateX(-120%);
  }

  100% {
    transform: translateX(360%);
  }
}
</style>

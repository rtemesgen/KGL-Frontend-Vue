<template>
  <section class="flex-none">
    <h2 class="mb-0.5 text-[8px] font-semibold tracking-[0.14em] text-[#6b7b86]">APPLICATIONS HUB</h2>
    <div class="grid grid-cols-3 gap-1.5 md:grid-cols-5">
      <template v-for="app in dashboard.apps" :key="app.key">
        <RouterLink v-if="app.route && dashboard.isAppAllowed(app.key)" :to="app.route" class="block">
          <AppHubCard :label="app.label" :desc="app.desc" :icon="app.icon" :disabled="false" :compact="true" />
        </RouterLink>
        <div v-else class="block">
          <AppHubCard :label="app.label" :desc="app.desc" :icon="app.icon" :disabled="!dashboard.isAppAllowed(app.key)" :compact="true" />
        </div>
      </template>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import AppHubCard from '@/components/Dashboard/AppHubCard.vue'
import { useDashboardStore } from '@/stores/dashboard'

const dashboard = useDashboardStore()
</script>

<template>
  <AppPageShell main-class="overflow-auto xl:overflow-hidden p-1.5 md:p-2 flex flex-col gap-1.5">
    <UsersHeroCard class="flex-none" />
    <UsersMetrics class="flex-none" />
    <PendingRegistrationsPanel class="flex-none" />

    <section class="min-h-0 flex-1 grid grid-cols-1 gap-1.5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
      <UsersTable class="min-h-0" />
      <UsersBranchSummary class="min-h-0" />
    </section>

    <UserFormModal />
    <UsersDeleteDialog />
  </AppPageShell>
</template>

<script setup>
import AppPageShell from '@/components/Layout/AppPageShell.vue'
import PendingRegistrationsPanel from '@/components/Users/PendingRegistrationsPanel.vue'
import UserFormModal from '@/components/Users/UserFormModal.vue'
import UsersBranchSummary from '@/components/Users/UsersBranchSummary.vue'
import UsersDeleteDialog from '@/components/Users/UsersDeleteDialog.vue'
import UsersHeroCard from '@/components/Users/UsersHeroCard.vue'
import UsersMetrics from '@/components/Users/UsersMetrics.vue'
import UsersTable from '@/components/Users/UsersTable.vue'
import { useUserManagementStore } from '@/stores/userManagement'

const usersManagement = useUserManagementStore()
usersManagement.initialize()
</script>

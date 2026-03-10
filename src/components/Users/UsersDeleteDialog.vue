<template>
  <ConfirmDialog
    :open="showDeleteConfirm"
    title="Confirm Delete"
    :message="`Proceed to delete ${pendingDeleteName}?`"
    confirm-text="Proceed"
    cancel-text="Cancel"
    @confirm="usersManagement.confirmDelete()"
    @cancel="usersManagement.cancelDelete()"
  />
</template>

<script setup>
import { storeToRefs } from 'pinia'
import ConfirmDialog from '@/components/Common/ConfirmDialog.vue'
import { useUserManagementStore } from '@/stores/userManagement'

const usersManagement = useUserManagementStore()
const { showDeleteConfirm, pendingDeleteName } = storeToRefs(usersManagement)
</script>

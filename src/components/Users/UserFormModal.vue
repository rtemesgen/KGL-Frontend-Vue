<template>
  <div v-if="showModal" class="fixed inset-0 z-40 grid place-items-center bg-[rgba(15,23,42,0.34)] p-3 [backdrop-filter:blur(2px)]" @click.self="usersManagement.closeModal()">
    <section class="w-full max-w-[460px] rounded-xl border border-[#c7d7cc] bg-[#f8faf7] shadow-[0_12px_34px_rgba(15,23,42,0.24)]">
      <header class="flex items-center justify-between border-b border-[#d3dfd5] px-3 py-3">
        <h4 class="m-0 text-lg font-semibold text-[#111827]">{{ isAddMode ? 'Add User' : 'Edit User Role' }}</h4>
        <button class="border-none bg-transparent text-base text-[#64748b]" @click="usersManagement.closeModal()">x</button>
      </header>

      <div class="grid gap-2.5 p-3">
        <label class="grid gap-1.5 text-xs text-[#41544c]">Name
          <input :value="form.name" type="text" :disabled="!isAddMode" class="h-[34px] rounded-lg border border-[#c7d7cc] px-2.5 text-sm text-[#1f2937] disabled:cursor-not-allowed disabled:bg-[#eef3ef]" :class="isAddMode ? 'bg-white' : 'bg-[#eef3ef]'" @input="usersManagement.updateFormField('name', $event.target.value)" />
        </label>

        <label class="grid gap-1.5 text-xs text-[#41544c]">Email
          <input :value="form.email" type="email" :disabled="!isAddMode" class="h-[34px] rounded-lg border border-[#c7d7cc] px-2.5 text-sm text-[#1f2937] disabled:cursor-not-allowed disabled:bg-[#eef3ef]" :class="isAddMode ? 'bg-white' : 'bg-[#eef3ef]'" @input="usersManagement.updateFormField('email', $event.target.value)" />
        </label>

        <label class="grid gap-1.5 text-xs text-[#41544c]">Role
          <select :value="form.role" class="h-[34px] rounded-lg border border-[#c7d7cc] bg-white px-2.5 text-sm text-[#1f2937]" @change="usersManagement.updateFormField('role', $event.target.value)">
            <option>ADMIN</option>
            <option>DIRECTOR</option>
            <option>MANAGER</option>
            <option>SALES AGENT</option>
          </select>
        </label>

        <label class="grid gap-1.5 text-xs text-[#41544c]">Branch
          <template v-if="isAddMode">
            <select :value="form.branch" class="h-[34px] rounded-lg border border-[#c7d7cc] bg-white px-2.5 text-sm text-[#1f2937]" @change="usersManagement.updateFormField('branch', $event.target.value)">
              <option>Maganjo</option>
              <option>Matugga</option>
            </select>
          </template>
          <template v-else>
            <input :value="form.branch" type="text" disabled class="h-[34px] rounded-lg border border-[#c7d7cc] bg-[#eef3ef] px-2.5 text-sm text-[#1f2937] disabled:cursor-not-allowed" />
          </template>
        </label>

        <label v-if="isAddMode" class="grid gap-1.5 text-xs text-[#41544c]">Password
          <input :value="form.password" type="password" class="h-[34px] rounded-lg border border-[#c7d7cc] bg-white px-2.5 text-sm text-[#1f2937]" @input="usersManagement.updateFormField('password', $event.target.value)" />
        </label>

        <p class="m-0 text-[11px] text-[#5b6c65]">
          {{ isAddMode ? 'Creates a new backend user account through the register endpoint.' : 'The current backend users API supports role updates only. Name, branch, and email remain read-only here.' }}
        </p>
        <p v-if="formError" class="m-0 text-xs font-semibold text-[#b42318]">{{ formError }}</p>
      </div>

      <footer class="flex justify-end gap-2 px-3 pb-3">
        <button class="h-[34px] rounded-[10px] border border-[#c7d7cc] bg-[#f8faf7] px-3 text-sm font-semibold" @click="usersManagement.closeModal()">Cancel</button>
        <button class="h-[34px] rounded-[10px] border border-[#d66b0b] bg-[#d66b0b] px-3 text-sm font-semibold text-white" @click="usersManagement.saveUser()">{{ isAddMode ? 'Create User' : 'Update Role' }}</button>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useUserManagementStore } from '@/stores/userManagement'

const usersManagement = useUserManagementStore()
const { showModal, formError, form, isAddMode } = storeToRefs(usersManagement)
</script>

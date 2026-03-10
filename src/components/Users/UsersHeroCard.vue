<template>
  <section class="rounded-xl border border-[#c7d7cc] bg-gradient-to-b from-[#f9f7f1] to-[#e8f1e6] p-2.5">
    <div class="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex items-center gap-2">
        <RouterLink to="/" class="inline-flex h-10 items-center gap-2 rounded-[12px] border border-[#9fb8a8] bg-[#30543e] px-3 text-white shadow-[0_8px_18px_rgba(48,84,62,0.18)] transition hover:bg-[#274536]" aria-label="Go to dashboard">
          <HomeIcon class="h-4.5 w-4.5" />
          <span class="text-[12px] font-semibold leading-none">Dashboard</span>
        </RouterLink>
        <div class="grid gap-0.5">
          <h1 class="m-0 text-[22px] font-semibold text-[#111827]">User Management Console</h1>
        </div>
      </div>

      <div class="flex flex-col gap-1.5 md:flex-row md:flex-wrap md:items-center md:justify-end">
        <label class="flex h-[34px] min-w-0 items-center gap-1.5 rounded-[10px] border border-[#c7d7cc] bg-[#f8faf7] px-2.5 md:min-w-[230px]">
          <span class="text-[10px] text-[#7a8a86]">Q</span>
          <input
            :value="searchTerm"
            type="text"
            placeholder="Search users, roles, branch, email or id..."
            class="w-full border-none bg-transparent text-[13px] outline-none"
            @input="usersManagement.setSearchTerm($event.target.value)"
          />
        </label>

        <select
          :value="roleFilter"
          class="h-[34px] rounded-[10px] border border-[#c7d7cc] bg-[#f8faf7] px-2.5 text-[12px] text-[#344640]"
          @change="usersManagement.setRoleFilter($event.target.value)"
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">ADMIN</option>
          <option value="DIRECTOR">DIRECTOR</option>
          <option value="MANAGER">MANAGER</option>
          <option value="SALES AGENT">SALES AGENT</option>
        </select>

        <select
          :value="branchFilter"
          class="h-[34px] rounded-[10px] border border-[#c7d7cc] bg-[#f8faf7] px-2.5 text-[12px] text-[#344640]"
          @change="usersManagement.setBranchFilter($event.target.value)"
        >
          <option value="ALL">All Branches</option>
          <option value="Central View">Central View</option>
          <option value="Maganjo">Maganjo</option>
          <option value="Matugga">Matugga</option>
        </select>

        <button class="h-[34px] rounded-[10px] border border-[#c7d7cc] bg-[#f8faf7] px-2.5 text-[13px] font-semibold text-[#344640]" @click="usersManagement.initialize(true)">Refresh</button>
        <button class="h-[34px] rounded-[10px] border border-[#30543e] bg-[#30543e] px-2.5 text-[13px] font-semibold text-white" @click="usersManagement.openAddModal()">Add User</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { HomeIcon } from '@heroicons/vue/24/outline'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import { useUserManagementStore } from '@/stores/userManagement'

const usersManagement = useUserManagementStore()
const { searchTerm, roleFilter, branchFilter } = storeToRefs(usersManagement)
</script>


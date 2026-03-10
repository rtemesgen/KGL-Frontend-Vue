<template>
  <section class="overflow-hidden rounded-xl border border-[#c7d7cc] bg-[#f7f6f0f2] flex h-full min-h-0 flex-col">
    <div class="flex items-center justify-between border-b border-[#d3dfd5] bg-gradient-to-r from-[#e3f1df] to-[#f3e2ce] px-2.5 py-1.5">
      <h3 class="m-0 text-[15px] font-semibold text-[#274536]">Main User Directory</h3>
      <span v-if="loading" class="text-[10px] font-semibold text-[#5c7368]">Loading...</span>
    </div>

    <div class="min-h-0 flex-1 overflow-auto">
      <table class="w-full min-w-[860px] border-collapse">
        <thead>
          <tr>
            <th class="sticky top-0 z-[1] border-b border-[#dbe6dd] bg-[#eef4ec] px-2.5 py-1.5 text-left text-[10px] uppercase tracking-[0.04em] text-[#5c7368]">Name</th>
            <th class="sticky top-0 z-[1] border-b border-[#dbe6dd] bg-[#eef4ec] px-2.5 py-1.5 text-left text-[10px] uppercase tracking-[0.04em] text-[#5c7368]">Email</th>
            <th class="sticky top-0 z-[1] border-b border-[#dbe6dd] bg-[#eef4ec] px-2.5 py-1.5 text-left text-[10px] uppercase tracking-[0.04em] text-[#5c7368]">Role</th>
            <th class="sticky top-0 z-[1] border-b border-[#dbe6dd] bg-[#eef4ec] px-2.5 py-1.5 text-left text-[10px] uppercase tracking-[0.04em] text-[#5c7368]">Branch</th>
            <th class="sticky top-0 z-[1] border-b border-[#dbe6dd] bg-[#eef4ec] px-2.5 py-1.5 text-left text-[10px] uppercase tracking-[0.04em] text-[#5c7368]">ID</th>
            <th class="sticky top-0 z-[1] border-b border-[#dbe6dd] bg-[#eef4ec] px-2.5 py-1.5 text-left text-[10px] uppercase tracking-[0.04em] text-[#5c7368]">Permissions</th>
            <th class="sticky top-0 z-[1] border-b border-[#dbe6dd] bg-[#eef4ec] px-2.5 py-1.5 text-left text-[10px] uppercase tracking-[0.04em] text-[#5c7368]">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id">
            <td class="border-b border-[#dbe6dd] px-2 py-1 text-[10px] text-[#111827]">{{ user.name }}</td>
            <td class="border-b border-[#dbe6dd] px-2 py-1 text-[10px] text-[#111827]">{{ user.email }}</td>
            <td class="border-b border-[#dbe6dd] px-2 py-1">
              <span class="inline-block rounded-md px-2 py-0.5 text-[9px] font-bold" :class="usersManagement.roleBadgeClass(user.role)">{{ user.role }}</span>
            </td>
            <td class="border-b border-[#dbe6dd] px-2 py-1 text-[10px] text-[#111827]">{{ user.branch }}</td>
            <td class="border-b border-[#dbe6dd] px-2 py-1 text-[10px] text-[#111827]">{{ user.id }}</td>
            <td class="border-b border-[#dbe6dd] px-2 py-1">
              <span
                v-for="permission in user.permissions"
                :key="`${user.id}-${permission}`"
                class="mb-0.5 mr-1 inline-block rounded-md px-1.5 py-0.5 text-[9px] font-bold"
                :class="permission === 'FULL ACCESS' ? 'bg-[#fed7aa] text-[#9a3412]' : 'bg-[#eef3ef] text-[#4b6358]'"
              >
                {{ permission }}
              </span>
            </td>
            <td class="border-b border-[#dbe6dd] px-2 py-1">
              <div class="flex gap-2">
                <button class="border-none bg-transparent p-0 text-[10px] font-semibold text-[#1f59ce]" @click="usersManagement.openEditModal(user)">Edit Role</button>
                <button class="border-none bg-transparent p-0 text-[10px] font-semibold text-[#b42318]" @click="usersManagement.requestDelete(user)">Delete</button>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && filteredUsers.length === 0">
            <td colspan="7" class="px-3 py-2 text-center text-[10px] italic text-[#6b7d74]">No users match your filters.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between px-2.5 py-1.5 text-[10px] text-[#5c7368]">
      <span>Showing {{ filteredUsers.length }} of {{ totalUsers }} entries</span>
    </div>
  </section>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useUserManagementStore } from '@/stores/userManagement'

const usersManagement = useUserManagementStore()
const { filteredUsers, totalUsers, loading } = storeToRefs(usersManagement)
</script>

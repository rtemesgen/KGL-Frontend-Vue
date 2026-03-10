<template>
  <div v-if="open" class="fixed inset-0 z-40 flex items-center justify-center bg-[#0f172a]/30 px-4" @click.self="$emit('cancel')">
    <div class="w-full max-w-[920px] overflow-hidden rounded-[14px] border border-[#d8decf] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
      <header class="flex items-center justify-between border-b border-[#d8decf] bg-[#faf8f1] px-4 py-3">
        <div class="flex items-center gap-3">
          <span class="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#dce8f8] text-[#1f6be8]"><BuildingStorefrontIcon class="h-5 w-5" /></span>
          <div>
            <h3 class="m-0 text-[18px] font-semibold text-[#0f172a]">Manage Suppliers</h3>
            <p class="m-0 text-[11px] text-[#64748b]">Maintain supplier contacts and outstanding balances.</p>
          </div>
        </div>
        <button class="text-[#94a3b8] transition hover:text-[#475569]" @click="$emit('cancel')"><XMarkIcon class="h-6 w-6" /></button>
      </header>

      <div class="grid gap-3 p-3 lg:grid-cols-[minmax(0,1.45fr)_300px]">
        <section class="space-y-3">
          <input :value="search" type="text" placeholder="Search by supplier name, contact or email..." class="h-[38px] w-full rounded-[11px] border border-[#d8decf] bg-[#fafcf8] px-3 text-[12px] text-[#0f172a] outline-none" @input="$emit('update-search', $event.target.value)" />

          <div class="overflow-hidden rounded-[14px] border border-[#d8decf]">
            <div class="max-h-[420px] overflow-y-auto overflow-x-hidden">
            <table class="w-full border-collapse table-fixed">
              <thead class="bg-[#eef1e6] text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6a7f67]">
                <tr>
                  <th class="w-[34%] px-3 py-2">Supplier</th>
                  <th class="w-[42%] px-3 py-2">Contact</th>
                  <th class="w-[16%] px-3 py-2">Outstanding</th>
                  <th class="w-[76px] px-2 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="supplier in suppliers" :key="supplier.id" class="border-t border-[#e3e7da] text-[12px] text-[#0f172a] odd:bg-white even:bg-[#faf8f1]">
                  <td class="px-3 py-2.5">
                    <div class="font-semibold">{{ supplier.name }}</div>
                    <div class="text-[11px] text-[#64748b]">ID: {{ supplier.id }}</div>
                  </td>
                  <td class="px-3 py-2.5 text-[#475569] break-words">
                    <div>{{ supplier.contactName || '-' }}</div>
                    <div class="text-[11px]">{{ supplier.email || supplier.phone || '-' }}</div>
                  </td>
                  <td class="px-2 py-2.5 font-semibold whitespace-nowrap">{{ money(outstandingMap[supplier.id] || 0) }}</td>
                  <td class="whitespace-nowrap px-2 py-2.5 text-right">
                    <div class="inline-flex items-center gap-1.5">
                      <button class="text-[#1f6be8]" @click="$emit('edit', supplier)"><PencilSquareIcon class="inline h-4 w-4" /></button>
                      <button class="text-[#dc2626]" @click="$emit('delete', supplier)"><TrashIcon class="inline h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!suppliers.length"><td colspan="4" class="px-3 py-5 text-center text-[12px] text-[#64748b]">No suppliers found.</td></tr>
              </tbody>
            </table>
            </div>
          </div>
        </section>

        <section class="rounded-[14px] border border-[#d8decf] bg-[#fafcf8] p-3">
          <h4 class="m-0 text-[15px] font-semibold text-[#0f172a]">{{ form.id ? 'Edit Supplier' : 'Add New Supplier' }}</h4>
          <div class="mt-2 space-y-2">
            <label class="block"><span class="mb-1 block text-[11px] font-medium text-[#334155]">Supplier Name</span><input :value="form.name" type="text" class="h-[36px] w-full rounded-[10px] border border-[#d8decf] bg-white px-3 text-[12px] outline-none" @input="$emit('update-field', 'name', $event.target.value)" /></label>
            <label class="block"><span class="mb-1 block text-[11px] font-medium text-[#334155]">Contact Person</span><input :value="form.contactName" type="text" class="h-[36px] w-full rounded-[10px] border border-[#d8decf] bg-white px-3 text-[12px] outline-none" @input="$emit('update-field', 'contactName', $event.target.value)" /></label>
            <label class="block"><span class="mb-1 block text-[11px] font-medium text-[#334155]">Email</span><input :value="form.email" type="email" class="h-[36px] w-full rounded-[10px] border border-[#d8decf] bg-white px-3 text-[12px] outline-none" @input="$emit('update-field', 'email', $event.target.value)" /></label>
            <label class="block"><span class="mb-1 block text-[11px] font-medium text-[#334155]">Phone</span><input :value="form.phone" type="text" class="h-[36px] w-full rounded-[10px] border border-[#d8decf] bg-white px-3 text-[12px] outline-none" @input="$emit('update-field', 'phone', $event.target.value)" /></label>
            <label class="block"><span class="mb-1 block text-[11px] font-medium text-[#334155]">Status</span><input :value="form.status" type="text" class="h-[36px] w-full rounded-[10px] border border-[#d8decf] bg-white px-3 text-[12px] outline-none" @input="$emit('update-field', 'status', $event.target.value)" /></label>
            <label class="block"><span class="mb-1 block text-[11px] font-medium text-[#334155]">Payment Terms</span><input :value="form.terms" type="text" class="h-[36px] w-full rounded-[10px] border border-[#d8decf] bg-white px-3 text-[12px] outline-none" @input="$emit('update-field', 'terms', $event.target.value)" /></label>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button class="h-[36px] rounded-[10px] border border-[#d8decf] bg-white px-4 text-[12px] font-semibold text-[#475569]" @click="$emit('reset-form')">Clear</button>
            <button class="h-[36px] rounded-[10px] bg-[#2f6b4d] px-4 text-[12px] font-semibold text-white" @click="$emit('save')">Save Supplier</button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { BuildingStorefrontIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { formatAmount } from '@/utils/formatters'

defineProps({
  open: Boolean,
  suppliers: { type: Array, default: () => [] },
  form: { type: Object, required: true },
  search: { type: String, default: '' },
  outstandingMap: { type: Object, default: () => ({}) },
})

defineEmits(['update-field', 'update-search', 'save', 'cancel', 'edit', 'delete', 'reset-form'])
const money = (value) => `USh ${formatAmount(value)}`
</script>


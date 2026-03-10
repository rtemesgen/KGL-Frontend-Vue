<template>
  <div v-if="open" class="fixed inset-0 z-40 flex items-center justify-center bg-[#0f172a]/30 px-4" @click.self="$emit('cancel')">
    <div class="w-full max-w-[520px] overflow-hidden rounded-[14px] border border-[#d8decf] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
      <header class="flex items-center justify-between border-b border-[#d8decf] bg-[#faf8f1] px-4 py-3">
        <div class="flex items-center gap-3">
          <span class="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#dce8f8] text-[#1f6be8]"><ArchiveBoxIcon class="h-5 w-5" /></span>
          <div>
            <h3 class="m-0 text-[18px] font-semibold text-[#0f172a]">Add New Item</h3>
            <p class="m-0 text-[11px] text-[#64748b]">Create or update an inventory item for procurement.</p>
          </div>
        </div>
        <button class="text-[#94a3b8] transition hover:text-[#475569]" @click="$emit('cancel')"><XMarkIcon class="h-6 w-6" /></button>
      </header>

      <div class="grid gap-3 p-4 md:grid-cols-2">
        <label class="block md:col-span-2">
          <span class="mb-1 block text-[12px] font-medium text-[#334155]">Item Name</span>
          <input :value="form.name" type="text" placeholder="e.g. Industrial Gaskets" class="h-[38px] w-full rounded-[11px] border border-[#d8decf] bg-[#fafcf8] px-3 text-[12px] text-[#0f172a] outline-none" @input="$emit('update-field', 'name', $event.target.value)" />
        </label>

        <label class="block">
          <span class="mb-1 block text-[12px] font-medium text-[#334155]">Category</span>
          <input :value="form.category" type="text" placeholder="Select category" class="h-[38px] w-full rounded-[11px] border border-[#d8decf] bg-[#fafcf8] px-3 text-[12px] text-[#0f172a] outline-none" @input="$emit('update-field', 'category', $event.target.value)" />
        </label>

        <label class="block">
          <span class="mb-1 block text-[12px] font-medium text-[#334155]">Unit of Measure</span>
          <input :value="form.unit" type="text" placeholder="kg / bag / unit" class="h-[38px] w-full rounded-[11px] border border-[#d8decf] bg-[#fafcf8] px-3 text-[12px] text-[#0f172a] outline-none" @input="$emit('update-field', 'unit', $event.target.value)" />
        </label>

        <label class="block">
          <span class="mb-1 block text-[12px] font-medium text-[#334155]">Initial Cost Price</span>
          <input :value="form.costPrice" type="number" min="0" placeholder="0.00" class="h-[38px] w-full rounded-[11px] border border-[#d8decf] bg-[#fafcf8] px-3 text-[12px] text-[#0f172a] outline-none" @input="$emit('update-field', 'costPrice', $event.target.value)" />
        </label>

        <label class="block">
          <span class="mb-1 block text-[12px] font-medium text-[#334155]">Default Selling Price</span>
          <input :value="form.sellingPrice" type="number" min="0" placeholder="0.00" class="h-[38px] w-full rounded-[11px] border border-[#d8decf] bg-[#fafcf8] px-3 text-[12px] text-[#0f172a] outline-none" @input="$emit('update-field', 'sellingPrice', $event.target.value)" />
        </label>

        <label class="block md:col-span-2">
          <span class="mb-1 block text-[12px] font-medium text-[#334155]">Minimum Quantity</span>
          <input :value="form.minQty" type="number" min="0" placeholder="0" class="h-[38px] w-full rounded-[11px] border border-[#d8decf] bg-[#fafcf8] px-3 text-[12px] text-[#0f172a] outline-none" @input="$emit('update-field', 'minQty', $event.target.value)" />
        </label>
      </div>

      <footer class="flex justify-end gap-2 border-t border-[#d8decf] bg-[#fafcf8] px-4 py-3">
        <button class="h-[38px] rounded-[11px] border border-[#d8decf] bg-white px-4 text-[12px] font-semibold text-[#475569]" @click="$emit('cancel')">Cancel</button>
        <button class="h-[38px] rounded-[11px] bg-[#2f6b4d] px-5 text-[12px] font-semibold text-white" @click="$emit('save')">Save Item</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ArchiveBoxIcon, XMarkIcon } from '@heroicons/vue/24/outline'
defineProps({ open: Boolean, form: { type: Object, required: true } })
defineEmits(['update-field', 'save', 'cancel'])
</script>


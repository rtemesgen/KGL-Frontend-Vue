<template>
  <div v-if="open && form" class="fixed inset-0 z-40 flex items-center justify-center bg-[#0f172a]/30 px-4" @click.self="$emit('cancel')">
    <div class="w-full max-w-[420px] overflow-hidden rounded-[14px] border border-[#d8decf] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
      <header class="flex items-center justify-between border-b border-[#d8decf] bg-[#faf8f1] px-4 py-3">
        <div>
          <h3 class="m-0 text-[14px] font-semibold text-[#0f172a]">Edit Stock Record</h3>
          <p class="m-0 text-[10px] text-[#64748b]">{{ form.itemName }} | {{ form.actionType }}</p>
        </div>
        <button class="text-[#94a3b8] transition hover:text-[#475569]" @click="$emit('cancel')"><XMarkIcon class="h-5 w-5" /></button>
      </header>
      <div class="space-y-3 p-4">
        <label class="block">
          <span class="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5c7368]">{{ form.actionType === 'Damage' ? 'Qty Damaged' : 'Quantity Change' }}</span>
          <input :value="form.qty" type="text" inputmode="decimal" class="h-[34px] w-full rounded-[10px] border border-[#d3dfd5] bg-white px-3 text-[11px] text-[#22392e] outline-none" @input="$emit('update-qty', $event.target.value)" />
        </label>
      </div>
      <footer class="flex justify-end gap-2 border-t border-[#d8decf] bg-[#faf8f1] px-4 py-3">
        <button class="h-[34px] rounded-[10px] border border-[#d8decf] bg-white px-4 text-[11px] font-semibold text-[#475569]" @click="$emit('cancel')">Cancel</button>
        <button class="h-[34px] rounded-[10px] bg-[#2f6b4d] px-4 text-[11px] font-semibold text-white" @click="$emit('save')">Save Change</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { XMarkIcon } from '@heroicons/vue/24/outline'

defineProps({
  open: Boolean,
  form: { type: Object, default: null },
})

defineEmits(['cancel', 'save', 'update-qty'])
</script>

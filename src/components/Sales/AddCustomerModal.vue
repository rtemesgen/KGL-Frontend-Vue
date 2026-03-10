<template>
  <div v-if="open" class="fixed inset-0 z-[66] grid place-items-center bg-[rgba(15,23,42,0.24)] p-2 [backdrop-filter:blur(2px)]" @click.self="$emit('cancel')">
    <section class="w-full max-w-[420px] rounded-[16px] border border-[#d3dfd5] bg-[#fbfcf8] shadow-[0_14px_34px_rgba(40,70,54,0.18)]">
      <header class="flex items-center gap-2.5 border-b border-[#d3dfd5] bg-[linear-gradient(90deg,#edf4ec,#f3eadc)] px-3 py-2.5">
        <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-[#dceedd] text-[#2f6940]">
          <UserPlusIcon class="h-4 w-4" />
        </div>
        <div>
          <h3 class="m-0 text-[15px] font-semibold text-[#22392e]">Add Customer</h3>
          <p class="m-0 text-[10px] text-[#5c7368]">Use clear customer details for credit and payment tracking.</p>
        </div>
      </header>

      <div class="space-y-2.5 px-3 py-3">
        <label class="grid gap-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5c7368]">
          Full Name
          <input :value="customerForm.fullName" type="text" placeholder="e.g. John Doe" class="h-10 rounded-xl border border-[#d3dfd5] bg-white px-3 text-[13px] text-[#22392e] outline-none placeholder:text-[#94a59c]" @input="$emit('update-field', 'fullName', $event.target.value)" />
        </label>

        <label class="grid gap-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5c7368]">
          NIN / National ID
          <input :value="customerForm.nationalId" type="text" placeholder="e.g. CM30211045K" class="h-10 rounded-xl border border-[#d3dfd5] bg-white px-3 text-[13px] text-[#22392e] outline-none placeholder:text-[#94a59c]" @input="$emit('update-field', 'nationalId', $event.target.value)" />
        </label>

        <label class="grid gap-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5c7368]">
          Phone
          <input :value="customerForm.phone" type="text" inputmode="tel" placeholder="e.g. 0700123456" class="h-10 rounded-xl border border-[#d3dfd5] bg-white px-3 text-[13px] text-[#22392e] outline-none placeholder:text-[#94a59c]" @input="$emit('update-field', 'phone', $event.target.value)" />
        </label>

        <label class="grid gap-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5c7368]">
          Address
          <textarea :value="customerForm.address" rows="3" placeholder="e.g. Plot 12, Maganjo Road, Kampala" class="rounded-xl border border-[#d3dfd5] bg-white px-3 py-2 text-[13px] text-[#22392e] outline-none placeholder:text-[#94a59c]" @input="$emit('update-field', 'address', $event.target.value)"></textarea>
        </label>
      </div>

      <footer class="flex justify-end gap-2 border-t border-[#d3dfd5] px-3 py-2.5">
        <button class="inline-flex h-8 items-center justify-center rounded-lg border border-[#d3dfd5] bg-white px-3 text-[12px] font-semibold text-[#42556b] transition hover:bg-[#f4f6f8]" @click="$emit('cancel')">
          Cancel
        </button>
        <button class="inline-flex h-8 items-center justify-center rounded-lg bg-[#2f6b4d] px-3 text-[12px] font-semibold text-white transition hover:bg-[#27593f]" @click="$emit('save')">
          Save Customer
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { UserPlusIcon } from '@heroicons/vue/24/outline'

defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  customerForm: {
    type: Object,
    required: true,
  },
})

defineEmits(['cancel', 'save', 'update-field'])
</script>

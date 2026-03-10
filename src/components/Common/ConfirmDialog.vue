<template>
  <div v-if="open" class="modal-overlay" @click.self="$emit('cancel')">
    <section class="modal-card confirm-card">
      <header class="modal-head">
        <h4>{{ title }}</h4>
        <button class="modal-close" @click="$emit('cancel')">x</button>
      </header>
      <div class="modal-body">
        <p class="confirm-text">{{ message }}</p>
      </div>
      <footer class="modal-foot">
        <button class="btn" @click="$emit('cancel')">{{ cancelText }}</button>
        <button class="btn btn-danger" @click="$emit('confirm')">{{ confirmText }}</button>
      </footer>
    </section>
  </div>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'Confirm Action' },
  message: { type: String, default: 'Are you sure?' },
  confirmText: { type: String, default: 'Proceed' },
  cancelText: { type: String, default: 'Cancel' },
})

defineEmits(['confirm', 'cancel'])
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.34); backdrop-filter: blur(2px); display: grid; place-items: center; z-index: 50; padding: 14px; }
.modal-card { width: min(460px, 100%); border-radius: 12px; border: 1px solid #c7d7cc; background: #f8faf7; box-shadow: 0 12px 34px rgba(15, 23, 42, 0.24); }
.confirm-card { width: min(420px, 100%); }
.modal-head { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; border-bottom: 1px solid #d3dfd5; }
.modal-head h4 { margin: 0; font-size: 18px; }
.modal-close { border: none; background: transparent; color: #64748b; font-size: 16px; cursor: pointer; }
.modal-body { display: grid; gap: 10px; padding: 14px; }
.confirm-text { margin: 0; font-size: 14px; color: #344640; }
.modal-foot { padding: 0 14px 14px; display: flex; justify-content: flex-end; gap: 8px; }
.btn { border: 1px solid #c7d7cc; border-radius: 10px; background: #f8faf7; min-height: 34px; padding: 0 12px; cursor: pointer; font-weight: 600; }
.btn-danger { background: #b42318; border-color: #b42318; color: #fff; }
</style>

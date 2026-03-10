<template>
  <div class="space-y-2 p-1">
    <section class="flex items-center justify-between gap-2 rounded-[12px] border border-[#d9e4db] bg-[linear-gradient(90deg,#edf4ec,#f3eadc)] px-2 py-1.5 shadow-[0_8px_18px_rgba(40,70,54,0.07)]">
      <div>
        <h2 class="m-0 text-[13px] font-semibold tracking-[-0.04em] text-[#22392e]">Suppliers Directory</h2>
        <p class="m-0 text-[10px] text-[#6b8076]">Live supplier balances and payments for {{ activeBranch }}.</p>
      </div>
      <div class="flex items-center gap-2">
        <button class="h-[32px] rounded-[10px] border border-[#c7d7cc] bg-white px-3 text-[11px] font-semibold text-[#445a51] transition hover:bg-[#f8faf7]" @click="showPaymentHistory = true">Payment History</button>
        <button class="h-[32px] rounded-[10px] border border-[#c7d7cc] bg-white px-3 text-[11px] font-semibold text-[#30543e] transition hover:bg-[#f8faf7]" @click="openSupplierManager">Manage Suppliers</button>
      </div>
    </section>

    <section class="grid gap-2 md:grid-cols-4">
      <article v-for="card in summaryCards" :key="card.key" class="rounded-[12px] border border-[#d9e4db] bg-[#fcfdf9] px-2 py-1.5 shadow-[0_8px_18px_rgba(40,70,54,0.07)]">
        <div class="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#5c7368]">{{ card.label }}</div>
        <div class="mt-1 text-[20px] font-semibold tracking-[-0.05em] text-[#22392e]">{{ card.value }}</div>
        <div class="mt-0.5 text-[10px] text-[#6b8076]">{{ card.hint }}</div>
      </article>
    </section>

    <ProcurementSupplierDirectorySection
      :suppliers="filteredSuppliers"
      :outstanding-map="supplierOutstandingMap"
      :payment-drafts="paymentDrafts"
      :branch-label="activeBranch"
      :total-outstanding="directoryOutstandingTotal"
      @update-payment="updatePaymentDraft"
      @process-payment="processSupplierPayment"
    />


    <ProcurementSupplierPaymentHistoryModal
      :open="showPaymentHistory"
      :payments="filteredPayments"
      :branch-label="activeBranch"
      @close="showPaymentHistory = false"
    />

    <ProcurementManageSuppliersModal
      :open="supplierManagerOpen"
      :suppliers="filteredSuppliersForManager"
      :form="supplierForm"
      :search="localSearch"
      :outstanding-map="supplierOutstandingMap"
      @cancel="closeSupplierManager"
      @update-search="(value) => localSearch = value"
      @update-field="updateSupplierField"
      @save="saveSupplier"
      @edit="editSupplier"
      @delete="promptDeleteSupplier"
      @reset-form="resetSupplierForm"
    />

    <ConfirmDialog
      :open="showDeleteConfirm"
      title="Confirm Delete"
      :message="`Proceed to delete ${pendingDeleteName}?`"
      confirm-text="Proceed"
      cancel-text="Cancel"
      @confirm="confirmDeleteSupplier"
      @cancel="cancelDeleteSupplier"
    />
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { toast } from 'vue3-toastify'
import ConfirmDialog from '@/components/Common/ConfirmDialog.vue'
import ProcurementManageSuppliersModal from '@/components/Procurement/ProcurementManageSuppliersModal.vue'
import ProcurementSupplierDirectorySection from '@/components/Procurement/ProcurementSupplierDirectorySection.vue'
import ProcurementSupplierPaymentHistoryModal from '@/components/Procurement/ProcurementSupplierPaymentHistoryModal.vue'
import { useProcurementStore } from '@/stores/procurement'
import { getApiMessage } from '@/services/api/client'
import { formatAmount } from '@/utils/formatters'

const props = defineProps({
  activeBranch: { type: String, required: true },
  staffName: { type: String, required: true },
  searchQuery: { type: String, default: '' },
})

const procurement = useProcurementStore()
const { supplierManagerOpen } = storeToRefs(procurement)
const paymentDrafts = reactive({})
const supplierForm = reactive({ id: '', name: '', contactName: '', email: '', phone: '', status: 'Active', terms: 'NET 30' })
const localSearch = ref('')
const showDeleteConfirm = ref(false)
const showPaymentHistory = ref(false)
const pendingDeleteId = ref('')
const pendingDeleteName = ref('this supplier')

const suppliers = computed(() => procurement.suppliersByBranch(props.activeBranch))
const supplierOutstandingMap = computed(() => procurement.supplierOutstandingByBranch(props.activeBranch))
const filteredSuppliers = computed(() => {
  const query = props.searchQuery.trim().toLowerCase()
  return suppliers.value.filter((supplier) => !query || `${supplier.name} ${supplier.contactName} ${supplier.email} ${supplier.phone}`.toLowerCase().includes(query))
})
const filteredSuppliersForManager = computed(() => {
  const query = localSearch.value.trim().toLowerCase()
  return suppliers.value.filter((supplier) => !query || `${supplier.name} ${supplier.contactName} ${supplier.email}`.toLowerCase().includes(query))
})
const directoryOutstandingTotal = computed(() => filteredSuppliers.value.reduce((sum, supplier) => sum + Number(supplierOutstandingMap.value[supplier.id] || 0), 0))
const filteredPayments = computed(() => {
  const query = props.searchQuery.trim().toLowerCase()
  return procurement.supplierPaymentsByBranch(props.activeBranch).filter((payment) => !query || `${payment.supplierName} ${payment.createdBy} ${payment.note || ''}`.toLowerCase().includes(query))
})
const summaryCards = computed(() => {
  const scopedSuppliers = filteredSuppliers.value
  const activeCount = scopedSuppliers.filter((supplier) => supplier.status === 'Active').length
  const outstandingSuppliers = scopedSuppliers.filter((supplier) => Number(supplierOutstandingMap.value[supplier.id] || 0) > 0).length
  const totalPayments = filteredPayments.value.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  return [
    { key: 'suppliers', label: 'Total Suppliers', value: String(scopedSuppliers.length), hint: 'Branch-scoped supplier records' },
    { key: 'active', label: 'Active Suppliers', value: String(activeCount), hint: 'Current active supplier accounts' },
    { key: 'outstanding', label: 'Outstanding Total', value: money(directoryOutstandingTotal.value), hint: `${outstandingSuppliers} supplier balances pending` },
    { key: 'payments', label: 'Payments Posted', value: money(totalPayments), hint: `${filteredPayments.value.length} payment records` },
  ]
})

const money = (value) => `USh ${formatAmount(value)}`
const sanitizeNumber = (value) => String(value || '').replace(/[^\d.]/g, '')

const updatePaymentDraft = (supplierKey, value) => {
  const numeric = sanitizeNumber(value)
  const outstanding = Number(supplierOutstandingMap.value[supplierKey] || 0)
  paymentDrafts[supplierKey] = numeric ? String(Math.min(Number(numeric), outstanding)) : ''
}

const processSupplierPayment = async (supplier) => {
  const amount = Number(paymentDrafts[supplier.id] || 0)
  if (amount <= 0) {
    toast.error('Enter a payment amount before processing.')
    return
  }
  try {
    const payment = await procurement.saveSupplierPayment({
      branch: props.activeBranch,
      supplierId: supplier.id,
      amount,
      createdBy: props.staffName,
    })
    if (!payment) {
      toast.error('Unable to process supplier payment.')
      return
    }
    paymentDrafts[supplier.id] = ''
    toast.success(`${supplier.name} payment recorded.`)
  } catch (error) {
    toast.error(getApiMessage(error, 'Unable to process supplier payment.'))
  }
}

const openSupplierManager = () => procurement.openSupplierManager()
const closeSupplierManager = () => {
  procurement.closeSupplierManager()
  localSearch.value = ''
  resetSupplierForm()
}
const resetSupplierForm = () => { Object.assign(supplierForm, { id: '', name: '', contactName: '', email: '', phone: '', status: 'Active', terms: 'NET 30' }) }
const updateSupplierField = (field, value) => { supplierForm[field] = value }
const saveSupplier = async () => {
  try {
    const supplier = await procurement.saveSupplier({ ...supplierForm, branch: props.activeBranch })
    if (!supplier) {
      toast.error('Enter supplier name before saving.')
      return
    }
    toast.success(`${supplier.name} saved.`)
    resetSupplierForm()
  } catch (error) {
    toast.error(getApiMessage(error, 'Unable to save supplier.'))
  }
}
const editSupplier = (supplier) => { Object.assign(supplierForm, { ...supplier }) }
const promptDeleteSupplier = (supplier) => {
  pendingDeleteId.value = supplier.id
  pendingDeleteName.value = supplier.name
  showDeleteConfirm.value = true
}
const cancelDeleteSupplier = () => { showDeleteConfirm.value = false; pendingDeleteId.value = ''; pendingDeleteName.value = 'this supplier' }
const confirmDeleteSupplier = async () => {
  try {
    const deleted = await procurement.deleteSupplier(pendingDeleteId.value)
    cancelDeleteSupplier()
    if (!deleted) return
    toast.success('Supplier deleted.')
  } catch (error) {
    cancelDeleteSupplier()
    toast.error(getApiMessage(error, 'Unable to delete supplier.'))
  }
}
</script>







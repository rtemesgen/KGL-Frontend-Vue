<template>
  <div class="grid rounded-[14px] border border-[#d9e4db] bg-[#fcfdf9] shadow-[0_8px_18px_rgba(40,70,54,0.07)] xl:grid-cols-[minmax(0,1.95fr)_minmax(220px,0.62fr)]">
    <section class="flex flex-col border-b border-[#d9e4db] xl:border-b-0 xl:border-r">
      <header class="flex items-start justify-between gap-3 border-b border-[#d9e4db] bg-[linear-gradient(90deg,#edf4ec,#f3eadc)] px-1.5 py-1.5">
        <div>
          <h2 class="m-0 text-[16px] font-semibold tracking-[-0.04em] text-[#22392e]">Current Order</h2>
          <p class="m-0 text-[9px] text-[#5c7368]">Transaction ID: {{ currentOrderId }}</p>
        </div>

        <button class="inline-flex h-6.5 items-center gap-1 rounded-lg px-1.5 text-[9px] font-medium text-[#5c7368] transition hover:bg-white/70" @click="resetBasket">
          <TrashIcon class="h-3 w-3" />
          Clear All
        </button>
      </header>

      <InventoryEntryGrid
        :rows="orderRows"
        :products="branchProducts"
        :active-row-id="activeQtyRowId"
        :pricing-columns="salesPricingColumns"
        template-columns="48px minmax(0,1.45fr) 92px 108px 108px"
        total-value-key="unitPrice"
        query-placeholder="Search by item name or SKU"
        :money-formatter="money"
        :row-identifier="(row) => row.id"
        @activate-row="setActiveQtyRow"
        @update-query="({ rowId, value }) => updateRowQuery(rowId, value)"
        @commit-product="({ rowId, product }) => commitRowProduct(rowId, product.name)"
        @update-cell="({ rowId, key, value }) => updateGridCell(rowId, key, value)"
      />

      <footer class="mt-auto border-t border-[#d9e4db] bg-[#f8faf7] px-2 py-1.5">
        <div class="flex items-end justify-between gap-3">
          <div class="text-[9px] text-[#6b8076]">
            <span class="font-semibold uppercase tracking-[0.12em]">Qty Limit</span>
            <span class="ml-1">{{ selectedRowLimitLabel }}</span>
          </div>

          <div class="w-[150px] space-y-0 text-right text-[#5c7368] leading-tight">
            <div class="flex items-center justify-between text-[10px]">
              <span>Subtotal</span>
              <span>{{ money(currentOrderSubtotal) }}</span>
            </div>
            <div class="flex items-center justify-between text-[10px]">
              <span>Tax (0%)</span>
              <span>{{ money(currentOrderTax) }}</span>
            </div>
            <div class="pt-0 text-[18px] font-semibold tracking-[-0.05em] text-[#2f6b4d]">{{ money(currentOrderTotal) }}</div>
          </div>
        </div>
      </footer>
    </section>

    <section class="flex flex-col justify-between bg-[#fbfcf8]">
      <header class="flex items-center gap-2 border-b border-[#d9e4db] bg-[linear-gradient(90deg,#edf4ec,#f8f3e7)] px-1.5 py-1.5">
        <div class="flex h-6 w-6 items-center justify-center rounded-lg bg-[#f7e6cf] text-[#a6651e]">
          <CreditCardIcon class="h-3 w-3" />
        </div>
        <h2 class="m-0 text-[14px] font-semibold tracking-[-0.04em] text-[#22392e]">Sales Actions</h2>
      </header>

      <div class="space-y-2 px-2 py-2">
        <div class="grid grid-cols-2 gap-1.5">
          <button class="inline-flex h-[34px] items-center justify-center gap-1.5 rounded-[10px] border border-[#d3dfd5] bg-white text-[11px] font-semibold text-[#30543e] shadow-[0_4px_10px_rgba(40,70,54,0.04)] transition hover:bg-[#f4f8f4]" @click="openCustomerModal">
            <UserPlusIcon class="h-3.5 w-3.5" />
            Add Customer
          </button>
          <button class="inline-flex h-[34px] items-center justify-center gap-1.5 rounded-[10px] border border-[#d3dfd5] bg-white text-[11px] font-semibold text-[#30543e] shadow-[0_4px_10px_rgba(40,70,54,0.04)] transition hover:bg-[#f4f8f4]" @click="openPaymentModal">
            <BanknotesIcon class="h-3.5 w-3.5" />
            Receive Payment
          </button>
        </div>

        <div class="rounded-[10px] border border-[#d9e4db] bg-[#f8faf7] px-2 py-1.5">
          <div class="text-[7px] font-semibold uppercase tracking-[0.16em] text-[#5c7368]">Qty Input</div>
          <div class="mt-0 text-right text-[9px] text-[#7a8d83]">Selected Row {{ activeQtyRowId }}</div>
          <div class="text-right text-[20px] font-semibold tracking-[-0.05em] text-[#2f6b4d]">{{ selectedQtyDisplay }}</div>
          <div class="mt-0.5 text-right text-[8px] text-[#6b8076]">Max {{ selectedRowLimitLabel }}</div>
        </div>

        <div class="grid grid-cols-3 gap-1.5">
          <button
            v-for="digit in keypadDigits"
            :key="digit"
            class="flex h-8.5 items-center justify-center rounded-[10px] border border-[#d3dfd5] bg-white text-[15px] font-semibold text-[#22392e] shadow-[0_4px_10px_rgba(40,70,54,0.04)] transition hover:border-[#bfd0c3] hover:bg-[#f7faf8]"
            @click="appendQtyDigit(digit)"
          >
            {{ digit }}
          </button>

          <button
            class="flex h-8.5 items-center justify-center rounded-[10px] border border-[#ead2c9] bg-[#fff5f1] text-[#c45b36] shadow-[0_4px_10px_rgba(40,70,54,0.04)] transition hover:bg-[#ffece5]"
            @click="removeQtyDigit"
          >
            <BackspaceIcon class="h-4 w-4" />
          </button>
          <button
            class="flex h-8.5 items-center justify-center rounded-[10px] border border-[#d3dfd5] bg-white text-[15px] font-semibold text-[#22392e] shadow-[0_4px_10px_rgba(40,70,54,0.04)] transition hover:border-[#bfd0c3] hover:bg-[#f7faf8]"
            @click="appendQtyDigit(0)"
          >
            0
          </button>
          <button
            class="flex h-8.5 items-center justify-center rounded-[10px] border border-[#d6e2d7] bg-[#edf4ec] text-[12px] font-semibold text-[#30543e] shadow-[0_4px_10px_rgba(40,70,54,0.04)] transition hover:bg-[#e3efe0]"
            @click="clearQtyInput"
          >
            C
          </button>
        </div>

        <button class="inline-flex h-[40px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#30543e] text-[13px] font-semibold text-white shadow-[0_10px_18px_rgba(48,84,62,0.16)] transition hover:bg-[#274536]" @click="salesStore.openCreditModal(props.activeBranch)">
          <CreditCardIcon class="h-4 w-4" />
          Apply Credit
        </button>

        <button class="rounded-[10px] bg-[#2f6b4d] px-2 py-1.5 text-white shadow-[0_8px_14px_rgba(47,107,77,0.14)] transition hover:bg-[#27593f]" @click="saveAndPrint">
          <div class="flex items-center justify-center gap-1.5 text-[10px] font-semibold">
            <PrinterIcon class="h-3 w-3" />
            Save &amp; Print Receipt
          </div>
          <div class="mt-0.5 text-center text-[6px] font-semibold uppercase tracking-[0.12em] text-[#dcebdd]">Ready for thermal printing</div>
        </button>
      </div>
    </section>

    <CreditPortalModal
      :open="creditModalOpen"
      :credit-form="creditForm"
      :credited-amount="money(currentOrderTotal, false)"
      :outstanding-amount="money(currentOrderTotal, false)"
      :customer-options="customerOptions"
      @cancel="salesStore.closeCreditModal()"
      @save="applyCredit"
      @update-field="salesStore.updateCreditField"
    />

    <AddCustomerModal
      :open="customerModalOpen"
      :customer-form="customerForm"
      @cancel="salesStore.closeCustomerModal()"
      @save="saveCustomerRecord"
      @update-field="salesStore.updateCustomerField"
    />

    <ReceivePaymentModal
      :open="paymentModalOpen"
      :payment-form="paymentForm"
      :customer-options="paymentCustomerOptions"
      :customer-balances="paymentOutstandingMap"
      :current-outstanding="selectedPaymentOutstanding"
      @cancel="salesStore.closePaymentModal()"
      @save="savePaymentRecord"
      @update-field="salesStore.updatePaymentField"
      @select-customer="salesStore.selectPaymentCustomer"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import {
  BackspaceIcon,
  BanknotesIcon,
  CreditCardIcon,
  PrinterIcon,
  TrashIcon,
  UserPlusIcon,
} from '@heroicons/vue/24/outline'
import { storeToRefs } from 'pinia'
import { toast } from 'vue3-toastify'
import AddCustomerModal from '@/components/Sales/AddCustomerModal.vue'
import InventoryEntryGrid from '@/components/Common/InventoryEntryGrid.vue'
import CreditPortalModal from '@/components/Sales/CreditPortalModal.vue'
import ReceivePaymentModal from '@/components/Sales/ReceivePaymentModal.vue'
import { useInventoryStore } from '@/stores/inventory'
import { useSalesStore } from '@/stores/sales'
import { getApiMessage } from '@/services/api/client'
import { formatAmount } from '@/utils/formatters'

const props = defineProps({
  activeBranch: {
    type: String,
    required: true,
  },
  cashier: {
    type: String,
    required: true,
  },
})

const salesStore = useSalesStore()
const inventory = useInventoryStore()
const {
  creditForm,
  customerForm,
  paymentForm,
  creditModalOpen,
  customerModalOpen,
  paymentModalOpen,
  currentOrderId,
  customerOptions,
  paymentCustomerOptions,
  paymentOutstandingMap,
} = storeToRefs(salesStore)

const keypadDigits = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const salesPricingColumns = [{ key: 'unitPrice', label: 'Price', align: 'right', editable: false }]
const productSuggestionRowId = ref(null)
const highlightedProductIndex = ref(0)
const productInputRefs = ref({})
const makeRow = (index) => ({
  id: index + 1,
  query: '',
  sku: '',
  name: '',
  detail: '',
  qty: '',
  unitPrice: 0,
  maxQty: 0,
})

const orderRows = reactive(Array.from({ length: 10 }, (_, index) => makeRow(index)))
const activeQtyRowId = ref(1)

const branchProducts = computed(() => {
  const branch = inventory.branches[props.activeBranch]
  return (branch?.stock || []).map((item) => ({
    name: item.name,
    sku: item.sku,
    detail: `SKU: ${item.sku}`,
    unitPrice: Number(item.sellingPricePerKg || 0),
    maxQty: Number(item.qtyKg || 0),
  }))
})

const findRow = (rowId) => orderRows.find((entry) => entry.id === rowId) || null
const stockLimitForSku = (sku) => Number(branchProducts.value.find((product) => product.sku === sku)?.maxQty || 0)
const allocatedQtyForSku = (sku, excludingRowId = null) => orderRows.reduce((sum, row) => {
  if (!row.sku || row.sku !== sku || row.id === excludingRowId) return sum
  return sum + Number(row.qty || 0)
}, 0)
const availableQtyForRow = (row) => {
  if (!row?.sku) return 0
  return Math.max(stockLimitForSku(row.sku) - allocatedQtyForSku(row.sku, row.id), 0)
}
const syncRowLimit = (row) => {
  if (!row) return
  row.maxQty = availableQtyForRow(row)
}
const syncAllRowLimits = () => {
  orderRows.forEach((row) => {
    if (!row.sku) {
      row.maxQty = 0
      return
    }
    row.maxQty = availableQtyForRow(row)
    if (Number(row.qty || 0) > row.maxQty) {
      row.qty = row.maxQty > 0 ? String(row.maxQty) : ''
    }
  })
}

watch(() => props.activeBranch, async () => {
  await salesStore.initialize(props.activeBranch, true)
  resetBasket(false)
}, { immediate: true })

const setActiveQtyRow = (rowId) => {
  activeQtyRowId.value = rowId
}

const activateProductRow = (rowId) => {
  setActiveQtyRow(rowId)
  productSuggestionRowId.value = rowId
  highlightedProductIndex.value = 0
}

const closeProductSuggestions = (rowId) => {
  if (productSuggestionRowId.value === rowId) {
    productSuggestionRowId.value = null
    highlightedProductIndex.value = 0
  }
}

const filteredProducts = (query) => {
  const needle = String(query || '').trim().toLowerCase()
  const source = branchProducts.value.filter((product) => product.maxQty > 0)
  const products = !needle
    ? source
    : source.filter((product) => `${product.name} ${product.sku}`.toLowerCase().includes(needle))
  return products.slice(0, 8)
}

const matchProduct = (value) => {
  const needle = String(value || '').trim().toLowerCase()
  return branchProducts.value.find((product) => product.maxQty > 0 && (product.name.toLowerCase() === needle || product.sku.toLowerCase() === needle))
    || branchProducts.value.find((product) => product.maxQty > 0 && `${product.name} ${product.sku}`.toLowerCase().includes(needle))
    || null
}

const selectedRow = computed(() => findRow(activeQtyRowId.value))
const selectedRowLimitLabel = computed(() => {
  const maxQty = Number(selectedRow.value?.maxQty || 0)
  return maxQty > 0 ? formatAmount(maxQty) : '0'
})

const focusNextProductRow = async (rowId) => {
  const nextRowId = Math.min(rowId + 1, orderRows.length)
  await nextTick()
  const input = productInputRefs.value[nextRowId]
  if (input?.focus) input.focus()
}

const clearRow = (row) => {
  row.query = ''
  row.sku = ''
  row.name = ''
  row.detail = ''
  row.qty = ''
  row.unitPrice = 0
  row.maxQty = 0
}

const updateRowQuery = (rowId, value) => {
  const row = findRow(rowId)
  if (!row) return
  activateProductRow(rowId)
  row.query = String(value || '')
  if (!row.query.trim()) {
    clearRow(row)
    syncAllRowLimits()
  }
}

const sanitizeQty = (value) => String(value || '').replace(/\D/g, '').replace(/^0+(?=\d)/, '')
const clampQty = (row, value) => {
  const sanitized = sanitizeQty(value)
  syncRowLimit(row)
  if (!sanitized || Number(row?.maxQty || 0) <= 0) return ''
  return String(Math.min(Number(sanitized), Number(row.maxQty || 0)))
}

const commitRowProduct = async (rowId, value) => {
  const row = findRow(rowId)
  if (!row) return
  const product = matchProduct(value)
  if (!product) {
    toast.error('Item is unavailable or out of stock.')
    return
  }

  row.query = product.name
  row.sku = product.sku
  row.name = product.name
  row.detail = product.detail
  row.unitPrice = product.unitPrice
  syncRowLimit(row)

  if (row.maxQty <= 0) {
    row.qty = ''
    closeProductSuggestions(rowId)
    toast.error('Selected item is out of stock.')
    return
  }

  if (!row.qty) row.qty = '1'
  row.qty = clampQty(row, row.qty)
  syncAllRowLimits()
  closeProductSuggestions(rowId)
  await focusNextProductRow(rowId)
}

const updateGridCell = (rowId, key, value) => {
  if (key === 'qty') {
    updateRowQty(rowId, value)
  }
}

const updateRowQty = (rowId, value) => {
  const row = findRow(rowId)
  if (!row) return
  activeQtyRowId.value = rowId
  row.qty = clampQty(row, value)
  syncAllRowLimits()
}

const appendQtyDigit = (digit) => {
  const row = findRow(activeQtyRowId.value)
  if (!row) return
  row.qty = clampQty(row, `${row.qty || ''}${digit}`)
  syncAllRowLimits()
}

const removeQtyDigit = () => {
  const row = findRow(activeQtyRowId.value)
  if (!row) return
  row.qty = row.qty ? row.qty.slice(0, -1) : ''
  syncAllRowLimits()
}

const clearQtyInput = () => {
  const row = findRow(activeQtyRowId.value)
  if (!row) return
  clearRow(row)
  syncAllRowLimits()
}

const orderItems = computed(() => orderRows
  .filter((row) => row.sku && Number(row.qty || 0) > 0)
  .map((row) => ({
    sku: row.sku,
    name: row.name,
    detail: row.detail,
    qty: Number(row.qty || 0),
    unitPrice: Number(row.unitPrice || 0),
  })))

const currentOrderSubtotal = computed(() => orderItems.value.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0))
const currentOrderTax = computed(() => 0)
const currentOrderTotal = computed(() => currentOrderSubtotal.value + currentOrderTax.value)
const selectedQtyDisplay = computed(() => selectedRow.value?.qty || '0')
const selectedPaymentOutstanding = computed(() => {
  const customerId = String(paymentForm.value.customerId || '').trim()
  if (!customerId) return 0
  return Number(paymentOutstandingMap.value[customerId] || 0)
})

const money = (value, prefix = true) => prefix ? `UGX ${formatAmount(value)}` : formatAmount(value)

const resetBasket = (showToast = true) => {
  orderRows.splice(0, orderRows.length, ...Array.from({ length: 10 }, (_, index) => makeRow(index)))
  activeQtyRowId.value = 1
  productSuggestionRowId.value = null
  highlightedProductIndex.value = 0
  syncAllRowLimits()
  if (showToast) toast.info('Order grid cleared.')
}

const openCustomerModal = () => {
  salesStore.resetCustomerForm()
  salesStore.openCustomerModal(props.activeBranch)
}

const openPaymentModal = () => {
  salesStore.resetPaymentForm()
  salesStore.openPaymentModal(props.activeBranch)
}

const saveCustomerRecord = async () => {
  try {
    const customer = await salesStore.saveCustomer()
    if (!customer) {
      toast.error('Enter the customer details before saving.')
      return
    }
    toast.success(`${customer.fullName} saved to customers.`)
  } catch (error) {
    toast.error(getApiMessage(error, 'Unable to save customer.'))
  }
}

const savePaymentRecord = async () => {
  const customerId = String(paymentForm.value.customerId || '').trim()
  const customerName = String(paymentForm.value.customerName || '').trim()
  const amount = Number(paymentForm.value.amount || 0)
  const outstanding = Number(paymentOutstandingMap.value[customerId] || 0)

  if (!customerId || !customerName || amount <= 0) {
    toast.error('Enter customer name and amount before saving payment.')
    return
  }

  if (!outstanding) {
    toast.error('Selected customer has no unpaid credit balance.')
    return
  }

  if (amount > outstanding) {
    toast.error(`Amount exceeds unpaid balance of UGX ${formatAmount(outstanding)}.`)
    return
  }

  try {
    const payment = await salesStore.saveReceivedPayment({ branch: props.activeBranch })
    if (!payment) {
      toast.error('Unable to save payment.')
      return
    }
    toast.success(`Payment of UGX ${formatAmount(payment.amount)} recorded.`)
  } catch (error) {
    toast.error(getApiMessage(error, 'Unable to save payment.'))
  }
}

const validateOrderAgainstInventory = () => {
  const totalsBySku = orderItems.value.reduce((map, item) => {
    map[item.sku] = (map[item.sku] || 0) + Number(item.qty || 0)
    return map
  }, {})

  const invalidEntry = Object.entries(totalsBySku).find(([sku, qty]) => qty > stockLimitForSku(sku))
  if (!invalidEntry) return null

  const [sku, qty] = invalidEntry
  const product = branchProducts.value.find((entry) => entry.sku === sku)
  return {
    sku,
    name: product?.name || sku,
    enteredQty: Number(qty || 0),
    availableQty: stockLimitForSku(sku),
  }
}

const saveAndPrint = async () => {
  if (!orderItems.value.length) {
    toast.error('Add at least one item before saving the receipt.')
    return
  }

  const invalidEntry = validateOrderAgainstInventory()
  if (invalidEntry) {
    toast.error(`${invalidEntry.name} exceeds available stock. Entered ${formatAmount(invalidEntry.enteredQty)} but only ${formatAmount(invalidEntry.availableQty)} is available.`)
    return
  }

  try {
    const transaction = await salesStore.saveCashTransaction({
      branch: props.activeBranch,
      cashier: props.cashier,
      openReceipt: true,
      items: orderItems.value,
    })
    if (!transaction) {
      toast.error('Unable to save sale to backend.')
      return
    }
    resetBasket(false)
    toast.success(`${transaction.id} is ready in the receipt popup.`)
  } catch (error) {
    toast.error(getApiMessage(error, 'Unable to save sale to backend.'))
  }
}

const applyCredit = async () => {
  if (!orderItems.value.length) {
    toast.error('Add at least one item before posting a credit sale.')
    return
  }

  const invalidEntry = validateOrderAgainstInventory()
  if (invalidEntry) {
    toast.error(`${invalidEntry.name} exceeds available stock. Entered ${formatAmount(invalidEntry.enteredQty)} but only ${formatAmount(invalidEntry.availableQty)} is available.`)
    return
  }

  try {
    const transaction = await salesStore.saveCreditTransaction({
      branch: props.activeBranch,
      cashier: props.cashier,
      items: orderItems.value,
    })
    if (!transaction) {
      toast.error('Select an existing customer and try again.')
      return
    }
    resetBasket(false)
    toast.success(`${transaction.id} posted to the credit ledger.`)
  } catch (error) {
    toast.error(getApiMessage(error, 'Unable to post credit sale.'))
  }
}
</script>








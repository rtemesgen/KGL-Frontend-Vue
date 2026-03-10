<template>
  <div class="space-y-2">
    <div class="grid rounded-[14px] border border-[#d9e4db] bg-[#fcfdf9] shadow-[0_8px_18px_rgba(40,70,54,0.07)] xl:grid-cols-[minmax(0,1.95fr)_minmax(220px,0.62fr)]">
      <section class="flex flex-col border-b border-[#d9e4db] xl:border-b-0 xl:border-r">
        <header class="flex items-center justify-between gap-3 border-b border-[#d9e4db] bg-[linear-gradient(90deg,#edf4ec,#f3eadc)] px-2 py-2">
          <div class="flex items-center gap-2">
            <h2 class="m-0 text-[15px] font-semibold tracking-[-0.04em] text-[#22392e]">Purchase Items</h2>
            <select v-model="supplierId" class="h-9 min-w-[220px] rounded-[11px] border border-[#d3dfd5] bg-white px-3 text-[12px] text-[#22392e] outline-none">
              <option value="">Select Supplier</option>
              <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">{{ supplier.name }}</option>
            </select>
          </div>

          <button class="text-[12px] font-semibold text-[#1f6be8] transition hover:text-[#1553bf]" @click="procurement.openItemModal()">+ Add New Item</button>
        </header>

        <InventoryEntryGrid
          :rows="orderRows"
          :products="branchProducts"
          :active-row-id="activeRowId"
          :pricing-columns="pricingColumns"
          template-columns="92px minmax(0,1.5fr) 84px 92px 110px 110px"
          total-value-key="costPrice"
          id-header="Item ID"
          item-header="Item Description"
          qty-header="Qty"
          total-header="Total"
          query-placeholder="Search by item name or SKU"
          :money-formatter="money"
          :row-identifier="(row) => row.sku || `#ROW-${row.id}`"
          @activate-row="setActiveRow"
          @update-query="({ rowId, value }) => updateRowQuery(rowId, value)"
          @commit-product="({ rowId, product }) => commitRowProduct(rowId, product)"
          @update-cell="({ rowId, key, value }) => updateGridCell(rowId, key, value)"
        />

        <footer class="mt-auto border-t border-[#d9e4db] bg-[#f8faf7] px-2 py-2">
          <div class="flex items-center justify-between gap-4">
            <div class="grid flex-1 gap-3 md:grid-cols-2">
              <label class="block">
                <span class="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5c7368]">Amount Paid</span>
                <input :value="amountPaid" type="text" inputmode="decimal" class="h-[38px] w-full rounded-[11px] border border-[#d3dfd5] bg-white px-3 text-[12px] font-semibold text-[#1f6be8] outline-none" placeholder="0.00" @focus="setActiveRow(activeRowId)" @input="updateAmountPaid($event.target.value)" />
              </label>

              <div>
                <div class="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5c7368]">Amount Remaining</div>
                <div class="flex h-[38px] items-center rounded-[11px] border border-dashed border-[#cbd8cf] bg-[#f5f8f5] px-3 text-[14px] font-semibold text-[#3f5568]">{{ money(amountRemaining) }}</div>
              </div>
            </div>

            <div class="w-[180px] space-y-0 text-right text-[#5c7368] leading-tight">
              <div class="flex items-center justify-between text-[10px]"><span>Grand Total</span><span>{{ money(grandTotal) }}</span></div>
              <div class="pt-0 text-[22px] font-semibold tracking-[-0.05em] text-[#1f6be8]">{{ money(grandTotal) }}</div>
            </div>
          </div>

          <button class="mt-3 flex h-[40px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#2f6b4d] text-[12px] font-semibold text-white shadow-[0_10px_18px_rgba(48,84,62,0.16)] transition hover:bg-[#274536]" @click="saveAndPrint">
            <PrinterIcon class="h-4 w-4" />
            Save &amp; Print Receipt
          </button>
        </footer>
      </section>

      <section class="flex flex-col justify-between bg-[#fbfcf8]">
        <header class="flex items-center gap-2 border-b border-[#d9e4db] bg-[linear-gradient(90deg,#edf4ec,#f8f3e7)] px-1.5 py-1.5">
          <div class="flex h-6 w-6 items-center justify-center rounded-lg bg-[#dce8f8] text-[#1f6be8]">
            <CalculatorIcon class="h-3 w-3" />
          </div>
          <h2 class="m-0 text-[14px] font-semibold tracking-[-0.04em] text-[#22392e]">Input Helper</h2>
          <span class="ml-auto rounded-[8px] bg-[#eef5eb] px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-[#30543e]">Min Qty: 1000kg</span>
        </header>

        <div class="space-y-3 px-2 py-2">
          <div class="grid grid-cols-3 gap-1.5">
            <button v-for="digit in keypadDigits" :key="digit" class="flex h-10 items-center justify-center rounded-[10px] border border-[#d3dfd5] bg-white text-[15px] font-semibold text-[#22392e] shadow-[0_4px_10px_rgba(40,70,54,0.04)] transition hover:border-[#bfd0c3] hover:bg-[#f7faf8]" @click="appendQtyDigit(digit)">{{ digit }}</button>
            <button class="flex h-10 items-center justify-center rounded-[10px] border border-[#ead2c9] bg-[#fff5f1] text-[#c45b36] shadow-[0_4px_10px_rgba(40,70,54,0.04)] transition hover:bg-[#ffece5]" @click="removeQtyDigit"><BackspaceIcon class="h-4 w-4" /></button>
            <button class="flex h-10 items-center justify-center rounded-[10px] border border-[#d3dfd5] bg-white text-[15px] font-semibold text-[#22392e] shadow-[0_4px_10px_rgba(40,70,54,0.04)] transition hover:border-[#bfd0c3] hover:bg-[#f7faf8]" @click="appendQtyDigit(0)">0</button>
            <button class="flex h-10 items-center justify-center rounded-[10px] border border-[#d6e2d7] bg-[#edf4ec] text-[12px] font-semibold text-[#30543e] shadow-[0_4px_10px_rgba(40,70,54,0.04)] transition hover:bg-[#e3efe0]" @click="clearQtyInput">CLR</button>
          </div>

          <div class="rounded-[12px] border border-[#d9e4db] bg-white p-3 shadow-[0_4px_10px_rgba(40,70,54,0.04)]">
            <div class="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5c7368]">Supplier's Remaining Balance</div>
            <div class="mt-2 flex items-center justify-between">
              <div class="text-[24px] font-semibold tracking-[-0.05em] text-[#0f172a]">{{ money(supplierOutstanding) }}</div>
              <span class="rounded-full bg-[#f4e7ad] px-2 py-1 text-[10px] font-semibold text-[#9a7b13]">{{ supplierStatus }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <ProcurementAddItemModal :open="itemModalOpen" :form="itemForm" @cancel="closeItemModal" @save="saveNewItem" @update-field="updateItemField" />
    <ProcurementReceiptModal
      :open="receiptModalOpen"
      :receipt="activeReceipt"
      :supplier="activeReceiptSupplier"
      :supplier-outstanding="activeReceiptOutstanding"
      @close="procurement.closeReceipt()"
      @print="printReceipt"
      @export="exportReceiptPdf"
    />
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { toast } from 'vue3-toastify'
import { BackspaceIcon, CalculatorIcon, PrinterIcon } from '@heroicons/vue/24/outline'
import InventoryEntryGrid from '@/components/Common/InventoryEntryGrid.vue'
import ProcurementAddItemModal from '@/components/Procurement/ProcurementAddItemModal.vue'
import ProcurementReceiptModal from '@/components/Procurement/ProcurementReceiptModal.vue'
import { useProcurementStore } from '@/stores/procurement'
import { getApiMessage } from '@/services/api/client'
import { exportReportToPdf } from '@/utils/exportPdf'
import { formatAmount } from '@/utils/formatters'

const props = defineProps({
  activeBranch: { type: String, required: true },
  staffName: { type: String, required: true },
})

const procurement = useProcurementStore()
const { itemModalOpen, receiptModalOpen, activeReceipt } = storeToRefs(procurement)
const keypadDigits = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const pricingColumns = [
  { key: 'costPrice', label: 'Cost', align: 'right', editable: true, placeholder: '0' },
  { key: 'sellingPrice', label: 'Selling Price', align: 'right', editable: true, placeholder: '0' },
]
const supplierId = ref('')
const amountPaid = ref('')
const activeRowId = ref(1)
const MIN_PURCHASE_QTY_KG = 1000

const makeRow = (index) => ({ id: index + 1, query: '', sku: '', name: '', category: '', unit: 'kg', minQty: 0, qty: '', costPrice: '', sellingPrice: '' })
const orderRows = reactive(Array.from({ length: 8 }, (_, index) => makeRow(index)))
const itemForm = reactive({ name: '', category: '', unit: 'kg', costPrice: '', sellingPrice: '', minQty: '' })

const suppliers = computed(() => procurement.suppliersByBranch(props.activeBranch))
const branchProducts = computed(() => procurement.catalogItemsByBranch(props.activeBranch).map((item) => ({
  sku: item.sku,
  name: item.name,
  category: item.category,
  unit: item.unit,
  minQty: item.minQty,
  maxQty: Number(item.qty || 0),
  costPrice: Number(item.costPrice || 0),
  sellingPrice: Number(item.sellingPrice || 0),
})))
const supplierOutstanding = computed(() => supplierId.value ? procurement.supplierOutstanding(props.activeBranch, supplierId.value) : 0)
const supplierStatus = computed(() => supplierOutstanding.value > 0 ? 'Pending' : 'Clear')
const orderItems = computed(() => orderRows
  .filter((row) => row.sku && Number(row.qty || 0) > 0 && Number(row.costPrice || 0) > 0 && Number(row.sellingPrice || 0) > 0)
  .map((row) => ({
    sku: row.sku,
    name: row.name,
    category: row.category,
    unit: row.unit,
    minQty: row.minQty,
    qty: Number(row.qty || 0),
    costPrice: Number(row.costPrice || 0),
    sellingPrice: Number(row.sellingPrice || 0),
  })))
const grandTotal = computed(() => orderItems.value.reduce((sum, item) => sum + (item.qty * item.costPrice), 0))
const amountRemaining = computed(() => Math.max(grandTotal.value - Number(amountPaid.value || 0), 0))
const activeReceiptSupplier = computed(() => suppliers.value.find((supplier) => supplier.id === activeReceipt.value?.supplierId) || null)
const activeReceiptOutstanding = computed(() => activeReceipt.value ? procurement.supplierOutstanding(activeReceipt.value.branch, activeReceipt.value.supplierId) : 0)

const money = (value, prefix = true) => prefix ? `USh ${formatAmount(value)}` : formatAmount(value)
const sanitizeNumber = (value) => String(value || '').replace(/[^\d.]/g, '')
const setActiveRow = (rowId) => { activeRowId.value = rowId }
const findRow = (rowId) => orderRows.find((row) => row.id === rowId) || null

const updateRowQuery = (rowId, value) => {
  const row = findRow(rowId)
  if (!row) return
  row.query = String(value || '')
  if (!row.query.trim()) Object.assign(row, makeRow(row.id - 1))
}

const commitRowProduct = (rowId, product) => {
  const row = findRow(rowId)
  if (!row || !product) return
  row.query = product.name
  row.sku = product.sku
  row.name = product.name
  row.category = product.category || 'General'
  row.unit = product.unit || 'kg'
  row.minQty = Number(product.minQty || 0)
  row.costPrice = String(product.costPrice || '')
  row.sellingPrice = String(product.sellingPrice || '')
  if (!row.qty) row.qty = String(MIN_PURCHASE_QTY_KG)
}

const updateGridCell = (rowId, key, value) => {
  const row = findRow(rowId)
  if (!row) return
  if (key === 'qty') {
    row.qty = sanitizeNumber(value)
    return
  }
  if (key === 'costPrice' || key === 'sellingPrice') row[key] = sanitizeNumber(value)
}

const appendQtyDigit = (digit) => {
  const row = findRow(activeRowId.value)
  if (!row) return
  row.qty = `${row.qty || ''}${digit}`
}
const removeQtyDigit = () => {
  const row = findRow(activeRowId.value)
  if (!row) return
  row.qty = row.qty ? row.qty.slice(0, -1) : ''
}
const clearQtyInput = () => {
  const row = findRow(activeRowId.value)
  if (!row) return
  Object.assign(row, makeRow(row.id - 1))
}
const updateAmountPaid = (value) => {
  const clean = sanitizeNumber(value)
  const numeric = Number(clean || 0)
  amountPaid.value = clean ? String(Math.min(numeric, grandTotal.value)) : ''
}
const resetRows = () => {
  orderRows.splice(0, orderRows.length, ...Array.from({ length: 8 }, (_, index) => makeRow(index)))
  activeRowId.value = 1
  amountPaid.value = ''
}

const closeItemModal = () => {
  procurement.closeItemModal()
  Object.assign(itemForm, { name: '', category: '', unit: 'kg', costPrice: '', sellingPrice: '', minQty: '' })
}
const updateItemField = (field, value) => { itemForm[field] = value }
const saveNewItem = async () => {
  try {
    const item = await procurement.saveCatalogItem(props.activeBranch, itemForm)
    if (!item) {
      toast.error('Enter item name before saving.')
      return
    }
    toast.success(`${item.name} added to inventory.`)
    closeItemModal()
  } catch (error) {
    toast.error(getApiMessage(error, 'Unable to save inventory item.'))
  }
}

const saveAndPrint = async () => {
  if (!supplierId.value) {
    toast.error('Select a supplier before saving.')
    return
  }
  if (!orderItems.value.length) {
    toast.error('Add at least one item before saving the receipt.')
    return
  }

  const invalidQtyEntry = orderItems.value.find((item) => Number(item.qty || 0) < MIN_PURCHASE_QTY_KG)
  if (invalidQtyEntry) {
    toast.error(`${invalidQtyEntry.name} must be at least ${MIN_PURCHASE_QTY_KG} kg.`)
    return
  }

  try {
    const record = await procurement.savePurchase({
      branch: props.activeBranch,
      supplierId: supplierId.value,
      items: orderItems.value,
      amountPaid: amountPaid.value,
      createdBy: props.staffName,
    })
    if (!record) {
      toast.error('Unable to save the procurement record.')
      return
    }
    toast.success(`${record.receiptId} saved.`)
    resetRows()
  } catch (error) {
    toast.error(getApiMessage(error, 'Unable to save the procurement record.'))
  }
}

const buildReceiptPrintHtml = (receipt, supplier, supplierOutstanding) => {
  const rows = receipt.items.map((item) => `
    <tr>
      <td>${item.name}</td>
      <td style="text-align:center;">${item.qty}</td>
      <td style="text-align:right;">${money(item.costPrice)}</td>
      <td style="text-align:right; font-weight:700;">${money(item.total)}</td>
    </tr>
  `).join('')

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${receipt.receiptId}</title>
      <style>
        body { font-family: Inter, Arial, sans-serif; margin: 0; background: #f4f7f2; color: #0f172a; }
        .page { width: 520px; margin: 12px auto; background: #fff; border: 1px solid #d8decf; border-radius: 12px; overflow: hidden; }
        .head { display:flex; justify-content:space-between; gap:16px; padding:16px 18px; border-bottom:1px solid #d8decf; background:#faf8f1; }
        .title { font-size: 24px; font-weight: 700; color: #1f6be8; margin: 0 0 6px; }
        .muted { color:#64748b; font-size:11px; }
        .section { padding: 16px 18px; }
        .section-title { color:#1f6be8; font-size:10px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; margin:0 0 10px; }
        .supplier-card { display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:12px; background:#fafcf8; border:1px solid #d8decf; border-radius:12px; }
        table { width:100%; border-collapse:collapse; border:1px solid #d8decf; border-radius:12px; overflow:hidden; }
        thead { background:#eef1e6; }
        th, td { padding:8px 10px; font-size:11px; border-top:1px solid #e3e7da; }
        th { text-align:left; font-weight:700; color:#334155; border-top:none; }
        .totals { width:250px; margin-left:auto; margin-top:14px; }
        .totals-row { display:flex; justify-content:space-between; padding:5px 0; font-size:11px; color:#334155; }
        .grand { border-top:1px solid #d8decf; padding-top:8px; font-size:14px; font-weight:700; }
        .grand strong { color:#1f6be8; }
        .paid { color:#16a34a; }
        .remaining { display:flex; justify-content:space-between; background:#f8faf7; padding:10px; border-radius:10px; font-weight:700; font-size:11px; }
        .footer { padding: 14px 18px 18px; text-align:center; color:#64748b; font-size:11px; }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="head">
          <div>
            <h1 class="title">Procurement Receipt</h1>
            <div class="muted">Receipt #: ${receipt.receiptId}</div>
          </div>
          <div style="text-align:right;">
            <div class="muted" style="font-weight:700; text-transform:uppercase; letter-spacing:.14em;">Issue Date</div>
            <div style="font-size:16px; font-weight:700; margin-top:4px;">${new Date(receipt.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
          </div>
        </div>
        <div class="section">
          <div class="section-title">Supplier Information</div>
          <div class="supplier-card">
            <div>
              <div class="muted" style="font-weight:700; text-transform:uppercase; letter-spacing:.12em;">Company Name</div>
              <div style="font-size:16px; font-weight:700; margin-top:6px;">${receipt.supplierName}</div>
            </div>
            <div>
              <div class="muted" style="font-weight:700; text-transform:uppercase; letter-spacing:.12em;">Contact Details</div>
              <div style="margin-top:6px; font-size:12px;">${supplier?.phone || '-'}</div>
              <div style="font-size:12px;">${supplier?.email || '-'}</div>
            </div>
          </div>
        </div>
        <div class="section" style="padding-top:0;">
          <div class="section-title">Procured Items</div>
          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Unit Cost</th>
                <th style="text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="totals">
            <div class="totals-row"><span>Subtotal</span><span>${money(receipt.total)}</span></div>
            <div class="totals-row"><span>Tax (0%)</span><span>${money(0)}</span></div>
            <div class="totals-row grand"><span>Grand Total</span><strong>${money(receipt.total)}</strong></div>
            <div class="totals-row paid"><span>Amount Paid</span><span>-${money(receipt.amountPaid)}</span></div>
            <div class="remaining"><span>Amount Remaining</span><span>${money(receipt.amountRemaining)}</span></div>
            <div class="totals-row" style="font-style:italic;"><span>Supplier Balance</span><span>${money(supplierOutstanding)}</span></div>
          </div>
        </div>
        <div class="footer">Thank you for your business</div>
      </div>
    </body>
  </html>`
}

const printReceipt = () => {
  if (!activeReceipt.value) return
  const win = window.open('', '_blank', 'width=680,height=780')
  if (!win) {
    toast.error('Unable to open print window.')
    return
  }
  win.document.open()
  win.document.write(buildReceiptPrintHtml(activeReceipt.value, activeReceiptSupplier.value, activeReceiptOutstanding.value))
  win.document.close()
}

const exportReceiptPdf = async () => {
  if (!activeReceipt.value) return
  await exportReportToPdf({
    title: `Procurement Receipt - ${activeReceipt.value.receiptId}`,
    filename: `${activeReceipt.value.receiptId}`,
    meta: { Branch: activeReceipt.value.branch, Supplier: activeReceipt.value.supplierName, Receipt: activeReceipt.value.receiptId },
    columns: [
      { key: 'item', label: 'Item' },
      { key: 'qty', label: 'Qty', width: 70 },
      { key: 'unitCost', label: 'Unit Cost', align: 'right', width: 100 },
      { key: 'total', label: 'Total', align: 'right', width: 100 },
    ],
    rows: activeReceipt.value.items.map((item) => ({ item: item.name, qty: item.qty, unitCost: money(item.costPrice), total: money(item.total) })),
    totals: { Total: money(activeReceipt.value.total), Paid: money(activeReceipt.value.amountPaid), Balance: money(activeReceipt.value.amountRemaining) },
  })
  toast.success('Procurement PDF downloaded.')
}
</script>







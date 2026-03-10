<template>
  <div
    v-if="open && receipt"
    class="fixed inset-0 z-[70] grid place-items-center bg-[rgba(15,23,42,0.24)] p-2 [backdrop-filter:blur(2px)]"
    @click.self="$emit('close')"
  >
    <section class="receipt-shell no-scrollbar flex max-h-[88vh] w-full max-w-[760px] flex-col overflow-auto rounded-[16px] border border-[#d3dfd5] bg-[#fbfcf8] shadow-[0_16px_34px_rgba(40,70,54,0.18)]">
      <header class="flex items-center justify-between border-b border-[#d3dfd5] bg-[linear-gradient(90deg,#edf4ec,#f3eadc)] px-3 py-2">
        <div>
          <p class="m-0 text-[8px] font-semibold uppercase tracking-[0.16em] text-[#5c7368]">Receipt Popup</p>
          <h3 class="m-0 text-[14px] font-semibold text-[#22392e]">{{ receipt.id }}</h3>
        </div>

        <div class="flex items-center gap-1.5">
          <button
            class="inline-flex h-7 items-center gap-1.5 rounded-lg border border-[#d3dfd5] bg-white px-2 text-[11px] font-semibold text-[#30543e] transition hover:bg-[#f4f8f4]"
            @click="shareReceipt"
          >
            <ShareIcon class="h-3 w-3" />
            Share
          </button>
          <button
            class="inline-flex h-7 items-center gap-1.5 rounded-lg bg-[#2f6b4d] px-2 text-[11px] font-semibold text-white transition hover:bg-[#27593f]"
            @click="printReceipt"
          >
            <PrinterIcon class="h-3 w-3" />
            Print
          </button>
          <button
            class="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#d3dfd5] bg-white text-[#64748b] transition hover:bg-[#f4f8f4]"
            @click="$emit('close')"
          >
            <XMarkIcon class="h-4 w-4" />
          </button>
        </div>
      </header>

      <div class="no-scrollbar overflow-auto p-2.5">
        <article ref="printArea" class="mx-auto max-w-[680px] overflow-hidden rounded-[16px] border border-[#d9e4db] bg-white shadow-[0_12px_24px_rgba(40,70,54,0.08)]">
          <div class="border-b border-[#dbe4dd] px-3 py-2.5">
            <div class="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
              <div class="flex items-center gap-2">
                <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2f6b4d] text-white shadow-[0_6px_12px_rgba(47,107,77,0.2)]">
                  <ReceiptPercentIcon class="h-4.5 w-4.5" />
                </div>
                <div>
                  <p class="m-0 text-[8px] font-semibold uppercase tracking-[0.16em] text-[#5c7368]">Karibu Grocery POS</p>
                  <h2 class="m-0 text-[18px] font-semibold tracking-[-0.03em] text-[#22392e]">{{ isCredit ? 'CREDIT SALE' : 'CASH SALE' }}</h2>
                </div>
              </div>

              <div class="grid gap-0.5 text-left md:text-right">
                <span class="inline-flex w-fit items-center justify-center rounded-full border px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] md:ml-auto"
                  :class="isCredit ? 'border-[#c5d7c9] bg-[#eef5eb] text-[#30543e]' : 'border-[#d9e6da] bg-[#f5faf3] text-[#2f6b4d]'"
                >
                  {{ isCredit ? 'Unpaid Balance' : 'Official Receipt' }}
                </span>
                <div class="text-[9px] text-[#6c7f75]">Receipt Number</div>
                <div class="text-[18px] font-semibold tracking-[-0.03em] text-[#22392e]">#{{ receipt.id }}</div>
              </div>
            </div>
          </div>

          <div class="border-b border-[#e0e8e2] bg-[#f8faf7] px-3 py-2.5">
            <div class="grid gap-2 md:grid-cols-3">
              <div class="rounded-xl border border-[#d9e4db] bg-white px-2.5 py-2">
                <div class="mb-1 flex items-center gap-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-[#5c7368]">
                  <CalendarDaysIcon class="h-3 w-3 text-[#2f6b4d]" />
                  Date
                </div>
                <div class="text-[13px] font-semibold text-[#22392e]">{{ formattedDate }}</div>
              </div>
              <div class="rounded-xl border border-[#d9e4db] bg-white px-2.5 py-2">
                <div class="mb-1 flex items-center gap-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-[#5c7368]">
                  <ClockIcon class="h-3 w-3 text-[#2f6b4d]" />
                  Time
                </div>
                <div class="text-[13px] font-semibold text-[#22392e]">{{ formattedTime }}</div>
              </div>
              <div class="rounded-xl border border-[#d9e4db] bg-white px-2.5 py-2">
                <div class="mb-1 flex items-center gap-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-[#5c7368]">
                  <UserIcon class="h-3 w-3 text-[#2f6b4d]" />
                  Cashier
                </div>
                <div class="text-[13px] font-semibold text-[#22392e]">{{ receipt.cashier }}</div>
              </div>
            </div>
          </div>

          <div v-if="isCredit" class="border-b border-[#e0e8e2] px-3 py-2.5">
            <div class="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-[#22392e]">
              <IdentificationIcon class="h-3.5 w-3.5 text-[#2f6b4d]" />
              Customer Information
            </div>
            <div class="grid gap-2">
              <div class="rounded-xl border border-[#d9e4db] bg-[#f8faf7] px-2.5 py-2">
                <div class="mb-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-[#5c7368]">Customer Name</div>
                <div class="text-[14px] font-semibold text-[#22392e]">{{ receipt.customerName }}</div>
              </div>
            </div>
          </div>

          <div class="px-3 py-2.5">
            <div class="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-[#22392e]">
              <Squares2X2Icon class="h-3.5 w-3.5 text-[#2f6b4d]" />
              Items Purchased
            </div>

            <div class="overflow-hidden rounded-[12px] border border-[#d9e4db]">
              <table class="min-w-full border-collapse">
                <thead class="bg-[#f8faf7] text-left text-[8px] font-semibold uppercase tracking-[0.12em] text-[#5c7368]">
                  <tr>
                    <th class="px-2.5 py-2">Description</th>
                    <th class="px-2.5 py-2 text-center">Qty</th>
                    <th class="px-2.5 py-2 text-right">Unit Price</th>
                    <th class="px-2.5 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in lineItems" :key="`${receipt.id}-${item.sku}`" class="border-t border-[#e5ece8] text-[#22392e]">
                    <td class="px-2.5 py-2">
                      <div class="text-[12px] font-semibold">{{ item.name }}</div>
                      <div class="mt-0.5 text-[9px] text-[#6c7f75]">{{ item.detail }}</div>
                    </td>
                    <td class="px-2.5 py-2 text-center text-[12px] font-semibold">{{ item.qty }}</td>
                    <td class="px-2.5 py-2 text-right text-[12px]">{{ money(item.unitPrice) }}</td>
                    <td class="px-2.5 py-2 text-right text-[12px] font-semibold">{{ money(item.amount) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="border-t border-[#e0e8e2] bg-[#fbfcfb] px-3 py-2.5">
            <div class="grid gap-2.5 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.78fr)]">
              <div class="space-y-2">
                <div v-if="!isCredit" class="rounded-xl border border-[#d9e4db] bg-[#f5faf3] px-2.5 py-2 text-[#4b6557]">
                  <div class="mb-1 flex items-center gap-1 text-[11px] font-semibold text-[#2f6b4d]">
                    <InformationCircleIcon class="h-3.5 w-3.5" />
                    Customer Copy
                  </div>
                  <p class="m-0 text-[10px] leading-4.5">Keep this receipt for your records and present it for returns or adjustments.</p>
                </div>

                <div v-if="isCredit" class="rounded-xl border border-[#eadbc1] bg-[#fbf5e8] px-2.5 py-2 text-[#8d6a2f]">
                  <div class="mb-1 text-[11px] font-semibold">Payment Terms</div>
                  <p class="m-0 text-[10px] leading-4.5">Balance due within 30 days. Credit ledger updates immediately.</p>
                </div>

                <div class="grid gap-2.5 text-[9px] text-[#5c7368] md:grid-cols-2">
                  <div>
                    <div class="mb-6 h-px bg-[#c5d3ca]"></div>
                    <div class="font-semibold uppercase tracking-[0.12em]">Customer Signature</div>
                  </div>
                  <div class="text-right">
                    <div class="mb-6 h-px bg-[#c5d3ca]"></div>
                    <div class="font-semibold uppercase tracking-[0.12em]">Authorized By</div>
                  </div>
                </div>
              </div>

              <div class="rounded-[14px] border border-[#d9e4db] bg-white p-2.5 shadow-[0_8px_18px_rgba(40,70,54,0.05)]">
                <div class="space-y-1.5 text-[12px] text-[#42556b]">
                  <div class="flex items-center justify-between">
                    <span>Subtotal</span>
                    <strong class="text-[#22392e]">{{ money(receiptSubtotal) }}</strong>
                  </div>
                  <div class="flex items-center justify-between">
                    <span>Tax</span>
                    <strong class="text-[#22392e]">{{ money(receiptTax) }}</strong>
                  </div>
                </div>

                <div class="my-2.5 h-px bg-[#dbe6dd]"></div>

                <div class="flex items-center justify-between text-[14px] font-semibold text-[#22392e]">
                  <span>Total Amount</span>
                  <span>{{ money(receiptTotal) }}</span>
                </div>

                <template v-if="isCredit">
                  <div class="mt-2.5 rounded-xl border border-[#d9e4db] bg-[#f8faf7] px-2.5 py-2 text-[12px] text-[#42556b]">
                    <div class="flex items-center justify-between">
                      <span>Down Payment</span>
                      <strong class="text-[#22392e]">{{ money(receiptDownPayment) }}</strong>
                    </div>
                  </div>
                  <div class="mt-2.5 rounded-xl border border-[#c5d7c9] bg-[#eef5eb] px-2.5 py-2">
                    <div class="flex items-center justify-between text-[#2f6b4d]">
                      <span class="text-[10px] font-semibold uppercase tracking-[0.08em]">Outstanding Balance</span>
                      <strong class="text-[18px] font-semibold">{{ money(receiptOutstanding) }}</strong>
                    </div>
                  </div>
                </template>

                <template v-else>
                  <div class="mt-2.5 rounded-xl border border-[#d9e4db] bg-[#f8faf7] px-2.5 py-2 text-[12px] text-[#42556b]">
                    <div class="flex items-center justify-between">
                      <span>Paid with Cash</span>
                      <strong class="text-[#22392e]">{{ money(receiptAmountPaid) }}</strong>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <div class="border-t border-[#e0e8e2] bg-[#f8faf7] px-3 py-2.5 text-center text-[#66788a]">
            <div class="mx-auto mb-2.5 h-12 w-[180px] max-w-full rounded-lg bg-white"
              :style="{ backgroundImage: 'repeating-linear-gradient(90deg, #22392e 0 2px, transparent 2px 4px)', backgroundPosition: 'center', backgroundRepeat: 'repeat-x', backgroundSize: '4px 38px' }"
            ></div>
            <div class="text-[8px] uppercase tracking-[0.18em] text-[#8d9bad]">Thank you for your business</div>
            <div class="mt-1 text-[10px]">{{ receipt.branch }} Branch | Karibu Grocery Management System</div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  CalendarDaysIcon,
  ClockIcon,
  IdentificationIcon,
  InformationCircleIcon,
  PrinterIcon,
  ReceiptPercentIcon,
  ShareIcon,
  Squares2X2Icon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import { toast } from 'vue3-toastify'
import { formatAmount, formatDateUS } from '@/utils/formatters'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  receipt: {
    type: Object,
    default: null,
  },
})

defineEmits(['close'])

const isCredit = computed(() => props.receipt?.type === 'credit')
const formattedDate = computed(() => formatDateUS(props.receipt?.createdAt))
const formattedTime = computed(() => {
  if (!props.receipt?.createdAt) return '-'
  const date = new Date(props.receipt.createdAt)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
})

const lineItems = computed(() => (props.receipt?.items || []).map((item) => ({
  ...item,
  qty: Number(item.qty || 0),
  unitPrice: Number(item.unitPrice || 0),
  amount: Number(item.qty || 0) * Number(item.unitPrice || 0),
})))
const receiptSubtotal = computed(() => lineItems.value.reduce((sum, item) => sum + item.amount, 0))
const receiptTax = computed(() => Number(props.receipt?.tax || 0))
const receiptTotal = computed(() => receiptSubtotal.value + receiptTax.value)
const receiptDownPayment = computed(() => Number(props.receipt?.downPayment || 0))
const receiptOutstanding = computed(() => Math.max(receiptTotal.value - receiptDownPayment.value, 0))
const receiptAmountPaid = computed(() => {
  if (isCredit.value) return receiptDownPayment.value
  return Math.max(Number(props.receipt?.amountPaid || 0), receiptTotal.value)
})

const money = (value) => `UGX ${formatAmount(value)}`

const shareReceipt = async () => {
  if (!props.receipt) return

  const text = [
    `Receipt: ${props.receipt.id}`,
    `Type: ${isCredit.value ? 'Credit Sale' : 'Cash Sale'}`,
    `Customer: ${props.receipt.customerName || 'Walk-in Customer'}`,
    `Total: ${money(receiptTotal.value)}`,
    `Branch: ${props.receipt.branch}`,
  ].join('\n')

  try {
    if (navigator.share) {
      await navigator.share({
        title: props.receipt.id,
        text,
      })
      return
    }

    await navigator.clipboard.writeText(text)
    toast.success('Receipt summary copied to clipboard.')
  } catch {
    toast.error('Unable to share the receipt from this browser.')
  }
}

const printReceipt = () => {
  if (!props.receipt) return

  const popup = window.open('', '_blank', 'width=860,height=760')
  if (!popup) {
    toast.error('Allow popups to print the receipt.')
    return
  }

  const itemsHtml = lineItems.value.map((item) => `
    <tr>
      <td>${item.name}<div style="font-size:9px;color:#6c7f75;margin-top:2px;">${item.detail || ''}</div></td>
      <td style="text-align:center;">${item.qty}</td>
      <td style="text-align:right;">${money(item.unitPrice)}</td>
      <td style="text-align:right;font-weight:600;">${money(item.amount)}</td>
    </tr>
  `).join('')

  popup.document.write(`<!doctype html>
<html>
  <head>
    <title>${props.receipt.id}</title>
    <style>
      body {
        margin: 0;
        padding: 16px;
        background: #f8faf7;
        font-family: 'Segoe UI', Arial, sans-serif;
        color: #22392e;
      }
      .sheet {
        max-width: 680px;
        margin: 0 auto;
        background: #fff;
        border: 1px solid #d9e4db;
        border-radius: 14px;
        overflow: hidden;
      }
      .head {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        padding: 12px;
        border-bottom: 1px solid #dbe4dd;
      }
      .band {
        background: #f8faf7;
        padding: 12px;
        border-bottom: 1px solid #e0e8e2;
      }
      .grid3 {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }
      .card {
        border: 1px solid #d9e4db;
        border-radius: 10px;
        background: #fff;
        padding: 8px 10px;
      }
      .label {
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: .12em;
        color: #5c7368;
        margin-bottom: 4px;
        font-weight: 600;
      }
      .value {
        font-size: 13px;
        font-weight: 600;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        padding: 8px 10px;
        border-top: 1px solid #e5ece8;
        text-align: left;
        font-size: 11px;
      }
      th {
        background: #f8faf7;
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: #5c7368;
      }
      .totals {
        width: 220px;
        margin-left: auto;
        border: 1px solid #d9e4db;
        border-radius: 12px;
        padding: 10px;
      }
      .row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font-size: 12px;
        margin-bottom: 6px;
      }
      .strong {
        font-weight: 600;
      }
      .big {
        font-size: 15px;
        font-weight: 700;
      }
      .accent {
        margin-top: 10px;
        border-radius: 10px;
        padding: 10px;
        font-weight: 600;
      }
      .soft { background: #eef5eb; color: #2f6b4d; border: 1px solid #c5d7c9; }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="head">
        <div>
          <div style="font-size:8px;text-transform:uppercase;letter-spacing:.16em;color:#5c7368;font-weight:600;">Karibu Grocery POS</div>
          <div style="font-size:18px;font-weight:700;">${isCredit.value ? 'CREDIT SALE' : 'CASH SALE'}</div>
          <div style="font-size:10px;color:#6c7f75;">Receipt #${props.receipt.id}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:8px;text-transform:uppercase;letter-spacing:.12em;color:#5c7368;font-weight:600;">${isCredit.value ? 'Unpaid Balance' : 'Official Receipt'}</div>
          <div style="font-size:10px;color:#6c7f75;margin-top:4px;">${formattedDate.value} ${formattedTime.value}</div>
          <div style="font-size:10px;color:#6c7f75;">${props.receipt.branch} Branch</div>
        </div>
      </div>
      <div class="band">
        <div class="grid3">
          <div class="card"><div class="label">Date</div><div class="value">${formattedDate.value}</div></div>
          <div class="card"><div class="label">Time</div><div class="value">${formattedTime.value}</div></div>
          <div class="card"><div class="label">Cashier</div><div class="value">${props.receipt.cashier}</div></div>
        </div>
      </div>
      ${isCredit.value ? `
        <div class="band">
          <div class="grid3" style="grid-template-columns:1fr;">
            <div class="card"><div class="label">Customer Name</div><div class="value">${props.receipt.customerName || 'Customer on Credit'}</div></div>
          </div>
        </div>
      ` : ''}
      <div style="padding:12px;">
        <table>
          <thead>
            <tr><th>Description</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Unit Price</th><th style="text-align:right;">Amount</th></tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
      </div>
      <div class="band">
        <div class="totals">
          <div class="row"><span>Subtotal</span><span class="strong">${money(receiptSubtotal.value)}</span></div>
          <div class="row"><span>Tax</span><span class="strong">${money(receiptTax.value)}</span></div>
          <div class="row big"><span>Total Amount</span><span>${money(receiptTotal.value)}</span></div>
          ${isCredit.value
            ? `<div class="row"><span>Down Payment</span><span class="strong">${money(receiptDownPayment.value)}</span></div><div class="accent soft">Outstanding Balance: ${money(receiptOutstanding.value)}</div>`
            : `<div class="row"><span>Paid with Cash</span><span class="strong">${money(receiptAmountPaid.value)}</span></div>`}
        </div>
      </div>
    </div>
  </body>
</html>`)
  popup.document.close()
  popup.focus()

  setTimeout(() => {
    popup.print()
  }, 250)
}
</script>

<style scoped>
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>

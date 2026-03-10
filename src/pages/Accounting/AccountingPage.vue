<template>
  <AppPageShell main-class="no-scrollbar overflow-x-hidden overflow-y-auto p-0.5">
    <div class="flex flex-col gap-1">
      <AccountingHeader
        :active-branch="activeBranch"
        :user-name="userName"
        :active-tab="activeTab"
        :filters="headerFilters"
        @change-tab="activeTab = $event"
        @update:from-date="headerFilters.fromDate = $event"
        @update:to-date="headerFilters.toDate = $event"
        @update:search="headerFilters.search = $event"
        @update:status="headerFilters.status = $event"
        @refresh="refreshPage"
      />

      <AccountingExpensesView
        v-if="activeTab === 'expenses'"
        :active-branch="activeBranch"
        :from-date="expenseFilters.fromDate"
        :to-date="expenseFilters.toDate"
        :search="expenseFilters.search"
      />
      <AccountingIncomeView
        v-else-if="activeTab === 'income'"
        :active-branch="activeBranch"
        :from-date="incomeFilters.fromDate"
        :to-date="incomeFilters.toDate"
        :search="incomeFilters.search"
      />
      <AccountingCreditCollectionView
        v-else
        :active-branch="activeBranch"
        :from-date="creditFilters.fromDate"
        :to-date="creditFilters.toDate"
        :search="creditFilters.search"
        :status-filter="creditFilters.status"
      />
    </div>
  </AppPageShell>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { toast } from 'vue3-toastify'
import AppPageShell from '@/components/Layout/AppPageShell.vue'
import AccountingCreditCollectionView from '@/components/Accounting/AccountingCreditCollectionView.vue'
import AccountingExpensesView from '@/components/Accounting/AccountingExpensesView.vue'
import AccountingHeader from '@/components/Accounting/AccountingHeader.vue'
import AccountingIncomeView from '@/components/Accounting/AccountingIncomeView.vue'
import { useCreditStore } from '@/stores/credits'
import { useExpenseStore } from '@/stores/expenses'
import { useInventoryStore } from '@/stores/inventory'
import { useOtherIncomeStore } from '@/stores/otherIncome'
import { useUsersStore } from '@/stores/users'
import { startOfMonthIso, todayIso } from '@/utils/date'

const inventory = useInventoryStore()
const users = useUsersStore()
const expenses = useExpenseStore()
const otherIncome = useOtherIncomeStore()
const credits = useCreditStore()

const activeTab = ref('expenses')
const expenseFilters = reactive({ fromDate: startOfMonthIso(), toDate: todayIso(), search: '' })
const incomeFilters = reactive({ fromDate: startOfMonthIso(), toDate: todayIso(), search: '' })
const creditFilters = reactive({ fromDate: startOfMonthIso(), toDate: todayIso(), search: '', status: 'ALL' })

const activeBranch = computed(() => users.canSwitchBranch ? inventory.activeBranch : (users.assignedBranch || inventory.activeBranch))
const userName = computed(() => users.currentProfileName)
const headerFilters = computed(() => {
  if (activeTab.value === 'expenses') return expenseFilters
  if (activeTab.value === 'income') return incomeFilters
  return creditFilters
})

const refreshPage = async () => {
  if (!activeBranch.value) return
  try {
    await Promise.all([
      expenses.initialize(activeBranch.value, true),
      otherIncome.initialize(activeBranch.value, true),
      credits.initializeAccounting(activeBranch.value, true),
    ])
    toast.info('Accounting refreshed from backend.')
  } catch (error) {
    toast.error('Backend unavailable. Accounting data could not be refreshed.')
  }
}

watch(activeBranch, async (branch) => {
  if (!branch) return
  try {
    await Promise.all([
      expenses.initialize(branch, true),
      otherIncome.initialize(branch, true),
      credits.initializeAccounting(branch, true),
    ])
  } catch (error) {
    toast.error('Backend unavailable. Accounting data could not be loaded.')
  }
}, { immediate: true })
</script>

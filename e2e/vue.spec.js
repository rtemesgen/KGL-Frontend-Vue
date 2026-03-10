import { test, expect } from '@playwright/test'

test.describe.configure({ timeout: 60000 })

const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@karibu.local'
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'Admin@123'
const authTokenKey = 'karibu:auth:token'
const apiBaseUrl = process.env.E2E_API_BASE_URL || 'http://localhost:5050'
let cachedAdminToken = ''

const uniqueSuffix = () => `${Date.now()}-${Math.floor(Math.random() * 10000)}`

const getAdminToken = async (request) => {
  if (cachedAdminToken) return cachedAdminToken

  const response = await request.post(`${apiBaseUrl}/api/v1/auth/login`, {
    data: {
      email: adminEmail,
      password: adminPassword,
    },
  })

  expect(response.ok()).toBeTruthy()
  const payload = await response.json()
  cachedAdminToken = payload?.data?.token || ''
  expect(cachedAdminToken).toBeTruthy()
  return cachedAdminToken
}

const authorizedRequest = async (request, method, path, data) => {
  const token = await getAdminToken(request)
  return request.fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data,
  })
}

const clearSession = async (page) => {
  await page.context().clearCookies()
  await page.goto('/auth', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })
}

const loginViaUi = async (page) => {
  await page.goto('/auth', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  await page.getByLabel('Email').fill(adminEmail)
  await page.getByLabel('Password').fill(adminPassword)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL((url) => url.pathname === '/')
  await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible()
}

const loginViaApi = async (page, request) => {
  const token = await getAdminToken(request)

  await page.addInitScript(([key, value]) => {
    window.localStorage.setItem(key, value)
  }, [authTokenKey, token])

  await page.goto('/auth', { waitUntil: 'domcontentloaded' })
  await page.evaluate(([key, value]) => {
    window.localStorage.setItem(key, value)
  }, [authTokenKey, token])
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible()
}

const cleanupUsersByEmail = async (request, email) => {
  const listResponse = await authorizedRequest(request, 'GET', '/api/v1/users')
  if (!listResponse.ok()) return

  const payload = await listResponse.json()
  const users = payload?.data?.users || []
  const matches = users.filter((user) => String(user?.email || '').trim().toLowerCase() === String(email || '').trim().toLowerCase())

  for (const user of matches) {
    const id = user?._id || user?.id
    if (!id) continue
    await authorizedRequest(request, 'DELETE', `/api/v1/users/${id}`)
  }
}

const cleanupExpensesByReason = async (request, reason) => {
  const listResponse = await authorizedRequest(request, 'GET', '/api/v1/accounting/expenses')
  if (!listResponse.ok()) return

  const payload = await listResponse.json()
  const rows = payload?.data?.expenses || payload?.data?.rows || payload?.data?.items || []
  const matches = rows.filter((row) => String(row?.reason || row?.description || row?.title || '').trim() === reason)

  for (const row of matches) {
    const id = row?._id || row?.id
    if (!id) continue
    await authorizedRequest(request, 'DELETE', `/api/v1/accounting/expenses/${id}`)
  }
}

test.beforeEach(async ({ page }) => {
  await clearSession(page)
})

test('redirects unauthenticated users to auth', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL(/\/auth$/)
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
})

test('logs in and returns to auth after logout', async ({ page }) => {
  await loginViaUi(page)

  await expect(page.getByText('APPLICATIONS HUB')).toBeVisible()
  await expect(page.getByText(/Welcome\s+System Admin,/)).toBeVisible()

  await page.getByRole('button', { name: 'Logout' }).click()

  await expect(page).toHaveURL(/\/auth$/)
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
})

test('loads the sales, procurement, and accounting modules', async ({ page, request }) => {
  await loginViaApi(page, request)

  await page.goto('/sales')
  await expect(page.getByRole('heading', { name: 'Sales', exact: true })).toBeVisible()
  await expect(page.getByText('Current Order')).toBeVisible()
  await page.getByRole('button', { name: 'Daily Sale Report' }).click()
  await expect(page.getByRole('button', { name: 'Export Sales PDF' })).toBeVisible()

  await page.goto('/procurement')
  await expect(page.getByRole('heading', { name: 'Procurement' })).toBeVisible()
  await expect(page.getByText('Purchase Items')).toBeVisible()
  await page.getByRole('button', { name: 'Suppliers' }).click()
  await expect(page.getByPlaceholder('Search suppliers...')).toBeVisible()
  await page.getByRole('button', { name: 'Stock Report' }).click()
  await expect(page.getByRole('button', { name: 'Export PDF' })).toBeVisible()
  await page.getByRole('button', { name: 'Purchase Report' }).click()
  await expect(page.getByPlaceholder('Search purchases...')).toBeVisible()

  await page.goto('/accounting')
  await expect(page.getByRole('heading', { name: 'Accounting' })).toBeVisible()
  await expect(page.getByText('DAILY EXPENSES')).toBeVisible()
  await page.getByRole('button', { name: 'Other Income' }).click()
  await expect(page.getByRole('button', { name: 'Save Income' })).toBeVisible()
  await page.getByRole('button', { name: 'Credit Collection' }).click()
  await expect(page.getByPlaceholder('Filter customer...')).toBeVisible()
})

test('loads the reports and users modules', async ({ page, request }) => {
  await loginViaApi(page, request)

  await page.goto('/reports')
  await expect(page.getByText('Sales Report')).toBeVisible()
  await expect(page.getByText('Credit Report')).toBeVisible()
  await expect(page.getByText('Expenses Report')).toBeVisible()
  await expect(page.getByText('Other Income Report')).toBeVisible()

  await page.goto('/users')
  await expect(page.getByText('User Management Console')).toBeVisible()
  await expect(page.getByText('Main User Directory')).toBeVisible()
  await expect(page.getByText('Branch Summary Overview')).toBeVisible()
})

test('creates and deletes an expense through accounting flow', async ({ page, request }) => {
  const suffix = uniqueSuffix()
  const reason = `E2E expense ${suffix}`
  const amount = '4321'
  const paidTo = `E2E vendor ${suffix}`
  const today = new Date().toISOString().slice(0, 10)

  try {
    await cleanupExpensesByReason(request, reason)
    await loginViaUi(page)

    await page.goto('/accounting')
    await expect(page.getByRole('heading', { name: 'Accounting' })).toBeVisible()

    await page.locator('input[placeholder="Office supplies, transport, fuel..."]').fill(reason)
    await page.locator('input[placeholder="e.g. 25000"]').fill(amount)
    await page.locator('input[placeholder="Vendor or individual name"]').fill(paidTo)
    await page.locator('input[type="date"]').first().fill(today)
    await page.getByRole('button', { name: 'Save Expense' }).click()

    const createdRow = page.locator('tr').filter({ hasText: reason })
    await expect(createdRow).toBeVisible()
    await expect(createdRow).toContainText('USh 4,321')

    await createdRow.locator('button').click()
    await expect(page.getByText(`Proceed to delete ${reason}?`)).toBeVisible()
    await page.getByRole('button', { name: 'Proceed' }).click()

    await expect(createdRow).toHaveCount(0)
  } finally {
    await cleanupExpensesByReason(request, reason)
  }
})

test('queues registration and lets admin approve it from users page', async ({ page, request }) => {
  const suffix = uniqueSuffix()
  const name = `Pending User ${suffix}`
  const email = `pending-user-${suffix}@karibu.local`
  const password = 'Admin@123'

  try {
    await cleanupUsersByEmail(request, email)

    await page.goto('/auth')
    await page.getByRole('button', { name: 'Register' }).click()
    await expect(page.getByRole('heading', { name: 'Request account' })).toBeVisible()
    await page.locator('input[placeholder="Jordan Smith"]').fill(name)
    await page.locator('input[placeholder="name@karibu.local"]').fill(email)
    await page.locator('select').nth(0).selectOption('MANAGER')
    await page.locator('select').nth(1).selectOption('Matugga')
    await page.locator('input[placeholder="Create password"]').fill(password)
    await page.locator('input[placeholder="Repeat password"]').fill(password)
    await page.getByRole('button', { name: 'Submit for approval' }).click()

    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()

    await loginViaUi(page)
    await page.goto('/users')

    const pendingCard = page.locator('article').filter({ hasText: email })
    await expect(pendingCard).toBeVisible()
    await pendingCard.getByRole('button', { name: 'Approve' }).click()

    await expect(pendingCard).toHaveCount(0)

    await page.locator('input[placeholder="Search users, roles, branch, email or id..."]').fill(email)
    const createdRow = page.locator('tr').filter({ hasText: email })
    await expect(createdRow).toBeVisible()
    await expect(createdRow).toContainText(name)
    await expect(createdRow).toContainText('MANAGER')
    await expect(createdRow).toContainText('Matugga')
  } finally {
    await cleanupUsersByEmail(request, email)
  }
})




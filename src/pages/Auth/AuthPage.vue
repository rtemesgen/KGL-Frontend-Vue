<template>
  <main class="min-h-screen bg-[radial-gradient(circle_at_top_left,#e9f0e7_0%,#dfe9e1_34%,#d6e0d8_72%,#eef3ea_100%)] text-[#0f172a]">
    <div class="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section class="relative hidden overflow-hidden border-r border-white/40 lg:flex lg:flex-col lg:justify-between">
        <div class="absolute inset-0 bg-[linear-gradient(135deg,rgba(48,84,62,0.95),rgba(111,146,120,0.78),rgba(225,232,215,0.34))]"></div>
        <div class="absolute -left-24 top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl"></div>
        <div class="absolute bottom-8 right-8 h-64 w-64 rounded-full bg-[#f4e7ad]/20 blur-3xl"></div>

        <div class="relative z-10 flex flex-1 flex-col items-center justify-center px-10 pb-12 text-center">
          <div class="flex h-[172px] w-[172px] items-center justify-center rounded-[38px] border border-white/28 bg-white/14 shadow-[0_28px_48px_rgba(15,23,42,0.18)] backdrop-blur-md">
            <img src="/KGL-favicon.png" alt="Karibu Grocery" class="h-[120px] w-[120px] object-contain drop-shadow-[0_18px_24px_rgba(15,23,42,0.22)]" />
          </div>
          <div class="mt-7 text-[52px] font-semibold leading-none tracking-[-0.08em] text-white">Karibu Grocery</div>
          <div class="mt-2 text-[13px] font-medium tracking-[0.18em] uppercase text-white/72">Branch Operations System</div>
        </div>
      </section>

      <section class="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
        <div class="w-full max-w-[460px] rounded-[28px] border border-white/50 bg-white/75 p-5 shadow-[0_22px_48px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:p-7">
          <div class="mb-6 flex items-center justify-between gap-4 lg:hidden">
            <div class="flex items-center gap-3">
              <img src="/KGL-favicon.png" alt="Karibu Grocery" class="h-12 w-12 rounded-[14px] border border-[#d8decf] bg-white object-cover p-1.5" />
              <div>
                <div class="text-[20px] font-semibold tracking-[-0.05em] text-[#22392e]">Karibu Grocery</div>
                <div class="text-[12px] text-[#64748b]">Branch operations workspace</div>
              </div>
            </div>
          </div>

          <div class="inline-flex rounded-[12px] border border-[#c7d7cc] bg-[#f8faf7] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <button class="rounded-[9px] px-4 py-2 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60" :class="mode === 'login' ? 'bg-[#30543e] text-white shadow-[0_8px_14px_rgba(48,84,62,0.14)]' : 'text-[#4f6259] hover:bg-white'" :disabled="authBusy" @click="mode = 'login'">Login</button>
            <button class="rounded-[9px] px-4 py-2 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60" :class="mode === 'register' ? 'bg-[#30543e] text-white shadow-[0_8px_14px_rgba(48,84,62,0.14)]' : 'text-[#4f6259] hover:bg-white'" :disabled="authBusy" @click="mode = 'register'">Register</button>
          </div>

          <div class="mt-5">
            <h2 class="m-0 text-[30px] font-semibold tracking-[-0.06em] text-[#111827]">{{ mode === 'login' ? 'Welcome back' : 'Request account' }}</h2>
            <p class="mt-2 text-[14px] leading-6 text-[#607267]">
              {{ mode === 'login' ? 'Sign in with your email to continue into the workspace.' : 'Submit your details for admin approval before your backend account is created.' }}
            </p>
          </div>

          <form class="mt-6 space-y-4" @submit.prevent="mode === 'login' ? submitLogin() : submitRegister()">
            <template v-if="mode === 'login'">
              <label class="block">
                <span class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5c7368]">Email</span>
                <input v-model="loginForm.email" type="email" autocomplete="username" placeholder="example@karibu.local" class="h-[48px] w-full rounded-[14px] border border-[#c7d7cc] bg-[#fbfdf9] px-4 text-[14px] text-[#22392e] outline-none transition focus:border-[#93b59d] focus:bg-white" />
              </label>
              <label class="block">
                <span class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5c7368]">Password</span>
                <div class="relative">
                  <input v-model="loginForm.password" :type="showLoginPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="Enter password" class="h-[48px] w-full rounded-[14px] border border-[#c7d7cc] bg-[#fbfdf9] px-4 pr-20 text-[14px] text-[#22392e] outline-none transition focus:border-[#93b59d] focus:bg-white" />
                  <button class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#30543e]" type="button" @click="showLoginPassword = !showLoginPassword">{{ showLoginPassword ? 'Hide' : 'Show' }}</button>
                </div>
              </label>
            </template>

            <template v-else>
              <label class="block">
                <span class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5c7368]">Full name</span>
                <input v-model="registerForm.name" type="text" autocomplete="name" placeholder="Jordan Smith" :class="inputClass(registerErrors.name)" />
                <span v-if="registerErrors.name" class="mt-1 block text-[11px] font-medium text-[#b42318]">{{ registerErrors.name }}</span>
              </label>
              <label class="block">
                <span class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5c7368]">Email</span>
                <input v-model="registerForm.email" type="email" autocomplete="email" placeholder="name@karibu.local" :class="inputClass(registerErrors.email)" />
                <span v-if="registerErrors.email" class="mt-1 block text-[11px] font-medium text-[#b42318]">{{ registerErrors.email }}</span>
              </label>
              <div class="grid gap-4 sm:grid-cols-2">
                <label class="block">
                  <span class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5c7368]">Role</span>
                  <select v-model="registerForm.role" :class="inputClass(registerErrors.role)">
                    <option value="MANAGER">Manager</option>
                    <option value="SALES AGENT">Sales Agent</option>
                  </select>
                  <span v-if="registerErrors.role" class="mt-1 block text-[11px] font-medium text-[#b42318]">{{ registerErrors.role }}</span>
                </label>
                <label class="block">
                  <span class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5c7368]">Branch</span>
                  <select v-model="registerForm.branch" :class="inputClass(registerErrors.branch)">
                    <option v-for="branch in branches" :key="branch" :value="branch">{{ branch }}</option>
                  </select>
                  <span v-if="registerErrors.branch" class="mt-1 block text-[11px] font-medium text-[#b42318]">{{ registerErrors.branch }}</span>
                </label>
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <label class="block">
                  <span class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5c7368]">Password</span>
                  <div class="relative">
                    <input v-model="registerForm.password" :type="showRegisterPassword ? 'text' : 'password'" autocomplete="new-password" placeholder="Create password" :class="inputClass(registerErrors.password, true)" />
                    <button class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#30543e]" type="button" @click="showRegisterPassword = !showRegisterPassword">{{ showRegisterPassword ? 'Hide' : 'Show' }}</button>
                  </div>
                  <span v-if="registerErrors.password" class="mt-1 block text-[11px] font-medium text-[#b42318]">{{ registerErrors.password }}</span>
                </label>
                <label class="block">
                  <span class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5c7368]">Confirm password</span>
                  <div class="relative">
                    <input v-model="registerForm.confirmPassword" :type="showRegisterConfirmPassword ? 'text' : 'password'" autocomplete="new-password" placeholder="Repeat password" :class="inputClass(registerErrors.confirmPassword, true)" />
                    <button class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#30543e]" type="button" @click="showRegisterConfirmPassword = !showRegisterConfirmPassword">{{ showRegisterConfirmPassword ? 'Hide' : 'Show' }}</button>
                  </div>
                  <span v-if="registerErrors.confirmPassword" class="mt-1 block text-[11px] font-medium text-[#b42318]">{{ registerErrors.confirmPassword }}</span>
                </label>
              </div>
            </template>

            <button class="flex h-[50px] w-full items-center justify-center rounded-[16px] bg-[linear-gradient(90deg,#30543e,#2a6e51)] text-[15px] font-semibold text-white shadow-[0_16px_28px_rgba(48,84,62,0.18)] transition hover:translate-y-[-1px] hover:shadow-[0_20px_32px_rgba(48,84,62,0.22)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none" type="submit" :disabled="authBusy">
              {{ authBusy ? 'Please wait...' : (mode === 'login' ? 'Sign in' : 'Submit for approval') }}
            </button>
          </form>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue3-toastify'
import { BRANCH_NAMES } from '@/constants/users'
import { useUiStore } from '@/stores/ui'
import { useUsersStore } from '@/stores/users'

const createRegisterForm = () => ({ name: '', email: '', role: 'MANAGER', branch: BRANCH_NAMES[0], password: '', confirmPassword: '' })

const router = useRouter()
const users = useUsersStore()
const ui = useUiStore()
const mode = ref('login')
const branches = computed(() => BRANCH_NAMES)
const showLoginPassword = ref(false)
const showRegisterPassword = ref(false)
const showRegisterConfirmPassword = ref(false)
const authBusy = computed(() => ui.isLoading)

const loginForm = reactive({ email: '', password: '' })
const registerForm = reactive(createRegisterForm())
const registerErrors = reactive({ name: '', email: '', role: '', branch: '', password: '', confirmPassword: '' })

const inputClass = (error, withTrailingButton = false) => [
  'h-[48px] w-full rounded-[14px] border bg-[#fbfdf9] px-4 text-[14px] text-[#22392e] outline-none transition focus:bg-white',
  withTrailingButton ? 'pr-20' : '',
  error ? 'border-[#ef4444] ring-1 ring-[#fecaca] focus:border-[#ef4444]' : 'border-[#c7d7cc] focus:border-[#93b59d]',
].join(' ')

const resetRegisterErrors = () => {
  registerErrors.name = ''
  registerErrors.email = ''
  registerErrors.role = ''
  registerErrors.branch = ''
  registerErrors.password = ''
  registerErrors.confirmPassword = ''
}

const resetRegisterForm = () => {
  Object.assign(registerForm, createRegisterForm())
  resetRegisterErrors()
}

const validateRegister = () => {
  resetRegisterErrors()
  let invalid = false

  if (!registerForm.name.trim()) {
    registerErrors.name = 'Enter full name.'
    invalid = true
  }
  if (!registerForm.email.trim()) {
    registerErrors.email = 'Enter email address.'
    invalid = true
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email.trim())) {
    registerErrors.email = 'Enter a valid email.'
    invalid = true
  }
  if (!registerForm.role.trim()) {
    registerErrors.role = 'Select role.'
    invalid = true
  }
  if (!registerForm.branch.trim()) {
    registerErrors.branch = 'Select branch.'
    invalid = true
  }
  if (!registerForm.password.trim()) {
    registerErrors.password = 'Enter password.'
    invalid = true
  } else if (registerForm.password.trim().length < 6) {
    registerErrors.password = 'Password must be at least 6 characters.'
    invalid = true
  }
  if (!registerForm.confirmPassword.trim()) {
    registerErrors.confirmPassword = 'Confirm password.'
    invalid = true
  } else if (registerForm.password !== registerForm.confirmPassword) {
    registerErrors.confirmPassword = 'Passwords do not match.'
    invalid = true
  }

  return !invalid
}

const submitLogin = async () => {
  const result = await users.login(loginForm)
  if (!result.ok) {
    toast.error(result.message || 'Invalid email or password.')
    return
  }
  toast.success(`Welcome back, ${users.currentProfileName}.`)
  router.replace({ name: users.defaultRouteName })
}

const submitRegister = async () => {
  if (!validateRegister()) {
    toast.error('Fix the highlighted fields.')
    return
  }

  const result = await users.register(registerForm)
  if (!result.ok) {
    if (result.reason === 'pending') {
      registerErrors.email = 'That email already has a pending approval request.'
    }
    toast.error(result.message || 'Unable to submit registration.')
    return
  }

  toast.success('Registration submitted. An admin must approve your account before you can sign in.')
  resetRegisterForm()
  mode.value = 'login'
}
</script>

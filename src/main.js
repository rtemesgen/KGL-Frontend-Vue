import { createApp } from 'vue'
import { pinia } from '@/stores'

import App from './App.vue'
import router from './router'
import './assets/main.css'
import Vue3Toastify from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(Vue3Toastify, { autoClose: 2500, position: 'top-right' })

app.mount('#app')

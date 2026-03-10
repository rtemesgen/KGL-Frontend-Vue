import './assets/main.css'
import 'vue3-toastify/dist/index.css'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import Vue3Toastify from 'vue3-toastify'
import { pinia } from './stores'

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(Vue3Toastify, {
  autoClose: 1000,
})

app.mount('#app')

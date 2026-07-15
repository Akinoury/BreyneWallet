import { Capacitor } from '@capacitor/core'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useWalletStore } from './stores/walletStore'
import './assets/main.css'

window.Capacitor = Capacitor

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')

const store = useWalletStore()
store.loadFromLocalStorage()

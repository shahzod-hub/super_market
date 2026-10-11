<template>
  <NotificationToast />
  <RouterView />
</template>

<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import NotificationToast from './components/NotificationToast.vue'
import { useNotification } from './composables/useNotification.js'
import { getUserScope } from './userScope.js'

const { addNotification } = useNotification()

onMounted(() => {
  try {
    const seedKey = `velox_notification_test_seeded:${getUserScope()}`
    if (!import.meta.env.DEV || localStorage.getItem(seedKey)) return

    addNotification('Xush kelibsiz!', 'Tizimga muvaffaqiyatli kirdingiz.', 'info')
    addNotification('Mahsulot qo‘shildi', 'Mahsulot savatga qo‘shildi.', 'success')
    addNotification('Diqqat', 'Mahsulot kam miqdorda qoldi.', 'warning')
    localStorage.setItem(seedKey, 'true')
  } catch (error) {
    console.error('Sinov bildirishnomalarini yaratishda xato:', error)
  }
})
</script>
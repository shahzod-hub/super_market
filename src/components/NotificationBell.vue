<template>
  <div ref="root" class="notification-bell">
    <button
      class="bell-button"
      type="button"
      :aria-expanded="isOpen"
      aria-label="Bildirishnomalar"
      @click="toggleDropdown"
    >
      <span aria-hidden="true">🔔</span>
      <span v-if="visibleUnreadCount" class="bell-badge">{{ visibleUnreadCount }}</span>
    </button>

    <section v-if="isOpen" class="notification-dropdown" aria-label="Bildirishnomalar">
      <header class="dropdown-header">
        <h2>Bildirishnomalar</h2>
        <span>{{ visibleNotifications.length }}</span>
      </header>

      <p v-if="notificationError" class="notification-error" role="alert">{{ notificationError }}</p>
      <div v-if="visibleNotifications.length" class="notification-list">
        <article
          v-for="notification in visibleNotifications"
          :key="notification.id"
          class="notification-item"
          :class="[`type-${notification.type}`, { unread: !notification.read }]"
          @click="markNotificationAsRead(notification.id)"
        >
          <span class="type-icon" aria-hidden="true">{{ typeIcons[notification.type] || typeIcons.info }}</span>
          <div class="notification-content">
            <strong>{{ notification.title }}</strong>
            <p>{{ notification.message }}</p>
            <time :datetime="notification.createdAt">{{ formatTime(notification.createdAt) }}</time>
          </div>
          <button
            class="delete-button"
            type="button"
            :aria-label="`O'chirish: ${notification.title}`"
            @click.stop="removeVisibleNotification(notification.id)"
          >×</button>
        </article>
      </div>
      <p v-else class="empty-state">Hozircha bildirishnoma yo‘q.</p>

      <footer v-if="visibleNotifications.length" class="dropdown-actions">
        <button type="button" :disabled="!visibleUnreadCount" @click="markVisibleAsRead">
          Barchasini o‘qilgan deb belgilash
        </button>
        <button type="button" @click="clearVisibleNotifications">Barchasini o‘chirish</button>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import api, { resolveApiError } from '../api.js'
import { useNotification } from '../composables/useNotification.js'

const root = ref(null)
const isOpen = ref(false)
const currentUserId = ref('')
const serverNotifications = ref([])
const notificationError = ref('')
const typeIcons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }
const {
  notifications,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearNotifications
} = useNotification()

const serverNotificationIds = computed(() => new Set(serverNotifications.value.map((notification) => notification.id)))
const visibleNotifications = computed(() => [...notifications.value, ...serverNotifications.value]
  .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()))
const visibleUnreadCount = computed(() =>
  visibleNotifications.value.filter((notification) => !notification.read).length
)
let refreshTimer

async function fetchServerNotifications() {
  if (!currentUserId.value) {
    serverNotifications.value = []
    return
  }
  const requestedUserId = currentUserId.value
  try {
    const response = await api.get(`/notifications/user/${requestedUserId}`)
    if (!Array.isArray(response.data)) throw new Error('Bildirishnomalar ro‘yxati noto‘g‘ri formatda.')
    if (requestedUserId !== currentUserId.value) return
    serverNotifications.value = response.data.map((notification) => ({
      ...notification,
      id: String(notification.id),
      userId: String(notification.userId),
      read: notification.read === true,
      type: notification.type || 'info'
    }))
    notificationError.value = ''
  } catch (error) {
    if (requestedUserId !== currentUserId.value) return
    console.error('Server bildirishnomalarini yuklashda xato:', error)
    notificationError.value = resolveApiError(error, 'Buyurtma bildirishnomalarini yuklab bo‘lmadi.')
  }
}

function syncCurrentUser() {
  try {
    const user = JSON.parse(localStorage.getItem('velox_user') || 'null')
    const hasToken = Boolean(localStorage.getItem('velox_token'))
    const nextUserId = hasToken && user?.role === 'USER' && user.id ? String(user.id) : ''
    if (nextUserId !== currentUserId.value) {
      currentUserId.value = nextUserId
      serverNotifications.value = []
      fetchServerNotifications()
    }
  } catch (error) {
    console.error('Foydalanuvchi ma’lumotlarini o‘qishda xato:', error)
    currentUserId.value = ''
    serverNotifications.value = []
  }
}

async function markNotificationAsRead(id) {
  if (!serverNotificationIds.value.has(id)) {
    markAsRead(id)
    return
  }
  try {
    const response = await api.put(`/notifications/${id}/read`)
    if (response.data !== true) throw new Error('Bildirishnoma o‘qilgan deb belgilanmadi.')
    serverNotifications.value = serverNotifications.value.map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification
    )
    notificationError.value = ''
  } catch (error) {
    console.error('Bildirishnomani o‘qilgan deb belgilashda xato:', error)
    notificationError.value = resolveApiError(error, 'Bildirishnoma holatini saqlab bo‘lmadi.')
  }
}

async function removeVisibleNotification(id) {
  if (!serverNotificationIds.value.has(id)) {
    removeNotification(id)
    return
  }
  try {
    const response = await api.delete(`/notifications/${id}`)
    if (response.data !== true) throw new Error('Bildirishnoma o‘chirilmadi.')
    serverNotifications.value = serverNotifications.value.filter((notification) => notification.id !== id)
    notificationError.value = ''
  } catch (error) {
    console.error('Server bildirishnomasini o‘chirishda xato:', error)
    notificationError.value = resolveApiError(error, 'Bildirishnomani o‘chirib bo‘lmadi.')
  }
}

function formatTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function toggleDropdown() {
  isOpen.value = !isOpen.value
  if (isOpen.value) fetchServerNotifications()
}

async function markVisibleAsRead() {
  const serverIds = serverNotificationIds.value
  markAllAsRead(visibleNotifications.value
    .filter((notification) => !serverIds.has(notification.id))
    .map((notification) => notification.id))
  await Promise.all(visibleNotifications.value
    .filter((notification) => serverIds.has(notification.id) && !notification.read)
    .map((notification) => markNotificationAsRead(notification.id)))
}

async function clearVisibleNotifications() {
  clearNotifications()
  await Promise.all(serverNotifications.value.map((notification) => removeVisibleNotification(notification.id)))
}

function handleOutsideClick(event) {
  if (isOpen.value && !root.value?.contains(event.target)) isOpen.value = false
}

function handleKeydown(event) {
  if (event.key === 'Escape') isOpen.value = false
}

onMounted(() => {
  syncCurrentUser()
  window.addEventListener('velox-user-changed', syncCurrentUser)
  window.addEventListener('storage', syncCurrentUser)
  refreshTimer = window.setInterval(fetchServerNotifications, 30000)
  document.addEventListener('click', handleOutsideClick)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('velox-user-changed', syncCurrentUser)
  window.removeEventListener('storage', syncCurrentUser)
  window.clearInterval(refreshTimer)
  document.removeEventListener('click', handleOutsideClick)
  document.removeEventListener('keydown', handleKeydown)
})

</script>

<style scoped>
.notification-bell{position:relative;display:flex;align-items:center}
.bell-button{position:relative;width:42px;height:42px;display:grid;place-items:center;border:1px solid var(--line,#e5e0d8);border-radius:11px;background:#fff;color:var(--ink,#171717);font-size:19px;cursor:pointer;transition:background .18s,border-color .18s}
.bell-button:hover,.bell-button[aria-expanded=true]{border-color:var(--accent,#ff6235);background:#fff8f4}
.bell-badge{position:absolute;top:-7px;right:-7px;min-width:20px;height:20px;padding:0 5px;display:grid;place-items:center;border:2px solid var(--paper,#f7f5f1);border-radius:12px;background:var(--accent,#ff6235);color:#fff;font-size:10px;font-weight:800}
.notification-dropdown{position:absolute;top:calc(100% + 12px);right:0;width:min(390px,calc(100vw - 28px));max-height:min(560px,calc(100vh - 110px));display:flex;flex-direction:column;overflow:hidden;border:1px solid #e5e0d8;border-radius:16px;background:#fff;color:#171717;box-shadow:0 20px 55px rgba(30,25,20,.18);z-index:60}
.dropdown-header{display:flex;align-items:center;justify-content:space-between;padding:17px 18px;border-bottom:1px solid #eee9e2}
.dropdown-header h2{margin:0;font:800 16px Manrope, sans-serif}
.dropdown-header>span{min-width:24px;height:24px;display:grid;place-items:center;border-radius:12px;background:#f2efe9;color:#77736d;font-size:11px;font-weight:700}
.notification-list{overflow:auto}
.notification-item{display:flex;align-items:flex-start;gap:11px;padding:14px 13px 14px 16px;border-bottom:1px solid #f0ede8;cursor:pointer}
.notification-item:last-child{border-bottom:0}
.notification-item.unread{background:#fff8f4}
.type-icon{flex:none;font-size:17px}
.notification-content{min-width:0;flex:1}
.notification-content strong{display:block;margin-bottom:4px;font-size:13px}
.notification-content p{margin:0;color:#625e58;font-size:12px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}
.notification-content time{display:block;margin-top:7px;color:#969087;font-size:10px}
.type-success .notification-content strong{color:#267345}
.type-error .notification-content strong{color:#bf3f33}
.type-warning .notification-content strong{color:#9a6500}
.type-info .notification-content strong{color:#315f9c}
.delete-button{flex:none;width:25px;height:25px;border:0;border-radius:7px;background:transparent;color:#969087;font-size:19px;line-height:1;cursor:pointer}
.delete-button:hover{background:#f2efe9;color:#c44734}
.empty-state{margin:0;padding:30px 18px;color:#77736d;text-align:center;font-size:13px}
.notification-error{margin:0;padding:10px 16px;color:#bf3f33;background:#fff8f4;font-size:11px;line-height:1.45}
.dropdown-actions{display:grid;gap:1px;padding:8px;border-top:1px solid #eee9e2;background:#faf9f7}
.dropdown-actions button{min-height:36px;border:0;border-radius:8px;background:transparent;color:#514d47;text-align:left;padding:0 10px;font:600 11px 'DM Sans',sans-serif;cursor:pointer}
.dropdown-actions button:hover:not(:disabled){background:#f0ede8;color:#171717}
.dropdown-actions button:disabled{opacity:.45;cursor:not-allowed}
@media(max-width:560px){.notification-dropdown{position:fixed;top:76px;right:12px;width:calc(100vw - 24px);max-height:calc(100vh - 92px)}}
</style>

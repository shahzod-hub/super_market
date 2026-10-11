import { computed, ref } from 'vue'
import { getUserScope } from '../userScope.js'

const STORAGE_KEY_PREFIX = 'velox_notifications:'
const CURRENT_SHARED_KEY = 'notifications'
const LEGACY_SHARED_KEY = 'velox_notifications'
const VALID_TYPES = new Set(['success', 'error', 'warning', 'info'])
const toasts = ref([])
const toastTimers = new Map()
let idCounter = 0
let activeScope = getUserScope()

function storageKey(scope = activeScope) {
  return `${STORAGE_KEY_PREFIX}${scope}`
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  idCounter += 1
  return `${Date.now()}-${idCounter}-${Math.random().toString(36).slice(2)}`
}

function readStoredNotifications(scope = activeScope) {
  const key = storageKey(scope)
  try {
    const stored = localStorage.getItem(key)
    if (stored === null) return []
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      console.error(`localStorage "${key}" qiymati ro'yxat emas; bo'sh ro'yxat bilan davom etilmoqda.`)
      localStorage.setItem(key, '[]')
      return []
    }
    const normalized = normalizeNotifications(parsed)
    if (JSON.stringify(normalized) !== JSON.stringify(parsed)) {
      localStorage.setItem(key, JSON.stringify(normalized))
    }
    return sortNewestFirst(normalized)
  } catch (error) {
    console.error(`Bildirishnomalarni "${key}" dan o‘qib bo‘lmadi:`, error)
  }
  return []
}

function normalizeNotifications(items) {
  const usedIds = new Set()
  return items.filter((item) => item && typeof item === 'object').map((item) => {
    let id = typeof item.id === 'string' && item.id ? item.id : createId()
    if (usedIds.has(id)) id = createId()
    usedIds.add(id)

    const date = new Date(item.createdAt)
    return {
      id,
      title: typeof item.title === 'string' ? item.title : '',
      message: typeof item.message === 'string' ? item.message : '',
      type: VALID_TYPES.has(item.type) ? item.type : 'info',
      read: item.read === true,
      createdAt: Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString(),
      ...(typeof item.userId === 'string' ? { userId: item.userId } : {})
    }
  })
}

function sortNewestFirst(items) {
  return [...items].sort((first, second) =>
    new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
  )
}

function migrateSharedNotifications() {
  try {
    const currentStored = localStorage.getItem(CURRENT_SHARED_KEY)
    const legacyStored = localStorage.getItem(LEGACY_SHARED_KEY)
    const sourceKey = currentStored !== null
      ? CURRENT_SHARED_KEY
      : legacyStored !== null
        ? LEGACY_SHARED_KEY
        : null
    if (!sourceKey) return

    const stored = sourceKey === CURRENT_SHARED_KEY ? currentStored : legacyStored
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      console.error(`localStorage "${sourceKey}" qiymati ro'yxat emas; eski bildirishnomalar ko‘chirilmaydi.`)
      localStorage.removeItem(sourceKey)
      return
    }

    const migrated = sourceKey === LEGACY_SHARED_KEY
      ? parsed.map((notification) => ({
          ...notification,
          title: notification?.title || 'Yangi bildirishnoma',
          type: 'info'
        }))
      : parsed
    const grouped = new Map()
    normalizeNotifications(migrated).forEach((notification) => {
      const scope = notification.userId || 'guest'
      grouped.set(scope, [...(grouped.get(scope) || []), notification])
    })

    grouped.forEach((items, scope) => {
      const key = storageKey(scope)
      const existing = readStoredNotifications(scope)
      const merged = new Map([...existing, ...items].map((item) => [item.id, item]))
      localStorage.setItem(key, JSON.stringify(sortNewestFirst([...merged.values()])))
    })
    localStorage.removeItem(sourceKey)
    if (currentStored !== null && legacyStored !== null) {
      localStorage.removeItem(LEGACY_SHARED_KEY)
    }
  } catch (error) {
    console.error('Eski bildirishnomalarni hisoblar bo‘yicha ko‘chirishda xato:', error)
  }
}

migrateSharedNotifications()
const notifications = ref(readStoredNotifications())

function persistNotifications() {
  notifications.value = sortNewestFirst(notifications.value)
  try {
    localStorage.setItem(storageKey(), JSON.stringify(notifications.value))
    window.dispatchEvent(new Event('notifications-updated'))
  } catch (error) {
    console.error('Bildirishnomalarni localStorage ga saqlab bo‘lmadi:', error)
  }
}

function addNotification(title, message, type = 'info', metadata = {}) {
  const targetScope = metadata.userId === undefined || metadata.userId === null
    ? getUserScope()
    : String(metadata.userId)
  const notification = {
    id: createId(),
    title: String(title),
    message: String(message),
    type: VALID_TYPES.has(type) ? type : 'info',
    read: false,
    createdAt: new Date().toISOString(),
    ...metadata,
    ...(metadata.userId !== undefined && metadata.userId !== null
      ? { userId: String(metadata.userId) }
      : {})
  }

  if (targetScope !== activeScope) {
    const targetNotifications = readStoredNotifications(targetScope)
    const merged = new Map([...targetNotifications, notification].map((item) => [item.id, item]))
    try {
      localStorage.setItem(storageKey(targetScope), JSON.stringify(sortNewestFirst([...merged.values()])))
      window.dispatchEvent(new Event('notifications-updated'))
    } catch (error) {
      console.error('Bildirishnomalarni localStorage ga saqlab bo‘lmadi:', error)
    }
    return notification
  }

  notifications.value = [notification, ...notifications.value]
  persistNotifications()
  showToast(notification)
  return notification
}

function showToast(notification) {
  const toast = { ...notification, toastId: createId() }
  toasts.value = [...toasts.value, toast]
  const timer = window.setTimeout(() => dismissToast(toast.toastId), 5000)
  toastTimers.set(toast.toastId, timer)
}

function markAsRead(id) {
  const notification = notifications.value.find((item) => item.id === id)
  if (!notification || notification.read) return
  notifications.value = notifications.value.map((item) =>
    item.id === id ? { ...item, read: true } : item
  )
  persistNotifications()
}

function markAllAsRead(ids) {
  const selectedIds = ids ? new Set(ids) : null
  const hasUnread = notifications.value.some((item) =>
    !item.read && (!selectedIds || selectedIds.has(item.id))
  )
  if (!hasUnread) return
  notifications.value = notifications.value.map((item) =>
    !selectedIds || selectedIds.has(item.id) ? { ...item, read: true } : item
  )
  persistNotifications()
}

function removeNotification(id) {
  notifications.value = notifications.value.filter((item) => item.id !== id)
  persistNotifications()
}

function clearNotifications() {
  notifications.value = []
  persistNotifications()
}

function getNotifications() {
  return sortNewestFirst(notifications.value)
}

function dismissToast(toastId) {
  const timer = toastTimers.get(toastId)
  if (timer) window.clearTimeout(timer)
  toastTimers.delete(toastId)
  toasts.value = toasts.value.filter((toast) => toast.toastId !== toastId)
}

const unreadCount = computed(() => notifications.value.filter((item) => !item.read).length)

function syncActiveNotifications() {
  const nextScope = getUserScope()
  if (nextScope !== activeScope) {
    toasts.value.forEach((toast) => dismissToast(toast.toastId))
    activeScope = nextScope
  }
  notifications.value = readStoredNotifications(activeScope)
}

window.addEventListener('velox-user-changed', syncActiveNotifications)
window.addEventListener('storage', (event) => {
  if (event.key === 'velox_user') {
    syncActiveNotifications()
  } else if (event.key === storageKey()) {
    const previousIds = new Set(notifications.value.map((item) => item.id))
    notifications.value = readStoredNotifications()
    notifications.value
      .filter((notification) => !previousIds.has(notification.id) && !notification.read)
      .forEach(showToast)
  }
})

export function useNotification() {
  return {
    notifications,
    toasts,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNotifications,
    getNotifications,
    dismissToast
  }
}

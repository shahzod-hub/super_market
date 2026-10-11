export const ORDER_STATUSES = [
  { value: 'NEW', label: 'Yangi' },
  { value: 'CONFIRMED', label: 'Tasdiqlandi' },
  { value: 'PROCESSING', label: 'Tayyorlanmoqda' },
  { value: 'SHIPPED', label: "Yo'lda" },
  { value: 'DELIVERED', label: 'Yetkazildi' },
  { value: 'CANCELLED', label: 'Bekor qilindi' }
]

export const ORDERS_CACHE_KEY = 'velox_orders'

export function readOrdersCacheForUser(userId) {
  if (!userId) return []
  try {
    const raw = localStorage.getItem(`${ORDERS_CACHE_KEY}:${userId}`)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeOrdersCacheForUser(userId, orders) {
  if (!userId) return
  try {
    localStorage.setItem(`${ORDERS_CACHE_KEY}:${userId}`, JSON.stringify(Array.isArray(orders) ? orders : []))
    window.dispatchEvent(new CustomEvent('velox-orders-updated', { detail: { userId } }))
  } catch (error) {
    console.error('Buyurtmalarni cachega yozishda xato:', error)
  }
}

export function orderStatusLabel(status) {
  return ORDER_STATUSES.find((option) => option.value === status)?.label ?? 'Yangi'
}

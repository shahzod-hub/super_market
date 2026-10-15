<template>
  <div class="orders-page">
    <header class="page-header">
      <div class="header-inner">
        <RouterLink to="/" class="brand">velox<span>.</span></RouterLink>
        <RouterLink to="/" class="back-link">← Bosh sahifa</RouterLink>
      </div>
    </header>

    <main class="page-content">
      <section class="orders-wrap">
        <div class="page-title">
          <span class="kicker">BUYURTMALARIM</span>
          <h1>Mening buyurtmalarim</h1>
        </div>

        <div v-if="loading" class="state">Buyurtmalar yuklanmoqda...</div>
        <div v-else-if="errorMessage && !orders.length" class="state error">{{ errorMessage }}</div>
        <p v-if="errorMessage && orders.length" class="state error" role="status">
          {{ errorMessage }} Keshlangan buyurtmalar ko‘rsatilmoqda.
        </p>
        <div v-else-if="!currentUser" class="empty-state">
          <div class="empty-icon">📦</div>
          <h2>Kirish kerak</h2>
          <p>Buyurtmalarni ko‘rish uchun hisobga kiring yoki ro‘yxatdan o‘ting.</p>
          <RouterLink to="/signin" class="primary-btn">Kirish</RouterLink>
        </div>
        <div v-else-if="orders.length === 0" class="empty-state">
          <div class="empty-icon">🧾</div>
          <h2>Hali buyurtma yo‘q</h2>
          <p>Biror mahsulotni savatga qo‘shib, buyurtmani yaratganingizdan so‘ng bu sahifada ko‘rinadi.</p>
          <RouterLink to="/" class="primary-btn">Mahsulotlarni ko‘rish</RouterLink>
        </div>

        <div v-else class="orders-list">
          <article v-for="order in orders" :key="order.id" class="order-card">
            <div class="order-main">
              <div>
                <p class="order-label">Buyurtma</p>
                <h3>#{{ shortId(order.id) }}</h3>
              </div>
              <span class="status-badge" :class="statusClass(order.status)">{{ orderStatusLabel(order.status) }}</span>
            </div>

            <div class="progress-wrap" aria-label="Buyurtma jarayoni">
              <div class="progress-rail">
                <div class="progress-fill" :style="{ width: progressPercent(order.status) + '%' }"></div>
              </div>
              <div class="progress-labels">
                <span>Yangi</span>
                <span>Qabul qilindi</span>
                <span>Yetkazildi</span>
              </div>
            </div>

            <div class="order-grid">
              <div class="meta-item">
                <span class="meta-label">Mahsulot ID</span>
                <strong>{{ order.productId || '—' }}</strong>
              </div>
              <div class="meta-item">
                <span class="meta-label">Buyurtma sanasi</span>
                <strong>{{ formatDate(order.localDateTime ?? order.createdAt) }}</strong>
              </div>
              <div class="meta-item wide">
                <span class="meta-label">Yetkazib berish manzili</span>
                <strong>{{ order.deliveryAddress || 'Manzil ko‘rsatilmagan' }}</strong>
              </div>
            </div>

            <div v-if="order.deliveryLatitude != null && order.deliveryLongitude != null" class="location-meta">
              <span>Geolokatsiya</span>
              <a
                :href="`https://www.openstreetmap.org/?mlat=${order.deliveryLatitude}&mlon=${order.deliveryLongitude}#map=16/${order.deliveryLatitude}/${order.deliveryLongitude}`"
                target="_blank"
                rel="noopener noreferrer"
              >Xaritada ochish</a>
            </div>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import api, { normalizeListResponse, resolveApiError } from '../api.js'
import { orderStatusLabel, readOrdersCacheForUser } from '../orderStatus.js'

const currentUser = ref(null)
const orders = ref([])
const loading = ref(true)
const errorMessage = ref('')

const statusClass = computed(() => (status) => {
  const map = {
    NEW: 'new',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
  }
  return map[status] || 'new'
})

function progressPercent(status) {
  const steps = {
    NEW: 16,
    CONFIRMED: 38,
    PROCESSING: 62,
    SHIPPED: 84,
    DELIVERED: 100,
    CANCELLED: 0
  }
  return steps[status] ?? 16
}

function shortId(id) {
  return String(id || '').slice(0, 8).toUpperCase()
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function fetchOrders() {
  loading.value = true
  errorMessage.value = ''

  try {
    const storedUser = localStorage.getItem('velox_user')
    currentUser.value = storedUser ? JSON.parse(storedUser) : null

    if (!currentUser.value?.id) {
      orders.value = []
      return
    }

    const cachedOrders = readOrdersCacheForUser(currentUser.value.id)
    if (cachedOrders.length) {
      orders.value = cachedOrders
    }

    const response = await api.get('/orders/getAll')
    const filtered = normalizeListResponse(response.data)
      .filter((item) => String(item.userId) === String(currentUser.value.id))
    const cacheMap = new Map(cachedOrders.map((item) => [String(item.id), item]))
    for (const item of filtered) {
      const cachedItem = cacheMap.get(String(item.id))
      if (cachedItem && cachedItem.status !== item.status) {
        item.status = cachedItem.status
      }
    }
    orders.value = filtered
    if (filtered.length) {
      localStorage.setItem(`velox_orders:${currentUser.value.id}`, JSON.stringify(filtered))
    }
  } catch (error) {
    console.error('Buyurtmalarni yuklashda xato:', error)
    errorMessage.value = resolveApiError(error, 'Buyurtmalarni yuklab bo‘lmadi.')
  } finally {
    loading.value = false
  }
}

function handleStorageUpdate(event) {
  const userId = currentUser.value?.id
  if (!userId) return

  const key = event?.key
  if (key === `velox_orders:${userId}` || key === null) {
    fetchOrders()
    return
  }

  if (event?.detail?.userId && String(event.detail.userId) === String(userId)) {
    fetchOrders()
  }
}

onMounted(() => {
  fetchOrders()
  window.addEventListener('storage', handleStorageUpdate)
  window.addEventListener('velox-orders-updated', handleStorageUpdate)
})

onUnmounted(() => {
  window.removeEventListener('storage', handleStorageUpdate)
  window.removeEventListener('velox-orders-updated', handleStorageUpdate)
})
</script>

<style scoped>
.orders-page{min-height:100vh;background:#f7f5f1;color:#171717;font-family:'DM Sans',sans-serif}
.page-header{position:sticky;top:0;z-index:20;background:rgba(247,245,241,.9);backdrop-filter:blur(18px);border-bottom:1px solid #e5e0d8}
.header-inner{max-width:1240px;margin:0 auto;height:76px;padding:0 28px;display:flex;align-items:center;justify-content:space-between;gap:18px}
.brand{font:800 27px Manrope;text-decoration:none;color:#171717;letter-spacing:-1.5px}.brand span{color:#ff6235}
.back-link{color:#171717;text-decoration:none;font-weight:700;font-size:14px}
.page-content{max-width:1240px;margin:0 auto;padding:54px 28px 90px}
.page-title{margin-bottom:26px}
.kicker{font-size:11px;letter-spacing:.16em;font-weight:800;color:#ff6235}
.page-title h1{font:800 clamp(34px,4vw,52px)/1.04 Manrope;letter-spacing:-2px;margin:12px 0 0}
.orders-list{display:grid;grid-template-columns:1fr;gap:16px}
.order-card{background:#fff;border:1px solid #e5e0d8;border-radius:18px;padding:20px}
.order-main{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:18px}
.order-label,.meta-label{display:block;font-size:11px;letter-spacing:.12em;color:#8a857f;font-weight:800;text-transform:uppercase}
.order-main h3{margin:8px 0 0;font-size:22px;letter-spacing:-.8px}
.status-badge{display:inline-flex;align-items:center;justify-content:center;padding:7px 12px;border-radius:999px;font-size:12px;font-weight:800}
.status-badge.new{background:#fff2ec;color:#ff6235}
.status-badge.confirmed{background:#edf7ff;color:#1767c7}
.status-badge.processing{background:#fff7d9;color:#9c6a00}
.status-badge.shipped{background:#ebf9f1;color:#217a4a}
.status-badge.delivered{background:#ebf8ef;color:#1d7a41}
.status-badge.cancelled{background:#fbeaea;color:#bf3a3a}
.progress-wrap{margin:18px 0 22px}
.progress-rail{position:relative;height:8px;border-radius:999px;background:#eee9e2;overflow:hidden}
.progress-fill{position:absolute;left:0;top:0;bottom:0;border-radius:inherit;background:linear-gradient(90deg,#ff7a59,#ff6235)}
.progress-labels{display:flex;justify-content:space-between;gap:14px;margin-top:8px;color:#7a756f;font-size:11px}
.order-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.meta-item{padding:14px 16px;background:#f8f6f4;border:1px solid #eee9e2;border-radius:12px}
.meta-item strong{display:block;margin-top:8px;font-size:14px;line-height:1.5;word-break:break-word}
.meta-item.wide{grid-column:span 3}
.location-meta{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;background:#f8f6f4;border:1px solid #eee9e2;border-radius:12px;color:#4d4945;font-size:12px}
.location-meta a{color:#ff6235;text-decoration:none;font-weight:700}
.empty-state{text-align:center;padding:80px 20px;background:#fff;border:1px solid #e5e0d8;border-radius:18px}
.empty-icon{font-size:52px;margin-bottom:10px}
.empty-state h2{font:800 28px Manrope;letter-spacing:-1px;margin:0 0 10px}
.empty-state p{max-width:560px;margin:0 auto 22px;color:#77736d;line-height:1.7}
.primary-btn{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;background:#171717;color:#fff;border-radius:12px;padding:14px 18px;font-weight:700}
.state{padding:40px 16px;text-align:center;color:#77736d}
.error{color:#d84d3b}
@media(max-width:720px){.order-grid{grid-template-columns:1fr}.meta-item.wide{grid-column:auto}.header-inner{padding:0 16px}.page-content{padding:38px 16px 72px}.order-main{align-items:flex-start;flex-direction:column}} 
</style>

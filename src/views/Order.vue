<template>
  <div class="order-page">
    <header class="page-head">
      <RouterLink to="/" class="brand">Velox<span>Shoop</span></RouterLink>
      <div class="page-title">
        <h1>Savat</h1>
        <span>{{ itemCount }} ta mahsulot</span>
      </div>
    </header>

    <section class="delivery-location" aria-labelledby="delivery-heading">
      <div class="delivery-heading">
        <div>
          <h2 id="delivery-heading">Yetkazib berish manzili</h2>
          <p>Surxondaryo viloyati, Sho‘rchi tumanidan xaritada manzilingizni tanlang.</p>
        </div>
        <span class="location-region">Surxondaryo · Sho‘rchi</span>
      </div>
      <div ref="deliveryMapElement" class="delivery-map" aria-label="Yetkazib berish manzilini tanlash xaritasi"></div>
      <p v-if="deliveryLocation" class="selected-location" role="status">
        Tanlangan nuqta: {{ deliveryLocation.latitude.toFixed(6) }}, {{ deliveryLocation.longitude.toFixed(6) }}
      </p>
      <p v-else class="location-hint">Manzilni belgilash uchun xaritada kerakli joyni bosing.</p>
      <p v-if="locationError" class="location-error" role="alert">{{ locationError }}</p>
    </section>

    <main class="cart-layout">
      <section class="cart-list">
        <div v-if="cart.length === 0" class="empty-cart">
          <span class="empty-icon">🛒</span>
          <h2>Savatingiz hozircha bo'sh</h2>
          <p>Mahsulotlarni tanlang va xaridni davom ettiring.</p>
          <RouterLink to="/" class="continue-button">Xarid qilish</RouterLink>
        </div>

        <article v-for="item in cart" :key="item.id" class="cart-item">
          <div class="thumb">{{ initials(item.name) }}</div>
          <div class="item-info">
            <h2>{{ item.name }}</h2>
            <p class="stock-label">Omborda: {{ item.quantity }} dona</p>
            <div class="item-actions">
              <div class="quantity-control" :aria-label="`${item.name} miqdori`">
                <button type="button" :disabled="item.cartQuantity <= 1" aria-label="Kamaytirish" @click="changeQuantity(item, -1)">−</button>
                <span>{{ item.cartQuantity }}</span>
                <button
                  type="button"
                  :disabled="item.cartQuantity >= item.quantity"
                  :aria-label="item.cartQuantity >= item.quantity ? 'Ombordagi maksimal miqdor' : 'Ko‘paytirish'"
                  @click="changeQuantity(item, 1)"
                >+</button>
              </div>
              <small v-if="item.cartQuantity >= item.quantity" class="stock-limit">Ombordagi maksimal miqdor</small>
              <button class="remove-button" type="button" @click="removeItem(item.id)">O'chirish</button>
            </div>
          </div>
          <strong class="item-price">{{ formatPrice(item.price * item.cartQuantity) }} so'm</strong>
        </article>
      </section>

      <aside class="summary-card card">
        <h2>Buyurtma tarkibi</h2>
        <div class="summary-row"><span>Mahsulotlar ({{ itemCount }} ta)</span><strong>{{ formatPrice(subtotal) }} so'm</strong></div>
        <div class="summary-row"><span>Yetkazib berish</span><strong class="delivery-note">Keyinroq hisoblanadi</strong></div>
        <div class="summary-total"><span>Jami</span><strong>{{ formatPrice(subtotal) }} so'm</strong></div>

        <p v-if="createError" class="error">{{ createError }}</p>
        <p v-if="createSuccess" class="success">Buyurtma muvaffaqiyatli qabul qilindi!</p>

        <RouterLink v-if="!currentUser && cart.length" to="/signin" class="submit checkout-link">Davom etish uchun kiring</RouterLink>
        <button v-else class="submit" type="button" :disabled="creating || cart.length === 0 || !deliveryLocation" @click="createOrder">
          {{ creating ? 'Yuborilmoqda...' : 'Buyurtmani rasmiylashtirish' }}
        </button>
        <p class="secure-note">{{ deliveryLocation ? 'Tanlangan manzil buyurtma bilan birga saqlanadi.' : 'Buyurtma berishdan oldin xaritada manzilni tanlang.' }}</p>
      </aside>
    </main>

    <details class="tracking-section">
      <summary>Buyurtma ID orqali holatini tekshirish</summary>
      <form class="tracking-form" @submit.prevent="lookupOrder" novalidate>
        <label class="field">
          <span>Buyurtma ID</span>
          <input v-model.trim="lookupId" type="text" placeholder="Buyurtma UUID" required />
        </label>
        <p v-if="lookupError" class="error">{{ lookupError }}</p>
        <button class="submit outline" type="submit" :disabled="lookupLoading || !lookupId">
          {{ lookupLoading ? 'Qidirilmoqda...' : 'Qidirish' }}
        </button>
      </form>
      <div v-if="foundOrder" class="order-result">
        <div class="row"><span>Buyurtma ID</span><strong>{{ foundOrder.id }}</strong></div>
        <div class="row"><span>Mahsulot ID</span><strong>{{ foundOrder.productId }}</strong></div>
        <div v-if="foundOrder.deliveryAddress" class="row"><span>Yetkazib berish</span><strong>{{ foundOrder.deliveryAddress }}</strong></div>
        <div v-if="foundOrder.deliveryLatitude != null && foundOrder.deliveryLongitude != null" class="row">
          <span>Tanlangan nuqta</span>
          <a
            :href="`https://www.openstreetmap.org/?mlat=${foundOrder.deliveryLatitude}&mlon=${foundOrder.deliveryLongitude}#map=16/${foundOrder.deliveryLatitude}/${foundOrder.deliveryLongitude}`"
            target="_blank"
            rel="noopener noreferrer"
          >Xaritada ochish</a>
        </div>
        <div class="row"><span>Buyurtma holati</span><strong>{{ orderStatusLabel(foundOrder.status) }}</strong></div>
        <button class="cancel-btn" type="button" :disabled="cancelling" @click="cancelOrder">
          {{ cancelling ? 'Bekor qilinmoqda...' : 'Buyurtmani bekor qilish' }}
        </button>
      </div>
    </details>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api, { resolveApiError } from '../api.js'
import { readCart, writeCart } from '../cart.js'
import { orderStatusLabel } from '../orderStatus.js'

const route = useRoute()

const currentUser = ref(null)
const cart = ref(readCart())
const deliveryMapElement = ref(null)
const deliveryLocation = ref(null)
const locationError = ref('')
const creating = ref(false)
const createError = ref('')
const createSuccess = ref(false)
const itemCount = computed(() => cart.value.reduce((total, item) => total + item.cartQuantity, 0))
const subtotal = computed(() => cart.value.reduce((total, item) => total + item.price * item.cartQuantity, 0))

const lookupId = ref('')
const lookupLoading = ref(false)
const lookupError = ref('')
const foundOrder = ref(null)
const cancelling = ref(false)
let deliveryMap
let deliveryMarker

const DELIVERY_ADDRESS = 'Surxondaryo viloyati, Sho‘rchi tumani'
const SHORCHI_CENTER = [38.003, 67.788]

function initials(name) {
  return name ? name.trim().slice(0, 2).toUpperCase() : '??'
}

function formatPrice(price) {
  return new Intl.NumberFormat('uz-UZ').format(price ?? 0)
}

function saveCart() {
  writeCart(cart.value)
}

function selectDeliveryLocation(latitude, longitude) {
  deliveryLocation.value = { latitude, longitude }
  locationError.value = ''
  if (deliveryMarker) {
    deliveryMarker.setLatLng([latitude, longitude])
  } else {
    deliveryMarker = L.marker([latitude, longitude]).addTo(deliveryMap)
  }
}

function initializeDeliveryMap() {
  if (!deliveryMapElement.value) return
  try {
    deliveryMap = L.map(deliveryMapElement.value).setView(SHORCHI_CENTER, 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(deliveryMap)
    deliveryMap.on('click', (event) => {
      selectDeliveryLocation(event.latlng.lat, event.latlng.lng)
    })
  } catch (error) {
    console.error('Yetkazib berish xaritasini yuklashda xato:', error)
    locationError.value = 'Xaritani yuklab bo‘lmadi. Sahifani yangilab qaytadan urinib ko‘ring.'
  }
}

function changeQuantity(item, amount) {
  item.cartQuantity = Math.max(1, Math.min(item.cartQuantity + amount, item.quantity))
  saveCart()
}

function removeItem(productId) {
  cart.value = cart.value.filter((item) => item.id !== productId)
  saveCart()
}

async function addRouteProduct(productId) {
  if (cart.value.some((item) => item.id === productId)) return
  try {
    const response = await api.get(`/products/getById/${productId}`)
    if (response.data) {
      cart.value.push({ ...response.data, cartQuantity: 1 })
      saveCart()
    }
  } catch (error) {
    console.error('Mahsulotni savatga olishda xato:', error)
  }
}

async function createOrder() {
  if (!currentUser.value?.id) {
    createError.value = 'Buyurtma yuborish uchun tizimga kiring.'
    return
  }
  if (!deliveryLocation.value) {
    createError.value = 'Buyurtma berishdan oldin xaritada manzilni tanlang.'
    return
  }

  createError.value = ''
  createSuccess.value = false
  creating.value = true
  let createdCount = 0

  try {
    for (const item of [...cart.value]) {
      while (item.cartQuantity > 0) {
        const response = await api.post('/orders/create', {
          userId: currentUser.value.id,
          productId: item.id,
          deliveryAddress: DELIVERY_ADDRESS,
          deliveryLatitude: deliveryLocation.value.latitude,
          deliveryLongitude: deliveryLocation.value.longitude
        })

        if (response.data !== true) throw new Error('Buyurtma yaratilmadi')

        createdCount += 1
        item.cartQuantity -= 1
        if (item.cartQuantity === 0) {
          cart.value = cart.value.filter((entry) => entry.id !== item.id)
        }
        saveCart()
      }
    }

    createSuccess.value = true
  } catch (error) {
    console.error('Buyurtma yaratish xatosi:', error)
    createError.value = createdCount
      ? `${createdCount} ta buyurtma qabul qilindi, qolgan mahsulotlar savatda saqlandi.`
      : "Buyurtma yuborishda xatolik yuz berdi. Qaytadan urinib ko'ring."
  } finally {
    creating.value = false
  }
}

async function lookupOrder() {
  lookupError.value = ''
  foundOrder.value = null
  lookupLoading.value = true
  try {
    const response = await api.get(`/orders/getById/${lookupId.value}`)
    if (!response.data) {
      lookupError.value = "Bunday buyurtma topilmadi."
      return
    }
    foundOrder.value = {
      ...response.data,
      status: response.data.status || 'NEW'
    }
  } catch (error) {
    console.error('Buyurtmani qidirishda xato:', error)
    lookupError.value = resolveApiError(error, "Buyurtmani qidirishda xatolik yuz berdi.")
  } finally {
    lookupLoading.value = false
  }
}

async function cancelOrder() {
  if (!foundOrder.value) return
  cancelling.value = true
  try {
    await api.delete(`/orders/delete/${foundOrder.value.id}`)
    foundOrder.value = null
    lookupId.value = ''
  } catch (error) {
    console.error('Buyurtmani bekor qilishda xato:', error)
    lookupError.value = resolveApiError(error, 'Bekor qilishda xatolik yuz berdi.')
  } finally {
    cancelling.value = false
  }
}

onMounted(() => {
  initializeDeliveryMap()

  try {
    const stored = localStorage.getItem('velox_user')
    if (stored) currentUser.value = JSON.parse(stored)
  } catch {
    localStorage.removeItem('velox_user')
  }

  if (route.query.productId) addRouteProduct(route.query.productId)
})

onUnmounted(() => {
  deliveryMap?.remove()
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');
.order-page{min-height:100vh;background:#f7f5f1;color:#171717;font-family:'DM Sans',sans-serif;padding-bottom:80px}.page-head{max-width:1120px;margin:auto;padding:34px 24px 28px;border-bottom:1px solid #e5e0d8}.brand{color:#171717;text-decoration:none;font:800 25px Manrope;letter-spacing:-1px}.brand span{color:#ff6235}.page-title{display:flex;align-items:end;gap:12px;margin-top:45px}.page-title h1{font:800 42px Manrope;letter-spacing:-2px;margin:0}.page-title span{color:#77736d;font-size:13px;margin-bottom:7px}.delivery-location{max-width:1120px;margin:28px auto 0;padding:0 24px}.delivery-heading{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:14px}.delivery-heading h2{font:800 22px Manrope;margin:0 0 6px}.delivery-heading p,.location-hint,.selected-location{margin:0;color:#77736d;font-size:13px}.location-region{flex:none;padding:9px 12px;border-radius:10px;background:#fff;border:1px solid #e5e0d8;font-size:12px;font-weight:700}.delivery-map{height:360px;border:1px solid #e5e0d8;border-radius:16px;overflow:hidden;z-index:0}.selected-location,.location-hint{margin-top:10px}.selected-location{color:#267345;font-weight:700}.location-error{color:#c83e2e;font-size:13px}.cart-layout{max-width:1120px;margin:35px auto 0;padding:0 24px;display:grid;grid-template-columns:1fr 350px;gap:42px}.cart-list{background:#fff;border:1px solid #e5e0d8;border-radius:18px;padding:0 20px}.cart-item{display:grid;grid-template-columns:100px 1fr auto;gap:18px;align-items:center;padding:20px 0;border-bottom:1px solid #eee9e2}.cart-item:last-child{border-bottom:0}.thumb{width:100px;height:100px;border-radius:13px;background:#eeebe5;display:grid;place-items:center;font:800 25px Manrope;color:#aaa39a;overflow:hidden}.item-info h2{font-size:16px;margin:0 0 6px}.stock-label,.secure-note{font-size:12px;color:#89847d}.item-actions{display:flex;align-items:center;gap:15px;margin-top:14px}.quantity-control{display:flex;border:1px solid #ddd8d0;border-radius:9px;overflow:hidden}.quantity-control button{width:32px;height:32px;border:0;background:#fff;color:#171717;font-size:18px;line-height:1;cursor:pointer}.quantity-control button:disabled{color:#89847d;cursor:not-allowed;opacity:1}.quantity-control span{width:32px;display:grid;place-items:center;font-size:13px}.stock-limit{color:#89847d;font-size:11px}.remove-button,.cancel-btn{border:0;background:transparent;color:#c74d3a;font-size:12px;font-weight:700}.item-price{font-size:15px}.summary-card{background:#171717;color:#fff;border-radius:20px;padding:25px;position:sticky;top:100px}.summary-card h2{font:800 20px Manrope;margin:0 0 25px}.summary-row,.summary-total{display:flex;justify-content:space-between;gap:20px;padding:12px 0;font-size:13px;color:#aaa6a0}.summary-row strong{color:#fff}.delivery-note{font-weight:500;font-size:11px}.summary-total{margin-top:10px;border-top:1px solid #333;padding-top:18px;color:#fff;font-size:15px}.summary-total strong{font-size:19px}.submit,.continue-button{display:flex;width:100%;height:50px;align-items:center;justify-content:center;border:0;border-radius:11px;background:#ff6235;color:#fff;text-decoration:none;font-weight:700;margin-top:18px}.checkout-link{background:#fff;color:#171717}.secure-note{display:block;text-align:center;margin:14px 0 0}.error{color:#ff9a88;font-size:12px}.success{color:#75d69b;font-size:12px}.empty-cart{text-align:center;padding:65px 20px}.empty-icon{font-size:38px}.empty-cart h2{font:800 23px Manrope;margin:15px 0 8px}.empty-cart p{color:#77736d;font-size:13px}.continue-button{width:160px;margin:20px auto 0;background:#171717}.tracking-section{max-width:1120px;margin:25px auto 0;padding:0 24px}.tracking-section summary{cursor:pointer;font-weight:700;font-size:13px}.tracking-form{margin-top:16px;max-width:480px}.field{display:flex;flex-direction:column;gap:6px}.field span{font-size:12px;font-weight:700}.field input{height:45px;border:1px solid #ddd8d0;border-radius:10px;padding:0 12px;background:#fff;outline:0}.outline{background:#171717;color:#fff}.order-result{max-width:480px;background:#fff;border:1px solid #e5e0d8;border-radius:14px;padding:18px;margin-top:15px}.row{display:flex;justify-content:space-between;padding:8px 0;font-size:12px}.row strong{max-width:65%;overflow:hidden;text-overflow:ellipsis}.cancel-btn{margin-top:10px}@media(max-width:850px){.cart-layout{grid-template-columns:1fr}.summary-card{position:static}}@media(max-width:600px){.delivery-location{padding:0 16px}.delivery-heading{align-items:flex-start;flex-direction:column}.delivery-map{height:300px}.cart-layout{padding:0 16px}.cart-item{grid-template-columns:72px 1fr}.thumb{width:72px;height:72px}.item-price{grid-column:2}.page-title h1{font-size:34px}}
</style>
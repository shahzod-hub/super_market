<template>
  <div class="admin">
    <aside class="sidebar">
      <p class="brand">Velox<span>Shoop</span></p>
      <p class="brand-sub">Admin panel</p>

      <nav class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          type="button"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </nav>

      <RouterLink to="/" class="back-link">← Do'konga qaytish</RouterLink>
    </aside>

    <main class="content">
      <!-- MAHSULOTLAR -->
      <section v-if="activeTab === 'products'">
        <div class="section-head">
          <h1>Mahsulotlar</h1>
          <button class="primary-btn" type="button" @click="showProductForm = !showProductForm">
            {{ showProductForm ? 'Bekor qilish' : '+ Mahsulot qo\'shish' }}
          </button>
        </div>

        <form v-if="showProductForm" class="inline-form" @submit.prevent="createProduct" novalidate>
          <input v-model.trim="newProduct.name" type="text" placeholder="Nomi" required />
          <input v-model.number="newProduct.price" type="number" min="0" step="0.01" placeholder="Narxi" required />
          <input v-model.number="newProduct.quantity" type="number" min="0" placeholder="Miqdori" required />
          <input v-model.trim="newProduct.imageUrl" type="text" placeholder="Rasm URL manzilini kiriting" />
          <button class="primary-btn" type="submit" :disabled="creatingProduct">
            {{ creatingProduct ? 'Qo\'shilmoqda...' : "Qo'shish" }}
          </button>
        </form>
        <p v-if="productFormError" class="error">{{ productFormError }}</p>

        <div v-if="productsLoading" class="state">Yuklanmoqda...</div>
        <div v-else-if="productsError" class="state error">{{ productsError }}</div>
        <div v-else-if="products.length === 0" class="state">Mahsulotlar mavjud emas.</div>

        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Nomi</th>
              <th>Narxi</th>
              <th>Miqdori</th>
              <th>Rasm</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in products" :key="p.id">
              <td>{{ p.name }}</td>
              <td>{{ formatPrice(p.price) }} so'm</td>
              <td>{{ p.quantity }}</td>
              <td>{{ p.image }}</td>
              <td class="actions">
                <button class="danger-link" type="button" @click="deleteProduct(p.id)">O'chirish</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- FOYDALANUVCHILAR -->
      <section v-if="activeTab === 'users'">
        <div class="section-head">
          <h1>Foydalanuvchilar</h1>
          <button class="primary-btn" type="button" @click="showNotificationForm = !showNotificationForm">
            {{ showNotificationForm ? 'Yopish' : 'Bildirishnoma yuborish' }}
          </button>
        </div>

        <form v-if="showNotificationForm" class="notification-form" @submit.prevent="sendNotification" novalidate>
          <label>
            <span>Foydalanuvchi</span>
            <select v-model="notificationUserId" required>
              <option value="" disabled>Foydalanuvchini tanlang</option>
              <option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }} ({{ user.email }})</option>
            </select>
          </label>
          <label>
            <span>Xabar matni</span>
            <textarea v-model.trim="notificationMessage" maxlength="2000" rows="4" placeholder="Foydalanuvchiga yuboriladigan xabar..." required></textarea>
          </label>
          <p v-if="notificationError" class="error">{{ notificationError }}</p>
          <p v-if="notificationSuccess" class="success">{{ notificationSuccess }}</p>
          <button class="primary-btn" type="submit" :disabled="sendingNotification || !notificationUserId || !notificationMessage">
            {{ sendingNotification ? 'Yuborilmoqda...' : 'Yuborish' }}
          </button>
        </form>

        <div v-if="usersLoading" class="state">Yuklanmoqda...</div>
        <div v-else-if="usersError" class="state error">{{ usersError }}</div>
        <div v-else-if="users.length === 0" class="state">Foydalanuvchilar mavjud emas.</div>

        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Ism</th>
              <th>Email</th>
              <th>Role</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td>{{ u.name }}</td>
              <td>{{ u.email || '—' }}</td>
              <td>{{ u.role }}</td>
              <td class="actions">
                <button class="danger-link" type="button" :disabled="deletingUserId === u.id" @click="deleteUser(u.id)">
                  {{ deletingUserId === u.id ? "O'chirilmoqda..." : "O'chirish" }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- BUYURTMALAR -->
      <section v-if="activeTab === 'orders'">
        <div class="section-head">
          <h1>Buyurtmalar</h1>
          <button class="primary-btn" type="button" :disabled="ordersLoading" @click="fetchOrders">
            {{ ordersLoading ? 'Yuklanmoqda...' : 'Yangilash' }}
          </button>
        </div>

        <p class="notice">Statuslar faqat shu brauzerda saqlanadi, backendga yuborilmaydi.</p>
        <div v-if="ordersLoading" class="state">Buyurtmalar yuklanmoqda...</div>
        <p v-else-if="ordersError" class="error">{{ ordersError }}</p>
        <div v-else-if="orders.length === 0" class="state">Buyurtmalar mavjud emas.</div>
        <table v-else class="data-table">
          <thead>
            <tr><th>Buyurtma ID</th><th>Foydalanuvchi ID</th><th>Mahsulot ID</th><th>Yetkazib berish</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <td class="mono">{{ order.id }}</td>
              <td class="mono">{{ order.userId }}</td>
              <td class="mono">{{ order.productId }}</td>
              <td>
                <a
                  v-if="order.deliveryLatitude != null && order.deliveryLongitude != null"
                  :href="`https://www.openstreetmap.org/?mlat=${order.deliveryLatitude}&mlon=${order.deliveryLongitude}#map=16/${order.deliveryLatitude}/${order.deliveryLongitude}`"
                  target="_blank"
                  rel="noopener noreferrer"
                >{{ order.deliveryAddress || 'Xaritada ochish' }}</a>
                <span v-else>{{ order.deliveryAddress || '—' }}</span>
              </td>
              <td>
                <select class="status-select" :value="order.status" :aria-label="`${order.id} buyurtma statusi`" @change="updateOrderStatus(order, $event.target.value)">
                  <option v-for="status in ORDER_STATUSES" :key="status.value" :value="status.value">{{ status.label }}</option>
                </select>
              </td>
              <td class="actions">
                <button class="danger-link" type="button" @click="deleteOrder(order.id)">O'chirish</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="ordersActionError" class="error">{{ ordersActionError }}</p>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import axios from 'axios'
import { ORDER_STATUSES, writeOrdersCacheForUser } from '../orderStatus.js'
import { useNotification } from '../composables/useNotification.js'

const API_BASE = '/api'
const { addNotification } = useNotification()

const tabs = [
  { id: 'products', label: 'Mahsulotlar' },
  { id: 'users', label: 'Foydalanuvchilar' },
  { id: 'orders', label: 'Buyurtmalar' }
]
const activeTab = ref('products')

/* Mahsulotlar */
const products = ref([])
const productsLoading = ref(true)
const productsError = ref('')
const showProductForm = ref(false)
const creatingProduct = ref(false)
const productFormError = ref('')
const newProduct = reactive({ name: '', price: null, quantity: null, imageUrl: '' })

async function fetchProducts() {
  productsLoading.value = true
  productsError.value = ''
  try {
    const response = await axios.get(`${API_BASE}/products/getAll`)
    products.value = response.data.flat()
  } catch (error) {
    console.error('Mahsulotlarni olishda xato:', error)
    productsError.value = "Mahsulotlarni yuklab bo'lmadi."
  } finally {
    productsLoading.value = false
  }
}

async function createProduct() {
  productFormError.value = ''
  creatingProduct.value = true
  try {
    await axios.post(`${API_BASE}/products`, {
      name: newProduct.name,
      price: newProduct.price,
      quantity: newProduct.quantity,
      image: newProduct.imageUrl
    })
    newProduct.name = ''
    newProduct.price = null
    newProduct.quantity = null
    newProduct.imageUrl=''
    showProductForm.value = false
    await fetchProducts()
  } catch (error) {
    console.error('Mahsulot qo\'shishda xato:', error)
    productFormError.value = "Mahsulot qo'shilmadi."
  } finally {
    creatingProduct.value = false
  }
}

async function deleteProduct(id) {
  if (!confirm("Bu mahsulotni o'chirmoqchimisiz?")) return
  try {
    await axios.delete(`${API_BASE}/products/delete/${id}`)
    await fetchProducts()
  } catch (error) {
    console.error('Mahsulotni o\'chirishda xato:', error)
  }
}

/* Foydalanuvchilar */
const users = ref([])
const usersLoading = ref(true)
const usersError = ref('')
const deletingUserId = ref(null)
const showNotificationForm = ref(false)
const notificationUserId = ref('')
const notificationMessage = ref('')
const sendingNotification = ref(false)
const notificationError = ref('')
const notificationSuccess = ref('')

async function fetchUsers() {
  usersLoading.value = true
  usersError.value = ''
  try {
    const response = await axios.get(`${API_BASE}/users/getAll`)
    const payload = response.data
    const list = Array.isArray(payload) ? payload.flat() : payload?.users ?? payload?.data
    if (!Array.isArray(list)) throw new Error('Foydalanuvchilar ro\'yxati noto\'g\'ri formatda.')
    users.value = list
  } catch (error) {
    console.error('Foydalanuvchilarni olishda xato:', error)
    users.value = []
    usersError.value = error.response?.status
      ? `Foydalanuvchilarni yuklab bo'lmadi (HTTP ${error.response.status}).`
      : error.message || "Foydalanuvchilarni yuklab bo'lmadi."
  } finally {
    usersLoading.value = false
  }
}

async function deleteUser(id) {
  if (!confirm("Bu foydalanuvchini o'chirmoqchimisiz?")) return
  deletingUserId.value = id
  try {
    await axios.delete(`${API_BASE}/users/delete/${id}`)
    await fetchUsers()
  } catch (error) {
    console.error('Foydalanuvchini o\'chirishda xato:', error)
    usersError.value = error.response?.status
      ? `Foydalanuvchini o'chirib bo'lmadi (HTTP ${error.response.status}).`
      : error.message || "Foydalanuvchini o'chirib bo'lmadi."
  } finally {
    deletingUserId.value = null
  }
}

function sendNotification() {
  notificationError.value = ''
  notificationSuccess.value = ''
  sendingNotification.value = true
  try {
    const user = users.value.find((entry) => entry.id === notificationUserId.value)
    if (!user) throw new Error('Foydalanuvchini tanlang.')
    addNotification('Admin xabari', notificationMessage.value, 'info', { userId: user.id })
    notificationSuccess.value = 'Bildirishnoma foydalanuvchiga yuborildi.'
    notificationMessage.value = ''
  } catch (error) {
    console.error('Bildirishnoma yuborishda xato:', error)
    notificationError.value = error.message || 'Bildirishnoma yuborilmadi.'
  } finally {
    sendingNotification.value = false
  }
}

/* Buyurtmalar */
const orders = ref([])
const ordersLoading = ref(false)
const ordersError = ref('')
const ordersActionError = ref('')

async function fetchOrders() {
  ordersError.value = ''
  ordersLoading.value = true
  try {
    const response = await axios.get(`${API_BASE}/orders/getAll`)
    const orderList = Array.isArray(response.data) ? response.data.flat() : null
    if (!orderList || !orderList.every((order) => order && order.id)) {
      throw new Error("Buyurtmalar ro'yxati noto'g'ri formatda.")
    }
    orders.value = orderList.map((order) => ({
      ...order,
      status: order.status || 'NEW'
    }))
  } catch (error) {
    console.error('Buyurtmalarni olishda xato:', error)
    ordersError.value = error.message || "Buyurtmalarni yuklab bo'lmadi."
  } finally {
    ordersLoading.value = false
  }
}

async function updateOrderStatus(order, status) {
  ordersActionError.value = ''
  const previousStatus = order.status
  order.status = status
  try {
    const response = await axios.put(`${API_BASE}/orders/update/${order.id}`, order)
    if (response.data !== true) throw new Error('Buyurtma statusi yangilanmadi.')

    const userOrders = JSON.parse(localStorage.getItem(`velox_orders:${order.userId}`) || '[]')
    const mapped = Array.isArray(userOrders) ? userOrders : []
    const index = mapped.findIndex((entry) => String(entry.id) === String(order.id))
    if (index >= 0) {
      mapped[index] = { ...mapped[index], ...order }
      writeOrdersCacheForUser(order.userId, mapped)
    }
  } catch (error) {
    console.error('Buyurtma statusini saqlashda xato:', error)
    order.status = previousStatus
    ordersActionError.value = error.response?.status
      ? `Statusni saqlab bo'lmadi (HTTP ${error.response.status}).`
      : error.message || "Statusni saqlab bo'lmadi."
  }
}

async function deleteOrder(id) {
  if (!confirm("Bu buyurtmani o'chirmoqchimisiz?")) return
  ordersActionError.value = ''
  try {
    await axios.delete(`${API_BASE}/orders/delete/${id}`)
    orders.value = orders.value.filter((order) => order.id !== id)
  } catch (error) {
    console.error('Buyurtmani o\'chirishda xato:', error)
    ordersActionError.value = "Buyurtmani o'chirib bo'lmadi."
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat('uz-UZ').format(price ?? 0)
}

watch(activeTab, (tab) => {
  if (tab === 'products' && products.value.length === 0) fetchProducts()
  if (tab === 'users' && users.value.length === 0) fetchUsers()
  if (tab === 'orders') fetchOrders()
})

onMounted(fetchProducts)
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');
.admin{min-height:100vh;display:grid;grid-template-columns:240px 1fr;background:#f7f5f1;color:#171717;font-family:'DM Sans',sans-serif}.sidebar{background:#171717;color:#fff;padding:28px 18px;display:flex;flex-direction:column}.brand{font:800 24px Manrope;margin:0;letter-spacing:-1px}.brand span{color:#ff6235}.brand-sub{color:#8e8982;font-size:11px;margin:3px 0 32px}.tabs{display:flex;flex-direction:column;gap:5px}.tab-btn{border:0;background:transparent;color:#98928b;text-align:left;padding:12px 13px;border-radius:10px;font-weight:600}.tab-btn:hover{color:#fff;background:#222}.tab-btn.active{background:#ff6235;color:#fff}.back-link{margin-top:auto;color:#a8a29a;text-decoration:none;font-size:12px;padding:12px}.content{padding:40px;max-width:1200px;width:100%}.section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px}.section-head h1{font:800 30px Manrope;letter-spacing:-1px;margin:0}.primary-btn{border:0;background:#171717;color:#fff;border-radius:10px;padding:11px 16px;font-weight:700}.primary-btn:hover:not(:disabled){background:#ff6235}.primary-btn:disabled{opacity:.55;cursor:not-allowed}.inline-form{background:#fff;border:1px solid #e5e0d8;border-radius:15px;padding:15px;display:flex;flex-wrap:wrap;gap:9px;margin-bottom:16px}.inline-form input{height:42px;border:1px solid #ddd8d0;border-radius:9px;padding:0 11px;min-width:150px;flex:1;outline:0;background:#faf9f7}.inline-form input:focus{border-color:#ff6235}.notification-form{display:grid;gap:14px;background:#fff;border:1px solid #e5e0d8;border-radius:15px;padding:18px;margin-bottom:16px}.notification-form label{display:grid;gap:7px}.notification-form label span{font-size:12px;font-weight:700;color:#5f5b55}.notification-form select,.notification-form textarea{width:100%;border:1px solid #ddd8d0;border-radius:9px;padding:11px;background:#faf9f7;color:#171717;font:inherit}.notification-form textarea{resize:vertical;min-height:90px}.notification-form .error,.notification-form .success{margin:0}.notice{background:#fff;border:1px solid #e5e0d8;border-radius:13px;padding:15px;color:#77736d;font-size:13px;line-height:1.6}.error{color:#c44734;font-size:13px}.success{color:#287b48;font-size:13px}.state{padding:45px;text-align:center;color:#77736d}.data-table{width:100%;border-collapse:separate;border-spacing:0;background:#fff;border:1px solid #e5e0d8;border-radius:15px;overflow:hidden}.data-table th,.data-table td{padding:14px 15px;text-align:left;border-bottom:1px solid #eee9e2;font-size:13px}.data-table th{background:#f2efe9;color:#77736d;font-size:10px;text-transform:uppercase;letter-spacing:.1em}.data-table tr:last-child td{border-bottom:0}.actions{text-align:right}.danger-link{border:0;background:transparent;color:#c44734;font-size:12px;font-weight:700}.mono{font-family:monospace;font-size:11px;color:#77736d}@media(max-width:760px){.admin{grid-template-columns:1fr}.sidebar{padding:18px;position:sticky;top:0;z-index:10}.brand-sub{display:none}.tabs{flex-direction:row;overflow:auto;margin:12px 0}.tab-btn{white-space:nowrap}.back-link{display:none}.content{padding:25px 16px}.data-table{display:block;overflow:auto}}
.status-select{height:36px;max-width:180px;border:1px solid #ddd8d0;border-radius:8px;padding:0 8px;background:#faf9f7;color:#171717;font:inherit}
</style>
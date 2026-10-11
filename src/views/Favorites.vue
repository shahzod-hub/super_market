<template>
  <div class="favorites-page">
    <header class="page-header">
      <div class="header-inner">
        <RouterLink to="/" class="brand">velox<span>.</span></RouterLink>
        <RouterLink to="/" class="back-link">← Asosiy sahifa</RouterLink>
      </div>
    </header>

    <main class="page-content">
      <section class="favorites-wrap">
        <div class="page-title">
          <span class="kicker">SARALANGANLAR</span>
          <h1>Sevimlilar</h1>
        </div>

        <div v-if="loading" class="state">Mahsulotlar yuklanmoqda...</div>
        <div v-else-if="errorMessage" class="state error">{{ errorMessage }}</div>
        <div v-else-if="favoriteProducts.length === 0" class="empty-state">
          <div class="empty-icon">♥</div>
          <h2>Hali saralangan mahsulot yo‘q</h2>
          <p>Sevimli mahsulotlaringizni katalogdan qo‘shib, bu yerda ko‘rishingiz mumkin.</p>
          <RouterLink to="/" class="primary-btn">Mahsulotlarni ko‘rish</RouterLink>
        </div>
        <div v-else class="favorites-grid">
          <article v-for="product in favoriteProducts" :key="product.id" class="product-card">
            <div class="product-image">
              <img v-if="product.image" :src="product.image" :alt="product.name" @error="$event.target.style.display='none'" />
              <span v-else>{{ initials(product.name) }}</span>
              <button class="favorite-toggle active" type="button" @click="toggleFavorite(product)" aria-label="Saralanganlardan olib tashlash">♥</button>
            </div>
            <div class="product-info">
              <p class="category">VELОX COLLECTION</p>
              <h3>{{ product.name }}</h3>
              <div class="product-bottom">
                <strong>{{ formatPrice(product.price) }} so‘m</strong>
                <button class="add-btn" :disabled="product.quantity === 0" @click="addToCart(product)">{{ product.quantity === 0 ? 'Tugagan' : 'Savatga' }}</button>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import api, { normalizeListResponse, resolveApiError } from '../api.js'
import { readCart, readFavorites, writeCart, writeFavorites } from '../cart.js'
import { useNotification } from '../composables/useNotification.js'

const products = ref([])
const loading = ref(true)
const errorMessage = ref('')
const { addNotification } = useNotification()

const favoriteIds = computed(() => new Set(readFavorites()))
const favoriteProducts = computed(() =>
  products.value.filter((product) => favoriteIds.value.has(product.id))
)

function initials(name) {
  return name ? name.trim().slice(0, 2).toUpperCase() : '??'
}

function formatPrice(price) {
  return new Intl.NumberFormat('uz-UZ').format(price ?? 0)
}

function addToCart(product) {
  const cart = readCart()
  const existing = cart.find((entry) => entry.id === product.id)
  const limit = Number(product.quantity) || 0

  if (existing) {
    const nextQuantity = Math.min((existing.cartQuantity || 1) + 1, limit)
    if (nextQuantity === (existing.cartQuantity || 1) || limit === 0) {
      addNotification('Mahsulot tugadi', `${product.name} omborda qolmagan.`, 'warning')
      return
    }
    Object.assign(existing, product)
    existing.cartQuantity = nextQuantity
  } else {
    if (limit === 0) {
      addNotification('Mahsulot tugadi', `${product.name} omborda qolmagan.`, 'warning')
      return
    }
    cart.push({ ...product, cartQuantity: 1 })
  }

  writeCart(cart)
  addNotification('Mahsulot qo‘shildi', `${product.name} savatga qo‘shildi.`, 'success')
}

function toggleFavorite(product) {
  const favoriteList = readFavorites()
  const alreadySaved = favoriteList.includes(product.id)
  const nextFavorites = alreadySaved
    ? favoriteList.filter((id) => id !== product.id)
    : [...favoriteList, product.id]

  writeFavorites(nextFavorites)
  addNotification(
    alreadySaved ? 'Saralanganlardan olib tashlandi' : 'Saralanganlarga qo‘shildi',
    alreadySaved ? `${product.name} saralanganlar ro‘yxatidan o‘chirildi.` : `${product.name} saralanganlar ro‘yxatiga qo‘shildi.`,
    'success'
  )
}

async function fetchProducts() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await api.get('/products/getAll')
    products.value = normalizeListResponse(response.data)
  } catch (error) {
    console.error(error)
    errorMessage.value = resolveApiError(error, 'Mahsulotlarni yuklab bo‘lmadi. Backend ishga tushirilganini tekshiring.')
  } finally {
    loading.value = false
  }
}

onMounted(fetchProducts)
</script>

<style scoped>
.favorites-page{min-height:100vh;background:#f7f5f1;color:#171717;font-family:'DM Sans',sans-serif}
.page-header{position:sticky;top:0;z-index:20;background:rgba(247,245,241,.9);backdrop-filter:blur(18px);border-bottom:1px solid #e5e0d8}
.header-inner{max-width:1240px;margin:0 auto;height:76px;padding:0 28px;display:flex;align-items:center;justify-content:space-between;gap:18px}
.brand{font:800 27px Manrope;text-decoration:none;color:#171717;letter-spacing:-1.5px}.brand span{color:#ff6235}
.back-link{color:#171717;text-decoration:none;font-weight:700;font-size:14px}
.page-content{max-width:1240px;margin:0 auto;padding:54px 28px 90px}
.page-title{margin-bottom:26px}
.kicker{font-size:11px;letter-spacing:.16em;font-weight:800;color:#ff6235}
.page-title h1{font:800 clamp(34px,4vw,52px)/1.04 Manrope;letter-spacing:-2px;margin:12px 0 0}
.favorites-wrap{background:transparent}
.favorites-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.product-card{background:#fff;border:1px solid #e5e0d8;border-radius:17px;overflow:hidden;transition:.25s transform,.25s box-shadow}
.product-card:hover{transform:translateY(-5px);box-shadow:0 18px 35px rgba(30,25,20,.08)}
.product-image{height:245px;background:#eeebe5;position:relative;display:grid;place-items:center;overflow:hidden}
.product-image img{width:100%;height:100%;object-fit:cover}
.product-image span{font:800 42px Manrope;color:#bbb4a9}
.favorite-toggle{position:absolute;top:12px;right:12px;width:34px;height:34px;border:0;border-radius:10px;background:#fff;color:#ff6235;font-size:18px;cursor:pointer;box-shadow:0 8px 18px rgba(0,0,0,.08)}
.favorite-toggle.active{background:#ffefeb}
.product-info{padding:16px}
.category{font-size:9px;letter-spacing:.13em;color:#a09a91;font-weight:800;margin:0 0 7px}
.product-info h3{font-size:15px;margin:0 0 18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.product-bottom{display:flex;align-items:center;justify-content:space-between;gap:12px}
.product-bottom strong{font-size:15px}
.add-btn{height:38px;padding:0 16px;border:0;border-radius:10px;background:#171717;color:#fff;font-weight:700;cursor:pointer}
.add-btn:disabled{background:#ddd;color:#999;cursor:not-allowed}
.empty-state{text-align:center;padding:80px 20px;background:#fff;border:1px solid #e5e0d8;border-radius:18px}
.empty-icon{font-size:52px;color:#ff6235;margin-bottom:10px}
.empty-state h2{font:800 28px Manrope;letter-spacing:-1px;margin:0 0 10px}
.empty-state p{max-width:560px;margin:0 auto 22px;color:#77736d;line-height:1.7}
.primary-btn{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;background:#171717;color:#fff;border-radius:12px;padding:14px 18px;font-weight:700}
.state{padding:40px 16px;text-align:center;color:#77736d}
.error{color:#d84d3b}
@media(max-width:900px){.favorites-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:620px){.header-inner{padding:0 16px}.page-content{padding:38px 16px 72px}.favorites-grid{grid-template-columns:1fr}.product-image{height:220px}.empty-state{padding:58px 18px}.primary-btn{width:100%}}
</style>

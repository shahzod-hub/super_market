<template>
  <div class="shop">
    <header class="navbar">
      <div class="nav-inner">
        <RouterLink to="/" class="brand">velox<span></span></RouterLink>
        <div class="search-box">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5"/></svg>
          <input v-model.trim="searchTerm" type="text" placeholder="Mahsulot qidirish..." />
        </div>
        <nav class="nav-actions">
          <RouterLink to="/about" class="about-link">Biz haqimizda</RouterLink>
          <RouterLink to="/orders" class="about-link">Buyurtmalarim</RouterLink>
          <RouterLink to="/favorites" class="favorites-link">
            Saralanganlar<b v-if="favoritesCount">{{ favoritesCount }}</b>
          </RouterLink>
          <RouterLink to="/signin" class="login-link">Kirish</RouterLink>
          <NotificationBell />
          <RouterLink to="/order" class="cart-link" aria-label="Savat">
            <svg viewBox="0 0 24 24"><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>
            <span>Savat</span><b v-if="cartCount">{{ cartCount }}</b>
          </RouterLink>
        </nav>
      </div>
    </header>

    <main>
      <section class="hero">
        <div class="hero-copy">
          <span class="eyebrow">VELОX SELECT · 2026</span>
          <h1>Har kuni kerak bo'ladigan narsalar<br><em>Yaxshi tanlangan</em></h1>
          <p>Minimal tanlov, aniq narxlar va qulay buyurtma O‘zingizga keraklisini toping</p>
          <button class="hero-btn" @click="scrollToProducts">Mahsulotlarni ko‘rish <span>↓</span></button>
        </div>
        <div class="hero-art" aria-hidden="true">
          <div class="art-circle"></div><div class="art-card card-one">NEW<br><strong>9999 9999 9999 9999</strong></div>
          <div class="art-card card-two">VELОX<br><strong>SHOP</strong></div><div class="art-line"></div>
        </div>
      </section>

      <section class="products" ref="productsSection">
        <div class="section-top"><div><span class="section-kicker">KATALOG</span><h2>Barcha mahsulotlar</h2></div><span class="count" v-if="!loading">{{ filteredProducts.length }} ta mahsulot</span></div>
        <div v-if="loading" class="state">Mahsulotlar yuklanmoqda...</div>
        <div v-else-if="errorMessage" class="state error">{{ errorMessage }}</div>
        <div v-else-if="filteredProducts.length === 0" class="state">Hech qanday mahsulot topilmadi.</div>
        <div v-else class="grid">
          <article v-for="product in filteredProducts" :key="product.id" class="product-card">
            <div class="product-image">
              <img v-if="product.image" :src="product.image" :alt="product.name" @error="$event.target.style.display='none'" />
              <span v-if="!product.image">{{ initials(product.name) }}</span>
              <small v-if="product.quantity > 0 && product.quantity <= 5">Kam qoldi</small>
            </div>
            <div class="product-info">
              <p class="category">VELОX COLLECTION</p><h3>{{ product.name }}</h3>
              <div class="product-bottom">
                <strong>{{ formatPrice(product.price) }} so‘m</strong>
                <div class="product-actions">
                  <button class="favorite-toggle" :class="{ active: isFavorite(product) }" type="button" @click="toggleFavorite(product)" aria-label="Saralanganlarga qo‘shish">♥</button>
                  <button class="add-btn" :disabled="product.quantity === 0" @click="addToCart(product)">{{ product.quantity === 0 ? 'Tugagan' : '+' }}</button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>

    <footer class="footer"><div><b>velox<span>.</span></b><p>Oddiy xarid. Yaxshi tanlov.</p></div><span>© {{ new Date().getFullYear() }} Velox Shop</span></footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api, { normalizeListResponse, resolveApiError } from '../api.js'
import { readCart, writeCart, readFavorites, writeFavorites, favoritesCount } from '../cart.js'
import NotificationBell from '../components/NotificationBell.vue'
import { useNotification } from '../composables/useNotification.js'

const products = ref([])
const loading = ref(true)
const errorMessage = ref('')
const searchTerm = ref('')
const productsSection = ref(null)
const cartItems = ref(readCart())
const favoriteIds = ref(new Set(readFavorites()))

const { addNotification } = useNotification()
const cartCount = computed(() => cartItems.value.length)
const filteredProducts = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) return products.value
  return products.value.filter((product) => product.name?.toLowerCase().includes(term))
})

function initials(name) {
  return name ? name.trim().slice(0, 2).toUpperCase() : '??'
}

function formatPrice(price) {
  return new Intl.NumberFormat('uz-UZ').format(price ?? 0)
}

function isFavorite(product) {
  return favoriteIds.value.has(product.id)
}

function scrollToProducts() {
  productsSection.value?.scrollIntoView({ behavior: 'smooth' })
}

function toggleFavorite(product) {
  const favoriteList = readFavorites()
  const alreadySaved = favoriteList.includes(product.id)
  const nextFavorites = alreadySaved
    ? favoriteList.filter((id) => id !== product.id)
    : [...favoriteList, product.id]

  writeFavorites(nextFavorites)
  favoriteIds.value = new Set(nextFavorites)

  addNotification(
    alreadySaved ? 'Saralanganlardan olib tashlandi' : 'Saralanganlarga qo‘shildi',
    alreadySaved ? `${product.name} saralanganlar ro‘yxatidan o‘chirildi.` : `${product.name} saralanganlar ro‘yxatiga qo‘shildi.`,
    'success'
  )
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
  cartItems.value = cart
  addNotification('Mahsulot qo‘shildi', `${product.name} savatga qo‘shildi.`, 'success')
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
.shop{--ink:#171717;--muted:#77736d;--line:#e5e0d8;--paper:#f7f5f1;--white:#fff;--accent:#ff6235;min-height:100vh;background:var(--paper);color:var(--ink)}
.navbar{position:sticky;top:0;z-index:20;background:rgba(247,245,241,.9);backdrop-filter:blur(18px);border-bottom:1px solid var(--line)}
.nav-inner{max-width:1240px;margin:auto;height:76px;padding:0 28px;display:flex;align-items:center;gap:38px}.brand{font:800 27px Manrope;text-decoration:none;color:var(--ink);letter-spacing:-1.5px}.brand span,.footer span{color:var(--accent)}
.search-box{height:42px;max-width:510px;flex:1;display:flex;align-items:center;gap:10px;padding:0 14px;background:#fff;border:1px solid var(--line);border-radius:12px}.search-box svg{width:18px;fill:none;stroke:#77736d;stroke-width:1.8}.search-box input{border:0;outline:0;width:100%;background:transparent;color:var(--ink)}
.nav-actions{margin-left:auto;display:flex;align-items:center;gap:20px}.about-link,.login-link,.favorites-link{color:var(--ink);text-decoration:none;font-size:14px;font-weight:600;white-space:nowrap;transition:color .18s}.about-link:hover,.login-link:hover,.favorites-link:hover{color:var(--accent)}.favorites-link{position:relative;display:inline-flex;align-items:center;gap:8px}.favorites-link b{display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:var(--accent);color:#fff;font-size:11px}.cart-link{position:relative;display:flex;align-items:center;gap:8px;text-decoration:none;color:#fff;background:var(--ink);padding:11px 16px;border-radius:11px;font-weight:600}.cart-link svg{width:18px;fill:none;stroke:currentColor;stroke-width:1.8}.cart-link b{position:absolute;right:-7px;top:-7px;min-width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:var(--accent);font-size:11px;border:2px solid var(--paper)}
.hero{max-width:1240px;margin:0 auto;padding:74px 28px 80px;min-height:470px;display:grid;grid-template-columns:1.1fr .9fr;align-items:center;gap:40px;overflow:hidden}.hero-copy{max-width:700px}.eyebrow,.section-kicker{font-size:11px;letter-spacing:.16em;font-weight:800;color:var(--accent)}.hero h1{font:800 clamp(42px,5vw,68px)/1.03 Manrope;letter-spacing:-3px;margin:18px 0 22px}.hero h1 em{font-style:normal;color:#88837b}.hero p{max-width:560px;color:var(--muted);font-size:17px;line-height:1.65;margin:0 0 28px}.hero-btn{border:0;background:var(--accent);color:#fff;border-radius:12px;padding:14px 19px;font-weight:700;box-shadow:0 12px 28px rgba(255,98,53,.22)}.hero-btn span{margin-left:18px}.hero-art{height:330px;position:relative;background:#1b1b1b;border-radius:28px;overflow:hidden;box-shadow:0 25px 70px rgba(0,0,0,.12)}.art-circle{position:absolute;width:280px;height:280px;border-radius:50%;background:#ff6235;right:-55px;top:-55px}.art-card{position:absolute;padding:22px;font:700 13px Manrope;letter-spacing:.08em;line-height:1.6}.art-card strong{font-size:34px;letter-spacing:-2px}.card-one{left:32px;bottom:34px;color:#fff}.card-one strong{display:block;white-space:nowrap;font-size:clamp(16px,2.4vw,28px);letter-spacing:0}.card-two{right:24px;top:24px;bottom:auto;background:#f7f5f1;color:#171717;border-radius:18px;width:155px}.art-line{position:absolute;width:1px;height:240px;background:rgba(255,255,255,.25);left:52%;top:45px;transform:rotate(24deg)}
.products{max-width:1240px;margin:auto;padding:35px 28px 90px}.section-top{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:24px}.section-top h2{font:800 32px Manrope;letter-spacing:-1.4px;margin:6px 0 0}.count{color:var(--muted);font-size:13px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.product-card{background:#fff;border:1px solid var(--line);border-radius:17px;overflow:hidden;transition:.25s transform,.25s box-shadow}.product-card:hover{transform:translateY(-5px);box-shadow:0 18px 35px rgba(30,25,20,.08)}.product-image{height:245px;background:#eeebe5;position:relative;display:grid;place-items:center;overflow:hidden}.product-image img{width:100%;height:100%;object-fit:cover}.product-image span{font:800 42px Manrope;color:#bbb4a9}.product-image small{position:absolute;top:12px;left:12px;background:#171717;color:#fff;padding:6px 9px;border-radius:20px;font-size:10px;font-weight:700}.product-info{padding:16px}.category{font-size:9px;letter-spacing:.13em;color:#a09a91;font-weight:800;margin:0 0 7px}.product-info h3{font-size:15px;margin:0 0 18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.product-bottom{display:flex;align-items:center;justify-content:space-between;gap:12px}.product-bottom strong{font-size:15px}.product-actions{display:flex;align-items:center;gap:8px}.product-actions .favorite-toggle,.product-actions .add-btn{width:36px;height:36px;border:0;border-radius:10px;font-size:20px;cursor:pointer}.product-actions .favorite-toggle{background:#f4efe9;color:#171717}.product-actions .favorite-toggle.active{background:#ffefeb;color:#ff6235}.product-actions .add-btn{background:#171717;color:#fff;font-size:22px}.product-actions .add-btn:disabled{background:#ddd;color:#999;cursor:not-allowed}.state{text-align:center;padding:70px;color:var(--muted)}.error{color:#d84d3b}.footer{max-width:1240px;margin:auto;padding:30px 28px 45px;border-top:1px solid var(--line);display:flex;justify-content:space-between;color:var(--muted);font-size:12px}.footer b{font:800 20px Manrope;color:var(--ink)}.footer p{margin:7px 0 0}
@media(max-width:900px){.nav-inner{gap:16px}.nav-actions{gap:14px}.grid{grid-template-columns:repeat(2,1fr)}.hero{grid-template-columns:1fr}.hero-art{display:none}}@media(max-width:620px){.nav-inner{height:auto;padding:15px 16px;flex-wrap:wrap}.brand{font-size:24px}.nav-actions{gap:10px}.about-link{font-size:12px}.search-box{order:3;flex-basis:100%}.login-link{display:none}.cart-link{padding:10px 12px}.cart-link span{display:none}.hero{padding:55px 18px}.hero h1{font-size:43px;letter-spacing:-2px}.products{padding:25px 16px 60px}.grid{grid-template-columns:1fr 1fr;gap:10px}.product-image{height:180px}.footer{padding:25px 16px;display:block}.footer>span{display:block;margin-top:18px}}
@media(max-width:900px){.nav-inner{gap:16px}.nav-actions{gap:14px}.grid{grid-template-columns:repeat(2,1fr)}.hero{grid-template-columns:1fr}.hero-art{display:none}}@media(max-width:620px){.nav-inner{height:auto;padding:15px 16px;flex-wrap:wrap}.brand{font-size:24px}.nav-actions{gap:10px}.about-link{font-size:12px}.search-box{order:3;flex-basis:100%}.login-link{display:none}.cart-link{padding:10px 12px}.cart-link span{display:none}.hero{padding:55px 18px}.hero h1{font-size:43px;letter-spacing:-2px}.products{padding:25px 16px 60px}.grid{grid-template-columns:1fr 1fr;gap:10px}.product-image{height:180px}.footer{padding:25px 16px;display:block}.footer>span{display:block;margin-top:18px}}
</style>

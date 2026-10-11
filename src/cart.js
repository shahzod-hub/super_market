import { ref } from 'vue'
import { getUserScope } from './userScope.js'

const LEGACY_CART_KEY = 'velox_cart'
const CART_KEY_PREFIX = 'velox_cart:'

function cartStorageKey(scope = getUserScope()) {
  return `${CART_KEY_PREFIX}${scope}`
}

function migrateLegacyCart() {
  try {
    const legacyCart = localStorage.getItem(LEGACY_CART_KEY)
    if (legacyCart === null) return

    const guestCartKey = cartStorageKey('guest')
    if (localStorage.getItem(guestCartKey) === null) {
      localStorage.setItem(guestCartKey, legacyCart)
    }
    localStorage.removeItem(LEGACY_CART_KEY)
  } catch (error) {
    console.error('Eski savat ma’lumotlarini ko‘chirishda xato:', error)
  }
}

migrateLegacyCart()

export function readCart() {
  try {
    const cart = JSON.parse(localStorage.getItem(cartStorageKey()) || '[]')
    return Array.isArray(cart) ? cart : []
  } catch {
    return []
  }
}

const FAVORITES_KEY_PREFIX = 'velox_favorites:'

function favoritesStorageKey(scope = getUserScope()) {
  return `${FAVORITES_KEY_PREFIX}${scope}`
}

export function readFavorites() {
  try {
    const favorites = JSON.parse(localStorage.getItem(favoritesStorageKey()) || '[]')
    return Array.isArray(favorites) ? favorites : []
  } catch {
    return []
  }
}

function countItems(cart) {
  return cart.length
}

// Reaktiv savat soni, barcha sahifalarda umumiy
export const cartCount = ref(countItems(readCart()))
export const favoritesCount = ref(readFavorites().length)

export function writeCart(cart) {
  localStorage.setItem(cartStorageKey(), JSON.stringify(cart))
  cartCount.value = countItems(cart)
}

export function writeFavorites(favorites) {
  localStorage.setItem(favoritesStorageKey(), JSON.stringify(favorites))
  favoritesCount.value = favorites.length
}

window.addEventListener('velox-user-changed', () => {
  cartCount.value = countItems(readCart())
  favoritesCount.value = readFavorites().length
})

window.addEventListener('storage', (event) => {
  if (event.key === cartStorageKey() || event.key === favoritesStorageKey()) {
    cartCount.value = countItems(readCart())
    favoritesCount.value = readFavorites().length
  }
})
<template>
  <header class="site-header">
    <div class="header-inner">
      <RouterLink to="/" class="brand">velox<span>.</span></RouterLink>

      <div v-if="searchable" class="search-box">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5"/></svg>
        <input :value="modelValue" type="text" placeholder="Mahsulot qidirish..." @input="$emit('update:modelValue',$event.target.value)" />
      </div>
      <div v-else class="header-space"></div>

      <nav class="nav-actions">
        <RouterLink to="/" class="nav-link" exact-active-class="active">Bosh sahifa</RouterLink>
        <RouterLink to="/about" class="nav-link" active-class="active">Biz haqimizda</RouterLink>
        <RouterLink to="/orders" class="nav-link" active-class="active">Buyurtmalarim</RouterLink>
        <RouterLink to="/signin" class="nav-link" active-class="active">Kirish</RouterLink>
        <NotificationBell />
        <RouterLink to="/order" class="cart-link">
          <svg viewBox="0 0 24 24"><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>
          <span>Savat</span><b v-if="cartCount">{{ cartCount }}</b>
        </RouterLink>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { cartCount } from '../cart.js'
import NotificationBell from './NotificationBell.vue'
defineProps({ searchable:{type:Boolean,default:false}, modelValue:{type:String,default:''} })
defineEmits(['update:modelValue'])
</script>

<style scoped>
.site-header{position:sticky;top:0;z-index:30;background:rgba(247,245,241,.9);backdrop-filter:blur(18px);border-bottom:1px solid var(--line)}
.header-inner{max-width:1240px;height:76px;margin:auto;padding:0 28px;display:flex;align-items:center;gap:34px}
.brand{font:800 27px/1 Manrope;text-decoration:none;letter-spacing:-1.5px;white-space:nowrap}.brand span{color:var(--accent)}
.search-box{height:42px;max-width:510px;flex:1;display:flex;align-items:center;gap:10px;padding:0 14px;background:#fff;border:1px solid var(--line);border-radius:12px}.search-box svg{width:18px;fill:none;stroke:#77736d;stroke-width:1.8}.search-box input{width:100%;border:0;outline:0;background:transparent;color:var(--ink)}
.header-space{flex:1}
.nav-actions{display:flex;align-items:center;gap:22px;margin-left:auto}.nav-link{text-decoration:none;font-size:14px;font-weight:600}.nav-link:hover,.nav-link.active{color:var(--accent)}
.cart-link{position:relative;display:flex;align-items:center;gap:8px;text-decoration:none;background:var(--ink);color:#fff;padding:11px 15px;border-radius:11px;font-size:13px;font-weight:700}.cart-link svg{width:18px;fill:none;stroke:currentColor;stroke-width:1.8}.cart-link b{position:absolute;right:-7px;top:-7px;min-width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:var(--accent);font-size:11px;border:2px solid var(--paper)}
@media(max-width:850px){.header-inner{gap:18px}.nav-actions{gap:14px}.nav-link{display:none}.search-box{max-width:none}.cart-link span{display:none}}
@media(max-width:560px){.header-inner{height:auto;min-height:70px;padding:12px 16px;flex-wrap:wrap}.search-box{order:3;flex-basis:100%}}
</style>

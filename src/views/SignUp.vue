<template>
  <div class="auth-page">
    <section class="panel">
      <form class="card" @submit.prevent="signUp" novalidate>
        <h2>Ro'yxatdan o'tish</h2>
        <p class="hint">Hisobingiz bormi? <RouterLink to="/signin">Kirish</RouterLink></p>

        <label class="field">
          <span>To'liq ism</span>
          <input v-model.trim="name" type="text" autocomplete="name" placeholder="Ism Familiya" required />
        </label>

        <label class="field">
          <span>sizning email</span>
          <input v-model.trim="email" type="email" autocomplete="email" placeholder="Email manzil" required />
        </label>

        <label class="field">
          <span>Parol</span>
          <div class="password-wrap">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Kamida 6 ta belgi"
              required
              minlength="6"
            />
            <button type="button" class="ghost-toggle" @click="showPassword = !showPassword">
              {{ showPassword ? 'Berkitish' : 'Ko\'rsatish' }}
            </button>
          </div>
        </label>

        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

        <button class="submit" type="submit" :disabled="loading">
          {{ loading ? 'Yaratilmoqda...' : 'Hisob yaratish' }}
        </button>
      </form>
    </section>

    <section class="stage">
      <div class="stage-glow"></div>
      <svg class="crates" viewBox="0 0 360 360" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="crateC" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#1B2A5E" />
            <stop offset="1" stop-color="#0A0F1E" />
          </linearGradient>
          <linearGradient id="crateD" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#2A3F8F" />
            <stop offset="1" stop-color="#0E1730" />
          </linearGradient>
        </defs>
        <rect x="180" y="180" width="120" height="120" rx="10" fill="url(#crateC)" opacity="0.9" />
        <rect x="40" y="120" width="150" height="150" rx="10" fill="#10141d" stroke="#1B2A5E" stroke-width="1.5" />
        <rect x="200" y="60" width="100" height="100" rx="10" fill="url(#crateD)" opacity="0.9" />
        <path d="M40 120 L115 80 L190 120 L115 160 Z" fill="#0B0E16" stroke="#1B2A5E" stroke-width="1.2" />
        <line x1="200" y1="110" x2="300" y2="110" stroke="#05070c" stroke-width="2" />
        <line x1="250" y1="60" x2="250" y2="160" stroke="#05070c" stroke-width="2" />
      </svg>
      <div class="stage-copy">
        <p class="brand">Velox<span>Shoop</span></p>
        <h1>Bir necha soniyada oilaga qo'shiling</h1>
        <p class="sub">Chegirmalar, yangi tushumlar va buyurtma tarixi — barchasi bitta hisobda.</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api, { resolveApiError } from '../api.js'

const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')

async function signUp() {
  errorMessage.value = ''
  loading.value = true
  try {
    const response = await api.post('/users/signUp', {
      name: name.value,
      email: email.value,
      password: password.value
    })

    console.log("Ro'yxatdan o'tdi:", response.data)
    router.push('/signin')
  } catch (error) {
    console.error('Sign up xatosi:', error)
    errorMessage.value = resolveApiError(error, "Ro'yxatdan o'tishda xatolik yuz berdi.")
  } finally {
    loading.value = false
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');
.auth-page{min-height:100vh;display:grid;grid-template-columns:1.05fr 1fr;background:#f7f5f1;color:#171717;font-family:'DM Sans',sans-serif}.stage{position:relative;overflow:hidden;background:#171717;color:#fff;padding:54px;display:flex;flex-direction:column;justify-content:space-between}.stage:after{content:'';position:absolute;width:430px;height:430px;border-radius:50%;background:#ff6235;left:-210px;top:-190px}.stage-glow{position:absolute;width:300px;height:300px;border:1px solid rgba(255,255,255,.18);border-radius:50%;right:-120px;bottom:50px}.crates{width:330px;align-self:center;position:relative;z-index:1}.stage-copy{position:relative;z-index:2;max-width:450px}.brand{font:800 24px Manrope;margin:0;color:#fff;letter-spacing:-1px}.brand span{color:#ff6235}.stage-copy h1{font:800 clamp(35px,4vw,54px)/1.05 Manrope;letter-spacing:-2px;margin:18px 0}.stage-copy .sub{color:#aaa6a0;line-height:1.7}.panel{display:flex;align-items:center;justify-content:center;padding:30px}.card{width:min(410px,100%);background:#fff;border:1px solid #e5e0d8;border-radius:22px;padding:38px;box-shadow:0 24px 60px rgba(32,27,20,.07)}.card h2{font:800 30px Manrope;letter-spacing:-1px;margin:0 0 7px}.hint{color:#77736d;font-size:14px;margin:0 0 30px}.hint a{color:#ff6235;text-decoration:none;font-weight:700}.field{display:flex;flex-direction:column;gap:7px;margin-bottom:18px}.field span{font-size:12px;font-weight:700;color:#5f5b55}.field input{height:48px;border:1px solid #ddd8d0;border-radius:11px;padding:0 14px;outline:0;background:#faf9f7;color:#171717}.field input:focus{border-color:#ff6235;box-shadow:0 0 0 4px rgba(255,98,53,.1)}.password-wrap{position:relative}.password-wrap input{width:100%;padding-right:85px}.ghost-toggle{position:absolute;right:10px;top:8px;height:32px;border:0;background:transparent;color:#ff6235;font-size:12px;font-weight:700}.error{color:#c83e2e;font-size:13px;margin:-4px 0 15px}.submit{width:100%;height:50px;border:0;border-radius:11px;background:#171717;color:#fff;font-weight:700}.submit:hover:not(:disabled){background:#ff6235}.submit:disabled{opacity:.55;cursor:not-allowed}@media(max-width:800px){.auth-page{grid-template-columns:1fr}.stage{display:none}.panel{min-height:100vh;padding:20px}.card{padding:30px 24px}}
</style>
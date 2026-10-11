<template>
  <div class="about-page">
    <AppHeader />
    <main>
      <section class="about-hero">
        <div class="hero-copy">
          <span class="eyebrow">VELОX · ABOUT</span>
          <h1>Yaxshi xarid — ortiqcha shovqinsiz.</h1>
          <p>VeloxShoop zamonaviy mahsulotlarni sodda katalog, aniq narx va qulay buyurtma jarayoni bilan bir joyga jamlaydi.</p>
          <RouterLink to="/" class="hero-btn">Mahsulotlarni ko‘rish <span>→</span></RouterLink>
        </div>
        <div class="about-art"><span>V</span><small>SELECTED<br>EVERYDAY</small><i></i></div>
      </section>

      <section class="story section">
        <div><span class="kicker">BIZNING YONDASHUV</span><h2>Oddiy interfeys.<br>Jiddiy tanlov.</h2></div>
        <div class="story-copy"><p>Biz xaridni murakkablashtirmaslikka e'tibor beramiz: kerakli mahsulotni topish, savatga qo‘shish va buyurtma berish imkon qadar sodda.</p><p>Do‘konning har bir qismi — katalogdan tortib admin paneligacha — bir xil vizual tizim asosida ishlaydi.</p></div>
      </section>

      <section class="section">
        <div class="section-head"><div><span class="kicker">AFZALLIKLAR</span><h2>Nimalarga e’tibor beramiz?</h2></div></div>
        <div class="values"><article v-for="(v,i) in values" :key="v.title" class="value"><span class="num">0{{i+1}}</span><h3>{{v.title}}</h3><p>{{v.text}}</p></article></div>
      </section>

      <section class="section process-section">
        <span class="kicker">JARAYON</span><h2>Buyurtma uch qadamda.</h2>
        <div class="steps"><article v-for="(s,i) in steps" :key="s.title"><span>{{i+1}}</span><div><h3>{{s.title}}</h3><p>{{s.text}}</p></div></article></div>
      </section>

      <section class="cta section"><span class="kicker">VELОX SELECT</span><h2>Endi mahsulotlarni ko‘ring.</h2><p>Tanlang, savatga qo‘shing va buyurtmani rasmiylashtiring.</p><RouterLink to="/" class="dark-btn">Xaridni boshlash →</RouterLink></section>
    </main>
    <AppFooter />
  </div>
</template>

<script setup>
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
const values=[
 {title:'Aniq tanlov',text:'Katalog ortiqcha bezaksiz, mahsulotlarni tez ko‘rish va solishtirish uchun tuzilgan.'},
 {title:'Shaffof narx',text:'Mahsulot narxi va mavjud miqdori katalogning o‘zida ko‘rinadi.'},
 {title:'Qulay savat',text:'Mahsulotni qo‘shish, miqdorini o‘zgartirish va buyurtmani tekshirish oson.'},
 {title:'Bitta uslub',text:'Mijoz, savat va admin sahifalari bir xil vizual tizimga moslashtirilgan.'}
]
const steps=[
 {title:'Mahsulotni tanlang',text:'Katalogdan kerakli mahsulotni toping va savatga qo‘shing.'},
 {title:'Savatni tekshiring',text:'Miqdorlarni o‘zgartiring va umumiy summani ko‘ring.'},
 {title:'Buyurtma bering',text:'Hisobingiz bilan buyurtmani yuboring va ID orqali tekshiring.'}
]
</script>

<style scoped>
/* Home / Savat / Kirish sahifalari bilan bir xil vizual tizim */
.about-page{min-height:100vh;background:var(--paper);color:var(--ink);font-family:'DM Sans',sans-serif}
.about-hero{max-width:1240px;margin:0 auto;padding:74px 28px 80px;min-height:470px;display:grid;grid-template-columns:1.1fr .9fr;align-items:center;gap:40px}
.hero-copy{max-width:700px}
.eyebrow,.kicker{font-size:11px;letter-spacing:.16em;font-weight:800;color:var(--accent)}
.about-hero h1{font:800 clamp(42px,5vw,68px)/1.03 Manrope,sans-serif;letter-spacing:-3px;margin:18px 0 22px}
.about-hero p{max-width:560px;color:var(--muted);font-size:17px;line-height:1.65;margin:0 0 28px}
.hero-btn{display:inline-flex;align-items:center;text-decoration:none;border-radius:12px;padding:14px 19px;background:var(--accent);color:#fff;font-weight:700;box-shadow:0 12px 28px rgba(255,98,53,.22)}
.hero-btn span{margin-left:18px}
.about-art{height:330px;border-radius:28px;background:#1b1b1b;color:#fff;position:relative;overflow:hidden;display:flex;align-items:flex-end;padding:32px;box-shadow:0 25px 70px rgba(0,0,0,.12)}
.about-art:before{content:'';position:absolute;width:280px;height:280px;border-radius:50%;background:var(--accent);right:-55px;top:-55px}
.about-art span{position:relative;font:800 160px/1 Manrope,sans-serif;letter-spacing:-16px}
.about-art small{position:absolute;right:30px;bottom:34px;font-weight:700;letter-spacing:.14em;line-height:1.5}
.about-art i{position:absolute;width:1px;height:240px;background:rgba(255,255,255,.25);left:52%;top:45px;transform:rotate(24deg)}
.section{max-width:1240px;margin:auto;padding:70px 28px}
.story{display:grid;grid-template-columns:1fr 1fr;gap:80px;border-top:1px solid var(--line)}
.story h2,.section h2{font:800 32px Manrope,sans-serif;letter-spacing:-1.4px;margin:6px 0 0}
.story-copy{padding-top:24px}
.story-copy p{color:var(--muted);line-height:1.75;margin-bottom:17px}
.section-head{display:flex;justify-content:space-between;margin-bottom:25px}
.values{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.value{background:#fff;border:1px solid var(--line);border-radius:17px;padding:23px;min-height:200px;transition:.25s transform,.25s box-shadow}
.value:hover{transform:translateY(-5px);box-shadow:0 18px 35px rgba(30,25,20,.08)}
.value .num{font:800 11px Manrope,sans-serif;color:var(--accent)}
.value h3{font-size:16px;margin:55px 0 9px}
.value p{font-size:13px;color:var(--muted);line-height:1.6}
.process-section{border-top:1px solid var(--line)}
.steps{margin-top:28px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.steps article{background:#fff;border:1px solid var(--line);border-radius:17px;padding:22px;display:flex;gap:17px}
.steps article>span{width:34px;height:34px;border-radius:50%;background:var(--ink);color:#fff;display:grid;place-items:center;font-weight:700;flex:none}
.steps h3{font-size:15px;margin-bottom:7px}
.steps p{font-size:13px;color:var(--muted);line-height:1.6}
.cta{background:#171717;color:#fff;border-radius:24px;width:min(1184px,calc(100% - 56px));margin:25px auto 60px;padding:48px}
.cta h2{margin:12px 0 10px}
.cta p{color:#aaa6a0;margin-bottom:23px}
.dark-btn{display:inline-flex;align-items:center;gap:18px;text-decoration:none;border-radius:12px;padding:14px 19px;background:#fff;color:#171717;font-weight:700;transition:background .2s,color .2s}
.dark-btn:hover{background:var(--accent);color:#fff}
@media(max-width:900px){.about-hero,.story{grid-template-columns:1fr}.about-hero{min-height:0}.story{gap:18px}.story-copy{padding-top:0}.about-art{display:none}.values{grid-template-columns:1fr 1fr}.steps{grid-template-columns:1fr}}
@media(max-width:620px){.about-hero{padding:55px 18px}.about-hero h1{font-size:43px;letter-spacing:-2px}.section{padding:50px 18px}.values{grid-template-columns:1fr}.cta{width:calc(100% - 36px);padding:30px 22px}}
</style>

<template>
  <footer class="site-footer">
    <div class="footer-inner">
      <div><RouterLink to="/" class="brand">velox<span>.</span></RouterLink><p>Oddiy xarid. Yaxshi tanlov.</p></div>
      <nav><RouterLink to="/">Bosh sahifa</RouterLink><RouterLink to="/about">Biz haqimizda</RouterLink><RouterLink to="/order">Savat</RouterLink></nav>
      <span class="copy">© {{ new Date().getFullYear() }} Velox Shop</span>
    </div>
  </footer>
</template>
<style scoped>
.site-footer{background:#171717;color:#fff;margin-top:70px;padding:34px 24px}.footer-inner{max-width:1240px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:25px;flex-wrap:wrap}.brand{font:800 22px Manrope;text-decoration:none;letter-spacing:-1px}.brand span{color:var(--accent)}.footer-inner p{color:#aaa6a0;font-size:12px;margin-top:7px}.footer-inner nav{display:flex;gap:22px}.footer-inner nav a{color:#c7c2bb;text-decoration:none;font-size:12px}.footer-inner nav a:hover{color:#fff}.copy{color:#77736d;font-size:11px}@media(max-width:650px){.footer-inner nav{width:100%;order:3}.footer-inner{align-items:flex-start}}
</style>

<template>
  <div class="toast-stack" aria-live="polite" aria-atomic="false">
    <TransitionGroup name="toast">
      <article v-for="toast in toasts" :key="toast.toastId" class="toast" :class="`toast-${toast.type}`">
        <span class="toast-icon" aria-hidden="true">{{ typeIcons[toast.type] || typeIcons.info }}</span>
        <div class="toast-content">
          <strong>{{ toast.title }}</strong>
          <p>{{ toast.message }}</p>
        </div>
        <button type="button" aria-label="Bildirishnomani yopish" @click="dismissToast(toast.toastId)">×</button>
      </article>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useNotification } from '../composables/useNotification.js'

const typeIcons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }
const { toasts, dismissToast } = useNotification()
</script>

<style scoped>
.toast-stack{position:fixed;top:18px;right:18px;z-index:1000;width:min(370px,calc(100vw - 36px));display:flex;flex-direction:column;gap:10px;pointer-events:none}
.toast{display:flex;align-items:flex-start;gap:11px;padding:15px 13px;border:1px solid #e9e4dc;border-left:4px solid #527ba9;border-radius:13px;background:#fff;color:#171717;box-shadow:0 12px 32px rgba(25,20,15,.16);pointer-events:auto}
.toast-success{border-left-color:#2d9a58}
.toast-error{border-left-color:#d34e41}
.toast-warning{border-left-color:#e4a323}
.toast-info{border-left-color:#527ba9}
.toast-icon{flex:none;font-size:18px}
.toast-content{flex:1;min-width:0}
.toast-content strong{display:block;margin-bottom:4px;font-size:13px}
.toast-content p{margin:0;color:#68635d;font-size:12px;line-height:1.45;overflow-wrap:anywhere}
.toast>button{flex:none;width:24px;height:24px;border:0;border-radius:7px;background:transparent;color:#8b857d;font-size:19px;cursor:pointer}
.toast>button:hover{background:#f2efe9;color:#171717}
.toast-enter-active,.toast-leave-active,.toast-move{transition:all .22s ease}
.toast-enter-from,.toast-leave-to{opacity:0;transform:translateX(20px)}
.toast-leave-active{position:absolute;right:0;left:0}
@media(max-width:560px){.toast-stack{top:12px;right:12px;width:calc(100vw - 24px)}}
</style>

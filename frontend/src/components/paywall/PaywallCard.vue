<script setup lang="ts">
import { ref } from 'vue'
import LqButton from '@/components/ui/LqButton.vue'
import { useLicense } from '@/composables/useLicense'
import { useI18n } from '@/i18n'

/** The upsell card shown in place of locked content on the standalone 八字 product. */
defineProps<{ compact?: boolean; title?: string }>()
const { t } = useI18n()
const lic = useLicense()
const email = ref('')
const restoring = ref(false)
const FEATURES = ['全部断语（约 100 条，含推断依据）', '运势：大运、流年逐年、流月评级与依据', '资产与学业：现实背景校准、六级层级、检查点', '古籍参考、喜用神与格局详表', '本机永久解锁，支持邮箱在其他设备恢复']
</script>

<template>
  <section class="pw lq-glass" :class="{ compact }">
    <header class="head">
      <p class="t-label">{{ t('完整版') }}</p>
      <h3>{{ title ?? t('解锁完整分析') }}</h3>
      <p class="price">{{ lic.config.value.priceLabel || t('一次付费 · 永久使用') }}</p>
    </header>
    <ul v-if="!compact" class="feats">
      <li v-for="f in FEATURES" :key="f">{{ t(f) }}</li>
    </ul>
    <div class="actions">
      <LqButton variant="primary" icon="celestial" :loading="lic.busy.value" :disabled="!lic.enabled.value" @click="lic.startCheckout()">{{ t('用 Stripe 解锁') }}</LqButton>
      <button type="button" class="link" @click="restoring = !restoring">{{ t('已购买？恢复') }}</button>
    </div>
    <form v-if="restoring" class="restore" @submit.prevent="lic.restore(email)">
      <input v-model="email" class="lq-input" type="email" required :placeholder="t('购买时填写的邮箱')" />
      <LqButton type="submit" variant="secondary" :loading="lic.busy.value" :disabled="!lic.enabled.value">{{ t('恢复购买') }}</LqButton>
    </form>
    <p v-if="!lic.enabled.value" class="t-caption">{{ t('支付尚未配置：部署 services/paywall 并在构建时设置 VITE_PAYWALL_URL 与 VITE_LICENSE_JWK。') }}</p>
    <p v-else-if="lic.message.value === 'ok'" class="t-caption ok">{{ t('已解锁，感谢支持。') }}</p>
    <p v-else-if="lic.message.value" class="t-caption err">{{ lic.message.value === 'invalid' ? t('未能验证授权，请联系支持。') : lic.message.value }}</p>
    <p class="t-caption">{{ t('命盘计算始终在本机完成；支付由 Stripe 处理，我们不保存你的出生信息与卡号。') }}</p>
  </section>
</template>

<style scoped>
.pw {
  display: grid;
  gap: var(--sp-4);
  padding: var(--sp-6) var(--sp-7);
  border-radius: var(--r-xl);
}
.pw.compact {
  padding: var(--sp-4) var(--sp-5);
}
.head {
  display: grid;
  gap: 4px;
}
.head h3 {
  font-size: var(--fs-xl);
}
.price {
  color: var(--accent-ink);
  font-weight: 500;
}
.feats {
  display: grid;
  gap: 6px;
  font-size: var(--fs-sm);
  color: var(--text-2);
}
.feats li::before {
  content: '✓';
  margin-right: 8px;
  color: var(--accent);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-3);
}
.link {
  border: 0;
  background: none;
  color: var(--text-2);
  font-size: var(--fs-sm);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.restore {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--sp-2);
  max-width: 480px;
}
.ok {
  color: var(--wx-wood);
}
.err {
  color: var(--wx-fire);
}
</style>

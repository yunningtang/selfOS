<script setup lang="ts">
/** The atmosphere behind everything: three slow light masses, a grain veil and a vignette. */
defineProps<{ quiet?: boolean }>()
</script>

<template>
  <div class="ambient" :class="{ quiet }" aria-hidden="true">
    <span class="mass a ambient-anim" />
    <span class="mass b ambient-anim" />
    <span class="mass c ambient-anim" />
    <span class="grain" />
    <span class="vignette" />
  </div>
</template>

<style scoped>
.ambient {
  position: fixed;
  inset: 0;
  z-index: var(--z-ambient);
  overflow: hidden;
  pointer-events: none;
  background: radial-gradient(120% 90% at 50% 0%, var(--bg) 0%, var(--bg-deep) 100%);
  transition: opacity 1.2s var(--ease-out);
}
.mass {
  position: absolute;
  width: 70vmax;
  height: 70vmax;
  border-radius: 50%;
  will-change: transform;
  transition: opacity 1.2s var(--ease-out);
}
.a {
  left: -18vmax;
  top: -28vmax;
  background: radial-gradient(circle, var(--atmo-a) 0%, transparent 62%);
  animation: lq-drift-a var(--dur-drift) var(--ease-in-out) infinite;
}
.b {
  right: -26vmax;
  top: 8vmax;
  background: radial-gradient(circle, var(--atmo-b) 0%, transparent 62%);
  animation: lq-drift-b calc(var(--dur-drift) * 1.3) var(--ease-in-out) infinite;
}
.c {
  left: 12vmax;
  bottom: -40vmax;
  background: radial-gradient(circle, var(--atmo-c) 0%, transparent 62%);
  animation: lq-drift-c calc(var(--dur-drift) * 1.6) var(--ease-in-out) infinite;
}
.quiet .mass {
  opacity: 0.45;
}
.grain {
  position: absolute;
  inset: 0;
  opacity: 0.05;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
.vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(140% 100% at 50% 40%, transparent 55%, var(--atmo-vignette) 100%);
}
</style>

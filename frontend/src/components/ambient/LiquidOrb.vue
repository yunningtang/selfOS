<script setup lang="ts">
import { computed } from 'vue'
import type { OrbMaterial } from '@/data/lexicon'

/**
 * A translucent liquid entity. Pure CSS: layered radial gradients for subsurface light,
 * a slowly turning iridescent film, and a border-radius morph for organic deformation.
 * Decorative by default — the parent supplies the accessible name and role.
 */
const props = withDefaults(
  defineProps<{
    material: OrbMaterial
    size?: number
    /** 0–1: drives glow and halo */
    intensity?: number
    selected?: boolean
    tension?: boolean
    /** Phase offset (s) so neighbouring orbs never breathe in unison */
    phase?: number
  }>(),
  { size: 72, intensity: 0.5, phase: 0 },
)

const style = computed(() => ({
  '--size': `${props.size}px`,
  '--base': props.material.base,
  '--depth': props.material.depth,
  '--glow': 0.12 + props.intensity * 0.5,
  '--phase': `${-props.phase}s`,
  '--breathe-to': 1.02 + props.intensity * 0.04,
}))
</script>

<template>
  <span class="orb" :class="[`m-${material.variant}`, { selected, tension }]" :style="style" aria-hidden="true">
    <span class="halo ambient-anim" />
    <span class="body ambient-anim">
      <span class="iris ambient-anim" />
      <span class="spec" />
    </span>
    <span v-if="material.variant === 'ring'" class="echo ambient-anim" />
  </span>
</template>

<style scoped>
.orb {
  position: relative;
  display: inline-block;
  width: var(--size);
  height: var(--size);
  flex: none;
  animation: lq-breathe var(--dur-breathe) var(--ease-in-out) var(--phase) infinite;
  transition: transform var(--dur-slow) var(--ease-spring);
}
.halo {
  position: absolute;
  inset: -45%;
  border-radius: 50%;
  background: radial-gradient(circle, var(--base) 0%, transparent 62%);
  opacity: var(--glow);
  filter: saturate(0.9);
  transition: opacity var(--dur-slow) var(--ease-out);
}
.body {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 50%;
  animation: lq-morph var(--dur-morph) var(--ease-in-out) var(--phase) infinite;
  background:
    radial-gradient(circle at 68% 80%, color-mix(in srgb, var(--base) 70%, white) 0%, transparent 42%),
    radial-gradient(circle at 38% 32%, var(--base) 0%, var(--depth) 80%, color-mix(in srgb, var(--depth) 55%, black) 100%);
  box-shadow:
    inset -6px -10px 22px rgba(0, 0, 0, 0.32),
    inset 5px 7px 16px rgba(255, 255, 255, 0.22),
    var(--shadow-orb);
}
.iris {
  position: absolute;
  inset: -20%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(110, 137, 255, 0.4) 60deg,
    transparent 120deg,
    rgba(168, 200, 224, 0.4) 190deg,
    transparent 250deg,
    rgba(162, 205, 187, 0.35) 310deg,
    transparent 360deg
  );
  mix-blend-mode: soft-light;
  animation: lq-iris-turn 48s linear var(--phase) infinite;
}
.spec {
  position: absolute;
  left: 22%;
  top: 14%;
  width: 34%;
  height: 22%;
  border-radius: 50%;
  background: radial-gradient(ellipse at 50% 40%, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0) 70%);
  transform: rotate(-24deg);
  filter: blur(0.5px);
}

/* Clear: a glass bead — mostly transparent, defined by rim light. */
.m-clear .body {
  background:
    radial-gradient(circle at 50% 55%, transparent 52%, color-mix(in srgb, var(--depth) 45%, transparent) 100%),
    radial-gradient(circle at 70% 82%, color-mix(in srgb, var(--base) 35%, transparent), transparent 45%);
  -webkit-backdrop-filter: blur(3px) saturate(160%);
  backdrop-filter: blur(3px) saturate(160%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.28),
    inset -4px -8px 18px rgba(0, 0, 0, 0.18),
    var(--shadow-orb);
}

/* Diffuse: the shadow field — no surface, only density. */
.m-diffuse .body {
  inset: 6%;
  background: radial-gradient(circle at 50% 50%, var(--base) 0%, color-mix(in srgb, var(--depth) 80%, transparent) 55%, transparent 75%);
  filter: blur(5px);
  box-shadow: none;
  overflow: visible;
}
.m-diffuse .spec,
.m-diffuse .iris {
  display: none;
}
.m-diffuse .halo {
  background: radial-gradient(circle, var(--depth) 0%, transparent 65%);
  opacity: calc(var(--glow) + 0.2);
}

/* Ring: the Observer — a membrane with nothing inside it. */
.m-ring .body {
  background: radial-gradient(circle, color-mix(in srgb, var(--base) 10%, transparent) 40%, transparent 70%);
  box-shadow:
    inset 0 0 0 1.5px var(--base),
    inset 0 0 18px color-mix(in srgb, var(--base) 35%, transparent);
}
.m-ring .spec,
.m-ring .iris {
  display: none;
}
.echo {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px var(--base);
  animation: lq-pulse-ring 5s var(--ease-out) var(--phase) infinite;
}

.tension .halo {
  background: radial-gradient(circle, var(--tension) 0%, transparent 60%);
}
.selected {
  transform: scale(1.06);
}
.selected::after {
  content: '';
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  box-shadow: 0 0 0 1px var(--hairline-3);
}
</style>

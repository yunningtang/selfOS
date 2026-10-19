<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { MEMORY_KINDS } from '@/data/lexicon'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { useUiStore } from '@/stores/ui'
import type { MemoryRecord } from '@/types'

/**
 * The spatial archive: memories as translucent iridescent spheres on a slow
 * chronological helix (earliest at the bottom), with filaments for linked memories.
 * This is the one place Three.js earns its weight — depth and refraction carry meaning here.
 * Rendering pauses when the view is hidden; in still mode it renders only on interaction.
 */
const props = defineProps<{ memories: MemoryRecord[]; selected: string | null }>()
const emit = defineEmits<{ select: [id: string]; unsupported: [] }>()

const host = ref<HTMLDivElement | null>(null)
const hover = ref<{ title: string; x: number; y: number } | null>(null)
const reduced = useReducedMotion()
const ui = useUiStore()

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let controls: OrbitControls
let group: THREE.Group
let frame = 0
let ro: ResizeObserver | null = null
const meshes = shallowRef<THREE.Mesh[]>([])
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
let linesObj: THREE.LineSegments | null = null
let needsRender = true

function cssColor(token: string) {
  const name = token.match(/var\((--[^)]+)\)/)?.[1]
  const v = name ? getComputedStyle(document.documentElement).getPropertyValue(name).trim() : token
  return new THREE.Color(v || '#B5A9E8')
}

function layout(list: MemoryRecord[]) {
  const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date))
  return new Map(
    sorted.map((m, i) => {
      const t = sorted.length > 1 ? i / (sorted.length - 1) : 0.5
      const a = i * 2.39996 // golden angle keeps neighbours apart
      const r = 3.2 + Math.sin(i * 1.7) * 0.6
      return [m.id, new THREE.Vector3(Math.cos(a) * r, (t - 0.5) * 7, Math.sin(a) * r)]
    }),
  )
}

function build() {
  if (!renderer) return
  for (const m of meshes.value) {
    group.remove(m)
    m.geometry.dispose()
    ;(m.material as THREE.Material).dispose()
  }
  if (linesObj) {
    group.remove(linesObj)
    linesObj.geometry.dispose()
    ;(linesObj.material as THREE.Material).dispose()
  }
  const pos = layout(props.memories)
  const geo = new THREE.SphereGeometry(1, 48, 32)
  const list: THREE.Mesh[] = []
  props.memories.forEach((m, i) => {
    const mat = new THREE.MeshPhysicalMaterial({
      color: cssColor(MEMORY_KINDS[m.kind].tone),
      roughness: 0.12,
      metalness: 0,
      transmission: 0.82,
      thickness: 1.2,
      ior: 1.33,
      iridescence: 0.7,
      iridescenceIOR: 1.3,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.95,
      emissive: cssColor(MEMORY_KINDS[m.kind].tone),
      emissiveIntensity: 0.08,
    })
    const mesh = new THREE.Mesh(i === 0 ? geo : geo.clone(), mat)
    const s = 0.28 + m.intensity * 0.32
    mesh.scale.setScalar(s)
    mesh.position.copy(pos.get(m.id)!)
    mesh.userData = { id: m.id, title: m.title, base: s, phase: i * 0.7, y: mesh.position.y }
    group.add(mesh)
    list.push(mesh)
  })
  meshes.value = list

  const pts: number[] = []
  const seen = new Set<string>()
  for (const m of props.memories)
    for (const l of m.links) {
      const key = [m.id, l].sort().join('|')
      if (seen.has(key) || !pos.has(l)) continue
      seen.add(key)
      const a = pos.get(m.id)!
      const b = pos.get(l)!
      pts.push(a.x, a.y, a.z, b.x, b.y, b.z)
    }
  const lg = new THREE.BufferGeometry()
  lg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  linesObj = new THREE.LineSegments(
    lg,
    new THREE.LineBasicMaterial({ color: cssColor('var(--c-pearl)'), transparent: true, opacity: ui.theme === 'dark' ? 0.16 : 0.3 }),
  )
  group.add(linesObj)
  applySelection()
}

function applySelection() {
  for (const m of meshes.value) {
    const on = m.userData.id === props.selected
    const mat = m.material as THREE.MeshPhysicalMaterial
    mat.emissiveIntensity = on ? 0.55 : 0.08
    m.scale.setScalar(m.userData.base * (on ? 1.35 : 1))
  }
  needsRender = true
}

function render(time = 0) {
  if (!renderer) return
  if (!reduced.value) {
    group.rotation.y += 0.0009
    for (const m of meshes.value) m.position.y = m.userData.y + Math.sin(time / 2400 + m.userData.phase) * 0.06
    needsRender = true
  }
  const moved = controls.update()
  if (needsRender || moved) {
    renderer.render(scene, camera)
    needsRender = false
  }
  frame = requestAnimationFrame(render)
}

function pick(e: PointerEvent) {
  const rect = host.value!.getBoundingClientRect()
  pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
  raycaster.setFromCamera(pointer, camera)
  return raycaster.intersectObjects(meshes.value, false)[0]?.object as THREE.Mesh | undefined
}

let downAt = { x: 0, y: 0 }
function onMove(e: PointerEvent) {
  const hit = pick(e)
  const rect = host.value!.getBoundingClientRect()
  hover.value = hit ? { title: hit.userData.title, x: e.clientX - rect.left, y: e.clientY - rect.top } : null
  host.value!.style.cursor = hit ? 'pointer' : 'grab'
}
function onDown(e: PointerEvent) {
  downAt = { x: e.clientX, y: e.clientY }
}
function onUp(e: PointerEvent) {
  if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 5) return
  const hit = pick(e)
  if (hit) emit('select', hit.userData.id)
}
function onVisibility() {
  cancelAnimationFrame(frame)
  if (!document.hidden) frame = requestAnimationFrame(render)
}

onMounted(() => {
  const el = host.value!
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
  } catch {
    emit('unsupported')
    return
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.outputColorSpace = THREE.SRGBColorSpace
  el.appendChild(renderer.domElement)
  renderer.domElement.setAttribute('aria-hidden', 'true')

  scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  pmrem.dispose()
  scene.add(new THREE.AmbientLight(0xffffff, 0.4))
  const key = new THREE.PointLight(0xb5a9e8, 30, 40)
  key.position.set(4, 6, 6)
  scene.add(key)

  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
  camera.position.set(0, 1.2, 16)
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minDistance = 5
  controls.maxDistance = 22
  controls.enablePan = false
  controls.addEventListener('change', () => (needsRender = true))

  group = new THREE.Group()
  scene.add(group)
  build()

  ro = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect
    renderer!.setSize(width, height)
    camera.aspect = width / Math.max(1, height)
    camera.updateProjectionMatrix()
    needsRender = true
  })
  ro.observe(el)
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerdown', onDown)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('pointerleave', () => (hover.value = null))
  document.addEventListener('visibilitychange', onVisibility)
  frame = requestAnimationFrame(render)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  ro?.disconnect()
  document.removeEventListener('visibilitychange', onVisibility)
  controls?.dispose()
  scene?.traverse((o) => {
    const m = o as THREE.Mesh
    m.geometry?.dispose()
    const mat = m.material as THREE.Material | undefined
    mat?.dispose()
  })
  scene?.environment?.dispose()
  renderer?.dispose()
  renderer?.domElement.remove()
  renderer = null
})

watch(() => props.memories, build)
watch(() => props.selected, applySelection)
watch(() => ui.theme, build)
</script>

<template>
  <div ref="host" class="space">
    <Transition name="fade">
      <p v-if="hover" class="tip" :style="{ left: `${hover.x}px`, top: `${hover.y}px` }">{{ hover.title }}</p>
    </Transition>
  </div>
</template>

<style scoped>
.space {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 420px;
  touch-action: none;
  cursor: grab;
}
.space :deep(canvas) {
  position: absolute;
  inset: 0;
}
.tip {
  position: absolute;
  z-index: 1;
  transform: translate(12px, -130%);
  padding: 6px 10px;
  border-radius: var(--r-sm);
  background: var(--surface);
  box-shadow:
    inset 0 0 0 1px var(--hairline-2),
    var(--shadow-float);
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  white-space: nowrap;
  pointer-events: none;
}
</style>

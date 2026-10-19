<script setup lang="ts">
/** Line icons drawn for selfOS: 24px grid, 1.5px stroke, round joins. */
const props = withDefaults(defineProps<{ name: string; size?: number; label?: string }>(), { size: 20 })

const PATHS: Record<string, string> = {
  threshold: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18Z M12 7.5a4.5 4.5 0 1 0 0 9a4.5 4.5 0 1 0 0-9Z',
  seed: 'M12 3.5c3 3.6 6 6.9 6 10.2A6 6 0 0 1 6 13.7C6 10.4 9 7.1 12 3.5Z M9.5 14.5a2.6 2.6 0 0 0 2.5 2.4',
  atlas: 'M12 4v16 M6 7.5l6-3.5l6 3.5 M6 7.5v9 M18 7.5v9 M6 16.5l6 3.5l6-3.5 M6 12h12 M12 4a1.6 1.6 0 1 0 0 .01Z',
  council: 'M7 9.5a3 3 0 1 0 0 .01Z M17 9.5a3 3 0 1 0 0 .01Z M12 17a3 3 0 1 0 0 .01Z M9.6 11.2l1.3 3.5 M14.4 11.2l-1.3 3.5 M10 9.5h4',
  memory: 'M8 8.5a3.5 3.5 0 1 0 0 .01Z M16.5 6a2.5 2.5 0 1 0 0 .01Z M15 16.5a4 4 0 1 0 0 .01Z M10.5 10.5l2 3 M14.6 8.2l.3 4.3',
  celestial: 'M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6Z M3.5 12c0-2.2 3.8-4 8.5-4s8.5 1.8 8.5 4s-3.8 4-8.5 4s-8.5-1.8-8.5-4Z',
  reflection: 'M4 5.5c2.6-.8 5.3-.6 8 1c2.7-1.6 5.4-1.8 8-1V18c-2.6-.8-5.3-.6-8 1c-2.7-1.6-5.4-1.8-8-1Z M12 6.5V19',
  sun: 'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8Z M12 2.5v2 M12 19.5v2 M2.5 12h2 M19.5 12h2 M5.3 5.3l1.4 1.4 M17.3 17.3l1.4 1.4 M5.3 18.7l1.4-1.4 M17.3 6.7l1.4-1.4',
  moon: 'M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z',
  wave: 'M3 12c2-3 4-3 6 0s4 3 6 0s4-3 6 0',
  still: 'M3 12h18',
  plus: 'M12 5v14 M5 12h14',
  minus: 'M5 12h14',
  reset: 'M4.5 12a7.5 7.5 0 1 0 2.2-5.3 M4.5 4.5v3.5h3.5',
  search: 'M10.5 4.5a6 6 0 1 0 0 12a6 6 0 1 0 0-12Z M15 15l4.5 4.5',
  close: 'M6 6l12 12 M18 6L6 18',
  play: 'M8 5.5v13l10.5-6.5Z',
  inject: 'M12 3.5v4 M12 16.5v4 M3.5 12h4 M16.5 12h4 M12 9.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5Z',
  send: 'M4.5 12h13 M12.5 6l6 6l-6 6',
  upload: 'M12 15.5V4.5 M7.5 9l4.5-4.5L16.5 9 M5 15v3.5h14V15',
  list: 'M8.5 6.5h11 M8.5 12h11 M8.5 17.5h11 M4.5 6.5h.01 M4.5 12h.01 M4.5 17.5h.01',
  space: 'M7 8a2.5 2.5 0 1 0 0 .01Z M17 6.5a1.8 1.8 0 1 0 0 .01Z M15 16a3.5 3.5 0 1 0 0 .01Z M6.5 17a1.5 1.5 0 1 0 0 .01Z',
  timeline: 'M4 12h16 M7 8.5v7 M12 10v4 M17 7v10',
  chevron: 'M9.5 6l6 6l-6 6',
  info: 'M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17Z M12 11v5 M12 8h.01',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  file: 'M7 3.5h6.5L18 8v12.5H7Z M13.5 3.5V8H18',
  flow: 'M4 8c4 0 4 8 8 8s4-8 8-8',
  focus: 'M4.5 9V4.5H9 M15 4.5h4.5V9 M19.5 15v4.5H15 M9 19.5H4.5V15',
  layers: 'M12 4l8.5 4.5L12 13L3.5 8.5Z M3.5 12.5L12 17l8.5-4.5 M3.5 16.5L12 21l8.5-4.5',
}
</script>

<template>
  <svg
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    :role="props.label ? 'img' : undefined"
    :aria-label="props.label"
    :aria-hidden="props.label ? undefined : 'true'"
    focusable="false"
  >
    <path :d="PATHS[props.name] ?? ''" />
  </svg>
</template>

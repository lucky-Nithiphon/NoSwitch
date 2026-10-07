<template>
  <section class="widget" aria-labelledby="timer-title">
    <div class="widget-header">
      <h2 id="timer-title" class="flex items-center gap-2"><span>⏱️</span> Pomodoro</h2>
      <span class="text-xs font-normal text-ink-500">รอบที่ {{ sessions + 1 }}</span>
    </div>

    <div class="widget-body flex flex-col items-center justify-between gap-4">
      <!-- Mode tabs -->
      <div class="flex w-full rounded-xl bg-ink-800/80 p-1 text-xs" role="tablist">
        <button
          v-for="m in modes"
          :id="`timer-mode-${m.key}`"
          :key="m.key"
          role="tab"
          :aria-selected="mode === m.key"
          class="flex-1 cursor-pointer rounded-lg px-2 py-1.5 font-medium transition"
          :class="mode === m.key ? 'bg-white/10 text-white shadow' : 'text-ink-500 hover:text-ink-300'"
          @click="setMode(m.key)"
        >
          {{ m.label }}
        </button>
      </div>

      <!-- Ring -->
      <div class="relative grid aspect-square min-h-[140px] max-h-[200px] flex-1 place-items-center">
        <svg class="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(228 12% 18%)" stroke-width="6" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            :stroke="ringColor"
            stroke-width="6" stroke-linecap="round"
            :stroke-dasharray="CIRC"
            :stroke-dashoffset="CIRC * (1 - progress)"
            class="transition-[stroke-dashoffset] duration-1000 ease-linear"
            :class="{ 'animate-pulse-ring': running }"
          />
        </svg>
        <div class="text-center">
          <p id="timer-display" class="font-mono text-4xl font-bold tabular-nums text-white" aria-live="polite">{{ display }}</p>
          <p class="mt-1 text-xs" :class="mode === 'focus' || mode === 'custom' ? 'text-accent' : 'text-rest'">
            {{ mode === 'break' ? 'พักผ่อน ☕' : 'โฟกัส 📖' }}
          </p>
        </div>
      </div>

      <!-- Custom time -->
      <div v-if="mode === 'custom'" class="flex w-full items-center gap-2 text-xs">
        <label for="timer-custom" class="shrink-0 text-ink-500">นาที</label>
        <input id="timer-custom" v-model.number="customMinutes" type="number" min="1" max="180" class="input py-1.5" :disabled="running" @change="reset" />
      </div>

      <!-- Controls -->
      <div class="flex w-full gap-2">
        <button id="timer-start-btn" class="btn btn-primary flex-1" @click="running ? pause() : start()">
          {{ running ? '⏸ Pause' : remaining === total ? '▶ Start' : '▶ Resume' }}
        </button>
        <button id="timer-reset-btn" class="btn btn-ghost" @click="reset">↺ Reset</button>
      </div>
    </div>

    <!-- Time's up toast -->
    <Transition enter-from-class="opacity-0 scale-95" leave-to-class="opacity-0 scale-95" enter-active-class="transition" leave-active-class="transition">
      <div v-if="alertMsg" class="absolute inset-0 z-10 grid place-items-center bg-ink-950/85 p-6 text-center backdrop-blur-sm">
        <div>
          <div class="mb-2 text-4xl">🔔</div>
          <p class="mb-4 font-semibold text-white">{{ alertMsg }}</p>
          <button id="timer-alert-ok" class="btn btn-primary" @click="alertMsg = ''">ตกลง</button>
        </div>
      </div>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'

type Mode = 'focus' | 'break' | 'custom'
const modes: { key: Mode; label: string }[] = [
  { key: 'focus', label: 'Focus 25' },
  { key: 'break', label: 'Break 5' },
  { key: 'custom', label: 'Custom' },
]
const CIRC = 2 * Math.PI * 54

const mode = useLocalStorage<Mode>('noswitch:timer:mode', 'focus')
const customMinutes = useLocalStorage<number>('noswitch:timer:custom', 50)
const sessions = useLocalStorage<number>('noswitch:timer:sessions', 0)

const minutesFor = (m: Mode) => (m === 'focus' ? 25 : m === 'break' ? 5 : Math.max(1, Math.min(180, customMinutes.value || 1)))

const total = ref(minutesFor(mode.value) * 60)
const remaining = ref(total.value)
const running = ref(false)
const alertMsg = ref('')
let interval: ReturnType<typeof setInterval> | undefined
let endAt = 0

const display = computed(() => {
  const m = Math.floor(remaining.value / 60)
  const s = remaining.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})
const progress = computed(() => (total.value ? remaining.value / total.value : 0))
const ringColor = computed(() => (mode.value === 'break' ? 'hsl(152 60% 55%)' : 'hsl(258 90% 72%)'))

function start() {
  if (remaining.value <= 0) reset()
  running.value = true
  // ใช้ timestamp ป้องกันเวลาเพี้ยนเมื่อแท็บอยู่เบื้องหลัง
  endAt = Date.now() + remaining.value * 1000
  interval = setInterval(() => {
    remaining.value = Math.max(0, Math.round((endAt - Date.now()) / 1000))
    if (remaining.value <= 0) finish()
  }, 250)
}

function pause() {
  running.value = false
  clearInterval(interval)
}

function reset() {
  pause()
  total.value = minutesFor(mode.value) * 60
  remaining.value = total.value
}

function setMode(m: Mode) {
  mode.value = m
  reset()
}

function finish() {
  pause()
  playChime()
  if (mode.value === 'break') {
    alertMsg.value = 'หมดเวลาพักแล้ว! กลับมาโฟกัสกันต่อ 💪'
    mode.value = 'focus'
  } else {
    sessions.value++
    alertMsg.value = 'เยี่ยมมาก! ครบเวลาโฟกัสแล้ว ได้เวลาพัก ☕'
    if (mode.value === 'focus') mode.value = 'break'
  }
  reset()
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('NoSwitch Pomodoro', { body: alertMsg.value })
  }
}

/** เสียงแจ้งเตือนด้วย Web Audio API (ไม่ต้องมีไฟล์เสียง) */
function playChime() {
  try {
    const ctx = new AudioContext()
    ;[0, 0.25, 0.5].forEach((delay, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = [880, 1108, 1318][i]!
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay)
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + delay + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.6)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + delay)
      osc.stop(ctx.currentTime + delay + 0.65)
    })
  } catch { /* audio not available */ }
}

// ขออนุญาตแจ้งเตือนเมื่อผู้ใช้กด Start ครั้งแรก
if (import.meta.client && 'Notification' in window && Notification.permission === 'default') {
  window.addEventListener('click', () => Notification.requestPermission(), { once: true })
}

onBeforeUnmount(() => clearInterval(interval))
</script>

<template>
  <div class="flex h-full w-full flex-col justify-between p-3.5 gap-2 text-ink-300 select-none">
    <!-- TOP TOOLBAR: Minimalist & Clean Apple-style Bar -->
    <div class="flex items-center justify-between border-b border-white/[0.08] pb-2.5 shrink-0">
      <!-- Left: Segmented Switch (Pomodoro / นาฬิกาจริง) -->
      <div class="inline-flex rounded-xl bg-ink-800/80 p-0.5 text-xs border border-white/[0.06] shadow-inner">
        <button
          type="button"
          class="rounded-lg px-2.5 py-1 font-medium transition cursor-pointer text-[11px]"
          :class="clockType === 'pomodoro' ? 'bg-accent/20 text-accent font-semibold shadow-sm' : 'text-ink-400 hover:text-white'"
          @click="clockType = 'pomodoro'"
        >
          ⏱️ Timer
        </button>
        <button
          type="button"
          class="rounded-lg px-2.5 py-1 font-medium transition cursor-pointer text-[11px]"
          :class="clockType === 'clock' ? 'bg-accent/20 text-accent font-semibold shadow-sm' : 'text-ink-400 hover:text-white'"
          @click="clockType = 'clock'"
        >
          🕒 Clock
        </button>
      </div>

      <!-- Right: Clean & Tidy Clock Style Dropdown Pill -->
      <div class="relative" ref="styleDropdownRef">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-ink-800/70 px-2.5 py-1 text-xs text-ink-200 transition hover:border-accent/40 hover:bg-white/[0.06] hover:text-white cursor-pointer shadow-sm"
          :title="`สไตล์หน้าปัด: ${currentStyle.label}`"
          @click="isStyleMenuOpen = !isStyleMenuOpen"
        >
          <span class="text-xs">{{ currentStyle.icon }}</span>
          <span class="text-[11px] font-medium">{{ currentStyle.label }}</span>
          <span class="text-[9px] text-ink-500">▾</span>
        </button>

        <!-- Elegant Dropdown Menu -->
        <Transition enter-from-class="opacity-0 scale-95" leave-to-class="opacity-0 scale-95" enter-active-class="transition duration-150" leave-active-class="transition duration-100">
          <div
            v-if="isStyleMenuOpen"
            class="absolute right-0 top-full mt-1.5 w-44 rounded-2xl border border-white/[0.1] bg-ink-900/95 p-1.5 shadow-2xl backdrop-blur-xl z-50 text-xs"
          >
            <div class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">
              ดีไซน์หน้าปัด
            </div>
            <button
              v-for="s in styles"
              :key="s.key"
              type="button"
              class="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left transition cursor-pointer"
              :class="clockStyle === s.key ? 'bg-accent/15 text-accent font-semibold' : 'text-ink-300 hover:bg-white/[0.08] hover:text-white'"
              @click="setClockStyle(s.key)"
            >
              <span class="flex items-center gap-2">
                <span>{{ s.icon }}</span>
                <span>{{ s.label }}</span>
              </span>
              <span v-if="clockStyle === s.key" class="text-accent text-[11px]">✓</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- QUICK PRESET CHIPS & SUBHEADER (Only in Pomodoro mode) -->
    <div v-if="clockType === 'pomodoro'" class="flex items-center justify-between gap-1.5 shrink-0 px-1">
      <!-- Quick Preset Chips -->
      <div class="flex items-center gap-1.5 overflow-x-auto scroll-thin py-0.5 text-[11px]">
        <button
          v-for="p in presets"
          :key="p.label"
          type="button"
          class="shrink-0 rounded-lg border px-2 py-0.5 text-xs transition cursor-pointer"
          :class="isPresetActive(p)
            ? 'border-accent/50 bg-accent/20 text-accent font-medium shadow-sm'
            : 'border-white/[0.06] bg-white/[0.03] text-ink-400 hover:border-white/10 hover:text-ink-200'"
          @click="applyPreset(p)"
        >
          {{ p.label }}
        </button>
      </div>

      <!-- Toggle View: Wheel vs Clock Face (เมื่อไม่ได้นับถอยหลัง) -->
      <div v-if="!running" class="inline-flex rounded-lg bg-ink-800/60 p-0.5 border border-white/5 text-[10px] shrink-0">
        <button
          type="button"
          class="rounded px-1.5 py-0.5 transition cursor-pointer"
          :class="viewMode === 'picker' ? 'bg-white/10 text-white font-medium' : 'text-ink-500 hover:text-ink-300'"
          title="หมุนตั้งเวลาสไตล์ iOS"
          @click="viewMode = 'picker'"
        >
          🎛️ ตั้งเวลา
        </button>
        <button
          type="button"
          class="rounded px-1.5 py-0.5 transition cursor-pointer"
          :class="viewMode === 'clock' ? 'bg-white/10 text-white font-medium' : 'text-ink-500 hover:text-ink-300'"
          title="ดูหน้าปัดนาฬิกา"
          @click="viewMode = 'clock'"
        >
          👁️ หน้าปัด
        </button>
      </div>
      <span v-else class="text-[11px] text-ink-500 font-mono shrink-0">
        รอบที่ {{ sessions + 1 }}
      </span>
    </div>

    <div v-else class="text-[11px] text-ink-400 font-medium tracking-wide text-center shrink-0">
      {{ liveDateStr }}
    </div>

    <!-- ============================================== -->
    <!-- MAIN INTERACTIVE DISPLAY AREA -->
    <!-- ============================================== -->
    <div class="relative flex flex-1 w-full min-h-[150px] items-center justify-center overflow-hidden">

      <!-- ============================================== -->
      <!-- VIEW 1: iOS DRUM WHEEL PICKER (เมื่ออยู่ในโหมดตั้งเวลา) -->
      <!-- ============================================== -->
      <div
        v-if="clockType === 'pomodoro' && viewMode === 'picker' && !running"
        class="relative flex w-full max-w-[280px] h-[150px] items-center justify-center select-none"
      >
        <!-- Center Translucent Highlight Lens -->
        <div class="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 rounded-xl bg-white/[0.08] border border-white/[0.06] shadow-inner" />

        <!-- Wheel Column: HOURS -->
        <div
          class="ios-wheel-column"
          @wheel.prevent="onWheel('hours', $event)"
        >
          <div
            v-for="offset in [-2, -1, 0, 1, 2]"
            :key="`h-${offset}`"
            class="ios-wheel-item"
            :class="{
              'ios-wheel-active': offset === 0,
              'ios-wheel-faint': Math.abs(offset) === 2,
              'ios-wheel-sub': Math.abs(offset) === 1
            }"
            @click="stepUnit('hours', offset)"
          >
            <span class="font-mono">{{ getWheelValue('hours', offset) }}</span>
            <span v-if="offset === 0" class="text-[11px] text-ink-400 font-sans font-normal ml-1">hours</span>
          </div>
        </div>

        <!-- Wheel Column: MINUTES -->
        <div
          class="ios-wheel-column"
          @wheel.prevent="onWheel('minutes', $event)"
        >
          <div
            v-for="offset in [-2, -1, 0, 1, 2]"
            :key="`m-${offset}`"
            class="ios-wheel-item"
            :class="{
              'ios-wheel-active': offset === 0,
              'ios-wheel-faint': Math.abs(offset) === 2,
              'ios-wheel-sub': Math.abs(offset) === 1
            }"
            @click="stepUnit('minutes', offset)"
          >
            <span class="font-mono">{{ getWheelValue('minutes', offset) }}</span>
            <span v-if="offset === 0" class="text-[11px] text-ink-400 font-sans font-normal ml-1">min</span>
          </div>
        </div>

        <!-- Wheel Column: SECONDS -->
        <div
          class="ios-wheel-column"
          @wheel.prevent="onWheel('seconds', $event)"
        >
          <div
            v-for="offset in [-2, -1, 0, 1, 2]"
            :key="`s-${offset}`"
            class="ios-wheel-item"
            :class="{
              'ios-wheel-active': offset === 0,
              'ios-wheel-faint': Math.abs(offset) === 2,
              'ios-wheel-sub': Math.abs(offset) === 1
            }"
            @click="stepUnit('seconds', offset)"
          >
            <span class="font-mono">{{ getWheelValue('seconds', offset) }}</span>
            <span v-if="offset === 0" class="text-[11px] text-ink-400 font-sans font-normal ml-1">sec</span>
          </div>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- VIEW 2: ACTIVE CLOCK FACES (Ring / Flip / LED / Capsule) -->
      <!-- ============================================== -->
      <div v-else class="flex h-full w-full items-center justify-center">

        <!-- 1. STYLE: RING (Minimalist Radial Progress) -->
        <div v-if="clockStyle === 'ring'" class="relative grid aspect-square h-full max-h-[170px] place-items-center">
          <svg class="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(228 12% 18%)" stroke-width="6" />
            <circle
              cx="60" cy="60" r="54" fill="none"
              :stroke="ringColor"
              stroke-width="6" stroke-linecap="round"
              :stroke-dasharray="CIRC"
              :stroke-dashoffset="CIRC * (1 - (clockType === 'pomodoro' ? progress : liveSecondsProgress))"
              class="transition-[stroke-dashoffset] duration-1000 ease-linear"
              :class="{ 'animate-pulse-ring': running && clockType === 'pomodoro' }"
            />
          </svg>
          <div class="text-center z-10">
            <p id="timer-display" class="font-mono text-4xl font-bold tabular-nums text-white" aria-live="polite">
              {{ currentDisplay }}
            </p>
            <p class="mt-1 text-xs text-accent">
              {{ clockType === 'pomodoro' ? (remaining <= 300 && remaining > 0 ? 'ใกล้หมดเวลาแล้ว ⚡' : 'โฟกัส 📖') : 'เวลาปัจจุบัน' }}
            </p>
          </div>
        </div>

        <!-- 2. STYLE: RETRO FLIP CLOCK -->
        <div v-else-if="clockStyle === 'flip'" class="flex flex-col items-center justify-center gap-2">
          <div class="flex items-center gap-1.5 sm:gap-2.5">
            <!-- Left Unit (Minutes or Hours) -->
            <div class="flex flex-col items-center">
              <div class="flex gap-1">
                <div v-for="(digit, idx) in primaryDigits" :key="`pri-${idx}`" class="flip-card">
                  <div class="flip-card-inner">
                    <span class="flip-digit">{{ digit }}</span>
                    <div class="flip-divider"></div>
                    <div class="flip-notch-left"></div>
                    <div class="flip-notch-right"></div>
                  </div>
                </div>
              </div>
              <span class="mt-1 text-[10px] text-ink-500 font-mono tracking-wider uppercase">
                {{ clockType === 'pomodoro' ? 'MIN' : 'HOUR' }}
              </span>
            </div>

            <!-- Colon separator -->
            <div class="flex flex-col gap-1.5 pb-3">
              <span class="h-2 w-2 rounded-full bg-accent/70 shadow-[0_0_8px_rgba(168,85,247,0.8)]" :class="{ 'animate-pulse': running || clockType === 'clock' }"></span>
              <span class="h-2 w-2 rounded-full bg-accent/70 shadow-[0_0_8px_rgba(168,85,247,0.8)]" :class="{ 'animate-pulse': running || clockType === 'clock' }"></span>
            </div>

            <!-- Right Unit (Seconds or Minutes) -->
            <div class="flex flex-col items-center">
              <div class="flex gap-1">
                <div v-for="(digit, idx) in secondaryDigits" :key="`sec-${idx}`" class="flip-card">
                  <div class="flip-card-inner">
                    <span class="flip-digit">{{ digit }}</span>
                    <div class="flip-divider"></div>
                    <div class="flip-notch-left"></div>
                    <div class="flip-notch-right"></div>
                  </div>
                </div>
              </div>
              <span class="mt-1 text-[10px] text-ink-500 font-mono tracking-wider uppercase">
                {{ clockType === 'pomodoro' ? 'SEC' : 'MIN' }}
              </span>
            </div>

            <!-- Seconds for Live Clock -->
            <template v-if="clockType === 'clock'">
              <div class="flex flex-col gap-1.5 pb-3">
                <span class="h-1.5 w-1.5 rounded-full bg-accent/40"></span>
                <span class="h-1.5 w-1.5 rounded-full bg-accent/40"></span>
              </div>
              <div class="flex flex-col items-center">
                <div class="flex gap-1">
                  <div v-for="(digit, idx) in tertiaryDigits" :key="`ter-${idx}`" class="flip-card !w-8 !h-12 sm:!w-9 sm:!h-13">
                    <div class="flip-card-inner">
                      <span class="flip-digit !text-lg">{{ digit }}</span>
                      <div class="flip-divider"></div>
                    </div>
                  </div>
                </div>
                <span class="mt-1 text-[10px] text-ink-500 font-mono tracking-wider uppercase">SEC</span>
              </div>
            </template>
          </div>

          <p class="text-xs text-accent mt-1">
            {{ clockType === 'pomodoro' ? 'Retro Flip Focus' : 'Live Clock' }}
          </p>
        </div>

        <!-- 3. STYLE: GIANT DIGITAL LED / CYBER -->
        <div v-else-if="clockStyle === 'digital'" class="flex w-full flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-black/60 p-4 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div class="absolute inset-0 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>
          <div class="relative z-10 flex flex-col items-center">
            <div class="flex items-baseline gap-1 font-mono tracking-wider">
              <span class="text-4xl sm:text-5xl font-extrabold text-accent drop-shadow-[0_0_18px_rgba(168,85,247,0.7)]">
                {{ currentDisplay }}
              </span>
              <span v-if="clockType === 'clock'" class="text-xs text-accent/70 font-bold ml-1">
                {{ liveAmPm }}
              </span>
            </div>
            <div class="mt-2 flex items-center gap-3 text-[10px] font-mono tracking-widest text-ink-400 uppercase">
              <span class="flex items-center gap-1">
                <span class="h-1.5 w-1.5 rounded-full" :class="running || clockType === 'clock' ? 'bg-emerald-400 animate-pulse' : 'bg-ink-600'"></span>
                {{ running || clockType === 'clock' ? 'ACTIVE' : 'IDLE' }}
              </span>
              <span>•</span>
              <span class="text-accent">
                {{ clockType === 'pomodoro' ? 'FOCUSING' : 'SYSTEM TIME' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 4. STYLE: MINIMAL CAPSULE & BAR -->
        <div v-else class="flex w-full flex-col items-center justify-center gap-3 px-4 py-2">
          <div class="text-center">
            <span class="font-mono text-4xl sm:text-5xl font-light tracking-tight text-white drop-shadow-sm">
              {{ currentDisplay }}
            </span>
            <p class="mt-1 text-xs text-accent">
              {{ clockType === 'pomodoro' ? 'โฟกัส 📖' : 'เวลาปัจจุบัน' }}
            </p>
          </div>
          <div class="w-full max-w-[240px] flex flex-col gap-1.5">
            <div class="h-2 w-full rounded-full bg-ink-800/80 p-0.5 border border-white/[0.06] overflow-hidden">
              <div
                class="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-all duration-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                :style="{ width: `${Math.round((clockType === 'pomodoro' ? progress : liveSecondsProgress) * 100)}%` }"
              ></div>
            </div>
            <div class="flex justify-between text-[10px] text-ink-500 font-mono">
              <span>0%</span>
              <span>{{ Math.round((clockType === 'pomodoro' ? progress : liveSecondsProgress) * 100) }}%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- ============================================== -->
    <!-- BOTTOM CONTROLS: ICONIC iOS CIRCULAR DUAL BUTTONS -->
    <!-- ============================================== -->
    <div v-if="clockType === 'pomodoro'" class="flex items-center justify-between px-6 pt-1 shrink-0">
      <!-- Cancel / Reset Button (iOS Circular Dark Grey) -->
      <button
        id="timer-reset-btn"
        class="ios-circular-btn ios-btn-cancel"
        :class="{ 'opacity-40 pointer-events-none': !running && remaining === total }"
        @click="reset"
      >
        <span>Cancel</span>
      </button>

      <!-- Start / Pause Button (iOS Circular Green / Amber) -->
      <button
        id="timer-start-btn"
        class="ios-circular-btn"
        :class="running ? 'ios-btn-pause' : 'ios-btn-start'"
        @click="running ? pause() : start()"
      >
        <span>{{ running ? 'Pause' : remaining === total ? 'Start' : 'Resume' }}</span>
      </button>
    </div>

    <!-- Clock Mode Controls -->
    <div v-else class="flex w-full justify-center shrink-0 pt-1">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-ink-400 hover:border-accent/40 hover:text-white transition cursor-pointer"
        @click="clockType = 'pomodoro'"
      >
        <span>⏱️ สลับไปโหมดตัวจับเวลา (Timer)</span>
      </button>
    </div>

    <!-- Time's up Toast -->
    <Transition enter-from-class="opacity-0 scale-95" leave-to-class="opacity-0 scale-95" enter-active-class="transition" leave-active-class="transition">
      <div v-if="alertMsg" class="absolute inset-0 z-20 grid place-items-center bg-ink-950/90 p-6 text-center backdrop-blur-md rounded-2xl">
        <div>
          <div class="mb-2 text-4xl">🔔</div>
          <p class="mb-4 font-semibold text-white">{{ alertMsg }}</p>
          <button id="timer-alert-ok" class="btn btn-primary" @click="alertMsg = ''">ตกลง</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

type ClockStyle = 'ring' | 'flip' | 'digital' | 'capsule'
type ClockType = 'pomodoro' | 'clock'

interface Preset {
  label: string
  hours: number
  minutes: number
  seconds: number
}

const presets: Preset[] = [
  { label: 'Focus 25', hours: 0, minutes: 25, seconds: 0 },
  { label: 'Break 5', hours: 0, minutes: 5, seconds: 0 },
  { label: 'Deep 50', hours: 0, minutes: 50, seconds: 0 },
]

const styles: { key: ClockStyle; label: string; icon: string }[] = [
  { key: 'ring', label: 'Ring', icon: '⭕' },
  { key: 'flip', label: 'Flip Clock', icon: '🃏' },
  { key: 'digital', label: 'Neon LED', icon: '📟' },
  { key: 'capsule', label: 'Capsule', icon: '🔋' },
]

const CIRC = 2 * Math.PI * 54

// Persistent states
const clockStyle = useLocalStorage<ClockStyle>('noswitch:timer:style', 'ring')
const clockType = useLocalStorage<ClockType>('noswitch:timer:type', 'pomodoro')
const selectedHours = useLocalStorage<number>('noswitch:timer:wheel:hours', 0)
const selectedMinutes = useLocalStorage<number>('noswitch:timer:wheel:min', 25)
const selectedSeconds = useLocalStorage<number>('noswitch:timer:wheel:sec', 0)
const sessions = useLocalStorage<number>('noswitch:timer:sessions', 0)

const isStyleMenuOpen = ref(false)
const styleDropdownRef = ref<HTMLElement | null>(null)
const viewMode = ref<'picker' | 'clock'>('picker')

function setClockStyle(s: ClockStyle) {
  clockStyle.value = s
  isStyleMenuOpen.value = false
}

const currentStyle = computed(() => styles.find((s) => s.key === clockStyle.value) || styles[0]!)

// Pomodoro Countdown Logic
const computeTotalSeconds = () => {
  const h = Math.max(0, Math.min(23, selectedHours.value || 0))
  const m = Math.max(0, Math.min(59, selectedMinutes.value || 0))
  const s = Math.max(0, Math.min(59, selectedSeconds.value || 0))
  const totalSecs = h * 3600 + m * 60 + s
  return totalSecs > 0 ? totalSecs : 25 * 60
}

const total = ref(computeTotalSeconds())
const remaining = ref(total.value)
const running = ref(false)
const alertMsg = ref('')
let interval: ReturnType<typeof setInterval> | undefined
let endAt = 0

// Live Clock State
const nowTime = ref(new Date())
let clockTicker: ReturnType<typeof setInterval> | undefined

// iOS Wheel Picker Methods
function getWheelValue(unit: 'hours' | 'minutes' | 'seconds', offset: number): number {
  if (unit === 'hours') {
    return (selectedHours.value + offset + 24) % 24
  } else if (unit === 'minutes') {
    return (selectedMinutes.value + offset + 60) % 60
  } else {
    return (selectedSeconds.value + offset + 60) % 60
  }
}

function onWheel(unit: 'hours' | 'minutes' | 'seconds', e: WheelEvent) {
  const delta = e.deltaY > 0 ? 1 : -1
  stepUnit(unit, delta)
}

function stepUnit(unit: 'hours' | 'minutes' | 'seconds', delta: number) {
  if (running.value) return
  if (unit === 'hours') {
    selectedHours.value = (selectedHours.value + delta + 24) % 24
  } else if (unit === 'minutes') {
    selectedMinutes.value = (selectedMinutes.value + delta + 60) % 60
  } else {
    selectedSeconds.value = (selectedSeconds.value + delta + 60) % 60
  }
  total.value = computeTotalSeconds()
  remaining.value = total.value
}

function isPresetActive(p: Preset): boolean {
  return selectedHours.value === p.hours && selectedMinutes.value === p.minutes && selectedSeconds.value === p.seconds
}

function applyPreset(p: Preset) {
  selectedHours.value = p.hours
  selectedMinutes.value = p.minutes
  selectedSeconds.value = p.seconds
  total.value = computeTotalSeconds()
  remaining.value = total.value
}

const display = computed(() => {
  const h = Math.floor(remaining.value / 3600)
  const m = Math.floor((remaining.value % 3600) / 60)
  const s = remaining.value % 60
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const currentDisplay = computed(() => {
  if (clockType.value === 'pomodoro') return display.value
  const h = String(nowTime.value.getHours()).padStart(2, '0')
  const m = String(nowTime.value.getMinutes()).padStart(2, '0')
  const s = String(nowTime.value.getSeconds()).padStart(2, '0')
  return `${h}:${m}:${s}`
})

const progress = computed(() => (total.value ? remaining.value / total.value : 0))
const ringColor = computed(() => (remaining.value <= 300 && remaining.value > 0 ? 'hsl(38 92% 50%)' : 'hsl(258 90% 72%)'))

// Digits for Flip Clock
const primaryDigits = computed(() => {
  if (clockType.value === 'pomodoro') {
    const h = Math.floor(remaining.value / 3600)
    const m = Math.floor((remaining.value % 3600) / 60)
    return h > 0 ? String(h).padStart(2, '0').split('') : String(m).padStart(2, '0').split('')
  }
  return String(nowTime.value.getHours()).padStart(2, '0').split('')
})

const secondaryDigits = computed(() => {
  if (clockType.value === 'pomodoro') {
    const h = Math.floor(remaining.value / 3600)
    const m = Math.floor((remaining.value % 3600) / 60)
    const s = remaining.value % 60
    return h > 0 ? String(m).padStart(2, '0').split('') : String(s).padStart(2, '0').split('')
  }
  return String(nowTime.value.getMinutes()).padStart(2, '0').split('')
})

const tertiaryDigits = computed(() => {
  const s = nowTime.value.getSeconds()
  return String(s).padStart(2, '0').split('')
})

// Live Clock Date Meta
const liveDateStr = computed(() => {
  const d = nowTime.value
  const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  return `วัน${days[d.getDay()]}ที่ ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
})

const liveAmPm = computed(() => (nowTime.value.getHours() >= 12 ? 'PM' : 'AM'))
const liveSecondsProgress = computed(() => nowTime.value.getSeconds() / 60)

function start() {
  if (remaining.value <= 0) reset()
  running.value = true
  viewMode.value = 'clock' // สลับเข้าหน้าปัดอัตโนมัติเมื่อเริ่มนับ
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
  total.value = computeTotalSeconds()
  remaining.value = total.value
}

function finish() {
  pause()
  playChime()
  sessions.value++
  alertMsg.value = 'เยี่ยมมาก! ครบเวลาโฟกัสแล้ว ได้เวลาพัก ☕'
  reset()
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('NoSwitch Timer', { body: alertMsg.value })
  }
}

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
  } catch { /* audio unavailable */ }
}

onMounted(() => {
  clockTicker = setInterval(() => {
    nowTime.value = new Date()
  }, 1000)
})

// อัปเดต Title ของเบราว์เซอร์ให้เห็นเวลานับถอยหลังแม้สลับแท็บ
watch([running, display, clockType], ([isRun, timeStr, type]) => {
  if (import.meta.client) {
    if (type === 'pomodoro' && isRun) {
      document.title = `(${timeStr}) NoSwitch • โฟกัส 📖`
    } else {
      document.title = 'NoSwitch — All-in-One Study Dashboard'
    }
  }
})

onBeforeUnmount(() => {
  clearInterval(interval)
  clearInterval(clockTicker)
  if (import.meta.client) {
    document.title = 'NoSwitch — All-in-One Study Dashboard'
  }
})
</script>

<style scoped>
/* ========================================================
   iOS Wheel Picker Drum Styles
   ======================================================== */
.ios-wheel-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  cursor: pointer;
  mask-image: linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%);
}

.ios-wheel-item {
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease-out;
  user-select: none;
}

.ios-wheel-active {
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 700;
  transform: scale(1.05);
}

.ios-wheel-sub {
  color: #64748b;
  font-size: 1rem;
  font-weight: 500;
  opacity: 0.6;
}

.ios-wheel-faint {
  color: #334155;
  font-size: 0.85rem;
  opacity: 0.3;
}

/* ========================================================
   Iconic iOS Circular Dual Buttons
   ======================================================== */
.ios-circular-btn {
  width: 3.75rem;
  height: 3.75rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  font-weight: 500;
  transition: all 0.15s ease;
  cursor: pointer;
}

.ios-circular-btn:active {
  transform: scale(0.92);
}

.ios-btn-cancel {
  background-color: rgba(38, 38, 45, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
}

.ios-btn-cancel:hover {
  background-color: rgba(50, 50, 60, 0.95);
  color: #ffffff;
}

.ios-btn-start {
  background-color: rgba(6, 78, 59, 0.6);
  border: 1px solid rgba(52, 211, 153, 0.45);
  color: #34d399;
  box-shadow: 0 0 16px rgba(16, 185, 129, 0.2);
}

.ios-btn-start:hover {
  background-color: rgba(6, 78, 59, 0.85);
  box-shadow: 0 0 22px rgba(16, 185, 129, 0.35);
}

.ios-btn-pause {
  background-color: rgba(120, 53, 15, 0.6);
  border: 1px solid rgba(251, 191, 36, 0.45);
  color: #fbbf24;
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.2);
}

.ios-btn-pause:hover {
  background-color: rgba(120, 53, 15, 0.85);
  box-shadow: 0 0 22px rgba(245, 158, 11, 0.35);
}

/* ========================================================
   Retro Flip Card Styling
   ======================================================== */
.flip-card {
  position: relative;
  width: 36px;
  height: 52px;
  perspective: 400px;
}

@media (min-width: 640px) {
  .flip-card {
    width: 44px;
    height: 60px;
  }
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #1e2230 0%, #121520 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: 0 8px 16px -2px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15);
  overflow: hidden;
}

.flip-digit {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 1.7rem;
  font-weight: 800;
  color: #f1f5f9;
  line-height: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
}

@media (min-width: 640px) {
  .flip-digit {
    font-size: 2rem;
  }
}

.flip-divider {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(0, 0, 0, 0.85);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.08);
}

.flip-notch-left {
  position: absolute;
  left: -2px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  border-radius: 9999px;
  background: #090a0f;
}

.flip-notch-right {
  position: absolute;
  right: -2px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  border-radius: 9999px;
  background: #090a0f;
}
</style>

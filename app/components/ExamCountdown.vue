<template>
  <div
    class="widget flex flex-col h-full w-full select-none transition-all duration-300"
    :class="urgencyStyles.cardBorder"
    aria-labelledby="exam-countdown-title"
  >
    <!-- WIDGET HEADER -->
    <div class="widget-header border-b border-white/[0.06] pb-2.5 shrink-0">
      <div class="flex items-center gap-2">
        <span class="text-base">⏳</span>
        <div>
          <h2 id="exam-countdown-title" class="text-xs font-semibold text-white tracking-wide flex items-center gap-2">
            Exam D-Day Countdown
            <span
              class="rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase"
              :class="urgencyStyles.badge"
            >
              {{ urgencyStyles.statusText }}
            </span>
          </h2>
        </div>
      </div>

      <!-- Settings / Edit Button -->
      <button
        type="button"
        class="rounded-lg border border-white/[0.08] bg-white/[0.04] p-1.5 text-xs text-ink-300 hover:text-white transition cursor-pointer"
        :title="isEditing ? 'เสร็จสิ้นการตั้งค่า' : 'แก้ไขวันสอบและชื่อวิชา'"
        @click="isEditing = !isEditing"
      >
        <span>{{ isEditing ? '✓ บันทึก' : '⚙️ ตั้งค่า' }}</span>
      </button>
    </div>

    <!-- WIDGET BODY -->
    <div class="widget-body flex flex-1 flex-col gap-3 p-3 overflow-y-auto scroll-thin">
      <!-- 1. EXAM DETAILS / EDIT FORM -->
      <div v-if="isEditing" class="rounded-xl border border-white/[0.08] bg-ink-800/70 p-3 space-y-2.5 animate-fade-up">
        <div>
          <label class="text-[10px] text-ink-400 block mb-1">ชื่อวิชา หรือเป้าหมายที่กำลังจะสอบ:</label>
          <input
            v-model="examTitle"
            type="text"
            placeholder="เช่น Calculus II, โครงสร้างข้อมูล, สอบ ก.พ."
            class="input text-xs py-1.5 px-3"
            @change="saveSettings"
          />
        </div>
        <div>
          <label class="text-[10px] text-ink-400 block mb-1">วันและเวลาที่เริ่มสอบ:</label>
          <input
            v-model="examDateTime"
            type="datetime-local"
            class="input text-xs py-1.5 px-3 text-white"
            @change="saveSettings"
          />
        </div>
        <button
          type="button"
          class="btn btn-primary text-xs w-full py-1.5"
          @click="isEditing = false"
        >
          ตกลง และเริ่มนับถอยหลัง
        </button>
      </div>

      <!-- 2. EXAM TITLE & COUNTDOWN CLOCK DISPLAY -->
      <div
        v-else
        class="relative rounded-2xl border p-4 text-center overflow-hidden transition-all duration-300 flex flex-col justify-center"
        :class="urgencyStyles.clockContainer"
      >
        <!-- Subtle pulsing background for Panic Mode -->
        <div
          v-if="urgencyLevel === 'panic'"
          class="absolute inset-0 bg-rose-500/10 animate-pulse pointer-events-none"
        />

        <div class="relative z-10 flex items-center justify-center gap-1.5 text-xs font-semibold text-white/90 mb-2.5">
          <span>🎯</span>
          <span class="truncate max-w-[260px]">{{ examTitle || 'กำหนดวันสอบของคุณ' }}</span>
        </div>

        <!-- 4-Block Countdown Grid -->
        <div class="relative z-10 grid grid-cols-4 gap-2">
          <!-- Days -->
          <div class="rounded-xl border border-white/[0.08] bg-black/40 p-2 flex flex-col items-center">
            <span class="text-xl sm:text-2xl font-black font-mono tracking-tight" :class="urgencyStyles.numberColor">
              {{ String(timeLeft.days).padStart(2, '0') }}
            </span>
            <span class="text-[9px] uppercase tracking-wider text-ink-400 mt-0.5">วัน</span>
          </div>

          <!-- Hours -->
          <div class="rounded-xl border border-white/[0.08] bg-black/40 p-2 flex flex-col items-center">
            <span class="text-xl sm:text-2xl font-black font-mono tracking-tight" :class="urgencyStyles.numberColor">
              {{ String(timeLeft.hours).padStart(2, '0') }}
            </span>
            <span class="text-[9px] uppercase tracking-wider text-ink-400 mt-0.5">ชม.</span>
          </div>

          <!-- Minutes -->
          <div class="rounded-xl border border-white/[0.08] bg-black/40 p-2 flex flex-col items-center">
            <span class="text-xl sm:text-2xl font-black font-mono tracking-tight" :class="urgencyStyles.numberColor">
              {{ String(timeLeft.minutes).padStart(2, '0') }}
            </span>
            <span class="text-[9px] uppercase tracking-wider text-ink-400 mt-0.5">นาที</span>
          </div>

          <!-- Seconds -->
          <div class="rounded-xl border border-white/[0.08] bg-black/40 p-2 flex flex-col items-center">
            <span class="text-xl sm:text-2xl font-black font-mono tracking-tight" :class="urgencyStyles.numberColor">
              {{ String(timeLeft.seconds).padStart(2, '0') }}
            </span>
            <span class="text-[9px] uppercase tracking-wider text-ink-400 mt-0.5">วินาที</span>
          </div>
        </div>

        <p class="relative z-10 text-[10px] text-ink-400 mt-2.5">
          วันสอบ: <span class="text-ink-200 font-medium">{{ formattedExamDate }}</span>
        </p>
      </div>

      <!-- 3. SURVIVAL QUOTE BOX (คำคมกระตุกจิต) -->
      <div class="rounded-xl border border-white/[0.06] bg-ink-800/40 p-3 flex flex-col justify-between gap-2">
        <div class="flex items-center justify-between text-xs">
          <!-- Quote Style Dropdown / Switcher -->
          <div class="flex items-center gap-1.5">
            <span class="text-xs">💬</span>
            <select
              v-model="selectedQuoteCategory"
              class="rounded-lg border border-white/[0.08] bg-ink-900 px-2 py-0.5 text-[10px] text-ink-200 outline-none cursor-pointer"
              @change="shuffleQuote"
            >
              <option value="warm">สายให้กำลังใจ (Warm)</option>
              <option value="savage">สายเพื่อนสนิทด่าเตือนสติ (Savage)</option>
              <option value="strict">สายอาจารย์เข้มงวด (Strict)</option>
            </select>
          </div>

          <!-- Shuffle Quote Button -->
          <button
            type="button"
            class="text-[10px] text-accent hover:underline cursor-pointer flex items-center gap-1"
            title="สุ่มคำคมใหม่"
            @click="shuffleQuote"
          >
            <span>🎲</span>
            <span>สุ่มคำคม</span>
          </button>
        </div>

        <!-- Current Quote Text -->
        <p class="text-xs italic text-ink-200 leading-relaxed font-sans bg-black/20 p-2.5 rounded-lg border border-white/[0.04]">
          “{{ currentQuote }}”
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const STORAGE_KEY = 'noswitch:exam:countdown:v2'

interface ExamSettings {
  title: string
  dateTime: string
  category: 'warm' | 'savage' | 'strict'
}

const QUOTES = {
  warm: [
    'ก้าวเล็กๆ ที่ทำในวันนี้ จะนำไปสู่ผลลัพธ์ที่ยิ่งใหญ่ในวันสอบ สู้ๆ นะ!',
    'ความพยายามไม่เคยทรยศใคร จงเชื่อมั่นในสมองและเวลาที่คุณทุ่มเทลงไป',
    'เหนื่อยหน่อยตอนนี้ แต่ตอนเห็นเกรด A ออกมา คุณจะขอบคุณตัวเองในวันนี้',
    'คุณเก่งกว่าที่คุณคิด และคุณพร้อมมากกว่าที่คุณรู้สึก หายใจเข้าลึกๆ แล้วลุยต่อ!'
  ],
  savage: [
    'ถ้าข้อสอบออกเรื่องนอนเล่นมือถือ ป่านนี้คงได้เกียรตินิยมอันดับ 1 ไปแล้ว!',
    'เวลาสอบลดลงทุกวินาที แต่นิ้วยังไถฟีดอยู่เลย จะเอาอะไรไปกาในห้องสอบ?',
    'คนอื่นเขาอ่านรอบที่สามแล้ว มึงยังอ่านไม่พ้นบทแรกเลย ตื่นได้แล้ว!',
    'ข้ออ้างมีเป็นร้อย ข้อสอบมีแค่ ก ข ค ง อ่านหนังสือเดี๋ยวนี้!'
  ],
  strict: [
    'ความสำเร็จในห้องสอบ ไม่ได้ขึ้นอยู่กับโชคชะตา แต่วัดจากชั่วโมงที่คุณนั่งอ่านอย่างมีสมาธิ',
    'การเตรียมตัวที่บกพร่อง คือการเตรียมตัวที่จะล้มเหลว จงทบทวนอย่างละเอียด',
    'ไม่มีทางลัดสำหรับความรู้ มีเพียงวินัยและการลงมือทำอย่างต่อเนื่องเท่านั้น',
    'เกรดเฉลี่ยคือภาพสะท้อนของความรับผิดชอบ อย่าปล่อยให้ความประมาททำลายอนาคต'
  ]
}

const examTitle = ref('ปลายภาคการศึกษา (Final Exam)')
// Default 5 days from now
const defaultDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
const examDateTime = ref(defaultDate.toISOString().slice(0, 16))
const selectedQuoteCategory = ref<'warm' | 'savage' | 'strict'>('savage')
const isEditing = ref(false)

const currentQuote = ref(QUOTES.savage[0])

const timeLeft = ref({
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  totalMs: 0
})

let timer: ReturnType<typeof setInterval> | null = null

function updateCountdown() {
  const target = new Date(examDateTime.value).getTime()
  const now = Date.now()
  const diff = target - now

  if (isNaN(diff) || diff <= 0) {
    timeLeft.value = { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 }
    return
  }

  const seconds = Math.floor((diff / 1000) % 60)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  timeLeft.value = { days, hours, minutes, seconds, totalMs: diff }
}

const urgencyLevel = computed<'safe' | 'warning' | 'panic' | 'passed'>(() => {
  if (timeLeft.value.totalMs <= 0) return 'passed'
  const hours = timeLeft.value.totalMs / (1000 * 60 * 60)
  if (hours <= 24) return 'panic'
  if (hours <= 72) return 'warning'
  return 'safe'
})

const urgencyStyles = computed(() => {
  switch (urgencyLevel.value) {
    case 'panic':
      return {
        cardBorder: 'border-rose-500/50 shadow-[0_0_25px_rgba(244,63,94,0.25)]',
        badge: 'border-rose-500/50 bg-rose-500/20 text-rose-300 animate-pulse',
        statusText: '🚨 PANIC MODE (< 24 ชม.)',
        clockContainer: 'border-rose-500/30 bg-rose-950/20',
        numberColor: 'text-rose-400'
      }
    case 'warning':
      return {
        cardBorder: 'border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]',
        badge: 'border-amber-500/50 bg-amber-500/20 text-amber-300',
        statusText: '⚠️ WARNING (< 3 วัน)',
        clockContainer: 'border-amber-500/30 bg-amber-950/20',
        numberColor: 'text-amber-300'
      }
    case 'passed':
      return {
        cardBorder: 'border-white/[0.08]',
        badge: 'border-white/[0.08] bg-white/[0.04] text-ink-400',
        statusText: '🎉 ถึงวันสอบแล้ว!',
        clockContainer: 'border-white/[0.06] bg-ink-800/40',
        numberColor: 'text-emerald-400'
      }
    default:
      return {
        cardBorder: 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]',
        badge: 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300',
        statusText: '🟢 SAFE (> 3 วัน)',
        clockContainer: 'border-white/[0.06] bg-ink-800/40',
        numberColor: 'text-white'
      }
  }
})

const formattedExamDate = computed(() => {
  try {
    const d = new Date(examDateTime.value)
    return d.toLocaleDateString('th-TH', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return examDateTime.value
  }
})

function shuffleQuote() {
  const list = QUOTES[selectedQuoteCategory.value] || QUOTES.savage
  const randomIndex = Math.floor(Math.random() * list.length)
  currentQuote.value = list[randomIndex]!
  saveSettings()
}

function saveSettings() {
  if (typeof localStorage !== 'undefined') {
    const data: ExamSettings = {
      title: examTitle.value,
      dateTime: examDateTime.value,
      category: selectedQuoteCategory.value
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
}

onMounted(() => {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: ExamSettings = JSON.parse(raw)
        if (parsed.title) examTitle.value = parsed.title
        if (parsed.dateTime) examDateTime.value = parsed.dateTime
        if (parsed.category) selectedQuoteCategory.value = parsed.category
      }
    } catch {
      // ignore
    }
  }

  shuffleQuote()
  updateCountdown()
  timer = setInterval(updateCountdown, 1000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

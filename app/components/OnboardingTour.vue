<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md select-none overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-modal-title"
        @keydown.esc="closeTour"
        @keydown.left="prevStep"
        @keydown.right="nextStep"
        tabindex="0"
      >
        <!-- Modal Card Container -->
        <div
          class="relative w-full max-w-lg rounded-3xl border border-white/[0.12] bg-ink-900/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 overflow-hidden flex flex-col gap-5 my-auto animate-fade-up"
          @click.stop
        >
          <!-- Ambient Dynamic Glow inside card -->
          <div
            class="pointer-events-none absolute -top-20 -right-20 h-52 w-52 rounded-full blur-3xl opacity-30 transition-all duration-700"
            :class="currentStepData.glowClass"
          />
          <div
            class="pointer-events-none absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-accent-2/15 blur-3xl transition-all duration-700"
          />

          <!-- Header: Badge & Skip Button -->
          <div class="relative flex items-center justify-between z-10">
            <span
              class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide border shadow-sm transition-all duration-300"
              :class="currentStepData.badgeClass"
            >
              <span>{{ currentStepData.badgeIcon }}</span>
              <span>{{ currentStepData.badgeText }}</span>
            </span>

            <button
              type="button"
              class="group flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs text-ink-400 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
              title="ข้ามคำแนะนำ (Esc)"
              @click="closeTour"
            >
              <span class="text-xs">ข้ามทัวร์</span>
              <span class="text-sm transition group-hover:scale-110">✕</span>
            </button>
          </div>

          <!-- Step Content Body with animated slide/fade -->
          <Transition
            mode="out-in"
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-3"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-3"
          >
            <div :key="currentStep" class="relative z-10 flex flex-col gap-4">
              <!-- Visual Hero Banner / Icon & Titles -->
              <div class="flex items-center gap-3.5">
                <div
                  class="grid h-14 w-14 sm:h-16 sm:w-16 place-items-center rounded-2xl text-3xl sm:text-4xl shadow-lg ring-1 ring-white/15 shrink-0 transition-transform duration-300 hover:scale-105"
                  :class="currentStepData.iconBg"
                >
                  {{ currentStepData.heroIcon }}
                </div>
                <div>
                  <h3
                    id="tour-modal-title"
                    class="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug"
                  >
                    {{ currentStepData.title }}
                  </h3>
                  <p class="text-xs text-ink-400 mt-0.5">
                    {{ currentStepData.subtitle }}
                  </p>
                </div>
              </div>

              <!-- Main Explanation Description -->
              <p class="text-xs sm:text-sm leading-relaxed text-ink-300">
                {{ currentStepData.description }}
              </p>

              <!-- Feature Highlights List -->
              <div class="flex flex-col gap-2 rounded-2xl border border-white/[0.06] bg-ink-950/60 p-3 sm:p-3.5 backdrop-blur-md">
                <div
                  v-for="(item, idx) in currentStepData.highlights"
                  :key="idx"
                  class="flex items-start gap-2.5 text-xs text-ink-300"
                >
                  <span class="text-sm shrink-0 mt-0.5">{{ item.icon }}</span>
                  <div class="leading-relaxed">
                    <strong class="font-semibold text-white">{{ item.title }}:</strong>
                    <span class="text-ink-400 ml-1">{{ item.desc }}</span>
                  </div>
                </div>
              </div>

              <!-- Pro-tip Callout -->
              <div
                v-if="currentStepData.tip"
                class="flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/10 px-3 py-2 text-xs text-accent"
              >
                <span class="text-sm shrink-0">💡</span>
                <span class="leading-normal">{{ currentStepData.tip }}</span>
              </div>
            </div>
          </Transition>

          <!-- Footer: Dots Indicator, Back, Next / Finish -->
          <div class="relative z-10 flex items-center justify-between border-t border-white/[0.08] pt-4 mt-1">
            <!-- Left: Step Indicator Dots & Text -->
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-1.5" role="tablist" aria-label="Step Navigation">
                <button
                  v-for="idx in steps.length"
                  :key="idx"
                  type="button"
                  class="h-2 rounded-full transition-all duration-300 cursor-pointer"
                  :class="currentStep === idx - 1 ? 'w-6 bg-accent shadow-[0_0_8px_rgba(168,85,247,0.7)]' : 'w-2 bg-white/20 hover:bg-white/40'"
                  :title="`ไปที่ขั้นตอนที่ ${idx}`"
                  @click="goToStep(idx - 1)"
                />
              </div>
              <span class="text-[11px] font-mono text-ink-500">
                ขั้นตอนที่ {{ currentStep + 1 }} / {{ steps.length }}
              </span>
            </div>

            <!-- Right: Action Buttons -->
            <div class="flex items-center gap-2">
              <button
                v-if="currentStep > 0"
                type="button"
                class="btn btn-ghost text-xs px-3 py-2"
                @click="prevStep"
              >
                ◀ ย้อนกลับ
              </button>

              <button
                v-if="currentStep < steps.length - 1"
                type="button"
                class="btn btn-primary text-xs px-4 py-2 font-semibold shadow-md shadow-accent/25"
                @click="nextStep"
              >
                <span>ถัดไป</span>
                <span>▶</span>
              </button>

              <button
                v-else
                type="button"
                class="btn btn-primary text-xs px-5 py-2 font-bold shadow-lg shadow-accent/30 animate-pulse"
                @click="closeTour"
              >
                <span>🚀 เริ่มอ่านหนังสือเลย!</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: boolean
}>(), {
  modelValue: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'complete'): void
}>()

const STORAGE_KEY = 'noswitch_tour_completed'
const localOpen = ref(false)
const currentStep = ref(0)

const isOpen = computed({
  get: () => props.modelValue || localOpen.value,
  set: (val: boolean) => {
    localOpen.value = val
    emit('update:modelValue', val)
  }
})

interface StepHighlight {
  icon: string
  title: string
  desc: string
}

interface StepInfo {
  badgeText: string
  badgeIcon: string
  badgeClass: string
  glowClass: string
  iconBg: string
  heroIcon: string
  title: string
  subtitle: string
  description: string
  highlights: StepHighlight[]
  tip?: string
}

const steps: StepInfo[] = [
  {
    badgeText: 'ยินดีต้อนรับสู่ NoSwitch',
    badgeIcon: '🎉',
    badgeClass: 'border-accent/40 bg-accent/15 text-accent shadow-accent/20',
    glowClass: 'bg-accent/30',
    iconBg: 'bg-gradient-to-br from-accent/30 to-accent-2/30 text-white',
    heroIcon: '🚀',
    title: 'All-in-One Virtual Focus Space',
    subtitle: 'โต๊ะอ่านหนังสือดิจิทัล รวมทุกอย่างในหน้าเดียว',
    description: 'NoSwitch ออกแบบมาเพื่อแก้ปัญหา "หลุดสมาธิจากการสลับหน้าจอ (Zero Context-Switching)" โดยรวมทุกเครื่องมือที่ต้องใช้ในการอ่านหนังสือและการบ้านไว้ในหน้าจอเดียว',
    highlights: [
      { icon: '🎧', title: 'YouTube Focus', desc: 'เปิดเพลง Lo-fi หรือเสียงฝนเพื่อกระตุ้นสมาธิ' },
      { icon: '⏱️', title: 'Pomodoro Timer', desc: 'ตัวจับเวลาโฟกัส 25 นาทีสไตล์ Apple สุดมินิมอล' },
      { icon: '📅', title: 'Study Tasks', desc: 'จดบันทึกและติ๊กงานที่ต้องทำให้เสร็จในแต่ละวัน' },
      { icon: '🤖', title: 'AI Assistant', desc: 'ผู้ช่วยติวส่วนตัว พร้อมสรุปบทเรียนและตอบข้อสงสัย' },
    ],
    tip: 'กดปุ่ม "ถัดไป" หรือใช้ปุ่มลูกศร ◀ ▶ บนคีย์บอร์ดเพื่อดูวิธีใช้งาน'
  },
  {
    badgeText: 'แถบเครื่องมือ & วิดเจ็ต',
    badgeIcon: '🪟',
    badgeClass: 'border-sky-500/40 bg-sky-500/15 text-sky-300 shadow-sky-500/20',
    glowClass: 'bg-sky-500/30',
    iconBg: 'bg-gradient-to-br from-sky-500/30 to-indigo-500/30 text-sky-200',
    heroIcon: '🛠️',
    title: 'เลือกเปิดเฉพาะเครื่องมือที่คุณต้องการ',
    subtitle: 'แถบเครื่องมือด้านบน (Top Navigation Bar)',
    description: 'ปรับแต่งพื้นที่อ่านหนังสือให้มีเฉพาะเครื่องมือที่จำเป็นในแต่ละช่วงเวลาได้อย่างอิสระ:',
    highlights: [
      { icon: '🪟', title: 'Widgets Dropdown', desc: 'คลิกเพื่อเปิดเครื่องมือเสริม เช่น กระดาษทด (Scratchpad), HUD แปะสูตร, หรือนับวันสอบ' },
      { icon: '⚡', title: 'Presets Layout', desc: 'สลับโหมดมาตรฐาน, โหมดอ่าน PDF หรือโหมดมินิมอลในคลิกเดียว' },
      { icon: '🎨', title: 'Themes & Wallpapers', desc: 'ปรับภาพพื้นหลังห้องอ่านหนังสือและเปลี่ยนสีไฮไลต์' },
    ],
    tip: 'สามารถกดปุ่มไอคอนหมุนวน (Reset) บน Navbar เพื่อคืนค่ากลับสู่เลย์เอาต์เริ่มต้นได้ตลอดเวลา'
  },
  {
    badgeText: 'จัดเลย์เอาต์อิสระ',
    badgeIcon: '🖐️',
    badgeClass: 'border-purple-500/40 bg-purple-500/15 text-purple-300 shadow-purple-500/20',
    glowClass: 'bg-purple-500/30',
    iconBg: 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-purple-200',
    heroIcon: '📐',
    title: 'ลากสลับตำแหน่ง & ย่อ-ขยายการ์ดได้ดั่งใจ',
    subtitle: 'ระบบ Drag & Drop และ Dynamic Card Resize',
    description: 'จัดโต๊ะอ่านหนังสือให้เข้ากับสไตล์ของคุณได้แบบ 100% ลื่นไหลเหมือนระบบปฏิบัติการบนคอมพิวเตอร์:',
    highlights: [
      { icon: '⠿', title: 'Drag & Drop', desc: 'คลิกลากที่หัวการ์ด (Header) หรือกดปุ่มลูกศร ◀ ▶ เพื่อสลับลำดับการ์ด' },
      { icon: '📐', title: 'Resize Handles', desc: 'นำเมาส์ไปชี้ที่ขอบขวา ขอบล่าง หรือมุมล่างขวาของการ์ดแล้วลากเพื่อปรับขนาด' },
      { icon: '🧘', title: 'Zen Mode', desc: 'กดปุ่ม Zen Mode เพื่อซ่อนทุกอย่าง เข้าสู่โหมดอ่านหนังสือเต็มจอไร้สิ่งกวนใจ' },
    ],
    tip: 'สามารถกดปุ่ม ─ บนหัวการ์ดเพื่อพับย่อการ์ดชั่วคราวได้'
  },
  {
    badgeText: 'เทคโนโลยีช่วยคุมสมาธิ',
    badgeIcon: '🛡️',
    badgeClass: 'border-rose-500/40 bg-rose-500/15 text-rose-300 shadow-rose-500/20',
    glowClass: 'bg-rose-500/30',
    iconBg: 'bg-gradient-to-br from-rose-500/30 to-amber-500/30 text-rose-200',
    heroIcon: '👁️',
    title: 'กล้องตรวจจับมือถือ & ติวเตอร์ AI',
    subtitle: 'ฟีเจอร์อัจฉริยะที่ช่วยรักษาโฟกัสอย่างแท้จริง',
    description: 'สองอาวุธลับที่พัฒนาขึ้นมาเป็นพิเศษเพื่อป้องกันการวอกแวกและตอบคำถามการเรียนได้แบบเรียลไทม์:',
    highlights: [
      { icon: '🛡️', title: 'Anti-Phone Guardian', desc: 'เปิดกล้อง AI ตรวจจับเมื่อเผลอหยิบสมาร์ตโฟนขึ้นมาเล่น พร้อมเสียงและคำเตือนสติ' },
      { icon: '📕', title: 'Zero-Upload PDF Sync', desc: 'เปิดไฟล์ชีทเรียนใน Document Reader แล้ว AI จะมองเห็นเนื้อหาในชีททันที' },
    ],
    tip: 'ภาพจากกล้องเว็บแคมถูกประมวลผลบนเครื่องของคุณแบบ Client-side 100% ปลอดภัย ไม่ส่งไปเซิร์ฟเวอร์ใดๆ'
  },
  {
    badgeText: 'พร้อมเริ่มใช้งานแล้ว!',
    badgeIcon: '🎯',
    badgeClass: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 shadow-emerald-500/20',
    glowClass: 'bg-emerald-500/30',
    iconBg: 'bg-gradient-to-br from-emerald-500/30 to-teal-500/30 text-emerald-200',
    heroIcon: '✨',
    title: 'พร้อมสร้างชั่วโมงโฟกัสที่มีประสิทธิภาพแล้วหรือยัง?',
    subtitle: 'ยินดีต้อนรับสู่โลกของ NoSwitch',
    description: 'ทุกอย่างถูกจัดเตรียมไว้ให้พร้อมใช้งานทันที เปิดเพลง Lo-fi ตั้งเวลา 25 นาที แล้วเริ่มต้นอ่านหนังสือกันเลย!',
    highlights: [
      { icon: '❓', title: 'ดูคำแนะนำซ้ำ', desc: 'กดปุ่ม Help (?) บนแถบด้านบนเพื่อเปิดดูคู่มือนี้ซ้ำได้ตลอดเวลา' },
      { icon: '💾', title: 'Auto-Save', desc: 'ทุกอย่างที่คุณพิมพ์หรือปรับแต่ง จะถูกจดจำไว้ในเบราว์เซอร์อัตโนมัติ' },
    ],
    tip: 'เตรียมน้ำดื่ม ปรับแสงหน้าจอให้สบายตา แล้วคลิกปุ่มด้านล่างเพื่อเริ่มอ่านหนังสือ!'
  }
]

const currentStepData = computed(() => steps[currentStep.value] || steps[0]!)

function goToStep(idx: number) {
  if (idx >= 0 && idx < steps.length) {
    currentStep.value = idx
  }
}

function nextStep() {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  } else {
    closeTour()
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function closeTour() {
  isOpen.value = false
  try {
    localStorage.setItem(STORAGE_KEY, 'true')
  } catch (err) {
    console.warn('Failed to save tour state', err)
  }
  emit('complete')
}

function openTour() {
  currentStep.value = 0
  isOpen.value = true
}

onMounted(() => {
  try {
    const completed = localStorage.getItem(STORAGE_KEY)
    if (!completed) {
      setTimeout(() => {
        openTour()
      }, 500)
    }
  } catch (err) {
    console.warn('Failed to check tour completed state', err)
  }
})

defineExpose({
  open: openTour,
  close: closeTour,
  goToStep
})
</script>

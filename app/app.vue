<template>
  <div
    class="flex min-h-screen w-screen flex-col bg-ink-950 font-sans text-ink-300 selection:bg-accent/30 selection:text-white"
    :class="{ 'select-none': isDragging || isResizing }"
  >
    <!-- Overlay คลุมหน้าจอขณะกำลัง Drag หรือ Resize เพื่อป้องกันไม่ให้เมาส์หลุดเข้าไปติดใน YouTube iframe -->
    <div
      v-if="isDragging || isResizing"
      class="fixed inset-0 z-50 pointer-events-auto bg-transparent select-none"
      :class="isDragging ? 'cursor-grabbing' : 'cursor-se-resize'"
    />

    <!-- Top Navigation Bar & Workspace Presets -->
    <header class="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-ink-900/90 px-4 py-2.5 backdrop-blur-xl">
      <!-- Left: Logo & Title -->
      <div class="flex items-center gap-3">
        <div class="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-sm font-bold text-ink-950 shadow-md shadow-accent/25">
          N
        </div>
        <div>
          <h1 class="text-sm font-bold leading-tight text-white tracking-wide">NoSwitch</h1>
          <p class="text-[11px] text-ink-500">Study Dashboard</p>
        </div>
      </div>

      <!-- Center: Layout Mode Presets -->
      <div class="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-ink-800/80 p-1 shadow-inner">
        <button
          v-for="p in presets"
          :key="p.id"
          class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-150 cursor-pointer"
          :class="currentPreset === p.id && !isZenMode
            ? 'bg-accent/20 text-white border border-accent/40 shadow-sm'
            : 'text-ink-400 hover:text-white hover:bg-white/[0.05] border border-transparent'"
          :title="p.desc"
          @click="applyPreset(p.id)"
        >
          <span>{{ p.icon }}</span>
          <span>{{ p.label }}</span>
        </button>
      </div>

      <!-- Right: Zen Mode, Clock & Actions -->
      <div class="flex items-center gap-2">
        <!-- Zen / Deep Focus Mode Toggle -->
        <button
          id="btn-zen-mode"
          class="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer active:scale-95"
          :class="isZenMode
            ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse'
            : 'border-white/[0.08] bg-white/[0.04] text-ink-300 hover:border-accent/40 hover:bg-white/[0.08] hover:text-white'"
          :title="isZenMode ? 'ออกจาก Zen Mode' : 'เปิด Zen Mode (โหมดอ่านหนังสือเต็มสมาธิ)'"
          @click="toggleZenMode"
        >
          <span>{{ isZenMode ? '✨' : '🧘' }}</span>
          <span class="hidden sm:inline font-semibold">{{ isZenMode ? 'Zen Mode (ON)' : 'Zen Mode' }}</span>
        </button>

        <!-- Widget Toggle Dropdown (เฉพาะโหมดปกติ) -->
        <div v-if="!isZenMode" class="relative" ref="widgetMenuRef">
          <button
            class="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-ink-300 transition hover:border-accent/40 hover:bg-white/[0.08] hover:text-white cursor-pointer"
            title="เลือกเปิด/ปิดวิดเจ็ตรายตัว"
            @click="isWidgetMenuOpen = !isWidgetMenuOpen"
          >
            <span>🪟 Widgets</span>
            <span class="text-[10px] text-ink-500">({{ visibleCount }}/{{ widgets.length }})</span>
            <span class="text-[10px]">▾</span>
          </button>

          <!-- Dropdown Menu -->
          <div
            v-if="isWidgetMenuOpen"
            class="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-white/[0.1] bg-ink-900/95 p-1.5 shadow-2xl backdrop-blur-xl z-50 text-xs"
          >
            <div class="px-2.5 py-1 text-[10px] font-bold text-ink-500 uppercase tracking-wider">เปิด/ปิดวิดเจ็ต</div>
            <button
              v-for="w in widgets"
              :key="w.id"
              class="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-ink-300 transition hover:bg-white/[0.08] hover:text-white cursor-pointer"
              @click="toggleWidget(w.id)"
            >
              <span class="flex items-center gap-2">
                <span>{{ w.icon }}</span>
                <span>{{ w.title }}</span>
              </span>
              <span
                class="h-2 w-2 rounded-full"
                :class="w.visible ? 'bg-accent shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'bg-ink-700'"
              />
            </button>
          </div>
        </div>

        <!-- Reset Button -->
        <button
          v-if="!isZenMode"
          id="btn-reset-modular"
          class="rounded-xl border border-white/[0.08] bg-white/[0.04] p-1.5 text-ink-400 transition hover:border-accent/40 hover:bg-white/[0.08] hover:text-white cursor-pointer active:scale-95"
          title="รีเซ็ตกลับสู่เลย์เอาต์เริ่มต้น"
          @click="applyPreset('standard')"
        >
          <svg class="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <!-- Live Clock -->
        <div class="hidden xl:flex items-baseline gap-2 pl-2 text-xs border-l border-white/[0.08]">
          <span class="font-mono font-bold tabular-nums text-white">{{ clock }}</span>
        </div>
      </div>
    </header>

    <!-- ========================================== -->
    <!-- VIEW A: ZEN MODE (สะอาดตา จัด 2 คอลัมน์ลงตัวเป๊ะ) -->
    <!-- ========================================== -->
    <div v-if="isZenMode" class="flex flex-1 flex-col overflow-hidden bg-ink-950">
      <!-- Zen Banner -->
      <div class="flex items-center justify-between border-b border-emerald-500/20 bg-emerald-950/30 px-6 py-2 text-xs text-emerald-200 backdrop-blur-md">
        <div class="flex items-center gap-2">
          <span>🧘</span>
          <span><strong>Zen Focus Active:</strong> กำลังอ่านเอกสารแบบโฟกัสเต็มที่ พร้อมตัวช่วยจับเวลาและเสียงดนตรีคลอเบาๆ</span>
        </div>
        <button
          class="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200 hover:bg-emerald-500/20 hover:text-white transition cursor-pointer"
          @click="toggleZenMode"
        >
          ✕ ออกจาก Zen Mode
        </button>
      </div>

      <!-- Zen Two-Column Workspace (ฝั่งซ้าย: เอกสาร / ฝั่งขวา: Pomodoro + YouTube) -->
      <div class="flex flex-1 min-h-0 flex-col lg:flex-row gap-5 p-4 lg:p-6 overflow-hidden">
        <!-- ฝั่งซ้าย (กว้าง 68%): Document Reader เต็มตา ไร้สิ่งรบกวน -->
        <div class="flex flex-1 min-w-0 flex-col rounded-2xl border border-white/[0.08] bg-ink-900/80 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div class="flex h-10 items-center justify-between border-b border-white/[0.06] bg-ink-800/80 px-4 shrink-0">
            <span class="font-semibold text-xs text-white/95 flex items-center gap-2">
              <span>📄</span>
              <span>Document & PDF Focus Reader</span>
            </span>
            <span class="text-[11px] text-ink-500">อ่านเต็มหน้าต่าง</span>
          </div>
          <div class="flex-1 min-h-0 overflow-hidden">
            <DocumentReader class="h-full w-full" />
          </div>
        </div>

        <!-- ฝั่งขวา (กว้าง 32% หรือคงที่ 400px): Focus Sidecar (Pomodoro อยู่บน / YouTube อยู่ล่าง) -->
        <div class="flex w-full lg:w-[420px] shrink-0 flex-col gap-5 overflow-hidden">
          <!-- Pomodoro Timer Card -->
          <div class="flex flex-1 min-h-[300px] flex-col rounded-2xl border border-white/[0.08] bg-ink-900/80 backdrop-blur-xl shadow-xl overflow-hidden">
            <div class="flex h-10 items-center justify-between border-b border-white/[0.06] bg-ink-800/80 px-4 shrink-0">
              <span class="font-semibold text-xs text-white/95 flex items-center gap-2">
                <span>⏱️</span>
                <span>Pomodoro Focus Timer</span>
              </span>
              <span class="text-[11px] text-accent">รอบการอ่าน</span>
            </div>
            <div class="flex-1 min-h-0 overflow-hidden">
              <Timer class="h-full w-full !border-0 !rounded-none !bg-transparent" />
            </div>
          </div>

          <!-- YouTube Audio Player Card -->
          <div class="flex flex-1 min-h-[260px] flex-col rounded-2xl border border-white/[0.08] bg-ink-900/80 backdrop-blur-xl shadow-xl overflow-hidden">
            <div class="flex h-10 items-center justify-between border-b border-white/[0.06] bg-ink-800/80 px-4 shrink-0">
              <span class="font-semibold text-xs text-white/95 flex items-center gap-2">
                <span>🎧</span>
                <span>Background Study Audio</span>
              </span>
              <span class="text-[11px] text-ink-500">เสียงคลอ</span>
            </div>
            <div class="flex-1 min-h-0 overflow-hidden">
              <YoutubePlayer class="h-full w-full !border-0 !rounded-none !bg-transparent" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- VIEW B: MODULAR DASHBOARD (โหมดปกติ จัดตาม Grid 12) -->
    <!-- ========================================== -->
    <main v-else class="flex-1 p-4 lg:p-6 overflow-y-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-stretch">
        <div
          v-for="w in displayedWidgets"
          :key="w.id"
          class="modular-card relative flex flex-col rounded-2xl border border-white/[0.08] bg-ink-900/80 backdrop-blur-xl shadow-xl transition-all duration-200 overflow-hidden"
          :class="[
            getColSpanClass(w.colSpan),
            draggedId === w.id ? 'opacity-40 ring-2 ring-accent scale-[0.99]' : '',
            dragOverId === w.id ? 'ring-2 ring-accent/80 border-accent/60 shadow-[0_0_25px_rgba(168,85,247,0.3)]' : 'hover:border-white/[0.14]'
          ]"
          :style="{
            minHeight: w.minimized ? '42px' : `${w.height}px`,
            height: w.minimized ? '42px' : `${w.height}px`
          }"
          :draggable="true"
          @dragstart="onDragStart(w.id, $event)"
          @dragover.prevent="onDragOver(w.id)"
          @dragleave="onDragLeave(w.id)"
          @drop.prevent="onDrop(w.id)"
          @dragend="onDragEnd"
        >
          <!-- Modular Card Header -->
          <div
            class="flex h-[42px] items-center justify-between border-b border-white/[0.06] bg-ink-800/80 px-3.5 select-none shrink-0 cursor-grab active:cursor-grabbing"
            :title="`คลิกลากเพื่อสลับตำแหน่ง ${w.title}`"
          >
            <!-- Title & Drag Icon -->
            <div class="flex items-center gap-2 font-semibold text-white/95 text-xs truncate">
              <span class="text-ink-500 text-[11px] tracking-tighter">⋮⋮</span>
              <span>{{ w.icon }}</span>
              <span class="truncate">{{ w.title }}</span>
            </div>

            <!-- Card Controls -->
            <div class="flex items-center gap-1.5 shrink-0" @mousedown.stop>
              <!-- Width Indicator & Stepper (3, 4, 6, 8, 12) -->
              <div class="hidden xl:flex items-center rounded-lg border border-white/[0.06] bg-ink-900/70 px-1 py-0.5 text-[10px] text-ink-500">
                <button
                  class="hover:text-white px-1 cursor-pointer transition disabled:opacity-30"
                  :disabled="w.colSpan <= 3"
                  title="ลดความกว้าง"
                  @click="changeColSpan(w.id, -1)"
                >
                  −
                </button>
                <span class="px-1 text-ink-300 font-mono">{{ w.colSpan }}c</span>
                <button
                  class="hover:text-white px-1 cursor-pointer transition disabled:opacity-30"
                  :disabled="w.colSpan >= 12"
                  title="เพิ่มความกว้าง"
                  @click="changeColSpan(w.id, 1)"
                >
                  +
                </button>
              </div>

              <!-- Minimize / Collapse Button -->
              <button
                class="rounded-lg p-1 text-ink-400 hover:bg-white/[0.08] hover:text-white transition cursor-pointer text-xs"
                :title="w.minimized ? 'ขยายเนื้อหา' : 'ย่อเก็บการ์ด'"
                @click="toggleMinimize(w.id)"
              >
                {{ w.minimized ? '□' : '—' }}
              </button>

              <!-- Close / Hide Button -->
              <button
                class="rounded-lg p-1 text-ink-400 hover:bg-rose-500/15 hover:text-rose-400 transition cursor-pointer text-xs"
                :title="`ปิดซ่อน ${w.title}`"
                @click="closeWidget(w.id)"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- Modular Card Content Body -->
          <div
            v-show="!w.minimized"
            class="modular-body flex-1 min-h-0 overflow-hidden"
          >
            <!-- Dynamic Widget Component -->
            <component :is="getWidgetComponent(w.id)" class="h-full w-full !border-0 !rounded-none !bg-transparent" />
          </div>

          <!-- Bottom Right Resize Handle -->
          <div
            v-if="!w.minimized"
            class="absolute bottom-0 right-0 z-10 flex h-4 w-4 cursor-se-resize items-end justify-end p-0.5 text-ink-600 hover:text-accent transition"
            title="คลิกลากเพื่อปรับความสูง"
            @mousedown.prevent="startResize(w.id, $event)"
          >
            <svg class="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 22H20V20H22V22ZM22 16H20V18H22V16ZM16 22H18V20H16V22ZM22 12H20V14H22V12ZM12 22H14V20H12V22ZM16 18H18V16H16V18Z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Empty State if all widgets hidden -->
      <div
        v-if="!displayedWidgets.length"
        class="flex flex-col items-center justify-center gap-3 py-24 text-center"
      >
        <div class="text-4xl">🪟</div>
        <p class="font-medium text-white">คุณได้ซ่อนวิดเจ็ตทั้งหมดแล้ว</p>
        <p class="text-xs text-ink-500">คลิกปุ่มด้านล่างเพื่อเปิดเลย์เอาต์มาตรฐานกลับมา</p>
        <button
          class="btn btn-primary mt-2 text-xs"
          @click="applyPreset('standard')"
        >
          เปิดวิดเจ็ตทั้งหมด
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, type Component } from 'vue'

// Import All 6 Widgets
import YoutubePlayer from '~/components/YoutubeWidget.vue'
import DocumentReader from '~/components/DocumentReaderWidget.vue'
import AiChat from '~/components/AiChat.vue'
import Timer from '~/components/TimerWidget.vue'
import TodoList from '~/components/TodoWidget.vue'
import Calculator from '~/components/CalculatorWidget.vue'

export interface WidgetState {
  id: string
  title: string
  icon: string
  visible: boolean
  minimized: boolean
  order: number
  colSpan: number
  height: number
}

const STORAGE_KEY = 'noswitch:modular:widgets:v5'

const presets = [
  { id: 'standard', label: 'มาตรฐาน', icon: '⚡', desc: 'เลย์เอาต์สมดุล ครบทุกเครื่องมือ ไม่รกสายตา' },
  { id: 'reading', label: 'อ่านเอกสาร/PDF', icon: '📖', desc: 'เน้นเปิดชีทเรียนคู่กับแชทถาม AI' },
  { id: 'minimal', label: 'มินิมอล', icon: '🎧', desc: 'เฉพาะฟังเพลงและจับเวลา Pomodoro' },
]

const currentPreset = ref('standard')

const PRESET_LAYOUTS: Record<string, WidgetState[]> = {
  standard: [
    { id: 'youtube', title: 'YouTube Focus', icon: '📺', visible: true, minimized: false, order: 0, colSpan: 7, height: 440 },
    { id: 'ai', title: 'AI Study Assistant', icon: '🤖', visible: true, minimized: false, order: 1, colSpan: 5, height: 440 },
    { id: 'timer', title: 'Pomodoro Timer', icon: '⏱️', visible: true, minimized: false, order: 2, colSpan: 4, height: 380 },
    { id: 'todo', title: 'Study Schedule', icon: '📅', visible: true, minimized: false, order: 3, colSpan: 5, height: 380 },
    { id: 'calc', title: 'Calculator', icon: '🧮', visible: true, minimized: false, order: 4, colSpan: 3, height: 380 },
    { id: 'doc', title: 'Document & PDF', icon: '📄', visible: false, minimized: false, order: 5, colSpan: 7, height: 440 },
  ],
  reading: [
    { id: 'doc', title: 'Document & PDF Reader', icon: '📄', visible: true, minimized: false, order: 0, colSpan: 7, height: 500 },
    { id: 'ai', title: 'AI Study Assistant', icon: '🤖', visible: true, minimized: false, order: 1, colSpan: 5, height: 500 },
    { id: 'youtube', title: 'YouTube Focus', icon: '📺', visible: true, minimized: false, order: 2, colSpan: 6, height: 360 },
    { id: 'timer', title: 'Pomodoro Timer', icon: '⏱️', visible: true, minimized: false, order: 3, colSpan: 3, height: 360 },
    { id: 'todo', title: 'Study Schedule', icon: '📅', visible: true, minimized: false, order: 4, colSpan: 3, height: 360 },
    { id: 'calc', title: 'Calculator', icon: '🧮', visible: false, minimized: false, order: 5, colSpan: 3, height: 360 },
  ],
  minimal: [
    { id: 'timer', title: 'Pomodoro Timer', icon: '⏱️', visible: true, minimized: false, order: 0, colSpan: 6, height: 420 },
    { id: 'youtube', title: 'YouTube Focus', icon: '📺', visible: true, minimized: false, order: 1, colSpan: 6, height: 420 },
    { id: 'doc', title: 'Document & PDF', icon: '📄', visible: false, minimized: false, order: 2, colSpan: 7, height: 440 },
    { id: 'ai', title: 'AI Study Assistant', icon: '🤖', visible: false, minimized: false, order: 3, colSpan: 5, height: 440 },
    { id: 'todo', title: 'Study Schedule', icon: '📅', visible: false, minimized: false, order: 4, colSpan: 3, height: 380 },
    { id: 'calc', title: 'Calculator', icon: '🧮', visible: false, minimized: false, order: 5, colSpan: 3, height: 380 },
  ],
}

const widgets = ref<WidgetState[]>(JSON.parse(JSON.stringify(PRESET_LAYOUTS.standard!)))
const isZenMode = ref(false)
const isWidgetMenuOpen = ref(false)
const widgetMenuRef = ref<HTMLElement | null>(null)

// แมป Component ตาม id
const componentMap: Record<string, Component> = {
  doc: DocumentReader,
  youtube: YoutubePlayer,
  ai: AiChat,
  timer: Timer,
  todo: TodoList,
  calc: Calculator,
}

function getWidgetComponent(id: string) {
  return componentMap[id] || YoutubePlayer
}

const visibleCount = computed(() => widgets.value.filter((w) => w.visible).length)

function applyPreset(presetId: string) {
  currentPreset.value = presetId
  isZenMode.value = false
  const template = PRESET_LAYOUTS[presetId] || PRESET_LAYOUTS.standard!
  widgets.value = JSON.parse(JSON.stringify(template))
  saveToStorage()
}

function toggleZenMode() {
  isZenMode.value = !isZenMode.value
}

// วิดเจ็ตที่แสดงผลในโหมดปกติ
const displayedWidgets = computed(() => {
  return widgets.value
    .filter((w) => w.visible)
    .slice()
    .sort((a, b) => a.order - b.order)
})

function getColSpanClass(colSpan: number) {
  switch (colSpan) {
    case 3: return 'lg:col-span-3'
    case 4: return 'lg:col-span-4'
    case 5: return 'lg:col-span-5'
    case 6: return 'lg:col-span-6'
    case 7: return 'lg:col-span-7'
    case 8: return 'lg:col-span-8'
    case 9: return 'lg:col-span-9'
    case 12: return 'lg:col-span-12'
    default: return 'lg:col-span-6'
  }
}

const validCols = [3, 4, 5, 6, 7, 8, 9, 12]
function changeColSpan(id: string, delta: number) {
  const w = widgets.value.find((item) => item.id === id)
  if (!w) return
  const currentIndex = validCols.indexOf(w.colSpan)
  const targetIndex = currentIndex + delta
  if (targetIndex >= 0 && targetIndex < validCols.length) {
    w.colSpan = validCols[targetIndex]!
    saveToStorage()
  }
}

function toggleWidget(id: string) {
  const w = widgets.value.find((item) => item.id === id)
  if (w) {
    w.visible = !w.visible
    saveToStorage()
  }
}

function closeWidget(id: string) {
  const w = widgets.value.find((item) => item.id === id)
  if (w) {
    w.visible = false
    saveToStorage()
  }
}

function toggleMinimize(id: string) {
  const w = widgets.value.find((item) => item.id === id)
  if (w) {
    w.minimized = !w.minimized
    saveToStorage()
  }
}

// Drag & Drop
const isDragging = ref(false)
const draggedId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)

function onDragStart(id: string, event: DragEvent) {
  isDragging.value = true
  draggedId.value = id
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', id)
  }
}

function onDragOver(id: string) {
  if (draggedId.value && draggedId.value !== id) {
    dragOverId.value = id
  }
}

function onDragLeave(id: string) {
  if (dragOverId.value === id) {
    dragOverId.value = null
  }
}

function onDrop(targetId: string) {
  if (!draggedId.value || draggedId.value === targetId) return

  const sourceWidget = widgets.value.find((w) => w.id === draggedId.value)
  const targetWidget = widgets.value.find((w) => w.id === targetId)

  if (sourceWidget && targetWidget) {
    const tempOrder = sourceWidget.order
    sourceWidget.order = targetWidget.order
    targetWidget.order = tempOrder
    saveToStorage()
  }

  draggedId.value = null
  dragOverId.value = null
  isDragging.value = false
}

function onDragEnd() {
  draggedId.value = null
  dragOverId.value = null
  isDragging.value = false
}

// Resize Logic
const isResizing = ref(false)
let resizeWidgetId: string | null = null
let startY = 0
let startHeight = 0

function startResize(id: string, event: MouseEvent) {
  const w = widgets.value.find((item) => item.id === id)
  if (!w || w.minimized) return

  isResizing.value = true
  resizeWidgetId = id
  startY = event.clientY
  startHeight = w.height

  window.addEventListener('mousemove', onResizeMove)
  window.addEventListener('mouseup', onResizeEnd)
}

function onResizeMove(event: MouseEvent) {
  if (!isResizing.value || !resizeWidgetId) return
  const w = widgets.value.find((item) => item.id === resizeWidgetId)
  if (!w) return

  const deltaY = event.clientY - startY
  const newHeight = Math.max(280, Math.min(850, startHeight + deltaY))
  w.height = Math.round(newHeight)
}

function onResizeEnd() {
  if (!isResizing.value) return
  isResizing.value = false
  resizeWidgetId = null
  window.removeEventListener('mousemove', onResizeMove)
  window.removeEventListener('mouseup', onResizeEnd)
  saveToStorage()
}

// LocalStorage Synchronization
function saveToStorage() {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets.value))
    localStorage.setItem(`${STORAGE_KEY}:preset`, currentPreset.value)
  } catch {
    // ignore
  }
}

function loadFromStorage() {
  if (typeof localStorage === 'undefined') return
  try {
    const savedPreset = localStorage.getItem(`${STORAGE_KEY}:preset`)
    if (savedPreset && PRESET_LAYOUTS[savedPreset]) {
      currentPreset.value = savedPreset
    }

    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: WidgetState[] = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) {
        widgets.value = PRESET_LAYOUTS[currentPreset.value]!.map((def) => {
          const found = parsed.find((p) => p.id === def.id)
          return found ? { ...def, ...found } : def
        }).sort((a, b) => a.order - b.order)
        return
      }
    }
  } catch {
    // fallback
  }
  applyPreset('standard')
}

// Header Clock Logic
const clock = ref('')
let timerInterval: ReturnType<typeof setInterval> | undefined

function updateClock() {
  const now = new Date()
  clock.value = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

function handleDocumentClick(e: MouseEvent) {
  if (widgetMenuRef.value && !widgetMenuRef.value.contains(e.target as Node)) {
    isWidgetMenuOpen.value = false
  }
}

onMounted(() => {
  updateClock()
  timerInterval = setInterval(updateClock, 1000)
  window.addEventListener('click', handleDocumentClick)
  loadFromStorage()
})

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval)
  window.removeEventListener('click', handleDocumentClick)
  window.removeEventListener('mousemove', onResizeMove)
  window.removeEventListener('mouseup', onResizeEnd)
})
</script>

<style scoped>
.modular-card {
  transition: box-shadow 0.2s ease, border-color 0.2s ease, opacity 0.2s ease, transform 0.15s ease;
}

:deep(.widget) {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
  height: 100% !important;
}

:deep(.widget > .widget-header:not(.border-b)) {
  display: none !important;
}

:deep(.widget-body) {
  padding: 1rem !important;
  height: 100% !important;
}
</style>

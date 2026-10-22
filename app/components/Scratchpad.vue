<template>
  <div
    class="widget flex flex-col h-full w-full select-none transition-colors duration-300"
    :class="selectedTheme.cardBg"
    aria-labelledby="scratchpad-title"
  >
    <!-- WIDGET HEADER -->
    <div class="widget-header border-b border-white/[0.06] pb-2.5 shrink-0">
      <div class="flex items-center gap-2">
        <span class="text-base">📝</span>
        <h2 id="scratchpad-title" class="text-xs font-semibold text-white tracking-wide">
          Quick Scratchpad
        </h2>
        <!-- Mode Switcher Pill -->
        <div class="inline-flex rounded-lg bg-ink-950/60 p-0.5 text-[10px] border border-white/[0.06]">
          <button
            type="button"
            class="rounded px-2 py-0.5 font-medium transition cursor-pointer"
            :class="activeMode === 'text' ? 'bg-accent/25 text-white font-semibold' : 'text-ink-400 hover:text-white'"
            @click="activeMode = 'text'"
          >
            ✍️ Text
          </button>
          <button
            type="button"
            class="rounded px-2 py-0.5 font-medium transition cursor-pointer"
            :class="activeMode === 'canvas' ? 'bg-accent/25 text-white font-semibold' : 'text-ink-400 hover:text-white'"
            @click="activeMode = 'canvas'"
          >
            🎨 Drawing
          </button>
        </div>
      </div>

      <!-- Controls: Note Color + Actions -->
      <div class="flex items-center gap-1.5">
        <!-- Color Palette Picker -->
        <div class="relative" ref="paletteDropdownRef">
          <button
            type="button"
            class="grid h-6 w-6 place-items-center rounded-lg border border-white/[0.1] transition hover:scale-110 cursor-pointer shadow-sm"
            :class="selectedTheme.dotClass"
            title="เปลี่ยนสีกระดาษโน้ต"
            @click="isPaletteOpen = !isPaletteOpen"
          >
            <span class="text-[10px]">🎨</span>
          </button>

          <!-- Dropdown palette -->
          <div
            v-if="isPaletteOpen"
            class="absolute right-0 top-full mt-1.5 w-36 rounded-xl border border-white/[0.1] bg-ink-900/95 p-1.5 shadow-2xl backdrop-blur-xl z-50 flex flex-col gap-1"
          >
            <button
              v-for="color in NOTE_COLORS"
              :key="color.id"
              type="button"
              class="flex items-center gap-2 rounded-lg px-2 py-1 text-left text-xs text-ink-300 transition hover:bg-white/[0.08] hover:text-white cursor-pointer"
              :class="selectedColorId === color.id ? 'bg-white/[0.1] font-semibold text-white' : ''"
              @click="selectColor(color.id)"
            >
              <span class="h-3 w-3 rounded-full border border-white/20" :class="color.dotClass" />
              <span class="text-[11px]">{{ color.name }}</span>
            </button>
          </div>
        </div>

        <!-- Copy / Download Button -->
        <button
          v-if="activeMode === 'text'"
          type="button"
          class="rounded-lg border border-white/[0.08] bg-white/[0.04] p-1.5 text-xs text-ink-400 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
          :title="copyFeedback ? 'คัดลอกแล้ว!' : 'คัดลอกข้อความทั้งหมด'"
          @click="copyText"
        >
          <span>{{ copyFeedback ? '✓' : '📋' }}</span>
        </button>
        <button
          v-else
          type="button"
          class="rounded-lg border border-white/[0.08] bg-white/[0.04] p-1.5 text-xs text-ink-400 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
          title="ดาวน์โหลดลายเส้นเป็นรูปภาพ PNG"
          @click="downloadDrawing"
        >
          <span>💾</span>
        </button>

        <!-- Clear Button -->
        <button
          type="button"
          class="rounded-lg border border-white/[0.08] bg-white/[0.04] p-1.5 text-xs text-ink-400 hover:bg-rose-500/20 hover:text-rose-300 transition cursor-pointer"
          :title="activeMode === 'text' ? 'ล้างข้อความ' : 'ล้างกระดานวาด'"
          @click="handleClear"
        >
          <span>🗑️</span>
        </button>
      </div>
    </div>

    <!-- WIDGET BODY -->
    <div class="widget-body flex flex-1 flex-col p-3 overflow-hidden">
      <!-- 1. TEXT / MARKDOWN MODE -->
      <div v-show="activeMode === 'text'" class="flex flex-1 flex-col min-h-0 gap-2">
        <textarea
          ref="textareaRef"
          v-model="textContent"
          class="flex-1 w-full resize-none rounded-xl border border-white/[0.06] bg-black/20 p-3 text-xs leading-relaxed outline-none transition focus:border-accent/50 focus:ring-1 focus:ring-accent/20 placeholder:text-ink-600 font-sans"
          :class="selectedTheme.textColor"
          placeholder="จดสูตรคำนวณ คำศัพท์ ด่วน หรือ To-do สั้นๆ ที่นี่... (บันทึกอัตโนมัติ)"
          @input="saveTextDebounced"
        />
        <!-- Text Footer Stats -->
        <div class="flex items-center justify-between text-[10px] text-ink-500 px-1 shrink-0">
          <span>{{ charCount }} ตัวอักษร • {{ wordCount }} คำ</span>
          <span class="text-emerald-400/80">💾 Auto-saved</span>
        </div>
      </div>

      <!-- 2. DRAWING CANVAS MODE -->
      <div v-show="activeMode === 'canvas'" class="flex flex-1 flex-col min-h-0 gap-2">
        <!-- Canvas Toolbar -->
        <div class="flex items-center justify-between gap-1.5 rounded-lg border border-white/[0.06] bg-black/20 px-2 py-1 shrink-0">
          <!-- Color Palette -->
          <div class="flex items-center gap-1">
            <button
              v-for="c in PEN_COLORS"
              :key="c"
              type="button"
              class="h-4 w-4 rounded-full border transition hover:scale-125 cursor-pointer"
              :style="{ backgroundColor: c }"
              :class="brushColor === c && !isEraser ? 'ring-2 ring-white scale-110' : 'border-white/20 opacity-75'"
              @click="setPenColor(c)"
            />
          </div>

          <!-- Brush Size + Eraser -->
          <div class="flex items-center gap-1.5">
            <!-- Brush size stepper -->
            <button
              v-for="s in [2, 4, 8]"
              :key="s"
              type="button"
              class="grid h-5 w-5 place-items-center rounded border border-white/[0.08] text-[9px] font-mono transition cursor-pointer"
              :class="brushSize === s && !isEraser ? 'bg-accent/30 text-white border-accent' : 'text-ink-400 hover:text-white'"
              @click="setBrushSize(s)"
            >
              {{ s }}
            </button>

            <!-- Eraser toggle -->
            <button
              type="button"
              class="rounded px-2 py-0.5 text-[10px] border transition cursor-pointer"
              :class="isEraser ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'border-white/[0.08] text-ink-400 hover:text-white'"
              @click="toggleEraser"
            >
              🧹 ยางลบ
            </button>

            <!-- Undo -->
            <button
              type="button"
              class="rounded px-1.5 py-0.5 text-[10px] border border-white/[0.08] text-ink-400 hover:text-white transition cursor-pointer disabled:opacity-30"
              :disabled="historyIndex <= 0"
              title="เลิกทำ (Undo)"
              @click="undoCanvas"
            >
              ↩
            </button>
          </div>
        </div>

        <!-- Canvas Viewport -->
        <div ref="canvasWrapperRef" class="relative flex-1 min-h-[140px] w-full rounded-xl border border-white/[0.06] bg-black/30 overflow-hidden cursor-crosshair">
          <canvas
            ref="drawingCanvasRef"
            class="absolute inset-0 h-full w-full touch-none"
            @pointerdown="startDrawing"
            @pointermove="draw"
            @pointerup="stopDrawing"
            @pointerleave="stopDrawing"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useScratchpad } from '~/composables/useScratchpad'

const STORAGE_TEXT_KEY = 'noswitch:scratchpad:text:v2'
const STORAGE_CANVAS_KEY = 'noswitch:scratchpad:canvas:v2'
const STORAGE_COLOR_KEY = 'noswitch:scratchpad:color:v2'
const STORAGE_MODE_KEY = 'noswitch:scratchpad:mode:v2'

const { scratchpadText, setScratchpadText } = useScratchpad()

// Note Color Themes
const NOTE_COLORS = [
  { id: 'slate', name: 'Dark Slate', cardBg: 'bg-ink-900/80 border-white/[0.08]', dotClass: 'bg-slate-700', textColor: 'text-ink-200' },
  { id: 'yellow', name: 'Post-it Yellow', cardBg: 'bg-amber-950/40 border-amber-500/30', dotClass: 'bg-amber-400', textColor: 'text-amber-100' },
  { id: 'purple', name: 'Pastel Purple', cardBg: 'bg-purple-950/40 border-purple-500/30', dotClass: 'bg-purple-400', textColor: 'text-purple-100' },
  { id: 'green', name: 'Mint Green', cardBg: 'bg-emerald-950/40 border-emerald-500/30', dotClass: 'bg-emerald-400', textColor: 'text-emerald-100' },
  { id: 'blue', name: 'Cyber Blue', cardBg: 'bg-sky-950/40 border-sky-500/30', dotClass: 'bg-sky-400', textColor: 'text-sky-100' },
]

const PEN_COLORS = ['#ffffff', '#fde047', '#4ade80', '#38bdf8', '#f87171']

const activeMode = ref<'text' | 'canvas'>('text')
const selectedColorId = ref('slate')
const isPaletteOpen = ref(false)
const paletteDropdownRef = ref<HTMLElement | null>(null)

// Text Mode
const textContent = ref('')
const copyFeedback = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

let saveTimeout: ReturnType<typeof setTimeout> | null = null

// Canvas Mode
const drawingCanvasRef = ref<HTMLCanvasElement | null>(null)
const canvasWrapperRef = ref<HTMLElement | null>(null)
const brushColor = ref('#ffffff')
const brushSize = ref(2)
const isEraser = ref(false)
const isDrawing = ref(false)
let ctx: CanvasRenderingContext2D | null = null
let lastX = 0
let lastY = 0

// Canvas Undo History
const historyStack = ref<string[]>([])
const historyIndex = ref(-1)

const selectedTheme = computed(() => {
  return NOTE_COLORS.find(c => c.id === selectedColorId.value) || NOTE_COLORS[0]!
})

const charCount = computed(() => textContent.value.length)
const wordCount = computed(() => {
  const trimmed = textContent.value.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
})

function selectColor(colorId: string) {
  selectedColorId.value = colorId
  isPaletteOpen.value = false
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_COLOR_KEY, colorId)
  }
}

function saveTextDebounced() {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    setScratchpadText(textContent.value)
  }, 400)
}

async function copyText() {
  if (!textContent.value) return
  try {
    await navigator.clipboard.writeText(textContent.value)
    copyFeedback.value = true
    setTimeout(() => { copyFeedback.value = false }, 1800)
  } catch {
    // fallback
  }
}

// ==========================================
// DRAWING CANVAS LOGIC
// ==========================================
function initCanvas() {
  const canvas = drawingCanvasRef.value
  const wrapper = canvasWrapperRef.value
  if (!canvas || !wrapper) return

  const rect = wrapper.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return

  // Preserve existing canvas drawing if resizing
  const prevData = canvas.toDataURL()

  canvas.width = rect.width
  canvas.height = rect.height

  ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Restore saved drawing if available
  const savedCanvas = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_CANVAS_KEY) : null
  const dataToLoad = savedCanvas || (prevData.length > 30 ? prevData : null)

  if (dataToLoad) {
    const img = new Image()
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
      if (historyStack.value.length === 0) {
        saveCanvasState()
      }
    }
    img.src = dataToLoad
  } else if (historyStack.value.length === 0) {
    saveCanvasState()
  }
}

function setPenColor(color: string) {
  brushColor.value = color
  isEraser.value = false
}

function setBrushSize(size: number) {
  brushSize.value = size
}

function toggleEraser() {
  isEraser.value = !isEraser.value
}

function getCoords(e: PointerEvent): { x: number; y: number } {
  const canvas = drawingCanvasRef.value
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  }
}

function startDrawing(e: PointerEvent) {
  isDrawing.value = true
  const coords = getCoords(e)
  lastX = coords.x
  lastY = coords.y
}

function draw(e: PointerEvent) {
  if (!isDrawing.value || !ctx) return
  const coords = getCoords(e)

  ctx.beginPath()
  ctx.moveTo(lastX, lastY)
  ctx.lineTo(coords.x, coords.y)

  if (isEraser.value) {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.lineWidth = brushSize.value * 4
  } else {
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = brushColor.value
    ctx.lineWidth = brushSize.value
  }

  ctx.stroke()
  lastX = coords.x
  lastY = coords.y
}

function stopDrawing() {
  if (!isDrawing.value) return
  isDrawing.value = false
  saveCanvasState()
}

function saveCanvasState() {
  const canvas = drawingCanvasRef.value
  if (!canvas) return
  const data = canvas.toDataURL()

  // Save to undo stack
  if (historyIndex.value < historyStack.value.length - 1) {
    historyStack.value = historyStack.value.slice(0, historyIndex.value + 1)
  }
  historyStack.value.push(data)
  historyIndex.value++

  // Limit undo stack to 20 states
  if (historyStack.value.length > 20) {
    historyStack.value.shift()
    historyIndex.value--
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_CANVAS_KEY, data)
  }
}

function undoCanvas() {
  if (historyIndex.value <= 0 || !ctx || !drawingCanvasRef.value) return
  historyIndex.value--
  const state = historyStack.value[historyIndex.value]
  if (!state) return

  const img = new Image()
  img.onload = () => {
    if (!ctx || !drawingCanvasRef.value) return
    ctx.clearRect(0, 0, drawingCanvasRef.value.width, drawingCanvasRef.value.height)
    ctx.drawImage(img, 0, 0)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_CANVAS_KEY, state)
    }
  }
  img.src = state
}

function downloadDrawing() {
  const canvas = drawingCanvasRef.value
  if (!canvas) return
  const a = document.createElement('a')
  a.download = `scratchpad-note-${Date.now()}.png`
  a.href = canvas.toDataURL('image/png')
  a.click()
}

function handleClear() {
  if (activeMode.value === 'text') {
    if (confirm('คุณต้องการล้างข้อความทั้งหมดใช่หรือไม่?')) {
      textContent.value = ''
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_TEXT_KEY)
      }
    }
  } else {
    if (confirm('คุณต้องการล้างกระดานวาดทั้งหมดใช่หรือไม่?')) {
      const canvas = drawingCanvasRef.value
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        saveCanvasState()
      }
    }
  }
}

function handleClickOutside(e: MouseEvent) {
  if (paletteDropdownRef.value && !paletteDropdownRef.value.contains(e.target as Node)) {
    isPaletteOpen.value = false
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (typeof localStorage !== 'undefined') {
    textContent.value = localStorage.getItem(STORAGE_TEXT_KEY) || ''
    selectedColorId.value = localStorage.getItem(STORAGE_COLOR_KEY) || 'slate'
    activeMode.value = (localStorage.getItem(STORAGE_MODE_KEY) as 'text' | 'canvas') || 'text'
  }

  nextTick(() => {
    initCanvas()
  })

  // Watch for container resizes
  if (canvasWrapperRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      initCanvas()
    })
    resizeObserver.observe(canvasWrapperRef.value)
  }

  window.addEventListener('click', handleClickOutside)
  window.addEventListener('noswitch:scratchpad:updated', onExternalUpdate)
})

function onExternalUpdate(e: Event) {
  const detail = (e as CustomEvent<string>).detail
  if (typeof detail === 'string') {
    textContent.value = detail
    activeMode.value = 'text'
    nextTick(() => {
      if (textareaRef.value) {
        textareaRef.value.scrollTop = textareaRef.value.scrollHeight
      }
    })
  }
}

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect()
  window.removeEventListener('click', handleClickOutside)
  window.removeEventListener('noswitch:scratchpad:updated', onExternalUpdate)
})
</script>

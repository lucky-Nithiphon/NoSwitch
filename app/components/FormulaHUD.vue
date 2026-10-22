<template>
  <div
    class="widget flex flex-col h-full w-full select-none transition-opacity duration-200"
    :style="{ opacity: isFloating ? opacity / 100 : 1 }"
    aria-labelledby="hud-title"
  >
    <!-- WIDGET HEADER -->
    <div class="widget-header border-b border-white/[0.06] pb-2.5 shrink-0">
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-base shrink-0">📐</span>
        <div class="truncate">
          <h2 id="hud-title" class="text-xs font-semibold text-white tracking-wide truncate">
            Formula & Cheat Sheet HUD
          </h2>
        </div>
      </div>

      <!-- Controls: Opacity Slider, Quick Peek, Pin Mode -->
      <div class="flex items-center gap-1.5 shrink-0">
        <!-- Opacity Slider Pill -->
        <div class="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-ink-800/80 px-2 py-0.5 text-[10px] text-ink-300">
          <span class="text-ink-400">โปร่งใส:</span>
          <input
            v-model.number="opacity"
            type="range"
            min="20"
            max="100"
            step="5"
            class="w-14 accent-accent cursor-pointer h-1 bg-ink-700 rounded-lg"
            :title="`ความโปร่งใส: ${opacity}%`"
          />
          <span class="font-mono text-white text-[9px] w-6 text-right">{{ opacity }}%</span>
        </div>

        <!-- Quick Peek Button (แอบมองชั่วคราว) -->
        <button
          type="button"
          class="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-xs text-ink-300 hover:border-accent/40 hover:bg-white/[0.08] hover:text-white transition cursor-pointer flex items-center gap-1"
          title="Quick Peek (กด F2 หรือคลิกเพื่อแอบดูเต็มจอ)"
          @click="togglePeek"
        >
          <span>👁️</span>
          <span class="hidden sm:inline text-[10px]">Peek</span>
        </button>

        <!-- Pin to Top Floating Mode Toggle -->
        <button
          type="button"
          class="rounded-lg border p-1 text-xs transition cursor-pointer"
          :class="isFloating ? 'border-accent bg-accent/20 text-accent font-bold shadow-sm' : 'border-white/[0.08] bg-white/[0.04] text-ink-400 hover:text-white'"
          :title="isFloating ? 'ปลดหมุดกลับสู่ Grid ปกติ' : 'ปักหมุดลอยค้างหน้าจอ (Pin to Top)'"
          @click="isFloating = !isFloating"
        >
          <span>📌</span>
        </button>
      </div>
    </div>

    <!-- WIDGET BODY -->
    <div
      class="widget-body flex flex-1 flex-col p-3 overflow-hidden gap-2"
      @paste="handlePaste"
    >
      <!-- Sub-toolbar: Switch between Image / Text, Zoom controls, Clear -->
      <div class="flex items-center justify-between gap-1 text-[11px] shrink-0">
        <div class="inline-flex rounded-lg bg-ink-950/60 p-0.5 text-[10px] border border-white/[0.06]">
          <button
            type="button"
            class="rounded px-2 py-0.5 font-medium transition cursor-pointer"
            :class="contentType === 'image' ? 'bg-accent/25 text-white font-semibold' : 'text-ink-400 hover:text-white'"
            @click="contentType = 'image'"
          >
            🖼️ รูปสูตร
          </button>
          <button
            type="button"
            class="rounded px-2 py-0.5 font-medium transition cursor-pointer"
            :class="contentType === 'text' ? 'bg-accent/25 text-white font-semibold' : 'text-ink-400 hover:text-white'"
            @click="contentType = 'text'"
          >
            📝 ข้อความย่อ
          </button>
        </div>

        <!-- Zoom Controls (for image) -->
        <div v-if="contentType === 'image' && imageUrl" class="flex items-center gap-1">
          <button
            type="button"
            class="h-5 w-5 rounded bg-white/[0.04] border border-white/[0.08] text-ink-300 hover:text-white transition grid place-items-center cursor-pointer text-xs"
            title="ย่อขนาด"
            @click="zoom = Math.max(0.5, zoom - 0.2)"
          >
            −
          </button>
          <span class="font-mono text-[10px] text-ink-400 px-1">{{ Math.round(zoom * 100) }}%</span>
          <button
            type="button"
            class="h-5 w-5 rounded bg-white/[0.04] border border-white/[0.08] text-ink-300 hover:text-white transition grid place-items-center cursor-pointer text-xs"
            title="ขยายขนาด"
            @click="zoom = Math.min(3, zoom + 0.2)"
          >
            +
          </button>
          <button
            type="button"
            class="rounded bg-white/[0.04] border border-white/[0.08] px-1.5 py-0.5 text-[9px] text-ink-400 hover:text-white cursor-pointer ml-1"
            title="รีเซ็ตขนาดภาพ"
            @click="zoom = 1"
          >
            1:1
          </button>
          <button
            type="button"
            class="rounded bg-white/[0.04] border border-white/[0.08] px-1.5 py-0.5 text-[9px] text-rose-400 hover:bg-rose-500/20 cursor-pointer ml-1"
            title="ลบรูปภาพสูตร"
            @click="clearImage"
          >
            ลบ
          </button>
        </div>
      </div>

      <!-- 1. IMAGE CHEAT SHEET VIEW -->
      <div
        v-if="contentType === 'image'"
        class="relative flex-1 min-h-[140px] w-full rounded-xl border border-white/[0.06] bg-black/40 overflow-hidden flex items-center justify-center"
      >
        <!-- Displayed Image -->
        <div
          v-if="imageUrl"
          class="h-full w-full overflow-auto scroll-thin flex items-center justify-center p-2"
        >
          <img
            :src="imageUrl"
            alt="Formula Cheat Sheet"
            class="transition-transform duration-150 origin-center max-w-none rounded shadow-lg object-contain"
            :style="{ transform: `scale(${zoom})` }"
          />
        </div>

        <!-- Empty State / Paste & Upload Dropzone -->
        <div
          v-else
          class="flex flex-col items-center justify-center gap-2 p-4 text-center text-ink-400"
        >
          <div class="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.04] text-2xl ring-1 ring-white/10">
            📋
          </div>
          <p class="text-xs font-semibold text-white">ยังไม่มีแผ่นสูตร</p>
          <p class="text-[11px] text-ink-500 max-w-xs">
            กด <strong class="text-accent">Ctrl + V</strong> เพื่อวางภาพจากคลิปบอร์ด หรือใส่ URL ด้านล่าง
          </p>

          <div class="flex items-center gap-1.5 w-full max-w-xs mt-1">
            <input
              v-model="imageUrlInput"
              type="url"
              placeholder="วางลิงก์รูปสูตร..."
              class="input text-[11px] py-1 px-2.5 flex-1"
              @keydown.enter="applyImageUrl"
            />
            <button
              type="button"
              class="btn btn-primary text-[11px] py-1 px-2.5 shrink-0"
              @click="applyImageUrl"
            >
              โหลด
            </button>
          </div>

          <!-- File upload fallback -->
          <label class="mt-1 inline-flex items-center gap-1 text-[10px] text-accent hover:underline cursor-pointer">
            <span>📁 หรือเลือกรูปจากเครื่อง</span>
            <input type="file" accept="image/*" class="hidden" @change="handleFileUpload" />
          </label>
        </div>
      </div>

      <!-- 2. TEXT FORMULA VIEW -->
      <div v-else class="flex flex-1 flex-col min-h-0">
        <textarea
          v-model="textContent"
          class="flex-1 w-full resize-none rounded-xl border border-white/[0.06] bg-black/30 p-3 text-xs leading-relaxed outline-none transition focus:border-accent/50 focus:ring-1 focus:ring-accent/20 placeholder:text-ink-600 font-mono text-white"
          placeholder="บันทึกสูตรสรุป เช่น:
• E = mc²
• F = ma
• sin²θ + cos²θ = 1
• กฎหมาย ม.420 ผู้ใดจงใจหรือประมาทเลินเล่อ..."
          @input="saveText"
        />
      </div>
    </div>

    <!-- QUICK PEEK FULLSCREEN MODAL (TELEPORT TO BODY) -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="isPeeking"
          class="fixed inset-0 z-[9990] flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          @click.self="isPeeking = false"
        >
          <div class="relative w-full max-w-4xl max-h-[85vh] rounded-3xl border border-accent/40 bg-ink-950/95 p-4 shadow-2xl flex flex-col overflow-hidden text-white">
            <div class="flex items-center justify-between pb-3 border-b border-white/[0.08] px-2">
              <div class="flex items-center gap-2">
                <span class="text-lg">👁️</span>
                <span class="font-bold text-sm">Quick Peek: แผ่นสูตรและตารางสรุป</span>
                <span class="text-[10px] text-ink-500 font-mono">(กด F2 หรือคลิกนอกกรอบเพื่อปิด)</span>
              </div>
              <button
                type="button"
                class="rounded-xl bg-white/[0.08] px-3 py-1 text-xs hover:bg-white/[0.15] cursor-pointer"
                @click="isPeeking = false"
              >
                ✕ ปิด
              </button>
            </div>

            <!-- Peek Content Area -->
            <div class="flex-1 min-h-0 overflow-auto p-4 flex items-center justify-center">
              <img
                v-if="contentType === 'image' && imageUrl"
                :src="imageUrl"
                alt="Formula Sheet Large"
                class="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
              />
              <pre
                v-else-if="textContent"
                class="w-full text-sm font-mono whitespace-pre-wrap leading-relaxed text-ink-100 bg-ink-900/60 p-4 rounded-xl border border-white/[0.06]"
              >{{ textContent }}</pre>
              <div v-else class="text-ink-500 text-sm">ยังไม่มีข้อมูลสูตรที่บันทึกไว้</div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- FLOATING PINNED HUD OVERLAY (IF PINNED TO TOP) -->
    <Teleport to="body">
      <div
        v-if="isFloating"
        class="fixed bottom-6 right-6 z-[8000] w-80 sm:w-96 rounded-2xl border border-accent/50 bg-ink-950/95 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col overflow-hidden transition-opacity"
        :style="{ opacity: opacity / 100, height: '360px' }"
      >
        <!-- Floating HUD Header -->
        <div class="flex items-center justify-between px-3 py-2 bg-ink-900/90 border-b border-white/[0.08]">
          <span class="text-xs font-semibold text-accent flex items-center gap-1.5">
            <span>📌</span> Formula HUD (Pinned)
          </span>
          <div class="flex items-center gap-1">
            <input
              v-model.number="opacity"
              type="range"
              min="20"
              max="100"
              class="w-14 accent-accent cursor-pointer h-1"
              :title="`Opacity: ${opacity}%`"
            />
            <button
              type="button"
              class="rounded p-1 text-xs text-ink-400 hover:text-white cursor-pointer ml-1"
              title="ปลดหมุดกลับสู่ Grid"
              @click="isFloating = false"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Floating HUD Content -->
        <div class="flex-1 min-h-0 overflow-auto p-2 flex items-center justify-center">
          <img
            v-if="contentType === 'image' && imageUrl"
            :src="imageUrl"
            alt="Pinned Formula"
            class="max-h-full max-w-full object-contain rounded"
          />
          <pre
            v-else
            class="text-xs font-mono whitespace-pre-wrap text-white p-2 w-full"
          >{{ textContent || 'ไม่มีเนื้อหาสูตร' }}</pre>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const STORAGE_IMAGE_KEY = 'noswitch:hud:image:v2'
const STORAGE_TEXT_KEY = 'noswitch:hud:text:v2'
const STORAGE_OPACITY_KEY = 'noswitch:hud:opacity:v2'
const STORAGE_TYPE_KEY = 'noswitch:hud:type:v2'
const STORAGE_FLOATING_KEY = 'noswitch:hud:floating:v2'

const contentType = ref<'image' | 'text'>('image')
const imageUrl = ref('')
const imageUrlInput = ref('')
const textContent = ref('')
const opacity = ref(90)
const zoom = ref(1)
const isPeeking = ref(false)
const isFloating = ref(false)

function applyImageUrl() {
  if (imageUrlInput.value.trim()) {
    imageUrl.value = imageUrlInput.value.trim()
    saveImage()
    imageUrlInput.value = ''
  }
}

function handleFileUpload(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    imageUrl.value = reader.result as string
    saveImage()
  }
  reader.readAsDataURL(file)
}

function handlePaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        const reader = new FileReader()
        reader.onload = () => {
          imageUrl.value = reader.result as string
          contentType.value = 'image'
          saveImage()
        }
        reader.readAsDataURL(file)
        e.preventDefault()
        return
      }
    }
  }
}

function clearImage() {
  if (confirm('คุณต้องการลบรูปภาพสูตรนี้ใช่หรือไม่?')) {
    imageUrl.value = ''
    zoom.value = 1
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_IMAGE_KEY)
    }
  }
}

function saveImage() {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_IMAGE_KEY, imageUrl.value)
    } catch {
      // Storage might exceed quota if image is huge
    }
  }
}

function saveText() {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_TEXT_KEY, textContent.value)
  }
}

function togglePeek() {
  isPeeking.value = !isPeeking.value
}

function handleKeyDown(e: KeyboardEvent) {
  // F2 toggle peek
  if (e.key === 'F2') {
    e.preventDefault()
    togglePeek()
  }
  // Escape close peek
  if (e.key === 'Escape' && isPeeking.value) {
    isPeeking.value = false
  }
}

onMounted(() => {
  if (typeof localStorage !== 'undefined') {
    imageUrl.value = localStorage.getItem(STORAGE_IMAGE_KEY) || ''
    textContent.value = localStorage.getItem(STORAGE_TEXT_KEY) || ''
    opacity.value = parseInt(localStorage.getItem(STORAGE_OPACITY_KEY) || '90', 10)
    contentType.value = (localStorage.getItem(STORAGE_TYPE_KEY) as 'image' | 'text') || 'image'
    isFloating.value = localStorage.getItem(STORAGE_FLOATING_KEY) === 'true'
  }

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('paste', handlePaste)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('paste', handlePaste)
})
</script>

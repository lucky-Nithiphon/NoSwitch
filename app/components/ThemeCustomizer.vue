<template>
  <div class="widget flex flex-col h-full w-full select-none" aria-labelledby="theme-customizer-title">
    <!-- WIDGET HEADER -->
    <div class="widget-header border-b border-white/[0.06] pb-3 px-1">
      <div class="flex items-center gap-2">
        <span class="text-base">🎨</span>
        <div>
          <h2 id="theme-customizer-title" class="text-xs font-semibold text-white tracking-wide">
            Aesthetic Themes & Workspace Atmosphere
          </h2>
          <p class="text-[10px] text-ink-500">ปรับแต่งบรรยากาศ โทนสี และความโปร่งใสของโต๊ะอ่านหนังสือ</p>
        </div>
      </div>
      <button
        type="button"
        class="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] text-ink-400 hover:text-white hover:bg-white/[0.08] transition cursor-pointer"
        title="รีเซ็ตธีมกลับเป็นค่าเริ่มต้น"
        @click="resetTheme"
      >
        ↺ รีเซ็ตค่าเดิม
      </button>
    </div>

    <!-- WIDGET BODY -->
    <div class="widget-body flex flex-1 flex-col gap-5 p-4 overflow-y-auto scroll-thin">
      <!-- 1. CURATED 1-CLICK MOOD PRESETS -->
      <div class="space-y-2.5">
        <div class="flex items-center justify-between text-xs">
          <span class="font-medium text-white flex items-center gap-1.5">
            <span>✨</span> อารมณ์ห้องอ่านสำเร็จรูป (Curated Moods)
          </span>
          <span class="text-[10px] text-accent font-medium">1-Click Vibe</span>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="mood in MOOD_PRESETS"
            :key="mood.id"
            type="button"
            class="group relative flex flex-col justify-between rounded-xl border p-2.5 text-left transition cursor-pointer overflow-hidden"
            :class="theme.wallpaperId === mood.wallpaperId && theme.accentId === mood.accentId && !theme.customWallpaperUrl
              ? 'border-accent bg-accent/15 ring-2 ring-accent/40 shadow-lg'
              : 'border-white/[0.06] bg-ink-800/40 hover:border-white/20 hover:bg-white/[0.04]'"
            @click="applyMood(mood.id)"
          >
            <div class="flex items-center justify-between">
              <span class="text-xl">{{ mood.icon }}</span>
              <span
                v-if="theme.wallpaperId === mood.wallpaperId && theme.accentId === mood.accentId && !theme.customWallpaperUrl"
                class="rounded-full bg-accent px-1.5 py-0.5 text-[8px] font-bold text-white shadow"
              >
                กำลังใช้
              </span>
            </div>
            <div class="mt-2">
              <p class="text-xs font-semibold text-white group-hover:text-accent transition-colors">{{ mood.name }}</p>
              <p class="text-[10px] text-ink-400 line-clamp-2 mt-0.5 leading-relaxed">{{ mood.desc }}</p>
            </div>
          </button>
        </div>
      </div>

      <!-- 2. CARD GLASS OPACITY SLIDER -->
      <div class="rounded-xl border border-white/[0.06] bg-ink-800/40 p-3 space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="font-medium text-white flex items-center gap-1.5">
            <span>🪟</span> ความโปร่งใสของกล่องการ์ด (Card Glass Opacity)
          </span>
          <span class="font-mono text-xs font-bold text-accent">{{ theme.cardOpacity }}%</span>
        </div>
        <p class="text-[10px] text-ink-400">
          ปรับความทึบ-ใสของกระจกการ์ด (30-60% โปร่งแสงเห็นวอลเปเปอร์ชัด / 80-95% ทึบแสงอ่านสบายตา)
        </p>
        <div class="flex items-center gap-3 pt-1">
          <span class="text-[11px] text-ink-500">โปร่งใส</span>
          <input
            v-model.number="theme.cardOpacity"
            type="range"
            min="30"
            max="100"
            step="5"
            class="w-full accent-accent cursor-pointer h-1.5 bg-ink-700 rounded-lg appearance-none"
          />
          <span class="text-[11px] text-ink-500">ทึบแสง</span>
        </div>
      </div>

      <!-- 3. ACCENT COLOR PICKER -->
      <div class="space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="font-medium text-white flex items-center gap-1.5">
            <span>🎯</span> สีไฮไลต์ (Accent Color)
          </span>
          <span class="text-[11px] font-mono text-accent">{{ activeAccent.name }}</span>
        </div>

        <div class="grid grid-cols-4 sm:grid-cols-4 gap-2">
          <button
            v-for="color in ACCENT_PRESETS"
            :key="color.id"
            type="button"
            class="group relative flex flex-col items-center gap-1.5 rounded-xl border p-2 text-center transition cursor-pointer"
            :class="theme.accentId === color.id
              ? 'border-accent bg-accent/20 ring-2 ring-accent/30 shadow-md'
              : 'border-white/[0.06] bg-ink-800/40 hover:bg-white/[0.04] hover:border-white/20'"
            @click="setAccent(color.id)"
          >
            <span
              class="h-6 w-6 rounded-full shadow-inner transition group-hover:scale-110 flex items-center justify-center ring-1 ring-white/10"
              :style="{ backgroundColor: color.hex }"
            >
              <span v-if="theme.accentId === color.id" class="text-[10px] text-white font-bold drop-shadow">✓</span>
            </span>
            <span class="text-[10px] text-ink-300 font-medium truncate w-full">{{ color.name }}</span>
          </button>
        </div>
      </div>

      <!-- 4. DYNAMIC BACKGROUND PRESETS -->
      <div class="space-y-2.5">
        <div class="flex items-center justify-between text-xs">
          <span class="font-medium text-white flex items-center gap-1.5">
            <span>🖼️</span> วอลเปเปอร์บรรยากาศ (Ambient Wallpaper)
          </span>
          <span class="text-[10px] text-ink-500 truncate max-w-[140px]">{{ activeWallpaper.name }}</span>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="wp in WALLPAPER_PRESETS"
            :key="wp.id"
            type="button"
            class="group relative flex flex-col justify-between rounded-xl border p-2.5 text-left transition overflow-hidden cursor-pointer min-h-[75px]"
            :class="theme.wallpaperId === wp.id && !theme.customWallpaperUrl
              ? 'border-accent bg-accent/10 ring-2 ring-accent/40 shadow-lg'
              : 'border-white/[0.06] bg-ink-800/40 hover:border-white/20 hover:bg-white/[0.03]'"
            @click="setWallpaper(wp.id)"
          >
            <!-- Thumbnail background -->
            <div
              v-if="wp.url"
              class="absolute inset-0 opacity-25 group-hover:opacity-40 transition bg-cover bg-center pointer-events-none"
              :style="{ backgroundImage: `url(${wp.url})` }"
            />
            <div class="relative z-10 flex items-center justify-between">
              <span class="text-lg">{{ wp.icon }}</span>
              <span
                v-if="theme.wallpaperId === wp.id && !theme.customWallpaperUrl"
                class="rounded-full bg-accent/90 px-1.5 py-0.2 text-[9px] font-bold text-white shadow-sm"
              >
                เลือกอยู่
              </span>
            </div>
            <div class="relative z-10 mt-2">
              <p class="text-xs font-semibold text-white">{{ wp.name }}</p>
              <p class="text-[10px] text-ink-400 line-clamp-1 mt-0.5">{{ wp.desc }}</p>
            </div>
          </button>
        </div>

        <!-- Custom Wallpaper Options (File Upload & URL) -->
        <div class="rounded-xl border border-white/[0.06] bg-ink-800/30 p-3 space-y-2.5">
          <div class="flex items-center justify-between text-xs">
            <span class="font-medium text-white flex items-center gap-1.5">
              <span>📁</span> ใส่วอลเปเปอร์ส่วนตัว
            </span>
            <button
              v-if="theme.customWallpaperUrl"
              type="button"
              class="text-[11px] text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
              @click="setCustomWallpaper('')"
            >
              ลบรูปกำหนดเอง
            </button>
          </div>

          <!-- Upload Local Image Button -->
          <div class="flex items-center gap-2">
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleFileUpload"
            />
            <button
              type="button"
              class="btn bg-white/[0.06] hover:bg-white/[0.1] text-ink-200 border border-white/[0.1] text-xs py-1.5 px-3 flex-1 flex items-center justify-center gap-1.5 cursor-pointer"
              @click="triggerFileInput"
            >
              <span>📤</span>
              <span>อัปโหลดรูปจากเครื่องของคุณ</span>
            </button>
          </div>

          <!-- URL Input fallback -->
          <div class="flex gap-2">
            <input
              v-model="customUrlInput"
              type="url"
              placeholder="หรือวางลิงก์รูป https://..."
              class="input text-xs py-1.5 px-3 flex-1"
              @keydown.enter="applyCustomUrl"
            />
            <button
              type="button"
              class="btn btn-primary text-xs py-1.5 px-3 shrink-0 cursor-pointer"
              @click="applyCustomUrl"
            >
              ใช้รูป
            </button>
          </div>

          <p v-if="uploadError" class="text-[11px] text-rose-400">{{ uploadError }}</p>
        </div>
      </div>

      <!-- 5. BACKGROUND DIMMER SLIDER -->
      <div class="rounded-xl border border-white/[0.06] bg-ink-800/40 p-3 space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="font-medium text-white flex items-center gap-1.5">
            <span>🔆</span> ความมืดของพื้นหลัง (Dimmer Overlay)
          </span>
          <span class="font-mono text-xs font-bold text-accent">{{ theme.dimmer }}%</span>
        </div>
        <p class="text-[10px] text-ink-400">
          ปรับความเข้มเพื่อให้สายตาไม่ล้า และอ่านตัวหนังสือบนการ์ดได้คมชัด
        </p>
        <div class="flex items-center gap-3 pt-1">
          <span class="text-[11px] text-ink-500">สว่าง</span>
          <input
            v-model.number="theme.dimmer"
            type="range"
            min="0"
            max="95"
            step="5"
            class="w-full accent-accent cursor-pointer h-1.5 bg-ink-700 rounded-lg appearance-none"
          />
          <span class="text-[11px] text-ink-500">มืดสนิท</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from '~/composables/useTheme'

const {
  theme,
  activeWallpaper,
  activeAccent,
  setWallpaper,
  setCustomWallpaper,
  setAccent,
  applyMood,
  resetTheme,
  WALLPAPER_PRESETS,
  ACCENT_PRESETS,
  MOOD_PRESETS
} = useTheme()

const customUrlInput = ref(theme.value.customWallpaperUrl || '')
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadError = ref('')

function applyCustomUrl() {
  if (customUrlInput.value.trim()) {
    uploadError.value = ''
    setCustomWallpaper(customUrlInput.value.trim())
  }
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileUpload(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Safeguard: File size limit (approx 4MB for localStorage)
  if (file.size > 4 * 1024 * 1024) {
    uploadError.value = 'ขนาดไฟล์รูปใหญ่เกินไป (แนะนำไม่เกิน 4MB สำหรับเบราว์เซอร์)'
    return
  }

  uploadError.value = ''
  const reader = new FileReader()
  reader.onload = (event) => {
    const result = event.target?.result as string
    if (result) {
      setCustomWallpaper(result)
      customUrlInput.value = ''
    }
  }
  reader.readAsDataURL(file)
}
</script>


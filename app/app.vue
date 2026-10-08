<template>
  <div
    class="flex min-h-screen w-screen flex-col bg-ink-950 font-sans text-ink-300 selection:bg-accent/30 selection:text-white"
    :class="{ 'select-none': isDragging || isResizing }"
  >
    <!-- Overlay คลุมหน้าจอขณะกำลัง Drag หรือ Resize เพื่อป้องกันไม่ให้เมาส์หลุดเข้าไปติดใน YouTube iframe -->
    <div
      v-if="isDragging || isResizing || isZenResizing || isZenHResizing || isZenYtResizing"
      class="fixed inset-0 z-50 pointer-events-auto bg-transparent select-none"
      :class="isDragging ? 'cursor-grabbing' : (isZenHResizing || isZenYtResizing) ? 'cursor-ns-resize' : isZenResizing ? 'cursor-col-resize' : resizeMode === 'width' ? 'cursor-ew-resize' : resizeMode === 'height' ? 'cursor-ns-resize' : 'cursor-se-resize'"
    />

    <!-- Top Navigation Bar & Workspace Presets -->
    <header class="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-ink-900/90 px-4 py-2.5 backdrop-blur-xl">
      <!-- Left: Logo & Title -->
      <div class="flex items-center gap-3">
        <div class="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-sm font-bold text-ink-950 shadow-md shadow-accent/25">
          N
        </div>
        <div>
          <h1 class="text-sm font-bold leading-tight text-white tracking-wide">NoSwitch v.0.1.2</h1>
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
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 bg-emerald-950/30 px-6 py-2 text-xs text-emerald-200 backdrop-blur-md">
        <div class="flex items-center gap-2">
          <span>🧘</span>
          <span><strong>Zen Focus Active:</strong> โหมดอ่านหนังสือแบบโฟกัส (ลากแถบคั่นตรงกลางเพื่อปรับขนาดจอ YouTube & เอกสารได้)</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200 hover:bg-emerald-500/20 hover:text-white transition cursor-pointer"
            title="รีเซ็ตความกว้างแถบด้านข้างเป็นค่าเริ่มต้น (480px)"
            @click="resetZenSplitWidth"
          >
            ↺ รีเซ็ตสัดส่วน
          </button>
          <button
            class="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200 hover:bg-emerald-500/20 hover:text-white transition cursor-pointer"
            @click="toggleZenMode"
          >
            ✕ ออกจาก Zen Mode
          </button>
        </div>
      </div>

      <!-- Zen Two-Column Workspace (ฝั่งซ้าย: เอกสาร / ตรงกลาง: Splitter Bar / ฝั่งขวา: Pomodoro + YouTube) -->
      <div class="flex flex-1 min-h-0 flex-col lg:flex-row p-3 lg:p-5 overflow-hidden gap-0">
        <!-- ฝั่งซ้าย: Document Reader -->
        <div class="flex flex-1 min-w-[300px] flex-col rounded-2xl border border-white/[0.08] bg-ink-900/80 backdrop-blur-xl shadow-2xl overflow-hidden">
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

        <!-- Draggable Splitter Divider Bar (ลากปรับสัดส่วน ซ้าย-ขวา) -->
        <div
          class="hidden lg:flex w-5 -mx-1 shrink-0 items-center justify-center cursor-col-resize z-20 group select-none"
          title="คลิกลากเพื่อปรับขนาดหน้าจอ YouTube & เอกสาร (ดับเบิลคลิกเพื่อรีเซ็ต)"
          @mousedown.prevent="startZenSplitResize"
          @touchstart.prevent="startZenTouchSplitResize"
          @dblclick="resetZenSplitWidth"
        >
          <div class="h-24 w-1 rounded-full bg-white/10 group-hover:bg-accent group-hover:shadow-[0_0_10px_rgba(168,85,247,0.8)] group-active:bg-accent transition-all duration-150 flex items-center justify-center">
            <div class="h-3 w-0.5 rounded-full bg-ink-950 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <!-- ฝั่งขวา: Focus Sidecar (Pomodoro อยู่บน / YouTube อยู่ล่าง) -->
        <div
          ref="zenSidecarRef"
          class="scroll-thin flex w-full shrink-0 flex-col gap-3 overflow-y-auto pt-4 lg:pt-0 pl-0 lg:pl-3 pb-2"
          :style="{ width: isLgScreen ? `${zenSidebarWidth}px` : '100%' }"
        >
          <!-- Pomodoro Timer Card -->
          <div
            class="flex flex-col rounded-2xl border border-white/[0.08] bg-ink-900/80 backdrop-blur-xl shadow-xl overflow-hidden shrink-0 transition-[flex] duration-75"
            :style="{
              flex: zenYoutubeCustomHeight ? 'none' : `${zenTimerFlex} 1 0%`,
              height: zenYoutubeCustomHeight ? '260px' : undefined,
              minHeight: '200px'
            }"
          >
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

          <!-- Horizontal Splitter Divider Bar (ลากปรับสัดส่วนความสูง Timer vs YouTube) -->
          <div
            class="hidden lg:flex h-3 w-full shrink-0 items-center justify-center cursor-row-resize group select-none -my-1 z-20"
            title="คลิกลากขึ้น-ลงเพื่อปรับสัดส่วนความสูง (ดับเบิลคลิกเพื่อรีเซ็ต 50:50)"
            @mousedown.prevent="startZenHorizontalSplitResize"
            @touchstart.prevent="startZenTouchHorizontalSplitResize"
            @dblclick="resetZenHorizontalSplit"
          >
            <div class="h-1 w-20 rounded-full bg-white/10 group-hover:bg-accent group-hover:shadow-[0_0_8px_rgba(168,85,247,0.8)] group-active:bg-accent transition-all duration-150 flex items-center justify-center">
              <div class="w-4 h-0.5 rounded-full bg-ink-950 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          <!-- YouTube Audio / Video Player Card -->
          <div
            id="zen-yt-card"
            class="relative flex flex-col rounded-2xl border border-white/[0.08] bg-ink-900/80 backdrop-blur-xl shadow-xl overflow-hidden shrink-0 transition-[flex] duration-75"
            :style="{
              flex: zenYoutubeCustomHeight ? 'none' : `${zenYoutubeFlex} 1 0%`,
              height: zenYoutubeCustomHeight ? `${zenYoutubeCustomHeight}px` : undefined,
              minHeight: '260px'
            }"
          >
            <div class="flex h-10 items-center justify-between border-b border-white/[0.06] bg-ink-800/80 px-4 shrink-0">
              <span class="font-semibold text-xs text-white/95 flex items-center gap-2">
                <span>📺</span>
                <span>Study Video / Audio</span>
              </span>
              <div class="flex items-center gap-2">
                <span class="text-[11px] text-ink-500 font-mono">{{ Math.round(zenSidebarWidth) }}px</span>
                <button
                  v-if="zenYoutubeCustomHeight"
                  class="text-[10px] text-accent/80 hover:text-accent cursor-pointer"
                  title="รีเซ็ตความสูงกลับสู่สัดส่วนอัตโนมัติ"
                  @click="zenYoutubeCustomHeight = null"
                >
                  ↺ ออโต้
                </button>
              </div>
            </div>
            <div class="flex-1 min-h-0 overflow-hidden">
              <YoutubePlayer class="h-full w-full !border-0 !rounded-none !bg-transparent" />
            </div>

            <!-- Bottom Edge Resize Handle บนการ์ด YouTube (ลากขอบล่างเพื่อยืดความยาวลงล่าง) -->
            <div
              class="absolute bottom-0 inset-x-0 h-3 cursor-ns-resize z-20 group/ytbot flex items-end justify-center"
              title="คลิกลากขอบล่างเพื่อยืดความยาวของ YouTube ลงมาด้านล่าง"
              @mousedown.prevent="startZenYtBottomResize"
              @touchstart.prevent="startZenTouchYtBottomResize"
            >
              <div class="w-16 h-1 rounded-full bg-white/10 group-hover/ytbot:bg-accent group-hover/ytbot:shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-all mb-0.5" />
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
          v-for="w in widgets"
          v-show="w.visible"
          :key="w.id"
          class="modular-card relative flex flex-col rounded-2xl border border-white/[0.08] bg-ink-900/80 backdrop-blur-xl shadow-xl transition-all duration-200 overflow-hidden"
          :class="[
            getColSpanClass(w.colSpan),
            draggedId === w.id ? 'opacity-40 ring-2 ring-accent scale-[0.99]' : '',
            dragOverId === w.id ? 'ring-2 ring-accent/80 border-accent/60 shadow-[0_0_25px_rgba(168,85,247,0.3)]' : 'hover:border-white/[0.14]'
          ]"
          :style="{
            order: w.order,
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
              <div class="hidden sm:flex items-center rounded-lg border border-white/[0.06] bg-ink-900/70 px-1 py-0.5 text-[10px] text-ink-500">
                <button
                  class="hover:text-white px-1.5 py-0.5 cursor-pointer transition disabled:opacity-30 active:scale-95"
                  :disabled="w.colSpan <= 3"
                  title="ลดความกว้าง"
                  @click="changeColSpan(w.id, -1)"
                >
                  −
                </button>
                <span class="px-1 text-ink-300 font-mono font-medium">{{ w.colSpan }}c</span>
                <button
                  class="hover:text-white px-1.5 py-0.5 cursor-pointer transition disabled:opacity-30 active:scale-95"
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

          <!-- Right Edge Resize Handle (ลากขอบขวาเพื่อปรับความกว้าง) -->
          <div
            v-if="!w.minimized"
            class="absolute top-0 right-0 bottom-4 w-2.5 cursor-ew-resize z-20 group/edge flex items-center justify-end"
            title="คลิกลากขอบขวาเพื่อปรับความกว้าง"
            @mousedown.prevent="startResize(w.id, 'width', $event)"
            @touchstart.prevent="startTouchResize(w.id, 'width', $event)"
          >
            <div class="h-12 w-1 rounded-full bg-white/10 group-hover/edge:bg-accent group-hover/edge:shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-all mr-0.5" />
          </div>

          <!-- Bottom Edge Resize Handle (ลากขอบล่างเพื่อปรับความสูง) -->
          <div
            v-if="!w.minimized"
            class="absolute bottom-0 left-0 right-4 h-2.5 cursor-ns-resize z-20 group/bottom flex items-end justify-center"
            title="คลิกลากขอบล่างเพื่อปรับความสูง"
            @mousedown.prevent="startResize(w.id, 'height', $event)"
            @touchstart.prevent="startTouchResize(w.id, 'height', $event)"
          >
            <div class="w-16 h-1 rounded-full bg-white/10 group-hover/bottom:bg-accent group-hover/bottom:shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-all mb-0.5" />
          </div>

          <!-- Bottom Right Corner Handle (ลากมุมเพื่อปรับทั้งกว้างและสูงพร้อมกัน) -->
          <div
            v-if="!w.minimized"
            class="absolute bottom-0 right-0 z-20 flex h-6 w-6 cursor-se-resize items-end justify-end p-1 text-ink-500 hover:text-accent hover:scale-110 transition active:scale-95"
            title="คลิกลากมุมเพื่อปรับทั้งความกว้างและความสูงพร้อมกัน"
            @mousedown.prevent="startResize(w.id, 'both', $event)"
            @touchstart.prevent="startTouchResize(w.id, 'both', $event)"
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 22H20V20H22V22ZM22 16H20V18H22V16ZM16 22H18V20H16V22ZM22 12H20V14H22V12ZM12 22H14V20H12V22ZM16 18H18V16H16V18Z" />
            </svg>
          </div>

          <!-- Live Resize Overlay Badge -->
          <div
            v-if="isResizing && resizeWidgetId === w.id"
            class="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-2xl ring-2 ring-accent"
          >
            <div class="rounded-xl border border-white/10 bg-ink-900/95 px-4 py-2 shadow-2xl text-center">
              <p class="font-mono text-xs font-bold text-white">
                📐 กว้าง: {{ w.colSpan }}c ({{ Math.round((w.colSpan / 12) * 100) }}%) • สูง: {{ w.height }}px
              </p>
              <p class="text-[10px] text-accent mt-0.5 font-medium">
                {{ resizeMode === 'both' ? 'กำลังปรับกว้าง & สูงพร้อมกัน' : resizeMode === 'width' ? 'กำลังปรับความกว้าง' : 'กำลังปรับความสูง' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State if all widgets hidden -->
      <div
        v-if="!visibleCount"
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
    { id: 'youtube', title: 'YouTube Focus', icon: '📺', visible: true, minimized: false, order: 0, colSpan: 6, height: 420 },
    { id: 'timer', title: 'Pomodoro Timer', icon: '⏱️', visible: true, minimized: false, order: 1, colSpan: 6, height: 420 },
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
  const templateMap = new Map(template.map((t) => [t.id, t]))
  
  // อัปเดตคุณสมบัติใน array เดิมโดยตรงเพื่อไม่ให้ Vue ทำลาย/สร้าง DOM Node ของ YouTube ใหม่ (ทำให้เพลงเล่นต่อเนื่องไม่สะดุด)
  widgets.value.forEach((w) => {
    const t = templateMap.get(w.id)
    if (t) {
      w.visible = t.visible
      w.minimized = t.minimized
      w.order = t.order
      w.colSpan = t.colSpan
      w.height = t.height
    }
  })
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

// Resize Logic (รองรับทั้งปรับความกว้าง ความสูง และทั้งสองแกนพร้อมกัน)
type ResizeMode = 'width' | 'height' | 'both'
const isResizing = ref(false)
const resizeMode = ref<ResizeMode>('both')
let resizeWidgetId: string | null = null
let startX = 0
let startY = 0
let startColSpan = 4
let startHeight = 400
let gridContainerWidth = 1200

function startResize(id: string, mode: ResizeMode, event: MouseEvent) {
  const w = widgets.value.find((item) => item.id === id)
  if (!w || w.minimized) return

  isResizing.value = true
  resizeMode.value = mode
  resizeWidgetId = id
  startX = event.clientX
  startY = event.clientY
  startColSpan = w.colSpan
  startHeight = w.height

  // คำนวณความกว้างของ Grid Container ปัจจุบันเพื่อคำนวณการ Snap ของคอลัมน์
  const gridEl = document.querySelector('.grid-cols-12') as HTMLElement | null
  gridContainerWidth = gridEl ? gridEl.clientWidth : window.innerWidth

  window.addEventListener('mousemove', onResizeMove)
  window.addEventListener('mouseup', onResizeEnd)
}

function startTouchResize(id: string, mode: ResizeMode, event: TouchEvent) {
  const touch = event.touches[0]
  if (!touch) return
  startResize(id, mode, { clientX: touch.clientX, clientY: touch.clientY } as MouseEvent)

  window.addEventListener('touchmove', onTouchResizeMove, { passive: false })
  window.addEventListener('touchend', onTouchResizeEnd)
}

function onTouchResizeMove(event: TouchEvent) {
  const touch = event.touches[0]
  if (!touch) return
  event.preventDefault()
  onResizeMove({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent)
}

function onTouchResizeEnd() {
  window.removeEventListener('touchmove', onTouchResizeMove)
  window.removeEventListener('touchend', onTouchResizeEnd)
  onResizeEnd()
}

function onResizeMove(event: { clientX: number, clientY: number }) {
  if (!isResizing.value || !resizeWidgetId) return
  const w = widgets.value.find((item) => item.id === resizeWidgetId)
  if (!w) return

  // 1. ปรับความสูง (Height)
  if (resizeMode.value === 'height' || resizeMode.value === 'both') {
    const deltaY = event.clientY - startY
    const newHeight = Math.max(280, Math.min(850, startHeight + deltaY))
    w.height = Math.round(newHeight)
  }

  // 2. ปรับความกว้าง (Width / ColSpan)
  if (resizeMode.value === 'width' || resizeMode.value === 'both') {
    const deltaX = event.clientX - startX
    const colPixelWidth = Math.max(60, gridContainerWidth / 12)
    const colStep = Math.round(deltaX / colPixelWidth)
    const targetCols = startColSpan + colStep

    // Snap หาค่าคอลัมน์ที่ใกล้ที่สุดใน validCols [3, 4, 5, 6, 7, 8, 9, 12]
    const clamped = Math.max(3, Math.min(12, targetCols))
    let closest = validCols[0]!
    let minDiff = 999
    for (const c of validCols) {
      const diff = Math.abs(c - clamped)
      if (diff < minDiff) {
        minDiff = diff
        closest = c
      }
    }
    w.colSpan = closest
  }
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
        const parsedMap = new Map(parsed.map((p) => [p.id, p]))
        widgets.value.forEach((w) => {
          const found = parsedMap.get(w.id)
          if (found) {
            w.visible = found.visible
            w.minimized = found.minimized
            w.order = found.order
            w.colSpan = found.colSpan
            w.height = found.height
          }
        })
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

// Zen Mode Splitter Drag Logic
const zenSidebarWidth = useLocalStorage<number>('noswitch:zen:sidebarWidth', 480)
const isZenResizing = ref(false)
const isLgScreen = ref(true)
let zenStartX = 0
let zenStartWidth = 480

function startZenSplitResize(e: MouseEvent) {
  isZenResizing.value = true
  zenStartX = e.clientX
  zenStartWidth = zenSidebarWidth.value
  window.addEventListener('mousemove', onZenSplitMove)
  window.addEventListener('mouseup', onZenSplitEnd)
}

function startZenTouchSplitResize(e: TouchEvent) {
  const touch = e.touches[0]
  if (!touch) return
  isZenResizing.value = true
  zenStartX = touch.clientX
  zenStartWidth = zenSidebarWidth.value
  window.addEventListener('touchmove', onZenTouchSplitMove, { passive: false })
  window.addEventListener('touchend', onZenTouchSplitEnd)
}

function onZenTouchSplitMove(e: TouchEvent) {
  const touch = e.touches[0]
  if (!touch) return
  e.preventDefault()
  handleZenSplitDrag(touch.clientX)
}

function onZenTouchSplitEnd() {
  window.removeEventListener('touchmove', onZenTouchSplitMove)
  window.removeEventListener('touchend', onZenTouchSplitEnd)
  onZenSplitEnd()
}

function onZenSplitMove(e: MouseEvent) {
  handleZenSplitDrag(e.clientX)
}

function handleZenSplitDrag(clientX: number) {
  if (!isZenResizing.value) return
  // ดึงขอบไปทางซ้าย = ขยายความกว้างฝั่งขวา
  const deltaX = clientX - zenStartX
  const newWidth = zenStartWidth - deltaX
  const minWidth = 360
  const maxWidth = Math.max(minWidth, Math.min(850, window.innerWidth - 380))
  zenSidebarWidth.value = Math.round(Math.max(minWidth, Math.min(maxWidth, newWidth)))
}

function onZenSplitEnd() {
  if (!isZenResizing.value) return
  isZenResizing.value = false
  window.removeEventListener('mousemove', onZenSplitMove)
  window.removeEventListener('mouseup', onZenSplitEnd)
}

function resetZenSplitWidth() {
  zenSidebarWidth.value = 480
  resetZenHorizontalSplit()
}

// Zen Mode Height Adjustment Logic (Horizontal Splitter & Bottom Edge)
const zenTimerFlex = useLocalStorage<number>('noswitch:zen:timerFlex', 50)
const zenYoutubeFlex = useLocalStorage<number>('noswitch:zen:ytFlex', 50)
const zenYoutubeCustomHeight = useLocalStorage<number | null>('noswitch:zen:ytCustomHeight', null)

const isZenHResizing = ref(false)
const isZenYtResizing = ref(false)
let zenHStartY = 0
let zenHStartTimerFlex = 50
let zenYtStartY = 0
let zenYtStartHeight = 320

function startZenHorizontalSplitResize(e: MouseEvent) {
  isZenHResizing.value = true
  zenHStartY = e.clientY
  zenHStartTimerFlex = zenTimerFlex.value
  zenYoutubeCustomHeight.value = null
  window.addEventListener('mousemove', onZenHMove)
  window.addEventListener('mouseup', onZenHEnd)
}

function startZenTouchHorizontalSplitResize(e: TouchEvent) {
  const touch = e.touches[0]
  if (!touch) return
  isZenHResizing.value = true
  zenHStartY = touch.clientY
  zenHStartTimerFlex = zenTimerFlex.value
  zenYoutubeCustomHeight.value = null
  window.addEventListener('touchmove', onZenHTouchMove, { passive: false })
  window.addEventListener('touchend', onZenHTouchEnd)
}

function onZenHTouchMove(e: TouchEvent) {
  const touch = e.touches[0]
  if (!touch) return
  e.preventDefault()
  handleZenHDrag(touch.clientY)
}

function onZenHTouchEnd() {
  window.removeEventListener('touchmove', onZenHTouchMove)
  window.removeEventListener('touchend', onZenHTouchEnd)
  onZenHEnd()
}

function onZenHMove(e: MouseEvent) {
  handleZenHDrag(e.clientY)
}

function handleZenHDrag(clientY: number) {
  if (!isZenHResizing.value) return
  const deltaY = clientY - zenHStartY
  const containerHeight = Math.max(500, window.innerHeight - 140)
  const percentDelta = (deltaY / containerHeight) * 100
  const newTimerFlex = Math.max(25, Math.min(75, Math.round(zenHStartTimerFlex + percentDelta)))
  zenTimerFlex.value = newTimerFlex
  zenYoutubeFlex.value = 100 - newTimerFlex
}

function onZenHEnd() {
  if (!isZenHResizing.value) return
  isZenHResizing.value = false
  window.removeEventListener('mousemove', onZenHMove)
  window.removeEventListener('mouseup', onZenHEnd)
}

function resetZenHorizontalSplit() {
  zenTimerFlex.value = 50
  zenYoutubeFlex.value = 50
  zenYoutubeCustomHeight.value = null
}

function startZenYtBottomResize(e: MouseEvent) {
  isZenYtResizing.value = true
  zenYtStartY = e.clientY
  const ytCard = document.querySelector('#zen-yt-card') as HTMLElement | null
  zenYtStartHeight = ytCard ? ytCard.clientHeight : (zenYoutubeCustomHeight.value || 300)
  window.addEventListener('mousemove', onZenYtMove)
  window.addEventListener('mouseup', onZenYtEnd)
}

function startZenTouchYtBottomResize(e: TouchEvent) {
  const touch = e.touches[0]
  if (!touch) return
  isZenYtResizing.value = true
  zenYtStartY = touch.clientY
  const ytCard = document.querySelector('#zen-yt-card') as HTMLElement | null
  zenYtStartHeight = ytCard ? ytCard.clientHeight : (zenYoutubeCustomHeight.value || 300)
  window.addEventListener('touchmove', onZenYtTouchMove, { passive: false })
  window.addEventListener('touchend', onZenYtTouchEnd)
}

function onZenYtTouchMove(e: TouchEvent) {
  const touch = e.touches[0]
  if (!touch) return
  e.preventDefault()
  handleZenYtDrag(touch.clientY)
}

function onZenYtTouchEnd() {
  window.removeEventListener('touchmove', onZenYtTouchMove)
  window.removeEventListener('touchend', onZenYtTouchEnd)
  onZenYtEnd()
}

function onZenYtMove(e: MouseEvent) {
  handleZenYtDrag(e.clientY)
}

function handleZenYtDrag(clientY: number) {
  if (!isZenYtResizing.value) return
  const deltaY = clientY - zenYtStartY
  const newHeight = Math.max(260, Math.min(850, zenYtStartHeight + deltaY))
  zenYoutubeCustomHeight.value = Math.round(newHeight)
}

function onZenYtEnd() {
  if (!isZenYtResizing.value) return
  isZenYtResizing.value = false
  window.removeEventListener('mousemove', onZenYtMove)
  window.removeEventListener('mouseup', onZenYtEnd)
}

function checkScreenSize() {
  if (typeof window !== 'undefined') {
    isLgScreen.value = window.innerWidth >= 1024
  }
}

onMounted(() => {
  updateClock()
  timerInterval = setInterval(updateClock, 1000)
  window.addEventListener('click', handleDocumentClick)
  window.addEventListener('resize', checkScreenSize)
  checkScreenSize()
  loadFromStorage()
})

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval)
  window.removeEventListener('click', handleDocumentClick)
  window.removeEventListener('resize', checkScreenSize)
  window.removeEventListener('mousemove', onResizeMove)
  window.removeEventListener('mouseup', onResizeEnd)
  window.removeEventListener('mousemove', onZenSplitMove)
  window.removeEventListener('mouseup', onZenSplitEnd)
  window.removeEventListener('mousemove', onZenHMove)
  window.removeEventListener('mouseup', onZenHEnd)
  window.removeEventListener('mousemove', onZenYtMove)
  window.removeEventListener('mouseup', onZenYtEnd)
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

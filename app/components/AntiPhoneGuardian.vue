<template>
  <div class="widget flex flex-col h-full w-full select-none" aria-labelledby="guardian-title">
    <!-- WIDGET HEADER -->
    <div class="widget-header border-b border-white/[0.06] pb-3">
      <div class="flex items-center gap-2.5">
        <div class="relative grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-rose-500/20 to-purple-500/20 text-base shadow-inner ring-1 ring-white/10">
          🛡️
          <span
            v-if="isActive"
            class="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-ink-900 animate-pulse"
          />
        </div>
        <div>
          <h2 id="guardian-title" class="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
            Focus Guardian
            <span
              class="rounded-full px-2 py-0.5 text-[10px] font-medium border"
              :class="statusBadgeClasses"
            >
              {{ statusBadgeText }}
            </span>
          </h2>
          <p class="text-[11px] text-ink-500">AI Anti-Phone Detection (COCO-SSD)</p>
        </div>
      </div>

      <!-- Header Action Controls -->
      <div class="flex items-center gap-2">
        <!-- Sound Mute Toggle -->
        <button
          type="button"
          class="rounded-xl border border-white/[0.08] bg-white/[0.04] p-1.5 text-xs text-ink-300 transition hover:border-accent/40 hover:bg-white/[0.08] hover:text-white cursor-pointer"
          :title="isMuted ? 'เปิดเสียงไซเรนเตือน' : 'ปิดเสียงเตือน'"
          @click="isMuted = !isMuted"
        >
          <span>{{ isMuted ? '🔇' : '🔔' }}</span>
        </button>

        <!-- Preview Toggle Button -->
        <button
          type="button"
          class="rounded-xl border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs text-ink-300 transition hover:border-accent/40 hover:bg-white/[0.08] hover:text-white cursor-pointer"
          :title="showPreview ? 'ซ่อนกรอบพรีวิวกล้อง' : 'แสดงกรอบพรีวิวกล้อง'"
          @click="showPreview = !showPreview"
        >
          <span>{{ showPreview ? '👁️ ซ่อนพรีวิว' : '📷 แสดงพรีวิว' }}</span>
        </button>
      </div>
    </div>

    <!-- WIDGET BODY -->
    <div class="widget-body flex flex-1 flex-col gap-3 pt-3 overflow-y-auto scroll-thin">
      <!-- MAIN CONTROL BAR & STATUS -->
      <div class="shrink-0 flex items-center justify-between rounded-xl border border-white/[0.08] bg-ink-800/60 p-3 shadow-inner">
        <div class="flex items-center gap-3">
          <div
            class="grid h-10 w-10 place-items-center rounded-xl transition-all duration-300 text-lg"
            :class="isActive ? 'bg-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]' : 'bg-ink-700/50 text-ink-400'"
          >
            {{ isActive ? '👁️‍🗨️' : '💤' }}
          </div>
          <div>
            <div class="text-xs font-semibold text-white">ระบบตรวจจับการหยิบมือถือ</div>
            <div class="text-[11px] text-ink-400">
              {{ isActive ? 'ตรวจจับวัตถุทุกๆ 600ms' : 'กดสวิตช์เพื่อเริ่มเปิดกล้องเฝ้าระวัง' }}
            </div>
          </div>
        </div>

        <!-- TOGGLE SWITCH (Focus Guardian) -->
        <button
          type="button"
          role="switch"
          :aria-checked="isActive"
          class="relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-ink-900"
          :class="isActive ? 'bg-accent' : 'bg-ink-700'"
          :disabled="isModelLoading"
          @click="toggleGuardian"
        >
          <span class="sr-only">Toggle Focus Guardian</span>
          <span
            aria-hidden="true"
            class="pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out"
            :class="isActive ? 'translate-x-5' : 'translate-x-0'"
          />
        </button>
      </div>

      <!-- MODEL LOADING INDICATOR (IF STILL LOADING) -->
      <div
        v-if="isModelLoading"
        class="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200"
      >
        <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
        <div class="flex-1">
          <span class="font-medium">กำลังเตรียมโมเดล AI (TensorFlow.js & COCO-SSD)...</span>
          <p class="text-[10px] text-amber-300/70">ดาวน์โหลด weights ครั้งแรกในเบราว์เซอร์</p>
        </div>
      </div>

      <!-- CAMERA ERROR ALERT (IF PERMISSION DENIED) -->
      <div
        v-if="cameraError"
        class="flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200"
      >
        <span class="text-base shrink-0">⚠️</span>
        <div class="flex-1">
          <p class="font-semibold">ไม่สามารถเข้าถึงกล้องเว็บแคมได้</p>
          <p class="text-[11px] text-rose-300/80 mt-0.5">{{ cameraError }}</p>
        </div>
        <button
          type="button"
          class="rounded-lg bg-rose-500/20 px-2 py-1 text-[11px] text-rose-200 hover:bg-rose-500/30 cursor-pointer"
          @click="startCamera"
        >
          ลองใหม่
        </button>
      </div>

      <!-- STATS METRICS GRID -->
      <div class="shrink-0 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <!-- Distraction Counter Card -->
        <div class="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 flex flex-col justify-between">
          <div class="flex items-center justify-between text-ink-400">
            <span class="text-[11px] font-medium">แอบเล่นมือถือ</span>
            <span class="text-xs">📱</span>
          </div>
          <div class="mt-2 flex items-baseline gap-1.5">
            <span class="text-2xl font-bold tracking-tight text-rose-400 font-mono">
              {{ distractionCount }}
            </span>
            <span class="text-[11px] text-ink-400">ครั้ง</span>
          </div>
          <div class="mt-1 flex items-center justify-between text-[10px] text-ink-500 border-t border-white/[0.05] pt-1">
            <span>บทลงโทษ</span>
            <button
              v-if="distractionCount > 0"
              type="button"
              class="text-ink-400 hover:text-white underline cursor-pointer"
              @click="resetCounter"
            >
              รีเซ็ต
            </button>
          </div>
        </div>

        <!-- Detection Interval / Status -->
        <div class="rounded-xl border border-white/[0.06] bg-ink-800/40 p-3 flex flex-col justify-between">
          <div class="flex items-center justify-between text-ink-400">
            <span class="text-[11px] font-medium">ความถี่ตรวจจับ</span>
            <span class="text-xs">⏱️</span>
          </div>
          <div class="mt-2 flex items-baseline gap-1.5">
            <span class="text-2xl font-bold tracking-tight text-white font-mono">600</span>
            <span class="text-[11px] text-ink-400">ms/ครั้ง</span>
          </div>
          <div class="mt-1 text-[10px] text-ink-500 border-t border-white/[0.05] pt-1">
            เกณฑ์มั่นใจ &ge; 60%
          </div>
        </div>

        <!-- AI Confidence / State -->
        <div class="rounded-xl border border-white/[0.06] bg-ink-800/40 p-3 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div class="flex items-center justify-between text-ink-400">
            <span class="text-[11px] font-medium">สถานะกล้อง AI</span>
            <span class="text-xs">🧠</span>
          </div>
          <div class="mt-2 flex items-center gap-1.5">
            <span
              class="h-2.5 w-2.5 rounded-full shrink-0"
              :class="isActive ? 'bg-emerald-400 shadow-[0_0_8px_hsl(152_60%_55%)]' : 'bg-ink-600'"
            />
            <span class="text-sm font-semibold truncate" :class="isActive ? 'text-emerald-300' : 'text-ink-400'">
              {{ isActive ? (lastDetectedScore ? `พบมือถือ ${Math.round(lastDetectedScore * 100)}%` : 'เฝ้าระวังปกติ') : 'ปิดใช้งาน' }}
            </span>
          </div>
          <div class="mt-1 text-[10px] text-ink-500 border-t border-white/[0.05] pt-1 truncate">
            {{ cooldownSeconds > 0 ? `พักผ่อน: ${cooldownSeconds}s` : (isActive ? 'พร้อมตรวจจับ' : 'สแตนด์บาย') }}
          </div>
        </div>
      </div>

      <!-- CAMERA PREVIEW CONTAINER (ขยายเต็มพื้นที่อัตโนมัติตามขนาด Widget ที่ปรับ) -->
      <div
        class="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-black/60 backdrop-blur-md transition-all duration-300 flex flex-col"
        :class="showPreview ? 'flex-1 min-h-[200px]' : 'shrink-0 h-11'"
      >
        <!-- Top bar of Preview Container -->
        <div class="shrink-0 flex items-center justify-between px-3 py-2 bg-ink-900/80 border-b border-white/[0.06]">
          <div class="flex items-center gap-2">
            <span class="text-xs">📹</span>
            <span class="text-[11px] font-medium text-ink-300">
              {{ showPreview ? 'Live Camera Feed & AI Bounding Box' : 'กล้องทำงานเบื้องหลัง (ซ่อนพรีวิวเพื่อประหยัดพื้นที่)' }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span
              v-if="isActive && cooldownSeconds > 0"
              class="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30"
            >
              Grace Period {{ cooldownSeconds }}s
            </span>
            <button
              type="button"
              class="text-[11px] text-accent hover:underline cursor-pointer"
              @click="showPreview = !showPreview"
            >
              {{ showPreview ? 'ย่อลง' : 'ขยายดู' }}
            </button>
          </div>
        </div>

        <!-- Video & Canvas Viewport (ขยายเต็มความกว้างและความสูงตามที่ผู้ใช้ขยายบล็อก) -->
        <div
          v-show="showPreview"
          class="relative flex-1 min-h-0 w-full flex items-center justify-center bg-ink-950 overflow-hidden"
        >
          <!-- Live Video Element -->
          <video
            ref="videoRef"
            autoplay
            playsinline
            muted
            class="h-full w-full object-cover transform -scale-x-100"
          />

          <!-- Live Canvas Overlay for Bounding Box -->
          <canvas
            ref="canvasRef"
            class="pointer-events-none absolute inset-0 h-full w-full object-cover transform -scale-x-100"
          />

          <!-- Viewfinder Frame Aesthetics (Corner Brackets) -->
          <div class="pointer-events-none absolute inset-3 border border-white/[0.06] rounded-xl flex flex-col justify-between p-2">
            <div class="flex justify-between">
              <span class="w-3 h-3 border-t-2 border-l-2 border-accent/60 rounded-tl" />
              <span class="w-3 h-3 border-t-2 border-r-2 border-accent/60 rounded-tr" />
            </div>
            <!-- Center Crosshair -->
            <div class="self-center flex items-center justify-center opacity-30">
              <span class="w-4 h-0.5 bg-accent/60" />
              <span class="w-0.5 h-4 bg-accent/60 absolute" />
            </div>
            <div class="flex justify-between">
              <span class="w-3 h-3 border-b-2 border-l-2 border-accent/60 rounded-bl" />
              <span class="w-3 h-3 border-b-2 border-r-2 border-accent/60 rounded-br" />
            </div>
          </div>

          <!-- Empty State (Camera is OFF) -->
          <div
            v-if="!isActive"
            class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink-950/85 backdrop-blur-sm text-center p-4"
          >
            <div class="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.04] text-2xl ring-1 ring-white/10">
              📷
            </div>
            <p class="text-xs font-medium text-white">กล้องยังไม่ได้เปิดทำงาน</p>
            <p class="text-[11px] text-ink-500 max-w-xs">
              เปิดสวิตช์ "Focus Guardian" เพื่อเปิดกล้องและเริ่มระบบ AI ตรวจจับมือถือ
            </p>
            <button
              type="button"
              class="btn btn-primary mt-1 text-xs px-3.5 py-1.5"
              :disabled="isModelLoading"
              @click="toggleGuardian"
            >
              🚀 เปิดระบบตรวจจับ
            </button>
          </div>
        </div>

        <!-- Hidden Video (Keeps running in background when preview is hidden) -->
        <div v-show="!showPreview" class="hidden">
          <!-- The video element remains in DOM via ref above -->
        </div>
      </div>

      <!-- SAVAGE MOTIVATIONAL QUOTE OF THE DAY -->
      <div class="shrink-0 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs">
        <div class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-accent">
          <span>💡</span> กฎเหล็กคนรักอนาคต
        </div>
        <p class="mt-1 text-ink-300 italic">
          "สมาธิ 25 นาทีมีค่ามากกว่าการนั่งแช่ 4 ชั่วโมงแต่ไถมือถือไปแล้ว 3 ชั่วโมงครึ่ง"
        </p>
      </div>
    </div>

    <!-- FULLSCREEN PANIC ALERT MODAL (TELEPORT TO BODY) -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="isAlertOpen"
          class="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="alert-headline"
        >
          <!-- Panic Red Flashing Backdrop & Vignette -->
          <div
            class="fixed inset-0 bg-rose-950/90 backdrop-blur-xl animate-pulse"
            style="animation-duration: 1.5s;"
            aria-hidden="true"
          />

          <!-- Danger Scanlines & Glow Overlay -->
          <div
            class="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.3)_0%,rgba(15,23,42,0.9)_100%)]"
            aria-hidden="true"
          />

          <!-- Alert Modal Card -->
          <div class="relative w-full max-w-lg rounded-3xl border-2 border-rose-500 bg-ink-950/95 p-6 sm:p-8 shadow-[0_0_80px_rgba(244,63,94,0.6)] text-center text-white z-10 animate-shake">
            <!-- Pulsing Warning Icon -->
            <div class="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-3xl bg-rose-500/20 text-4xl ring-4 ring-rose-500/40 shadow-[0_0_30px_rgba(244,63,94,0.5)]">
              📱💥
            </div>

            <!-- Danger Badge -->
            <div class="inline-flex items-center gap-1.5 rounded-full border border-rose-500/60 bg-rose-500/20 px-3.5 py-1 text-xs font-bold tracking-wider text-rose-300 uppercase mb-3">
              <span class="h-2 w-2 rounded-full bg-rose-400 animate-ping" />
              DISTRACTION DETECTED!
            </div>

            <!-- Main Headline -->
            <h3 id="alert-headline" class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              🚨 ตรวจพบการแอบเล่นมือถือ!
            </h3>

            <!-- Savage Quote Box -->
            <div class="my-5 rounded-2xl border border-rose-500/30 bg-rose-950/50 p-4 sm:p-5 shadow-inner">
              <p class="text-lg sm:text-xl font-bold leading-relaxed text-rose-200">
                “{{ currentQuote }}”
              </p>
            </div>

            <!-- Violation Details & Counter -->
            <div class="grid grid-cols-2 gap-3 mb-6 text-left">
              <div class="rounded-xl border border-white/[0.08] bg-ink-900/80 p-3">
                <span class="text-[11px] text-ink-400">สถิติแอบเล่นรอบนี้</span>
                <div class="text-xl font-bold text-rose-400 font-mono mt-0.5">
                  {{ distractionCount }} <span class="text-xs font-normal text-ink-300">ครั้ง</span>
                </div>
              </div>
              <div class="rounded-xl border border-white/[0.08] bg-ink-900/80 p-3">
                <span class="text-[11px] text-ink-400">ความมั่นใจของ AI</span>
                <div class="text-xl font-bold text-emerald-400 font-mono mt-0.5">
                  {{ currentConfidence }}%
                </div>
              </div>
            </div>

            <!-- Action Button -->
            <button
              type="button"
              class="w-full cursor-pointer rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 py-3.5 text-base font-bold text-white shadow-[0_0_25px_rgba(244,63,94,0.4)] transition-all duration-200 hover:brightness-110 active:scale-95"
              @click="dismissAlert"
            >
              ✋ ยอมรับผิดและกลับไปอ่านต่อ
            </button>

            <p class="mt-3 text-[11px] text-ink-400">
              *มีเวลากลับตัว {{ COOLDOWN_DURATION }} วินาทีหลังปิดหน้าต่าง กรุณาวางมือถือให้พ้นสายตา
            </p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import type { ObjectDetection, DetectedObject } from '@tensorflow-models/coco-ssd'

// ==========================================
// CONFIGURATION & CONSTANTS
// ==========================================
const DETECTION_INTERVAL_MS = 600
const CONFIDENCE_THRESHOLD = 0.60
const COOLDOWN_DURATION = 4 // Cooldown grace period (seconds)
const STORAGE_KEY = 'noswitch_phone_distraction_count'

const SAVAGE_QUOTES = [
  'วางมือถือลงเดี๋ยวนี้ เกรด F ไม่ได้มาเพราะโชคช่วย!',
  'แจ้งเตือนเข้าจริง หรือแค่เหงาหยิบขึ้นมาดูแก้เขิน?',
  'ไถฟีดตอนนี้ คะแนนสอบไม่เพิ่มขึ้นมานะ!',
  'อนาคตกำลังเรียกหา แต่มือยังไถ Reels อยู่เลย!',
  'ข้อสอบไม่ได้วัดดวง แต่วัดว่าคุณอ่านหนังสือมากี่ชั่วโมง!',
  'มือถือไม่หนีไปไหน แต่เวลาสอบเหลือน้อยลงทุกที!',
  'คนอื่นเขากำลังเก็บ A ส่วนคุณกำลังเก็บตอง F อยู่เหรอ?',
  'วางลงซะ! ปริญญาไม่ได้แจกฟรีตามยอดไลก์นะ!',
  'สต๊อป! พ่อแม่ส่งมาเรียน ไม่ได้ส่งมาฝึกความไวของนิ้วโป้ง!',
  'ความฝันไม่เคยทรยศใคร มีแต่คนไถมือถือเท่านั้นแหละที่ทรยศความฝัน!',
  'ไถจนหน้าจอสึก คะแนนสอบก็ยังไม่กระเตื้องขึ้นมาหรอก!',
  'มัวแต่ดูชีวิตคนอื่นในเน็ต แล้วชีวิตตัวเองจะเอาไงต่อ?',
  'อ่านหนังสือไม่ถึง 5 นาที มือขยับไปแตะจอมือถือไวกว่าแสง!',
  'ค่าเทอมจ่ายหลักหมื่น แต่ความพยายามเล่นหลักร้อย!',
  'คนที่เขาติดหมอติดวิศวะ เขาไม่ได้นั่งไถ TikTok ทั้งวันแบบนี้นะ!',
  'ไม่มีใครตายเพราะไม่ได้ตอบแชท แต่คุณจะตายเพราะเกรดเฉลี่ย!',
  'ข้ออ้างมีเป็นล้าน ข้อสอบมีแค่ ก ข ค ง แล้วจะเอาปัญญาที่ไหนไปกา?',
  'หนังสือไม่อ่าน อยากได้คะแนนท็อป ฝันกลางวันอยู่เหรอ?',
  'อย่าทำให้คนส่งเรียนต้องเสียน้ำตาเพราะความขี้เกียจของคุณ!',
  'หยุดหลอกตัวเองว่า "ขอพัก 5 นาที" เพราะปาไปสองชั่วโมงแล้ว!',
  'ถ้าความขี้เกียจเผาผลาญแคลอรีได้ ป่านนี้คุณคงผอมติดกระดูกไปแล้ว!',
  'แสงสีฟ้าจากจอมือถือ ไม่ได้ช่วยส่องให้อนาคตสว่างขึ้นนะ!',
  'ตื่น! โลกความจริงเขาวัดกันที่ผลงาน ไม่ใช่ยอดวิวในฟีด!',
  'อยากมีเงินเดือนเป็นแสน แต่แค่อ่านหนังสือ 10 นาทียังทำไม่ได้?',
  'สมองมีไว้คิดอนาคต ไม่ได้มีไว้จำสตอรี่ชาวบ้าน!',
  'จะอ่านหนังสือดีๆ หรือจะรอให้ใบรีไทร์ส่งตรงถึงบ้าน?',
  'ส่องแฟนเก่าแล้วเกรดเฉลี่ยมันพุ่งขึ้นเหรอ? วางเดี๋ยวนี้!',
  'เพื่อนอ่านจบรอบที่สามแล้ว มึงยังอ่านไม่จบบรรทัดแรกเลย!',
  'อนาคตมืดมนกว่าหน้าจอมือถือตอนล็อกอีกนะ ถ้ายังไม่อ่าน!',
  'สมาธิสั้นกว่าปลาทอง ยังกล้าหวังเกียรตินิยมอีกเหรอ?',
  'วันนี้ไถจอเพลิน พรุ่งนี้น้ำตานองห้องสอบแน่นอน!',
  'นอนกลิ้งเล่นมือถือสบายใจเฉิบ... รอดูตอนเกรดออกละกัน!',
  'คำว่า "ค่อยอ่านพรุ่งนี้" พาคนซิ่วมานักต่อนักแล้ว!',
  'หนังสือเรียนไม่ใช่ยานอนหลับ เปิดปุ๊บง่วงปั๊บ พอหยิบมือถือนี่ตาสว่างเชียว!',
  'เลิกทำตัวเป็นภาระอนาคตตัวเองได้แล้ว วางมือถือเดี๋ยวนี้!',
  'ตอบแชทให้ไวเหมือนตอนตอบข้อสอบด้วยนะ อย่าเก่งแต่ในแชท!',
  'เล่นเข้าไปมือถือ! ถ้าข้อสอบออกเรื่องสตอรี่ไอจี มึงคงท็อปเซคไปแล้ว!',
  'ตอนสอบไม่มี Google ให้เสิร์ชหานะ จำใส่กะโหลกไว้!',
  'มัวแต่แคร์ยอดฟอล ยอดเงินในบัญชีอนาคตจะเหลือศูนย์!',
  'คนอื่นอ่านจนตาแฉะ คุณนั่งกดไลก์จนนิ้วล็อก ไม่อายบ้างเหรอ?',
  'อย่าให้โทรศัพท์เครื่องไม่กี่หมื่น มาทำลายอนาคตหลายสิบล้านของคุณ!',
  'อนาคตไม่ได้ขึ้นอยู่กับโชคชะตา แต่มันกำลังพังเพราะมือถือในมือคุณเนี่ยแหละ!',
  'วางลงซะ ก่อนที่เกรดเฉลี่ยเทอมนี้จะต่ำกว่าอุณหภูมิห้อง!',
  'โตแล้วนะ รับผิดชอบชีวิตตัวเองให้เป็น อย่าให้ AI ต้องมาคอยด่า!',
  'ถ้าคิดว่าข้อสอบมันยาก ก็เพราะคุณเอาเวลาไปไถคลิปสั้นไงล่ะ!',
  'คิดว่าตัวเองฉลาดพอจะไม่อ่านหนังสือเหรอ? อย่าหลงตัวเอง!'
]

// ==========================================
// REACTIVE STATES
// ==========================================
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const isActive = ref(false)
const showPreview = ref(true)
const isMuted = ref(false)
const isModelLoading = ref(false)
const isModelReady = ref(false)
const cameraError = ref<string | null>(null)

const distractionCount = ref(0)
const isAlertOpen = ref(false)
const currentQuote = ref(SAVAGE_QUOTES[0])
const currentConfidence = ref(85)
const lastDetectedScore = ref<number | null>(null)

const cooldownSeconds = ref(0)
let cooldownTimer: ReturnType<typeof setInterval> | null = null

// Internal non-reactive variables to prevent overhead & memory leaks
let model: ObjectDetection | null = null
let mediaStream: MediaStream | null = null
let detectionIntervalId: ReturnType<typeof setInterval> | null = null
let isDetecting = false
let audioCtx: AudioContext | null = null

// ==========================================
// COMPUTED PROPERTIES
// ==========================================
const statusBadgeClasses = computed(() => {
  if (isAlertOpen.value) {
    return 'border-rose-500/40 bg-rose-500/20 text-rose-300 animate-pulse'
  }
  if (!isActive.value) {
    return 'border-white/[0.08] bg-white/[0.04] text-ink-400'
  }
  if (cooldownSeconds.value > 0) {
    return 'border-amber-500/40 bg-amber-500/20 text-amber-300'
  }
  return 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
})

const statusBadgeText = computed(() => {
  if (isAlertOpen.value) return '🚨 ALARM'
  if (!isActive.value) return 'OFF'
  if (cooldownSeconds.value > 0) return `COOLDOWN (${cooldownSeconds.value}s)`
  return 'GUARDING'
})

// ==========================================
// AUDIO BUZZER (WEB AUDIO API)
// ==========================================
function playBuzzerAlert() {
  if (isMuted.value) return
  if (typeof window === 'undefined') return

  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return

    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass()
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }

    const now = audioCtx.currentTime

    // Tone 1: High alarm buzz
    const osc1 = audioCtx.createOscillator()
    const gain1 = audioCtx.createGain()
    osc1.type = 'sawtooth'
    osc1.frequency.setValueAtTime(880, now) // A5
    osc1.frequency.exponentialRampToValueAtTime(440, now + 0.22) // Drop to A4

    gain1.gain.setValueAtTime(0.3, now)
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25)

    osc1.connect(gain1)
    gain1.connect(audioCtx.destination)

    osc1.start(now)
    osc1.stop(now + 0.25)

    // Tone 2: Harsh secondary warning
    const osc2 = audioCtx.createOscillator()
    const gain2 = audioCtx.createGain()
    osc2.type = 'sawtooth'
    osc2.frequency.setValueAtTime(920, now + 0.28)
    osc2.frequency.exponentialRampToValueAtTime(320, now + 0.55)

    gain2.gain.setValueAtTime(0.35, now + 0.28)
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.58)

    osc2.connect(gain2)
    gain2.connect(audioCtx.destination)

    osc2.start(now + 0.28)
    osc2.stop(now + 0.58)
  } catch (err) {
    console.warn('[FocusGuardian] Audio buzzer could not play:', err)
  }
}

// ==========================================
// MODEL LOADING (COCO-SSD & TFJS)
// ==========================================
async function loadDetectionModel() {
  if (model || isModelLoading.value) return model

  isModelLoading.value = true
  cameraError.value = null

  try {
    // Dynamic import ensure client-only execution in Nuxt SPA
    await import('@tensorflow/tfjs')
    const cocoSsd = await import('@tensorflow-models/coco-ssd')

    // Load coco-ssd lite mobilenet v2 for fast, low-footprint client inference
    model = await cocoSsd.load({ base: 'lite_mobilenet_v2' })
    isModelReady.value = true
    return model
  } catch (err) {
    console.error('[FocusGuardian] Failed to load COCO-SSD model:', err)
    cameraError.value = 'ไม่สามารถโหลดโมเดล AI ได้ ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
    return null
  } finally {
    isModelLoading.value = false
  }
}

// ==========================================
// WEBCAM STREAM CONTROLS
// ==========================================
async function startCamera() {
  cameraError.value = null

  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    cameraError.value = 'เบราว์เซอร์ของคุณไม่รองรับการเข้าถึงกล้องเว็บแคม'
    return false
  }

  try {
    // Ensure AI model is ready
    if (!model) {
      const loaded = await loadDetectionModel()
      if (!loaded) return false
    }

    // Stop any existing tracks first
    stopCamera()

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { max: 30 }
      },
      audio: false
    })

    mediaStream = stream

    if (videoRef.value) {
      videoRef.value.srcObject = stream
      await new Promise<void>((resolve) => {
        if (!videoRef.value) return resolve()
        videoRef.value.onloadedmetadata = () => {
          videoRef.value?.play().catch(console.warn)
          resolve()
        }
      })
    }

    startDetectionLoop()
    return true
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string }
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      cameraError.value = 'สิทธิ์การเข้าถึงกล้องถูกปฏิเสธ กรุณากดอนุญาตการใช้กล้องในเบราว์เซอร์'
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      cameraError.value = 'ไม่พบอุปกรณ์กล้องเว็บแคมบนเครื่องของคุณ'
    } else {
      cameraError.value = error.message || 'เกิดข้อผิดพลาดในการเปิดกล้อง'
    }
    isActive.value = false
    return false
  }
}

function stopCamera() {
  stopDetectionLoop()

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => {
      try {
        track.stop()
      } catch {
        // Ignore track stop errors
      }
    })
    mediaStream = null
  }

  if (videoRef.value) {
    videoRef.value.srcObject = null
  }

  clearCanvas()
  lastDetectedScore.value = null
}

// ==========================================
// DETECTION LOOP (EVERY 600ms)
// ==========================================
function startDetectionLoop() {
  stopDetectionLoop()

  detectionIntervalId = setInterval(async () => {
    if (!isActive.value || !model || isDetecting) return
    const video = videoRef.value
    if (!video || video.readyState < 2) return

    isDetecting = true
    try {
      const predictions = await model.detect(video)

      // Draw bounding boxes on canvas if preview is visible
      if (showPreview.value && canvasRef.value) {
        drawPredictions(predictions, video)
      }

      // Check if cooldown period is active
      if (cooldownSeconds.value > 0) {
        return
      }

      // Filter for 'cell phone' class with score >= 0.6
      const phoneMatch = predictions.find((p) => {
        const className = p.class.toLowerCase().trim()
        return className === 'cell phone' && p.score >= CONFIDENCE_THRESHOLD
      })

      if (phoneMatch) {
        lastDetectedScore.value = phoneMatch.score
        // Only trigger penalty if modal is not currently open
        if (!isAlertOpen.value) {
          triggerPenalty(phoneMatch)
        }
      } else {
        lastDetectedScore.value = null
      }
    } catch (err) {
      console.warn('[FocusGuardian] Detection frame error:', err)
    } finally {
      isDetecting = false
    }
  }, DETECTION_INTERVAL_MS)
}

function stopDetectionLoop() {
  if (detectionIntervalId !== null) {
    clearInterval(detectionIntervalId)
    detectionIntervalId = null
  }
  isDetecting = false
}

// ==========================================
// CANVAS BOUNDING BOX RENDERING
// ==========================================
function drawPredictions(predictions: DetectedObject[], video: HTMLVideoElement) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Sync canvas size with video aspect ratio
  if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  for (const pred of predictions) {
    const isPhone = pred.class.toLowerCase() === 'cell phone' && pred.score >= CONFIDENCE_THRESHOLD
    const [x, y, width, height] = pred.bbox

    // Styling
    ctx.lineWidth = isPhone ? 4 : 2
    ctx.strokeStyle = isPhone ? '#f43f5e' : 'rgba(168, 85, 247, 0.6)'
    ctx.fillStyle = isPhone ? 'rgba(244, 63, 94, 0.2)' : 'rgba(168, 85, 247, 0.1)'

    // Draw box
    ctx.beginPath()
    ctx.roundRect(x, y, width, height, 8)
    ctx.fill()
    ctx.stroke()

    // Label tag
    const labelText = `${isPhone ? '📱 CELL PHONE' : pred.class} (${Math.round(pred.score * 100)}%)`
    ctx.font = 'bold 14px "JetBrains Mono", ui-monospace, sans-serif'
    const textWidth = ctx.measureText(labelText).width

    ctx.fillStyle = isPhone ? '#f43f5e' : '#9333ea'
    ctx.beginPath()
    ctx.roundRect(x, y > 24 ? y - 24 : y, textWidth + 12, 22, 4)
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.fillText(labelText, x + 6, y > 24 ? y - 8 : y + 16)
  }
}

function clearCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
}

// ==========================================
// PENALTY & ALERT ACTIONS
// ==========================================
function triggerPenalty(detection: DetectedObject) {
  // 1. Increment Distraction Counter
  distractionCount.value++
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, String(distractionCount.value))
    } catch {
      // Ignore storage errors
    }
  }

  // 2. Randomize savage quote
  const randomIndex = Math.floor(Math.random() * SAVAGE_QUOTES.length)
  currentQuote.value = SAVAGE_QUOTES[randomIndex]
  currentConfidence.value = Math.round(detection.score * 100)

  // 3. Play buzzer warning
  playBuzzerAlert()

  // 4. Open Panic Modal
  isAlertOpen.value = true
}

function dismissAlert() {
  isAlertOpen.value = false

  // Start Grace Period Cooldown (e.g. 4 seconds) to let user put their phone down
  startCooldown(COOLDOWN_DURATION)
}

function startCooldown(seconds: number) {
  if (cooldownTimer) {
    clearInterval(cooldownTimer)
  }
  cooldownSeconds.value = seconds
  cooldownTimer = setInterval(() => {
    cooldownSeconds.value--
    if (cooldownSeconds.value <= 0) {
      if (cooldownTimer) clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }, 1000)
}

function resetCounter() {
  distractionCount.value = 0
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore storage errors
    }
  }
}

// ==========================================
// TOGGLE FOCUS GUARDIAN
// ==========================================
async function toggleGuardian() {
  if (isActive.value) {
    isActive.value = false
    stopCamera()
  } else {
    isActive.value = true
    const success = await startCamera()
    if (!success) {
      isActive.value = false
    }
  }
}

// ==========================================
// LIFECYCLE HOOKS
// ==========================================
onMounted(async () => {
  // Load persisted distraction count
  if (typeof localStorage !== 'undefined') {
    try {
      const savedCount = localStorage.getItem(STORAGE_KEY)
      if (savedCount) {
        distractionCount.value = parseInt(savedCount, 10) || 0
      }
    } catch {
      // Ignore storage errors
    }
  }

  // Pre-load TensorFlow.js model in background
  loadDetectionModel()
})

onBeforeUnmount(() => {
  // Prevent memory leaks
  stopCamera()

  if (cooldownTimer) {
    clearInterval(cooldownTimer)
    cooldownTimer = null
  }

  if (audioCtx && audioCtx.state !== 'closed') {
    try {
      audioCtx.close()
    } catch {
      // Ignore audio close error
    }
    audioCtx = null
  }
})
</script>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}

.animate-shake {
  animation: shake 0.4s ease-in-out;
}
</style>

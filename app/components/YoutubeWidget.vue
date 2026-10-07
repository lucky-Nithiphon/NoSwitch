<template>
  <section class="widget" aria-labelledby="yt-title">
    <div class="widget-header">
      <h2 id="yt-title" class="flex items-center gap-2"><span>📺</span> YouTube Player</h2>
      <span v-if="videoId" class="text-xs font-normal text-ink-500">{{ isPlaying ? 'กำลังเล่น' : 'หยุดชั่วคราว' }}</span>
    </div>

    <div class="widget-body flex flex-col gap-3">
      <form class="flex gap-2" @submit.prevent="loadFromInput">
        <input
          id="yt-url-input"
          v-model="input"
          class="input"
          placeholder="วาง YouTube URL หรือ Video ID…"
          aria-label="YouTube URL หรือ Video ID"
        />
        <button id="yt-load-btn" type="submit" class="btn btn-primary shrink-0">โหลด</button>
      </form>
      <p v-if="error" class="-mt-1 text-xs text-rose-400">{{ error }}</p>

      <div class="relative min-h-[180px] flex-1 overflow-hidden rounded-xl bg-black/40 ring-1 ring-white/5">
        <div v-show="videoId" class="absolute inset-0">
          <div ref="playerEl" class="h-full w-full" />
        </div>
        <div v-if="!videoId" class="absolute inset-0 grid place-items-center text-center text-sm text-ink-500">
          <div>
            <div class="mb-2 text-4xl opacity-60">🎧</div>
            ใส่ลิงก์เพลง Lo-fi หรือคลิปติวเพื่อเริ่มต้น
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button id="yt-play-btn" class="btn btn-ghost w-24" :disabled="!ready" @click="togglePlay">
          {{ isPlaying ? '⏸ Pause' : '▶ Play' }}
        </button>
        <button id="yt-mute-btn" class="btn btn-ghost px-3" :disabled="!ready" :aria-label="volume === 0 ? 'เปิดเสียง' : 'ปิดเสียง'" @click="toggleMute">
          {{ volume === 0 ? '🔇' : volume < 50 ? '🔉' : '🔊' }}
        </button>
        <input
          id="yt-volume"
          v-model.number="volume"
          type="range"
          min="0"
          max="100"
          class="h-1.5 flex-1 cursor-pointer accent-[hsl(258_90%_72%)]"
          :disabled="!ready"
          aria-label="ระดับเสียง"
        />
        <span class="w-8 text-right font-mono text-xs tabular-nums text-ink-500">{{ volume }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady?: () => void
  }
}

const videoId = useLocalStorage<string>('noswitch:yt:videoId', '')
const volume = useLocalStorage<number>('noswitch:yt:volume', 60)
const input = ref('')
const error = ref('')
const playerEl = ref<HTMLElement | null>(null)
const ready = ref(false)
const isPlaying = ref(false)
let player: any = null
let lastVolume = 60

function parseVideoId(text: string): string | null {
  const s = text.trim()
  if (/^[\w-]{11}$/.test(s)) return s
  try {
    const url = new URL(s)
    if (url.hostname.includes('youtu.be')) return url.pathname.slice(1, 12) || null
    if (url.searchParams.get('v')) return url.searchParams.get('v')
    const m = url.pathname.match(/\/(embed|shorts|live)\/([\w-]{11})/)
    if (m) return m[2] ?? null
  } catch { /* not a URL */ }
  return null
}

function loadYouTubeApi(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT?.Player) return resolve()
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve() }
    if (!document.getElementById('yt-iframe-api')) {
      const tag = document.createElement('script')
      tag.id = 'yt-iframe-api'
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }
  })
}

async function createPlayer(id: string) {
  await loadYouTubeApi()
  if (player) {
    player.loadVideoById(id)
    return
  }
  player = new window.YT.Player(playerEl.value, {
    videoId: id,
    width: '100%',
    height: '100%',
    playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
    events: {
      onReady: () => {
        ready.value = true
        player.setVolume(volume.value)
      },
      onStateChange: (e: any) => {
        isPlaying.value = e.data === window.YT.PlayerState.PLAYING
      },
    },
  })
}

function loadFromInput() {
  const id = parseVideoId(input.value)
  if (!id) {
    error.value = 'ไม่พบ Video ID — ตรวจสอบลิงก์อีกครั้ง'
    return
  }
  error.value = ''
  videoId.value = id
  input.value = ''
  createPlayer(id)
}

function togglePlay() {
  if (!player) return
  isPlaying.value ? player.pauseVideo() : player.playVideo()
}

function toggleMute() {
  if (volume.value === 0) volume.value = lastVolume || 60
  else { lastVolume = volume.value; volume.value = 0 }
}

watch(volume, (v) => { if (ready.value) player?.setVolume(v) })

onMounted(() => {
  if (videoId.value) createPlayer(videoId.value)
})

onBeforeUnmount(() => {
  player?.destroy?.()
  player = null
})
</script>

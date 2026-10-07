<template>
  <section class="widget relative flex flex-col" aria-labelledby="chat-title">
    <!-- Header -->
    <div class="widget-header border-b border-white/[0.06] bg-ink-900/40">
      <div class="flex items-center gap-2">
        <span class="text-lg">🤖</span>
        <h2 id="chat-title" class="font-semibold text-white/90">AI Study Assistant</h2>
        <span
          class="h-2 w-2 rounded-full transition-colors"
          :class="apiKey ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'"
          :title="apiKey ? 'พร้อมใช้งาน (มี API Key แล้ว)' : 'กรุณาตั้งค่า API Key'"
        />
      </div>

      <div class="flex items-center gap-1.5">
        <!-- Clear Chat Button -->
        <button
          id="chat-clear-btn"
          class="btn-ghost rounded-lg px-2 py-1 text-xs text-ink-300 hover:text-white transition"
          :disabled="!messages.length || loading"
          title="ล้างประวัติการสนทนา"
          @click="clearChat"
        >
          🗑 ล้างแชท
        </button>

        <!-- Settings / API Key Button -->
        <button
          id="chat-settings-btn"
          class="btn-ghost rounded-lg p-1.5 text-ink-300 hover:text-white transition"
          :class="{ 'text-accent border-accent/40 bg-accent/10': showSettings || !apiKey }"
          title="ตั้งค่า Gemini API Key"
          @click="showSettings = !showSettings"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- API Key Settings Bar / Dropdown -->
    <Transition
      enter-from-class="opacity-0 -translate-y-2"
      leave-to-class="opacity-0 -translate-y-2"
      enter-active-class="transition duration-200 ease-out"
      leave-active-class="transition duration-150 ease-in"
    >
      <div
        v-if="showSettings"
        class="border-b border-white/[0.08] bg-ink-800/95 p-3.5 backdrop-blur-md shadow-lg"
      >
        <div class="flex items-center justify-between mb-2">
          <label for="gemini-key-input" class="text-xs font-semibold text-white flex items-center gap-1.5">
            🔑 Gemini API Key (บันทึกลงเครื่องอัตโนมัติ)
          </label>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[11px] text-accent hover:underline flex items-center gap-0.5"
          >
            ขอ Key ฟรีที่ AI Studio ↗
          </a>
        </div>

        <div class="flex items-center gap-2">
          <div class="relative flex-1">
            <input
              id="gemini-key-input"
              v-model="keyInput"
              :type="showKeyText ? 'text' : 'password'"
              class="input text-xs pr-9 py-1.5"
              placeholder="วาง API Key เช่น AIzaSy..."
              @keyup.enter="saveKey"
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300 text-xs"
              :title="showKeyText ? 'ซ่อน Key' : 'แสดง Key'"
              @click="showKeyText = !showKeyText"
            >
              {{ showKeyText ? '🙈' : '👁' }}
            </button>
          </div>

          <button
            class="btn btn-primary px-3 py-1.5 text-xs font-medium shrink-0"
            :disabled="!keyInput.trim() || keyInput === apiKey"
            @click="saveKey"
          >
            บันทึก
          </button>
          <button
            v-if="apiKey"
            class="btn-ghost rounded-lg px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 shrink-0"
            title="ลบ Key ออกจากเครื่อง"
            @click="removeKey"
          >
            ลบ Key
          </button>
        </div>

        <p class="mt-2 text-[11px] text-ink-500">
          * Key จะถูกเก็บใน LocalStorage บนเบราว์เซอร์ของคุณเท่านั้น ปลอดภัย ไม่ถูกส่งไปยัง Backend อื่น
        </p>
      </div>
    </Transition>

    <!-- Chat Messages Body -->
    <div class="widget-body flex flex-1 min-h-0 flex-col gap-3 pt-3">
      <!-- No Key Notice Banner -->
      <div
        v-if="!apiKey"
        class="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200/90 flex items-start gap-2.5"
      >
        <span class="text-base shrink-0">⚠️</span>
        <div class="flex-1">
          <p class="font-medium text-amber-100">ยังไม่ได้ระบุ Gemini API Key</p>
          <p class="mt-0.5 text-amber-200/80">
            กรุณาคลิกที่ปุ่ม <strong class="text-white">⚙️ ตั้งค่า</strong> ด้านบนเพื่อใส่ API Key หรือ
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              class="underline text-amber-300 hover:text-white font-medium"
            >
              รับ Key ฟรีจาก Google AI Studio
            </a>
          </p>
        </div>
      </div>

      <!-- Messages Scroll Area -->
      <div
        ref="scrollEl"
        class="scroll-thin -mr-2 flex-1 space-y-3 overflow-y-auto pr-2"
        aria-live="polite"
      >
        <!-- Empty State -->
        <div
          v-if="!messages.length"
          class="flex h-full flex-col items-center justify-center gap-3.5 text-center py-6"
        >
          <div class="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent-2/20 text-2xl ring-1 ring-white/10 shadow-lg">
            📖
          </div>
          <div>
            <p class="font-semibold text-white text-sm">พร้อมช่วยติวและตอบคำถามแล้ว!</p>
            <p class="text-xs text-ink-500 mt-0.5">ถามเนื้อหาที่สงสัย สรุปบทเรียน หรือให้ช่วยอธิบายวิธีแก้โจทย์</p>
          </div>

          <div class="flex flex-wrap justify-center gap-1.5 max-w-sm mt-1">
            <button
              v-for="(s, i) in samplePrompts"
              :id="`chat-prompt-${i}`"
              :key="s"
              class="cursor-pointer rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-ink-300 transition hover:border-accent/40 hover:text-white hover:bg-white/[0.06]"
              @click="send(s)"
            >
              {{ s }}
            </button>
          </div>
        </div>

        <!-- Chat Bubbles -->
        <div
          v-for="(m, i) in messages"
          :key="i"
          class="flex animate-fade-up"
          :class="m.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
            :class="m.role === 'user'
              ? 'rounded-br-md bg-gradient-to-br from-accent to-[hsl(258_80%_60%)] text-white shadow-md'
              : m.error
                ? 'rounded-bl-md border border-rose-500/40 bg-rose-500/15 text-rose-200'
                : 'rounded-bl-md border border-white/[0.06] bg-ink-800/80 text-ink-300 shadow-sm'"
          >
            <div v-if="m.role === 'assistant'" class="chat-md" v-html="renderMarkdown(m.content)" />
            <p v-else class="whitespace-pre-wrap break-words">{{ m.content }}</p>
          </div>
        </div>

        <!-- Typing Indicator / Loading State -->
        <div v-if="loading" class="flex justify-start animate-fade-up">
          <div class="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/[0.06] bg-ink-800/80 px-4 py-3">
            <span class="text-xs text-ink-500 mr-1">ติวเตอร์กำลังคิด</span>
            <span v-for="d in 3" :key="d" class="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" :style="{ animationDelay: `${d * 140}ms` }" />
          </div>
        </div>
      </div>

      <!-- Chat Input Form -->
      <form class="flex items-end gap-2 pt-1" @submit.prevent="send()">
        <textarea
          id="chat-input"
          ref="inputEl"
          v-model="input"
          rows="1"
          class="input scroll-thin max-h-32 resize-none text-sm"
          placeholder="พิมพ์คำถามที่สงสัย... (Enter ส่ง, Shift+Enter ขึ้นบรรทัด)"
          aria-label="ข้อความถึงติวเตอร์ AI"
          :disabled="loading"
          @keydown.enter.exact.prevent="send()"
          @input="autoGrow"
        />
        <button
          id="chat-send-btn"
          type="submit"
          class="btn btn-primary h-[42px] px-4 shrink-0"
          :disabled="!input.trim() || loading || !apiKey"
          aria-label="ส่งข้อความ"
        >
          <span v-if="loading" class="inline-block animate-spin">⏳</span>
          <span v-else>➤</span>
        </button>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, watch } from 'vue'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  error?: boolean
}

// System instruction กำหนดบทบาทติวเตอร์ส่วนตัว
const SYSTEM_INSTRUCTION =
  'คุณคือติวเตอร์ส่วนตัวที่ใจดี อธิบายกระชับ เข้าใจง่าย ตอบเป็นภาษาไทยเป็นหลัก เน้นช่วยสรุปบทเรียนและแก้โจทย์อย่างเป็นขั้นตอน'

// Sample prompts
const samplePrompts = [
  'สรุปใจความสำคัญของเรื่องนี้',
  'อธิบายวิธีทำโจทย์ข้อนี้ให้หน่อย',
  'เทคนิคการจำสูตรคณิตศาสตร์',
]

// State จัดการ API Key
const apiKey = useLocalStorage<string>('noswitch:gemini:apiKey', '')
const keyInput = ref('')
const showKeyText = ref(false)
const showSettings = ref(false)

// State แชท
const messages = useLocalStorage<ChatMessage[]>('noswitch:chat:messages', [])
const input = ref('')
const loading = ref(false)
const scrollEl = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLTextAreaElement | null>(null)

// ซิงค์ input กับ apiKey ปัจจุบัน
watch(
  apiKey,
  (val) => {
    keyInput.value = val || ''
  },
  { immediate: true },
)

function saveKey() {
  const trimmed = keyInput.value.trim()
  if (!trimmed) return
  apiKey.value = trimmed
  showSettings.value = false
}

function removeKey() {
  if (confirm('คุณต้องการลบ API Key ออกจากเครื่องนี้ใช่หรือไม่?')) {
    apiKey.value = ''
    keyInput.value = ''
  }
}

async function scrollToBottom() {
  await nextTick()
  if (scrollEl.value) {
    scrollEl.value.scrollTo({ top: scrollEl.value.scrollHeight, behavior: 'smooth' })
  }
}

function autoGrow() {
  const el = inputEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 128)}px`
}

function clearChat() {
  if (confirm('ล้างประวัติการสนทนาทั้งหมด?')) {
    messages.value = []
  }
}

async function send(customText?: string) {
  const content = (customText ?? input.value).trim()
  if (!content || loading.value) return

  if (!apiKey.value) {
    showSettings.value = true
    messages.value.push({
      role: 'assistant',
      content: '⚠️ กรุณาระบุ Gemini API Key ก่อนเริ่มใช้งาน โดยคลิกที่ปุ่มตั้งค่า (⚙️) ด้านบน',
      error: true,
    })
    scrollToBottom()
    return
  }

  messages.value.push({ role: 'user', content })
  input.value = ''
  nextTick(autoGrow)
  loading.value = true
  scrollToBottom()

  try {
    const promptText = `System Instruction: ${SYSTEM_INSTRUCTION}\n\nคำถาม: ${content}`

    // เรียก Gemini API ตรงจาก Client-side (gemini-1.5-flash)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(
      apiKey.value,
    )}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: promptText }],
          },
        ],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      const errDetail = data?.error?.message || `HTTP ${response.status}: ${response.statusText}`
      throw new Error(errDetail)
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') ||
      'ขออภัย ไม่พบคำตอบจากติวเตอร์ ลองถามใหม่อีกครั้งนะครับ'

    messages.value.push({ role: 'assistant', content: reply })
  } catch (err: any) {
    let errMsg = err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ'

    // ปรับข้อความ Error ให้เข้าใจง่าย
    if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid')) {
      errMsg = 'API Key ไม่ถูกต้อง กรุณาตรวจสอบหรือขอ Key ใหม่ที่ Google AI Studio'
    } else if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota')) {
      errMsg = 'โควตาการใช้งานของ API Key เต็มชั่วคราว กรุณารอสักครู่แล้วลองใหม่'
    } else if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError')) {
      errMsg = 'ไม่สามารถเชื่อมต่ออินเทอร์เน็ตได้ กรุณาตรวจสอบเครือข่ายของคุณ'
    }

    messages.value.push({
      role: 'assistant',
      content: `⚠️ เกิดข้อผิดพลาด: ${errMsg}`,
      error: true,
    })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

/**
 * ฟังก์ชันแปลง Markdown ย่อยอย่างปลอดภัย พร้อม Escape HTML เพื่อป้องกัน XSS
 */
function renderMarkdown(src: string): string {
  if (!src || typeof src !== 'string') return ''

  const esc = src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const blocks: string[] = []

  let html = esc.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, _lang, code) => {
    blocks.push(`<pre><code>${code.trimEnd()}</code></pre>`)
    return `\u0000${blocks.length - 1}\u0000`
  })

  html = html
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/^#{1,6}\s+(.+)$/gm, '<strong class="block mt-1 text-white">$1</strong>')
    .replace(/^\s*[-*]\s+(.+)$/gm, '<span class="block pl-4 -indent-3">• $1</span>')
    .replace(/^\s*(\d+)\.\s+(.+)$/gm, '<span class="block pl-4 -indent-4">$1. $2</span>')
    .replace(/\n/g, '<br>')
    .replace(/(<\/span>)<br>/g, '$1')

  return html.replace(/\u0000(\d+)\u0000/g, (_, i) => blocks[+i]!)
}

onMounted(() => {
  scrollToBottom()
  if (!apiKey.value) {
    showSettings.value = true
  }
})
</script>

<style scoped>
.chat-md :deep(code) {
  font-family: var(--font-mono, monospace);
  font-size: 0.85em;
  background: hsl(228 20% 12%);
  padding: 0.1em 0.35em;
  border-radius: 0.35rem;
  color: hsl(190 85% 70%);
}
.chat-md :deep(pre) {
  margin: 0.5rem 0;
  padding: 0.75rem;
  background: hsl(228 22% 7%);
  border-radius: 0.6rem;
  overflow-x: auto;
}
.chat-md :deep(pre code) {
  background: none;
  padding: 0;
  color: hsl(228 10% 80%);
}
.chat-md :deep(strong) {
  color: white;
}
</style>

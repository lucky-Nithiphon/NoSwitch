<template>
  <section class="widget" aria-labelledby="chat-title">
    <div class="widget-header">
      <h2 id="chat-title" class="flex items-center gap-2">
        <span>🤖</span> AI Study Assistant
        <span class="h-2 w-2 rounded-full bg-rest shadow-[0_0_8px_hsl(152_60%_55%)]" aria-hidden="true" />
      </h2>
      <button
        id="chat-clear-btn"
        class="btn btn-ghost px-2.5 py-1 text-xs"
        :disabled="!messages.length || loading"
        @click="clearChat"
      >
        🗑 Clear Chat
      </button>
    </div>

    <div class="widget-body flex flex-col gap-3">
      <div ref="scrollEl" class="scroll-thin -mr-2 flex-1 space-y-3 overflow-y-auto pr-2" aria-live="polite">
        <!-- Empty state -->
        <div v-if="!messages.length" class="flex h-full flex-col items-center justify-center gap-4 text-center">
          <div class="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent-2/20 text-3xl ring-1 ring-white/10">🤖</div>
          <div>
            <p class="font-medium text-white">มีอะไรสงสัยถามได้เลย</p>
            <p class="text-xs text-ink-500">ไม่ต้องสลับแท็บ ไม่ต้องหยิบมือถือ</p>
          </div>
          <div class="flex flex-wrap justify-center gap-2">
            <button
              v-for="(s, i) in suggestions"
              :id="`chat-suggestion-${i}`"
              :key="s"
              class="cursor-pointer rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-ink-300 transition hover:border-accent/40 hover:text-white"
              @click="send(s)"
            >
              {{ s }}
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div
          v-for="(m, i) in messages"
          :key="i"
          class="flex animate-fade-up"
          :class="m.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
            :class="m.role === 'user'
              ? 'rounded-br-md bg-gradient-to-br from-accent to-[hsl(258_80%_60%)] text-white'
              : m.error
                ? 'rounded-bl-md border border-rose-500/30 bg-rose-500/10 text-rose-200'
                : 'rounded-bl-md border border-white/[0.06] bg-ink-800/80 text-ink-300'"
          >
            <div v-if="m.role === 'assistant'" class="chat-md" v-html="renderMarkdown(m.content)" />
            <p v-else class="whitespace-pre-wrap break-words">{{ m.content }}</p>
          </div>
        </div>

        <!-- Typing indicator -->
        <div v-if="loading" class="flex justify-start">
          <div class="flex gap-1 rounded-2xl rounded-bl-md border border-white/[0.06] bg-ink-800/80 px-4 py-3.5">
            <span v-for="d in 3" :key="d" class="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-500" :style="{ animationDelay: `${d * 120}ms` }" />
          </div>
        </div>
      </div>

      <form class="flex items-end gap-2" @submit.prevent="send()">
        <textarea
          id="chat-input"
          ref="inputEl"
          v-model="input"
          rows="1"
          class="input scroll-thin max-h-32 resize-none"
          placeholder="พิมพ์คำถาม… (Enter ส่ง, Shift+Enter ขึ้นบรรทัด)"
          aria-label="ข้อความถึง AI"
          @keydown.enter.exact.prevent="send()"
          @input="autoGrow"
        />
        <button id="chat-send-btn" type="submit" class="btn btn-primary h-[42px] shrink-0" :disabled="!input.trim() || loading" aria-label="ส่งข้อความ">
          ➤
        </button>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'

interface Msg { role: 'user' | 'assistant'; content: string; error?: boolean }

const messages = useLocalStorage<Msg[]>('noswitch:chat', [])
const input = ref('')
const loading = ref(false)
const scrollEl = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLTextAreaElement | null>(null)

const suggestions = ['สรุปกฎของนิวตันให้หน่อย', 'อธิบาย Big O แบบง่ายๆ', 'เทคนิคจำศัพท์อังกฤษ']

async function scrollToBottom() {
  await nextTick()
  scrollEl.value?.scrollTo({ top: scrollEl.value.scrollHeight, behavior: 'smooth' })
}

function autoGrow() {
  const el = inputEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 128)}px`
}

async function send(text?: string) {
  const content = (text ?? input.value).trim()
  if (!content || loading.value) return

  messages.value.push({ role: 'user', content })
  input.value = ''
  nextTick(autoGrow)
  loading.value = true
  scrollToBottom()

  try {
    // ส่งประวัติแชท (ไม่รวมข้อความ error) เพื่อให้ AI เข้าใจบริบทต่อเนื่อง
    const history = messages.value.filter((m) => !m.error).map(({ role, content }) => ({ role, content }))
    const res = await $fetch<{ reply: string }>('/api/chat', { method: 'POST', body: { messages: history } })
    messages.value.push({ role: 'assistant', content: res.reply })
  } catch (err: any) {
    const msg = err?.data?.data?.message || err?.data?.message || err?.statusMessage || err?.message || 'เชื่อมต่อไม่สำเร็จ'
    messages.value.push({ role: 'assistant', content: `⚠️ ${msg}`, error: true })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

function clearChat() {
  if (confirm('ล้างประวัติแชททั้งหมด?')) messages.value = []
}

/** Markdown แบบเบาๆ (escape HTML ก่อนเสมอเพื่อป้องกัน XSS) */
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
    .replace(/^#{1,6}\s+(.+)$/gm, '<strong class="block mt-1">$1</strong>')
    .replace(/^\s*[-*]\s+(.+)$/gm, '<span class="block pl-4 -indent-3">• $1</span>')
    .replace(/^\s*(\d+)\.\s+(.+)$/gm, '<span class="block pl-4 -indent-4">$1. $2</span>')
    .replace(/\n/g, '<br>')
    .replace(/(<\/span>)<br>/g, '$1')
  return html.replace(/\u0000(\d+)\u0000/g, (_, i) => blocks[+i]!)
}

onMounted(scrollToBottom)
</script>

<style scoped>
.chat-md :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.85em;
  background: hsl(228 20% 10%);
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
.chat-md :deep(strong) { color: white; }
</style>

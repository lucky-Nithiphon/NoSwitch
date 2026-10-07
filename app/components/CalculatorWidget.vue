<template>
  <section class="widget" aria-labelledby="calc-title">
    <div class="widget-header">
      <h2 id="calc-title" class="flex items-center gap-2"><span>🧮</span> Calculator</h2>
    </div>

    <div class="widget-body flex min-h-0 flex-col gap-2.5">
      <div class="rounded-xl bg-ink-800/80 px-4 py-2 text-right ring-1 ring-white/5">
        <p class="h-4 truncate font-mono text-xs text-ink-500">{{ history }}</p>
        <p id="calc-display" class="truncate font-mono text-2xl font-bold tabular-nums text-white" aria-live="polite">{{ display }}</p>
      </div>

      <div class="grid min-h-0 flex-1 auto-rows-fr grid-cols-4 gap-1.5">
        <button
          v-for="k in keys"
          :id="`calc-key-${k.id}`"
          :key="k.id"
          class="min-h-8 cursor-pointer rounded-xl text-base font-semibold transition-all duration-150 active:scale-95"
          :class="[k.cls, k.wide ? 'col-span-2' : '']"
          :aria-label="k.aria || k.label"
          @click="press(k.value)"
        >
          {{ k.label }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const NUM = 'bg-white/[0.04] text-white hover:bg-white/[0.09]'
const OP = 'bg-accent/15 text-accent hover:bg-accent/25'
const FN = 'bg-white/[0.08] text-ink-300 hover:bg-white/[0.14]'
const EQ = 'bg-gradient-to-br from-accent to-[hsl(258_80%_60%)] text-white shadow-lg shadow-accent/20 hover:brightness-110'

const keys = [
  { id: 'clear', label: 'C', value: 'C', cls: FN, aria: 'เคลียร์' },
  { id: 'back', label: '⌫', value: 'BS', cls: FN, aria: 'ลบตัวสุดท้าย' },
  { id: 'pct', label: '%', value: '%', cls: FN },
  { id: 'div', label: '÷', value: '/', cls: OP },
  { id: '7', label: '7', value: '7', cls: NUM },
  { id: '8', label: '8', value: '8', cls: NUM },
  { id: '9', label: '9', value: '9', cls: NUM },
  { id: 'mul', label: '×', value: '*', cls: OP },
  { id: '4', label: '4', value: '4', cls: NUM },
  { id: '5', label: '5', value: '5', cls: NUM },
  { id: '6', label: '6', value: '6', cls: NUM },
  { id: 'sub', label: '−', value: '-', cls: OP },
  { id: '1', label: '1', value: '1', cls: NUM },
  { id: '2', label: '2', value: '2', cls: NUM },
  { id: '3', label: '3', value: '3', cls: NUM },
  { id: 'add', label: '+', value: '+', cls: OP },
  { id: '0', label: '0', value: '0', cls: NUM, wide: true },
  { id: 'dot', label: '.', value: '.', cls: NUM },
  { id: 'eq', label: '=', value: '=', cls: EQ },
]

const expr = ref('')        // นิพจน์ภายใน เช่น "12+3*4"
const display = ref('0')
const history = ref('')
let justEvaluated = false

const isOp = (c: string) => '+-*/'.includes(c)
const pretty = (s: string) => (s ? s.replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−') : '')

/**
 * Safe evaluator (Shunting-yard) — ไม่ใช้ eval()
 * รองรับ + - * / ลำดับความสำคัญ และเลขติดลบ (unary minus)
 */
function evaluate(input: string): number {
  const tokens: (number | string)[] = []
  const re = /(\d*\.?\d+)|([+\-*/])/g
  let m: RegExpExecArray | null
  let prev: number | string | null = null
  let negate = false
  while ((m = re.exec(input))) {
    if (m[1] !== undefined) {
      const n = parseFloat(m[1]) * (negate ? -1 : 1)
      tokens.push(n); prev = n; negate = false
    } else {
      const op = m[2]!
      if (op === '-' && (prev === null || typeof prev === 'string')) { negate = !negate; continue }
      tokens.push(op); prev = op
    }
  }
  const prec: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 }
  const out: number[] = []
  const ops: string[] = []
  const apply = () => {
    const op = ops.pop()!
    const b = out.pop()!, a = out.pop()!
    if (a === undefined || b === undefined) throw new Error('bad')
    out.push(op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b)
  }
  for (const t of tokens) {
    if (typeof t === 'number') out.push(t)
    else {
      while (ops.length && prec[ops[ops.length - 1]!]! >= prec[t]!) apply()
      ops.push(t)
    }
  }
  while (ops.length) apply()
  if (out.length !== 1 || !isFinite(out[0]!)) throw new Error('bad')
  return out[0]!
}

const fmt = (n: number) => String(parseFloat(n.toPrecision(12)))

function press(v: string) {
  if (v === 'C') { expr.value = ''; display.value = '0'; history.value = ''; justEvaluated = false; return }
  if (v === 'BS') { expr.value = expr.value.slice(0, -1); display.value = pretty(expr.value) || '0'; return }

  if (v === '=') {
    if (!expr.value) return
    let e = expr.value
    while (e && isOp(e.slice(-1))) e = e.slice(0, -1)
    try {
      const r = fmt(evaluate(e))
      history.value = pretty(e) + ' ='
      expr.value = r
      display.value = pretty(r)
      justEvaluated = true
    } catch {
      display.value = 'Error'
      expr.value = ''
    }
    return
  }

  if (v === '%') {
    // แปลงตัวเลขสุดท้ายเป็นเปอร์เซ็นต์
    const m = expr.value.match(/(\d*\.?\d+)$/)
    if (m) expr.value = expr.value.slice(0, -m[1]!.length) + fmt(parseFloat(m[1]!) / 100)
    display.value = pretty(expr.value) || '0'
    return
  }

  if (isOp(v)) {
    justEvaluated = false
    if (!expr.value && v !== '-') return
    const last = expr.value.slice(-1)
    if (isOp(last)) {
      // อนุญาตเลขติดลบหลัง * หรือ / เช่น 5*-2
      if (v === '-' && (last === '*' || last === '/')) expr.value += v
      else expr.value = expr.value.replace(/[+\-*/]+$/, '') + v
    } else expr.value += v
  } else {
    if (justEvaluated) { expr.value = ''; justEvaluated = false }
    if (v === '.') {
      const cur = expr.value.split(/[+\-*/]/).pop() || ''
      if (cur.includes('.')) return
      if (!cur) expr.value += '0'
    }
    expr.value += v
  }
  display.value = pretty(expr.value) || '0'
}

// รองรับการพิมพ์จากคีย์บอร์ด (เมื่อไม่ได้โฟกัสช่อง input อื่น)
function onKey(e: KeyboardEvent) {
  const t = e.target as HTMLElement
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
  const k = e.key
  if (/^[0-9.+\-*/%]$/.test(k)) press(k)
  else if (k === 'Enter' || k === '=') { e.preventDefault(); press('=') }
  else if (k === 'Backspace') press('BS')
  else if (k === 'Escape') press('C')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

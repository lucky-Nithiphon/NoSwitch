<template>
  <div class="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 py-5 sm:px-6 lg:px-8 xl:h-screen xl:min-h-[720px]">
    <!-- Header -->
    <header class="mb-5 flex flex-wrap items-center justify-between gap-3 animate-fade-up">
      <div class="flex items-center gap-3">
        <div class="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-lg font-bold text-ink-950 shadow-lg shadow-accent/30">
          N
        </div>
        <div>
          <h1 class="text-lg font-bold leading-tight text-white">NoSwitch</h1>
          <p class="text-xs text-ink-500">Study Dashboard — ทุกอย่างอยู่ในหน้าเดียว ไม่ต้องสลับแอป</p>
        </div>
      </div>
      <div class="text-right">
        <p class="font-mono text-2xl font-bold tabular-nums text-white">{{ clock }}</p>
        <p class="text-xs text-ink-500">{{ today }}</p>
      </div>
    </header>

    <!-- Dashboard Grid -->
    <main
      class="grid flex-1 grid-cols-1 gap-5 md:grid-cols-2 xl:min-h-0 xl:grid-cols-12 xl:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]"
    >
      <YoutubeWidget class="animate-fade-up xl:col-span-5 xl:row-span-1" style="animation-delay: 50ms" />
      <TimerWidget class="animate-fade-up xl:col-span-3 xl:row-span-1" style="animation-delay: 100ms" />
      <AiChat class="animate-fade-up min-h-[480px] md:col-span-2 xl:col-span-4 xl:row-span-2 xl:min-h-0" style="animation-delay: 150ms" />
      <TodoWidget class="animate-fade-up min-h-[360px] xl:col-span-5 xl:row-span-1 xl:min-h-0" style="animation-delay: 200ms" />
      <CalculatorWidget class="animate-fade-up xl:col-span-3 xl:row-span-1" style="animation-delay: 250ms" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const clock = ref('')
const today = ref('')
let t: ReturnType<typeof setInterval> | undefined

function tick() {
  const now = new Date()
  clock.value = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  today.value = now.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

onMounted(() => {
  tick()
  t = setInterval(tick, 1000)
})
onBeforeUnmount(() => clearInterval(t))
</script>

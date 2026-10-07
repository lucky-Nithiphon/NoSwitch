<template>
  <section class="widget" aria-labelledby="todo-title">
    <div class="widget-header">
      <h2 id="todo-title" class="flex items-center gap-2"><span>📅</span> Study Tasks</h2>
      <span class="text-xs font-normal text-ink-500">{{ doneCount }}/{{ tasks.length }} เสร็จแล้ว</span>
    </div>

    <div class="widget-body flex flex-col gap-3">
      <!-- Progress -->
      <div class="h-1.5 overflow-hidden rounded-full bg-ink-800">
        <div
          class="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-all duration-500"
          :style="{ width: `${tasks.length ? (doneCount / tasks.length) * 100 : 0}%` }"
        />
      </div>

      <form class="flex gap-2" @submit.prevent="addTask">
        <input id="todo-input" v-model="newTask" class="input" placeholder="เพิ่มหัวข้อที่ต้องอ่าน…" aria-label="Task ใหม่" maxlength="200" />
        <button id="todo-add-btn" type="submit" class="btn btn-primary shrink-0" :disabled="!newTask.trim()">+ Add</button>
      </form>

      <div class="flex items-center gap-1 text-xs">
        <button
          v-for="f in filters"
          :id="`todo-filter-${f.key}`"
          :key="f.key"
          class="cursor-pointer rounded-lg px-2.5 py-1 transition"
          :class="filter === f.key ? 'bg-white/10 text-white' : 'text-ink-500 hover:text-ink-300'"
          @click="filter = f.key"
        >
          {{ f.label }}
        </button>
        <button v-if="doneCount" id="todo-clear-done" class="ml-auto cursor-pointer text-ink-500 transition hover:text-rose-400" @click="clearDone">
          ล้างที่เสร็จแล้ว
        </button>
      </div>

      <ul class="scroll-thin -mr-2 flex-1 space-y-1.5 overflow-y-auto pr-2">
        <TransitionGroup
          enter-from-class="opacity-0 -translate-x-2"
          leave-to-class="opacity-0 translate-x-2"
          enter-active-class="transition duration-300"
          leave-active-class="transition duration-200 absolute"
          move-class="transition duration-300"
        >
          <li
            v-for="t in visible"
            :key="t.id"
            class="group flex w-full items-center gap-3 rounded-xl border border-white/[0.04] bg-ink-800/50 px-3 py-2.5 transition hover:border-white/10 hover:bg-ink-800"
          >
            <input
              :id="`todo-check-${t.id}`"
              v-model="t.done"
              type="checkbox"
              class="peer h-4.5 w-4.5 shrink-0 cursor-pointer rounded accent-[hsl(258_90%_72%)]"
            />
            <label :for="`todo-check-${t.id}`" class="flex-1 cursor-pointer text-sm break-words transition" :class="t.done ? 'text-ink-500 line-through' : 'text-white/90'">
              {{ t.text }}
            </label>
            <button
              :id="`todo-delete-${t.id}`"
              class="cursor-pointer rounded-lg p-1 text-ink-500 opacity-0 transition group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-400 focus:opacity-100"
              aria-label="ลบ Task"
              @click="removeTask(t.id)"
            >
              ✕
            </button>
          </li>
        </TransitionGroup>
        <li v-if="!visible.length" class="py-8 text-center text-sm text-ink-500">
          {{ tasks.length ? 'ไม่มีรายการในตัวกรองนี้' : '✨ ยังไม่มี Task — เริ่มวางแผนการอ่านกันเลย' }}
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Task { id: string; text: string; done: boolean; createdAt: number }
type Filter = 'all' | 'active' | 'done'

const tasks = useLocalStorage<Task[]>('noswitch:tasks', [])
const newTask = ref('')
const filter = ref<Filter>('all')
const filters: { key: Filter; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'active', label: 'ยังไม่เสร็จ' },
  { key: 'done', label: 'เสร็จแล้ว' },
]

const doneCount = computed(() => tasks.value.filter((t) => t.done).length)
const visible = computed(() =>
  filter.value === 'all' ? tasks.value : tasks.value.filter((t) => (filter.value === 'done' ? t.done : !t.done)),
)

function addTask() {
  const text = newTask.value.trim()
  if (!text) return
  tasks.value.push({ id: crypto.randomUUID(), text, done: false, createdAt: Date.now() })
  newTask.value = ''
}

function removeTask(id: string) {
  tasks.value = tasks.value.filter((t) => t.id !== id)
}

function clearDone() {
  tasks.value = tasks.value.filter((t) => !t.done)
}
</script>

<template>
  <div class="flex h-full w-full flex-col overflow-hidden text-ink-300">
    <!-- Top Action / Tab Bar & Split View Controls -->
    <div class="flex items-center justify-between border-b border-white/[0.06] bg-ink-800/60 px-3 py-1.5 shrink-0 gap-2">
      <!-- Left: File Tabs -->
      <div class="scroll-thin flex items-center gap-1.5 overflow-x-auto min-w-0 flex-1">
        <!-- Tab Items -->
        <button
          v-for="(doc, idx) in documents"
          :key="doc.id"
          class="group inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition cursor-pointer max-w-[180px] shrink-0"
          :class="activeDocId === doc.id
            ? 'border-accent/40 bg-accent/15 text-white shadow-sm'
            : 'border-white/[0.06] bg-white/[0.03] text-ink-400 hover:border-white/10 hover:text-ink-200'"
          @click="setActiveDoc(doc.id)"
        >
          <span class="text-xs shrink-0">{{ getFileIcon(doc.type) }}</span>
          <span class="truncate text-[11px]">{{ doc.name }}</span>
          <span
            class="ml-0.5 rounded p-0.5 text-[10px] text-ink-500 opacity-60 group-hover:opacity-100 hover:bg-rose-500/20 hover:text-rose-300"
            title="ปิดเอกสารนี้"
            @click.stop="closeDocument(doc.id)"
          >
            ✕
          </span>
        </button>

        <!-- Add File Tab Button (+) -->
        <button
          class="inline-flex items-center gap-1 rounded-lg border border-dashed border-white/[0.15] bg-white/[0.02] px-2 py-1 text-xs text-ink-400 transition hover:border-accent/50 hover:bg-white/[0.06] hover:text-white cursor-pointer shrink-0"
          title="เปิดไฟล์เอกสารใหม่ (PDF / ชีทเรียน)"
          @click="fileInputRef?.click()"
        >
          <span>+</span>
          <span class="text-[11px]">เปิดเอกสาร</span>
        </button>

        <!-- Hidden input for file picking -->
        <input
          ref="fileInputRef"
          type="file"
          accept="application/pdf,text/plain,image/*"
          class="hidden"
          multiple
          @change="onFileSelected"
        />
      </div>

      <!-- Right: Split View Mode Switcher -->
      <div class="flex items-center gap-1 shrink-0">
        <!-- AI Sync Indicator Badge -->
        <button
          v-if="activeDocument"
          type="button"
          class="hidden sm:inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] transition cursor-pointer"
          :class="isAiSyncEnabled
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
            : 'border-white/10 bg-white/5 text-ink-400 hover:bg-white/10 hover:text-ink-200'"
          :title="isAiSyncEnabled ? 'AI กำลังซิงก์กับเอกสารนี้ (คลิกเพื่อปิดซิงก์)' : 'ปิดการซิงก์กับ AI ชั่วคราว (คลิกเพื่อเปิด)'"
          @click="toggleAiSync"
        >
          <span class="h-1.5 w-1.5 rounded-full" :class="isAiSyncEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-ink-500'" />
          <span>{{ isAiSyncEnabled ? 'ซิงก์กับ AI แล้ว' : 'ปิดซิงก์ AI' }}</span>
        </button>

        <!-- Split View Toggle Button (เปิดดูเทียบ 2 ฝั่ง ซ้าย-ขวา) -->
        <button
          v-if="documents.length >= 2"
          class="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition cursor-pointer"
          :class="isSplitView
            ? 'border-accent/50 bg-accent/20 text-accent shadow-[0_0_10px_rgba(168,85,247,0.3)]'
            : 'border-white/[0.08] bg-white/[0.04] text-ink-300 hover:border-accent/40 hover:text-white'"
          :title="isSplitView ? 'สลับกลับเป็นแท็บเดี่ยว' : 'เปิดเทียบ 2 ชีทคู่กัน (Side-by-side Split)'"
          @click="isSplitView = !isSplitView"
        >
          <span>{{ isSplitView ? '▥' : '◫' }}</span>
          <span class="hidden sm:inline text-[11px]">{{ isSplitView ? 'ดูเดี่ยว' : 'เทียบ 2 ชีท' }}</span>
        </button>
      </div>
    </div>

    <!-- Main Viewer Area -->
    <div class="relative flex-1 min-h-0 bg-ink-950/70 overflow-hidden">
      <!-- ============================================== -->
      <!-- MODE 1: SPLIT VIEW (แสดง 2 เอกสารเทียบกัน ซ้าย-ขวา) -->
      <!-- ============================================== -->
      <div v-if="isSplitView && documents.length >= 2" class="flex h-full w-full divide-x divide-white/[0.08]">
        <!-- Pane 1 (ซ้าย) -->
        <div class="flex flex-1 min-w-0 flex-col overflow-hidden bg-ink-950">
          <div class="flex h-7 items-center justify-between border-b border-white/[0.06] bg-ink-900/60 px-3 text-[11px] text-ink-400 shrink-0">
            <span class="truncate font-medium text-white/90">📘 {{ splitLeftDoc?.name }}</span>
            <select
              v-model="splitLeftId"
              class="rounded bg-ink-800 px-1 py-0.5 text-[10px] text-ink-300 outline-none border border-white/5 cursor-pointer"
            >
              <option v-for="d in documents" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </div>
          <div class="flex-1 min-h-0 overflow-hidden">
            <component :is="renderDocumentContent(splitLeftDoc)" />
          </div>
        </div>

        <!-- Pane 2 (ขวา) -->
        <div class="flex flex-1 min-w-0 flex-col overflow-hidden bg-ink-950">
          <div class="flex h-7 items-center justify-between border-b border-white/[0.06] bg-ink-900/60 px-3 text-[11px] text-ink-400 shrink-0">
            <span class="truncate font-medium text-white/90">📙 {{ splitRightDoc?.name }}</span>
            <select
              v-model="splitRightId"
              class="rounded bg-ink-800 px-1 py-0.5 text-[10px] text-ink-300 outline-none border border-white/5 cursor-pointer"
            >
              <option v-for="d in documents" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </div>
          <div class="flex-1 min-h-0 overflow-hidden">
            <component :is="renderDocumentContent(splitRightDoc)" />
          </div>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- MODE 2: SINGLE ACTIVE TAB VIEW (ดูทีละเอกสารเต็มตา) -->
      <!-- ============================================== -->
      <div v-else-if="activeDocument" class="h-full w-full overflow-hidden">
        <component :is="renderDocumentContent(activeDocument)" />
      </div>

      <!-- ============================================== -->
      <!-- MODE 3: EMPTY DROPZONE STATE (ยังไม่มีไฟล์) -->
      <!-- ============================================== -->
      <div
        v-else
        class="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center border-2 border-dashed border-white/[0.08] rounded-2xl m-3 hover:border-accent/40 transition cursor-pointer"
        @click="fileInputRef?.click()"
        @dragover.prevent
        @drop.prevent="onDropFile"
      >
        <div class="grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-2xl text-accent ring-1 ring-accent/20">
          📑
        </div>
        <div>
          <p class="font-medium text-white text-sm">คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่</p>
          <p class="text-xs text-ink-500 mt-1">
            รองรับ <strong>PDF</strong>, ข้อความสรุป (<strong>.txt</strong>), และรูปภาพชีทเรียน (เปิดได้หลายไฟล์พร้อมกัน)
          </p>
        </div>
        <button
          type="button"
          class="btn btn-primary text-xs px-3 py-1.5 mt-1"
          @click.stop="fileInputRef?.click()"
        >
          เลือกไฟล์จากเครื่อง
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, h } from 'vue'
import { useActiveDocument } from '~/composables/useActiveDocument'

interface DocFile {
  id: string
  name: string
  size: string
  type: 'pdf' | 'text' | 'image'
  url: string
  base64?: string
  text?: string
}

const { setActiveDoc: setSharedActiveDoc, isAiSyncEnabled, toggleAiSync } = useActiveDocument()

const fileInputRef = ref<HTMLInputElement | null>(null)
const documents = ref<DocFile[]>([])
const activeDocId = ref<string | null>(null)
const isSplitView = ref(false)

// ตัวเลือก Split View ซ้าย-ขวา
const splitLeftId = ref<string | null>(null)
const splitRightId = ref<string | null>(null)

const activeDocument = computed(() => {
  return documents.value.find((d) => d.id === activeDocId.value) || documents.value[0] || null
})

// ซิงก์เอกสารที่เปิดอยู่ไปยัง useActiveDocument เพื่อให้ AI Chat เข้าถึงได้ทันที
watch(activeDocument, (doc) => {
  if (doc) {
    setSharedActiveDoc({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      base64: doc.base64,
      text: doc.text,
    })
  } else {
    setSharedActiveDoc(null)
  }
}, { immediate: true, deep: true })

const splitLeftDoc = computed(() => {
  return documents.value.find((d) => d.id === splitLeftId.value) || documents.value[0] || null
})

const splitRightDoc = computed(() => {
  return documents.value.find((d) => d.id === splitRightId.value) || documents.value[1] || null
})

function getFileIcon(type: 'pdf' | 'text' | 'image'): string {
  if (type === 'pdf') return '📕'
  if (type === 'image') return '🖼️'
  return '📝'
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const res = reader.result as string
      const base64 = res.split(',')[1] || ''
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function processFile(file: File) {
  const id = crypto.randomUUID()
  const name = file.name
  const size = formatBytes(file.size)

  let type: 'pdf' | 'text' | 'image' = 'text'
  let url = ''

  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    type = 'pdf'
    url = URL.createObjectURL(file)
    try {
      const base64 = await readFileAsBase64(file)
      addDocToList({ id, name, size, type, url, base64 })
    } catch {
      addDocToList({ id, name, size, type, url })
    }
  } else if (file.type.startsWith('image/')) {
    type = 'image'
    url = URL.createObjectURL(file)
    try {
      const base64 = await readFileAsBase64(file)
      addDocToList({ id, name, size, type, url, base64 })
    } catch {
      addDocToList({ id, name, size, type, url })
    }
  } else {
    // Text / Notes
    type = 'text'
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = (e.target?.result as string) || ''
      addDocToList({ id, name, size, type, url: '', text })
    }
    reader.readAsText(file)
  }
}

function addDocToList(doc: DocFile) {
  documents.value.push(doc)
  activeDocId.value = doc.id

  // ตั้งค่าเริ่มต้น Split view
  if (documents.value.length === 1) {
    splitLeftId.value = doc.id
  } else if (documents.value.length >= 2) {
    if (!splitLeftId.value) splitLeftId.value = documents.value[0]!.id
    splitRightId.value = doc.id
  }
}

function setActiveDoc(id: string) {
  activeDocId.value = id
}

function closeDocument(id: string) {
  const doc = documents.value.find((d) => d.id === id)
  if (doc && doc.url && doc.url.startsWith('blob:')) {
    URL.revokeObjectURL(doc.url)
  }

  documents.value = documents.value.filter((d) => d.id !== id)

  if (activeDocId.value === id) {
    activeDocId.value = documents.value[0]?.id || null
  }

  if (documents.value.length < 2) {
    isSplitView.value = false
  }
}

function onFileSelected(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files) {
    Array.from(target.files).forEach(processFile)
  }
}

function onDropFile(e: DragEvent) {
  if (e.dataTransfer?.files) {
    Array.from(e.dataTransfer.files).forEach(processFile)
  }
}

// Render dynamic content for PDF, Text, or Image
function renderDocumentContent(doc: DocFile | null) {
  if (!doc) return () => h('div', { class: 'p-4 text-xs text-ink-500' }, 'ไม่มีเอกสาร')

  if (doc.type === 'pdf') {
    return () =>
      h('iframe', {
        src: doc.url,
        class: 'h-full w-full border-0 bg-white',
        title: doc.name,
      })
  }

  if (doc.type === 'image') {
    return () =>
      h(
        'div',
        { class: 'scroll-thin flex h-full w-full items-center justify-center overflow-auto p-4 bg-ink-950/90' },
        [
          h('img', {
            src: doc.url,
            alt: doc.name,
            class: 'max-h-full max-w-full rounded-lg shadow-2xl object-contain',
          }),
        ],
      )
  }

  return () =>
    h(
      'div',
      {
        class:
          'scroll-thin h-full w-full overflow-y-auto p-4 text-xs font-mono text-ink-300 leading-relaxed whitespace-pre-wrap select-text bg-ink-900/60',
      },
      doc.text || '',
    )
}

onBeforeUnmount(() => {
  documents.value.forEach((d) => {
    if (d.url && d.url.startsWith('blob:')) {
      URL.revokeObjectURL(d.url)
    }
  })
})
</script>

<style scoped>
/* ปรับแต่งความลื่นไหลของแท็บ */
button {
  user-select: none;
}
</style>

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
        <!-- Document sync indicator badge in header -->
        <button
          v-if="activeDoc"
          type="button"
          class="hidden sm:inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition cursor-pointer"
          :class="isAiSyncEnabled && activeDoc.base64
            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
            : 'bg-white/5 text-ink-400 border border-white/10 hover:bg-white/10'"
          :title="isAiSyncEnabled && activeDoc.base64 ? `กำลังซิงก์กับ ${activeDoc.name} (คลิกเพื่อปิดซิงก์)` : `ไม่ได้ซิงก์กับ ${activeDoc.name} (คลิกเพื่อเปิดซิงก์)`"
          @click="toggleAiSync"
        >
          <span>{{ isAiSyncEnabled && activeDoc.base64 ? '🔗' : '⚪' }}</span>
          <span class="max-w-[100px] truncate">{{ activeDoc.name }}</span>
        </button>
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

    <!-- AI Persona & Model Selector Bar (สไตล์ติวเตอร์ + สมองโมเดล) -->
    <div class="flex flex-wrap items-center justify-between gap-2 px-3.5 py-1.5 border-b border-white/[0.04] bg-ink-900/60 text-[11px] shrink-0 select-none">
      <!-- Persona selector -->
      <div class="flex items-center gap-1.5">
        <span class="text-ink-400 text-[10px] font-medium flex items-center gap-1">
          <span>🎭</span> ติวเตอร์:
        </span>
        <div class="flex items-center gap-1 bg-ink-950/70 p-0.5 rounded-lg border border-white/[0.06]">
          <button
            v-for="persona in AI_PERSONAS"
            :key="persona.id"
            type="button"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition cursor-pointer"
            :class="activePersonaId === persona.id
              ? 'bg-accent/25 text-white border border-accent/40 shadow-sm'
              : 'text-ink-400 hover:text-white hover:bg-white/[0.04] border border-transparent'"
            :title="persona.desc"
            @click="activePersonaId = persona.id"
          >
            <span>{{ persona.icon }}</span>
            <span>{{ persona.name }}</span>
          </button>
        </div>
      </div>

      <!-- Model selector -->
      <div class="flex items-center gap-1.5">
        <span class="text-ink-400 text-[10px] font-medium flex items-center gap-1">
          <span>🧠</span> โมเดล:
        </span>
        <div class="flex items-center gap-1 bg-ink-950/70 p-0.5 rounded-lg border border-white/[0.06]">
          <button
            v-for="m in AI_MODELS"
            :key="m.id"
            type="button"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition cursor-pointer"
            :class="selectedModelId === m.id
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-ink-400 hover:text-white hover:bg-white/[0.04] border border-transparent'"
            :title="m.desc"
            @click="selectedModelId = m.id"
          >
            <span>{{ m.icon }}</span>
            <span>{{ m.name }}</span>
          </button>
        </div>
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
    <div class="widget-body relative flex flex-1 min-h-0 flex-col gap-3 pt-3">
      <!-- Floating Toast Feedback for Note Saved -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 -translate-y-2 scale-95"
      >
        <div
          v-if="toastMsg"
          class="absolute top-2 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-ink-950/95 px-3.5 py-1.5 text-xs font-medium text-emerald-300 shadow-2xl backdrop-blur-xl ring-1 ring-emerald-500/30 whitespace-nowrap animate-fade-up"
        >
          <span>📌</span>
          <span>{{ toastMsg }}</span>
        </div>
      </Transition>

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
            {{ isAiSyncEnabled && activeDoc?.base64 ? (activeDoc.type === 'pdf' ? '📕' : activeDoc.type === 'image' ? '🖼️' : '📑') : '📖' }}
          </div>
          <div>
            <p class="font-semibold text-white text-sm">
              {{ isAiSyncEnabled && activeDoc?.base64 ? `เชื่อมต่อกับ ${activeDoc.name} แล้ว` : 'พร้อมช่วยติวและตอบคำถามแล้ว!' }}
            </p>
            <p class="text-xs text-ink-500 mt-0.5">
              {{ isAiSyncEnabled && activeDoc?.base64 ? 'คลิกปุ่มด้านล่างเพื่อเริ่มถามหรือสั่งให้ AI สรุปชีทนี้ได้ทันที' : 'ถามเนื้อหาที่สงสัย สรุปบทเรียน หรือให้ช่วยอธิบายวิธีแก้โจทย์' }}
            </p>
          </div>

          <div class="flex flex-wrap justify-center gap-1.5 max-w-sm mt-1">
            <button
              v-for="(s, i) in currentPrompts"
              :id="`chat-prompt-${i}`"
              :key="s"
              class="group/chip relative cursor-pointer rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-ink-300 transition hover:border-accent/40 hover:text-white hover:bg-white/[0.06] flex items-center gap-1"
              @click="send(s)"
            >
              <span>{{ s }}</span>
              <span
                v-if="customPrompts.includes(s)"
                class="opacity-0 group-hover/chip:opacity-100 text-rose-400 hover:text-rose-300 ml-0.5 text-[10px] font-bold"
                title="ลบปุ่มลัดนี้"
                @click.stop="removeCustomPrompt(s)"
              >
                ✕
              </span>
            </button>

            <!-- Add custom prompt button -->
            <button
              type="button"
              class="cursor-pointer rounded-full border border-dashed border-white/20 bg-white/[0.02] px-2.5 py-1 text-xs text-accent hover:border-accent hover:bg-accent/10 transition flex items-center gap-1"
              title="เพิ่มปุ่มลัดคำถามส่วนตัวของคุณ"
              @click="openAddPromptModal"
            >
              <span>+ เพิ่มปุ่มลัด</span>
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
            <!-- User Attached Image in Chat Bubble -->
            <div v-if="m.image" class="mb-2 overflow-hidden rounded-xl bg-black/25">
              <img
                :src="m.image"
                alt="รูปที่แนบ"
                class="max-h-60 max-w-full rounded-xl object-contain cursor-pointer transition hover:opacity-90"
                title="คลิกเพื่อดูรูปขนาดเต็ม"
                @click="previewModalImage = m.image"
              />
            </div>
            <!-- User Attached PDF / Document in Chat Bubble -->
            <div
              v-else-if="m.file"
              class="mb-2 flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs border"
              :class="m.file.kind === 'pdf' ? 'bg-rose-500/15 border-rose-500/30 text-rose-100' : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-100'"
            >
              <span class="text-xl shrink-0">{{ m.file.kind === 'pdf' ? '📕' : '📄' }}</span>
              <div class="flex-1 min-w-0">
                <p class="font-semibold truncate">{{ m.file.name }}</p>
                <p class="text-[10px] opacity-75">{{ m.file.kind === 'pdf' ? 'เอกสาร PDF' : 'ไฟล์เอกสาร/โค้ด' }} • {{ m.file.sizeStr }}</p>
              </div>
            </div>
            <div v-if="m.role === 'assistant'" class="chat-md" v-html="renderMarkdown(m.content)" />
            <p v-else-if="m.content" class="whitespace-pre-wrap break-words">{{ m.content }}</p>

            <!-- Action Bar for Assistant Messages (Copy & Save to Scratchpad) -->
            <div
              v-if="m.role === 'assistant' && !m.error"
              class="mt-2 pt-2 border-t border-white/[0.08] flex items-center justify-between gap-2 text-[11px]"
            >
              <div class="flex items-center gap-1.5 text-ink-500 text-[10px]">
                <span>🤖 AI Study Assistant</span>
              </div>
              <div class="flex items-center gap-1">
                <!-- Copy message text -->
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-ink-400 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
                  :title="copiedIndex === i ? 'คัดลอกเรียบร้อย!' : 'คัดลอกข้อความนี้'"
                  @click="copyMessage(m.content, i)"
                >
                  <span class="text-xs">{{ copiedIndex === i ? '✓' : '📋' }}</span>
                  <span class="text-[10px]">{{ copiedIndex === i ? 'คัดลอกแล้ว' : 'คัดลอก' }}</span>
                </button>

                <!-- Save to Scratchpad button -->
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 font-medium transition cursor-pointer active:scale-95"
                  :class="savedNoteIndex === i
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'bg-white/[0.05] text-ink-300 hover:border-accent/40 hover:bg-accent/15 hover:text-white border border-white/[0.06]'"
                  :title="savedNoteIndex === i ? 'บันทึกลง Scratchpad เรียบร้อยแล้ว!' : 'ส่งสรุปข้อความนี้ไปบันทึกใน Quick Scratchpad'"
                  @click="saveToScratchpad(m.content, i)"
                >
                  <span class="text-xs">{{ savedNoteIndex === i ? '✓' : '📌' }}</span>
                  <span class="text-[10px]">{{ savedNoteIndex === i ? 'บันทึกแล้ว' : 'ส่งลงโน้ต' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Prompt Chips under Welcome Greeting (แสดงเมื่อมีข้อความต้อนรับข้อความแรก) -->
        <div
          v-if="messages.length === 1 && messages[0].role === 'assistant'"
          class="flex flex-wrap gap-1.5 pt-1 pl-1 animate-fade-up"
        >
          <button
            v-for="(s, i) in currentPrompts"
            :key="s"
            type="button"
            class="group/chip cursor-pointer rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-ink-300 transition hover:border-accent/40 hover:text-white hover:bg-white/[0.08] active:scale-95 flex items-center gap-1"
            @click="send(s)"
          >
            <span>{{ s }}</span>
            <span
              v-if="customPrompts.includes(s)"
              class="opacity-0 group-hover/chip:opacity-100 text-rose-400 hover:text-rose-300 ml-0.5 text-[10px] font-bold"
              title="ลบปุ่มลัดนี้"
              @click.stop="removeCustomPrompt(s)"
            >
              ✕
            </span>
          </button>
          <button
            type="button"
            class="cursor-pointer rounded-full border border-dashed border-white/20 bg-white/[0.02] px-2.5 py-1 text-xs text-accent hover:border-accent hover:bg-accent/10 transition flex items-center gap-1"
            title="เพิ่มปุ่มลัดคำถามส่วนตัวของคุณ"
            @click="openAddPromptModal"
          >
            <span>+ เพิ่มปุ่มลัด</span>
          </button>
        </div>

        <!-- Typing Indicator / Loading State -->
        <div v-if="loading" class="flex justify-start animate-fade-up">
          <div class="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/[0.06] bg-ink-800/80 px-4 py-3">
            <span class="text-xs text-ink-500 mr-1">ติวเตอร์กำลังคิด</span>
            <span v-for="d in 3" :key="d" class="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" :style="{ animationDelay: `${d * 140}ms` }" />
          </div>
        </div>
      </div>

      <!-- Attached File / Image Preview Box (ก่อนกดส่ง) -->
      <div
        v-if="attachedFile"
        class="flex flex-col gap-1.5 rounded-xl border border-accent/30 bg-accent/10 p-2.5 text-xs animate-fade-up"
      >
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-1.5 font-medium text-accent truncate pr-2">
            <span>{{ attachedFile.kind === 'image' ? '🖼️' : attachedFile.kind === 'pdf' ? '📕' : '📄' }}</span>
            <span class="truncate">แนบไฟล์แล้ว: {{ attachedFile.name }}</span>
            <span class="text-[10px] text-ink-400 shrink-0">({{ attachedFile.sizeStr }})</span>
          </span>
          <button
            type="button"
            class="rounded-md px-1.5 py-0.5 text-ink-400 hover:bg-white/10 hover:text-white cursor-pointer transition shrink-0"
            title="ยกเลิกไฟล์"
            @click="clearAttachedFile"
          >
            ✕ ลบ
          </button>
        </div>
        <div class="flex items-center gap-2.5">
          <img
            v-if="attachedFile.kind === 'image' && attachedFile.previewUrl"
            :src="attachedFile.previewUrl"
            alt="Preview"
            class="h-14 w-14 rounded-lg object-cover ring-1 ring-accent/50 cursor-pointer hover:opacity-90 transition shrink-0"
            title="คลิกเพื่อดูรูปขนาดเต็ม"
            @click="previewModalImage = attachedFile.previewUrl"
          />
          <div
            v-else
            class="grid h-12 w-12 place-items-center rounded-xl bg-ink-800/80 ring-1 ring-white/10 text-2xl shrink-0"
          >
            {{ attachedFile.kind === 'pdf' ? '📕' : '📄' }}
          </div>
          <div class="flex flex-1 flex-wrap gap-1">
            <button
              v-for="qp in quickPromptsForFile"
              :key="qp"
              type="button"
              class="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-ink-300 hover:border-accent/40 hover:text-white hover:bg-accent/10 transition cursor-pointer"
              @click="input = qp"
            >
              {{ qp }}
            </button>
          </div>
        </div>
      </div>

      <!-- Synced Document from Reader Banner (เมื่อไม่มีไฟล์แนบตรงๆ และมี activeDoc) -->
      <div
        v-else-if="activeDoc"
        class="flex flex-col gap-1.5 rounded-xl border p-2.5 text-xs animate-fade-up transition-all"
        :class="isAiSyncEnabled && activeDoc.base64
          ? 'border-emerald-500/40 bg-emerald-500/10'
          : 'border-white/10 bg-white/5 opacity-75'"
      >
        <div class="flex items-center justify-between gap-2">
          <span
            class="flex items-center gap-1.5 font-medium truncate min-w-0"
            :class="isAiSyncEnabled && activeDoc.base64 ? 'text-emerald-300' : 'text-ink-400'"
          >
            <span>{{ activeDoc.type === 'image' ? '🖼️' : activeDoc.type === 'pdf' ? '📕' : '📄' }}</span>
            <span class="truncate">
              {{ isAiSyncEnabled && activeDoc.base64 ? '⚡ ซิงก์กับ:' : '📄 เอกสารใน Reader:' }} {{ activeDoc.name }}
            </span>
            <span class="text-[10px] text-ink-400 shrink-0">({{ activeDoc.size }})</span>
          </span>
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition shrink-0 cursor-pointer"
            :class="isAiSyncEnabled && activeDoc.base64
              ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/35 ring-1 ring-emerald-500/30'
              : 'bg-white/10 text-ink-300 hover:bg-white/20'"
            :title="isAiSyncEnabled ? 'คลิกเพื่อหยุดให้ AI ดูเนื้อหาเอกสารนี้' : 'คลิกเพื่อให้ AI ซิงก์กับเนื้อหาเอกสารนี้'"
            @click="toggleAiSync"
          >
            <span>{{ isAiSyncEnabled && activeDoc.base64 ? '🔗 กำลังซิงก์' : '⚪ ปิดซิงก์' }}</span>
          </button>
        </div>

        <!-- Quick prompts for synced doc -->
        <div v-if="isAiSyncEnabled && activeDoc.base64" class="flex items-center gap-2">
          <div class="grid h-10 w-10 place-items-center rounded-xl bg-emerald-950/50 ring-1 ring-emerald-500/30 text-xl shrink-0">
            {{ activeDoc.type === 'pdf' ? '📑' : activeDoc.type === 'image' ? '🖼️' : '📄' }}
          </div>
          <div class="flex flex-1 flex-wrap gap-1">
            <button
              v-for="qp in quickPromptsForActiveDoc"
              :key="qp"
              type="button"
              class="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-200 hover:border-emerald-400/50 hover:bg-emerald-500/20 transition cursor-pointer"
              @click="input = qp"
            >
              {{ qp }}
            </button>
          </div>
        </div>
      </div>

      <!-- Hidden File Input (รองรับรูปภาพ, PDF, ไฟล์ข้อความ/โค้ด) -->
      <input
        ref="fileInputEl"
        type="file"
        accept="image/*,application/pdf,text/plain,.pdf,.txt,.md,.json,.csv,.py,.js"
        class="hidden"
        @change="onFileSelected"
      />

      <!-- Chat Input Form -->
      <form class="flex items-end gap-1.5 pt-1" @submit.prevent="send()">
        <button
          id="chat-attach-btn"
          type="button"
          class="btn-ghost flex h-[42px] w-[42px] items-center justify-center rounded-xl text-ink-400 hover:bg-white/[0.08] hover:text-white transition shrink-0 cursor-pointer"
          :class="{ 'text-accent border-accent/40 bg-accent/10 shadow-sm': attachedFile }"
          title="แนบรูปภาพหรือไฟล์ PDF/ชีทเรียน (หรือกด Ctrl+V ในกล่องพิมพ์)"
          @click="triggerFileInput"
        >
          <span class="text-base">{{ attachedFile?.kind === 'pdf' ? '📕' : attachedFile?.kind === 'text' ? '📄' : '📎' }}</span>
        </button>
        <textarea
          id="chat-input"
          ref="inputEl"
          v-model="input"
          rows="1"
          class="input scroll-thin max-h-32 resize-none text-sm"
          :placeholder="attachedFile ? 'ถามเกี่ยวกับไฟล์นี้ หรือกดส่งได้เลย...' : (isAiSyncEnabled && activeDoc?.base64) ? `ถามเกี่ยวกับ ${activeDoc.name}... (ซิงก์อยู่)` : 'พิมพ์คำถาม, แนบไฟล์ PDF/ชีท หรือกด Ctrl+V...'"
          aria-label="ข้อความถึงติวเตอร์ AI"
          :disabled="loading"
          @keydown.enter.exact.prevent="send()"
          @paste="onPaste"
          @input="autoGrow"
        />
        <button
          id="chat-send-btn"
          type="submit"
          class="btn btn-primary h-[42px] px-4 shrink-0"
          :disabled="(!input.trim() && !attachedFile && !(isAiSyncEnabled && activeDoc?.base64)) || loading || !apiKey"
          aria-label="ส่งข้อความ"
        >
          <span v-if="loading" class="inline-block animate-spin">⏳</span>
          <span v-else>➤</span>
        </button>
      </form>
    </div>

    <!-- Image Fullscreen Preview Modal -->
    <div
      v-if="previewModalImage"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none"
      @click="previewModalImage = null"
    >
      <div class="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl bg-ink-900 border border-white/10 p-2 shadow-2xl" @click.stop>
        <button
          class="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white hover:bg-rose-500 transition cursor-pointer z-10"
          title="ปิด"
          @click="previewModalImage = null"
        >
          ✕
        </button>
        <img :src="previewModalImage" alt="รูปขยาย" class="max-h-[82vh] max-w-full rounded-xl object-contain" />
      </div>
    </div>

    <!-- Add Custom Prompt Modal -->
    <Teleport to="body">
      <div
        v-if="isAddPromptModalOpen"
        class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in"
        @click.self="isAddPromptModalOpen = false"
      >
        <div class="w-full max-w-xs rounded-3xl border border-white/[0.1] bg-ink-950 p-4 shadow-2xl text-xs space-y-3 animate-scale-up">
          <div class="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
            <span class="font-bold text-xs text-white flex items-center gap-1.5">
              <span>✨</span> เพิ่มปุ่มลัดคำถามส่วนตัว
            </span>
            <button type="button" class="text-ink-400 hover:text-white cursor-pointer" @click="isAddPromptModalOpen = false">✕</button>
          </div>
          <div>
            <label class="block text-ink-400 text-[10px] mb-1 font-medium">ข้อความคำถามที่ต้องการถามบ่อยๆ:</label>
            <input
              v-model="newPromptInput"
              type="text"
              placeholder="เช่น ช่วยแต่งประโยคตัวอย่าง, สรุปสูตรเคมี"
              class="input w-full text-xs py-2 px-3"
              autofocus
              @keyup.enter="addCustomPrompt"
            />
          </div>
          <div class="flex gap-2 pt-1">
            <button type="button" class="btn-ghost flex-1 py-1.5 text-xs rounded-xl cursor-pointer" @click="isAddPromptModalOpen = false">ยกเลิก</button>
            <button type="button" class="btn btn-primary flex-1 py-1.5 text-xs rounded-xl cursor-pointer" @click="addCustomPrompt">บันทึกปุ่มลัด</button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useActiveDocument } from '~/composables/useActiveDocument'
import { useScratchpad } from '~/composables/useScratchpad'

// Composable for syncing notes with Quick Scratchpad
const { appendToScratchpad } = useScratchpad()

const copiedIndex = ref<number | null>(null)
const savedNoteIndex = ref<number | null>(null)
const toastMsg = ref('')
let toastTimeout: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string) {
  toastMsg.value = msg
  if (toastTimeout) clearTimeout(toastTimeout)
  toastTimeout = setTimeout(() => {
    toastMsg.value = ''
  }, 2400)
}

async function copyMessage(content: string, index: number) {
  try {
    await navigator.clipboard.writeText(content)
    copiedIndex.value = index
    showToast('คัดลอกข้อความเรียบร้อยแล้ว 📋')
    setTimeout(() => {
      if (copiedIndex.value === index) copiedIndex.value = null
    }, 2000)
  } catch (err) {
    console.warn('Failed to copy text', err)
  }
}

function saveToScratchpad(content: string, index: number) {
  appendToScratchpad(content)
  savedNoteIndex.value = index
  showToast('บันทึกลง Quick Scratchpad เรียบร้อยแล้ว! 📝')
  setTimeout(() => {
    if (savedNoteIndex.value === index) savedNoteIndex.value = null
  }, 2500)
}

interface AttachedFile {
  name: string
  kind: 'image' | 'pdf' | 'text'
  mimeType: string
  previewUrl?: string // for image thumbnail
  base64?: string // for inlineData
  textContent?: string // for text/code files
  sizeStr: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  image?: string // Base64 data URL
  file?: {
    name: string
    kind: 'image' | 'pdf' | 'text'
    sizeStr: string
  }
  error?: boolean
}

// Global active document state from Document Reader
const { activeDoc, isAiSyncEnabled, toggleAiSync } = useActiveDocument()

interface AiPersona {
  id: string
  name: string
  icon: string
  desc: string
  instruction: string
}

const AI_PERSONAS: AiPersona[] = [
  {
    id: 'academic',
    name: 'วิชาการ',
    icon: '👨‍🏫',
    desc: 'อธิบายละเอียด ลึกซึ้ง มีหลักการและสูตรครบถ้วน',
    instruction: 'คุณคือติวเตอร์วิชาการระดับอาจารย์ผู้เชี่ยวชาญ อธิบายเนื้อหาอย่างละเอียด ลึกซึ้ง มีหลักการ เหตุผล และสูตรทางคณิตศาสตร์/วิทยาศาสตร์อย่างถูกต้องสมบูรณ์ พร้อมยกตัวอย่างประกอบขั้นตอนอย่างชัดเจน ใช้ภาษาทางการสุภาพ'
  },
  {
    id: 'summary',
    name: 'สรุปไว',
    icon: '⚡',
    desc: 'เน้นสรุปประเด็นสำคัญ Bullet points สั้นกระชับ',
    instruction: 'คุณคือผู้ช่วยสรุปบทเรียน ตอบเฉพาะใจความสำคัญ เน้น Bullet points สั้น กระชับ ตรงประเด็น เหมาะกับการทบทวนหน้าห้องสอบ ตัดน้ำออกให้หมด สรุปเร็วและเข้าใจทันที'
  },
  {
    id: 'coach',
    name: 'โค้ชวินัย',
    icon: '🔥',
    desc: 'กระตุ้นสมาธิ ผลักดันให้คิดเอง ท้าทายให้เข้าใจจริง',
    instruction: 'คุณคือโค้ชติวเข้มสายผลักดัน (Tough Love) พูดตรง กระตือรือร้น ท้าทายให้คิดเอง คอยกระตุ้นวินัย เตือนสติให้อ่านหนังสือและทำโจทย์จนเข้าใจอย่างแท้จริง ปลุกไฟให้พร้อมสอบ'
  }
]

interface AiModelOption {
  id: string
  name: string
  icon: string
  desc: string
  models: string[]
}

const AI_MODELS: AiModelOption[] = [
  {
    id: 'flash',
    name: 'Flash',
    icon: '⚡',
    desc: 'โมเดลความเร็วสูง ตอบไวทันใจ เหมาะกับสรุปย่อและติวทั่วไป',
    models: [
      'gemini-flash-latest',
      'gemini-1.5-flash-latest',
      'gemini-2.0-flash-exp',
      'gemini-flash-lite-latest',
      'gemini-1.5-flash-8b',
      'gemini-pro-latest'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: '🧠',
    desc: 'คิดวิเคราะห์ลึก แม่นยำ เหมาะกับโจทย์ยาก/เขียนโค้ด',
    models: [
      'gemini-pro-latest',
      'gemini-1.5-pro-latest',
      'gemini-flash-latest'
    ]
  },
  {
    id: 'thinking',
    name: 'Thinking',
    icon: '💡',
    desc: 'แสดงวิธีคิดแบบเป็นขั้นเป็นตอน เจาะลึกโจทย์ซับซ้อน',
    models: [
      'gemini-2.0-flash-thinking-exp-01-21',
      'gemini-2.0-flash-exp',
      'gemini-pro-latest',
      'gemini-flash-latest'
    ]
  }
]

const selectedModelId = useLocalStorage<string>('noswitch:ai:model:v3', 'flash')
const selectedModel = computed(() => AI_MODELS.find(m => m.id === selectedModelId.value) || AI_MODELS[0]!)

const activePersonaId = useLocalStorage<string>('noswitch:ai:persona:v1', 'academic')
const activePersona = computed(() => AI_PERSONAS.find(p => p.id === activePersonaId.value) || AI_PERSONAS[0]!)

// Custom Quick Prompts State
const customPrompts = useLocalStorage<string[]>('noswitch:ai:customPrompts:v1', [])
const isAddPromptModalOpen = ref(false)
const newPromptInput = ref('')

function openAddPromptModal() {
  newPromptInput.value = ''
  isAddPromptModalOpen.value = true
}

function addCustomPrompt() {
  const text = newPromptInput.value.trim()
  if (text && !customPrompts.value.includes(text)) {
    customPrompts.value.push(text)
  }
  isAddPromptModalOpen.value = false
}

function removeCustomPrompt(text: string) {
  customPrompts.value = customPrompts.value.filter(p => p !== text)
}

// Sample prompts
const samplePrompts = [
  'ช่วยสรุปใจความสำคัญ',
  'สรุปสาระสำคัญเป็นข้อๆ เพื่อจดโน้ต',
  'ตั้งโจทย์ทดสอบ 1 ข้อ',
  'เทคนิคการจำสูตรคณิตศาสตร์',
]

// Default Welcome Message from AI Tutor
const DEFAULT_AI_MESSAGES: ChatMessage[] = [
  {
    role: 'assistant',
    content: 'สวัสดีครับ! 👋 ผมคือ **AI Study Assistant** ประจำ NoSwitch พร้อมช่วยติวบทเรียน สรุปเนื้อหา หรืออธิบายข้อสงสัยได้ตลอดเวลา สามารถพิมพ์ถาม หรือกดปุ่มด้านล่างเพื่อเริ่มติวได้เลยครับ!',
  },
]

// State จัดการ API Key
const apiKey = useLocalStorage<string>('noswitch:gemini:apiKey', '')
const keyInput = ref('')
const showKeyText = ref(false)
const showSettings = ref(false)

// State แชท และ ไฟล์แนบ
const messages = useLocalStorage<ChatMessage[]>('noswitch:chat:messages', DEFAULT_AI_MESSAGES)

onMounted(() => {
  if (!messages.value || messages.value.length === 0) {
    messages.value = [...DEFAULT_AI_MESSAGES]
  }
})
const input = ref('')
const loading = ref(false)
const scrollEl = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLTextAreaElement | null>(null)
const fileInputEl = ref<HTMLInputElement | null>(null)

const attachedFile = ref<AttachedFile | null>(null)
const previewModalImage = ref<string | null>(null)

// Quick prompts ยืดหยุ่นตามประเภทของไฟล์แนบตรงๆ
const quickPromptsForFile = computed(() => {
  if (!attachedFile.value) return samplePrompts
  if (attachedFile.value.kind === 'pdf') {
    return [
      '📑 ช่วยสรุปประเด็นสำคัญของเอกสารนี้',
      '❓ ตั้งคำถามทดสอบความเข้าใจ 5 ข้อจากไฟล์นี้',
      '🔍 สรุปหัวข้อย่อยและสาระสำคัญ',
    ]
  }
  if (attachedFile.value.kind === 'text') {
    return [
      '📝 ช่วยสรุปเนื้อหาของไฟล์นี้',
      '💡 อธิบายและวิเคราะห์ใจความสำคัญ',
    ]
  }
  return [
    '📐 ช่วยเฉลยโจทย์ข้อนี้พร้อมแสดงวิธีทำ',
    '📝 สรุปเนื้อหาสำคัญจากภาพนี้',
    '🔍 อธิบายแผนภาพ/กราฟนี้อย่างละเอียด',
  ]
})

// Quick prompts สำหรับเอกสารที่ซิงก์มาจาก DocumentReaderWidget
const quickPromptsForActiveDoc = computed(() => {
  if (!activeDoc.value) return samplePrompts
  if (activeDoc.value.type === 'pdf') {
    return [
      '📑 ช่วยสรุปเนื้อหาสำคัญของชีทนี้',
      '❓ ช่วยเก็งแนวข้อสอบ 5 ข้อจากชีทนี้',
      '🔍 อธิบายหัวข้อยากๆ ในเอกสารนี้',
    ]
  }
  if (activeDoc.value.type === 'image') {
    return [
      '🔍 ช่วยอ่านและอธิบายภาพนี้',
      '📐 ช่วยแก้โจทย์ในภาพนี้พร้อมวิธีทำ',
    ]
  }
  return [
    '📝 ช่วยสรุปเนื้อหาของไฟล์นี้',
    '💡 วิเคราะห์ประเด็นสำคัญในข้อความนี้',
  ]
})

// รวม Quick Prompts ตามสถานะปัจจุบัน (ไฟล์แนบตรง > ไฟล์ซิงก์ > พรอมต์เริ่มต้น + ปุ่มลัดส่วนตัว)
const currentPrompts = computed(() => {
  if (attachedFile.value) return [...quickPromptsForFile.value, ...customPrompts.value]
  if (isAiSyncEnabled.value && activeDoc.value?.base64) return [...quickPromptsForActiveDoc.value, ...customPrompts.value]
  return [...samplePrompts, ...customPrompts.value]
})

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

/**
 * บีบอัดและย่อขนาดรูปภาพ (Max 1600px, JPEG 0.85) เพื่อให้ส่งผ่าน API ได้รวดเร็วและประหยัดเน็ต
 */
function compressImage(file: File, maxDim = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(e.target?.result as string)
        ctx.drawImage(img, 0, 0, width, height)
        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        resolve(canvas.toDataURL(mime, quality))
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
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

function triggerFileInput() {
  fileInputEl.value?.click()
}

async function handleUploadedFile(file: File) {
  const sizeKb = Math.round(file.size / 1024)
  const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`

  // 1. Image file
  if (file.type.startsWith('image/')) {
    try {
      const dataUrl = await compressImage(file)
      const base64 = dataUrl.split(',')[1] || ''
      attachedFile.value = {
        name: file.name,
        kind: 'image',
        mimeType: file.type || 'image/jpeg',
        previewUrl: dataUrl,
        base64,
        sizeStr,
      }
      nextTick(scrollToBottom)
    } catch {
      alert('ไม่สามารถประมวลผลรูปภาพได้ กรุณาลองใหม่อีกครั้ง')
    }
    return
  }

  // 2. PDF file
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    if (file.size > 20 * 1024 * 1024) {
      alert('ไฟล์ PDF มีขนาดใหญ่เกิน 20MB กรุณาเลือกไฟล์ที่ขนาดเล็กลง')
      return
    }
    try {
      const base64 = await readFileAsBase64(file)
      attachedFile.value = {
        name: file.name,
        kind: 'pdf',
        mimeType: 'application/pdf',
        base64,
        sizeStr,
      }
      nextTick(scrollToBottom)
    } catch {
      alert('ไม่สามารถอ่านไฟล์ PDF ได้')
    }
    return
  }

  // 3. Text or Code file
  try {
    const text = await file.text()
    attachedFile.value = {
      name: file.name,
      kind: 'text',
      mimeType: file.type || 'text/plain',
      textContent: text.slice(0, 50000), // จำกัดสูงสุด 50k ตัวอักษร
      sizeStr,
    }
    nextTick(scrollToBottom)
  } catch {
    alert('ไม่สามารถอ่านไฟล์ข้อความได้')
  }
}

function onFileSelected(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) handleUploadedFile(file)
  target.value = ''
}

function onPaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        e.preventDefault()
        handleUploadedFile(file)
        break
      }
    }
  }
}

function clearAttachedFile() {
  attachedFile.value = null
}

async function send(customText?: string) {
  const textPrompt = (customText ?? input.value).trim()

  // ตรวจสอบว่ามีไฟล์แนบตรงๆ หรือดึงมาจาก Document Reader ที่กำลังเปิดอยู่ (ถ้าเปิดซิงก์)
  let fileToSend: AttachedFile | null = attachedFile.value
  let isFromSyncedDoc = false

  if (!fileToSend && isAiSyncEnabled.value && activeDoc.value && activeDoc.value.base64) {
    fileToSend = {
      name: activeDoc.value.name,
      kind: activeDoc.value.type,
      mimeType: activeDoc.value.type === 'pdf' ? 'application/pdf' : activeDoc.value.type === 'image' ? 'image/jpeg' : 'text/plain',
      base64: activeDoc.value.base64,
      textContent: activeDoc.value.text,
      sizeStr: activeDoc.value.size,
    }
    isFromSyncedDoc = true
  }

  // ถ้าไม่มีทั้งข้อความและไฟล์ ให้ข้าม
  if ((!textPrompt && !fileToSend) || loading.value) return

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

  const defaultPrompt = fileToSend?.kind === 'pdf'
    ? 'ช่วยสรุปเนื้อหาสำคัญและประเด็นหลักของเอกสาร PDF นี้'
    : fileToSend?.kind === 'text'
      ? 'ช่วยวิเคราะห์และสรุปเนื้อหาของไฟล์นี้'
      : 'ช่วยวิเคราะห์ อธิบายเนื้อหา หรือแก้โจทย์ในภาพนี้อย่างละเอียด'

  const finalPrompt = textPrompt || defaultPrompt

  // บันทึกลงใน Chat Log ฝั่งผู้ใช้
  messages.value.push({
    role: 'user',
    content: finalPrompt,
    image: fileToSend?.kind === 'image' && fileToSend.previewUrl ? fileToSend.previewUrl : undefined,
    file: fileToSend
      ? {
          name: fileToSend.name + (isFromSyncedDoc ? ' (ซิงก์จาก Reader)' : ''),
          kind: fileToSend.kind,
          sizeStr: fileToSend.sizeStr,
        }
      : undefined,
  })

  input.value = ''
  if (!isFromSyncedDoc) {
    clearAttachedFile()
  }
  nextTick(autoGrow)
  loading.value = true
  scrollToBottom()

  try {
    // เตรียม Multimodal parts สำหรับ Gemini API
    const parts: any[] = []
    if (fileToSend) {
      if (fileToSend.kind === 'pdf') {
        parts.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: fileToSend.base64,
          },
        })
      } else if (fileToSend.kind === 'image') {
        parts.push({
          inlineData: {
            mimeType: fileToSend.mimeType,
            data: fileToSend.base64,
          },
        })
      } else if (fileToSend.kind === 'text') {
        parts.push({
          text: `[เอกสารแนบ: ${fileToSend.name}]\n\n${fileToSend.textContent}\n\n[สิ้นสุดเอกสารแนบ]`,
        })
      }
    }
    parts.push({ text: finalPrompt })

    // ใช้รายชื่อโมเดลตามที่ผู้ใช้เลือก (Flash / Pro / Thinking) พร้อม fallback ภายในกลุ่ม
    const candidateModels = selectedModel.value?.models?.length
      ? selectedModel.value.models
      : ['gemini-flash-latest', 'gemini-1.5-flash-latest', 'gemini-pro-latest']

    let reply = ''
    let lastError: any = null

    for (const modelName of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(
          apiKey.value,
        )}`

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: `${activePersona.value.instruction} ตอบเป็นภาษาไทยเป็นหลัก กระชับ ตรงประเด็น ไม่อารัมภบทยืดยาว หากมีรูปภาพโจทย์ เอกสาร PDF หรือไฟล์ข้อความ ให้ช่วยวิเคราะห์และให้คำตอบทันที` }],
            },
            contents: [
              {
                parts,
              },
            ],
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: 1500,
            },
          }),
        })

        const data = await response.json()

        if (response.ok && data?.candidates?.[0]?.content?.parts) {
          reply = data.candidates[0].content.parts.map((p: any) => p.text || '').join('')
          break // สำเร็จ! ใช้งานโมเดลนี้ได้ทันที
        }

        const errMsg = data?.error?.message || ''
        lastError = new Error(errMsg || `Model ${modelName} error (${response.status})`)
        continue // ถ้าโมเดลนี้มีปัญหา ไม่ว่า 404, 429, 503 หรือใดๆ ให้ลองโมเดลตัวถัดไปในลิสต์ทันที
      } catch (err: any) {
        lastError = err
        continue // ถ้า fetch ตัวนี้พัง ให้ลองโมเดลตัวถัดไปทันที
      }
    }

    if (!reply) {
      throw lastError || new Error('เซิร์ฟเวอร์ Google มีผู้ใช้งานหนาแน่นชั่วคราว กรุณารอสักครู่แล้วลองใหม่อีกครั้ง')
    }

    messages.value.push({ role: 'assistant', content: reply })
  } catch (err: any) {
    let errMsg = err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ'

    // ปรับข้อความ Error ให้เข้าใจง่าย
    if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid')) {
      errMsg = 'API Key ไม่ถูกต้อง กรุณาตรวจสอบหรือขอ Key ใหม่ที่ Google AI Studio'
    } else if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota')) {
      errMsg = 'โควตาการใช้งานของ API Key เต็มชั่วคราว กรุณารอสักครู่แล้วลองใหม่'
    } else if (errMsg.includes('high demand') || errMsg.includes('spikes in demand') || errMsg.includes('503')) {
      errMsg = 'เซิร์ฟเวอร์ Google มีผู้ใช้งานหนาแน่นชั่วคราว กรุณากดลองใหม่อีกครั้ง'
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

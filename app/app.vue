<template>
  <div
    class="relative flex min-h-screen w-full flex-col bg-ink-950 font-sans text-ink-300 selection:bg-accent/30 selection:text-white"
    :class="{ 'select-none': isDragging || isResizing }"
    :style="{
      '--color-accent': activeAccent.hex,
      '--color-accent-2': activeAccent.hex,
      accentColor: activeAccent.hex
    }"
  >
    <!-- Dynamic Ambient Wallpaper Background Layer -->
    <div
      v-if="activeWallpaper.url"
      class="fixed inset-0 z-0 bg-cover bg-center transition-all duration-700 pointer-events-none"
      :style="{ backgroundImage: `url(${activeWallpaper.url})` }"
    />
    <!-- Ambient Dimmer Overlay -->
    <div
      class="fixed inset-0 z-0 bg-ink-950 transition-opacity duration-300 pointer-events-none"
      :style="{ opacity: activeWallpaper.url ? theme.dimmer / 100 : 1 }"
    />

    <!-- Overlay คลุมหน้าจอขณะกำลัง Resize เพื่อป้องกันไม่ให้เมาส์หลุดเข้าไปติดใน YouTube iframe -->
    <div
      v-if="isResizing || isZenResizing || isZenHResizing || isZenYtResizing"
      class="fixed inset-0 z-50 pointer-events-auto bg-transparent select-none"
      :class="(isZenHResizing || isZenYtResizing) ? 'cursor-ns-resize' : isZenResizing ? 'cursor-col-resize' : resizeMode === 'width' ? 'cursor-ew-resize' : resizeMode === 'height' ? 'cursor-ns-resize' : 'cursor-se-resize'"
    />

    <!-- Floating Island Capsule Navbar -->
    <header class="sticky top-2 z-30 mx-3 sm:mx-6 my-2 rounded-2xl sm:rounded-3xl border border-white/[0.1] bg-ink-900/85 px-4 py-2 sm:py-2.5 shadow-2xl backdrop-blur-2xl transition-all duration-300">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <!-- Left: Logo & Title -->
        <div class="flex items-center gap-2.5">
          <div class="relative h-9 w-9 overflow-hidden rounded-xl bg-white/[0.04] p-0.5 ring-1 ring-white/10 shadow-md transition-transform hover:scale-105">
            <img
              src="/Logo.png"
              alt="NoSwitch Logo"
              class="h-full w-full object-contain"
            />
          </div>
          <div>
            <h1 class="text-sm font-bold leading-tight text-white tracking-wide flex items-center gap-1.5">
              <span>NoSwitch</span>
              <span class="rounded-md bg-accent/20 px-1.5 py-0.2 text-[10px] font-mono text-accent ring-1 ring-accent/30">v.0.1.2</span>
            </h1>
            <p class="text-[11px] text-ink-500">Study Dashboard</p>
          </div>
        </div>

        <!-- Center: Layout Mode Presets & My Workspaces -->
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

          <!-- Divider -->
          <div class="h-4 w-[1px] bg-white/10 mx-0.5" />

          <!-- My Workspaces Dropdown Button -->
          <div class="relative" ref="workspaceMenuRef">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-150 cursor-pointer"
              :class="isCustomWorkspaceActive
                ? 'bg-accent/25 text-white border border-accent/50 shadow-sm'
                : 'text-ink-300 hover:text-white hover:bg-white/[0.05] border border-transparent'"
              title="โต๊ะอ่านหนังสือส่วนตัวที่บันทึกไว้"
              @click="isWorkspaceMenuOpen = !isWorkspaceMenuOpen"
            >
              <span>🗂️</span>
              <span class="font-medium">
                {{ activeCustomWorkspace ? activeCustomWorkspace.name : 'โต๊ะของฉัน' }}
              </span>
              <span v-if="customWorkspaces.length" class="text-[10px] text-accent font-bold">({{ customWorkspaces.length }})</span>
              <span class="text-[10px]">▾</span>
            </button>

            <!-- Workspaces Dropdown Menu -->
            <div
              v-if="isWorkspaceMenuOpen"
              class="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-64 rounded-2xl border border-white/[0.1] bg-ink-900/95 p-2 shadow-2xl backdrop-blur-xl z-50 text-xs animate-fade-down"
            >
              <div class="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-ink-500 uppercase tracking-wider">
                <span>โต๊ะอ่านหนังสือส่วนตัว</span>
                <span class="text-accent">{{ customWorkspaces.length }} โต๊ะ</span>
              </div>

              <!-- List of Saved Custom Workspaces -->
              <div v-if="customWorkspaces.length" class="space-y-1 my-1 max-h-48 overflow-y-auto scroll-thin">
                <div
                  v-for="ws in customWorkspaces"
                  :key="ws.id"
                  class="group flex items-center justify-between rounded-xl px-2.5 py-1.5 text-left transition cursor-pointer"
                  :class="currentPreset === ws.id && !isZenMode
                    ? 'bg-accent/20 border border-accent/40 text-white font-medium'
                    : 'text-ink-300 hover:bg-white/[0.06] hover:text-white'"
                  @click="applyCustomWorkspace(ws)"
                >
                  <span class="flex items-center gap-2 truncate">
                    <span>{{ ws.icon || '📚' }}</span>
                    <span class="truncate">{{ ws.name }}</span>
                  </span>
                  <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      class="p-1 hover:text-rose-400 rounded transition cursor-pointer text-[11px]"
                      title="ลบโต๊ะนี้"
                      @click="deleteCustomWorkspace(ws.id, $event)"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>

              <div v-else class="px-2 py-3 text-center text-ink-500 text-[11px]">
                ยังไม่มีโต๊ะที่บันทึกไว้<br />จัดวางการ์ดแล้วกดบันทึกด้านล่างได้เลย
              </div>

              <!-- Save Current Workspace Button -->
              <div class="pt-1.5 border-t border-white/[0.08] mt-1">
                <button
                  type="button"
                  class="w-full btn btn-primary text-xs py-1.5 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  @click="openSaveWorkspaceModal"
                >
                  <span>💾</span>
                  <span>บันทึกเลย์เอาต์ปัจจุบันเป็นโต๊ะใหม่</span>
                </button>
              </div>
            </div>
          </div>
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

        <!-- Themes Customizer Button -->
        <button
          id="btn-theme-customizer"
          class="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer active:scale-95"
          :class="isThemeDrawerOpen
            ? 'border-accent bg-accent/20 text-white shadow-[0_0_12px_rgba(168,85,247,0.35)]'
            : 'border-white/[0.08] bg-white/[0.04] text-ink-300 hover:border-accent/40 hover:bg-white/[0.08] hover:text-white'"
          title="ปรับแต่งธีม สีไฮไลต์ และบรรยากาศพื้นหลัง (Themes & Wallpapers)"
          @click="isThemeDrawerOpen = !isThemeDrawerOpen"
        >
          <span>🎨</span>
          <span class="hidden sm:inline font-semibold">Themes</span>
        </button>

        <!-- Help / Onboarding Tour Button -->
        <button
          id="btn-tour-help"
          class="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-ink-300 transition hover:border-accent/40 hover:bg-white/[0.08] hover:text-white cursor-pointer active:scale-95"
          title="คู่มือแนะนำการใช้งาน (Onboarding Tour)"
          @click="openTour"
        >
          <span class="grid h-4 w-4 place-items-center rounded-full bg-accent/20 text-[10px] font-bold text-accent">?</span>
          <span class="hidden sm:inline font-semibold">Help</span>
        </button>

        <!-- Live Clock -->
        <div class="hidden xl:flex items-baseline gap-2 pl-2 text-xs border-l border-white/[0.08]">
          <span class="font-mono font-bold tabular-nums text-white">{{ clock }}</span>
        </div>
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
        <div
          class="flex flex-1 min-w-[300px] flex-col rounded-2xl border border-white/[0.08] backdrop-blur-xl shadow-2xl overflow-hidden"
          :style="{
            backgroundColor: `rgba(15, 23, 42, ${(theme.cardOpacity ?? 85) / 100})`
          }"
        >
          <div
            class="flex h-10 items-center justify-between border-b border-white/[0.06] px-4 shrink-0"
            :style="{
              backgroundColor: `rgba(30, 41, 59, ${Math.min(0.95, ((theme.cardOpacity ?? 85) / 100) * 0.9)})`
            }"
          >
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
            class="flex flex-col rounded-2xl border border-white/[0.08] backdrop-blur-xl shadow-xl overflow-hidden shrink-0 transition-[flex] duration-75"
            :style="{
              flex: zenYoutubeCustomHeight ? 'none' : `${zenTimerFlex} 1 0%`,
              height: zenYoutubeCustomHeight ? '260px' : undefined,
              minHeight: '200px',
              backgroundColor: `rgba(15, 23, 42, ${(theme.cardOpacity ?? 85) / 100})`
            }"
          >
            <div
              class="flex h-10 items-center justify-between border-b border-white/[0.06] px-4 shrink-0"
              :style="{
                backgroundColor: `rgba(30, 41, 59, ${Math.min(0.95, ((theme.cardOpacity ?? 85) / 100) * 0.9)})`
              }"
            >
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
            class="relative flex flex-col rounded-2xl border border-white/[0.08] backdrop-blur-xl shadow-xl overflow-hidden shrink-0 transition-[flex] duration-75"
            :style="{
              flex: zenYoutubeCustomHeight ? 'none' : `${zenYoutubeFlex} 1 0%`,
              height: zenYoutubeCustomHeight ? `${zenYoutubeCustomHeight}px` : undefined,
              minHeight: '260px',
              backgroundColor: `rgba(15, 23, 42, ${(theme.cardOpacity ?? 85) / 100})`
            }"
          >
            <div
              class="flex h-10 items-center justify-between border-b border-white/[0.06] px-4 shrink-0"
              :style="{
                backgroundColor: `rgba(30, 41, 59, ${Math.min(0.95, ((theme.cardOpacity ?? 85) / 100) * 0.9)})`
              }"
            >
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
    <main v-else class="flex-1 p-4 lg:p-6 pb-16">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-stretch">
        <div
          v-for="w in widgets"
          v-show="w.visible && !dockedWidgetIds.includes(w.id)"
          :key="w.id"
          class="modular-card group/card relative flex flex-col rounded-2xl border border-white/[0.08] backdrop-blur-xl shadow-xl transition-all duration-200 overflow-hidden"
          :class="[
            getColSpanClass(w.colSpan),
            draggedId === w.id ? 'opacity-40 ring-2 ring-accent scale-[0.99]' : '',
            dragOverId === w.id ? 'ring-2 ring-accent/80 border-accent/60 shadow-[0_0_25px_rgba(168,85,247,0.3)]' : 'hover:border-white/[0.14]'
          ]"
          :style="{
            order: w.order,
            minHeight: w.minimized ? '42px' : `${w.height}px`,
            height: w.minimized ? '42px' : `${w.height}px`,
            backgroundColor: `rgba(15, 23, 42, ${(theme.cardOpacity ?? 85) / 100})`
          }"
          @dragover.prevent="onDragOver(w.id)"
          @dragleave="onDragLeave(w.id)"
          @drop.prevent="onDrop(w.id)"
          @dragend="onDragEnd"
        >
          <!-- Drop Target Indicator Overlay (แสดงเมื่อกำลังลากการ์ดมาวางทับ) -->
          <div
            v-if="dragOverId === w.id && draggedId !== w.id"
            class="pointer-events-none absolute inset-0 z-40 flex items-center justify-center rounded-2xl border-2 border-dashed border-accent bg-accent/20 backdrop-blur-[2px] transition-all animate-pulse"
          >
            <div class="rounded-xl border border-accent/40 bg-ink-900/95 px-4 py-2 shadow-2xl text-accent font-semibold text-xs flex items-center gap-2">
              <span class="text-sm">📍</span>
              <span>วางตรงนี้ (สลับกับ {{ w.title }})</span>
            </div>
          </div>

          <!-- Modular Card Header: ลากได้เฉพาะแถบหัวการ์ดตรงนี้เท่านั้น (ตรงกลางการ์ดคลิกได้อิสระ ไม่หลุดไปลาก) -->
          <div
            class="group/header flex h-[42px] items-center justify-between border-b border-white/[0.06] px-3.5 select-none shrink-0 cursor-grab active:cursor-grabbing hover:bg-white/[0.04] transition"
            :draggable="true"
            :title="`คลิกค้างตรงหัวการ์ดนี้เพื่อลากสลับตำแหน่ง ${w.title}`"
            :style="{
              backgroundColor: `rgba(30, 41, 59, ${Math.min(0.95, ((theme.cardOpacity ?? 85) / 100) * 0.9)})`
            }"
            @dragstart="onDragStart(w.id, $event)"
          >
            <!-- Title & Drag Icon & Live Activity Dot -->
            <div class="flex items-center gap-2 font-semibold text-white/95 text-xs truncate pointer-events-none">
              <span class="text-ink-500 group-hover/header:text-accent transition-colors text-sm font-bold tracking-tighter">⋮⋮</span>
              <span>{{ w.icon }}</span>
              <span class="truncate">{{ w.title }}</span>
              <!-- Subtle Live Status Indicator Dot -->
              <span
                class="h-1.5 w-1.5 rounded-full transition-all duration-300"
                :class="[
                  w.id === 'youtube' ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]' :
                  w.id === 'timer' ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse' :
                  w.id === 'todo' ? 'bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]' :
                  'bg-white/20 group-hover/card:bg-accent group-hover/card:shadow-[0_0_6px_var(--color-accent)]'
                ]"
                :title="`${w.title} active`"
              />
            </div>

            <!-- Card Controls: Progressive Disclosure (ซ่อนปุ่มปรับแต่งให้คลีน สบายตา จะแสดงขึ้นมาอย่างนุ่มนวลเมื่อเอาเมาส์มาวางบนการ์ด) -->
            <div
              class="card-controls flex items-center gap-1.5 shrink-0 opacity-0 group-hover/card:opacity-100 focus-within:opacity-100 transition-opacity duration-200"
              :draggable="false"
              @mousedown.stop
              @touchstart.stop
              @click.stop
            >
              <!-- Quick Reorder Stepper Buttons (◀ / ▶ สำหรับ iPad, Tablet หรือกดสลับไวๆ) -->
              <div class="flex items-center rounded-lg border border-white/[0.06] bg-ink-900/70 p-0.5 text-[10px] text-ink-400">
                <button
                  type="button"
                  class="hover:text-white px-1.5 py-0.5 cursor-pointer transition disabled:opacity-20 disabled:pointer-events-none active:scale-95"
                  :disabled="getWidgetDisplayIndex(w.id) <= 0"
                  :title="`ย้าย ${w.title} ไปข้างหน้า`"
                  @click="moveWidgetStep(w.id, -1)"
                >
                  ◀
                </button>
                <button
                  type="button"
                  class="hover:text-white px-1.5 py-0.5 cursor-pointer transition disabled:opacity-20 disabled:pointer-events-none active:scale-95"
                  :disabled="getWidgetDisplayIndex(w.id) >= visibleCount - 1"
                  :title="`ย้าย ${w.title} ไปข้างหลัง`"
                  @click="moveWidgetStep(w.id, 1)"
                >
                  ▶
                </button>
              </div>

              <!-- Width Indicator & Stepper (3, 4, 6, 8, 12) -->
              <div class="hidden sm:flex items-center rounded-lg border border-white/[0.06] bg-ink-900/70 px-1 py-0.5 text-[10px] text-ink-500">
                <button
                  type="button"
                  class="hover:text-white px-1.5 py-0.5 cursor-pointer transition disabled:opacity-30 active:scale-95"
                  :disabled="w.colSpan <= 3"
                  title="ลดความกว้าง"
                  @click="changeColSpan(w.id, -1)"
                >
                  −
                </button>
                <span class="px-1 text-ink-300 font-mono font-medium">{{ w.colSpan }}c</span>
                <button
                  type="button"
                  class="hover:text-white px-1.5 py-0.5 cursor-pointer transition disabled:opacity-30 active:scale-95"
                  :disabled="w.colSpan >= 12"
                  title="เพิ่มความกว้าง"
                  @click="changeColSpan(w.id, 1)"
                >
                  +
                </button>
              </div>

              <!-- Height Stepper for Tablet/Mobile (▲ / ▼ ปรับความสูงการ์ด) -->
              <div class="hidden md:flex lg:hidden items-center rounded-lg border border-white/[0.06] bg-ink-900/70 px-1 py-0.5 text-[10px] text-ink-500">
                <button
                  type="button"
                  class="hover:text-white px-1 py-0.5 cursor-pointer transition disabled:opacity-30 active:scale-95"
                  :disabled="w.height <= 300"
                  title="ลดความสูงการ์ด"
                  @click="changeWidgetHeight(w.id, -60)"
                >
                  ▼
                </button>
                <span class="px-1 text-ink-300 font-mono font-medium text-[9px]">{{ w.height }}px</span>
                <button
                  type="button"
                  class="hover:text-white px-1 py-0.5 cursor-pointer transition disabled:opacity-30 active:scale-95"
                  :disabled="w.height >= 800"
                  title="เพิ่มความสูงการ์ด"
                  @click="changeWidgetHeight(w.id, 60)"
                >
                  ▲
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

              <!-- Pin to Dock Button (พับเป็นการ์ดไอคอนลอยข้างจอ ไม่เกะกะโต๊ะหลัก) -->
              <button
                type="button"
                class="rounded-lg p-1 text-ink-400 hover:bg-white/[0.08] hover:text-accent transition cursor-pointer text-xs"
                :title="`พับ ${w.title} เป็นไอคอนลอยข้างจอ (Dock)`"
                @click="pinToDock(w.id)"
              >
                📌
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

          <!-- Modular Card Content Body (ปิด pointer-events ขณะลาก ป้องกัน iframe กลืน drag event) -->
          <div
            v-show="!w.minimized"
            class="modular-body flex-1 min-h-0 overflow-hidden"
            :class="{ 'pointer-events-none select-none': isDragging }"
          >
            <!-- Dynamic Widget Component -->
            <component :is="getWidgetComponent(w.id)" class="h-full w-full !border-0 !rounded-none !bg-transparent" />
          </div>

          <!-- Right Edge Resize Handle (ลากขอบขวาเพื่อปรับความกว้าง - เฉพาะเมาส์ ไม่ดัก touch scroll ของ iPad) -->
          <div
            v-if="!w.minimized"
            class="hidden lg:flex absolute top-0 right-0 bottom-4 w-2.5 cursor-ew-resize z-20 group/edge items-center justify-end"
            title="คลิกลากขอบขวาเพื่อปรับความกว้าง"
            @mousedown.prevent="startResize(w.id, 'width', $event)"
          >
            <div class="h-12 w-1 rounded-full bg-white/10 group-hover/edge:bg-accent group-hover/edge:shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-all mr-0.5" />
          </div>

          <!-- Bottom Edge Resize Handle (ลากขอบล่างเพื่อปรับความสูง - เฉพาะเมาส์ ไม่ดัก touch scroll ของ iPad) -->
          <div
            v-if="!w.minimized"
            class="hidden lg:flex absolute bottom-0 left-0 right-4 h-2.5 cursor-ns-resize z-20 group/bottom items-end justify-center"
            title="คลิกลากขอบล่างเพื่อปรับความสูง"
            @mousedown.prevent="startResize(w.id, 'height', $event)"
          >
            <div class="w-16 h-1 rounded-full bg-white/10 group-hover/bottom:bg-accent group-hover/bottom:shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-all mb-0.5" />
          </div>

          <!-- Bottom Right Corner Handle (ลากมุมเพื่อปรับทั้งกว้างและสูง - เฉพาะเมาส์) -->
          <div
            v-if="!w.minimized"
            class="hidden lg:flex absolute bottom-0 right-0 z-20 h-6 w-6 cursor-se-resize items-end justify-end p-1 text-ink-500 hover:text-accent hover:scale-110 transition active:scale-95"
            title="คลิกลากมุมเพื่อปรับทั้งความกว้างและความสูงพร้อมกัน"
            @mousedown.prevent="startResize(w.id, 'both', $event)"
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

    <!-- Theme Customizer Slide-over Panel -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-x-8"
        enter-to-class="opacity-100 translate-x-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-x-0"
        leave-to-class="opacity-0 translate-x-8"
      >
        <div
          v-if="isThemeDrawerOpen"
          class="fixed inset-y-0 right-0 z-[9500] w-full max-w-md p-3 sm:p-5 flex flex-col justify-end pointer-events-none"
        >
          <div class="pointer-events-auto h-full w-full rounded-3xl border border-white/[0.1] bg-ink-950/95 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden ring-1 ring-accent/30">
            <div class="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-ink-900/60 shrink-0">
              <span class="font-bold text-sm text-white flex items-center gap-2">
                <span>🎨</span> Theme & Ambient Customizer
              </span>
              <button
                class="rounded-xl p-1.5 text-ink-400 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
                title="ปิดหน้าต่างธีม"
                @click="isThemeDrawerOpen = false"
              >
                ✕
              </button>
            </div>
            <div class="flex-1 min-h-0 overflow-hidden">
              <ThemeCustomizer class="!border-0 !rounded-none !bg-transparent h-full" />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Save Custom Workspace Modal -->
    <Teleport to="body">
      <div
        v-if="isSaveModalOpen"
        class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
        @click.self="isSaveModalOpen = false"
      >
        <div class="w-full max-w-sm rounded-3xl border border-white/[0.1] bg-ink-950 p-5 shadow-2xl text-xs space-y-4 animate-scale-up">
          <div class="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <h3 class="font-bold text-sm text-white flex items-center gap-2">
              <span>💾</span> บันทึกโต๊ะอ่านหนังสือส่วนตัว
            </h3>
            <button
              type="button"
              class="p-1 text-ink-400 hover:text-white cursor-pointer rounded-lg hover:bg-white/[0.08]"
              @click="isSaveModalOpen = false"
            >
              ✕
            </button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-ink-400 text-[11px] mb-1 font-medium">ชื่อโต๊ะอ่านหนังสือของคุณ:</label>
              <input
                v-model="newWorkspaceName"
                type="text"
                placeholder="เช่น ติวสอบแคลคูลัส, ชีวะบทที่ 1, ชิลล์ Lo-fi"
                class="input w-full text-xs py-2 px-3"
                autofocus
                @keyup.enter="saveCurrentWorkspace"
              />
            </div>

            <div>
              <label class="block text-ink-400 text-[11px] mb-1.5 font-medium">เลือกไอคอนประจำโต๊ะ:</label>
              <div class="grid grid-cols-5 gap-1.5">
                <button
                  v-for="icon in workspaceIcons"
                  :key="icon"
                  type="button"
                  class="h-9 rounded-xl border text-base flex items-center justify-center transition cursor-pointer"
                  :class="newWorkspaceIcon === icon
                    ? 'border-accent bg-accent/20 text-white ring-1 ring-accent'
                    : 'border-white/[0.08] bg-ink-800/50 hover:bg-white/[0.06] text-ink-300'"
                  @click="newWorkspaceIcon = icon"
                >
                  {{ icon }}
                </button>
              </div>
            </div>

            <p class="text-[10px] text-ink-500 leading-relaxed bg-ink-900/60 p-2.5 rounded-xl border border-white/[0.04]">
              💡 <strong>ระบบจะจำ:</strong> ตำแหน่ง, ขนาดกว้าง/สูง, และวิดเจ็ตที่เปิดอยู่ตอนนี้ทั้งหมด คุณสามารถคลิกสลับกลับมาใช้โต๊ะนี้ได้ใน 1 วินาที
            </p>
          </div>

          <div class="flex gap-2 pt-1">
            <button
              type="button"
              class="btn-ghost flex-1 py-2 text-xs rounded-xl cursor-pointer"
              @click="isSaveModalOpen = false"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              class="btn btn-primary flex-1 py-2 text-xs rounded-xl cursor-pointer"
              @click="saveCurrentWorkspace"
            >
              บันทึกโต๊ะนี้
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Floating Mini-Pill Dock (ไอคอนลอยขอบขวาของจอสำหรับวิดเจ็ตที่ปักหมุดไว้) -->
    <Teleport to="body">
      <div
        v-if="dockedWidgets.length"
        class="fixed right-3 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-1.5 rounded-2xl border border-white/[0.1] bg-ink-950/85 p-1.5 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5 animate-fade-left"
      >
        <div class="px-1 py-0.5 text-[8px] font-bold text-ink-500 uppercase tracking-tighter text-center">
          Dock
        </div>
        <div
          v-for="dw in dockedWidgets"
          :key="dw.id"
          class="relative group/pill"
        >
          <button
            type="button"
            class="relative grid h-9 w-9 place-items-center rounded-xl border text-sm transition-all duration-150 cursor-pointer"
            :class="activeFlyoutWidgetId === dw.id
              ? 'border-accent bg-accent/25 text-white shadow-[0_0_12px_var(--color-accent)] ring-1 ring-accent'
              : 'border-white/[0.08] bg-ink-900/80 text-ink-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white'"
            :title="dw.title"
            @click="toggleDockFlyout(dw.id)"
          >
            <span>{{ dw.icon }}</span>
          </button>

          <!-- Tooltip on hover -->
          <div class="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-2 hidden group-hover/pill:flex items-center whitespace-nowrap rounded-lg border border-white/[0.1] bg-ink-900/95 px-2.5 py-1 text-[11px] font-medium text-white shadow-xl backdrop-blur-md z-50">
            {{ dw.title }}
          </div>
        </div>
      </div>

      <!-- Dock Quick Flyout Drawer (เมื่อคลิกที่ไอคอนใน Dock จะสไลด์ออกมาเป็น Quick Drawer ทันที!) -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-x-8 scale-95"
        enter-to-class="opacity-100 translate-x-0 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-x-0 scale-100"
        leave-to-class="opacity-0 translate-x-8 scale-95"
      >
        <div
          v-if="activeFlyoutWidget"
          class="fixed right-16 top-1/2 -translate-y-1/2 z-50 w-[380px] sm:w-[460px] max-h-[85vh] h-[520px] rounded-3xl border border-white/[0.12] bg-ink-950/95 shadow-2xl backdrop-blur-2xl ring-1 ring-accent/30 flex flex-col overflow-hidden"
        >
          <!-- Flyout Header -->
          <div class="flex h-11 items-center justify-between border-b border-white/[0.08] bg-ink-900/70 px-4 shrink-0">
            <div class="flex items-center gap-2 font-semibold text-xs text-white">
              <span class="text-sm">{{ activeFlyoutWidget.icon }}</span>
              <span>{{ activeFlyoutWidget.title }}</span>
              <span class="rounded-full bg-accent/20 border border-accent/40 px-2 py-0.2 text-[9px] text-accent font-medium">Quick Flyout</span>
            </div>
            <div class="flex items-center gap-1.5">
              <!-- Unpin to Main Grid Button -->
              <button
                type="button"
                class="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10px] text-ink-300 hover:border-accent/40 hover:text-white transition cursor-pointer"
                title="นำวิดเจ็ตนี้กลับไปวางบนหน้าจอหลัก"
                @click="unpinFromDock(activeFlyoutWidget.id)"
              >
                <span>📌 นำกลับสู่โต๊ะหลัก</span>
              </button>
              <!-- Close Flyout -->
              <button
                type="button"
                class="rounded-lg p-1 text-ink-400 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
                title="พับเก็บเข้า Dock"
                @click="activeFlyoutWidgetId = null"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- Flyout Body -->
          <div class="flex-1 min-h-0 overflow-hidden">
            <component :is="getWidgetComponent(activeFlyoutWidget.id)" class="h-full w-full !border-0 !rounded-none !bg-transparent" />
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Onboarding Tutorial Tour Modal -->
    <OnboardingTour ref="tourRef" v-model="isTourOpen" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, type Component } from 'vue'

// Import All Widgets
import YoutubePlayer from '~/components/YoutubeWidget.vue'
import DocumentReader from '~/components/DocumentReaderWidget.vue'
import AiChat from '~/components/AiChat.vue'
import Timer from '~/components/TimerWidget.vue'
import TodoList from '~/components/TodoWidget.vue'
import Calculator from '~/components/CalculatorWidget.vue'
import AntiPhoneGuardian from '~/components/AntiPhoneGuardian.vue'
import Scratchpad from '~/components/Scratchpad.vue'
import ThemeCustomizer from '~/components/ThemeCustomizer.vue'
import FormulaHUD from '~/components/FormulaHUD.vue'
import ExamCountdown from '~/components/ExamCountdown.vue'
import OnboardingTour from '~/components/OnboardingTour.vue'
import { useTheme } from '~/composables/useTheme'

const { theme, activeWallpaper, activeAccent } = useTheme()
const isThemeDrawerOpen = ref(false)

// Onboarding Tour State
const isTourOpen = ref(false)
const tourRef = ref<{ open: () => void } | null>(null)

function openTour() {
  if (tourRef.value?.open) {
    tourRef.value.open()
  } else {
    isTourOpen.value = true
  }
}

interface WidgetState {
  id: string
  title: string
  icon: string
  visible: boolean
  minimized: boolean
  order: number
  colSpan: number
  height: number
}

const STORAGE_KEY = 'noswitch:modular:widgets:v9'

const presets = [
  { id: 'standard', label: 'มาตรฐาน', icon: '⚡', desc: 'ครบทุกเครื่องมือ แสดงทุกฟังก์ชันพร้อมใช้งาน' },
  { id: 'reading', label: 'อ่านเอกสาร/PDF', icon: '📖', desc: 'เน้นเปิดชีทเรียนคู่กับแชทถาม AI และสูตรย่อ' },
  { id: 'minimal', label: 'มินิมอล', icon: '🎧', desc: 'เฉพาะนับถอยหลังวันสอบ โน้ตย่อ และจับเวลา' },
]

const currentPreset = ref('standard')

const PRESET_LAYOUTS: Record<string, WidgetState[]> = {
  standard: [
    // Row 1: Document & PDF (7) + AI Study Assistant (5)
    { id: 'doc', title: 'Document & PDF', icon: '📄', visible: true, minimized: false, order: 0, colSpan: 7, height: 500 },
    { id: 'ai', title: 'AI Study Assistant', icon: '🤖', visible: true, minimized: false, order: 1, colSpan: 5, height: 500 },

    // Row 2: Exam D-Day (3) + Pomodoro Timer (3) + Study Schedule (3) + Quick Scratchpad (3)
    { id: 'exam', title: 'Exam D-Day', icon: '⏳', visible: true, minimized: false, order: 2, colSpan: 3, height: 380 },
    { id: 'timer', title: 'Pomodoro Timer', icon: '⏱️', visible: true, minimized: false, order: 3, colSpan: 3, height: 380 },
    { id: 'todo', title: 'Study Schedule', icon: '📅', visible: true, minimized: false, order: 4, colSpan: 3, height: 380 },
    { id: 'scratchpad', title: 'Quick Scratchpad', icon: '📝', visible: true, minimized: false, order: 5, colSpan: 3, height: 380 },

    // Row 3: YouTube Focus (7) + Focus Guardian (5)
    { id: 'youtube', title: 'YouTube Focus', icon: '📺', visible: true, minimized: false, order: 6, colSpan: 7, height: 440 },
    { id: 'guardian', title: 'Focus Guardian', icon: '🛡️', visible: true, minimized: false, order: 7, colSpan: 5, height: 440 },

    // Row 4: Formula & Cheat Sheet (5) + Theme Customizer (4) + Calculator (3)
    { id: 'hud', title: 'Formula & Cheat Sheet', icon: '📐', visible: true, minimized: false, order: 8, colSpan: 5, height: 420 },
    { id: 'themes', title: 'Theme Customizer', icon: '🎨', visible: true, minimized: false, order: 9, colSpan: 4, height: 420 },
    { id: 'calc', title: 'Calculator', icon: '🧮', visible: true, minimized: false, order: 10, colSpan: 3, height: 420 },
  ],
  reading: [
    { id: 'doc', title: 'Document & PDF Reader', icon: '📄', visible: true, minimized: false, order: 0, colSpan: 7, height: 500 },
    { id: 'hud', title: 'Formula & Cheat Sheet', icon: '📐', visible: true, minimized: false, order: 1, colSpan: 5, height: 500 },
    { id: 'scratchpad', title: 'Quick Scratchpad', icon: '📝', visible: true, minimized: false, order: 2, colSpan: 4, height: 380 },
    { id: 'ai', title: 'AI Study Assistant', icon: '🤖', visible: true, minimized: false, order: 3, colSpan: 5, height: 380 },
    { id: 'timer', title: 'Pomodoro Timer', icon: '⏱️', visible: true, minimized: false, order: 4, colSpan: 3, height: 380 },
    { id: 'guardian', title: 'Focus Guardian', icon: '🛡️', visible: false, minimized: false, order: 5, colSpan: 5, height: 440 },
    { id: 'exam', title: 'Exam D-Day', icon: '⏳', visible: false, minimized: false, order: 6, colSpan: 4, height: 380 },
    { id: 'youtube', title: 'YouTube Focus', icon: '📺', visible: false, minimized: false, order: 7, colSpan: 6, height: 360 },
    { id: 'todo', title: 'Study Schedule', icon: '📅', visible: false, minimized: false, order: 8, colSpan: 3, height: 360 },
    { id: 'calc', title: 'Calculator', icon: '🧮', visible: false, minimized: false, order: 9, colSpan: 3, height: 360 },
    { id: 'themes', title: 'Theme Customizer', icon: '🎨', visible: false, minimized: false, order: 10, colSpan: 4, height: 440 },
  ],
  minimal: [
    { id: 'exam', title: 'Exam D-Day', icon: '⏳', visible: true, minimized: false, order: 0, colSpan: 4, height: 400 },
    { id: 'timer', title: 'Pomodoro Timer', icon: '⏱️', visible: true, minimized: false, order: 1, colSpan: 4, height: 400 },
    { id: 'scratchpad', title: 'Quick Scratchpad', icon: '📝', visible: true, minimized: false, order: 2, colSpan: 4, height: 400 },
    { id: 'youtube', title: 'YouTube Focus', icon: '📺', visible: false, minimized: false, order: 3, colSpan: 6, height: 420 },
    { id: 'guardian', title: 'Focus Guardian', icon: '🛡️', visible: false, minimized: false, order: 4, colSpan: 4, height: 420 },
    { id: 'hud', title: 'Formula & Cheat Sheet', icon: '📐', visible: false, minimized: false, order: 5, colSpan: 6, height: 440 },
    { id: 'ai', title: 'AI Study Assistant', icon: '🤖', visible: false, minimized: false, order: 6, colSpan: 5, height: 440 },
    { id: 'doc', title: 'Document & PDF', icon: '📄', visible: false, minimized: false, order: 7, colSpan: 7, height: 440 },
    { id: 'todo', title: 'Study Schedule', icon: '📅', visible: false, minimized: false, order: 8, colSpan: 3, height: 380 },
    { id: 'calc', title: 'Calculator', icon: '🧮', visible: false, minimized: false, order: 9, colSpan: 3, height: 380 },
    { id: 'themes', title: 'Theme Customizer', icon: '🎨', visible: false, minimized: false, order: 10, colSpan: 4, height: 440 },
  ],
}

const widgets = ref<WidgetState[]>(JSON.parse(JSON.stringify(PRESET_LAYOUTS.standard!)))
const isZenMode = ref(false)
const isWidgetMenuOpen = ref(false)
const widgetMenuRef = ref<HTMLElement | null>(null)

// Custom Workspaces (My Workspaces) Logic
interface CustomWorkspace {
  id: string
  name: string
  icon: string
  widgets: WidgetState[]
  createdAt: number
}

const customWorkspaces = useLocalStorage<CustomWorkspace[]>('noswitch:custom:workspaces:v1', [])
const isWorkspaceMenuOpen = ref(false)
const workspaceMenuRef = ref<HTMLElement | null>(null)
const isSaveModalOpen = ref(false)
const newWorkspaceName = ref('')
const newWorkspaceIcon = ref('📚')
const workspaceIcons = ['📚', '📐', '🔬', '☕', '🎯', '💡', '💻', '🎨', '🎧', '⚡']

const activeCustomWorkspace = computed(() => {
  return customWorkspaces.value.find(ws => ws.id === currentPreset.value)
})

const isCustomWorkspaceActive = computed(() => {
  return !isZenMode.value && !!activeCustomWorkspace.value
})

function openSaveWorkspaceModal() {
  newWorkspaceName.value = `โต๊ะส่วนตัว ${customWorkspaces.value.length + 1}`
  newWorkspaceIcon.value = workspaceIcons[customWorkspaces.value.length % workspaceIcons.length] || '📚'
  isSaveModalOpen.value = true
  isWorkspaceMenuOpen.value = false
}

function saveCurrentWorkspace() {
  const name = newWorkspaceName.value.trim() || `โต๊ะส่วนตัว ${customWorkspaces.value.length + 1}`
  const newWs: CustomWorkspace = {
    id: `custom-ws-${Date.now()}`,
    name,
    icon: newWorkspaceIcon.value || '📚',
    widgets: JSON.parse(JSON.stringify(widgets.value)),
    createdAt: Date.now()
  }
  customWorkspaces.value.push(newWs)
  currentPreset.value = newWs.id
  isSaveModalOpen.value = false
}

function applyCustomWorkspace(ws: CustomWorkspace) {
  currentPreset.value = ws.id
  isZenMode.value = false
  isWorkspaceMenuOpen.value = false
  const templateMap = new Map(ws.widgets.map((t) => [t.id, t]))
  
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

function deleteCustomWorkspace(id: string, e?: Event) {
  e?.stopPropagation()
  customWorkspaces.value = customWorkspaces.value.filter(ws => ws.id !== id)
  if (currentPreset.value === id) {
    applyPreset('standard')
  }
}

// แมป Component ตาม id
const componentMap: Record<string, Component> = {
  doc: DocumentReader,
  youtube: YoutubePlayer,
  ai: AiChat,
  timer: Timer,
  todo: TodoList,
  calc: Calculator,
  guardian: AntiPhoneGuardian,
  scratchpad: Scratchpad,
  hud: FormulaHUD,
  exam: ExamCountdown,
  themes: ThemeCustomizer,
}

function getWidgetComponent(id: string) {
  return componentMap[id] || YoutubePlayer
}

// Docked Widgets (Floating Mini-Pill Dock) Logic
const dockedWidgetIds = useLocalStorage<string[]>('noswitch:docked:widgets:v1', [])
const activeFlyoutWidgetId = ref<string | null>(null)

const dockedWidgets = computed(() => {
  return widgets.value.filter(w => dockedWidgetIds.value.includes(w.id))
})

const activeFlyoutWidget = computed(() => {
  return widgets.value.find(w => w.id === activeFlyoutWidgetId.value) || null
})

function pinToDock(id: string) {
  if (!dockedWidgetIds.value.includes(id)) {
    dockedWidgetIds.value.push(id)
  }
}

function unpinFromDock(id: string) {
  dockedWidgetIds.value = dockedWidgetIds.value.filter(item => item !== id)
  const widget = widgets.value.find(w => w.id === id)
  if (widget) {
    widget.visible = true
  }
  if (activeFlyoutWidgetId.value === id) {
    activeFlyoutWidgetId.value = null
  }
  saveToStorage()
}

function toggleDockFlyout(id: string) {
  if (activeFlyoutWidgetId.value === id) {
    activeFlyoutWidgetId.value = null
  } else {
    activeFlyoutWidgetId.value = id
  }
}

const visibleCount = computed(() => widgets.value.filter((w) => w.visible && !dockedWidgetIds.value.includes(w.id)).length)

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

function changeWidgetHeight(id: string, delta: number) {
  const w = widgets.value.find((item) => item.id === id)
  if (!w || w.minimized) return
  const newHeight = Math.max(300, Math.min(850, (w.height || 400) + delta))
  w.height = newHeight
  saveToStorage()
}

function toggleWidget(id: string) {
  const w = widgets.value.find((item) => item.id === id)
  if (w) {
    if (dockedWidgetIds.value.includes(id)) {
      dockedWidgetIds.value = dockedWidgetIds.value.filter(item => item !== id)
      w.visible = true
    } else {
      w.visible = !w.visible
    }
    saveToStorage()
  }
}

function closeWidget(id: string) {
  const w = widgets.value.find((item) => item.id === id)
  if (w) {
    w.visible = false
    dockedWidgetIds.value = dockedWidgetIds.value.filter(item => item !== id)
    if (activeFlyoutWidgetId.value === id) {
      activeFlyoutWidgetId.value = null
    }
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
    // ใช้ตัวการ์ดทั้งใบเป็น Drag Ghost Image ลอยตามเมาส์
    const cardEl = (event.currentTarget as HTMLElement)?.closest('.modular-card') as HTMLElement | null
    if (cardEl) {
      event.dataTransfer.setDragImage(cardEl, 24, 20)
    }
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

// Reorder Logic (ลากสลับตำแหน่ง หรือกดปุ่มเลื่อนลำดับ)
function getWidgetDisplayIndex(id: string) {
  const visibleSorted = widgets.value
    .filter((w) => w.visible)
    .sort((a, b) => a.order - b.order)
  return visibleSorted.findIndex((w) => w.id === id)
}

function moveWidgetStep(id: string, step: -1 | 1) {
  const visibleSorted = widgets.value
    .filter((w) => w.visible)
    .sort((a, b) => a.order - b.order)

  const currentIndex = visibleSorted.findIndex((w) => w.id === id)
  const targetIndex = currentIndex + step

  if (currentIndex === -1 || targetIndex < 0 || targetIndex >= visibleSorted.length) return

  const targetWidget = visibleSorted[targetIndex]
  if (targetWidget) {
    reorderWidgets(id, targetWidget.id)
  }
}

function reorderWidgets(sourceId: string, targetId: string) {
  if (sourceId === targetId) return

  // เรียงลำดับรายการทั้งหมดตาม order ปัจจุบัน
  const sorted = [...widgets.value].sort((a, b) => a.order - b.order)
  const sourceIndex = sorted.findIndex((w) => w.id === sourceId)
  const targetIndex = sorted.findIndex((w) => w.id === targetId)

  if (sourceIndex === -1 || targetIndex === -1) return

  // ถอดไอเท็มต้นทางออก แล้วแทรกตรงตำแหน่งเป้าหมาย
  const [movedItem] = sorted.splice(sourceIndex, 1)
  if (movedItem) {
    sorted.splice(targetIndex, 0, movedItem)
    // อัปเดต order ใหม่เรียงจาก 0 ถึง n-1
    sorted.forEach((item, idx) => {
      const original = widgets.value.find((w) => w.id === item.id)
      if (original) original.order = idx
    })
    saveToStorage()
  }
}

function onDrop(targetId: string) {
  if (!draggedId.value || draggedId.value === targetId) {
    draggedId.value = null
    dragOverId.value = null
    isDragging.value = false
    return
  }

  reorderWidgets(draggedId.value, targetId)

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
  if (workspaceMenuRef.value && !workspaceMenuRef.value.contains(e.target as Node)) {
    isWorkspaceMenuOpen.value = false
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
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
  transition: box-shadow 0.25s ease, border-color 0.2s ease, opacity 0.2s ease, transform 0.15s ease;
}

.modular-card:hover {
  box-shadow: 0 16px 36px -8px rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.14);
}

/* Touch devices: Always show controls subtly since hover is not available */
@media (hover: none) {
  .modular-card .card-controls {
    opacity: 0.95 !important;
  }
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

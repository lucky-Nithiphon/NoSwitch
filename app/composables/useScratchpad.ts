import { ref } from 'vue'

const STORAGE_TEXT_KEY = 'noswitch:scratchpad:text:v2'

// Global shared state for scratchpad text content across widgets in the SPA
const scratchpadText = ref<string>('')
let isInitialized = false

function initScratchpad() {
  if (import.meta.client && !isInitialized) {
    scratchpadText.value = localStorage.getItem(STORAGE_TEXT_KEY) || ''
    isInitialized = true
  }
}

export function useScratchpad() {
  initScratchpad()

  function setScratchpadText(text: string) {
    scratchpadText.value = text
    if (import.meta.client) {
      try {
        localStorage.setItem(STORAGE_TEXT_KEY, text)
      } catch (err) {
        console.warn('Failed to save scratchpad text to localStorage', err)
      }
    }
  }

  function appendToScratchpad(content: string, options?: { title?: string; timestamp?: boolean }) {
    initScratchpad()
    const now = new Date()
    const timeStr = options?.timestamp !== false
      ? `\n\n--- 📌 สรุปจาก AI (${now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}) ---\n`
      : '\n\n'
    const titleStr = options?.title ? `**${options.title}**\n` : ''
    const entry = `${timeStr}${titleStr}${content.trim()}\n`

    if (!scratchpadText.value.trim()) {
      scratchpadText.value = entry.trimStart()
    } else {
      scratchpadText.value += entry
    }

    if (import.meta.client) {
      try {
        localStorage.setItem(STORAGE_TEXT_KEY, scratchpadText.value)
      } catch (err) {
        console.warn('Failed to save scratchpad text to localStorage', err)
      }
      // Broadcast event for active Scratchpad component if mounted
      window.dispatchEvent(new CustomEvent('noswitch:scratchpad:updated', { detail: scratchpadText.value }))
    }

    return true
  }

  return {
    scratchpadText,
    setScratchpadText,
    appendToScratchpad,
  }
}

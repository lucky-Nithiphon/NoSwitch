import { ref, computed } from 'vue'

export interface ActiveDocInfo {
  id: string
  name: string
  type: 'pdf' | 'text' | 'image'
  size: string
  base64?: string
  text?: string
}

// Global state across components in SPA
const activeDoc = ref<ActiveDocInfo | null>(null)
const isAiSyncEnabled = ref(true)

export function useActiveDocument() {
  function setActiveDoc(doc: ActiveDocInfo | null) {
    activeDoc.value = doc
  }

  function toggleAiSync() {
    isAiSyncEnabled.value = !isAiSyncEnabled.value
  }

  function setAiSync(enabled: boolean) {
    isAiSyncEnabled.value = enabled
  }

  const hasActiveDoc = computed(() => !!activeDoc.value)

  return {
    activeDoc,
    isAiSyncEnabled,
    hasActiveDoc,
    setActiveDoc,
    toggleAiSync,
    setAiSync,
  }
}

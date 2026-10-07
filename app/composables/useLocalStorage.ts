import { ref, watch, type Ref } from 'vue'

/**
 * Reactive ref ที่ sync กับ LocalStorage อัตโนมัติ
 * (deep watch → บันทึกทันทีเมื่อเพิ่ม/แก้/ลบข้อมูลใน array หรือ object)
 */
export function useLocalStorage<T>(key: string, defaultValue: T): Ref<T> {
  const state = ref(defaultValue) as Ref<T>

  if (import.meta.client) {
    try {
      const raw = localStorage.getItem(key)
      if (raw !== null) state.value = JSON.parse(raw)
    } catch {
      // ข้อมูลเสีย → ใช้ค่า default
    }

    watch(
      state,
      (val) => {
        try {
          localStorage.setItem(key, JSON.stringify(val))
        } catch {
          // storage เต็มหรือถูกปิด
        }
      },
      { deep: true },
    )
  }

  return state
}

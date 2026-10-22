export interface WallpaperPreset {
  id: string
  name: string
  icon: string
  desc: string
  url: string
  type: 'image' | 'gradient'
}

export interface AccentColorPreset {
  id: string
  name: string
  hsl: string
  hex: string
}

export interface MoodPreset {
  id: string
  name: string
  icon: string
  desc: string
  wallpaperId: string
  accentId: string
  dimmer: number
  cardOpacity: number
}

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: 'clean-slate',
    name: 'Clean Slate',
    icon: '⬛',
    desc: 'สีพื้นเรียบหรู ดำ/เทาเข้มแบบมินิมอล ไม่รบกวนสายตา',
    url: '',
    type: 'gradient'
  },
  {
    id: 'tokyo-cafe',
    name: 'Tokyo Rainy Cafe',
    icon: '☕',
    desc: 'บรรยากาศคาเฟ่อบอุ่นยามฝนตก กลิ่นกาแฟและแสงไฟสีอำพัน',
    url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=1920&q=80',
    type: 'image'
  },
  {
    id: 'kyoto-bamboo',
    name: 'Kyoto Bamboo Forest',
    icon: '🍃',
    desc: 'ป่าไผ่และธรรมชาติสีเขียวมัทฉะ สงบจิตใจเพื่อสมาธิลึกซึ้ง',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80',
    type: 'image'
  },
  {
    id: 'cozy-rain',
    name: 'Cozy Anime Rain',
    icon: '🌧️',
    desc: 'บรรยากาศหน้าต่างห้องนอนฝนตก สไตล์ Lo-fi ชวนผ่อนคลาย',
    url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1920&q=80',
    type: 'image'
  },
  {
    id: 'midnight-library',
    name: 'Midnight Library',
    icon: '📚',
    desc: 'บรรยากาศโต๊ะไม้ในห้องสมุดยุคเก่า สมาธิเงียบสงบ',
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1920&q=80',
    type: 'image'
  },
  {
    id: 'minimal-cyberpunk',
    name: 'Minimal Cyberpunk',
    icon: '🌆',
    desc: 'ไล่เฉดสีนีออนเข้มขรึม ไซเบอร์สเปซยามค่ำคืน',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1920&q=80',
    type: 'image'
  },
  {
    id: 'studio-architect',
    name: 'Studio Architectural',
    icon: '🏢',
    desc: 'ห้องทำงานสถาปัตยกรรมโมเดิร์น เส้นสายมินิมอลโปร่งตา',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80',
    type: 'image'
  }
]

export const ACCENT_PRESETS: AccentColorPreset[] = [
  { id: 'violet', name: 'Cyber Violet', hsl: '258 90% 72%', hex: '#a855f7' },
  { id: 'matcha', name: 'Matcha Green', hsl: '142 71% 45%', hex: '#22c55e' },
  { id: 'emerald', name: 'Emerald Green', hsl: '152 60% 55%', hex: '#10b981' },
  { id: 'sky', name: 'Sky Blue', hsl: '199 89% 55%', hex: '#0ea5e9' },
  { id: 'amber', name: 'Amber Gold', hsl: '38 92% 55%', hex: '#f59e0b' },
  { id: 'sunset', name: 'Sunset Orange', hsl: '24 95% 58%', hex: '#f97316' },
  { id: 'rose', name: 'Neon Rose', hsl: '350 89% 65%', hex: '#f43f5e' },
  { id: 'slate', name: 'Clean Slate', hsl: '215 25% 65%', hex: '#94a3b8' }
]

export const MOOD_PRESETS: MoodPreset[] = [
  {
    id: 'rainy-cafe',
    name: 'Tokyo Rainy Cafe',
    icon: '☕',
    desc: 'ไฟส้มอบอุ่น เคล้าสายฝนพรำ กระจกการ์ดนุ่มนวล',
    wallpaperId: 'tokyo-cafe',
    accentId: 'amber',
    dimmer: 45,
    cardOpacity: 82
  },
  {
    id: 'zen-matcha',
    name: 'Kyoto Bamboo Zen',
    icon: '🍃',
    desc: 'เขียวมัทฉะสดชื่น ป่าไผ่เงียบสงบ สมาธิลึกซึ้ง',
    wallpaperId: 'kyoto-bamboo',
    accentId: 'matcha',
    dimmer: 40,
    cardOpacity: 80
  },
  {
    id: 'midnight-cyber',
    name: 'Midnight Cyberpunk',
    icon: '🌆',
    desc: 'นีออนม่วงสว่าง มิติไซเบอร์สเปซล้ำสมัย มีชีวิตชีวา',
    wallpaperId: 'minimal-cyberpunk',
    accentId: 'violet',
    dimmer: 55,
    cardOpacity: 88
  },
  {
    id: 'studio-minimal',
    name: 'Studio Minimalist',
    icon: '📄',
    desc: 'คมเข้ม เรียบหรู สะอาดตา การ์ดทึบโฟกัสตัวหนังสือ',
    wallpaperId: 'clean-slate',
    accentId: 'sky',
    dimmer: 25,
    cardOpacity: 95
  }
]

export interface ThemeSettings {
  wallpaperId: string
  customWallpaperUrl: string
  dimmer: number // 0 to 95 (percent)
  accentId: string
  cardOpacity: number // 30 to 100 (percent)
}

const DEFAULT_THEME: ThemeSettings = {
  wallpaperId: 'clean-slate',
  customWallpaperUrl: '',
  dimmer: 50,
  accentId: 'violet',
  cardOpacity: 85
}

// Global singleton reactive theme state shared across app.vue, ThemeCustomizer, etc.
const globalTheme = useLocalStorage<ThemeSettings>('noswitch:theme:v2', DEFAULT_THEME)

export function useTheme() {
  const theme = globalTheme

  // Ensure cardOpacity has a valid fallback if loaded from existing localStorage
  if (theme.value.cardOpacity === undefined || theme.value.cardOpacity === null) {
    theme.value.cardOpacity = 85
  }

  const activeWallpaper = computed(() => {
    if (theme.value.customWallpaperUrl) {
      return {
        id: 'custom',
        name: 'Custom Wallpaper',
        icon: '🖼️',
        desc: 'รูปภาพที่กำหนดเอง',
        url: theme.value.customWallpaperUrl,
        type: 'image' as const
      }
    }
    return WALLPAPER_PRESETS.find(w => w.id === theme.value.wallpaperId) || WALLPAPER_PRESETS[0]!
  })

  const activeAccent = computed(() => {
    return ACCENT_PRESETS.find(a => a.id === theme.value.accentId) || ACCENT_PRESETS[0]!
  })

  function setWallpaper(id: string) {
    theme.value.wallpaperId = id
    theme.value.customWallpaperUrl = ''
  }

  function setCustomWallpaper(url: string) {
    theme.value.customWallpaperUrl = url
  }

  function setAccent(accentId: string) {
    theme.value.accentId = accentId
  }

  function setDimmer(value: number) {
    theme.value.dimmer = Math.max(0, Math.min(95, value))
  }

  function setCardOpacity(value: number) {
    theme.value.cardOpacity = Math.max(30, Math.min(100, value))
  }

  function applyMood(moodId: string) {
    const mood = MOOD_PRESETS.find(m => m.id === moodId)
    if (!mood) return
    theme.value.wallpaperId = mood.wallpaperId
    theme.value.customWallpaperUrl = ''
    theme.value.accentId = mood.accentId
    theme.value.dimmer = mood.dimmer
    theme.value.cardOpacity = mood.cardOpacity
  }

  function resetTheme() {
    theme.value = { ...DEFAULT_THEME }
  }

  return {
    theme,
    activeWallpaper,
    activeAccent,
    setWallpaper,
    setCustomWallpaper,
    setAccent,
    setDimmer,
    setCardOpacity,
    applyMood,
    resetTheme,
    WALLPAPER_PRESETS,
    ACCENT_PRESETS,
    MOOD_PRESETS
  }
}


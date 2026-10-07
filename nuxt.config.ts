// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-11-01',
  devtools: { enabled: true },

  // Dashboard ใช้ LocalStorage ทั้งหมด จึงรันแบบ SPA (ไม่ต้อง SSR)
  ssr: false,

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      title: 'NoSwitch — Study Dashboard',
      htmlAttrs: { lang: 'th' },
      meta: [
        { name: 'description', content: 'All-in-One Study Hub: YouTube, AI Chat, Pomodoro, Calculator และ To-do ในหน้าเดียว ลดการสลับแอป' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap' },
      ],
    },
  },

  // API Key อยู่ฝั่ง Server เท่านั้น (อ่านจาก .env → AI_API_KEY / NUXT_AI_API_KEY)
  runtimeConfig: {
    aiApiKey: process.env.AI_API_KEY || '',
    aiModel: process.env.AI_MODEL || 'gemini-flash-latest',
  },

  // เพิ่มส่วนนี้เพื่อแก้บั๊ก Backslash บน Windows ของ Nuxt 4.6.0
  nitro: {
    externals: {
      inline: [/[\\/]node_modules[\\/]nuxt[\\/]dist[\\/]/]
    }
  }
})
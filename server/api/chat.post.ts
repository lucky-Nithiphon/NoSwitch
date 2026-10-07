/**
 * POST /api/chat
 * รับประวัติแชทจาก Frontend แล้วเรียก Google Gemini API ฝั่ง Server
 * API Key อ่านจาก .env (AI_API_KEY) เท่านั้น — ไม่ถูกส่งไปที่ Browser
 */
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `คุณคือผู้ช่วยติวหนังสือ (Study Assistant) ที่เป็นมิตรและกระชับ
- ตอบเป็นภาษาเดียวกับที่ผู้ใช้ถาม (ค่าเริ่มต้นภาษาไทย)
- อธิบายให้เข้าใจง่าย เป็นขั้นตอน ยกตัวอย่างเมื่อเหมาะสม
- สำหรับโจทย์คณิต/วิทย์ ให้แสดงวิธีทำ
- ตอบให้สั้นพอดี ไม่เยิ่นเย้อ เพื่อไม่ให้ผู้ใช้เสียสมาธิจากการอ่าน`

const MAX_HISTORY = 20
const MAX_CHARS = 8000

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const apiKey = config.aiApiKey || process.env.AI_API_KEY
  const model = config.aiModel || process.env.AI_MODEL || 'gemini-flash-latest'

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'AI API key missing',
      data: { message: 'ยังไม่ได้ตั้งค่า AI_API_KEY ในไฟล์ .env ฝั่ง Server (สร้างไฟล์ .env แล้วรัน npm run dev ใหม่)' },
    })
  }

  const body = await readBody<{ messages?: ChatMessage[] }>(event)
  const messages = Array.isArray(body?.messages) ? body.messages : []

  // Validate + จำกัดขนาด context
  const history = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_HISTORY)
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content.slice(0, MAX_CHARS) }],
    }))

  if (!history.length || history[history.length - 1]!.role !== 'user') {
    throw createError({ statusCode: 400, statusMessage: 'Bad request', data: { message: 'ต้องมีข้อความล่าสุดจากผู้ใช้' } })
  }

  try {
    const res: any = await $fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
        timeout: 60000,
        body: {
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: history,
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        },
      },
    )

    const reply: string =
      res?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') ||
      'ขออภัย ไม่สามารถสร้างคำตอบได้ ลองถามใหม่อีกครั้งนะครับ'

    return { reply }
  } catch (err: any) {
    const status = err?.response?.status || 502
    const detail = err?.data?.error?.message || err?.message || 'Unknown error'
    console.error('[api/chat] Gemini error:', status, detail)
    throw createError({ statusCode: status, statusMessage: 'AI API error', data: { message: `AI API error: ${detail}` } })
  }
})

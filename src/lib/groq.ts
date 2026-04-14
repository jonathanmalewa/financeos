import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
})

export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export async function generateAIResponse(
  messages: ChatMessage[],
  systemContext?: string
): Promise<string> {
  const systemMessages: ChatMessage[] = [
    {
      role: "system",
      content: `Kamu adalah ARIA (Artificial Intelligence for Resource and Intelligence Assistance), asisten AI cerdas untuk platform manajemen keuangan FinanceOS. 

Kemampuanmu:
- Membantu pengguna memahami data keuangan dan arsip
- Menganalisis laporan dan memberikan insight
- Membantu manajemen tugas dan prioritas
- Menjawab pertanyaan seputar keuangan dalam Bahasa Indonesia
- Memberikan rekomendasi berdasarkan data yang ada

Gaya komunikasi: Profesional namun ramah, gunakan Bahasa Indonesia yang baik. Gunakan emoji secukupnya untuk membuat percakapan lebih menarik.

${systemContext ? `\nKonteks tambahan:\n${systemContext}` : ""}`,
    },
  ]

  const allMessages = [...systemMessages, ...messages]

  const completion = await groq.chat.completions.create({
    messages: allMessages,
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_tokens: 2048,
    stream: false,
  })

  return completion.choices[0]?.message?.content || "Maaf, saya tidak dapat memproses permintaan Anda saat ini."
}

export async function generateStreamingResponse(
  messages: ChatMessage[],
  onChunk: (chunk: string) => void,
  systemContext?: string
): Promise<void> {
  const systemMessages: ChatMessage[] = [
    {
      role: "system",
      content: `Kamu adalah ARIA, asisten AI untuk FinanceOS - platform manajemen keuangan. Bantu pengguna dengan analisis data, manajemen arsip, dan pertanyaan keuangan dalam Bahasa Indonesia yang profesional dan ramah.${systemContext ? `\n\nKonteks: ${systemContext}` : ""}`,
    },
  ]

  const stream = await groq.chat.completions.create({
    messages: [...systemMessages, ...messages],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_tokens: 2048,
    stream: true,
  })

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || ""
    if (content) {
      onChunk(content)
    }
  }
}

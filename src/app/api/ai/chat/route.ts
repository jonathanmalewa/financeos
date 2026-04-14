import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateAIResponse, ChatMessage } from "@/lib/groq"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { message, conversationId } = await req.json()
  if (!message) return NextResponse.json({ error: "Pesan diperlukan" }, { status: 400 })

  // Get or create conversation
  let conversation = conversationId
    ? await prisma.aIConversation.findFirst({
        where: { id: conversationId, userId: session.user.id },
      })
    : null

  const existingMessages: ChatMessage[] = conversation
    ? (JSON.parse(conversation.messages) as ChatMessage[])
    : []

  // Build context from database
  const [taskStats, archiveCount] = await Promise.all([
    prisma.task.groupBy({ by: ["status"], _count: true }),
    prisma.archive.count(),
  ])

  const systemContext = `
Data platform FinanceOS saat ini:
- Total arsip dokumen: ${archiveCount}
- Status task: ${taskStats.map((s) => `${s.status}: ${s._count}`).join(", ")}
- User yang sedang login: ${session.user.name} (${session.user.role})
  `.trim()

  const newMessages: ChatMessage[] = [
    ...existingMessages,
    { role: "user", content: message },
  ]

  const response = await generateAIResponse(newMessages, systemContext)

  const updatedMessages: ChatMessage[] = [
    ...newMessages,
    { role: "assistant", content: response },
  ]

  // Keep last 20 messages for context
  const trimmed = updatedMessages.slice(-20)

  if (conversation) {
    await prisma.aIConversation.update({
      where: { id: conversation.id },
      data: { messages: JSON.stringify(trimmed) },
    })
  } else {
    conversation = await prisma.aIConversation.create({
      data: {
        userId: session.user.id,
        messages: JSON.stringify(trimmed),
      },
    })
  }

  return NextResponse.json({
    response,
    conversationId: conversation.id,
  })
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const conversation = await prisma.aIConversation.findFirst({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  })

  if (!conversation) return NextResponse.json({ messages: [], conversationId: null })

  return NextResponse.json({
    messages: JSON.parse(conversation.messages),
    conversationId: conversation.id,
  })
}

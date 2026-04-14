import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/audit"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

// GET /api/chat/rooms/[id]/messages
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: roomId } = await params

  // Verify membership
  const member = await prisma.chatRoomMember.findFirst({
    where: { roomId, userId: session.user.id },
  })
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const messages = await prisma.message.findMany({
    where: { roomId },
    include: { sender: { select: { id: true, name: true, avatar: true, role: true } } },
    orderBy: { createdAt: "asc" },
    take: 100,
  })

  // Mark messages as read
  await prisma.message.updateMany({
    where: { roomId, senderId: { not: session.user.id }, read: false },
    data: { read: true },
  })

  return NextResponse.json(messages)
}

// POST /api/chat/rooms/[id]/messages
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: roomId } = await params
  
  let content = ""
  let fileUrl: string | null = null
  let fileType: string | null = null

  const contentType = req.headers.get("content-type") || ""
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData()
    content = formData.get("content") as string || ""
    const file = formData.get("file") as File | null
    if (file) {
      const uploadDir = path.join(process.cwd(), "public", "uploads")
      await mkdir(uploadDir, { recursive: true })
      const ext = file.name.split(".").pop()
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const buffer = Buffer.from(await file.arrayBuffer())
      await writeFile(path.join(uploadDir, filename), buffer)
      fileUrl = `/uploads/${filename}`
      fileType = file.type
    }
  } else {
    const json = await req.json()
    content = json.content || ""
    fileUrl = json.fileUrl || null
    fileType = json.fileType || null
  }

  if (!content?.trim() && !fileUrl) {
    return NextResponse.json({ error: "Pesan atau file tidak boleh kosong" }, { status: 400 })
  }


  // Verify membership
  const member = await prisma.chatRoomMember.findFirst({
    where: { roomId, userId: session.user.id },
  })
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const message = await prisma.message.create({
    data: { content: content.trim(), roomId, senderId: session.user.id, fileUrl, fileType },
    include: { sender: { select: { id: true, name: true, avatar: true, role: true } } },
  })

  // Notify other members
  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    include: { members: { where: { userId: { not: session.user.id } }, include: { user: true } } },
  })

  if (room) {
    await Promise.all(
      room.members.map((m) =>
        createNotification({
          userId: m.userId, title: `Pesan dari ${session.user.name}`,
          message: content.length > 60 ? content.slice(0, 60) + "..." : content,
          type: "CHAT", link: "/chat",
        })
      )
    )
  }

  return NextResponse.json(message, { status: 201 })
}

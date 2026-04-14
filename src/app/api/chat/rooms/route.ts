import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"

// GET /api/chat/rooms
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rooms = await prisma.chatRoom.findMany({
    where: { members: { some: { userId: session.user.id } } },
    include: {
      members: { include: { user: { select: { id: true, name: true, avatar: true, role: true } } } },
      messages: { take: 1, orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(rooms)
}

// POST /api/chat/rooms — create or get DM room
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { targetUserId, isGroup, name, members } = await req.json()

  if (!isGroup) {
    // Check for existing DM room
    const existing = await prisma.chatRoom.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: session.user.id } } },
          { members: { some: { userId: targetUserId } } },
        ],
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        messages: { take: 1, orderBy: { createdAt: "desc" } },
      },
    })

    if (existing) return NextResponse.json(existing)

    const room = await prisma.chatRoom.create({
      data: {
        isGroup: false,
        members: { create: [{ userId: session.user.id }, { userId: targetUserId }] },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        messages: { take: 1, orderBy: { createdAt: "desc" } },
      },
    })

    return NextResponse.json(room, { status: 201 })
  }

  // Group chat
  const allMembers = [session.user.id, ...(members || [])]
  const room = await prisma.chatRoom.create({
    data: {
      isGroup: true,
      name: name || "Grup Baru",
      members: { create: allMembers.map((uid: string) => ({ userId: uid })) },
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      messages: { take: 1, orderBy: { createdAt: "desc" } },
    },
  })

  return NextResponse.json(room, { status: 201 })
}

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, createNotification } from "@/lib/audit"

// GET /api/tasks/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, email: true, avatar: true } },
      creator:  { select: { id: true, name: true, avatar: true } },
      comments: {
        include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!task) return NextResponse.json({ error: "Task tidak ditemukan" }, { status: 404 })

  return NextResponse.json(task)
}

// PATCH /api/tasks/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const task = await prisma.task.findUnique({ where: { id } })
  if (!task) return NextResponse.json({ error: "Task tidak ditemukan" }, { status: 404 })

  // Staff can only update their own tasks status
  if (session.user.role === "STAFF" && task.creatorId !== session.user.id && task.assigneeId !== session.user.id) {
    return NextResponse.json({ error: "Tidak memiliki izin" }, { status: 403 })
  }

  const updated = await prisma.task.update({
    where: { id },
    data: {
      title:       body.title       ?? undefined,
      description: body.description ?? undefined,
      status:      body.status      ?? undefined,
      priority:    body.priority    ?? undefined,
      dueDate:     body.dueDate     ? new Date(body.dueDate) : undefined,
      assigneeId:  body.assigneeId  ?? undefined,
      order:       body.order       ?? undefined,
      tags:        body.tags        ? JSON.stringify(body.tags) : undefined,
    },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      creator:  { select: { id: true, name: true } },
    },
  })

  await createAuditLog({
    userId: session.user.id, action: "Memperbarui task",
    target: "Task", targetId: id, metadata: { changes: body },
  })

  // Notify new assignee
  if (body.assigneeId && body.assigneeId !== session.user.id && body.assigneeId !== task.assigneeId) {
    await createNotification({
      userId: body.assigneeId, title: "Task Ditugaskan",
      message: `Anda ditugaskan ke task: "${updated.title}"`,
      type: "TASK", link: "/tasks",
    })
  }

  return NextResponse.json(updated)
}

// DELETE /api/tasks/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const task = await prisma.task.findUnique({ where: { id } })
  if (!task) return NextResponse.json({ error: "Task tidak ditemukan" }, { status: 404 })

  if (session.user.role === "STAFF" && task.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Hanya dapat menghapus task yang Anda buat" }, { status: 403 })
  }

  await prisma.task.delete({ where: { id } })
  await createAuditLog({ userId: session.user.id, action: "Menghapus task", target: "Task", targetId: id, metadata: { title: task.title } })

  return NextResponse.json({ message: "Task berhasil dihapus" })
}

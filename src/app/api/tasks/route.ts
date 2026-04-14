import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, createNotification } from "@/lib/audit"

// GET /api/tasks — list tasks
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const priority = searchParams.get("priority")
  const assigneeId = searchParams.get("assigneeId")

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (priority) where.priority = priority
  if (assigneeId) where.assigneeId = assigneeId

  // --- LAZY EVALUATION FOR AUTO-DONE ---
  // Jika ada task IN_REVIEW yang tidak di-approve dalam 1x24 jam (berdasarkan updatedAt), autoupdate ke DONE.
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
  
  // Ambil task expired yang belum DONE
  const expiredTasks = await prisma.task.findMany({
    where: { status: "IN_REVIEW", updatedAt: { lt: yesterday } },
    select: { id: true, assigneeId: true, creatorId: true, title: true }
  })
  
  if (expiredTasks.length > 0) {
    await prisma.task.updateMany({
      where: { id: { in: expiredTasks.map(t => t.id) } },
      data: { status: "DONE", updatedAt: new Date() } // Update timestamp juga
    })
    
    // Kirim notifikasi (hanya ke assignee atau creator) secara paralel
    await Promise.all(
      expiredTasks.map(t => {
        const targetId = t.assigneeId || t.creatorId
        if (!targetId) return Promise.resolve(null)
        return createNotification({
          userId: targetId,
          title: "Task Otomatis Selesai",
          message: `Task "${t.title}" telah diselesaikan otomatis (1x24 jam di In Review)`,
          type: "TASK",
          link: "/tasks",
        })
      })
    )
  }
  // --- END OF LAZY EVALUATION ---

  // Staff kini bisa melihat SEMUA task secara global (Visibility)
  // Jadi pembatasan where.OR = [{ assigneeId... }] sudah DIHAPUS.

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true, email: true, avatar: true } },
      creator:  { select: { id: true, name: true } },
      _count:   { select: { comments: true } },
    },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  })

  return NextResponse.json(tasks)
}

// POST /api/tasks — create task
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { title, description, status, priority, dueDate, assigneeId, tags } = body

  if (!title) return NextResponse.json({ error: "Judul task diperlukan" }, { status: 400 })

  const task = await prisma.task.create({
    data: {
      title,
      description: description || null,
      status: status || "TODO",
      priority: priority || "MEDIUM",
      dueDate: dueDate ? new Date(dueDate) : null,
      assigneeId: assigneeId || null,
      creatorId: session.user.id,
      tags: tags ? JSON.stringify(tags) : null,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true, avatar: true } },
      creator:  { select: { id: true, name: true } },
    },
  })

  await createAuditLog({
    userId: session.user.id,
    action: "Membuat task",
    target: "Task",
    targetId: task.id,
    metadata: { title },
  })

  // Notify assignee
  if (assigneeId && assigneeId !== session.user.id) {
    await createNotification({
      userId: assigneeId,
      title: "Task Baru Ditugaskan",
      message: `Anda ditugaskan ke task: "${title}"`,
      type: "TASK",
      link: "/tasks",
    })
  }

  return NextResponse.json(task, { status: 201 })
}

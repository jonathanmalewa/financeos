import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/audit"

// POST /api/tasks/[id]/comments
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: taskId } = await params
  const { content } = await req.json()
  if (!content) return NextResponse.json({ error: "Konten komentar diperlukan" }, { status: 400 })

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { creator: true, assignee: true },
  })
  if (!task) return NextResponse.json({ error: "Task tidak ditemukan" }, { status: 404 })

  const comment = await prisma.taskComment.create({
    data: { content, taskId, userId: session.user.id },
    include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
  })

  // Notify task creator and assignee (not the commenter)
  const toNotify = new Set<string>()
  if (task.creatorId !== session.user.id) toNotify.add(task.creatorId)
  if (task.assigneeId && task.assigneeId !== session.user.id) toNotify.add(task.assigneeId)
  
  for (const uid of toNotify) {
    await createNotification({
      userId: uid, title: "Komentar Baru",
      message: `${session.user.name} mengomentari task "${task.title}"`,
      type: "TASK", link: "/tasks",
    })
  }

  return NextResponse.json(comment, { status: 201 })
}

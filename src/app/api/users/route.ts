import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, createNotification } from "@/lib/audit"

// GET /api/users
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, role: true, status: true,
      avatar: true, department: true, phone: true, createdAt: true,
      _count: { select: { tasks: true, archives: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(users)
}

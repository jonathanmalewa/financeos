import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const users = await prisma.user.findMany({
    where: { status: "APPROVED", NOT: { id: session.user.id } },
    select: { id: true, name: true, email: true, role: true, department: true, avatar: true },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(users)
}

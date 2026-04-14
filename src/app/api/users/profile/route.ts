import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { name, phone, department } = await req.json()

    if (!name) {
      return NextResponse.json({ error: "Nama tidak boleh kosong" }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        phone: phone || null,
        department: department || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        department: true,
      }
    })

    await createAuditLog({
      userId: session.user.id,
      action: "Memperbarui Profil",
      target: "User",
      targetId: session.user.id,
      metadata: { changes: { name, phone, department } },
    })

    return NextResponse.json({ message: "Profil berhasil diperbarui", user: updatedUser })
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 })
  }
}

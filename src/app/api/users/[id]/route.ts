import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, createNotification } from "@/lib/audit"

// PATCH /api/users/[id] — update role/status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const { role, status } = body

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })

  const updated = await prisma.user.update({
    where: { id },
    data: {
      role:   role   ?? undefined,
      status: status ?? undefined,
    },
    select: { id: true, name: true, email: true, role: true, status: true },
  })

  await createAuditLog({
    userId: session.user.id, action: "Memperbarui user",
    target: "User", targetId: id, metadata: { changes: body },
  })

  // Notify user about status change
  if (status && status !== user.status) {
    const messages: Record<string, { title: string; message: string; type: "SUCCESS" | "ERROR" | "WARNING" | "INFO" }> = {
      APPROVED:  { title: "Akun Disetujui 🎉", message: "Akun Anda telah disetujui. Sekarang Anda dapat mengakses platform.", type: "SUCCESS" },
      REJECTED:  { title: "Akun Ditolak", message: "Maaf, pendaftaran akun Anda telah ditolak oleh admin.", type: "ERROR" },
      SUSPENDED: { title: "Akun Disuspend", message: "Akun Anda telah disuspend. Hubungi admin untuk informasi lebih lanjut.", type: "WARNING" },
    }

    if (messages[status]) {
      await createNotification({ userId: id, ...messages[status], link: "/dashboard" })
    }
  }

  return NextResponse.json(updated)
}

// DELETE /api/users/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  if (id === session.user.id) return NextResponse.json({ error: "Tidak dapat menghapus akun sendiri" }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })

  try {
    // 1. Dapatkan atau buat pengguna "Anonim" untuk menampung data
    let anonUser = await prisma.user.findFirst({ where: { email: { startsWith: "deleted_anon" } } })
    if (!anonUser) {
      anonUser = await prisma.user.create({
        data: {
          name: "Pengguna Dihapus",
          email: `deleted_anon_${Date.now()}@system.local`,
          password: "none",
          role: "STAFF",
          status: "REJECTED",
        }
      })
    }

    // 2. Alihkan semua relasi yang wajib ke akun Anonim (Assignee bisa null)
    await prisma.$transaction([
      prisma.task.updateMany({ where: { creatorId: id }, data: { creatorId: anonUser.id } }),
      prisma.task.updateMany({ where: { assigneeId: id }, data: { assigneeId: null } }),
      prisma.taskComment.updateMany({ where: { userId: id }, data: { userId: anonUser.id } }),
      prisma.archive.updateMany({ where: { uploaderId: id }, data: { uploaderId: anonUser.id } }),
      prisma.message.updateMany({ where: { senderId: id }, data: { senderId: anonUser.id } }),
      prisma.message.updateMany({ where: { receiverId: id }, data: { receiverId: null } }),
      prisma.auditLog.updateMany({ where: { userId: id }, data: { userId: anonUser.id } }),
      // Bersihkan member dari chat room
      prisma.chatRoomMember.deleteMany({ where: { userId: id } }),
      // Terakhir, hapus pengguna aslinya
      prisma.user.delete({ where: { id } })
    ])

    await createAuditLog({ userId: session.user.id, action: "Menghapus user", target: "User", targetId: id, metadata: { email: user.email } })

    return NextResponse.json({ message: "User berhasil dihapus" })
  } catch (error: any) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Gagal menghapus pengguna karena masalah internal database" }, { status: 500 })
  }
}

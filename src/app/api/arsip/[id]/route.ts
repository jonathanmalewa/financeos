import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { unlink } from "fs/promises"
import path from "path"

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "MANAGER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const archive = await prisma.archive.findUnique({ where: { id } })
  if (!archive) return NextResponse.json({ error: "Arsip tidak ditemukan" }, { status: 404 })

  // Only admin or uploader can delete
  if (session.user.role === "STAFF" && archive.uploaderId !== session.user.id) {
    return NextResponse.json({ error: "Tidak memiliki izin" }, { status: 403 })
  }

  // Delete file from disk
  try {
    const filePath = path.join(process.cwd(), "public", archive.fileUrl)
    await unlink(filePath)
  } catch { /* file might not exist */ }

  await prisma.archive.delete({ where: { id } })
  await createAuditLog({
    userId: session.user.id, action: "Menghapus arsip",
    target: "Archive", targetId: id, metadata: { title: archive.title },
  })

  return NextResponse.json({ message: "Arsip berhasil dihapus" })
}

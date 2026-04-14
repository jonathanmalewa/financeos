import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog, createNotification } from "@/lib/audit"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

// GET /api/arsip
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")
  const category = searchParams.get("category")

  const where: Record<string, unknown> = {}
  if (q) where.OR = [
    { title: { contains: q } },
    { description: { contains: q } },
    { tags: { contains: q } },
  ]
  if (category) where.category = category

  const archives = await prisma.archive.findMany({
    where,
    include: { uploader: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(archives)
}

// POST /api/arsip — upload
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (session.user.role === "MANAGER") {
      return NextResponse.json({ error: "Manager tidak dapat mengupload" }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const title = formData.get("title") as string | null
    const description = formData.get("description") as string | null
    const tags = formData.get("tags") as string | null
    const category = formData.get("category") as string | null
    const divisi = formData.get("divisi") as string | null
    const dateStr = formData.get("date") as string | null

    if (!file || !title) {
      return NextResponse.json({ error: "File dan judul diperlukan" }, { status: 400 })
    }

    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "Ukuran file maksimal 50MB" }, { status: 400 })
    }

    // ====== OPTION A: LOCAL GOOGLE DRIVE MAPPING ======
    const ext = file.name.split(".").pop()
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    // Gunakan direktori lokal public/uploads (yang di-mount ke Volume Docker)
    const uploadDir = path.join(process.cwd(), "public", "uploads")
    await mkdir(uploadDir, { recursive: true })
    
    await writeFile(path.join(uploadDir, filename), buffer)

    // Kita gunakan link jembatan API untuk mendownload/membaca agar terlindungi sesi login
    const finalFileUrl = `/api/arsip/download?file=${filename}`

    // Set Base Date for generate
    const archiveDate = dateStr ? new Date(dateStr) : new Date()

    let nomorArsip: string | undefined = undefined
    let prefix = "ARSIP"
    if (divisi === "Tatalaksana") prefix = "TATA"
    else if (divisi === "PSDA") prefix = "PSDA"
    else if (divisi === "Perencanaan") prefix = "RENA"

    if (divisi) {
      const dd = String(archiveDate.getDate()).padStart(2, '0')
      const mm = String(archiveDate.getMonth() + 1).padStart(2, '0')
      const yyyy = archiveDate.getFullYear()
      
      const startOfDay = new Date(archiveDate)
      startOfDay.setHours(0,0,0,0)
      const endOfDay = new Date(archiveDate)
      endOfDay.setHours(23,59,59,999)
      
      const countToday = await prisma.archive.count({
        where: {
          divisi,
          createdAt: { gte: startOfDay, lte: endOfDay }
        }
      })
      
      const urutan = String(countToday + 1).padStart(3, '0')
      nomorArsip = `${prefix}/${urutan}/${dd}/${mm}/${yyyy}`
    }

    const archive = await prisma.archive.create({
      data: {
        title,
        description: description || null,
        filename: file.name,
        fileUrl: finalFileUrl,
        fileType: file.type,
        fileSize: file.size,
        tags: tags || null,
        category: category || null,
        divisi: divisi || null,
        nomorArsip,
        uploaderId: session.user.id,
      },
      include: { uploader: { select: { id: true, name: true, avatar: true } } },
    })

    await createAuditLog({
      userId: session.user.id, action: "Upload arsip",
      target: "Archive", targetId: archive.id,
      metadata: { title, filename: file.name, fileSize: file.size },
    })

    const toNotify = await prisma.user.findMany({
      where: { status: "APPROVED", role: { in: ["ADMIN", "MANAGER"] }, NOT: { id: session.user.id } },
      select: { id: true },
    })

    await Promise.all(
      toNotify.map((u) =>
        createNotification({
          userId: u.id, title: "Arsip Baru Diupload",
          message: `${session.user.name} mengupload dokumen: "${title}"`,
          type: "ARCHIVE", link: "/arsip",
        })
      )
    )

    return NextResponse.json(archive, { status: 201 })
  } catch (error: any) {
    console.error("Archive upload error:", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}

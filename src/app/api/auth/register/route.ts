import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, department, phone } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nama, email, dan password wajib diisi" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password minimal 8 karakter" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    // First user gets ADMIN role and is auto-approved
    const userCount = await prisma.user.count()
    const isFirst = userCount === 0

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        department: department || null,
        phone: phone || null,
        role: isFirst ? "ADMIN" : "STAFF",
        status: isFirst ? "APPROVED" : "PENDING",
      },
    })

    // Notify all admins about new registration
    if (!isFirst) {
      const admins = await prisma.user.findMany({ where: { role: "ADMIN", status: "APPROVED" } })
      await Promise.all(
        admins.map((admin) =>
          prisma.notification.create({
            data: {
              userId: admin.id,
              title: "Pendaftaran Baru",
              message: `${name} (${email}) mendaftar dan menunggu persetujuan`,
              type: "USER",
              link: "/users",
            },
          })
        )
      )
    }

    return NextResponse.json({
      message: isFirst
        ? "Akun admin berhasil dibuat"
        : "Registrasi berhasil. Menunggu persetujuan admin.",
      isAdmin: isFirst,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

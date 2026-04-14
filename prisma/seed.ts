import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database FinanceOS...")

  // Create demo users
  const hash = (pw: string) => bcrypt.hash(pw, 12)

  const [admin, manager, staff] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@financeos.id" },
      update: {},
      create: {
        name: "Admin FinanceOS",
        email: "admin@financeos.id",
        password: await hash("password123"),
        role: "ADMIN",
        status: "APPROVED",
        department: "IT",
      },
    }),
    prisma.user.upsert({
      where: { email: "manager@financeos.id" },
      update: {},
      create: {
        name: "Budi Santoso",
        email: "manager@financeos.id",
        password: await hash("password123"),
        role: "MANAGER",
        status: "APPROVED",
        department: "Keuangan",
      },
    }),
    prisma.user.upsert({
      where: { email: "staff@financeos.id" },
      update: {},
      create: {
        name: "Siti Rahayu",
        email: "staff@financeos.id",
        password: await hash("password123"),
        role: "STAFF",
        status: "APPROVED",
        department: "Akuntansi",
      },
    }),
  ])

  // Create sample tasks
  const tasks = [
    {
      title: "Review Laporan Keuangan Q4 2024",
      description: "Periksa dan validasi laporan keuangan kuartal keempat sebelum rapat dewan",
      status: "IN_PROGRESS" as const,
      priority: "URGENT" as const,
      creatorId: admin.id,
      assigneeId: manager.id,
      dueDate: new Date("2025-01-15"),
      tags: JSON.stringify(["keuangan", "laporan", "Q4"]),
    },
    {
      title: "Rekonsiliasi Bank Desember",
      description: "Lakukan rekonsiliasi saldo bank untuk bulan Desember 2024",
      status: "TODO" as const,
      priority: "HIGH" as const,
      creatorId: manager.id,
      assigneeId: staff.id,
      dueDate: new Date("2025-01-10"),
      tags: JSON.stringify(["rekonsiliasi", "bank"]),
    },
    {
      title: "Update Data Supplier",
      description: "Perbarui database supplier dengan informasi kontak terbaru",
      status: "TODO" as const,
      priority: "MEDIUM" as const,
      creatorId: admin.id,
      assigneeId: staff.id,
      tags: JSON.stringify(["supplier", "database"]),
    },
    {
      title: "Audit Internal Sistem",
      description: "Lakukan audit internal terhadap sistem pencatatan keuangan",
      status: "IN_REVIEW" as const,
      priority: "HIGH" as const,
      creatorId: admin.id,
      assigneeId: manager.id,
      tags: JSON.stringify(["audit", "internal"]),
    },
    {
      title: "Persiapan Laporan Pajak",
      description: "Kumpulkan dan siapkan dokumen untuk pelaporan pajak tahunan",
      status: "DONE" as const,
      priority: "URGENT" as const,
      creatorId: manager.id,
      assigneeId: staff.id,
      tags: JSON.stringify(["pajak", "tahunan"]),
    },
  ]

  for (const task of tasks) {
    await prisma.task.create({ data: task })
  }

  // Create audit logs
  const auditActions = [
    { action: "Login ke sistem", userId: admin.id },
    { action: "Membuat task", target: "Task", userId: admin.id },
    { action: "Memperbarui user", target: "User", userId: admin.id },
    { action: "Upload arsip", target: "Archive", userId: staff.id },
    { action: "Login ke sistem", userId: manager.id },
  ]

  for (const log of auditActions) {
    await prisma.auditLog.create({ data: log })
  }

  // Create welcome notifications
  for (const user of [admin, manager, staff]) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Selamat Datang di FinanceOS! 🎉",
        message: `Halo ${user.name}! Akun Anda telah aktif. Jelajahi fitur-fitur platform manajemen keuangan kami.`,
        type: "SUCCESS",
        link: "/dashboard",
      },
    })
  }

  // Create group chat room
  const groupRoom = await prisma.chatRoom.create({
    data: {
      name: "Tim Keuangan",
      isGroup: true,
      members: {
        create: [
          { userId: admin.id },
          { userId: manager.id },
          { userId: staff.id },
        ],
      },
    },
  })

  // Seed messages
  const sampleMessages = [
    { content: "Selamat datang di chat tim keuangan! 👋", senderId: admin.id },
    { content: "Terima kasih! Siap berkolaborasi bersama.", senderId: manager.id },
    { content: "Hallo semuanya! Semangat kerja hari ini 🚀", senderId: staff.id },
  ]

  for (const msg of sampleMessages) {
    await prisma.message.create({
      data: { ...msg, roomId: groupRoom.id },
    })
  }

  console.log("✅ Database berhasil di-seed!")
  console.log("\n📋 Akun Demo:")
  console.log("  Admin   : admin@financeos.id / password123")
  console.log("  Manager : manager@financeos.id / password123")
  console.log("  Staff   : staff@financeos.id / password123")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

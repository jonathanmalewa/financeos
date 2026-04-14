require("dotenv").config()

const { PrismaClient } = require("@prisma/client")
const { PrismaLibSql } = require("@prisma/adapter-libsql")
const bcrypt = require("bcryptjs")

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || "file:./prisma/dev.db",
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding FinanceOS database...")

  const hash = (pw) => bcrypt.hash(pw, 12)

  const admin = await prisma.user.upsert({
    where: { email: "admin@financeos.id" },
    update: {},
    create: { name: "Admin FinanceOS", email: "admin@financeos.id", password: await hash("password123"), role: "ADMIN", status: "APPROVED", department: "IT" },
  })

  const manager = await prisma.user.upsert({
    where: { email: "manager@financeos.id" },
    update: {},
    create: { name: "Budi Santoso", email: "manager@financeos.id", password: await hash("password123"), role: "MANAGER", status: "APPROVED", department: "Keuangan" },
  })

  const staff = await prisma.user.upsert({
    where: { email: "staff@financeos.id" },
    update: {},
    create: { name: "Siti Rahayu", email: "staff@financeos.id", password: await hash("password123"), role: "STAFF", status: "APPROVED", department: "Akuntansi" },
  })

  console.log(`✅ Users: ${admin.email}, ${manager.email}, ${staff.email}`)

  const tasksData = [
    { title: "Review Laporan Keuangan Q4 2024", description: "Periksa laporan keuangan", status: "IN_PROGRESS", priority: "URGENT", creatorId: admin.id, assigneeId: manager.id, tags: JSON.stringify(["keuangan","Q4"]) },
    { title: "Rekonsiliasi Bank Desember", description: "Rekonsiliasi saldo bank", status: "TODO", priority: "HIGH", creatorId: manager.id, assigneeId: staff.id, tags: JSON.stringify(["rekonsiliasi","bank"]) },
    { title: "Update Data Supplier", description: "Perbarui database supplier", status: "TODO", priority: "MEDIUM", creatorId: admin.id, assigneeId: staff.id, tags: JSON.stringify(["supplier"]) },
    { title: "Audit Internal Sistem", description: "Audit pencatatan keuangan", status: "IN_REVIEW", priority: "HIGH", creatorId: admin.id, assigneeId: manager.id, tags: JSON.stringify(["audit"]) },
    { title: "Persiapan Laporan Pajak", description: "Dokumen pajak tahunan", status: "DONE", priority: "URGENT", creatorId: manager.id, assigneeId: staff.id, tags: JSON.stringify(["pajak"]) },
  ]
  for (const task of tasksData) {
    try { await prisma.task.create({ data: task }) } catch {}
  }
  console.log("✅ Tasks created")

  for (const user of [admin, manager, staff]) {
    try {
      await prisma.notification.create({
        data: { userId: user.id, title: "Selamat Datang di FinanceOS! 🎉", message: `Halo ${user.name}! Akun Anda telah aktif.`, type: "SUCCESS", link: "/dashboard" }
      })
    } catch {}
  }

  try {
    await prisma.auditLog.createMany({
      data: [
        { action: "Login ke sistem", userId: admin.id },
        { action: "Membuat task", target: "Task", userId: admin.id },
        { action: "Login ke sistem", userId: manager.id },
        { action: "Login ke sistem", userId: staff.id },
      ]
    })
  } catch {}

  try {
    const groupRoom = await prisma.chatRoom.create({
      data: {
        name: "Tim Keuangan", isGroup: true,
        members: { create: [{ userId: admin.id }, { userId: manager.id }, { userId: staff.id }] },
      },
    })
    for (const msg of [
      { content: "Selamat datang di chat tim keuangan! 👋", senderId: admin.id },
      { content: "Terima kasih! Siap berkolaborasi.", senderId: manager.id },
      { content: "Hallo semuanya! 🚀", senderId: staff.id },
    ]) {
      await prisma.message.create({ data: { ...msg, roomId: groupRoom.id } })
    }
  } catch {}

  console.log("\n🎉 Database seed selesai!")
  console.log("  Admin   : admin@financeos.id / password123")
  console.log("  Manager : manager@financeos.id / password123")
  console.log("  Staff   : staff@financeos.id / password123")
}

main()
  .catch((e) => { console.error("❌ Error:", e); process.exit(1) })
  .finally(() => prisma.$disconnect())

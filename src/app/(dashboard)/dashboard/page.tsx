import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import DashboardClient from "./DashboardClient"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const [totalUsers, totalTasks, totalArchives, pendingUsers, recentTasks, recentArchives, recentLogs] =
    await Promise.all([
      prisma.user.count({ where: { status: "APPROVED" } }),
      prisma.task.count({ where: { status: { notIn: ["DONE"] } } }),
      prisma.archive.count(),
      prisma.user.count({ where: { status: "PENDING" } }),
      prisma.task.findMany({
        take: 5, orderBy: { createdAt: "desc" },
        include: { assignee: true, creator: true },
      }),
      prisma.archive.findMany({
        take: 4, orderBy: { createdAt: "desc" },
        include: { uploader: true },
      }),
      prisma.auditLog.findMany({
        take: 8, orderBy: { createdAt: "desc" },
        include: { user: true },
      }),
    ])

  // Task stats
  const taskStats = await prisma.task.groupBy({
    by: ["status"],
    _count: true,
  })

  return (
    <DashboardClient
      stats={{ totalUsers, totalTasks, totalArchives, pendingUsers }}
      taskStats={taskStats}
      recentTasks={JSON.parse(JSON.stringify(recentTasks))}
      recentArchives={JSON.parse(JSON.stringify(recentArchives))}
      recentLogs={JSON.parse(JSON.stringify(recentLogs))}
      userRole={session.user.role}
      userName={session.user.name || ""}
    />
  )
}

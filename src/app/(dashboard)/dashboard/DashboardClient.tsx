"use client"

import {
  Users, CheckSquare, Archive, Clock, TrendingUp, TrendingDown,
  Plus, ArrowRight, FileText, Activity, AlertCircle
} from "lucide-react"
import Link from "next/link"
import { formatRelative, formatDate, getInitials } from "@/lib/utils"
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts"

interface Props {
  stats: { totalUsers: number; totalTasks: number; totalArchives: number; pendingUsers: number }
  taskStats: { status: string; _count: number }[]
  recentTasks: Array<{
    id: string; title: string; status: string; priority: string; dueDate: string | null
    assignee: { name: string } | null; creator: { name: string }; createdAt: string
  }>
  recentArchives: Array<{
    id: string; title: string; fileType: string; fileSize: number; createdAt: string
    uploader: { name: string }
  }>
  recentLogs: Array<{
    id: string; action: string; target: string | null; createdAt: string
    user: { name: string; role: string }
  }>
  userRole: string
  userName: string
}

const statusColors: Record<string, string> = {
  TODO:        "#6b7280",
  IN_PROGRESS: "#3b82f6",
  IN_REVIEW:   "#a78bfa",
  DONE:        "#22c55e",
}

const priorityStyles: Record<string, { color: string; label: string }> = {
  LOW:    { color: "#4ade80", label: "Rendah" },
  MEDIUM: { color: "#facc15", label: "Sedang" },
  HIGH:   { color: "#fb923c", label: "Tinggi" },
  URGENT: { color: "#f87171", label: "Urgent" },
}

const statCards = (stats: Props["stats"]) => [
  {
    title: "Pengguna Aktif", value: stats.totalUsers, icon: Users,
    color: "#3b82f6", bg: "rgba(59,130,246,0.1)",
    sub: stats.pendingUsers > 0 ? `${stats.pendingUsers} menunggu approval` : "Semua aktif",
    trend: "+5%",
  },
  {
    title: "Task Aktif", value: stats.totalTasks, icon: CheckSquare,
    color: "#a78bfa", bg: "rgba(139,92,246,0.1)",
    sub: "Task belum selesai", trend: "+12%",
  },
  {
    title: "Total Arsip", value: stats.totalArchives, icon: Archive,
    color: "#fb923c", bg: "rgba(249,115,22,0.1)",
    sub: "Dokumen tersimpan", trend: "+8%",
  },
  {
    title: "Pending Approval", value: stats.pendingUsers, icon: Clock,
    color: "#facc15", bg: "rgba(234,179,8,0.1)",
    sub: "User menunggu", trend: stats.pendingUsers > 0 ? "Perlu aksi" : "Bersih",
  },
]

export default function DashboardClient({ stats, taskStats, recentTasks, recentArchives, recentLogs, userRole }: Props) {
  const pieData = taskStats.map((s) => ({
    name: s.status.replace(/_/g, " "),
    value: s._count,
    color: statusColors[s.status] || "#6b7280",
  }))

  const barData = [
    { name: "Sen", tasks: 4, arsip: 2 },
    { name: "Sel", tasks: 7, arsip: 5 },
    { name: "Rab", tasks: 3, arsip: 1 },
    { name: "Kam", tasks: 9, arsip: 6 },
    { name: "Jum", tasks: 6, arsip: 4 },
    { name: "Sab", tasks: 2, arsip: 1 },
    { name: "Min", tasks: 1, arsip: 0 },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        {statCards(stats).map((card) => (
          <div key={card.title} className="card card-glow" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <card.icon size={22} color={card.color} />
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600,
                color: card.trend.startsWith("+") ? "#4ade80" : "#f87171",
                background: card.trend.startsWith("+") ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                padding: "2px 8px", borderRadius: 99,
              }}>
                {card.trend.startsWith("+") ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {card.trend}
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1, marginBottom: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {card.value}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{card.title}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
        {/* Bar Chart */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Aktivitas Mingguan</h3>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>Task & Arsip yang diproses</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: "#f9fafb" }}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
              />
              <Bar dataKey="tasks" fill="#3b82f6" radius={[4,4,0,0]} name="Task" />
              <Bar dataKey="arsip" fill="#8b5cf6" radius={[4,4,0,0]} name="Arsip" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>Status Task</h3>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: "var(--text-muted)" }}>Distribusi saat ini</p>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                {pieData.map((d) => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: d.color }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160, color: "var(--text-muted)", fontSize: 13 }}>
              Belum ada task
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: "grid", gridTemplateColumns: userRole !== "STAFF" ? "1fr 1fr" : "1fr", gap: 16 }}>

        {/* Recent Tasks */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Task Terbaru</h3>
            <Link href="/tasks" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>
              Lihat semua <ArrowRight size={13} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentTasks.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                <CheckSquare size={24} style={{ marginBottom: 8, opacity: 0.3 }} />
                <p style={{ margin: 0 }}>Belum ada task</p>
              </div>
            ) : recentTasks.map((task) => {
              const prio = priorityStyles[task.priority]
              return (
                <div key={task.id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  background: "var(--bg-glass)", borderRadius: "var(--radius)",
                  border: "1px solid var(--border-subtle)",
                }}>
                  <div style={{ width: 3, height: 32, borderRadius: 2, background: statusColors[task.status], flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {task.assignee?.name || "Belum ditugaskan"} • {formatRelative(task.createdAt)}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: prio.color, background: `${prio.color}18`, padding: "2px 7px", borderRadius: 99, flexShrink: 0 }}>
                    {prio.label}
                  </span>
                </div>
              )
            })}
          </div>
          <Link href="/tasks" className="btn btn-secondary btn-sm" style={{ width: "100%", marginTop: 12, justifyContent: "center" }}>
            <Plus size={14} /> Buat Task Baru
          </Link>
        </div>

        {/* Audit Log / Activity */}
        {userRole !== "STAFF" && (
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Aktivitas Terkini</h3>
              {userRole === "ADMIN" && (
                <Link href="/audit-log" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>
                  Audit Log <ArrowRight size={13} />
                </Link>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {recentLogs.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                  <Activity size={24} style={{ marginBottom: 8, opacity: 0.3 }} />
                  <p style={{ margin: 0 }}>Belum ada aktivitas</p>
                </div>
              ) : recentLogs.map((log) => (
                <div key={log.id} style={{
                  display: "flex", gap: 10, padding: "9px 0",
                  borderBottom: "1px solid var(--border-subtle)",
                }}>
                  <div className="avatar avatar-sm" style={{ flexShrink: 0, marginTop: 2 }}>
                    {getInitials(log.user.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "var(--text-primary)" }}>
                      <span style={{ fontWeight: 600 }}>{log.user.name}</span>
                      {" · "}
                      <span style={{ color: "var(--text-secondary)" }}>{log.action}</span>
                      {log.target && (
                        <span style={{ color: "var(--text-muted)" }}> {log.target}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {formatRelative(log.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pending approval alert (Admin only) */}
      {userRole === "ADMIN" && stats.pendingUsers > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 14, padding: "16px 20px",
          background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.25)",
          borderRadius: "var(--radius-lg)",
        }}>
          <AlertCircle size={20} color="#facc15" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#facc15" }}>
              {stats.pendingUsers} pengguna menunggu persetujuan
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Tinjau dan setujui atau tolak pendaftaran pengguna baru
            </div>
          </div>
          <Link href="/users" className="btn btn-sm" style={{ background: "rgba(234,179,8,0.15)", color: "#facc15", border: "1px solid rgba(234,179,8,0.30)", flexShrink: 0 }}>
            Tinjau Sekarang
          </Link>
        </div>
      )}
    </div>
  )
}

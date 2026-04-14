"use client"

import { useState, useEffect } from "react"
import {
  Users, UserCheck, UserX, Shield, Star, Clock,
  Search, ChevronDown, Trash2, MoreVertical, Filter, RefreshCw
} from "lucide-react"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"
import { formatDate, formatRelative, getInitials } from "@/lib/utils"
import ConfirmModal from "@/components/ui/ConfirmModal"

interface User {
  id: string; name: string; email: string; role: "ADMIN" | "MANAGER" | "STAFF"
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED"
  department?: string; phone?: string; createdAt: string
  _count: { tasks: number; archives: number }
}

const roleConfig = {
  ADMIN:   { color: "#60a5fa", icon: Shield, label: "Admin", bg: "rgba(59,130,246,0.1)" },
  MANAGER: { color: "#a78bfa", icon: Star, label: "Manager", bg: "rgba(139,92,246,0.1)" },
  STAFF:   { color: "#4ade80", icon: Users, label: "Staff", bg: "rgba(34,197,94,0.1)" },
}

const statusConfig = {
  APPROVED:  { color: "#4ade80", label: "Aktif", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.25)" },
  PENDING:   { color: "#facc15", label: "Pending", bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.25)" },
  REJECTED:  { color: "#f87171", label: "Ditolak", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)" },
  SUSPENDED: { color: "#fb923c", label: "Suspend", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.25)" },
}

export default function UsersPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [actionUser, setActionUser] = useState<User | null>(null)
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null)

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/users")
      const data = await res.json()
      setUsers(data)
    } catch { toast.error("Gagal memuat data users") }
    finally { setLoading(false) }
  }

  const updateUser = async (id: string, data: { role?: string; status?: string }) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const updated = await res.json()
      if (!res.ok) throw new Error(updated.error)
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, ...updated } : u))
      toast.success("User berhasil diperbarui")
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Gagal") }
    setActionUser(null)
  }

  const confirmDelete = async () => {
    if (!confirmDeleteUser) return
    try {
      const res = await fetch(`/api/users/${confirmDeleteUser.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUsers((prev) => prev.filter((u) => u.id !== confirmDeleteUser.id))
      toast.success("User berhasil dihapus")
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Gagal menghapus user") }
    setConfirmDeleteUser(null)
  }

  const filtered = users.filter((u) =>
    (!search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) &&
    (!filterRole || u.role === filterRole) &&
    (!filterStatus || u.status === filterStatus)
  )

  const pendingCount = users.filter((u) => u.status === "PENDING").length
  const approvedCount = users.filter((u) => u.status === "APPROVED").length

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "Total User", value: users.length, color: "#60a5fa", bg: "rgba(59,130,246,0.1)" },
          { label: "Aktif", value: approvedCount, color: "#4ade80", bg: "rgba(34,197,94,0.1)" },
          { label: "Pending", value: pendingCount, color: "#facc15", bg: "rgba(234,179,8,0.1)" },
          { label: "Admin", value: users.filter((u) => u.role === "ADMIN").length, color: "#a78bfa", bg: "rgba(139,92,246,0.1)" },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={18} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending approval alert */}
      {pendingCount > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
          background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)",
          borderRadius: "var(--radius-lg)",
        }}>
          <Clock size={18} color="#facc15" />
          <span style={{ flex: 1, fontSize: 13, color: "var(--text-secondary)" }}>
            <strong style={{ color: "#facc15" }}>{pendingCount} user</strong> menunggu persetujuan
          </span>
          <button onClick={() => setFilterStatus("PENDING")} className="btn btn-sm" style={{ background: "rgba(234,179,8,0.12)", color: "#facc15", border: "1px solid rgba(234,179,8,0.25)" }}>
            Tampilkan
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 320 }}>
          <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input className="input" placeholder="Cari user..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select className="input" style={{ width: "auto", background: "#111827" }} value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="">Semua Role</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="STAFF">Staff</option>
        </select>
        <select className="input" style={{ width: "auto", background: "#111827" }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="APPROVED">Aktif</option>
          <option value="PENDING">Pending</option>
          <option value="REJECTED">Ditolak</option>
          <option value="SUSPENDED">Suspend</option>
        </select>
        <button onClick={fetchUsers} className="btn btn-ghost btn-sm"><RefreshCw size={14} /> Refresh</button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              {["Pengguna", "Role", "Status", "Dept.", "Task/Arsip", "Bergabung", "Aksi"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}><td colSpan={7} style={{ padding: "12px 16px" }}>
                <div className="skeleton" style={{ height: 14, width: "100%" }} />
              </td></tr>
            )) : filtered.map((user) => {
              const role = roleConfig[user.role]
              const status = statusConfig[user.status]
              const isMe = user.id === session?.user?.id
              return (
                <tr key={user.id} style={{ borderBottom: "1px solid var(--border-subtle)", transition: "background 0.1s" }} className="glass-hover">
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="avatar avatar-md">{getInitials(user.name)}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                          {user.name} {isMe && <span className="badge badge-blue" style={{ fontSize: 9, verticalAlign: "middle" }}>Anda</span>}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <select
                      value={user.role}
                      onChange={(e) => !isMe && updateUser(user.id, { role: e.target.value })}
                      disabled={isMe}
                      style={{
                        background: role.bg, color: role.color, border: "none", cursor: isMe ? "default" : "pointer",
                        borderRadius: 99, padding: "3px 8px", fontSize: 11, fontWeight: 700, outline: "none",
                        opacity: isMe ? 0.6 : 1,
                      }}
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MANAGER">Manager</option>
                      <option value="STAFF">Staff</option>
                    </select>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {user.status === "PENDING" ? (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => updateUser(user.id, { status: "APPROVED" })} className="btn btn-success btn-sm" style={{ padding: "4px 10px", fontSize: 11 }}>
                          <UserCheck size={12} /> Setujui
                        </button>
                        <button onClick={() => updateUser(user.id, { status: "REJECTED" })} className="btn btn-danger btn-sm" style={{ padding: "4px 10px", fontSize: 11 }}>
                          <UserX size={12} /> Tolak
                        </button>
                      </div>
                    ) : (
                      <select
                        value={user.status}
                        onChange={(e) => !isMe && updateUser(user.id, { status: e.target.value })}
                        disabled={isMe}
                        style={{
                          background: status.bg, color: status.color,
                          border: `1px solid ${status.border}`, cursor: isMe ? "default" : "pointer",
                          borderRadius: 99, padding: "3px 8px", fontSize: 11, fontWeight: 700, outline: "none",
                        }}
                      >
                        <option value="APPROVED">Aktif</option>
                        <option value="SUSPENDED">Suspend</option>
                        <option value="REJECTED">Ditolak</option>
                      </select>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-secondary)" }}>
                    {user.department || "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontSize: 12, display: "flex", gap: 8, color: "var(--text-muted)" }}>
                      <span style={{ color: "#a78bfa" }}>{user._count.tasks} task</span>
                      <span>·</span>
                      <span style={{ color: "#fb923c" }}>{user._count.archives} arsip</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {formatDate(user.createdAt)}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {!isMe && (
                      <button onClick={() => setConfirmDeleteUser(user)} className="btn btn-ghost btn-icon btn-sm" style={{ color: "#f87171" }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
            <Users size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ fontSize: 14, margin: 0 }}>Tidak ada user ditemukan</p>
          </div>
        )}
      </div>

      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
        Total: {filtered.length} dari {users.length} user
      </p>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDeleteUser}
        title="Hapus Pengguna"
        message={`Hapus user "${confirmDeleteUser?.name}" dari sistem? Semua task dan arsip miliknya tidak akan terhapus namun dialihkan menjadi anonim.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteUser(null)}
      />
    </div>
  )
}

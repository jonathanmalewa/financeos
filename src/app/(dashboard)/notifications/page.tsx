"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle, XCircle, MessageSquare, Archive, User, Check } from "lucide-react"
import { formatRelative } from "@/lib/utils"
import toast from "react-hot-toast"
import Link from "next/link"

interface Notification {
  id: string; title: string; message: string; type: string; read: boolean; link?: string; createdAt: string
}

const typeConfig: Record<string, { icon: typeof Info; color: string; bg: string }> = {
  INFO:    { icon: Info, color: "#60a5fa", bg: "rgba(59,130,246,0.1)" },
  SUCCESS: { icon: CheckCircle, color: "#4ade80", bg: "rgba(34,197,94,0.1)" },
  WARNING: { icon: AlertTriangle, color: "#facc15", bg: "rgba(234,179,8,0.1)" },
  ERROR:   { icon: XCircle, color: "#f87171", bg: "rgba(239,68,68,0.1)" },
  TASK:    { icon: Check, color: "#a78bfa", bg: "rgba(139,92,246,0.1)" },
  ARCHIVE: { icon: Archive, color: "#fb923c", bg: "rgba(249,115,22,0.1)" },
  CHAT:    { icon: MessageSquare, color: "#60a5fa", bg: "rgba(59,130,246,0.1)" },
  USER:    { icon: User, color: "#4ade80", bg: "rgba(34,197,94,0.1)" },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread">("all")

  useEffect(() => { fetchNotifications() }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/notifications")
      const data = await res.json()
      setNotifications(data)
    } catch { toast.error("Gagal memuat notifikasi") }
    finally { setLoading(false) }
  }

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" })
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "PATCH" })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    toast.success("Semua notifikasi ditandai dibaca")
  }

  const deleteNotif = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "DELETE" })
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, display: "flex", gap: 8 }}>
          {["all", "unread"].map((f) => (
            <button key={f} onClick={() => setFilter(f as "all" | "unread")}
              style={{
                padding: "6px 14px", borderRadius: 99, border: "1px solid",
                fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                background: filter === f ? "var(--brand)" : "transparent",
                color: filter === f ? "#fff" : "var(--text-muted)",
                borderColor: filter === f ? "var(--brand)" : "var(--border-default)",
              }}>
              {f === "all" ? "Semua" : `Belum Dibaca${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn btn-ghost btn-sm">
            <CheckCheck size={14} /> Tandai semua
          </button>
        )}
      </div>

      {/* List */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ padding: "16px 20px", display: "flex", gap: 12, borderBottom: "1px solid var(--border-subtle)" }}>
              <div className="skeleton" style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 13, width: "50%", marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 11, width: "75%" }} />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
            <Bell size={40} style={{ opacity: 0.2, marginBottom: 16 }} />
            <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>Tidak ada notifikasi</p>
            <p style={{ fontSize: 13, margin: 0 }}>
              {filter === "unread" ? "Semua notifikasi sudah dibaca" : "Belum ada notifikasi"}
            </p>
          </div>
        ) : filtered.map((n, i) => {
          const config = typeConfig[n.type] || typeConfig.INFO
          const Icon = config.icon
          const Content = (
            <div
              className="glass-hover"
              style={{
                display: "flex", gap: 14, padding: "16px 20px", cursor: "pointer",
                borderBottom: i < filtered.length - 1 ? "1px solid var(--border-subtle)" : "none",
                background: n.read ? "transparent" : "rgba(59,130,246,0.03)",
                transition: "background 0.1s",
              }}
              onClick={() => !n.read && markRead(n.id)}
            >
              <div style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, background: config.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={18} color={config.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: n.read ? 500 : 700, color: "var(--text-primary)" }}>{n.title}</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>{formatRelative(n.createdAt)}</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>{n.message}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", marginTop: 4 }} />}
                <button onClick={(e) => { e.stopPropagation(); deleteNotif(n.id) }}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2, display: "flex" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
          return n.link ? <Link key={n.id} href={n.link} style={{ textDecoration: "none" }}>{Content}</Link> : <div key={n.id}>{Content}</div>
        })}
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Check, CheckCheck, X, Trash2, Info, AlertTriangle, CheckCircle, XCircle, MessageSquare, Archive, User, FileText } from "lucide-react"
import { formatRelative } from "@/lib/utils"
import Link from "next/link"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  link?: string
  createdAt: string
}

const typeIcon: Record<string, { icon: React.ComponentType<{ size?: number }>, color: string }> = {
  INFO:    { icon: Info, color: "#60a5fa" },
  SUCCESS: { icon: CheckCircle, color: "#4ade80" },
  WARNING: { icon: AlertTriangle, color: "#facc15" },
  ERROR:   { icon: XCircle, color: "#f87171" },
  TASK:    { icon: Check, color: "#a78bfa" },
  ARCHIVE: { icon: Archive, color: "#fb923c" },
  CHAT:    { icon: MessageSquare, color: "#60a5fa" },
  USER:    { icon: User, color: "#4ade80" },
}

export default function NotificationPanel({
  open, onClose, onRead,
}: {
  open: boolean
  onClose: () => void
  onRead: () => void
}) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) fetchNotifications()
  }, [open])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open, onClose])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/notifications")
      const data = await res.json()
      setNotifications(data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" })
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    onRead()
  }

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "PATCH" })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const deleteNotif = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "DELETE" })
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  if (!open) return null

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200, pointerEvents: "none",
    }}>
      <div
        ref={panelRef}
        style={{
          position: "absolute", top: 72, right: 16,
          width: 380, maxHeight: "calc(100dvh - 88px)",
          background: "#111827", border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          animation: "slideUp 0.2s ease", pointerEvents: "all",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "16px 16px 12px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <Bell size={16} color="var(--text-secondary)" />
          <span style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>Notifikasi</span>
          <button onClick={markAllRead} style={{ fontSize: 11, color: "var(--brand)", background: "transparent", border: "none", cursor: "pointer", fontWeight: 600 }}>
            Tandai semua
          </button>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* List */}
        <div className="scrollable" style={{ flex: 1 }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ padding: "12px 16px", display: "flex", gap: 10 }}>
                <div className="skeleton" style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 12, marginBottom: 6, width: "60%" }} />
                  <div className="skeleton" style={{ height: 10, width: "80%" }} />
                </div>
              </div>
            ))
          ) : notifications.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
              <Bell size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p style={{ fontSize: 13, margin: 0 }}>Tidak ada notifikasi</p>
            </div>
          ) : notifications.map((n) => {
            const config = typeIcon[n.type] || typeIcon.INFO
            const IconComp = config.icon
            const Wrapper = n.link ? Link : "div"
            return (
              <div
                key={n.id}
                style={{
                  display: "flex", gap: 10, padding: "12px 16px",
                  borderBottom: "1px solid var(--border-subtle)",
                  background: n.read ? "transparent" : "rgba(59,130,246,0.04)",
                  transition: "background var(--transition-fast)",
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: `rgba(${n.type === "SUCCESS" ? "34,197,94" : n.type === "WARNING" ? "234,179,8" : n.type === "ERROR" ? "239,68,68" : "59,130,246"},0.12)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <IconComp size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: n.read ? 400 : 600, color: "var(--text-primary)", marginBottom: 2 }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4, lineHeight: 1.4 }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {formatRelative(n.createdAt)}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                  {!n.read && (
                    <button onClick={() => markRead(n.id)} title="Tandai dibaca" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--brand)", padding: 2, display: "flex" }}>
                      <CheckCheck size={14} />
                    </button>
                  )}
                  <button onClick={() => deleteNotif(n.id)} title="Hapus" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2, display: "flex" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border-subtle)" }}>
          <Link href="/notifications" onClick={onClose} style={{ fontSize: 12, color: "var(--brand)", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
            Lihat Semua Notifikasi
          </Link>
        </div>
      </div>
    </div>
  )
}

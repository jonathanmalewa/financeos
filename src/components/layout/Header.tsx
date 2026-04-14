"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { Bell } from "lucide-react"
import { getInitials } from "@/lib/utils"
import { useSession } from "next-auth/react"
import NotificationPanel from "@/components/notifications/NotificationPanel"
import Link from "next/link"

const pageLabels: Record<string, string> = {
  "/dashboard":     "Dashboard",
  "/tasks":         "Task Management",
  "/arsip":         "Arsip Dokumen",
  "/chat":          "Chat & Pesan",
  "/ai-assistant":  "AI Assistant ARIA",
  "/notifications": "Notifikasi",
  "/users":         "Kelola Pengguna",
  "/audit-log":     "Audit Log",
  "/settings":      "Pengaturan",
}

export default function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [notifOpen, setNotifOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [time, setTime] = useState(new Date())

  const pageTitle = pageLabels[pathname] || "FinanceOS"

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const prevUnread = useRef(0)

  useEffect(() => {
    const playNotificationSound = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioContextClass) return
        const ctx = new AudioContextClass()
        const playNote = (freq: number, startTime: number, duration: number) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = "sine"
          osc.frequency.setValueAtTime(freq, startTime)
          gain.gain.setValueAtTime(0.15, startTime)
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(startTime)
          osc.stop(startTime + duration)
        }
        const now = ctx.currentTime
        playNote(523.25, now, 0.15) // C5
        playNote(659.25, now + 0.15, 0.3) // E5
      } catch (e) {}
    }

    const fetchCount = () => {
      fetch("/api/notifications/unread-count")
        .then((r) => r.json())
        .then((d) => {
          const count = d.count || 0
          if (count > prevUnread.current && prevUnread.current !== 0) {
            playNotificationSound()
          }
          prevUnread.current = count
          setUnreadCount(count)
        })
        .catch(() => {})
    }

    fetchCount()
    const interval = setInterval(fetchCount, 15000)
    return () => clearInterval(interval)
  }, [pathname])

  const greet = () => {
    const h = time.getHours()
    if (h < 11) return "Selamat Pagi"
    if (h < 15) return "Selamat Siang"
    if (h < 18) return "Selamat Sore"
    return "Selamat Malam"
  }

  return (
    <>
      <header className="header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {pageTitle}
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
            {greet()}, {session?.user?.name?.split(" ")[0] || "User"} 👋
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 16 }}>


          {/* Notifications */}
          <button
            onClick={() => setNotifOpen(true)}
            style={{
              width: 36, height: 36, borderRadius: "var(--radius)",
              background: "var(--bg-glass)", border: "1px solid var(--border-default)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", position: "relative",
              transition: "all var(--transition-fast)",
            }}
            className="glass-hover"
          >
            <Bell size={17} color="var(--text-secondary)" />
            {unreadCount > 0 && (
              <span style={{
                position: "absolute", top: 4, right: 4,
                width: 16, height: 16, borderRadius: "50%",
                background: "#ef4444", color: "#fff",
                fontSize: 9, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px solid var(--bg-primary)",
              }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Avatar */}
          <div className="avatar avatar-md" style={{ cursor: "pointer" }}>
            {session?.user?.name ? getInitials(session.user.name) : "U"}
          </div>
        </div>
      </header>

      {/* Notification Panel */}
      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} onRead={() => setUnreadCount(Math.max(0, unreadCount - 1))} />
    </>
  )
}

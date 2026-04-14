"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import {
  LayoutDashboard, CheckSquare, Archive, MessageSquare, Bot,
  Users, FileText, LogOut, TrendingUp, ChevronDown, ChevronLeft, ChevronRight,
  Settings, Menu, X, Shield, Star
} from "lucide-react"
import { cn, getInitials } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  roles?: string[]
  badge?: number
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Task Management", icon: CheckSquare },
  { href: "/arsip", label: "Arsip Dokumen", icon: Archive },
  { href: "/users", label: "Kelola Pengguna", icon: Users, roles: ["ADMIN"] },
  { href: "/audit-log", label: "Audit Log", icon: FileText, roles: ["ADMIN"] },
]

const roleConfig = {
  ADMIN:   { label: "Administrator", color: "#60a5fa", icon: Shield },
  MANAGER: { label: "Manager",       color: "#a78bfa", icon: Star },
  STAFF:   { label: "Staff",         color: "#4ade80", icon: Users },
}

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Listen to openMobileSidebar events from Header
  useEffect(() => {
    const handleOpen = () => setMobileOpen(true)
    window.addEventListener("openMobileSidebar", handleOpen)
    return () => window.removeEventListener("openMobileSidebar", handleOpen)
  }, [])

  const role = session?.user?.role as keyof typeof roleConfig
  const roleInfo = roleConfig[role] || roleConfig.STAFF

  const filteredNav = navItems.filter(
    (item) => !item.roles || (role && item.roles.includes(role))
  )

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href))

  const handleSignOut = () => signOut({ callbackUrl: "/login" })

  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <div style={{
        padding: "20px 16px 16px",
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
          }}>
            <TrendingUp size={18} color="#fff" />
          </div>
          {!collapsed && (
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 16, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                FinanceOS
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                FINANCE PLATFORM
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: 24, height: 24, borderRadius: "50%",
              background: "transparent", border: "none", cursor: "pointer",
              color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center",
              marginLeft: collapsed ? 0 : "auto"
            }}
            className="hidden lg:flex glass-hover"
            title={collapsed ? "Expand Sidebar" : "Minimize Sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }} className="scrollable">
        {!collapsed && (
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "1px", padding: "8px 6px 6px", textTransform: "uppercase" }}>
            Menu Utama
          </div>
        )}

        {filteredNav.slice(0, 3).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn("sidebar-item", isActive(item.href) && "active")}
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={18} className="flex-shrink-0" />
            {!collapsed && (
              <>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge ? (
                  <span style={{
                    fontSize: 10, fontWeight: 700, background: "#3b82f6",
                    color: "#fff", borderRadius: 99, padding: "1px 6px",
                  }}>{item.badge}</span>
                ) : null}
              </>
            )}
          </Link>
        ))}

        {/* Admin section */}
        {role === "ADMIN" && filteredNav.slice(3).length > 0 && (
          <>
            {!collapsed && (
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "1px", padding: "16px 6px 6px", textTransform: "uppercase" }}>
                Administrasi
              </div>
            )}
            {filteredNav.slice(3).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn("sidebar-item", isActive(item.href) && "active")}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={18} className="flex-shrink-0" />
                {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User profile */}
      <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "10px 10px 16px" }}>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            style={{
              width: "100%", background: "transparent", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 10, padding: "9px 8px",
              borderRadius: "var(--radius)", transition: "background var(--transition-fast)",
            }}
            className="glass-hover"
          >
            <div className="avatar avatar-md" style={{ flexShrink: 0 }}>
              {session?.user?.name ? getInitials(session.user.name) : "U"}
            </div>
            {!collapsed && (
              <>
                <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {session?.user?.name || "User"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <roleInfo.icon size={10} color={roleInfo.color} />
                    <span style={{ fontSize: 11, color: roleInfo.color, fontWeight: 600 }}>{roleInfo.label}</span>
                  </div>
                </div>
                <ChevronDown size={14} color="var(--text-muted)" style={{ transform: userMenuOpen ? "rotate(180deg)" : "none", transition: "transform var(--transition-fast)" }} />
              </>
            )}
          </button>

          {/* User dropdown */}
          {userMenuOpen && !collapsed && (
            <div style={{
              position: "absolute", bottom: "100%", left: 0, right: 0, marginBottom: 4,
              background: "#111827", border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-lg)", overflow: "hidden",
              boxShadow: "var(--shadow-lg)", zIndex: 200,
              animation: "slideUp 0.15s ease",
            }}>
              <Link href="/settings" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", color: "var(--text-secondary)", textDecoration: "none", fontSize: 13, transition: "all 0.15s" }} className="glass-hover">
                <Settings size={15} /> Pengaturan
              </Link>
              <div className="divider" style={{ margin: 0 }} />
              <button onClick={handleSignOut} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", width: "100%",
                background: "transparent", border: "none", cursor: "pointer",
                color: "#f87171", fontSize: 13, transition: "all 0.15s",
              }} className="glass-hover">
                <LogOut size={15} /> Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar" style={{ width: collapsed ? 64 : "var(--sidebar-width)" }}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)", zIndex: 55,
            }}
          />
          <aside style={{
            position: "fixed", left: 0, top: 0, bottom: 0, width: 256,
            zIndex: 60, background: "rgba(13,17,23,0.98)",
            borderRight: "1px solid var(--border-default)",
            animation: "slideInLeft 0.25s ease",
          }}>
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  )
}

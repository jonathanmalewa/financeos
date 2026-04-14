"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Eye, EyeOff, Mail, Lock, TrendingUp, Shield, Zap,
  ChevronRight, BarChart3, FileText, MessageSquare, Bot
} from "lucide-react"
import toast from "react-hot-toast"

const features = [
  { icon: BarChart3, title: "Dashboard Analytics", desc: "Visualisasi data keuangan real-time" },
  { icon: FileText, title: "Arsip Digital", desc: "Manajemen dokumen yang terorganisir" },
  { icon: MessageSquare, title: "Kolaborasi Tim", desc: "Chat dan task management terpadu" },
  { icon: Bot, title: "AI Assistant ARIA", desc: "Analisis cerdas berbasis Groq AI" },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Email dan password wajib diisi")
      return
    }
    setLoading(true)
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error.includes("PENDING")) {
          router.push("/pending")
        } else if (result.error.includes("REJECTED")) {
          toast.error("Akun Anda telah ditolak oleh admin")
        } else if (result.error.includes("SUSPENDED")) {
          toast.error("Akun Anda telah disuspend")
        } else {
          toast.error(result.error.replace(/^.*?: /, "") || "Email atau password salah")
        }
      } else {
        toast.success("Selamat datang di FinanceOS! 🎉")
        router.push("/dashboard")
        router.refresh()
      }
    } catch {
      toast.error("Terjadi kesalahan. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "var(--bg-primary)" }}>
      {/* ===== LEFT PANEL — Illustration ===== */}
      <div
        style={{
          flex: 1,
          background: "linear-gradient(135deg, #0d1117 0%, #111827 40%, #0d1117 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px",
          position: "relative",
          overflow: "hidden",
        }}
        className="hidden lg:flex"
      >
        {/* Background glow orbs */}
        <div style={{
          position: "absolute", width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
          top: -100, left: -100, pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)",
          bottom: -80, right: -80, pointerEvents: "none",
        }} />

        {/* Grid lines */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.03,
          backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 56, position: "relative" }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", boxShadow: "0 8px 32px rgba(59,130,246,0.4)",
          }}>
            <TrendingUp size={36} color="#fff" strokeWidth={2.5} />
          </div>
          <h1 style={{
            fontSize: 36, fontWeight: 800, margin: "0 0 10px",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            background: "linear-gradient(135deg, #60a5fa, #a78bfa)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>FinanceOS</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, margin: 0, lineHeight: 1.6 }}>
            Platform Manajemen Keuangan Enterprise
          </p>
        </div>

        {/* Feature cards */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 400
        }}>
          {mounted && features.map((f, i) => (
            <div
              key={i}
              className="glass"
              style={{
                display: "flex", gap: 14, alignItems: "center",
                padding: "16px 18px", borderRadius: "var(--radius-lg)",
                animation: `slideUp 0.4s ease ${i * 0.1}s both`,
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: `linear-gradient(135deg, ${["rgba(59,130,246,0.2)", "rgba(139,92,246,0.2)", "rgba(34,197,94,0.2)", "rgba(249,115,22,0.2)"][i]}, transparent)`,
                border: `1px solid ${["rgba(59,130,246,0.3)", "rgba(139,92,246,0.3)", "rgba(34,197,94,0.3)", "rgba(249,115,22,0.3)"][i]}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <f.icon size={20} color={["#60a5fa", "#a78bfa", "#4ade80", "#fb923c"][i]} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{f.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom badge */}
        <div style={{
          position: "absolute", bottom: 32,
          display: "flex", alignItems: "center", gap: 8,
          color: "var(--text-muted)", fontSize: 12,
        }}>
          <Shield size={14} />
          <span>Dilindungi enkripsi enterprise-grade • SSL secured</span>
        </div>
      </div>

      <div 
        className="w-full lg:w-[480px] lg:flex-none flex-1 px-6 py-12 sm:p-12 md:p-[48px]"
        style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: "#0d1117",
        borderLeft: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "-10px 0 30px rgba(0,0,0,0.2)",
        position: "relative",
      }}>
        {/* Mobile logo */}
        <div className="flex lg:hidden" style={{ alignItems: "center", gap: 12, marginBottom: 40 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <TrendingUp size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>FinanceOS</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Manajemen Keuangan</div>
          </div>
        </div>

        <div style={{ marginBottom: 36 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
            borderRadius: 99, padding: "4px 12px", marginBottom: 16,
          }}>
            <Zap size={12} color="#60a5fa" />
            <span style={{ fontSize: 12, color: "#60a5fa", fontWeight: 600 }}>Selamat Datang Kembali</span>
          </div>
          <h2 style={{
            fontSize: 28, fontWeight: 800, margin: "0 0 8px",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: "var(--text-primary)",
          }}>Masuk ke Akun Anda</h2>
          <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: 14 }}>
            Masukkan kredensial Anda untuk mengakses platform
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Email */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>
              Alamat Email
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={16} color="var(--text-muted)"
                style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              />
              <input
                type="email"
                className="input"
                placeholder="nama@perusahaan.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: 40 }}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={16} color="var(--text-muted)"
                style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              />
              <input
                type={showPassword ? "text" : "password"}
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: 40, paddingRight: 44 }}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "transparent", border: "none", cursor: "pointer",
                  color: "var(--text-muted)", padding: 4, borderRadius: 4,
                  display: "flex", alignItems: "center",
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: "100%", marginTop: 4, position: "relative", overflow: "hidden" }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div style={{
                  width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff", borderRadius: "50%", animation: "spin-slow 0.7s linear infinite",
                }} />
                Memverifikasi...
              </>
            ) : (
              <>Masuk <ChevronRight size={16} /></>
            )}
          </button>
        </form>

        <div className="divider" style={{ marginTop: 28, marginBottom: 24 }} />

        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
          Belum punya akun?{" "}
          <Link href="/register" style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>
            Daftar Sekarang
          </Link>
        </p>


      </div>
    </div>
  )
}

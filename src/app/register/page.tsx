"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Mail, Lock, User, Building2, Phone, TrendingUp, ChevronRight } from "lucide-react"
import toast from "react-hot-toast"

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    department: "", phone: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      toast.error("Password tidak cocok")
      return
    }
    if (form.password.length < 8) {
      toast.error("Password minimal 8 karakter")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, email: form.email, password: form.password,
          department: form.department, phone: form.phone,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Registrasi berhasil! Menunggu persetujuan admin.")
      router.push("/pending")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Registrasi gagal")
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { name: "name", label: "Nama Lengkap", type: "text", placeholder: "John Doe", icon: User },
    { name: "email", label: "Alamat Email", type: "email", placeholder: "nama@perusahaan.com", icon: Mail },
    { name: "department", label: "Departemen", type: "text", placeholder: "Keuangan, Akuntansi, dll", icon: Building2 },
    { name: "phone", label: "Nomor Telepon", type: "tel", placeholder: "+62 812 3456 7890", icon: Phone },
  ]

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-primary)", padding: 24,
      backgroundImage: "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139,92,246,0.05) 0%, transparent 50%)",
    }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(59,130,246,0.3)",
          }}>
            <TrendingUp size={28} color="#fff" />
          </div>
          <h2 style={{
            fontSize: 26, fontWeight: 800, margin: "0 0 8px",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>Buat Akun Baru</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: 0 }}>
            Akun Anda akan diverifikasi admin sebelum aktif
          </p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {fields.map((f) => (
              <div key={f.name}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                  {f.label} {["name", "email"].includes(f.name) && <span style={{ color: "var(--danger-400)" }}>*</span>}
                </label>
                <div style={{ position: "relative" }}>
                  <f.icon size={15} color="var(--text-muted)" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <input
                    type={f.type}
                    name={f.name}
                    className="input"
                    placeholder={f.placeholder}
                    value={form[f.name as keyof typeof form]}
                    onChange={handleChange}
                    style={{ paddingLeft: 38 }}
                    required={["name", "email"].includes(f.name)}
                  />
                </div>
              </div>
            ))}

            {/* Password */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                Password <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={15} color="var(--text-muted)" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="input"
                  placeholder="Min. 8 karakter"
                  value={form.password}
                  onChange={handleChange}
                  style={{ paddingLeft: 38, paddingRight: 42 }}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                Konfirmasi Password <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={15} color="var(--text-muted)" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  type="password"
                  name="confirmPassword"
                  className="input"
                  placeholder="Ulangi password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  style={{ paddingLeft: 38 }}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: 8 }} disabled={loading}>
              {loading ? "Mendaftar..." : (<>Daftar Sekarang <ChevronRight size={16} /></>)}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, marginTop: 20 }}>
          Sudah punya akun?{" "}
          <Link href="/login" style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>
            Masuk
          </Link>
        </p>
      </div>
    </div>
  )
}

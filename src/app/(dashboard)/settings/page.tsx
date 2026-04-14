"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { User, Lock, Save, ShieldCheck } from "lucide-react"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile")
  
  // Profile State
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", department: "" })
  const [loadingProfile, setLoadingProfile] = useState(false)
  
  // Password State
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" })
  const [loadingPassword, setLoadingPassword] = useState(false)

  useEffect(() => {
    if (session?.user) {
      setProfileForm({
        name: session.user.name || "",
        phone: (session.user as any).phone || "",
        department: (session.user as any).department || "",
      })
    }
  }, [session])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileForm.name.trim()) return toast.error("Nama wajib diisi")
    
    setLoadingProfile(true)
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      toast.success(data.message)
      await updateSession({ ...session, user: { ...session?.user, ...profileForm } })
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui profil")
    } finally {
      setLoadingProfile(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordForm.oldPassword || !passwordForm.newPassword) return toast.error("Semua field wajib diisi")
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error("Konfirmasi password tidak cocok")
    if (passwordForm.newPassword.length < 6) return toast.error("Password baru minimal 6 karakter")

    setLoadingPassword(true)
    try {
      const res = await fetch("/api/users/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          oldPassword: passwordForm.oldPassword, 
          newPassword: passwordForm.newPassword 
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(data.message)
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengganti password")
    } finally {
      setLoadingPassword(false)
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", paddingBottom: 40 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>Pengaturan Akun</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
          Kelola informasi profil dan keamanan akun Anda.
        </p>
      </div>

      <div style={{ display: "flex", gap: 24, flexDirection: "column" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, background: "var(--bg-glass)", padding: 6, borderRadius: "var(--radius-lg)", width: "fit-content" }}>
          <button 
            onClick={() => setActiveTab("profile")}
            style={{ 
              display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: "10px",
              background: activeTab === "profile" ? "var(--brand)" : "transparent",
              color: activeTab === "profile" ? "#fff" : "var(--text-muted)",
              border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.2s"
            }}
          >
            <User size={16} /> Profil
          </button>
          <button 
            onClick={() => setActiveTab("password")}
            style={{ 
              display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: "10px",
              background: activeTab === "password" ? "var(--brand)" : "transparent",
              color: activeTab === "password" ? "#fff" : "var(--text-muted)",
              border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.2s"
            }}
          >
            <Lock size={16} /> Keamanan
          </button>
        </div>

        {/* Profile Content */}
        {activeTab === "profile" && (
          <div className="card card-glow" style={{ padding: 32, animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={22} color="#60a5fa" />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Informasi Dasar</h2>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Perbarui identitas yang ditampilkan di sistem.</div>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>Email <span style={{color: "var(--text-muted)", fontWeight: 400}}>(Tidak bisa diubah)</span></label>
                <input className="input" value={session?.user?.email || ""} disabled style={{ opacity: 0.5, cursor: "not-allowed" }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>Nama Lengkap</label>
                <input className="input" placeholder="Masukkan nama" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} required />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>Departemen</label>
                  <input className="input" placeholder="Contoh: Keuangan" value={profileForm.department} onChange={e => setProfileForm({...profileForm, department: e.target.value})} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>No. Telepon / WhatsApp</label>
                  <input className="input" placeholder="0812..." value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                </div>
              </div>
              
              <div className="divider" style={{ margin: "8px 0" }} />
              
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" className="btn btn-primary" disabled={loadingProfile}>
                  {loadingProfile ? "Menyimpan..." : <><Save size={16} /> Simpan Perubahan</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Password Content */}
        {activeTab === "password" && (
          <div className="card card-glow" style={{ padding: 32, animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(167,139,250,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldCheck size={22} color="#a78bfa" />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Ganti Sandi</h2>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Pastikan akun Anda selalu aman dengan password yang kuat.</div>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>Password Lama</label>
                <input type="password" className="input" placeholder="••••••••" value={passwordForm.oldPassword} onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})} required />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>Password Baru</label>
                  <input type="password" className="input" placeholder="Min. 6 karakter" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} required />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>Konfirmasi Password Baru</label>
                  <input type="password" className="input" placeholder="Ulangi password baru" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} required />
                </div>
              </div>

              <div className="divider" style={{ margin: "8px 0" }} />
              
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" className="btn btn-primary" disabled={loadingPassword}>
                  {loadingPassword ? "Memperbarui..." : <><Lock size={16} /> Update Password</>}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

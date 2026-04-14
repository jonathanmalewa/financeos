import Link from "next/link"
import { Clock, Mail, ShieldCheck } from "lucide-react"

export default function PendingPage() {
  return (
    <div style={{
      minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-primary)", padding: 24,
      backgroundImage: "radial-gradient(circle at 50% 50%, rgba(234,179,8,0.05) 0%, transparent 60%)",
    }}>
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "rgba(234,179,8,0.12)",
          border: "1px solid rgba(234,179,8,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
          animation: "float 3s ease-in-out infinite",
        }}>
          <Clock size={40} color="#facc15" />
        </div>

        <h1 style={{
          fontSize: 26, fontWeight: 800, margin: "0 0 12px",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>Menunggu Persetujuan</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7, margin: "0 0 32px" }}>
          Akun Anda telah berhasil didaftarkan. Admin sedang meninjau permohonan Anda. 
          Anda akan diberitahu melalui sistem setelah disetujui.
        </p>

        <div style={{
          display: "flex", flexDirection: "column", gap: 12,
          background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-lg)", padding: 20, marginBottom: 28, textAlign: "left",
        }}>
          {[
            { icon: ShieldCheck, text: "Admin akan memverifikasi identitas Anda", color: "#60a5fa" },
            { icon: Mail, text: "Notifikasi dikirim setelah persetujuan", color: "#a78bfa" },
            { icon: Clock, text: "Proses biasanya memakan waktu 1x24 jam", color: "#4ade80" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 32, height: 32, flexShrink: 0, borderRadius: 8,
                background: "rgba(255,255,255,0.05)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <item.icon size={16} color={item.color} />
              </div>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{item.text}</span>
            </div>
          ))}
        </div>

        <Link href="/login" className="btn btn-secondary" style={{ display: "inline-flex" }}>
          Kembali ke Halaman Login
        </Link>
      </div>
    </div>
  )
}

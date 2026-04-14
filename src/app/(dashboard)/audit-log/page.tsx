"use client"

import { useState, useEffect } from "react"
import { FileText, Search, Filter, ChevronLeft, ChevronRight, RefreshCw, Download } from "lucide-react"
import { formatDateTime, getInitials } from "@/lib/utils"
import toast from "react-hot-toast"

interface AuditEntry {
  id: string; action: string; target?: string; targetId?: string; metadata?: string; ipAddress?: string; createdAt: string
  user: { id: string; name: string; email: string; role: string; avatar?: string }
}

const actionColor: Record<string, string> = {
  "Membuat": "#4ade80", "Memperbarui": "#60a5fa", "Menghapus": "#f87171",
  "Upload": "#fb923c", "Login": "#facc15", "Mensetujui": "#4ade80", "Menolak": "#f87171",
  "Mengsuspend": "#fb923c",
}

function getActionColor(action: string) {
  for (const [key, color] of Object.entries(actionColor)) {
    if (action.startsWith(key)) return color
  }
  return "#9ca3af"
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => { fetchLogs() }, [page, search])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString() })
      if (search) params.set("action", search)
      const res = await fetch(`/api/audit?${params}`)
      const data = await res.json()
      setLogs(data.logs)
      setTotalPages(data.pages)
      setTotal(data.total)
    } catch { toast.error("Gagal memuat audit log") }
    finally { setLoading(false) }
  }

  const exportCSV = () => {
    const rows = [
      ["Tanggal", "User", "Role", "Aksi", "Target", "ID Target", "IP"],
      ...logs.map((l) => [
        formatDateTime(l.createdAt), l.user.name, l.user.role,
        l.action, l.target || "", l.targetId || "", l.ipAddress || "",
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    toast.success("Audit log berhasil diekspor")
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input className="input" placeholder="Filter berdasarkan aksi..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }} style={{ paddingLeft: 36 }} />
        </div>
        <button onClick={fetchLogs} className="btn btn-ghost btn-sm"><RefreshCw size={14} /> Refresh</button>
        <button onClick={exportCSV} className="btn btn-secondary btn-sm"><Download size={14} /> Export CSV</button>
      </div>

      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
        {total} entri total
      </div>

      {/* Timeline */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 20 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                <div className="skeleton" style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 12, width: "40%", marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 10, width: "65%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
            <FileText size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ fontSize: 14, margin: 0 }}>Tidak ada log ditemukan</p>
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            {/* Timeline line */}
            <div style={{
              position: "absolute", left: 52, top: 0, bottom: 0, width: 1,
              background: "var(--border-subtle)", zIndex: 0,
            }} />

            {logs.map((log, i) => {
              const actionCol = getActionColor(log.action)
              let metadata: Record<string, unknown> = {}
              try { metadata = log.metadata ? JSON.parse(log.metadata) : {} } catch { /* ignore */ }

              return (
                <div
                  key={log.id}
                  style={{
                    display: "flex", gap: 0, padding: "14px 20px",
                    borderBottom: i < logs.length - 1 ? "1px solid var(--border-subtle)" : "none",
                    position: "relative", zIndex: 1,
                  }}
                >
                  {/* Avatar */}
                  <div style={{ width: 64, flexShrink: 0, display: "flex", justifyContent: "center" }}>
                    <div className="avatar avatar-sm" style={{ position: "relative", zIndex: 2 }}>
                      {getInitials(log.user.name)}
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{log.user.name}</span>
                        {" "}
                        <span style={{ fontSize: 13, color: actionCol, fontWeight: 600 }}>{log.action}</span>
                        {log.target && (
                          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}> {log.target}</span>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0, whiteSpace: "nowrap" }}>
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 11, color: "var(--text-muted)" }}>
                      <span className="badge badge-gray" style={{ fontSize: 10 }}>{log.user.role}</span>
                      {log.targetId && (
                        <span style={{ fontFamily: "monospace", background: "rgba(255,255,255,0.04)", padding: "1px 6px", borderRadius: 4, fontSize: 10 }}>
                          ID: {log.targetId.slice(0, 8)}...
                        </span>
                      )}
                      {Object.entries(metadata).slice(0, 2).map(([k, v]) => (
                        <span key={k} style={{ fontSize: 10 }}>
                          {k}: <strong>{String(v).slice(0, 30)}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary btn-sm btn-icon">
            <ChevronLeft size={15} />
          </button>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Halaman {page} dari {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-secondary btn-sm btn-icon">
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  )
}

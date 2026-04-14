"use client"

import { useState, useEffect, useRef } from "react"
import {
  Upload, Search, Grid, List, Download, Eye, Trash2, 
  FileText, Image, File, X, Plus, Tag, FolderOpen,
  ChevronDown
} from "lucide-react"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"
import { formatDate, formatFileSize, formatRelative, getInitials } from "@/lib/utils"
import ConfirmModal from "@/components/ui/ConfirmModal"

interface Archive {
  id: string; title: string; description?: string; filename: string
  fileUrl: string; fileType: string; fileSize: number
  tags?: string; category?: string; createdAt: string
  divisi?: string; nomorArsip?: string; uploaderId: string;
  uploader: { id: string; name: string; avatar?: string }
}

const FILE_ICONS: Record<string, { icon: typeof FileText; color: string }> = {
  "application/pdf": { icon: FileText, color: "#f87171" },
  "image/jpeg":      { icon: Image, color: "#60a5fa" },
  "image/png":       { icon: Image, color: "#60a5fa" },
  "image/webp":      { icon: Image, color: "#60a5fa" },
  default:           { icon: File, color: "#9ca3af" },
}

function getFileIcon(type: string) {
  return FILE_ICONS[type] || FILE_ICONS.default
}

function UploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: (a: Archive) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({ title: "", description: "", category: "", tags: "", divisi: "", date: "" })
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) { setFile(f); if (!form.title) setForm((p) => ({ ...p, title: f.name.split(".").slice(0, -1).join(".") })) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { toast.error("Pilih file terlebih dahulu"); return }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("title", form.title || file.name)
      if (form.description) fd.append("description", form.description)
      if (form.category) fd.append("category", form.category)
      if (form.divisi) fd.append("divisi", form.divisi)
      if (form.tags) fd.append("tags", form.tags)
      if (form.date) fd.append("date", form.date)

      const res = await fetch("/api/arsip", { method: "POST", body: fd })
      if (!res.ok) throw new Error((await res.json()).error)
      const archive = await res.json()
      onUploaded(archive)
      toast.success("Arsip berhasil diupload!")
      onClose()
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Upload gagal") }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Upload Arsip</h2>
            <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20} /></button>
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Drop zone */}
          <div
            onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? "var(--brand)" : "var(--border-default)"}`,
              borderRadius: "var(--radius-lg)", padding: 28, textAlign: "center", cursor: "pointer",
              background: dragOver ? "rgba(59,130,246,0.05)" : "var(--bg-glass)", transition: "all 0.2s",
            }}
          >
            <input ref={inputRef} type="file" style={{ display: "none" }} onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) { setFile(f); if (!form.title) setForm((p) => ({ ...p, title: f.name.split(".").slice(0, -1).join(".") })) }
            }} accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt" />
            {file ? (
              <div>
                <FileText size={32} color="var(--brand)" style={{ marginBottom: 8 }} />
                <div style={{ fontWeight: 700, fontSize: 14 }}>{file.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatFileSize(file.size)}</div>
              </div>
            ) : (
              <>
                <Upload size={28} color="var(--text-muted)" style={{ marginBottom: 8 }} />
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Drag & drop file di sini</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>atau klik untuk pilih file (PDF, Image, Word, Excel — max 50MB)</div>
              </>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Judul Dokumen</label>
              <input className="input" placeholder="Nama dokumen" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Tanggal Arsip</label>
              <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={{ colorScheme: "dark" }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Deskripsi</label>
            <textarea className="input" placeholder="Deskripsi singkat..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ minHeight: 64 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Devisi</label>
              <select className="input" value={form.divisi} onChange={(e) => setForm({ ...form, divisi: e.target.value })} style={{ background: "#111827" }}>
                <option value="">Pilih Devisi...</option>
                {["Tatalaksana", "PSDA", "Perencanaan"].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Kategori</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ background: "#111827" }}>
                <option value="">Pilih kategori...</option>
                {["LS", "TUP", "GUP", "Lain-lain"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Tags (koma)</label>
              <input className="input" placeholder="laporan, 2024" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Mengupload..." : <><Upload size={15} /> Upload</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PreviewModal({ archive, onClose }: { archive: Archive; onClose: () => void }) {
  const isPdf = archive.fileType === "application/pdf"
  const isImage = archive.fileType.startsWith("image/")

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0d1117", border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-xl)", width: "90%", maxWidth: 900, maxHeight: "90dvh",
          display: "flex", flexDirection: "column", overflow: "hidden",
          animation: "slideUp 0.2s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{archive.title}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{archive.filename} • {formatFileSize(archive.fileSize)}</div>
          </div>
          <a href={archive.fileUrl} download className="btn btn-secondary btn-sm">
            <Download size={14} /> Download
          </a>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20} /></button>
        </div>
        <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "#060a11" }}>
          {isPdf ? (
            <iframe src={archive.fileUrl} style={{ width: "100%", height: 600, border: "none", borderRadius: "var(--radius)" }} title={archive.title} />
          ) : isImage ? (
            <img src={archive.fileUrl} alt={archive.title} style={{ maxWidth: "100%", maxHeight: 600, borderRadius: "var(--radius)", objectFit: "contain" }} />
          ) : (
            <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
              <File size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>Preview tidak tersedia untuk tipe file ini</p>
              <a href={archive.fileUrl} download className="btn btn-primary btn-sm" style={{ display: "inline-flex" }}>
                <Download size={14} /> Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ArsipPage() {
  const { data: session } = useSession()
  const [archives, setArchives] = useState<Archive[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [showUpload, setShowUpload] = useState(false)
  const [previewArchive, setPreviewArchive] = useState<Archive | null>(null)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [confirmDeleteArchiveId, setConfirmDeleteArchiveId] = useState<string | null>(null)

  const role = session?.user?.role
  const canUpload = role === "ADMIN" || role === "STAFF"
  const canDownload = role === "ADMIN" || role === "MANAGER" || role === "STAFF"

  useEffect(() => { fetchArchives() }, [search, category])

  const fetchArchives = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("q", search)
      if (category) params.set("category", category)
      const res = await fetch(`/api/arsip?${params}`)
      const data = await res.json()
      setArchives(data)
    } catch { toast.error("Gagal memuat arsip") }
    finally { setLoading(false) }
  }

  const deleteArchive = async () => {
    if (!confirmDeleteArchiveId) return
    try {
      await fetch(`/api/arsip/${confirmDeleteArchiveId}`, { method: "DELETE" })
      setArchives((prev) => prev.filter((a) => a.id !== confirmDeleteArchiveId))
      toast.success("Arsip berhasil dihapus")
    } catch { toast.error("Gagal menghapus arsip") }
    setConfirmDeleteArchiveId(null)
  }

  const categories = ["", "LS", "TUP", "GUP", "Lain-lain"]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 360 }}>
          <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input className="input" placeholder="Cari arsip..." value={search}
            onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>

        <select className="input" style={{ width: "auto", background: "#111827" }} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Semua Kategori</option>
          {categories.slice(1).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <div style={{ display: "flex", background: "var(--bg-glass)", border: "1px solid var(--border-default)", borderRadius: "var(--radius)", padding: 3 }}>
          {(["grid", "list"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12,
              background: view === v ? "var(--brand)" : "transparent",
              color: view === v ? "#fff" : "var(--text-muted)", transition: "all 0.15s",
            }}>
              {v === "grid" ? <Grid size={14} /> : <List size={14} />}
            </button>
          ))}
        </div>

        {canUpload && (
          <button onClick={() => setShowUpload(true)} className="btn btn-primary">
            <Upload size={15} /> Upload Arsip
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: 3, alignItems: "center", fontSize: 13, color: "var(--text-muted)" }}>
        <FolderOpen size={15} />
        <span>{archives.length} dokumen</span>
      </div>

      {/* Grid View */}
      {view === "grid" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
          {loading ? Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 160, borderRadius: "var(--radius-lg)" }} />
          )) : archives.map((archive) => {
            const { icon: Icon, color } = getFileIcon(archive.fileType)
            const tags = archive.tags ? JSON.parse(archive.tags) as string[] : []
            return (
              <div key={archive.id} className="card card-glow" style={{ padding: 16, cursor: "pointer", display: "flex", flexDirection: "column", gap: 10 }}
                onClick={() => setPreviewArchive(archive)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={22} color={color} />
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {canDownload && (
                      <a href={archive.fileUrl} download onClick={(e) => e.stopPropagation()}
                        style={{ padding: 5, borderRadius: 6, background: "transparent", color: "var(--text-muted)", display: "flex", alignItems: "center", cursor: "pointer" }}
                        className="glass-hover" title="Download">
                        <Download size={13} />
                      </a>
                    )}
                    {(role === "ADMIN" || (role === "STAFF" && archive.uploaderId === session?.user?.id)) && (
                      <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteArchiveId(archive.id) }}
                        style={{ padding: 5, borderRadius: 6, background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex" }}
                        className="glass-hover" title="Hapus">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  {archive.nomorArsip && (
                    <div style={{ fontSize: 10, color: "var(--brand)", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 2 }}>{archive.nomorArsip}</div>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3, marginBottom: 4,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {archive.title}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
                    {formatFileSize(archive.fileSize)} • {formatDate(archive.createdAt)}
                  </div>
                  {archive.category && (
                    <span className="badge badge-blue" style={{ fontSize: 10 }}>{archive.category}</span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: "auto" }}>
                  <div className="avatar avatar-sm">{getInitials(archive.uploader.name)}</div>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{archive.uploader.name}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                {["Dokumen", "No. Arsip", "Ukuran", "Diupload oleh", "Tanggal", "Aksi"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={6} style={{ padding: "10px 16px" }}><div className="skeleton" style={{ height: 14, width: "100%" }} /></td></tr>
              )) : archives.map((archive) => {
                const { icon: Icon, color } = getFileIcon(archive.fileType)
                return (
                  <tr key={archive.id} className="glass-hover" style={{ borderBottom: "1px solid var(--border-subtle)", cursor: "pointer" }}
                    onClick={() => setPreviewArchive(archive)}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Icon size={18} color={color} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{archive.title}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{archive.filename}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {archive.nomorArsip ? <span style={{ fontSize: 11, fontWeight: 600, color: "var(--brand)" }}>{archive.nomorArsip}</span> : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                      {formatFileSize(archive.fileSize)}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div className="avatar avatar-sm">{getInitials(archive.uploader.name)}</div>
                        <span style={{ fontSize: 12 }}>{archive.uploader.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{formatDate(archive.createdAt)}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setPreviewArchive(archive)} className="btn btn-ghost btn-sm btn-icon"><Eye size={14} /></button>
                        {canDownload && <a href={archive.fileUrl} download className="btn btn-ghost btn-sm btn-icon"><Download size={14} /></a>}
                        {(role === "ADMIN" || (role === "STAFF" && archive.uploaderId === session?.user?.id)) && (
                          <button onClick={() => setConfirmDeleteArchiveId(archive.id)} className="btn btn-ghost btn-sm btn-icon"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!loading && archives.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
              <FolderOpen size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p style={{ fontSize: 14, margin: 0 }}>Tidak ada arsip ditemukan</p>
            </div>
          )}
        </div>
      )}

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploaded={(a) => setArchives((prev) => [a, ...prev])} />}
      {previewArchive && <PreviewModal archive={previewArchive} onClose={() => setPreviewArchive(null)} />}

      <ConfirmModal
        isOpen={!!confirmDeleteArchiveId}
        title="Hapus Arsip"
        message="Anda yakin ingin menghapus arsip dokumen ini secara permanen dari server?"
        onConfirm={deleteArchive}
        onCancel={() => setConfirmDeleteArchiveId(null)}
      />
    </div>
  )
}

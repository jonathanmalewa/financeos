"use client"

import { useState, useEffect, useRef } from "react"
import {
  Plus, Search, Filter, Kanban, List, Calendar,
  X, ChevronDown, User, Tag, Clock, AlertCircle,
  MessageSquare, Pencil, Trash2, CheckCircle2, Circle,
  Timer, Eye, Save, Send
} from "lucide-react"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"
import { formatDate, formatRelative, getInitials, parseJsonArray } from "@/lib/utils"
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import ConfirmModal from "@/components/ui/ConfirmModal"

interface Task {
  id: string; title: string; description?: string
  status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate?: string; tags?: string
  assignee?: { id: string; name: string; avatar?: string }
  creator: { id: string; name: string }
  createdAt: string; updatedAt: string
  _count?: { comments: number }
}

interface Comment { id: string; content: string; user: { name: string; avatar?: string; role: string }; createdAt: string }

const columns = [
  { id: "TODO", label: "To Do", color: "#6b7280" },
  { id: "IN_PROGRESS", label: "In Progress", color: "#3b82f6" },
  { id: "IN_REVIEW", label: "In Review", color: "#a78bfa" },
  { id: "DONE", label: "Done", color: "#22c55e" },
]

const priorityConfig = {
  LOW:    { color: "#4ade80", label: "Rendah", bg: "rgba(74,222,128,0.1)" },
  MEDIUM: { color: "#facc15", label: "Sedang", bg: "rgba(250,204,21,0.1)" },
  HIGH:   { color: "#fb923c", label: "Tinggi", bg: "rgba(251,146,60,0.1)" },
  URGENT: { color: "#f87171", label: "Urgent", bg: "rgba(248,113,113,0.1)" },
}

function TaskCard({ task, onClick, onDelete, canDelete }: {
  task: Task; onClick: () => void; onDelete: () => void; canDelete: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const prio = priorityConfig[task.priority]
  const tags = parseJsonArray(task.tags ?? null)

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="kanban-card"
      onClick={onClick}
      {...attributes} {...listeners}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4, flex: 1 }}>
          {task.title}
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, color: prio.color, background: prio.bg, padding: "2px 7px", borderRadius: 99, flexShrink: 0 }}>
          {prio.label}
        </span>
      </div>

      {task.description && (
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 10px", lineHeight: 1.5,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {task.description}
        </p>
      )}

      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, background: "rgba(59,130,246,0.12)", color: "#60a5fa" }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {task.assignee && (
            <div className="avatar avatar-sm" title={task.assignee.name}>
              {getInitials(task.assignee.name)}
            </div>
          )}
          {task.dueDate && (
            <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "var(--text-muted)" }}>
              <Clock size={11} /> {formatDate(task.dueDate)}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {(task._count?.comments ?? 0) > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "var(--text-muted)" }}>
              <MessageSquare size={11} /> {task._count!.comments}
            </div>
          )}
          {canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2, borderRadius: 4, display: "flex", alignItems: "center" }}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function TaskModal({ task, onClose, onUpdate, canEdit }: {
  task: Task | null; onClose: () => void
  onUpdate: (updated: Task) => void; canEdit: boolean
}) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loadingComment, setLoadingComment] = useState(false)

  useEffect(() => {
    if (!task) return
    fetch(`/api/tasks/${task.id}`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments || []))
  }, [task])

  const sendComment = async () => {
    if (!task || !newComment.trim()) return
    setLoadingComment(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      })
      const c = await res.json()
      setComments((prev) => [...prev, c])
      setNewComment("")
    } catch { toast.error("Gagal mengirim komentar") }
    finally { setLoadingComment(false) }
  }

  const updateStatus = async (status: string) => {
    if (!task) return
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    const updated = await res.json()
    onUpdate(updated)
    toast.success("Status diperbarui")
  }

  if (!task) return null
  const tags = parseJsonArray(task.tags ?? null)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.3 }}>{task.title}</h2>
            <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
              <X size={20} />
            </button>
          </div>

          {/* Status pills */}
          {canEdit && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {columns.map((col) => (
                <button
                  key={col.id}
                  onClick={() => updateStatus(col.id)}
                  style={{
                    fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99, cursor: "pointer",
                    background: task.status === col.id ? `${col.color}25` : "transparent",
                    color: task.status === col.id ? col.color : "var(--text-muted)",
                    border: `1px solid ${task.status === col.id ? col.color + "50" : "var(--border-subtle)"}`,
                    transition: "all 0.15s",
                  }}
                >
                  {col.label}
                </button>
              ))}
            </div>
          )}

          {/* Meta */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <User size={12} /> {task.assignee?.name || "Belum ditugaskan"}
            </span>
            {task.dueDate && (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={12} /> {formatDate(task.dueDate)}
              </span>
            )}
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Timer size={12} /> {formatRelative(task.createdAt)}
            </span>
          </div>

          {task.description && (
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, margin: "0 0 16px" }}>
              {task.description}
            </p>
          )}

          {tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {tags.map((tag) => (
                <span key={tag} className="badge badge-blue">#{tag}</span>
              ))}
            </div>
          )}

          <div className="divider" />

          {/* Comments */}
          <div style={{ maxHeight: 280, overflowY: "auto" }} className="scrollable">
            <h4 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 12px", color: "var(--text-secondary)" }}>
              Komentar ({comments.length})
            </h4>
            {comments.map((c) => (
              <div key={c.id} style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <div className="avatar avatar-sm" style={{ flexShrink: 0, marginTop: 2 }}>
                  {getInitials(c.user.name)}
                </div>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{c.user.name}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{formatRelative(c.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, background: "var(--bg-glass)", padding: "8px 12px", borderRadius: "var(--radius)" }}>
                    {c.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comment input */}
        <div style={{ padding: "12px 24px 20px", borderTop: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <textarea
              className="input"
              placeholder="Tambahkan komentar..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendComment() } }}
              style={{ fontSize: 13, minHeight: 40, maxHeight: 100, resize: "none" }}
            />
            <button onClick={sendComment} disabled={loadingComment || !newComment.trim()} className="btn btn-primary btn-icon" style={{ flexShrink: 0, alignSelf: "flex-end" }}>
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TaskForm({ onClose, onCreated, users }: {
  onClose: () => void
  onCreated: (task: Task) => void
  users: { id: string; name: string }[]
}) {
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM", assigneeId: "", dueDate: "", tags: "" })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error("Judul task diperlukan"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/tasks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          assigneeId: form.assigneeId || undefined,
          dueDate: form.dueDate || undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const task = await res.json()
      onCreated(task)
      toast.success("Task berhasil dibuat!")
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat task")
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px 0", marginBottom: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Buat Task Baru</h2>
            <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20} /></button>
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Judul *</label>
            <input className="input" placeholder="Judul task" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Deskripsi</label>
            <textarea className="input" placeholder="Deskripsi detail task..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ minHeight: 80 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Prioritas</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={{ background: "#111827" }}>
                <option value="LOW">Rendah</option>
                <option value="MEDIUM">Sedang</option>
                <option value="HIGH">Tinggi</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Due Date</label>
              <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={{ colorScheme: "dark" }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Assignee</label>
            <select className="input" value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })} style={{ background: "#111827" }}>
              <option value="">Pilih assignee...</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Tags (pisah koma)</label>
            <input className="input" placeholder="keuangan, laporan, urgent" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Menyimpan..." : "Buat Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"kanban" | "list">("kanban")
  const [showForm, setShowForm] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [search, setSearch] = useState("")
  const [confirmDeleteTaskId, setConfirmDeleteTaskId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const role = session?.user?.role
  const canCreate = true
  const canDelete = role === "ADMIN" || role === "MANAGER"
  const canEdit = true

  useEffect(() => {
    fetchTasks()
    fetch("/api/users/list").then((r) => r.json()).then(setUsers).catch(() => {})
  }, [])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/tasks")
      const data = await res.json()
      setTasks(data)
    } catch { toast.error("Gagal memuat task") }
    finally { setLoading(false) }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeTask = tasks.find((t) => t.id === active.id)
    if (!activeTask) return

    // Check if dropped on column header
    let newStatus = columns.find((c) => c.id === over.id)?.id
    // Or if dropped onto another task within a column
    if (!newStatus) {
      const overTask = tasks.find((t) => t.id === over.id)
      if (overTask) newStatus = overTask.status
    }

    if (!newStatus || newStatus === activeTask.status) return

    // Optimistic update
    setTasks((prev) => prev.map((t) => t.id === active.id ? { ...t, status: newStatus as Task["status"] } : t))

    try {
      await fetch(`/api/tasks/${active.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch {
      toast.error("Gagal memperbarui")
      fetchTasks()
    }
  }

  const deleteTask = async () => {
    if (!confirmDeleteTaskId) return
    try {
      await fetch(`/api/tasks/${confirmDeleteTaskId}`, { method: "DELETE" })
      setTasks((prev) => prev.filter((t) => t.id !== confirmDeleteTaskId))
      toast.success("Task dihapus")
    } catch { toast.error("Gagal menghapus task") }
    setConfirmDeleteTaskId(null)
  }

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  )

  const tasksByStatus = (status: string) => filteredTasks.filter((t) => t.status === status)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, height: "calc(100dvh - var(--header-height) - 56px)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 360 }}>
          <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input className="input" placeholder="Cari task..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>

        {/* View switcher */}
        <div style={{ display: "flex", background: "var(--bg-glass)", border: "1px solid var(--border-default)", borderRadius: "var(--radius)", padding: 3 }}>
          {([["kanban", Kanban], ["list", List]] as const).map(([v, Icon]) => (
            <button key={v} onClick={() => setView(v)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 7,
              background: view === v ? "var(--brand)" : "transparent",
              color: view === v ? "#fff" : "var(--text-muted)",
              border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.15s",
            }}>
              <Icon size={14} /> {v === "kanban" ? "Kanban" : "List"}
            </button>
          ))}
        </div>

        {canCreate && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <Plus size={16} /> Buat Task
          </button>
        )}
      </div>

      {/* Kanban View */}
      {view === "kanban" && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div style={{ display: "flex", gap: 14, overflowX: "auto", flex: 1, paddingBottom: 8 }} className="scrollable">
            {columns.map((col) => (
              <div key={col.id} id={col.id} className="kanban-column">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: col.color }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{col.label}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, background: "var(--bg-glass)",
                    color: "var(--text-muted)", padding: "1px 7px", borderRadius: 99, marginLeft: "auto",
                  }}>
                    {tasksByStatus(col.id).length}
                  </span>
                </div>

                <SortableContext items={tasksByStatus(col.id).map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 60 }}>
                    {loading ? (
                      Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 80, borderRadius: "var(--radius)" }} />
                      ))
                    ) : tasksByStatus(col.id).map((task) => (
                      <TaskCard
                        key={task.id} task={task}
                        onClick={() => setSelectedTask(task)}
                        onDelete={() => setConfirmDeleteTaskId(task.id)}
                        canDelete={canDelete}
                      />
                    ))}
                  </div>
                </SortableContext>


              </div>
            ))}
          </div>
        </DndContext>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="card" style={{ flex: 1, overflowY: "auto", padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                {["Judul", "Status", "Prioritas", "Assignee", "Due Date", ""].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={6} style={{ padding: "10px 16px" }}><div className="skeleton" style={{ height: 14, width: "100%" }} /></td></tr>
              )) : filteredTasks.map((task) => {
                const prio = priorityConfig[task.priority]
                const col = columns.find((c) => c.id === task.status)
                return (
                  <tr key={task.id} style={{ borderBottom: "1px solid var(--border-subtle)", cursor: "pointer", transition: "background 0.1s" }}
                    className="glass-hover" onClick={() => setSelectedTask(task)}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{task.title}</div>
                      {task.description && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{task.description.slice(0, 60)}...</div>}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: col?.color, background: col?.color + "20", padding: "3px 8px", borderRadius: 99 }}>
                        {col?.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: prio.color }}>{prio.label}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {task.assignee ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div className="avatar avatar-sm">{getInitials(task.assignee.name)}</div>
                          <span style={{ fontSize: 12 }}>{task.assignee.name}</span>
                        </div>
                      ) : <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {task.dueDate ? formatDate(task.dueDate) : "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {canDelete && (
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteTaskId(task.id) }}
                          style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!loading && filteredTasks.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
              <CheckCircle2 size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p style={{ fontSize: 14, margin: 0 }}>Tidak ada task ditemukan</p>
            </div>
          )}
        </div>
      )}

      {showForm && <TaskForm onClose={() => setShowForm(false)} onCreated={(t) => setTasks((prev) => [t, ...prev])} users={users} />}
      {selectedTask && <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} onUpdate={(u) => { setTasks((prev) => prev.map((t) => t.id === u.id ? u : t)); setSelectedTask(u) }} canEdit={canEdit} />}
      
      <ConfirmModal
        isOpen={!!confirmDeleteTaskId}
        title="Hapus Task"
        message="Anda yakin ingin menghapus task ini secara permanen?"
        onConfirm={deleteTask}
        onCancel={() => setConfirmDeleteTaskId(null)}
      />
    </div>
  )
}

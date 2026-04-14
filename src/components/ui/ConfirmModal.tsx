import { AlertCircle, X } from "lucide-react"

export default function ConfirmModal({
  isOpen, title, message, onConfirm, onCancel, confirmText = "Hapus", cancelText = "Batal", danger = true
}: {
  isOpen: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void;
  confirmText?: string; cancelText?: string; danger?: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 9999 }}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400, animation: "slideUp 0.2s ease" }}>
        <div style={{ padding: "20px 24px", position: "relative" }}>
          <button onClick={onCancel} style={{ position: "absolute", right: 16, top: 16, background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
          
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
              background: danger ? "rgba(248,113,113,0.15)" : "rgba(96,165,250,0.15)",
              color: danger ? "#f87171" : "#60a5fa",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `1px solid ${danger ? "rgba(248,113,113,0.3)" : "rgba(96,165,250,0.3)"}`
            }}>
              <AlertCircle size={22} />
            </div>
            <div style={{ paddingTop: 2 }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{title}</h3>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {message}
              </p>
            </div>
          </div>
        </div>
        
        <div style={{ padding: "16px 24px", background: "rgba(0,0,0,0.2)", borderTop: "1px solid var(--border-subtle)", display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button onClick={onCancel} className="btn btn-secondary">
            {cancelText}
          </button>
          <button onClick={onConfirm} className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { Bot, Send, X, Sparkles } from "lucide-react"
import { useSession } from "next-auth/react"
import ReactMarkdown from "react-markdown"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function FloatingAdenAI() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })

  useEffect(() => scrollToBottom(), [messages, loading])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      fetch("/api/ai/chat")
        .then((r) => r.json())
        .then((d) => {
          if (d.messages?.length > 0) {
            setMessages(d.messages)
            setConversationId(d.conversationId)
          } else {
            setMessages([{ role: "assistant", content: "Halo! Saya **Aden AI**, asisten cerdas FinanceOS Anda. Ada yang bisa saya bantu terkait laporan, arsip, atau tugas Anda hari ini?" }])
          }
        })
        .catch(() => {})
    }
  }, [isOpen, messages.length])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, conversationId }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }])
      if (data.conversationId) setConversationId(data.conversationId)
    } catch {
       setMessages((prev) => [...prev, { role: "assistant", content: "Maaf, Aden sedang mengalami gangguan. Coba lagi nanti." }])
    } finally {
      setLoading(false)
    }
  }

  if (!session) return null;

  return (
    <div style={{ position: "fixed", bottom: 94, right: 24, zIndex: 100, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      {isOpen && (
        <div style={{
          width: 360, height: 500, background: "rgba(13,17,23,0.95)", border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-xl)", overflow: "hidden",
          display: "flex", flexDirection: "column", animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)", marginBottom: 16,
          backdropFilter: "blur(12px)"
        }}>
          {/* Header */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "center", gap: 10, background: "linear-gradient(90deg, rgba(3,7,18,0.9), rgba(139,92,246,0.1))" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(139,92,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(139,92,246,0.4)" }}>
              <Bot size={18} color="#a78bfa" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
                Aden AI <Sparkles size={12} color="#a78bfa" />
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Selalu siap membantu Anda</div>
            </div>
            <button onClick={() => setIsOpen(false)} className="btn btn-ghost btn-icon btn-sm" style={{ padding: 4 }}>
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="scrollable" style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", background: "rgba(3,7,18,0.5)" }}>
            {messages.map((msg, idx) => {
              const isMine = msg.role === "user"
              return (
                <div key={idx} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", gap: 8 }}>
                  {!isMine && (
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(139,92,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Bot size={14} color="#a78bfa" />
                    </div>
                  )}
                  <div style={{
                    maxWidth: "85%", fontSize: 13.5, padding: isMine ? "10px 14px" : "12px 14px", lineHeight: 1.5,
                    background: isMine ? "linear-gradient(135deg, #3b82f6, #6366f1)" : "rgba(31,41,55,0.7)",
                    color: isMine ? "#fff" : "var(--text-primary)", borderRadius: isMine ? "14px 14px 2px 14px" : "2px 14px 14px 14px",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                  }} className={!isMine ? "markdown-body" : ""}>
                    {isMine ? msg.content : <ReactMarkdown>{msg.content}</ReactMarkdown>}
                  </div>
                </div>
              )
            })}
            
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(139,92,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Bot size={14} color="#a78bfa" />
                </div>
                <div style={{ background: "rgba(31,41,55,0.7)", padding: "12px 16px", borderRadius: "2px 14px 14px 14px", display: "flex", alignItems: "center", gap: 4 }}>
                  <span className="dot-typing" style={{ width: 6, height: 6, background: "#a78bfa", borderRadius: "50%", animation: "typing 1.4s infinite ease-in-out both" }} />
                  <span className="dot-typing" style={{ width: 6, height: 6, background: "#a78bfa", borderRadius: "50%", animation: "typing 1.4s infinite ease-in-out both", animationDelay: "0.2s" }} />
                  <span className="dot-typing" style={{ width: 6, height: 6, background: "#a78bfa", borderRadius: "50%", animation: "typing 1.4s infinite ease-in-out both", animationDelay: "0.4s" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} style={{ padding: "12px 14px", borderTop: "1px solid var(--border-subtle)", display: "flex", gap: 8, alignItems: "flex-end", background: "rgba(13,17,23,0.8)" }}>
            <textarea
              className="input" placeholder="Tanya Aden AI sesuatu..."
              value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) sendMessage(e as unknown as React.FormEvent) }}
              style={{ flex: 1, resize: "none", minHeight: 40, maxHeight: 120, fontSize: 13.5, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px" }} rows={1}
            />
            <button type="submit" className="btn btn-icon" style={{ flexShrink: 0, padding: 10, background: "linear-gradient(135deg, #8b5cf6, #c084fc)", color: "#fff", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(139,92,246,0.4)" }} disabled={!input.trim() || loading}>
              <Send size={16} style={{ marginLeft: 2 }} />
            </button>
          </form>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 50, height: 50, borderRadius: "50%",
          background: "linear-gradient(135deg, #8b5cf6, #c084fc)", border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", boxShadow: "0 4px 16px rgba(139,92,246,0.4)",
          position: "relative", transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
        }}
        className="glass-hover"
        title="Tanya Aden AI"
      >
        {isOpen ? <X size={22} color="#fff" /> : <Bot size={22} color="#fff" />}
      </button>
      <style>{`
        @keyframes typing { 0%, 80%, 100% { transform: scale(0); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  )
}

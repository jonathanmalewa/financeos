"use client"

import { useState, useEffect, useRef } from "react"
import {
  Send, Search, Plus, Users, MessageSquare, X, Check, CheckCheck,
  Smile, Paperclip, ChevronLeft
} from "lucide-react"
import { useSession } from "next-auth/react"
import { formatRelative, getInitials } from "@/lib/utils"
import toast from "react-hot-toast"

interface User { id: string; name: string; email: string; role: string; department?: string; avatar?: string }
interface Room {
  id: string; name?: string; isGroup: boolean; avatar?: string; createdAt: string
  members: { user: User }[]
  messages: Message[]
}
interface Message { id: string; content: string; senderId: string; sender: User; read: boolean; createdAt: string; fileUrl?: string; fileType?: string }

const roleColor: Record<string, string> = { ADMIN: "#60a5fa", MANAGER: "#a78bfa", STAFF: "#4ade80" }

export default function FloatingChat() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [rooms, setRooms] = useState<Room[]>([])
  const [contacts, setContacts] = useState<User[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [showContacts, setShowContacts] = useState(false)
  const [searchRoom, setSearchRoom] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const globalPollRef = useRef<NodeJS.Timeout | null>(null)
  const [totalUnread, setTotalUnread] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Simple emoji list for demo
  const emojis = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "✨", "😊", "🎉"]

  const playWaSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return
      const ctx = new AudioContextClass()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.05, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.1)
    } catch (e) {}
  }

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })

  useEffect(() => {
    if (!session) return;
    fetchRooms()
    fetchContacts()
    
    // Poll for global unread
    globalPollRef.current = setInterval(() => {
      if (!selectedRoom && !isOpen) fetchRooms()
    }, 15000)

    return () => clearInterval(globalPollRef.current!)
  }, [session, isOpen, selectedRoom])

  useEffect(() => { scrollToBottom() }, [messages])

  useEffect(() => {
    if (!selectedRoom) return
    fetchMessages(selectedRoom.id)

    // Poll for new messages every 3s
    pollRef.current = setInterval(() => fetchMessages(selectedRoom.id), 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [selectedRoom?.id])

  // Recalculate unread messages badge across all rooms
  useEffect(() => {
    let unread = 0;
    rooms.forEach(r => {
      if (r.messages[0] && r.messages[0].senderId !== session?.user?.id && !r.messages[0].read) unread++
    })
    setTotalUnread(unread)
  }, [rooms, session])


  const fetchRooms = async () => {
    const res = await fetch("/api/chat/rooms")
    const data = await res.json()
    if(Array.isArray(data)) setRooms(data)
  }

  const fetchContacts = async () => {
    const res = await fetch("/api/users/list")
    const data = await res.json()
    if(Array.isArray(data)) setContacts(data)
  }

  const fetchMessages = async (roomId: string) => {
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`)
      const data = await res.json()
      if(Array.isArray(data)) {
        setMessages(prev => {
          if (prev.length > 0 && data.length > prev.length) {
            const newMsg = data[data.length - 1]
            if (newMsg.senderId !== session?.user?.id) playWaSound()
          }
          return data
        })
      }
    } catch { /* silent */ }
  }

  const startDM = async (user: User) => {
    setLoading(true)
    try {
      const res = await fetch("/api/chat/rooms", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: user.id, isGroup: false }),
      })
      const room = await res.json()
      setSelectedRoom(room)
      setShowContacts(false)
      await fetchRooms()
    } catch { toast.error("Gagal membuka chat") }
    finally { setLoading(false) }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!message.trim() && !selectedFile) || !selectedRoom) return

    const tempId = Date.now().toString()
    const optimistic: Message = {
      id: tempId, content: message.trim(), senderId: session?.user?.id || "",
      sender: { id: session?.user?.id || "", name: session?.user?.name || "", email: session?.user?.email || "", role: session?.user?.role || "" },
      read: false, createdAt: new Date().toISOString(),
      fileUrl: selectedFile ? URL.createObjectURL(selectedFile) : undefined,
    }
    setMessages((prev) => [...prev, optimistic])
    setMessage("")
    const fileToUpload = selectedFile
    setSelectedFile(null)
    setShowEmojiPicker(false)
    scrollToBottom()

    try {
      let body: any
      let opts: RequestInit = { method: "POST" }

      if (fileToUpload) {
        const formData = new FormData()
        formData.append("content", optimistic.content)
        formData.append("file", fileToUpload)
        body = formData
        opts.body = body
      } else {
        opts.headers = { "Content-Type": "application/json" }
        opts.body = JSON.stringify({ content: optimistic.content })
      }

      const res = await fetch(`/api/chat/rooms/${selectedRoom.id}/messages`, opts)
      const real = await res.json()
      setMessages((prev) => prev.map((m) => m.id === tempId ? real : m))
      fetchRooms()
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      toast.error("Gagal mengirim pesan")
    }
  }

  const getRoomName = (room: Room) => {
    if (room.isGroup) return room.name || "Grup"
    const other = room.members.find((m) => m.user.id !== session?.user?.id)
    return other?.user.name || "Unknown"
  }

  const getLastMessage = (room: Room) => {
    const last = room.messages[0]
    if (!last) return "Belum ada pesan"
    const fromMe = last.senderId === session?.user?.id
    return `${fromMe ? "Anda: " : ""}${last.content}`
  }

  const filteredRooms = rooms.filter((r) => getRoomName(r).toLowerCase().includes(searchRoom.toLowerCase()))

  if (!session) return null;

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 100, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      {isOpen && (
        <div style={{
          width: 360, height: 500, background: "rgba(13,17,23,0.95)", border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-xl)", overflow: "hidden",
          display: "flex", flexDirection: "column", animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)", marginBottom: 16,
          backdropFilter: "blur(12px)"
        }}>
          {!selectedRoom ? (
            <>
              {/* Room List View */}
              <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid var(--border-subtle)", background: "rgba(3,7,18,0.5)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <h2 style={{ flex: 1, margin: 0, fontSize: 16, fontWeight: 700 }}>Chat</h2>
                  <button onClick={() => setShowContacts(!showContacts)} className="btn btn-primary btn-icon btn-sm" title="Pesan Baru">
                    <Plus size={16} />
                  </button>
                  <button onClick={() => setIsOpen(false)} className="btn btn-ghost btn-icon btn-sm">
                    <X size={16} />
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <input className="input" placeholder="Cari percakapan..." value={searchRoom} onChange={(e) => setSearchRoom(e.target.value)} style={{ paddingLeft: 32, fontSize: 13, background: "var(--bg-glass)" }} />
                </div>
              </div>

              {/* Contacts picker */}
              {showContacts && (
                <div style={{ borderBottom: "1px solid var(--border-subtle)", padding: "8px 0", maxHeight: 160, overflowY: "auto", background: "rgba(255,255,255,0.02)" }}>
                  <div style={{ padding: "4px 14px 8px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Kontak</div>
                  {contacts.map((user) => (
                    <button key={user.id} onClick={() => startDM(user)}
                      style={{ width: "100%", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, padding: "8px 14px" }}
                      className="glass-hover">
                      <div className="avatar avatar-sm">{getInitials(user.name)}</div>
                      <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{user.name}</div>
                        <div style={{ fontSize: 11, color: roleColor[user.role] }}>{user.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Room list */}
              <div style={{ flex: 1, overflowY: "auto" }} className="scrollable">
                {filteredRooms.length === 0 ? (
                  <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
                    <MessageSquare size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <p style={{ fontSize: 13, margin: 0 }}>Belum ada percakapan</p>
                  </div>
                ) : filteredRooms.map((room) => {
                  return (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoom(room)}
                      style={{
                        width: "100%", background: "transparent",
                        border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                        padding: "12px 14px", borderBottom: "1px solid var(--border-subtle)", textAlign: "left",
                      }}
                      className="glass-hover"
                    >
                      <div className="avatar avatar-md" style={{ flexShrink: 0 }}>
                        {room.isGroup ? <Users size={16} /> : getInitials(getRoomName(room))}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{getRoomName(room)}</span>
                          <span style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0 }}>{room.messages[0] ? formatRelative(room.messages[0].createdAt) : ""}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {room.isGroup ? `${room.members.length} anggota` : getLastMessage(room)}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              {/* Active Chat View (WA-Style) */}
              <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10, background: "#202c33" }}>
                <button onClick={() => setSelectedRoom(null)} className="btn btn-ghost btn-icon btn-sm" style={{ padding: 4 }}>
                  <ChevronLeft size={18} />
                </button>
                <div className="avatar avatar-sm">
                  {selectedRoom.isGroup ? <Users size={14} /> : getInitials(getRoomName(selectedRoom))}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{getRoomName(selectedRoom)}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {selectedRoom.isGroup ? `${selectedRoom.members.length} anggota` : "Active now"}
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="btn btn-ghost btn-icon btn-sm" style={{ padding: 4 }}>
                  <X size={18} />
                </button>
              </div>

              {/* Messages Area (WA Background) */}
              <div className="scrollable" style={{ flex: 1, padding: "14px", display: "flex", flexDirection: "column", gap: 6, overflowY: "auto", background: "#0b141a" }}>
                {messages.map((msg) => {
                  const isMine = msg.senderId === session?.user?.id
                  return (
                    <div key={msg.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" }}>
                      <div style={{ maxWidth: "85%", display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", gap: 2 }}>
                        {!isMine && selectedRoom.isGroup && (
                          <span style={{ fontSize: 10, color: roleColor[msg.sender.role] || "#53bdeb", fontWeight: 600, marginLeft: 12 }}>{msg.sender.name}</span>
                        )}
                        <div style={{
                          fontSize: 13, padding: "6px 8px 6px 10px", lineHeight: 1.4,
                          background: isMine ? "#005c4b" : "#202c33",
                          color: "#e9edef", borderRadius: isMine ? "10px 0 10px 10px" : "0 10px 10px 10px",
                          boxShadow: "0 1px 0.5px rgba(0,0,0,0.13)",
                          position: "relative", minWidth: 80
                        }}>
                          {msg.fileUrl && (
                            <div style={{ marginBottom: 4 }}>
                              {msg.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) || msg.fileUrl.startsWith('blob:') ? (
                                <img src={msg.fileUrl} alt="attachment" style={{ maxWidth: "100%", borderRadius: 6, cursor: "pointer" }} onClick={() => window.open(msg.fileUrl, "_blank")} />
                              ) : (
                                <a href={msg.fileUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, color: "#53bdeb", textDecoration: "none", background: "rgba(255,255,255,0.05)", padding: "10px", borderRadius: 6 }}>
                                  <Paperclip size={16} /> File Terlampir
                                </a>
                              )}
                            </div>
                          )}
                          <div style={{ paddingRight: msg.content ? 40 : 0, display: "inline-block", wordBreak: "break-word" }}>
                            {msg.content}
                          </div>
                          
                          <span style={{ position: "absolute", bottom: 4, right: 6, display: "flex", alignItems: "center", gap: 3, fontSize: 9, color: "rgba(255,255,255,0.6)" }}>
                            {formatRelative(msg.createdAt).split(' ')[1] || formatRelative(msg.createdAt)}
                            {isMine && (msg.read ? <CheckCheck size={12} color="#53bdeb" /> : <CheckCheck size={12} color="rgba(255,255,255,0.5)" />)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Emoji Picker Popup */}
              {showEmojiPicker && (
                <div style={{ position: "absolute", bottom: 60, left: 14, background: "#202c33", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--radius-lg)", padding: 8, display: "flex", gap: 4, boxShadow: "var(--shadow-lg)", flexWrap: "wrap", width: 200, zIndex: 10 }}>
                  {emojis.map(e => <button key={e} type="button" onClick={() => { setMessage(message + e); setShowEmojiPicker(false) }} style={{ border: "none", background: "transparent", fontSize: 20, cursor: "pointer", padding: 4 }} className="glass-hover">{e}</button>)}
                </div>
              )}

              {/* Selected File Preview */}
              {selectedFile && (
                <div style={{ background: "#202c33", padding: "8px 14px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "#e9edef", display: "flex", alignItems: "center", gap: 6 }}><Paperclip size={14}/> {selectedFile.name}</span>
                  <button onClick={() => setSelectedFile(null)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#f87171" }}><X size={14}/></button>
                </div>
              )}

              {/* WA-Style Input */}
              <form onSubmit={sendMessage} style={{ padding: "8px 12px", display: "flex", gap: 8, alignItems: "flex-end", background: "#202c33" }}>
                <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="btn btn-ghost btn-icon" style={{ flexShrink: 0, padding: 8, color: "#8696a0" }}>
                  <Smile size={20} />
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-ghost btn-icon" style={{ flexShrink: 0, padding: 8, color: "#8696a0" }}>
                  <Paperclip size={20} />
                </button>
                <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={(e) => { if(e.target.files) setSelectedFile(e.target.files[0]) }} />
                
                <textarea
                  className="input" placeholder="Ketik pesan"
                  value={message} onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) sendMessage(e as unknown as React.FormEvent) }}
                  style={{ flex: 1, resize: "none", minHeight: 36, maxHeight: 100, fontSize: 14, background: "#2a3942", border: "none", borderRadius: 8, padding: "9px 12px", color: "#d1d7db" }} rows={1}
                />
                
                <button type="submit" className="btn btn-icon" style={{ flexShrink: 0, padding: 8, background: "#00a884", color: "#fff", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }} disabled={!message.trim() && !selectedFile}>
                  <Send size={16} style={{ marginLeft: 2 }} />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", boxShadow: "0 4px 16px rgba(59,130,246,0.4)",
          position: "relative", zIndex: 100, transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
        }}
        className="glass-hover"
      >
        {isOpen ? <X size={24} color="#fff" /> : <MessageSquare size={24} color="#fff" />}
        {!isOpen && totalUnread > 0 && (
          <span style={{
            position: "absolute", top: 0, right: 0, width: 20, height: 20,
            background: "#ef4444", borderRadius: "50%", border: "2px solid var(--bg-primary)",
            color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>
    </div>
  )
}

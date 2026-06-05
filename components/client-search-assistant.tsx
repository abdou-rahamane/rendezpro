"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

interface Message {
  role: "user" | "assistant"
  content: string
  professionals?: ProCard[]
}

interface ProCard {
  prenom: string
  nom: string
  username: string
  specialite?: string
  ville?: string
}

interface Props {
  onApplyCategory?: (category: string) => void
}

const SUGGESTIONS = [
  { emoji: "🦴", label: "Kiné / Ostéo", prompt: "Je cherche un kinésithérapeute ou ostéopathe" },
  { emoji: "💪", label: "Coach sportif", prompt: "Je veux un coach sportif pour me remettre en forme" },
  { emoji: "📚", label: "Cours particuliers", prompt: "J'ai besoin de cours particuliers de maths" },
  { emoji: "🧘", label: "Bien-être", prompt: "Je cherche un professionnel du bien-être ou massage" },
]

export default function ClientSearchAssistant({ onApplyCategory }: Props) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [showBadge, setShowBadge] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setShowBadge(true), 3000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setShowBadge(false)
      setTimeout(() => inputRef.current?.focus(), 150)
      if (messages.length === 0) {
        setMessages([{
          role: "assistant",
          content: "Bonjour ! 👋 Je suis RendezIA, votre guide personnel.\n\nDites-moi ce que vous cherchez en quelques mots et je trouve le bon professionnel pour vous ! ✨",
        }])
      }
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return
    setMessages(prev => [...prev, { role: "user", content }])
    setInput("")
    setIsLoading(true)

    const history = messages.map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch("/api/ai/client-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Erreur serveur")

      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.response || "Désolé, je n'ai pas pu répondre.",
        professionals: data.professionals?.length > 0 ? data.professionals : undefined,
      }])
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "⚠️ " + (err.message || "Une erreur est survenue. Vérifiez qu'Ollama est lancé."),
      }])
    } finally {
      setIsLoading(false)
    }
  }, [messages, isLoading])

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999 }}>
      {/* Chat window */}
      {isOpen && (
        <div style={{
          position: "absolute",
          bottom: "72px",
          right: "0",
          width: "370px",
          maxHeight: "520px",
          background: "#fff",
          borderRadius: "20px",
          boxShadow: "0 12px 40px rgba(5,150,105,0.18), 0 4px 12px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid #a7f3d0",
        }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "18px", flexShrink: 0,
              }}>🔍</div>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: "14px", lineHeight: 1.2 }}>
                  RendezIA
                </div>
                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#86efac", display: "inline-block" }} />
                  Propulsé par Ollama · llama3.2
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.8)", fontSize: "20px", lineHeight: 1, padding: "2px 8px",
            }}>×</button>
          </div>

          {/* Quick suggestions — visible only on first open */}
          {messages.length <= 1 && (
            <div style={{ padding: "10px 12px 6px", display: "flex", gap: "6px", flexWrap: "wrap", borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s.label}
                  onClick={() => sendMessage(s.prompt)}
                  disabled={isLoading}
                  style={{
                    padding: "5px 10px", borderRadius: "20px",
                    border: "1px solid #a7f3d0", background: "#ecfdf5",
                    color: "#059669", fontSize: "11px", fontWeight: 500,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
                  }}
                >
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {messages.map((msg, i) => (
              <div key={i}>
                <div style={{
                  display: "flex",
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  alignItems: "flex-end", gap: "8px",
                }}>
                  {msg.role === "assistant" && (
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "50%",
                      background: "linear-gradient(135deg, #059669, #0d9488)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, fontSize: "13px",
                    }}>🔍</div>
                  )}
                  <div style={{
                    maxWidth: "78%", padding: "9px 13px",
                    borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: msg.role === "user"
                      ? "linear-gradient(135deg, #059669, #0d9488)"
                      : "#f0fdf4",
                    color: msg.role === "user" ? "#fff" : "#1f2937",
                    fontSize: "13px", lineHeight: 1.5,
                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                    border: msg.role === "assistant" ? "1px solid #d1fae5" : "none",
                  }}>
                    {msg.content}
                  </div>
                </div>

                {/* Inline professional cards */}
                {msg.professionals && msg.professionals.length > 0 && (
                  <div style={{ marginTop: "8px", marginLeft: "36px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {msg.professionals.slice(0, 3).map((pro, j) => (
                      <div key={j} style={{
                        background: "#fff", border: "1px solid #a7f3d0",
                        borderRadius: "12px", padding: "10px 12px",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        cursor: "pointer", transition: "box-shadow 0.15s",
                      }}
                        onClick={() => router.push(`/professionnel/${pro.username}`)}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(5,150,105,0.15)")}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "13px", color: "#1f2937" }}>
                            {pro.prenom} {pro.nom}
                          </div>
                          <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                            {pro.specialite || "Professionnel"} {pro.ville ? `· ${pro.ville}` : ""}
                          </div>
                        </div>
                        <div style={{
                          background: "#059669", color: "#fff",
                          borderRadius: "8px", padding: "4px 10px",
                          fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap",
                        }}>
                          Voir les RDV →
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: "linear-gradient(135deg, #059669, #0d9488)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, fontSize: "13px",
                }}>🔍</div>
                <div style={{
                  padding: "10px 14px", borderRadius: "16px 16px 16px 4px",
                  background: "#f0fdf4", display: "flex", gap: "4px", alignItems: "center",
                  border: "1px solid #d1fae5",
                }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{
                      width: "6px", height: "6px", borderRadius: "50%",
                      background: "#059669", display: "inline-block",
                      animation: `rendezIA-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "10px 12px", borderTop: "1px solid #d1fae5",
            display: "flex", gap: "8px", alignItems: "center", flexShrink: 0,
          }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
              placeholder="Ex : kiné à Paris, coach sportif…"
              disabled={isLoading}
              style={{
                flex: 1, border: "1px solid #a7f3d0", borderRadius: "20px",
                padding: "8px 14px", fontSize: "13px", outline: "none",
                color: "#1f2937", background: "#f0fdf4",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "#059669")}
              onBlur={e => (e.currentTarget.style.borderColor = "#a7f3d0")}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={isLoading || !input.trim()}
              style={{
                width: "36px", height: "36px", borderRadius: "50%", border: "none",
                background: isLoading || !input.trim() ? "#e5e7eb" : "linear-gradient(135deg, #059669, #0d9488)",
                cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "16px", flexShrink: 0,
              }}
            >
              {isLoading ? "⏳" : "➤"}
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setIsOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "12px 20px", borderRadius: "28px",
          background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
          border: "none", color: "#fff", fontWeight: 600, fontSize: "14px",
          cursor: "pointer", boxShadow: "0 4px 16px rgba(5,150,105,0.4)",
          transition: "transform 0.15s, box-shadow 0.15s", position: "relative",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "scale(1.04)"
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(5,150,105,0.5)"
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "scale(1)"
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(5,150,105,0.4)"
        }}
      >
        🔍 RendezIA
        {showBadge && !isOpen && (
          <span style={{
            position: "absolute", top: "-6px", right: "-6px",
            background: "#ef4444", color: "#fff",
            borderRadius: "50%", width: "18px", height: "18px",
            fontSize: "10px", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "rendezIA-pulse 1.5s ease-in-out infinite",
          }}>1</span>
        )}
      </button>

      <style>{`
        @keyframes rendezIA-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        @keyframes rendezIA-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}

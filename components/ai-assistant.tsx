"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"

interface Message {
  role: "user" | "assistant"
  content: string
}

const SUGGESTIONS = [
  { label: "Créneaux libres", prompt: "Quels sont mes créneaux disponibles cette semaine ?" },
  { label: "Résumé semaine", prompt: "Fais-moi un résumé de ma semaine en cours" },
  { label: "Conflits", prompt: "Y a-t-il des conflits dans mon planning ?" },
]

export default function AIAssistant() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const firstName = session?.user?.name?.split(" ")[0] || "Professionnel"

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `Bonjour ${firstName} ! Je suis votre assistant RendezPro. Je peux vous aider à gérer votre planning. Que voulez-vous savoir ?`,
        },
      ])
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return
    setMessages((prev) => [...prev, { role: "user", content }])
    setInput("")
    setIsLoading(true)
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      })
      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response || "Désolé, une erreur est survenue." },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Désolé, une erreur est survenue. Réessayez." },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 50 }}>
      {/* Chat window */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "68px",
            right: "0",
            width: "360px",
            height: "500px",
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(99,102,241,0.18), 0 2px 8px rgba(0,0,0,0.10)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid #e0e7ff",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SparklesIcon size={16} color="#fff" />
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: "14px", lineHeight: 1.2 }}>
                  Assistant RendezPro
                </div>
                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                  Propulsé par Ollama
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.8)", fontSize: "18px", lineHeight: 1, padding: "2px 6px" }}
            >
              ×
            </button>
          </div>

          {/* Suggestions */}
          <div style={{ padding: "10px 12px 6px", display: "flex", gap: "6px", flexWrap: "wrap", borderBottom: "1px solid #f0f0f0" }}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => sendMessage(s.prompt)}
                disabled={isLoading}
                style={{
                  padding: "4px 10px",
                  borderRadius: "20px",
                  border: "1px solid #e0e7ff",
                  background: "#f5f3ff",
                  color: "#6366f1",
                  fontSize: "11px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#ede9fe")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#f5f3ff")}
              >
                {s.label === "Créneaux libres" && "📅 "}
                {s.label === "Résumé semaine" && "📊 "}
                {s.label === "Conflits" && "⚠️ "}
                {s.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  alignItems: "flex-end",
                  gap: "8px",
                }}
              >
                {msg.role === "assistant" && (
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <SparklesIcon size={13} color="#fff" />
                  </div>
                )}
                <div
                  style={{
                    maxWidth: "75%",
                    padding: "9px 13px",
                    borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: msg.role === "user" ? "linear-gradient(135deg, #6366f1, #7c3aed)" : "#f3f4f6",
                    color: msg.role === "user" ? "#fff" : "#1f2937",
                    fontSize: "13px",
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <SparklesIcon size={13} color="#fff" />
                </div>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "16px 16px 16px 4px",
                    background: "#f3f4f6",
                    display: "flex",
                    gap: "4px",
                    alignItems: "center",
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#9ca3af",
                        display: "inline-block",
                        animation: `typing-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: "1px solid #f0f0f0",
              display: "flex",
              gap: "8px",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
              placeholder="Posez une question sur votre planning…"
              disabled={isLoading}
              style={{
                flex: 1,
                border: "1px solid #e5e7eb",
                borderRadius: "20px",
                padding: "8px 14px",
                fontSize: "13px",
                outline: "none",
                color: "#1f2937",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={isLoading || !input.trim()}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: isLoading || !input.trim() ? "#e5e7eb" : "linear-gradient(135deg, #6366f1, #7c3aed)",
                border: "none",
                cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.15s",
              }}
            >
              <SendIcon size={15} color={isLoading || !input.trim() ? "#9ca3af" : "#fff"} />
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 20px",
          borderRadius: "28px",
          background: "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
          border: "none",
          color: "#fff",
          fontWeight: 600,
          fontSize: "14px",
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(99,102,241,0.4)",
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.04)"
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(99,102,241,0.5)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)"
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.4)"
        }}
      >
        <SparklesIcon size={18} color="#fff" />
        Assistant IA
      </button>

      <style>{`
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  )
}

function SparklesIcon({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  )
}

function SendIcon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  )
}

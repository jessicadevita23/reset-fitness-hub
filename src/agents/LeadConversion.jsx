import { useState, useRef, useEffect } from "react";
import { askClaude } from '../api.js'

const BRAND = "#39D0D8";

// ── Knowledge base ──────────────────────────────────────────────
const KB = {
  gym: "Reset Fitness Ibiza / Método Reset — gimnasio premium en Sant Josep de Sa Talaia, Ibiza. C/ Madrid 34, 07829.",
  programs: "Entrenamiento de fuerza, HIIT, funcional, personal coaching, cardio blast, movilidad y core.",
  pricing: "Estructura de precios premium, se detalla en visita o sesión de prueba. Membresías mensuales, trimestrales y anuales.",
  contact: "Email: administracion@resetfitnessibiza.com | Tel: +34 661 47 12 32",
  tour: "Puedes reservar una visita guiada al gimnasio de lunes a sábado. Confirmamos horario por WhatsApp o email.",
  trial: "Ofrecemos sesión de prueba gratuita para que experimentes el método Reset antes de comprometerte.",
  trainers: "Equipo de entrenadores certificados con especialización en entrenamiento funcional y personal coaching.",
  brand_voice: "Tono premium, cálido, directo y motivador. Nunca agresivo ni de venta dura. El objetivo es ayudar al prospecto a encontrar su mejor versión.",
};

const SYSTEM_PROMPT = `Eres el Agente de Conversión de Leads de Reset Fitness Ibiza. Tu misión es convertir consultas en membresías o sesiones de prueba.

Base de conocimiento:
${JSON.stringify(KB, null, 2)}

FLUJO DE CALIFICACIÓN:
1. Saluda cálidamente y pregunta cómo puedes ayudar si no queda claro.
2. Identifica el interés principal: membresía, clase específica, personal training, visita, precio.
3. Califica: ¿cuándo quieren empezar? ¿qué objetivo tienen (perder peso, ganar músculo, bienestar)?
4. Propón siempre una acción concreta: visita guiada, sesión de prueba gratuita, o enviar info.
5. Cierra con datos de contacto y disponibilidad.

REGLAS:
- Respuestas cortas y conversacionales (máx 3-4 frases).
- Siempre termina con una pregunta o propuesta de acción.
- Tono: premium, humano, motivador. Nunca presiones.
- Si preguntan precio exacto, di que lo explicas en persona en la visita (es premium, no se negocia por chat).
- Cuando el prospecto acepta una visita o prueba, confirma con: "¡Perfecto! Anota: C/ Madrid 34, Sant Josep. Te confirmamos hora por WhatsApp al +34 661 47 12 32."

NUNCA inventes precios concretos. NUNCA hagas promesas médicas o de resultados garantizados.`;

// ── Lead qualification scoring ───────────────────────────────────
function scoreLeadFromHistory(messages) {
  const text = messages.map(m => m.content).join(" ").toLowerCase();
  let score = 0;
  const signals = {
    "visita": 20, "tour": 20, "ver el gimnasio": 20,
    "prueba": 25, "sesión": 20, "probar": 20,
    "precio": 10, "cuánto cuesta": 10, "tarifa": 10,
    "empezar": 15, "apuntarme": 25, "membresía": 15, "socio": 15,
    "cuándo": 10, "disponible": 10,
    "objetivo": 10, "perder": 10, "ganar": 10, "entrenar": 15,
  };
  for (const [kw, pts] of Object.entries(signals)) {
    if (text.includes(kw)) score += pts;
  }
  return Math.min(score, 100);
}

function getLeadStage(score) {
  if (score >= 70) return { label: "Listo para cerrar", color: "#22c55e", icon: "◉" };
  if (score >= 40) return { label: "Interés activo", color: BRAND, icon: "◎" };
  if (score >= 15) return { label: "Explorando", color: "#eab308", icon: "◌" };
  return { label: "Frío", color: "#6b7280", icon: "○" };
}

// ── Source badge ─────────────────────────────────────────────────
const SOURCES = [
  { id: "web", label: "Web", icon: "🌐" },
  { id: "whatsapp", label: "WhatsApp", icon: "💬" },
  { id: "instagram", label: "Instagram", icon: "📸" },
];

// ── Message bubble ───────────────────────────────────────────────
function Bubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 12,
      animation: "popIn 0.25s cubic-bezier(.34,1.56,.64,1)",
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: `linear-gradient(135deg, ${BRAND}, #2ab8bf)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, color: "#0f172a", fontWeight: 900,
          marginRight: 10, flexShrink: 0, alignSelf: "flex-end",
          fontFamily: "'Playfair Display', serif",
        }}>R</div>
      )}
      <div style={{
        maxWidth: "72%",
        background: isUser
          ? "linear-gradient(135deg, #1e293b, #0f172a)"
          : `linear-gradient(135deg, rgba(57,208,216,0.12), rgba(57,208,216,0.06))`,
        border: isUser ? "1px solid rgba(255,255,255,0.08)" : `1px solid rgba(57,208,216,0.25)`,
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        padding: "12px 16px",
        color: isUser ? "#cbd5e1" : "#e5e7eb",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 14,
        lineHeight: 1.6,
        whiteSpace: "pre-wrap",
      }}>
        {msg.content}
        <div style={{ fontSize: 10, color: "#4b5563", marginTop: 4, textAlign: "right" }}>
          {msg.time}
        </div>
      </div>
    </div>
  );
}

// ── Quick reply chips ────────────────────────────────────────────
const QUICK_REPLIES = [
  "¿Qué clases ofrecéis?",
  "Quiero ver el gimnasio",
  "¿Cuánto cuesta la membresía?",
  "¿Tenéis personal trainer?",
  "Quiero una sesión de prueba",
];

// ── Main component ───────────────────────────────────────────────
export default function LeadConversion() {
  const [source, setSource] = useState("web");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "¡Hola! 👋 Bienvenido a Reset Fitness Ibiza. Soy tu asistente personal. ¿En qué puedo ayudarte hoy?",
      time: now(),
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [leadScore, setLeadScore] = useState(0);
  const [showPanel, setShowPanel] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  function now() {
    return new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text) {
    const userText = text || input.trim();
    if (!userText) return;
    setInput("");

    const userMsg = { role: "user", content: userText, time: now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: apiMessages,
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Un momento, estoy comprobando esa información.";
      const updated = [...newMessages, { role: "assistant", content: reply, time: now() }];
      setMessages(updated);
      setLeadScore(scoreLeadFromHistory(updated));
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Disculpa, ha habido un problema de conexión. Llámanos al +34 661 47 12 32.", time: now() }]);
    }
    setLoading(false);
  }

  const stage = getLeadStage(leadScore);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes popIn { from { opacity:0; transform:scale(0.92) translateY(6px);} to {opacity:1; transform:scale(1) translateY(0);} }
        @keyframes fadeIn { from {opacity:0; transform:translateY(8px);} to {opacity:1; transform:translateY(0);} }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
        @keyframes shimmer { 0%{background-position:-200% 0;} 100%{background-position:200% 0;} }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: rgba(57,208,216,0.2); border-radius: 2px; }
        textarea:focus { outline: none; }
        input:focus { outline: none; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#060a10",
        display: "flex",
        fontFamily: "'DM Sans', sans-serif",
      }}>

        {/* ── Side Panel ── */}
        {showPanel && (
          <div style={{
            width: 280,
            background: "rgba(255,255,255,0.02)",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            flexDirection: "column",
            animation: "fadeIn 0.4s ease",
            flexShrink: 0,
          }}>
            {/* Logo */}
            <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: `linear-gradient(135deg, ${BRAND}, #2ab8bf)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 900, color: "#0a0f1a",
                  fontFamily: "'Playfair Display', serif",
                }}>R</div>
                <div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>Reset Fitness</div>
                  <div style={{ color: "#4b5563", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em" }}>Ibiza</div>
                </div>
              </div>
              <div style={{
                marginTop: 12,
                background: "rgba(57,208,216,0.06)",
                border: "1px solid rgba(57,208,216,0.15)",
                borderRadius: 8, padding: "8px 12px",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: 14 }}>🤖</span>
                <div>
                  <div style={{ color: BRAND, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Agente 1</div>
                  <div style={{ color: "#6b7280", fontSize: 11 }}>Lead Conversion</div>
                </div>
              </div>
            </div>

            {/* Source selector */}
            <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ color: "#4b5563", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                Canal de entrada
              </div>
              {SOURCES.map(s => (
                <button key={s.id} onClick={() => setSource(s.id)} style={{
                  width: "100%", padding: "9px 12px", marginBottom: 6,
                  background: source === s.id ? `rgba(57,208,216,0.1)` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${source === s.id ? "rgba(57,208,216,0.4)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 8, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                  color: source === s.id ? BRAND : "#6b7280",
                  fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                  transition: "all 0.15s",
                }}>
                  <span>{s.icon}</span> {s.label}
                </button>
              ))}
            </div>

            {/* Lead score */}
            <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ color: "#4b5563", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                Lead Score
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ color: stage.color, fontSize: 16 }}>{stage.icon}</span>
                <span style={{ color: stage.color, fontWeight: 700, fontSize: 13 }}>{stage.label}</span>
              </div>
              {/* Progress bar */}
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 99, height: 6, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 99,
                  width: `${leadScore}%`,
                  background: `linear-gradient(90deg, ${stage.color}, ${stage.color}aa)`,
                  transition: "width 0.6s ease",
                }} />
              </div>
              <div style={{ color: "#4b5563", fontSize: 11, marginTop: 6, textAlign: "right" }}>{leadScore}/100</div>

              {/* Score breakdown */}
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 5 }}>
                {[
                  { label: "Interés detectado", val: Math.min(leadScore > 10 ? 1 : 0, 1) },
                  { label: "Objetivo identificado", val: Math.min(leadScore > 30 ? 1 : 0, 1) },
                  { label: "Acción propuesta", val: Math.min(leadScore > 50 ? 1 : 0, 1) },
                  { label: "Listo para cerrar", val: Math.min(leadScore > 70 ? 1 : 0, 1) },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                      background: item.val ? stage.color : "rgba(255,255,255,0.1)",
                      boxShadow: item.val ? `0 0 6px ${stage.color}` : "none",
                    }} />
                    <span style={{ color: item.val ? "#9ca3af" : "#374151", fontSize: 11 }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{ padding: "18px 20px" }}>
              <div style={{ color: "#4b5563", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                Sesión actual
              </div>
              {[
                { label: "Mensajes", val: messages.length },
                { label: "Canal", val: SOURCES.find(s => s.id === source)?.label },
                { label: "Estado", val: leadScore > 0 ? "Activo" : "Iniciando" },
              ].map(stat => (
                <div key={stat.label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "7px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}>
                  <span style={{ color: "#4b5563", fontSize: 12 }}>{stat.label}</span>
                  <span style={{ color: "#9ca3af", fontSize: 12, fontWeight: 600 }}>{stat.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Chat Area ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Header */}
          <div style={{
            padding: "16px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "rgba(0,0,0,0.2)",
            backdropFilter: "blur(12px)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => setShowPanel(p => !p)} style={{
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 7, width: 32, height: 32, cursor: "pointer",
                color: "#6b7280", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
              }}>☰</button>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 8px #22c55e",
                  animation: "pulse 2s infinite",
                }} />
                <span style={{ color: "#9ca3af", fontSize: 13, fontWeight: 600 }}>
                  {SOURCES.find(s => s.id === source)?.icon} Conversación activa — {SOURCES.find(s => s.id === source)?.label}
                </span>
              </div>
            </div>

            <div style={{
              padding: "5px 14px",
              background: `${stage.color}15`,
              border: `1px solid ${stage.color}40`,
              borderRadius: 99,
              color: stage.color,
              fontSize: 12, fontWeight: 700,
            }}>
              {stage.icon} {stage.label}
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto",
            padding: "24px 28px",
            display: "flex", flexDirection: "column",
          }}>
            {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${BRAND}, #2ab8bf)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, color: "#0a0f1a", fontWeight: 900,
                  fontFamily: "'Playfair Display', serif",
                }}>R</div>
                <div style={{
                  background: "rgba(57,208,216,0.08)",
                  border: "1px solid rgba(57,208,216,0.2)",
                  borderRadius: "18px 18px 18px 4px",
                  padding: "12px 18px",
                  display: "flex", gap: 5, alignItems: "center",
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: BRAND,
                      animation: `pulse 1.2s ease ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {messages.length <= 2 && (
            <div style={{ padding: "0 28px 12px", display: "flex", gap: 8, flexWrap: "wrap" }}>
              {QUICK_REPLIES.map(q => (
                <button key={q} onClick={() => sendMessage(q)} style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: 99, padding: "7px 14px",
                  color: "#9ca3af", fontSize: 12, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.15s",
                }}
                  onMouseEnter={e => { e.target.style.borderColor = BRAND; e.target.style.color = BRAND; }}
                  onMouseLeave={e => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; e.target.style.color = "#9ca3af"; }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(0,0,0,0.3)",
          }}>
            <div style={{
              display: "flex", gap: 12, alignItems: "flex-end",
              background: "rgba(255,255,255,0.04)",
              border: `1px solid rgba(57,208,216,0.2)`,
              borderRadius: 16,
              padding: "10px 14px",
            }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Escribe tu consulta..."
                rows={1}
                style={{
                  flex: 1, background: "transparent", border: "none",
                  color: "#e5e7eb", fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14, resize: "none", lineHeight: 1.5,
                  maxHeight: 120, overflowY: "auto",
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: loading || !input.trim() ? "rgba(57,208,216,0.15)" : BRAND,
                  border: "none", cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: loading || !input.trim() ? BRAND : "#0a0f1a",
                  fontSize: 16, flexShrink: 0,
                  transition: "all 0.2s",
                }}
              >
                ↑
              </button>
            </div>
            <div style={{ marginTop: 8, textAlign: "center", color: "#374151", fontSize: 11 }}>
              Reset Fitness Ibiza · Agente 1 — Lead Conversion · Powered by Claude
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import { useState, useRef, useEffect } from "react";
import { askClaude } from '../api.js'

const BRAND = "#39D0D8";

const SYSTEM_PROMPT = `Eres el Agente de Soporte de Socios de Reset Fitness Ibiza. Atiendes a socios existentes 24/7 con respuestas precisas, cálidas y rápidas.

INFORMACIÓN DEL GIMNASIO:
- Nombre: Reset Fitness Ibiza / Método Reset
- Dirección: C/ Madrid, 34, Sant Josep de Sa Talaia, 07829, Ibiza
- Email: administracion@resetfitnessibiza.com
- Teléfono: +34 661 47 12 32
- Horario: Por confirmar con equipo (indica que pueden consultar la app o llamar para horario actualizado)

PROGRAMAS DISPONIBLES:
Entrenamiento de fuerza, HIIT, entrenamiento funcional, personal coaching, cardio blast, movilidad y core.

MEMBRESÍAS:
- Tipos: mensual, trimestral, anual
- Renovación: automática por domiciliación SEPA
- Cancelación: avisar con antelación según contrato (mínimo 30 días recomendado)
- Congelación: consultar con administración

PERSONAL TRAINING:
- Disponible con entrenadores certificados
- Reserva por WhatsApp o en recepción
- Sesiones individuales y en pequeños grupos

NORMAS DEL GIMNASio:
- Traer toalla obligatorio
- Respetar el material y dejarlo en su sitio
- Certificado médico o declaración de aptitud para actividades de alto impacto
- Calzado deportivo adecuado en todo momento
- Reserva previa recomendada para clases con aforo limitado

PAGOS Y FACTURAS:
- Cobro mensual por domiciliación
- Facturas disponibles solicitándolas a administracion@resetfitnessibiza.com
- Problemas de pago: contactar administración antes del vencimiento

REGLAS DE RESPUESTA:
- Respuestas concisas, máximo 3-4 frases.
- Tono: cálido, profesional, resolutivo.
- Si no tienes la información exacta (ej. horario actualizado), indica cómo contactar.
- Nunca inventes datos concretos que no tengas.
- Siempre ofrece una solución o siguiente paso claro.
- Si hay urgencia o problema grave, derive a administracion@resetfitnessibiza.com o +34 661 47 12 32.`;

const CATEGORIES = [
  { id: "hours", icon: "🕐", label: "Horarios", q: "¿Cuáles son los horarios del gimnasio?" },
  { id: "classes", icon: "🏋️", label: "Clases", q: "¿Qué clases hay disponibles esta semana?" },
  { id: "pt", icon: "👤", label: "Personal Training", q: "¿Cómo reservo una sesión de personal training?" },
  { id: "membership", icon: "📋", label: "Mi membresía", q: "¿Cómo puedo cancelar o congelar mi membresía?" },
  { id: "payment", icon: "💳", label: "Pagos", q: "Necesito una factura de mi membresía" },
  { id: "rules", icon: "📌", label: "Normas", q: "¿Cuáles son las normas del gimnasio?" },
  { id: "pt_book", icon: "📅", label: "Reservas", q: "Quiero reservar una clase de HIIT" },
  { id: "contract", icon: "📄", label: "Contrato", q: "¿Cuánto tiempo de preaviso necesito para darme de baja?" },
];

const SUGGESTED = [
  "¿A qué hora abre el gimnasio?",
  "Quiero cambiar mi plan de membresía",
  "¿Hay duchas disponibles?",
  "¿Puedo traer a un amigo un día?",
  "No me han cobrado bien este mes",
];

function now() {
  return new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function Bubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 14,
      animation: "popIn 0.22s cubic-bezier(.34,1.56,.64,1)",
    }}>
      {!isUser && (
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: `linear-gradient(135deg, ${BRAND}, #1fa8af)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, color: "#051015", fontWeight: 900,
          marginRight: 10, flexShrink: 0, alignSelf: "flex-end",
          fontFamily: "serif", letterSpacing: "-1px",
          boxShadow: `0 0 14px ${BRAND}44`,
        }}>R</div>
      )}
      <div style={{
        maxWidth: "75%",
        background: isUser
          ? "#111827"
          : "rgba(57,208,216,0.08)",
        border: isUser
          ? "1px solid rgba(255,255,255,0.07)"
          : "1px solid rgba(57,208,216,0.22)",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        padding: "12px 16px",
        color: "#e2e8f0",
        fontSize: 14,
        lineHeight: 1.65,
        fontFamily: "'DM Sans', sans-serif",
        whiteSpace: "pre-wrap",
      }}>
        {msg.content}
        <div style={{ fontSize: 10, color: "#374151", marginTop: 5, textAlign: "right" }}>{msg.time}</div>
      </div>
    </div>
  );
}

function StatusBar({ online, msgCount }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 16,
      padding: "10px 22px",
      background: "rgba(0,0,0,0.25)",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
      fontSize: 12, fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "#22c55e",
          boxShadow: "0 0 8px #22c55e",
          animation: "pulse 2s infinite",
        }} />
        <span style={{ color: "#6b7280" }}>Soporte 24/7 activo</span>
      </div>
      <div style={{ color: "#374151" }}>·</div>
      <span style={{ color: "#4b5563" }}>{msgCount} mensaje{msgCount !== 1 ? "s" : ""} en esta sesión</span>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 10, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em" }}>Agente 2</span>
        <div style={{
          background: "rgba(57,208,216,0.1)",
          border: "1px solid rgba(57,208,216,0.2)",
          borderRadius: 99, padding: "2px 10px",
          color: BRAND, fontSize: 10, fontWeight: 700,
        }}>Member Support</div>
      </div>
    </div>
  );
}

export default function MemberSupport() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "¡Hola! 👋 Soy el asistente de socios de Reset Fitness Ibiza. Estoy aquí para ayudarte con cualquier duda sobre tu membresía, clases, horarios o pagos.\n\n¿En qué puedo ayudarte hoy?",
      time: now(),
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text) {
    const txt = text || input.trim();
    if (!txt) return;
    setInput("");
    const userMsg = { role: "user", content: txt, time: now() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const reply = await askClaude({
        system: SYSTEM_PROMPT,
        messages: updated.map(m => ({ role: m.role, content: m.content })),
        maxTokens: 1000,
      });
      setMessages(prev => [...prev, { role: "assistant", content: reply || "Déjame comprobar eso contigo. Llámanos al +34 661 47 12 32.", time: now() }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Ha habido un problema técnico. Contáctanos en administracion@resetfitnessibiza.com o al +34 661 47 12 32.",
        time: now(),
      }]);
    }
    setLoading(false);
  }

  const userMessages = messages.filter(m => m.role === "user").length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes popIn { from{opacity:0;transform:scale(0.9) translateY(8px);}to{opacity:1;transform:scale(1) translateY(0);} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);} }
        @keyframes pulse { 0%,100%{opacity:1;}50%{opacity:0.25;} }
        ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:rgba(57,208,216,0.15);border-radius:2px;}
        textarea{resize:none;} textarea:focus,input:focus{outline:none;}
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#07090f",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'DM Sans', sans-serif",
      }}>

        {/* Top bar */}
        <div style={{
          padding: "16px 28px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(16px)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 50,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: `linear-gradient(135deg, ${BRAND}, #1fa8af)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 900, color: "#051015",
              fontFamily: "serif",
              boxShadow: `0 4px 20px ${BRAND}40`,
            }}>R</div>
            <div>
              <div style={{ color: "#f1f5f9", fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
                Reset Fitness Ibiza
              </div>
              <div style={{ color: "#4b5563", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Soporte de Socios
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4 }}>
            {["chat", "categorias", "info"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "7px 16px", borderRadius: 8,
                background: activeTab === tab ? "rgba(57,208,216,0.15)" : "transparent",
                border: `1px solid ${activeTab === tab ? "rgba(57,208,216,0.3)" : "transparent"}`,
                color: activeTab === tab ? BRAND : "#6b7280",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                textTransform: "capitalize",
                transition: "all 0.15s",
              }}>{tab === "chat" ? "💬 Chat" : tab === "categorias" ? "📂 Temas" : "ℹ️ Info"}</button>
            ))}
          </div>
        </div>

        <StatusBar online msgCount={userMessages} />

        {/* Content */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {activeTab === "chat" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px 12px" }}>
                {messages.map((m, i) => <Bubble key={i} msg={m} />)}

                {loading && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%",
                      background: `linear-gradient(135deg, ${BRAND}, #1fa8af)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 15, color: "#051015", fontWeight: 900, fontFamily: "serif",
                    }}>R</div>
                    <div style={{
                      background: "rgba(57,208,216,0.07)",
                      border: "1px solid rgba(57,208,216,0.18)",
                      borderRadius: "18px 18px 18px 4px",
                      padding: "12px 18px",
                      display: "flex", gap: 5, alignItems: "center",
                    }}>
                      {[0,1,2].map(i => (
                        <div key={i} style={{
                          width: 6, height: 6, borderRadius: "50%", background: BRAND,
                          animation: `pulse 1.1s ease ${i*0.18}s infinite`,
                        }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Suggestions when fresh */}
              {messages.length <= 1 && (
                <div style={{ padding: "0 28px 12px" }}>
                  <div style={{ color: "#374151", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
                    Preguntas frecuentes
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {SUGGESTED.map(q => (
                      <button key={q} onClick={() => sendMessage(q)} style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 99, padding: "7px 14px",
                        color: "#6b7280", fontSize: 12, cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                        transition: "all 0.15s",
                      }}
                        onMouseEnter={e => { e.currentTarget.style.color = BRAND; e.currentTarget.style.borderColor = BRAND + "60"; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "#6b7280"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                      >{q}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div style={{
                padding: "14px 24px 18px",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(0,0,0,0.2)",
              }}>
                <div style={{
                  display: "flex", alignItems: "flex-end", gap: 10,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid rgba(57,208,216,0.18)`,
                  borderRadius: 16, padding: "10px 14px",
                  transition: "border-color 0.2s",
                }}>
                  <textarea
                    value={input}
                    rows={1}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Escribe tu consulta como socio..."
                    style={{
                      flex: 1, background: "transparent", border: "none",
                      color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14, lineHeight: 1.5, maxHeight: 100, overflowY: "auto",
                    }}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={loading || !input.trim()}
                    style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: !input.trim() || loading ? "rgba(57,208,216,0.12)" : BRAND,
                      border: "none", cursor: !input.trim() || loading ? "not-allowed" : "pointer",
                      color: !input.trim() || loading ? BRAND : "#051015",
                      fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s",
                      fontWeight: 700,
                    }}
                  >↑</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "categorias" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 28, animation: "fadeUp 0.3s ease" }}>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ color: "#f1f5f9", fontFamily: "'Cormorant Garamond', serif", fontSize: 22, marginBottom: 6 }}>
                  ¿En qué necesitas ayuda?
                </h2>
                <p style={{ color: "#4b5563", fontSize: 13 }}>Selecciona un tema para iniciar la conversación directamente.</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => { sendMessage(cat.q); setActiveTab("chat"); }} style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 14, padding: "18px 20px",
                    cursor: "pointer", textAlign: "left",
                    transition: "all 0.18s",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(57,208,216,0.07)"; e.currentTarget.style.borderColor = "rgba(57,208,216,0.3)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 10 }}>{cat.icon}</div>
                    <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{cat.label}</div>
                    <div style={{ color: "#4b5563", fontSize: 12, lineHeight: 1.4 }}>{cat.q}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "info" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 28, animation: "fadeUp 0.3s ease" }}>
              <h2 style={{ color: "#f1f5f9", fontFamily: "'Cormorant Garamond', serif", fontSize: 22, marginBottom: 20 }}>
                Información del Gimnasio
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 560 }}>
                {[
                  { icon: "📍", title: "Dirección", val: "C/ Madrid, 34 · Sant Josep de Sa Talaia · 07829 · Ibiza" },
                  { icon: "📧", title: "Email", val: "administracion@resetfitnessibiza.com" },
                  { icon: "📞", title: "Teléfono", val: "+34 661 47 12 32" },
                  { icon: "🕐", title: "Horario", val: "Consultar horario actualizado por WhatsApp o email" },
                  { icon: "🏋️", title: "Programas", val: "Fuerza · HIIT · Funcional · Personal Coaching · Cardio Blast · Movilidad · Core" },
                  { icon: "💳", title: "Membresías", val: "Mensual · Trimestral · Anual — Renovación automática SEPA" },
                  { icon: "👤", title: "Personal Training", val: "Disponible. Reserva por WhatsApp o en recepción" },
                  { icon: "📌", title: "Normas clave", val: "Toalla obligatoria · Calzado deportivo · Reserva previa en clases con aforo" },
                ].map(item => (
                  <div key={item.title} style={{
                    display: "grid", gridTemplateColumns: "36px 140px 1fr",
                    alignItems: "start", gap: 12,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12, padding: "14px 18px",
                  }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <span style={{ color: BRAND, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", paddingTop: 2 }}>{item.title}</span>
                    <span style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.5 }}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

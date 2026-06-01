import { useState, useRef, useEffect } from "react";
import { askClaude } from '../api.js'

const BRAND = "#39D0D8";

// ── Mock payment data ────────────────────────────────────────────
const INITIAL_PAYMENTS = [
  { id: "PAY001", memberId: "RF001", name: "Ana Martínez",    email: "ana@email.com",    phone: "+34 612 345 678", plan: "Anual",       amount: 480,  due: "2026-06-01", status: "pagado",   attempts: 1, lastAttempt: "2026-06-01" },
  { id: "PAY002", memberId: "RF002", name: "Carlos Ruiz",     email: "carlos@email.com", phone: "+34 623 456 789", plan: "Mensual",     amount: 65,   due: "2026-06-01", status: "pendiente",attempts: 0, lastAttempt: null },
  { id: "PAY003", memberId: "RF003", name: "Sofia Klein",     email: "sofia@email.com",  phone: "+34 634 567 890", plan: "Trimestral",  amount: 165,  due: "2026-05-28", status: "fallido",  attempts: 2, lastAttempt: "2026-05-30" },
  { id: "PAY004", memberId: "RF004", name: "Marco Rossi",     email: "marco@email.com",  phone: "+34 645 678 901", plan: "Mensual",     amount: 65,   due: "2026-05-01", status: "vencido",  attempts: 3, lastAttempt: "2026-05-20" },
  { id: "PAY005", memberId: "RF005", name: "Laura Pérez",     email: "laura@email.com",  phone: "+34 656 789 012", plan: "Anual",       amount: 480,  due: "2026-06-10", status: "pendiente",attempts: 0, lastAttempt: null },
  { id: "PAY006", memberId: "RF006", name: "James Wilson",    email: "james@email.com",  phone: "+34 667 890 123", plan: "Mensual",     amount: 65,   due: "2026-05-15", status: "vencido",  attempts: 2, lastAttempt: "2026-05-25" },
  { id: "PAY007", memberId: "RF007", name: "Marta Gómez",     email: "marta@email.com",  phone: "+34 678 901 234", plan: "Trimestral",  amount: 165,  due: "2026-06-05", status: "pendiente",attempts: 0, lastAttempt: null },
  { id: "PAY008", memberId: "RF008", name: "Pierre Dubois",   email: "pierre@email.com", phone: "+34 689 012 345", plan: "Mensual",     amount: 65,   due: "2026-05-20", status: "fallido",  attempts: 1, lastAttempt: "2026-05-22" },
];

const STATUS_CFG = {
  pagado:    { color: "#22c55e", bg: "rgba(34,197,94,0.1)",   label: "Pagado",    icon: "✓" },
  pendiente: { color: BRAND,     bg: "rgba(57,208,216,0.1)",  label: "Pendiente", icon: "◐" },
  fallido:   { color: "#f97316", bg: "rgba(249,115,22,0.1)",  label: "Fallido",   icon: "✕" },
  vencido:   { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   label: "Vencido",   icon: "!" },
};

const MSG_TEMPLATES = {
  recordatorio: (name, amount, due) =>
`Hola ${name} 👋

Te recordamos que tu cuota de Reset Fitness Ibiza de ${amount}€ vence el ${due}.

El cargo se realizará automáticamente por domiciliación SEPA. Si tienes algún problema, contáctanos antes del vencimiento.

¡Nos vemos en el gym! 💪
Reset Fitness Ibiza
📞 +34 661 47 12 32`,

  fallido: (name, amount) =>
`Hola ${name},

Te informamos que no hemos podido procesar el cobro de ${amount}€ correspondiente a tu membresía en Reset Fitness Ibiza.

Por favor, verifica los datos de tu cuenta bancaria o contacta con nosotros para regularizar el pago y mantener tu membresía activa.

📧 administracion@resetfitnessibiza.com
📞 +34 661 47 12 32

Reset Fitness Ibiza`,

  vencido: (name, amount, days) =>
`Hola ${name},

Tu pago de ${amount}€ lleva ${days} días pendiente. Tu acceso al gimnasio podría verse afectado si no regularizas la situación.

Puedes contactarnos para acordar el pago:
📧 administracion@resetfitnessibiza.com
📞 +34 661 47 12 32

Reset Fitness Ibiza`,
};

const SYSTEM_PROMPT = `Eres el Agente de Cobros y Pagos de Reset Fitness Ibiza. Tu misión es reducir impagos, gestionar recordatorios y mantener el cash flow saludable.

GIMNASIO: Reset Fitness Ibiza | administracion@resetfitnessibiza.com | +34 661 47 12 32

PLANES Y PRECIOS:
- Mensual: 65 EUR/mes
- Trimestral: 165 EUR/3 meses
- Anual: 480 EUR/año

PROCESO DE COBROS:
1. Cobro automático por SEPA el día de vencimiento
2. Si falla: recordatorio inmediato + reintento a los 3 días
3. Si vuelve a fallar: contacto directo por WhatsApp/email
4. Tras 30 días impagado: suspensión de acceso + gestión de deuda

REGLAS DE COMUNICACIÓN:
- Tono firme pero amable, nunca agresivo
- Siempre dar opciones de resolución
- Documentar todos los intentos de cobro
- Escalar a María Lagos si supera 60 días

INSTRUCCIONES:
- Analiza pagos pendientes y prioriza por urgencia
- Redacta mensajes de recordatorio personalizados
- Sugiere acciones concretas para cada caso
- Calcula totales de deuda pendiente
- Sé directo y resolutivo`;

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function daysSince(d) {
  if (!d) return 0;
  return Math.floor((new Date() - new Date(d)) / (1000 * 60 * 60 * 24));
}

function now() {
  return new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

// ── Payment row ──────────────────────────────────────────────────
function PaymentRow({ p, selected, onSelect }) {
  const st = STATUS_CFG[p.status];
  const overdue = daysSince(p.due);
  return (
    <div onClick={() => onSelect(p)} style={{
      display: "grid",
      gridTemplateColumns: "1fr 80px 90px 70px 60px",
      alignItems: "center", gap: 12,
      padding: "12px 16px",
      background: selected ? "rgba(57,208,216,0.06)" : "rgba(255,255,255,0.02)",
      border: `1px solid ${selected ? "rgba(57,208,216,0.25)" : "rgba(255,255,255,0.05)"}`,
      borderRadius: 10, cursor: "pointer", marginBottom: 5,
      transition: "all 0.15s",
      borderLeft: `3px solid ${st.color}`,
    }}>
      <div>
        <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{p.name}</div>
        <div style={{ color: "#4b5563", fontSize: 11 }}>{p.plan} · {p.email}</div>
      </div>
      <div style={{ color: "#f1f5f9", fontSize: 14, fontWeight: 700 }}>{p.amount}€</div>
      <div style={{
        padding: "4px 10px", borderRadius: 99,
        background: st.bg, color: st.color,
        fontSize: 11, fontWeight: 700, textAlign: "center",
      }}>{st.icon} {st.label}</div>
      <div style={{ color: "#4b5563", fontSize: 11 }}>{fmtDate(p.due)}</div>
      <div style={{ color: p.attempts > 0 ? "#f97316" : "#4b5563", fontSize: 12, fontWeight: p.attempts > 0 ? 700 : 400 }}>
        {p.attempts}×
      </div>
    </div>
  );
}

// ── Message preview modal ────────────────────────────────────────
function MessageModal({ p, onClose, onSend }) {
  const [channel, setChannel] = useState("email");
  const [type, setType] = useState(p.status === "vencido" ? "vencido" : p.status === "fallido" ? "fallido" : "recordatorio");

  const msgText = {
    recordatorio: MSG_TEMPLATES.recordatorio(p.name, p.amount, fmtDate(p.due)),
    fallido: MSG_TEMPLATES.fallido(p.name, p.amount),
    vencido: MSG_TEMPLATES.vencido(p.name, p.amount, daysSince(p.due)),
  }[type];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, backdropFilter: "blur(8px)",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16, padding: 28, width: "100%", maxWidth: 520,
        animation: "scaleIn 0.2s ease",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ color: "#f1f5f9", fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700 }}>Enviar mensaje</div>
            <div style={{ color: "#4b5563", fontSize: 12 }}>{p.name} · {p.amount}€</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: "#9ca3af", fontSize: 16 }}>×</button>
        </div>

        {/* Type selector */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {["recordatorio", "fallido", "vencido"].map(t => (
            <button key={t} onClick={() => setType(t)} style={{
              flex: 1, padding: "7px 10px",
              background: type === t ? "rgba(57,208,216,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${type === t ? "rgba(57,208,216,0.35)" : "rgba(255,255,255,0.07)"}`,
              borderRadius: 8, cursor: "pointer",
              color: type === t ? BRAND : "#6b7280",
              fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
              textTransform: "capitalize", transition: "all 0.15s",
            }}>{t}</button>
          ))}
        </div>

        {/* Channel */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {["email", "whatsapp", "sms"].map(c => (
            <button key={c} onClick={() => setChannel(c)} style={{
              flex: 1, padding: "7px",
              background: channel === c ? "rgba(57,208,216,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${channel === c ? "rgba(57,208,216,0.35)" : "rgba(255,255,255,0.07)"}`,
              borderRadius: 8, cursor: "pointer",
              color: channel === c ? BRAND : "#6b7280",
              fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
              textTransform: "uppercase", transition: "all 0.15s",
            }}>{c === "email" ? "📧" : c === "whatsapp" ? "💬" : "📱"} {c}</button>
          ))}
        </div>

        {/* Preview */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 10, padding: 16, marginBottom: 16,
          color: "#9ca3af", fontSize: 13, lineHeight: 1.7,
          whiteSpace: "pre-wrap", maxHeight: 200, overflowY: "auto",
          fontFamily: "'DM Sans', sans-serif",
        }}>{msgText}</div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "10px", background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
            color: "#6b7280", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13,
          }}>Cancelar</button>
          <button onClick={() => onSend(p, channel, type)} style={{
            flex: 2, padding: "10px", background: BRAND, border: "none",
            borderRadius: 10, color: "#051015", fontWeight: 700,
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13,
          }}>Enviar por {channel.toUpperCase()} →</button>
        </div>
      </div>
    </div>
  );
}

// ── Chat bubble ──────────────────────────────────────────────────
function Bubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 12, animation: "popIn 0.2s ease" }}>
      {!isUser && (
        <div style={{
          width: 30, height: 30, borderRadius: "50%",
          background: `linear-gradient(135deg, ${BRAND}, #1aa8af)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, color: "#051015", fontWeight: 900, marginRight: 8,
          flexShrink: 0, alignSelf: "flex-end", fontFamily: "serif",
        }}>R</div>
      )}
      <div style={{
        maxWidth: "80%",
        background: isUser ? "#111827" : "rgba(57,208,216,0.07)",
        border: isUser ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(57,208,216,0.2)",
        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        padding: "10px 14px", color: "#e2e8f0",
        fontSize: 13, lineHeight: 1.65,
        fontFamily: "'DM Sans', sans-serif", whiteSpace: "pre-wrap",
      }}>
        {msg.content}
        <div style={{ fontSize: 10, color: "#374151", marginTop: 3, textAlign: "right" }}>{msg.time}</div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────
export default function Collections() {
  const [payments, setPayments] = useState(INITIAL_PAYMENTS);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState("todos");
  const [activeTab, setActiveTab] = useState("cobros");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hola 👋 Soy el Agente de Cobros de Reset Fitness Ibiza. Monitorizo pagos, gestiono recordatorios y te ayudo a reducir impagos.\n\n¿Qué quieres revisar hoy?", time: now() }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  function showNotif(msg, color = "#22c55e") {
    setNotif({ msg, color });
    setTimeout(() => setNotif(null), 3000);
  }

  function handleSend(p, channel, type) {
    setPayments(prev => prev.map(x => x.id === p.id ? { ...x, attempts: x.attempts + 1, lastAttempt: new Date().toISOString().split("T")[0] } : x));
    setModal(null);
    showNotif(`✓ Mensaje ${type} enviado a ${p.name} vía ${channel}`);
  }

  function markPaid(id) {
    setPayments(prev => prev.map(x => x.id === id ? { ...x, status: "pagado" } : x));
    setSelected(null);
    showNotif("✓ Pago marcado como cobrado");
  }

  const filtered = filter === "todos" ? payments : payments.filter(p => p.status === filter);

  const stats = {
    pendiente: payments.filter(p => p.status === "pendiente").reduce((s, p) => s + p.amount, 0),
    fallido:   payments.filter(p => p.status === "fallido").reduce((s, p) => s + p.amount, 0),
    vencido:   payments.filter(p => p.status === "vencido").reduce((s, p) => s + p.amount, 0),
    cobrado:   payments.filter(p => p.status === "pagado").reduce((s, p) => s + p.amount, 0),
  };
  const totalDeuda = stats.pendiente + stats.fallido + stats.vencido;

  async function sendMessage(text) {
    const txt = text || input.trim();
    if (!txt) return;
    setInput("");
    const userMsg = { role: "user", content: txt, time: now() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);
    setActiveTab("asistente");

    const context = `\nESTADO DE COBROS:\n${payments.map(p => `${p.name} | ${p.plan} | ${p.amount}€ | ${p.status} | vence: ${p.due} | intentos: ${p.attempts}`).join("\n")}\n\nDEUDA TOTAL PENDIENTE: ${totalDeuda}€`;

    try {
      const reply = await askClaude({ system: SYSTEM_PROMPT, messages: updated.map(m => ({ role: m.role, content: m.content })) });
      setMessages(prev => [...prev, { role: "assistant", content: reply, time: now() }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error de conexión.", time: now() }]);
    }
    setLoading(false);
  }

  const TABS = ["cobros", "asistente"];
  const FILTERS = ["todos", "pendiente", "fallido", "vencido", "pagado"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&family=DM+Sans:wght@300;400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes popIn{from{opacity:0;transform:scale(0.92);}to{opacity:1;transform:scale(1);}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.95);}to{opacity:1;transform:scale(1);}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}
        ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:rgba(57,208,216,0.15);border-radius:2px;}
        input:focus,textarea:focus{outline:none;}
      `}</style>

      {modal && <MessageModal p={modal} onClose={() => setModal(null)} onSend={handleSend} />}

      {notif && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 300,
          background: `${notif.color}18`, border: `1px solid ${notif.color}50`,
          borderRadius: 10, padding: "12px 20px", color: notif.color,
          fontSize: 13, fontWeight: 600, animation: "slideDown 0.3s ease",
          backdropFilter: "blur(12px)", fontFamily: "'DM Sans', sans-serif",
        }}>{notif.msg}</div>
      )}

      <div style={{ minHeight: "100vh", background: "#07090f", color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>

        {/* Header */}
        <div style={{
          padding: "16px 28px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(0,0,0,0.35)", backdropFilter: "blur(16px)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 50,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: `linear-gradient(135deg, ${BRAND}, #1aa8af)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, color: "#051015", fontWeight: 900, fontFamily: "serif",
              boxShadow: `0 4px 20px ${BRAND}40`,
            }}>R</div>
            <div>
              <div style={{ color: "#f1f5f9", fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 700 }}>Reset Fitness Ibiza</div>
              <div style={{ color: "#4b5563", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>Agente 4 — Collections & Payments</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4 }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "7px 16px", borderRadius: 8,
                background: activeTab === tab ? "rgba(57,208,216,0.14)" : "transparent",
                border: `1px solid ${activeTab === tab ? "rgba(57,208,216,0.3)" : "transparent"}`,
                color: activeTab === tab ? BRAND : "#6b7280",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
              }}>{tab === "cobros" ? "💳 Cobros" : "🤖 Asistente"}</button>
            ))}
          </div>
        </div>

        {/* KPI strip */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(0,0,0,0.2)",
        }}>
          {[
            { label: "Deuda total",  val: `${totalDeuda}€`, color: "#ef4444", sub: "pendiente + fallido + vencido" },
            { label: "Fallidos",     val: `${stats.fallido}€`, color: "#f97316", sub: `${payments.filter(p=>p.status==="fallido").length} pagos` },
            { label: "Vencidos",     val: `${stats.vencido}€`, color: "#ef4444", sub: `${payments.filter(p=>p.status==="vencido").length} pagos` },
            { label: "Cobrado",      val: `${stats.cobrado}€`, color: "#22c55e", sub: `${payments.filter(p=>p.status==="pagado").length} pagos` },
          ].map((k, i) => (
            <div key={k.label} style={{
              padding: "16px 22px",
              borderRight: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none",
            }}>
              <div style={{ color: k.color, fontSize: 22, fontWeight: 800, fontFamily: "'Cormorant Garamond', serif" }}>{k.val}</div>
              <div style={{ color: "#e5e7eb", fontSize: 12, fontWeight: 600, marginTop: 2 }}>{k.label}</div>
              <div style={{ color: "#374151", fontSize: 11, marginTop: 1 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ display: "flex", height: "calc(100vh - 152px)" }}>

          {activeTab === "cobros" && (
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              {/* List */}
              <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                {/* Filter bar */}
                <div style={{ display: "flex", gap: 6, marginBottom: 16, alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {FILTERS.map(f => {
                      const st = STATUS_CFG[f];
                      return (
                        <button key={f} onClick={() => setFilter(f)} style={{
                          padding: "6px 14px", borderRadius: 99,
                          background: filter === f ? (st?.bg || "rgba(57,208,216,0.12)") : "rgba(255,255,255,0.04)",
                          border: `1px solid ${filter === f ? (st?.color || BRAND) + "50" : "rgba(255,255,255,0.07)"}`,
                          color: filter === f ? (st?.color || BRAND) : "#6b7280",
                          fontSize: 11, fontWeight: 600, cursor: "pointer",
                          fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
                          textTransform: "capitalize",
                        }}>{f === "todos" ? `Todos (${payments.length})` : `${st?.label} (${payments.filter(p=>p.status===f).length})`}</button>
                      );
                    })}
                  </div>
                  <button onClick={() => sendMessage("Dame un resumen de todos los impagos y qué acciones recomiendas")} style={{
                    background: "rgba(57,208,216,0.1)", border: "1px solid rgba(57,208,216,0.25)",
                    borderRadius: 8, padding: "7px 14px", color: BRAND,
                    fontSize: 11, fontWeight: 700, cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}>🤖 Analizar con IA</button>
                </div>

                {/* Column headers */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px 70px 60px", gap: 12, padding: "5px 16px", marginBottom: 6 }}>
                  {["Socio", "Importe", "Estado", "Vence", "Intentos"].map(h => (
                    <div key={h} style={{ color: "#374151", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</div>
                  ))}
                </div>

                {filtered.map(p => (
                  <PaymentRow key={p.id} p={p} selected={selected?.id === p.id} onSelect={setSelected} />
                ))}
              </div>

              {/* Detail panel */}
              {selected && (
                <div style={{
                  width: 290, borderLeft: "1px solid rgba(255,255,255,0.06)",
                  padding: 22, overflowY: "auto",
                  background: "rgba(0,0,0,0.2)",
                  animation: "fadeUp 0.2s ease",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div>
                      <div style={{ color: "#f1f5f9", fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 700 }}>{selected.name}</div>
                      <div style={{ color: "#4b5563", fontSize: 11 }}>{selected.memberId}</div>
                    </div>
                    <button onClick={() => setSelected(null)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, width: 28, height: 28, cursor: "pointer", color: "#6b7280", fontSize: 15 }}>×</button>
                  </div>

                  {/* Status badge */}
                  {(() => { const st = STATUS_CFG[selected.status]; return (
                    <div style={{ background: st.bg, border: `1px solid ${st.color}40`, borderRadius: 9, padding: "9px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: st.color, fontSize: 16 }}>{st.icon}</span>
                      <span style={{ color: st.color, fontWeight: 700, fontSize: 13 }}>{st.label}</span>
                      <span style={{ color: st.color, fontSize: 12, marginLeft: "auto" }}>{selected.amount}€</span>
                    </div>
                  );})()}

                  {[
                    ["📧 Email", selected.email],
                    ["📞 Teléfono", selected.phone],
                    ["📋 Plan", selected.plan],
                    ["📅 Vencimiento", fmtDate(selected.due)],
                    ["🔄 Intentos", `${selected.attempts} cobro${selected.attempts !== 1 ? "s" : ""} intentado${selected.attempts !== 1 ? "s" : ""}`],
                    ["📆 Último intento", fmtDate(selected.lastAttempt)],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                      <span style={{ color: "#4b5563" }}>{k}</span>
                      <span style={{ color: "#9ca3af" }}>{v}</span>
                    </div>
                  ))}

                  <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                    {selected.status !== "pagado" && (
                      <>
                        <button onClick={() => setModal(selected)} style={{
                          padding: "10px", background: BRAND, border: "none",
                          borderRadius: 10, color: "#051015", fontWeight: 700,
                          fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                        }}>✉ Enviar recordatorio</button>
                        <button onClick={() => markPaid(selected.id)} style={{
                          padding: "10px",
                          background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
                          borderRadius: 10, color: "#22c55e", fontWeight: 700,
                          fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                        }}>✓ Marcar como pagado</button>
                      </>
                    )}
                    <button onClick={() => { sendMessage(`Analiza la situación de pago de ${selected.name} y dime qué hacer`); setSelected(null); }} style={{
                      padding: "10px",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 10, color: "#6b7280", fontSize: 13,
                      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                    }}>🤖 Analizar con IA</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "asistente" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                {messages.map((m, i) => <Bubble key={i} msg={m} />)}
                {loading && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${BRAND}, #1aa8af)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#051015", fontWeight: 900, fontFamily: "serif" }}>R</div>
                    <div style={{ background: "rgba(57,208,216,0.07)", border: "1px solid rgba(57,208,216,0.18)", borderRadius: "16px 16px 16px 4px", padding: "10px 16px", display: "flex", gap: 5 }}>
                      {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: BRAND, animation: `pulse 1.1s ease ${i*0.18}s infinite` }} />)}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div style={{ padding: "0 24px 10px", display: "flex", gap: 7, flexWrap: "wrap" }}>
                {[
                  "Resumen de impagos urgentes",
                  "¿A quién contactar primero?",
                  "Calcula la deuda total",
                  "Redacta mensaje para Marco Rossi",
                ].map(q => (
                  <button key={q} onClick={() => sendMessage(q)} style={{
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 99, padding: "6px 12px", color: "#6b7280",
                    fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.color = BRAND; e.currentTarget.style.borderColor = BRAND + "50"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "#6b7280"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                  >{q}</button>
                ))}
              </div>

              <div style={{ padding: "12px 20px 16px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(57,208,216,0.18)", borderRadius: 14, padding: "10px 12px" }}>
                  <textarea value={input} rows={1} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Consulta sobre cobros, impagos, recordatorios..."
                    style={{ flex: 1, background: "transparent", border: "none", color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.5, maxHeight: 80, overflowY: "auto", resize: "none" }} />
                  <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{
                    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                    background: !input.trim() || loading ? "rgba(57,208,216,0.12)" : BRAND,
                    border: "none", cursor: !input.trim() || loading ? "not-allowed" : "pointer",
                    color: !input.trim() || loading ? BRAND : "#051015",
                    fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, transition: "all 0.2s",
                  }}>↑</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

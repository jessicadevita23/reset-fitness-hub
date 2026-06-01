import { useState, useRef, useEffect } from "react";
import { askClaude } from '../api.js'

const BRAND = "#39D0D8";

// ── Data ─────────────────────────────────────────────────────────
const WORKFLOWS = [
  {
    id: "WF001", name: "Onboarding nuevo socio", category: "socios", status: "activo",
    icon: "👤", color: BRAND, lastRun: "hace 2h", runsTotal: 47,
    steps: ["Alta en sistema", "Generar contrato", "Enviar bienvenida", "Configurar SEPA", "Asignar clase intro"],
  },
  {
    id: "WF002", name: "Onboarding entrenador externo", category: "staff", status: "activo",
    icon: "🏋️", color: "#a855f7", lastRun: "hace 1d", runsTotal: 8,
    steps: ["Verificar seguro RC", "Recoger certificado médico", "Firmar contrato", "Briefing normas", "Acceso al sistema"],
  },
  {
    id: "WF003", name: "Alerta impago detectado", category: "cobros", status: "activo",
    icon: "💳", color: "#f97316", lastRun: "hace 4h", runsTotal: 23,
    steps: ["Detectar fallo SEPA", "Notificar a socio", "Reintento 3 días", "Escalar a admin", "Suspensión acceso"],
  },
  {
    id: "WF004", name: "Recordatorio renovación", category: "socios", status: "activo",
    icon: "🔄", color: "#22c55e", lastRun: "hace 6h", runsTotal: 62,
    steps: ["Detectar vencimiento -15d", "Email recordatorio", "WhatsApp -7d", "Oferta retención -3d", "Confirmar renovación"],
  },
  {
    id: "WF005", name: "Alta nuevo trabajador", category: "staff", status: "borrador",
    icon: "📋", color: "#eab308", lastRun: "nunca", runsTotal: 0,
    steps: ["Verificar autorización laboral", "Preparar contrato", "Alta SS gestoría", "Acceso sistemas", "Formación inicial"],
  },
  {
    id: "WF006", name: "Gestión de incidencia", category: "operaciones", status: "activo",
    icon: "⚠️", color: "#ef4444", lastRun: "hace 3d", runsTotal: 5,
    steps: ["Registrar incidencia", "Clasificar urgencia", "Notificar responsable", "Seguimiento resolución", "Cierre y documentación"],
  },
  {
    id: "WF007", name: "Informe semanal automático", category: "reporting", status: "activo",
    icon: "📊", color: "#06b6d4", lastRun: "hace 2d", runsTotal: 12,
    steps: ["Recopilar KPIs", "Generar resumen IA", "Enviar a María", "Archivar en Drive", "Actualizar dashboard"],
  },
  {
    id: "WF008", name: "Cierre documental mensual", category: "finanzas", status: "borrador",
    icon: "🧾", color: "#84cc16", lastRun: "nunca", runsTotal: 0,
    steps: ["Consolidar facturas PDF", "Verificar soporte docs", "Enviar a gestoría", "Actualizar cash flow", "Archivar mes"],
  },
];

const INCIDENTS = [
  { id: "INC001", title: "Máquina cinta rota – zona cardio", priority: "alta",   status: "abierta",   date: "2026-05-30", assignee: "María Lagos",    category: "equipamiento" },
  { id: "INC002", title: "Socio RF004 acceso bloqueado",    priority: "media",  status: "en-proceso", date: "2026-05-31", assignee: "Administración", category: "acceso" },
  { id: "INC003", title: "Fuga de agua – vestuarios",       priority: "alta",   status: "resuelta",   date: "2026-05-28", assignee: "Mantenimiento",  category: "instalaciones" },
  { id: "INC004", title: "Error en cobro doble – RF003",    priority: "alta",   status: "en-proceso", date: "2026-06-01", assignee: "Administración", category: "cobros" },
  { id: "INC005", title: "Entrenador falta sin avisar",     priority: "media",  status: "resuelta",   date: "2026-05-29", assignee: "María Lagos",    category: "staff" },
];

const ALERTS = [
  { id: "A1", type: "warn",  msg: "3 socios con membresía venciendo en 48h sin renovar",       time: "hace 1h",  action: "Ver cobros" },
  { id: "A2", type: "error", msg: "Documento sin soporte: Gestoría Laboral – 650€",             time: "hace 3h",  action: "Ver doc" },
  { id: "A3", type: "info",  msg: "Informe semanal generado y enviado a María Lagos",           time: "hace 6h",  action: "Ver informe" },
  { id: "A4", type: "warn",  msg: "Primer cargo Fit-Maker el 15/08/2026 – preparar liquidez",  time: "hace 1d",  action: "Ver finanzas" },
  { id: "A5", type: "info",  msg: "Workflow 'Onboarding socio' ejecutado 3 veces hoy",         time: "hace 2h",  action: null },
  { id: "A6", type: "error", msg: "Precontrato Jehison – autorización de trabajo pendiente",   time: "hace 2d",  action: "Ver laboral" },
];

const ALERT_CFG = {
  error: { color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", icon: "●" },
  warn:  { color: "#eab308", bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.2)",  icon: "◑" },
  info:  { color: BRAND,     bg: "rgba(57,208,216,0.08)", border: "rgba(57,208,216,0.2)", icon: "○" },
};

const PRIORITY_CFG = {
  alta:  { color: "#ef4444", bg: "rgba(239,68,68,0.1)",  label: "Alta" },
  media: { color: "#eab308", bg: "rgba(234,179,8,0.1)",  label: "Media" },
  baja:  { color: "#22c55e", bg: "rgba(34,197,94,0.1)",  label: "Baja" },
};

const STATUS_CFG = {
  "abierta":    { color: "#ef4444", label: "Abierta" },
  "en-proceso": { color: BRAND,     label: "En proceso" },
  "resuelta":   { color: "#22c55e", label: "Resuelta" },
};

const CAT_COLORS = {
  socios: BRAND, staff: "#a855f7", cobros: "#f97316",
  operaciones: "#ef4444", reporting: "#06b6d4", finanzas: "#84cc16",
};

const SYSTEM_PROMPT = `Eres el Agente de Operaciones y Automatización de Reset Fitness Ibiza. Gestionas workflows, incidencias, alertas operativas y mejora continua.

GIMNASIO: Reset Fitness Ibiza | C/ Madrid 34, Sant Josep | administracion@resetfitnessibiza.com | +34 661 47 12 32

WORKFLOWS ACTIVOS: Onboarding socio, Onboarding entrenador externo, Alerta impago, Recordatorio renovación, Gestión incidencias, Informe semanal automático.

WORKFLOWS EN BORRADOR: Alta nuevo trabajador, Cierre documental mensual.

INCIDENCIAS ABIERTAS:
- INC001: Máquina cinta rota – ALTA prioridad – asignada a María Lagos
- INC004: Cobro doble RF003 – ALTA prioridad – en proceso

ALERTAS ACTIVAS:
- 3 socios con membresía venciendo sin renovar
- Documento sin soporte (Gestoría Laboral 650€)
- Primer cargo Fit-Maker 15/08/2026 – preparar liquidez
- Precontrato Jehison – autorización de trabajo pendiente

PENDIENTES CRÍTICOS DEL DOSSIER:
- Confirmar alta censal y Modelo 036
- Modelo 115 por alquiler
- Revisión cláusula incumplimiento Fit-Maker
- Préstamo 500.000€ – novación antes de firmar
- Contratos entrenadores externos firmar antes de permitir acceso

INSTRUCCIONES:
- Prioriza por urgencia e impacto
- Propón automatizaciones nuevas cuando detectes procesos manuales
- Redacta SOPs (procedimientos) cuando se soliciten
- Identifica riesgos operativos y legales
- Tono ejecutivo, directo, accionable`;

function now() { return new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }); }

// ── Workflow card ────────────────────────────────────────────────
function WorkflowCard({ wf, onRun, onSelect, selected }) {
  return (
    <div onClick={() => onSelect(wf)} style={{
      background: selected ? `${wf.color}08` : "rgba(255,255,255,0.02)",
      border: `1px solid ${selected ? wf.color + "40" : "rgba(255,255,255,0.06)"}`,
      borderRadius: 14, padding: "18px 20px", cursor: "pointer",
      transition: "all 0.15s", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 3, background: wf.color, borderRadius: "3px 0 0 3px" }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${wf.color}18`, border: `1px solid ${wf.color}30`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
          }}>{wf.icon}</div>
          <div>
            <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 700 }}>{wf.name}</div>
            <div style={{ color: "#4b5563", fontSize: 11, marginTop: 2 }}>{wf.runsTotal} ejecuciones · {wf.lastRun}</div>
          </div>
        </div>
        <div style={{
          padding: "3px 10px", borderRadius: 99, fontSize: 10, fontWeight: 700,
          background: wf.status === "activo" ? "rgba(34,197,94,0.1)" : "rgba(234,179,8,0.1)",
          color: wf.status === "activo" ? "#22c55e" : "#eab308",
          border: `1px solid ${wf.status === "activo" ? "rgba(34,197,94,0.25)" : "rgba(234,179,8,0.25)"}`,
        }}>{wf.status === "activo" ? "● Activo" : "◐ Borrador"}</div>
      </div>

      {/* Step pills */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
        {wf.steps.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{
              padding: "3px 8px", borderRadius: 6,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
              color: "#6b7280", fontSize: 10,
            }}>{i + 1}. {step}</div>
            {i < wf.steps.length - 1 && <span style={{ color: "#374151", fontSize: 10 }}>→</span>}
          </div>
        ))}
      </div>

      <button onClick={e => { e.stopPropagation(); onRun(wf); }} style={{
        padding: "7px 14px", background: wf.status === "activo" ? wf.color : "rgba(255,255,255,0.06)",
        border: "none", borderRadius: 8,
        color: wf.status === "activo" ? "#051015" : "#4b5563",
        fontSize: 11, fontWeight: 700, cursor: wf.status === "activo" ? "pointer" : "not-allowed",
        fontFamily: "'DM Sans', sans-serif",
      }}>{wf.status === "activo" ? "▶ Ejecutar" : "◐ En desarrollo"}</button>
    </div>
  );
}

// ── Bubble ───────────────────────────────────────────────────────
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
        maxWidth: "82%",
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
export default function Operations() {
  const [activeTab, setActiveTab] = useState("centro");
  const [filterCat, setFilterCat] = useState("todos");
  const [selectedWF, setSelectedWF] = useState(null);
  const [incidents, setIncidents] = useState(INCIDENTS);
  const [alerts, setAlerts] = useState(ALERTS);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hola 👋 Soy el Agente de Operaciones de Reset Fitness Ibiza. Gestiono workflows, incidencias y automatizaciones.\n\nAlertas activas ahora mismo:\n⚠️ 3 membresías venciendo sin renovar\n🔴 Cobro doble RF003 en proceso\n🔴 Máquina cinta rota sin resolver\n📋 Precontrato Jehison – autorización pendiente\n\n¿Qué quieres gestionar?", time: now() }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  function showNotif(msg, color = BRAND) {
    setNotif({ msg, color });
    setTimeout(() => setNotif(null), 3000);
  }

  function handleRun(wf) {
    showNotif(`▶ Workflow "${wf.name}" ejecutado`, wf.color);
  }

  function dismissAlert(id) {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }

  function resolveIncident(id) {
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, status: "resuelta" } : i));
    showNotif("✓ Incidencia marcada como resuelta", "#22c55e");
  }

  async function sendMessage(text) {
    const txt = text || input.trim();
    if (!txt) return;
    setInput("");
    const userMsg = { role: "user", content: txt, time: now() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);
    setActiveTab("asistente");

    try {
      const reply = await askClaude({ system: SYSTEM_PROMPT, messages: updated.map(m => ({ role: m.role, content: m.content })) });
      setMessages(prev => [...prev, { role: "assistant", content: reply, time: now() }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error de conexión.", time: now() }]);
    }
    setLoading(false);
  }

  const filteredWF = filterCat === "todos" ? WORKFLOWS : WORKFLOWS.filter(w => w.category === filterCat);
  const openIncidents = incidents.filter(i => i.status !== "resuelta").length;
  const activeAlerts = alerts.filter(a => a.type === "error").length;

  const TABS = ["centro", "workflows", "incidencias", "alertas", "asistente"];
  const TAB_LABELS = { centro: "⚡ Centro Ops", workflows: "⚙ Workflows", incidencias: "⚠️ Incidencias", alertas: "🔔 Alertas", asistente: "🤖 Asistente" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&family=DM+Sans:wght@300;400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes popIn{from{opacity:0;transform:scale(0.92);}to{opacity:1;transform:scale(1);}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}
        @keyframes ping{0%{transform:scale(1);opacity:1;}75%,100%{transform:scale(1.8);opacity:0;}}
        ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:rgba(57,208,216,0.15);border-radius:2px;}
        textarea:focus{outline:none;}
      `}</style>

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
              <div style={{ color: "#4b5563", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>Agente 7 — Operations & Automation</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4 }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "7px 12px", borderRadius: 8, position: "relative",
                background: activeTab === tab ? "rgba(57,208,216,0.14)" : "transparent",
                border: `1px solid ${activeTab === tab ? "rgba(57,208,216,0.3)" : "transparent"}`,
                color: activeTab === tab ? BRAND : "#6b7280",
                fontSize: 11, fontWeight: 600, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
              }}>
                {TAB_LABELS[tab]}
                {tab === "alertas" && activeAlerts > 0 && (
                  <div style={{
                    position: "absolute", top: -4, right: -4,
                    width: 14, height: 14, borderRadius: "50%",
                    background: "#ef4444", color: "#fff",
                    fontSize: 8, fontWeight: 900,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{activeAlerts}</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{
          height: "calc(100vh - 65px)",
          overflow: activeTab === "asistente" ? "hidden" : "auto",
          display: activeTab === "asistente" ? "flex" : "block",
          flexDirection: "column",
          padding: activeTab === "asistente" ? 0 : 28,
        }}>

          {/* ── CENTRO OPS ── */}
          {activeTab === "centro" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#f1f5f9" }}>Centro de Operaciones</h2>
                  <p style={{ color: "#4b5563", fontSize: 12, marginTop: 2 }}>Estado en tiempo real del sistema Reset Fitness</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e", animation: "pulse 2s infinite" }} />
                  <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 600 }}>Todos los sistemas operativos</span>
                </div>
              </div>

              {/* Status grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
                {[
                  { label: "Workflows activos", val: WORKFLOWS.filter(w=>w.status==="activo").length, color: "#22c55e", icon: "⚙", sub: `${WORKFLOWS.filter(w=>w.status==="borrador").length} en borrador` },
                  { label: "Incidencias abiertas", val: openIncidents, color: openIncidents > 0 ? "#ef4444" : "#22c55e", icon: "⚠️", sub: `${incidents.filter(i=>i.priority==="alta"&&i.status!=="resuelta").length} de alta prioridad` },
                  { label: "Alertas críticas", val: activeAlerts, color: activeAlerts > 0 ? "#ef4444" : "#22c55e", icon: "🔔", sub: `${alerts.length} alertas totales` },
                  { label: "Automatizaciones hoy", val: "62", color: BRAND, icon: "▶", sub: "ejecuciones en 24h" },
                ].map(k => (
                  <div key={k.label} style={{
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12, padding: "16px 18px", position: "relative", overflow: "hidden",
                  }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${k.color}, transparent)` }} />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div style={{ color: "#4b5563", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>{k.label}</div>
                      <span style={{ fontSize: 18, opacity: 0.5 }}>{k.icon}</span>
                    </div>
                    <div style={{ color: k.color, fontSize: 26, fontWeight: 800, fontFamily: "'Cormorant Garamond', serif" }}>{k.val}</div>
                    <div style={{ color: "#374151", fontSize: 11, marginTop: 4 }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Two column layout */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Recent alerts */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#9ca3af", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em" }}>Alertas recientes</span>
                    <button onClick={() => setActiveTab("alertas")} style={{ background: "none", border: "none", color: BRAND, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Ver todas →</button>
                  </div>
                  {alerts.slice(0, 4).map(a => {
                    const cfg = ALERT_CFG[a.type];
                    return (
                      <div key={a.id} style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ color: cfg.color, fontSize: 14, marginTop: 1, flexShrink: 0 }}>{cfg.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: "#d1d5db", fontSize: 12, lineHeight: 1.4 }}>{a.msg}</div>
                          <div style={{ color: "#374151", fontSize: 10, marginTop: 3 }}>{a.time}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Open incidents */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#9ca3af", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em" }}>Incidencias abiertas</span>
                    <button onClick={() => setActiveTab("incidencias")} style={{ background: "none", border: "none", color: BRAND, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Ver todas →</button>
                  </div>
                  {incidents.filter(i => i.status !== "resuelta").map(inc => {
                    const pri = PRIORITY_CFG[inc.priority];
                    return (
                      <div key={inc.id} style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: pri.color, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: "#d1d5db", fontSize: 12 }}>{inc.title}</div>
                          <div style={{ color: "#374151", fontSize: 10, marginTop: 2 }}>{inc.assignee} · {inc.date}</div>
                        </div>
                        <div style={{ padding: "2px 8px", borderRadius: 99, background: pri.bg, color: pri.color, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{pri.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── WORKFLOWS ── */}
          {activeTab === "workflows" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#f1f5f9" }}>Workflows</h2>
                <button onClick={() => sendMessage("Propón 3 workflows nuevos que deberíamos automatizar en Reset Fitness")} style={{
                  background: "rgba(57,208,216,0.1)", border: "1px solid rgba(57,208,216,0.25)",
                  borderRadius: 9, padding: "8px 16px", color: BRAND,
                  fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}>🤖 Sugerir nuevos →</button>
              </div>

              {/* Category filter */}
              <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
                {["todos", "socios", "staff", "cobros", "operaciones", "reporting", "finanzas"].map(cat => (
                  <button key={cat} onClick={() => setFilterCat(cat)} style={{
                    padding: "5px 14px", borderRadius: 99,
                    background: filterCat === cat ? `${CAT_COLORS[cat] || BRAND}18` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${filterCat === cat ? (CAT_COLORS[cat] || BRAND) + "50" : "rgba(255,255,255,0.07)"}`,
                    color: filterCat === cat ? (CAT_COLORS[cat] || BRAND) : "#6b7280",
                    fontSize: 11, fontWeight: 600, cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif", transition: "all 0.14s", textTransform: "capitalize",
                  }}>{cat}</button>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredWF.map(wf => (
                  <WorkflowCard key={wf.id} wf={wf} onRun={handleRun} onSelect={setSelectedWF} selected={selectedWF?.id === wf.id} />
                ))}
              </div>
            </div>
          )}

          {/* ── INCIDENCIAS ── */}
          {activeTab === "incidencias" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#f1f5f9" }}>Incidencias</h2>
                <button onClick={() => sendMessage("Dame un plan de acción para resolver las incidencias abiertas de mayor prioridad")} style={{
                  background: BRAND, border: "none", borderRadius: 9,
                  padding: "9px 18px", color: "#051015", fontWeight: 700,
                  fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}>🤖 Plan de acción IA</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {incidents.map(inc => {
                  const pri = PRIORITY_CFG[inc.priority];
                  const st = STATUS_CFG[inc.status];
                  return (
                    <div key={inc.id} style={{
                      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 12, padding: "16px 20px",
                      borderLeft: `3px solid ${pri.color}`,
                      opacity: inc.status === "resuelta" ? 0.5 : 1,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                            <span style={{ color: "#4b5563", fontSize: 11 }}>{inc.id}</span>
                            <div style={{ padding: "2px 8px", borderRadius: 99, background: pri.bg, color: pri.color, fontSize: 10, fontWeight: 700 }}>{pri.label}</div>
                            <div style={{ padding: "2px 8px", borderRadius: 99, background: "rgba(255,255,255,0.05)", color: st.color, fontSize: 10, fontWeight: 700 }}>● {st.label}</div>
                          </div>
                          <div style={{ color: "#f1f5f9", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{inc.title}</div>
                          <div style={{ color: "#4b5563", fontSize: 12 }}>Asignado a: {inc.assignee} · {inc.date} · {inc.category}</div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          {inc.status !== "resuelta" && (
                            <button onClick={() => resolveIncident(inc.id)} style={{
                              padding: "7px 14px", background: "rgba(34,197,94,0.1)",
                              border: "1px solid rgba(34,197,94,0.25)", borderRadius: 8,
                              color: "#22c55e", fontSize: 11, fontWeight: 700,
                              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                            }}>✓ Resolver</button>
                          )}
                          <button onClick={() => sendMessage(`Ayúdame a gestionar la incidencia: ${inc.title}. Prioridad ${inc.priority}.`)} style={{
                            padding: "7px 14px", background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
                            color: "#6b7280", fontSize: 11, cursor: "pointer",
                            fontFamily: "'DM Sans', sans-serif",
                          }}>🤖 IA</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── ALERTAS ── */}
          {activeTab === "alertas" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#f1f5f9" }}>Alertas del sistema</h2>
                <span style={{ color: "#4b5563", fontSize: 12 }}>{alerts.length} alertas activas</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {alerts.map(a => {
                  const cfg = ALERT_CFG[a.type];
                  return (
                    <div key={a.id} style={{
                      background: cfg.bg, border: `1px solid ${cfg.border}`,
                      borderRadius: 12, padding: "14px 18px",
                      display: "flex", alignItems: "center", gap: 12,
                    }}>
                      <span style={{ color: cfg.color, fontSize: 20, flexShrink: 0 }}>{cfg.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#e2e8f0", fontSize: 13 }}>{a.msg}</div>
                        <div style={{ color: "#4b5563", fontSize: 11, marginTop: 3 }}>{a.time}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {a.action && (
                          <button onClick={() => sendMessage(`Ayúdame con esta alerta: ${a.msg}`)} style={{
                            padding: "6px 12px", background: `${cfg.color}18`,
                            border: `1px solid ${cfg.color}40`, borderRadius: 7,
                            color: cfg.color, fontSize: 11, fontWeight: 600,
                            cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                          }}>{a.action}</button>
                        )}
                        <button onClick={() => dismissAlert(a.id)} style={{
                          padding: "6px 10px", background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7,
                          color: "#4b5563", fontSize: 12, cursor: "pointer",
                        }}>×</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── ASISTENTE ── */}
          {activeTab === "asistente" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
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

              <div style={{ padding: "0 28px 10px", display: "flex", gap: 7, flexWrap: "wrap" }}>
                {[
                  "¿Qué pendientes críticos hay hoy?",
                  "Genera SOP de onboarding de socio",
                  "Plan para resolver incidencias abiertas",
                  "Propón automatizaciones nuevas",
                  "¿Qué riesgos operativos hay esta semana?",
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

              <div style={{ padding: "12px 24px 16px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(57,208,216,0.18)", borderRadius: 14, padding: "10px 12px" }}>
                  <textarea value={input} rows={1} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Workflows, incidencias, SOPs, automatizaciones..."
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

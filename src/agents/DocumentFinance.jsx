import { useState, useRef, useEffect } from "react";
import { askClaude } from '../api.js'

const BRAND = "#39D0D8";

// ── Mock financial data ──────────────────────────────────────────
const INITIAL_DOCS = [
  { id: "DOC001", type: "factura",   vendor: "Fit-Maker Sport SLU",    concept: "Maquinaria gimnasio – cuota agosto",  amount: 4305.55,  vat: 21, net: 3558.31, date: "2026-05-07", status: "procesada",  category: "maquinaria",   month: "mayo" },
  { id: "DOC002", type: "factura",   vendor: "Elementents CP, S.L.",   concept: "Carpa exterior – primer pago",        amount: 4000.00,  vat: 21, net: 3305.79, date: "2026-05-10", status: "procesada",  category: "instalaciones", month: "mayo" },
  { id: "DOC003", type: "factura",   vendor: "Gestoría Fiscal",        concept: "Asesoría fiscal mayo 2026",           amount: 350.00,   vat: 21, net: 289.26, date: "2026-05-15", status: "procesada",  category: "asesoria",     month: "mayo" },
  { id: "DOC004", type: "factura",   vendor: "Endesa",                 concept: "Electricidad – local mayo",           amount: 780.50,   vat: 21, net: 645.04, date: "2026-05-20", status: "procesada",  category: "suministros",  month: "mayo" },
  { id: "DOC005", type: "factura",   vendor: "Proveedor limpieza",     concept: "Material de limpieza",                amount: 215.00,   vat: 21, net: 177.69, date: "2026-05-22", status: "pendiente",  category: "operacional",  month: "mayo" },
  { id: "DOC006", type: "factura",   vendor: "Fit-Maker Sport SLU",   concept: "Maquinaria – cuota septiembre",       amount: 4305.55,  vat: 21, net: 3558.31, date: "2026-06-01", status: "pendiente",  category: "maquinaria",   month: "junio" },
  { id: "DOC007", type: "recibo",    vendor: "Seguro gimnasio",        concept: "Prima seguro RC anual",               amount: 1200.00,  vat: 0,  net: 1200.00, date: "2026-05-01", status: "procesada",  category: "seguros",      month: "mayo" },
  { id: "DOC008", type: "proforma",  vendor: "Marketing Agency",       concept: "Campaña lanzamiento digital",         amount: 2400.00,  vat: 21, net: 1983.47, date: "2026-06-01", status: "pendiente",  category: "marketing",    month: "junio" },
  { id: "DOC009", type: "factura",   vendor: "Telefónica",             concept: "Internet + línea fija mayo",          amount: 89.90,    vat: 21, net: 74.30, date: "2026-05-25", status: "procesada",  category: "suministros",  month: "mayo" },
  { id: "DOC010", type: "factura",   vendor: "Gestoría Laboral",       concept: "Nóminas y SS mayo 2026",              amount: 650.00,   vat: 21, net: 537.19, date: "2026-05-28", status: "sin-soporte", category: "laboral",      month: "mayo" },
];

const CATEGORIES = {
  maquinaria:    { color: BRAND,      icon: "⚙", label: "Maquinaria" },
  instalaciones: { color: "#a855f7",  icon: "🏗", label: "Instalaciones" },
  asesoria:      { color: "#f97316",  icon: "📊", label: "Asesoría" },
  suministros:   { color: "#22c55e",  icon: "💡", label: "Suministros" },
  operacional:   { color: "#eab308",  icon: "🧹", label: "Operacional" },
  seguros:       { color: "#06b6d4",  icon: "🛡", label: "Seguros" },
  marketing:     { color: "#ec4899",  icon: "📣", label: "Marketing" },
  laboral:       { color: "#84cc16",  icon: "👥", label: "Laboral" },
};

const DOC_STATUS = {
  procesada:      { color: "#22c55e", bg: "rgba(34,197,94,0.1)",   label: "Procesada",    icon: "✓" },
  pendiente:      { color: BRAND,     bg: "rgba(57,208,216,0.1)",  label: "Pendiente",    icon: "◐" },
  "sin-soporte":  { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   label: "Sin soporte",  icon: "!" },
};

const DOC_TYPES = {
  factura:  { color: "#e2e8f0", icon: "🧾" },
  recibo:   { color: "#9ca3af", icon: "📄" },
  proforma: { color: "#eab308", icon: "📋" },
};

const SYSTEM_PROMPT = `Eres el Agente de Documentación y Finanzas de Reset Fitness Ibiza. Gestionas facturas, categorización de gastos, control de IVA y resúmenes financieros.

CONTEXTO FISCAL:
- Sociedad: RESET FITNESS, S.L. | NIF: B26660720
- Dirección: C/ Madrid 34, Sant Josep de Sa Talaia, 07829, Ibiza
- IVA: Modelo 303 trimestral
- Retención alquiler: Modelo 115
- Gestoría: envío mensual de facturas en PDF consolidado
- Ejercicio fiscal activo desde 2026

PRÉSTAMOS ACTIVOS:
- Préstamo principal: 350.000 EUR al 3% – 8 años
- Préstamo María → Reset: 69.922,84 EUR (gastos pre-apertura)
- Fit-Maker: 41 cuotas × 4.305,55 EUR (IVA incl.) desde agosto 2026

CATEGORÍAS DE GASTO: maquinaria, instalaciones, asesoría, suministros, operacional, seguros, marketing, laboral

CRITERIOS:
- Separar siempre base imponible, IVA y total
- Identificar facturas sin soporte documental (reclamar al proveedor)
- Agrupar por mes para envío a gestoría
- Controlar IVA soportado vs repercutido
- Alertar sobre gastos grandes o inusuales

INSTRUCCIONES:
- Respuestas estructuradas con datos concretos
- Calcula totales cuando se pida
- Identifica riesgos fiscales o documentales
- Redacta emails a gestoría si se solicita
- Sé preciso con importes, fechas y categorías`;

function fmt(n) { return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d) { return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }); }
function now() { return new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }); }

// ── Doc row ──────────────────────────────────────────────────────
function DocRow({ d, selected, onSelect }) {
  const st = DOC_STATUS[d.status];
  const cat = CATEGORIES[d.category];
  const dt = DOC_TYPES[d.type];
  return (
    <div onClick={() => onSelect(d)} style={{
      display: "grid",
      gridTemplateColumns: "28px 1fr 90px 90px 80px 80px",
      alignItems: "center", gap: 12,
      padding: "11px 16px",
      background: selected ? "rgba(57,208,216,0.06)" : "rgba(255,255,255,0.02)",
      border: `1px solid ${selected ? "rgba(57,208,216,0.25)" : "rgba(255,255,255,0.05)"}`,
      borderRadius: 10, cursor: "pointer", marginBottom: 5,
      transition: "all 0.14s",
      borderLeft: `3px solid ${cat.color}`,
    }}>
      <span style={{ fontSize: 16 }}>{dt.icon}</span>
      <div>
        <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{d.vendor}</div>
        <div style={{ color: "#4b5563", fontSize: 11 }}>{d.concept}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ color: cat.color, fontSize: 13 }}>{cat.icon}</span>
        <span style={{ color: "#6b7280", fontSize: 11 }}>{cat.label}</span>
      </div>
      <div style={{ color: "#f1f5f9", fontSize: 13, fontWeight: 700 }}>{fmt(d.amount)}€</div>
      <div style={{ color: "#4b5563", fontSize: 11 }}>{fmtDate(d.date)}</div>
      <div style={{
        padding: "3px 9px", borderRadius: 99,
        background: st.bg, color: st.color,
        fontSize: 11, fontWeight: 700, textAlign: "center",
      }}>{st.icon} {st.label}</div>
    </div>
  );
}

// ── Summary card ─────────────────────────────────────────────────
function SummaryCard({ label, value, sub, color, icon }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 12, padding: "16px 20px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ color: "#4b5563", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{label}</div>
          <div style={{ color, fontSize: 22, fontWeight: 800, fontFamily: "'Cormorant Garamond', serif" }}>{value}</div>
          {sub && <div style={{ color: "#374151", fontSize: 11, marginTop: 3 }}>{sub}</div>}
        </div>
        <span style={{ fontSize: 22, opacity: 0.6 }}>{icon}</span>
      </div>
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
export default function DocumentFinance() {
  const [docs, setDocs] = useState(INITIAL_DOCS);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("documentos");
  const [filterCat, setFilterCat] = useState("todas");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hola 👋 Soy el Agente de Documentación y Finanzas de Reset Fitness Ibiza. Gestiono facturas, IVA, categorización de gastos y resúmenes para la gestoría.\n\n¿Qué necesitas revisar?", time: now() }
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

  function markProcessed(id) {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, status: "procesada" } : d));
    setSelected(null);
    showNotif("✓ Documento marcado como procesado");
  }

  // Derived stats
  const totalGasto = docs.filter(d => d.status !== "pendiente").reduce((s, d) => s + d.net, 0);
  const totalIVA = docs.reduce((s, d) => s + (d.amount - d.net), 0);
  const sinSoporte = docs.filter(d => d.status === "sin-soporte").length;
  const pendientes = docs.filter(d => d.status === "pendiente").length;

  // Category breakdown
  const catTotals = Object.entries(CATEGORIES).map(([key, cat]) => ({
    ...cat, key,
    total: docs.filter(d => d.category === key).reduce((s, d) => s + d.amount, 0),
    count: docs.filter(d => d.category === key).length,
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const filtered = docs.filter(d =>
    (filterCat === "todas" || d.category === filterCat) &&
    (filterStatus === "todos" || d.status === filterStatus)
  );

  async function sendMessage(text) {
    const txt = text || input.trim();
    if (!txt) return;
    setInput("");
    const userMsg = { role: "user", content: txt, time: now() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);
    setActiveTab("asistente");

    const context = `\nDOCUMENTOS REGISTRADOS:\n${docs.map(d => `${d.id}|${d.vendor}|${d.concept}|${d.amount}€|IVA ${d.vat}%|${d.date}|${d.status}|${d.category}`).join("\n")}\n\nRESUMEN: Total gasto neto: ${fmt(totalGasto)}€ | IVA soportado: ${fmt(totalIVA)}€ | Sin soporte: ${sinSoporte} docs | Pendientes: ${pendientes} docs`;

    try {
      const reply = await askClaude({ system: SYSTEM_PROMPT, messages: updated.map(m => ({ role: m.role, content: m.content })) });
      setMessages(prev => [...prev, { role: "assistant", content: reply, time: now() }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error de conexión.", time: now() }]);
    }
    setLoading(false);
  }

  const TABS = ["documentos", "resumen", "asistente"];
  const TAB_LABELS = { documentos: "🧾 Documentos", resumen: "📊 Resumen", asistente: "🤖 Asistente" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&family=DM+Sans:wght@300;400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes popIn{from{opacity:0;transform:scale(0.92);}to{opacity:1;transform:scale(1);}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}
        ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:rgba(57,208,216,0.15);border-radius:2px;}
        input:focus,textarea:focus{outline:none;}
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
              <div style={{ color: "#4b5563", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>Agente 5 — Document & Finance</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4 }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "7px 14px", borderRadius: 8,
                background: activeTab === tab ? "rgba(57,208,216,0.14)" : "transparent",
                border: `1px solid ${activeTab === tab ? "rgba(57,208,216,0.3)" : "transparent"}`,
                color: activeTab === tab ? BRAND : "#6b7280",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
              }}>{TAB_LABELS[tab]}</button>
            ))}
          </div>
        </div>

        {/* KPI strip */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4,1fr)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(0,0,0,0.2)",
        }}>
          {[
            { label: "Gasto neto total", val: `${fmt(totalGasto)}€`, color: "#f1f5f9", sub: `${docs.length} documentos` },
            { label: "IVA soportado",    val: `${fmt(totalIVA)}€`,   color: BRAND,     sub: "deducible en Modelo 303" },
            { label: "Sin soporte",      val: sinSoporte,             color: "#ef4444", sub: "requieren factura" },
            { label: "Pendientes",       val: pendientes,             color: "#eab308", sub: "por procesar" },
          ].map((k, i) => (
            <div key={k.label} style={{
              padding: "16px 22px",
              borderRight: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none",
            }}>
              <div style={{ color: k.color, fontSize: 22, fontWeight: 800, fontFamily: "'Cormorant Garamond', serif" }}>{k.val}</div>
              <div style={{ color: "#9ca3af", fontSize: 12, fontWeight: 600, marginTop: 2 }}>{k.label}</div>
              <div style={{ color: "#374151", fontSize: 11, marginTop: 1 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ display: "flex", height: "calc(100vh - 152px)" }}>

          {/* ── Documentos tab ── */}
          {activeTab === "documentos" && (
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                {/* Filters */}
                <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <button onClick={() => setFilterCat("todas")} style={{
                      padding: "5px 12px", borderRadius: 99,
                      background: filterCat === "todas" ? "rgba(57,208,216,0.12)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${filterCat === "todas" ? "rgba(57,208,216,0.35)" : "rgba(255,255,255,0.07)"}`,
                      color: filterCat === "todas" ? BRAND : "#6b7280",
                      fontSize: 11, fontWeight: 600, cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif", transition: "all 0.14s",
                    }}>Todas</button>
                    {Object.entries(CATEGORIES).map(([key, cat]) => (
                      <button key={key} onClick={() => setFilterCat(key)} style={{
                        padding: "5px 12px", borderRadius: 99,
                        background: filterCat === key ? `${cat.color}18` : "rgba(255,255,255,0.04)",
                        border: `1px solid ${filterCat === key ? cat.color + "50" : "rgba(255,255,255,0.07)"}`,
                        color: filterCat === key ? cat.color : "#6b7280",
                        fontSize: 11, fontWeight: 600, cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif", transition: "all 0.14s",
                      }}>{cat.icon} {cat.label}</button>
                    ))}
                  </div>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
                    {["todos", "procesada", "pendiente", "sin-soporte"].map(s => {
                      const st = DOC_STATUS[s];
                      return (
                        <button key={s} onClick={() => setFilterStatus(s)} style={{
                          padding: "5px 12px", borderRadius: 99,
                          background: filterStatus === s ? (st?.bg || "rgba(57,208,216,0.12)") : "rgba(255,255,255,0.04)",
                          border: `1px solid ${filterStatus === s ? (st?.color || BRAND) + "50" : "rgba(255,255,255,0.07)"}`,
                          color: filterStatus === s ? (st?.color || BRAND) : "#6b7280",
                          fontSize: 11, fontWeight: 600, cursor: "pointer",
                          fontFamily: "'DM Sans', sans-serif", transition: "all 0.14s", textTransform: "capitalize",
                        }}>{s === "todos" ? "Todos" : st?.label}</button>
                      );
                    })}
                  </div>
                </div>

                {/* Column headers */}
                <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 90px 90px 80px 80px", gap: 12, padding: "5px 16px", marginBottom: 6 }}>
                  {["", "Proveedor / Concepto", "Categoría", "Importe", "Fecha", "Estado"].map(h => (
                    <div key={h} style={{ color: "#374151", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</div>
                  ))}
                </div>

                {filtered.map(d => (
                  <DocRow key={d.id} d={d} selected={selected?.id === d.id} onSelect={setSelected} />
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
                      <div style={{ color: "#f1f5f9", fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 700 }}>{selected.vendor}</div>
                      <div style={{ color: "#4b5563", fontSize: 11 }}>{selected.id}</div>
                    </div>
                    <button onClick={() => setSelected(null)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, width: 28, height: 28, cursor: "pointer", color: "#6b7280", fontSize: 15 }}>×</button>
                  </div>

                  {/* Status */}
                  {(() => { const st = DOC_STATUS[selected.status]; const cat = CATEGORIES[selected.category]; return (
                    <div style={{ background: st.bg, border: `1px solid ${st.color}40`, borderRadius: 9, padding: "8px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: cat.color }}>{cat.icon}</span>
                      <span style={{ color: st.color, fontWeight: 700, fontSize: 13 }}>{st.label}</span>
                      <span style={{ color: "#f1f5f9", fontSize: 13, fontWeight: 700, marginLeft: "auto" }}>{fmt(selected.amount)}€</span>
                    </div>
                  );})()}

                  {/* Desglose IVA */}
                  <div style={{
                    background: "rgba(57,208,216,0.05)", border: "1px solid rgba(57,208,216,0.15)",
                    borderRadius: 9, padding: "10px 14px", marginBottom: 14,
                  }}>
                    <div style={{ color: "#4b5563", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Desglose fiscal</div>
                    {[
                      ["Base imponible", `${fmt(selected.net)}€`],
                      [`IVA (${selected.vat}%)`, `${fmt(selected.amount - selected.net)}€`],
                      ["Total", `${fmt(selected.amount)}€`],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 12 }}>
                        <span style={{ color: "#6b7280" }}>{k}</span>
                        <span style={{ color: k === "Total" ? "#f1f5f9" : "#9ca3af", fontWeight: k === "Total" ? 700 : 400 }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {[
                    ["📄 Tipo", selected.type],
                    ["📂 Categoría", CATEGORIES[selected.category]?.label],
                    ["📅 Fecha", fmtDate(selected.date)],
                    ["📆 Mes", selected.month],
                    ["📝 Concepto", selected.concept],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                      <span style={{ color: "#4b5563" }}>{k}</span>
                      <span style={{ color: "#9ca3af", textAlign: "right", maxWidth: 160 }}>{v}</span>
                    </div>
                  ))}

                  <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                    {selected.status !== "procesada" && (
                      <button onClick={() => markProcessed(selected.id)} style={{
                        padding: "10px", background: BRAND, border: "none",
                        borderRadius: 10, color: "#051015", fontWeight: 700,
                        fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                      }}>✓ Marcar como procesada</button>
                    )}
                    {selected.status === "sin-soporte" && (
                      <button onClick={() => { sendMessage(`Redacta un email al proveedor ${selected.vendor} reclamando la factura de ${selected.concept} por importe de ${selected.amount}€`); }} style={{
                        padding: "10px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
                        borderRadius: 10, color: "#ef4444", fontWeight: 700,
                        fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                      }}>✉ Reclamar factura con IA</button>
                    )}
                    <button onClick={() => sendMessage(`Analiza el documento ${selected.id} de ${selected.vendor} por ${selected.amount}€`)} style={{
                      padding: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 10, color: "#6b7280", fontSize: 13,
                      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                    }}>🤖 Analizar con IA</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Resumen tab ── */}
          {activeTab === "resumen" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 28, animation: "fadeUp 0.3s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginBottom: 24 }}>
                <SummaryCard label="Gasto total bruto" value={`${fmt(docs.reduce((s,d)=>s+d.amount,0))}€`} sub={`${docs.length} documentos`} color="#f1f5f9" icon="📊" />
                <SummaryCard label="IVA soportado" value={`${fmt(totalIVA)}€`} sub="Deducible en Modelo 303" color={BRAND} icon="🧾" />
                <SummaryCard label="Sin soporte documental" value={sinSoporte} sub="Reclamar factura urgente" color="#ef4444" icon="⚠️" />
                <SummaryCard label="Mayor gasto unitario" value={`${fmt(Math.max(...docs.map(d=>d.amount)))}€`} sub="Fit-Maker cuota maquinaria" color="#eab308" icon="💰" />
              </div>

              {/* Category breakdown */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ color: "#f1f5f9", fontFamily: "'Cormorant Garamond', serif", fontSize: 18, marginBottom: 14 }}>Gasto por categoría</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {catTotals.map(cat => {
                    const pct = (cat.total / docs.reduce((s,d)=>s+d.amount,0)) * 100;
                    return (
                      <div key={cat.key} style={{
                        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 10, padding: "12px 16px",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 16 }}>{cat.icon}</span>
                            <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{cat.label}</span>
                            <span style={{ color: "#4b5563", fontSize: 11 }}>({cat.count} docs)</span>
                          </div>
                          <span style={{ color: cat.color, fontSize: 14, fontWeight: 700 }}>{fmt(cat.total)}€</span>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 99, height: 5, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: cat.color, borderRadius: 99, transition: "width 0.6s ease" }} />
                        </div>
                        <div style={{ color: "#374151", fontSize: 10, marginTop: 4, textAlign: "right" }}>{pct.toFixed(1)}% del total</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Docs sin soporte alert */}
              {sinSoporte > 0 && (
                <div style={{
                  background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: 12, padding: "16px 20px",
                }}>
                  <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>⚠️ {sinSoporte} documento{sinSoporte > 1 ? "s" : ""} sin soporte documental</div>
                  {docs.filter(d => d.status === "sin-soporte").map(d => (
                    <div key={d.id} style={{ color: "#9ca3af", fontSize: 12, marginBottom: 4 }}>
                      · {d.vendor} – {d.concept} – {fmt(d.amount)}€
                    </div>
                  ))}
                  <button onClick={() => sendMessage("Redacta emails para reclamar las facturas sin soporte documental")} style={{
                    marginTop: 10, padding: "8px 16px",
                    background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: 8, color: "#ef4444", fontSize: 12, fontWeight: 700,
                    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  }}>🤖 Reclamar con IA →</button>
                </div>
              )}
            </div>
          )}

          {/* ── Asistente tab ── */}
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
                  "Resumen de facturas de mayo para gestoría",
                  "¿Cuánto IVA puedo deducir este trimestre?",
                  "¿Qué facturas faltan por procesar?",
                  "Redacta email a gestoría con facturas de mayo",
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
                    placeholder="Facturas, IVA, categorías, gestoría..."
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

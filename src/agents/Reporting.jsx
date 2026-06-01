import { useState, useRef, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { askClaude } from '../api.js'

const BRAND = "#39D0D8";

// ── Mock data ────────────────────────────────────────────────────
const MONTHLY = [
  { month: "Ene", ingresos: 0,     gastos: 12400, socios: 0,  bajas: 0,  leads: 0,  conversion: 0 },
  { month: "Feb", ingresos: 0,     gastos: 18200, socios: 0,  bajas: 0,  leads: 4,  conversion: 0 },
  { month: "Mar", ingresos: 2100,  gastos: 22800, socios: 12, bajas: 0,  leads: 18, conversion: 67 },
  { month: "Abr", ingresos: 5400,  gastos: 14600, socios: 28, bajas: 2,  leads: 34, conversion: 59 },
  { month: "May", ingresos: 8750,  gastos: 16200, socios: 41, bajas: 3,  leads: 52, conversion: 52 },
  { month: "Jun", ingresos: 11200, gastos: 15800, socios: 52, bajas: 2,  leads: 61, conversion: 57 },
];

const WEEKLY = [
  { week: "S1 May", altas: 4, bajas: 0, ptSessions: 6,  revenue: 1800 },
  { week: "S2 May", altas: 7, bajas: 1, ptSessions: 9,  revenue: 2400 },
  { week: "S3 May", altas: 5, bajas: 1, ptSessions: 11, revenue: 2650 },
  { week: "S4 May", altas: 6, bajas: 1, ptSessions: 8,  revenue: 1900 },
  { week: "S1 Jun", altas: 9, bajas: 0, ptSessions: 14, revenue: 3200 },
];

const MEMBERSHIP_MIX = [
  { name: "Mensual",     value: 24, color: BRAND },
  { name: "Trimestral",  value: 18, color: "#a855f7" },
  { name: "Anual",       value: 10, color: "#22c55e" },
];

const RETENTION_DATA = [
  { month: "Mar", retention: 100 },
  { month: "Abr", retention: 93 },
  { month: "May", retention: 89 },
  { month: "Jun", retention: 91 },
];

const CURRENT = MONTHLY[MONTHLY.length - 1];
const PREV    = MONTHLY[MONTHLY.length - 2];

function pct(a, b) {
  if (!b) return null;
  const v = ((a - b) / b) * 100;
  return { val: v.toFixed(1), pos: v >= 0 };
}

function fmt(n) { return n.toLocaleString("es-ES"); }
function now() { return new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }); }

const SYSTEM_PROMPT = `Eres el Agente de Reporting de Gestión de Reset Fitness Ibiza. Generas informes para María Lagos, administradora del gimnasio.

DATOS ACTUALES (Junio 2026):
- Socios activos: 52 | Altas este mes: 11 | Bajas: 2 | Retención: 91%
- Ingresos junio: 11.200€ | Gastos: 15.800€ | Resultado: -4.600€ (pre-madurez)
- Deuda total préstamos: ~420.000€ | Cuota Fit-Maker: 4.305€/mes desde agosto
- Personal Training: 14 sesiones semana 1 junio | Leads: 61 en junio | Conversión: 57%
- Impagos activos: 4 socios | Deuda cobros: ~895€

CONTEXTO:
- Gym en fase de apertura/ramp-up (desde marzo 2026)
- Objetivo: breakeven en 80-90 socios activos
- Sociedad: RESET FITNESS, S.L. | NIF: B26660720

INSTRUCCIONES:
- Genera informes semanales y mensuales claros
- Identifica tendencias positivas y alertas
- Compara con mes anterior cuando sea útil
- Sé directo, usa datos concretos
- Ofrece recomendaciones accionables
- Tono ejecutivo, directo, sin relleno`;

// ── KPI card ─────────────────────────────────────────────────────
function KPICard({ label, value, sub, change, color = "#f1f5f9", icon }) {
  const chg = change;
  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 14, padding: "18px 20px",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${color}, transparent)`,
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ color: "#4b5563", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{label}</div>
          <div style={{ color, fontSize: 26, fontWeight: 800, fontFamily: "'Cormorant Garamond', serif", lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ color: "#374151", fontSize: 11, marginTop: 6 }}>{sub}</div>}
        </div>
        <div style={{ fontSize: 22, opacity: 0.5 }}>{icon}</div>
      </div>
      {chg && (
        <div style={{
          marginTop: 10, display: "inline-flex", alignItems: "center", gap: 4,
          background: chg.pos ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
          border: `1px solid ${chg.pos ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
          borderRadius: 99, padding: "3px 10px",
          color: chg.pos ? "#22c55e" : "#ef4444", fontSize: 11, fontWeight: 700,
        }}>
          {chg.pos ? "↑" : "↓"} {Math.abs(chg.val)}% vs mes anterior
        </div>
      )}
    </div>
  );
}

// ── Custom tooltip ───────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 8, padding: "10px 14px",
      fontFamily: "'DM Sans', sans-serif", fontSize: 12,
    }}>
      <div style={{ color: "#9ca3af", marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {typeof p.value === "number" ? fmt(p.value) : p.value}{p.name.includes("ngresos") || p.name.includes("astos") || p.name.includes("evenue") ? "€" : ""}
        </div>
      ))}
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
export default function Reporting() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hola María 👋 Soy tu Agente de Reporting. Tengo los KPIs de Reset Fitness actualizados.\n\nEste mes: 52 socios activos (+27% vs mayo), ingresos de 11.200€ y retención del 91%. El breakeven está en ~80 socios — vas bien encaminada.\n\n¿Quieres el informe semanal, el mensual o analizar algo concreto?", time: now() }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function sendMessage(text) {
    const txt = text || input.trim();
    if (!txt) return;
    setInput("");
    const userMsg = { role: "user", content: txt, time: now() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);
    setActiveTab("informe");

    try {
      const reply = await askClaude({ system: SYSTEM_PROMPT, messages: updated.map(m => ({ role: m.role, content: m.content })) });
      setMessages(prev => [...prev, { role: "assistant", content: reply, time: now() }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error de conexión.", time: now() }]);
    }
    setLoading(false);
  }

  const TABS = ["dashboard", "semanal", "mensual", "informe"];
  const TAB_LABELS = { dashboard: "📊 Dashboard", semanal: "📅 Semanal", mensual: "📆 Mensual", informe: "🤖 Informe IA" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&family=DM+Sans:wght@300;400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes popIn{from{opacity:0;transform:scale(0.92);}to{opacity:1;transform:scale(1);}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}
        ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:rgba(57,208,216,0.15);border-radius:2px;}
        textarea:focus{outline:none;}
      `}</style>

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
              <div style={{ color: "#4b5563", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>Agente 6 — Management Reporting</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4 }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "7px 13px", borderRadius: 8,
                background: activeTab === tab ? "rgba(57,208,216,0.14)" : "transparent",
                border: `1px solid ${activeTab === tab ? "rgba(57,208,216,0.3)" : "transparent"}`,
                color: activeTab === tab ? BRAND : "#6b7280",
                fontSize: 11, fontWeight: 600, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
              }}>{TAB_LABELS[tab]}</button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: activeTab === "informe" ? 0 : 28, height: "calc(100vh - 65px)", overflowY: activeTab === "informe" ? "hidden" : "auto", display: activeTab === "informe" ? "flex" : "block", flexDirection: "column" }}>

          {/* ── DASHBOARD ── */}
          {activeTab === "dashboard" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                <div>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#f1f5f9" }}>Dashboard — Junio 2026</h2>
                  <p style={{ color: "#4b5563", fontSize: 12, marginTop: 2 }}>Semana 1 · Datos actualizados hoy</p>
                </div>
                <button onClick={() => sendMessage("Dame el informe ejecutivo completo de junio 2026")} style={{
                  background: BRAND, border: "none", borderRadius: 9,
                  padding: "9px 18px", color: "#051015", fontWeight: 700,
                  fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}>🤖 Informe IA →</button>
              </div>

              {/* KPI grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
                <KPICard label="Socios activos" value="52" sub="Objetivo breakeven: 80" change={pct(CURRENT.socios, PREV.socios)} color={BRAND} icon="👥" />
                <KPICard label="Ingresos junio" value="11.200€" sub="Creciendo +28% vs mayo" change={pct(CURRENT.ingresos, PREV.ingresos)} color="#22c55e" icon="💰" />
                <KPICard label="Conversión leads" value="57%" sub="61 leads este mes" change={pct(CURRENT.conversion, PREV.conversion)} color="#a855f7" icon="🎯" />
                <KPICard label="Retención" value="91%" sub="2 bajas en junio" color="#eab308" icon="🔄" />
              </div>

              {/* Charts row 1 */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
                {/* Revenue vs Gastos */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "20px 20px 10px" }}>
                  <div style={{ color: "#9ca3af", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>Ingresos vs Gastos (€)</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={MONTHLY} barGap={4}>
                      <XAxis dataKey="month" tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${v/1000}k` : v} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="ingresos" name="Ingresos" fill={BRAND} radius={[4,4,0,0]} />
                      <Bar dataKey="gastos" name="Gastos" fill="rgba(239,68,68,0.5)" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Membership mix */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "20px" }}>
                  <div style={{ color: "#9ca3af", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>Mix membresías</div>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={MEMBERSHIP_MIX} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                        {MEMBERSHIP_MIX.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                    {MEMBERSHIP_MIX.map(m => (
                      <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: m.color }} />
                        <span style={{ color: "#6b7280", fontSize: 11 }}>{m.name} ({m.value})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Charts row 2 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Socios growth */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "20px 20px 10px" }}>
                  <div style={{ color: "#9ca3af", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>Crecimiento socios</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={MONTHLY}>
                      <defs>
                        <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={BRAND} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="socios" name="Socios" stroke={BRAND} fill="url(#grad1)" strokeWidth={2} dot={{ fill: BRAND, r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Retención */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "20px 20px 10px" }}>
                  <div style={{ color: "#9ca3af", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>Retención mensual (%)</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={RETENTION_DATA}>
                      <XAxis dataKey="month" tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[80, 100]} tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Line type="monotone" dataKey="retention" name="Retención" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ── SEMANAL ── */}
          {activeTab === "semanal" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                <div>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#f1f5f9" }}>Informe Semanal</h2>
                  <p style={{ color: "#4b5563", fontSize: 12, marginTop: 2 }}>Semana 1 Junio · 26/05 – 01/06/2026</p>
                </div>
                <button onClick={() => sendMessage("Genera el informe semanal completo de la semana 1 de junio con análisis y recomendaciones")} style={{
                  background: BRAND, border: "none", borderRadius: 9,
                  padding: "9px 18px", color: "#051015", fontWeight: 700,
                  fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}>🤖 Generar con IA →</button>
              </div>

              {/* Weekly KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
                {[
                  { label: "Nuevas altas", val: "9", change: "+80%", pos: true, icon: "📈", color: "#22c55e" },
                  { label: "Bajas", val: "0", change: "−1 vs s.ant.", pos: true, icon: "📉", color: BRAND },
                  { label: "Sesiones PT", val: "14", change: "+75% vs s.ant.", pos: true, icon: "💪", color: "#a855f7" },
                  { label: "Revenue semana", val: "3.200€", change: "+68% vs s.ant.", pos: true, icon: "💰", color: "#eab308" },
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
                    <div style={{ color: k.color, fontSize: 24, fontWeight: 800, fontFamily: "'Cormorant Garamond', serif" }}>{k.val}</div>
                    <div style={{
                      marginTop: 8, display: "inline-flex", alignItems: "center", gap: 4,
                      background: k.pos ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      border: `1px solid ${k.pos ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
                      borderRadius: 99, padding: "2px 8px",
                      color: k.pos ? "#22c55e" : "#ef4444", fontSize: 10, fontWeight: 700,
                    }}>{k.change}</div>
                  </div>
                ))}
              </div>

              {/* Weekly trend chart */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "20px 20px 10px", marginBottom: 16 }}>
                <div style={{ color: "#9ca3af", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>Altas vs Bajas semanales</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={WEEKLY} barGap={6}>
                    <XAxis dataKey="week" tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="altas" name="Altas" fill={BRAND} radius={[4,4,0,0]} />
                    <Bar dataKey="bajas" name="Bajas" fill="rgba(239,68,68,0.5)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* PT sessions trend */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "20px 20px 10px" }}>
                <div style={{ color: "#9ca3af", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>Sesiones Personal Training</div>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={WEEKLY}>
                    <defs>
                      <linearGradient id="ptGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="week" tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="ptSessions" name="Sesiones PT" stroke="#a855f7" fill="url(#ptGrad)" strokeWidth={2} dot={{ fill: "#a855f7", r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── MENSUAL ── */}
          {activeTab === "mensual" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                <div>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#f1f5f9" }}>Informe Mensual — Mayo 2026</h2>
                  <p style={{ color: "#4b5563", fontSize: 12, marginTop: 2 }}>Cierre definitivo · Comparativa con abril</p>
                </div>
                <button onClick={() => sendMessage("Genera el informe mensual completo de mayo 2026 con análisis de KPIs, tendencias y recomendaciones para junio")} style={{
                  background: BRAND, border: "none", borderRadius: 9,
                  padding: "9px 18px", color: "#051015", fontWeight: 700,
                  fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}>🤖 Informe completo IA →</button>
              </div>

              {/* Monthly KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 22 }}>
                <KPICard label="Socios al cierre" value="41" sub="+13 vs abril" change={pct(41,28)} color={BRAND} icon="👥" />
                <KPICard label="Ingresos mayo" value="8.750€" sub="Creciendo" change={pct(8750,5400)} color="#22c55e" icon="💰" />
                <KPICard label="Resultado mayo" value="−7.450€" sub="Ramp-up esperado" color="#f97316" icon="📊" />
                <KPICard label="Leads generados" value="52" sub="Tasa conversión 52%" change={pct(52,34)} color="#a855f7" icon="🎯" />
                <KPICard label="Retención" value="89%" sub="3 bajas en mayo" color="#eab308" icon="🔄" />
                <KPICard label="PT sessions/sem" value="8.5" sub="Promedio semanal mayo" color="#06b6d4" icon="💪" />
              </div>

              {/* Full evolution table */}
              <div style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14, overflow: "hidden", marginBottom: 16,
              }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", color: "#9ca3af", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  Evolución mensual completa
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["Mes","Socios","Altas","Bajas","Leads","Conv.%","Ingresos","Gastos","Resultado"].map(h => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "#374151", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid rgba(255,255,255,0.05)", fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MONTHLY.map((m, i) => {
                        const resultado = m.ingresos - m.gastos;
                        return (
                          <tr key={m.month} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                            <td style={{ padding: "10px 16px", color: "#f1f5f9", fontSize: 13, fontWeight: 700 }}>{m.month}</td>
                            <td style={{ padding: "10px 16px", color: BRAND, fontSize: 13, fontWeight: 700 }}>{m.socios}</td>
                            <td style={{ padding: "10px 16px", color: "#22c55e", fontSize: 13 }}>+{m.altas || m.socios}</td>
                            <td style={{ padding: "10px 16px", color: m.bajas > 0 ? "#ef4444" : "#4b5563", fontSize: 13 }}>{m.bajas}</td>
                            <td style={{ padding: "10px 16px", color: "#9ca3af", fontSize: 13 }}>{m.leads}</td>
                            <td style={{ padding: "10px 16px", color: "#a855f7", fontSize: 13 }}>{m.conversion}%</td>
                            <td style={{ padding: "10px 16px", color: "#22c55e", fontSize: 13 }}>{fmt(m.ingresos)}€</td>
                            <td style={{ padding: "10px 16px", color: "#ef4444", fontSize: 13 }}>{fmt(m.gastos)}€</td>
                            <td style={{ padding: "10px 16px", color: resultado >= 0 ? "#22c55e" : "#f97316", fontSize: 13, fontWeight: 700 }}>{resultado >= 0 ? "+" : ""}{fmt(resultado)}€</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── INFORME IA ── */}
          {activeTab === "informe" && (
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
                  "Informe ejecutivo junio 2026",
                  "¿Cuándo llegaremos al breakeven?",
                  "Análisis de retención y riesgo de bajas",
                  "Recomendaciones para acelerar altas",
                  "Resumen para enviar a María",
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
                    placeholder="KPIs, análisis, proyecciones, informes..."
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

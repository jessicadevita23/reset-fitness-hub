import { useState } from "react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell, Legend } from "recharts";

const BRAND = "#39D0D8";

// ── Datos base ────────────────────────────────────────────────────
const SOCIOS_FUNDADORES = {
  "Fund. 60€": 75, "Fund. 65€": 57, "Fund. 70€": 18, "c/Método 60€": 21
};
const TOTAL_FUND = 171;
const MRR_FUND_ACTUAL = 10725;

const PRICING = {
  base: 75,
  conMetodo: 95,
  fundPromedio: Math.round(MRR_FUND_ACTUAL / TOTAL_FUND * 100) / 100,
};

const MESES = ["Jun","Jul","Ago","Sep","Oct","Nov","Dic","Ene 27","Feb 27","Mar 27"];

function buildForecast({ nuevosMes, bajasMes, mixMetodo = 0.35 }) {
  let sociosFund = TOTAL_FUND;
  let sociosNuevos = 0;
  const rows = [];

  for (let i = 0; i < MESES.length; i++) {
    const bajasFund = Math.min(sociosFund, Math.round(bajasMes * 0.7));
    const bajasNuevos = Math.min(sociosNuevos, Math.round(bajasMes * 0.3));
    sociosFund = Math.max(0, sociosFund - bajasFund);
    sociosNuevos = Math.max(0, sociosNuevos - bajasNuevos) + nuevosMes;
    const total = sociosFund + sociosNuevos;

    const revFund = Math.round(sociosFund * PRICING.fundPromedio);
    const revNuevosBase = Math.round(sociosNuevos * (1 - mixMetodo) * PRICING.base);
    const revNuevosMetodo = Math.round(sociosNuevos * mixMetodo * PRICING.conMetodo);
    const revNuevos = revNuevosBase + revNuevosMetodo;
    const revTotal = revFund + revNuevos;
    const ticketMedio = total > 0 ? Math.round((revTotal / total) * 100) / 100 : 0;

    rows.push({
      mes: MESES[i],
      sociosFund: Math.round(sociosFund),
      sociosNuevos: Math.round(sociosNuevos),
      total: Math.round(total),
      revFund,
      revNuevosBase,
      revNuevosMetodo,
      revNuevos,
      revTotal,
      ticketMedio,
    });
  }
  return rows;
}

const ESCENARIOS = {
  conservador: { label: "Conservador", color: "#ef4444", nuevosMes: 8,  bajasMes: 5, mixMetodo: 0.25 },
  base:        { label: "Base",        color: BRAND,     nuevosMes: 15, bajasMes: 4, mixMetodo: 0.35 },
  optimista:   { label: "Optimista",   color: "#22c55e", nuevosMes: 25, bajasMes: 3, mixMetodo: 0.45 },
};

function fmt(n) { return Number(n||0).toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
function fmt2(n) { return Number(n||0).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function CT({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", fontFamily: "sans-serif", fontSize: 12 }}>
      <div style={{ color: "#9ca3af", marginBottom: 4, fontWeight: 700 }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ color: p.color || BRAND, fontWeight: 600 }}>{p.name}: {fmt(p.value)}€</div>)}
    </div>
  );
}

export default function RevenueForecast() {
  const [escenario, setEscenario] = useState("base");
  const [tab, setTab] = useState("forecast");
  const [mixMetodo, setMixMetodo] = useState(35);
  const [nuevosMes, setNuevosMes] = useState(15);

  const cfg = ESCENARIOS[escenario];
  const data = buildForecast({ ...cfg, mixMetodo: mixMetodo / 100, nuevosMes });

  const allData = Object.entries(ESCENARIOS).map(([key, c]) => ({
    key, ...c, data: buildForecast({ ...c })
  }));

  const TABS = [
    { id: "forecast",    label: "📈 Forecast MRR" },
    { id: "mix",         label: "🎯 Mix de socios" },
    { id: "escenarios",  label: "🔀 Escenarios" },
    { id: "tabla",       label: "📊 Tabla detalle" },
    { id: "pricing",     label: "💰 Pricing" },
  ];

  const currentMRR = MRR_FUND_ACTUAL;
  const mrrMar27 = data[data.length - 1].revTotal;
  const crecimiento = Math.round((mrrMar27 / currentMRR - 1) * 100);
  const ticketFinal = data[data.length - 1].ticketMedio;

  // Comparison chart data
  const compData = MESES.map((mes, i) => ({
    mes,
    conservador: allData[0].data[i]?.revTotal,
    base: allData[1].data[i]?.revTotal,
    optimista: allData[2].data[i]?.revTotal,
  }));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700;900&family=DM+Sans:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
        ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:rgba(57,208,216,0.2);border-radius:2px;}
        table{border-collapse:collapse;width:100%;}
        th{padding:8px 14px;text-align:left;color:#374151;font-size:10px;text-transform:uppercase;letter-spacing:0.07em;border-bottom:1px solid rgba(255,255,255,0.05);}
        td{padding:9px 14px;border-bottom:1px solid rgba(255,255,255,0.04);font-size:12px;color:#d1d5db;}
        tr:hover td{background:rgba(255,255,255,0.02);}
        input[type=range]{accent-color:#39D0D8;width:100%;height:4px;}
        input:focus{outline:none;}
      `}</style>

      <div style={{ minHeight: "100vh", background: "#060d14", color: "#f1f5f9", fontFamily: "'DM Sans',sans-serif" }}>

        {/* Header */}
        <div style={{ padding: "0 24px", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${BRAND},#1aa8af)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 900, color: "#051015", fontFamily: "serif" }}>R</div>
            <div>
              <div style={{ color: "#f1f5f9", fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700 }}>Reset Fitness Ibiza</div>
              <div style={{ color: "#374151", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em" }}>Revenue Forecast · Nuevo pricing desde Jun 2026</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 3 }}>
            {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "6px 12px", borderRadius: 7, background: tab === t.id ? "rgba(57,208,216,0.14)" : "transparent", border: `1px solid ${tab === t.id ? "rgba(57,208,216,0.3)" : "transparent"}`, color: tab === t.id ? BRAND : "#6b7280", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "sans-serif", whiteSpace: "nowrap" }}>{t.label}</button>)}
          </div>
        </div>

        <div style={{ padding: 24, height: "calc(100vh - 58px)", overflowY: "auto" }}>

          {/* ══ FORECAST MRR ══ */}
          {tab === "forecast" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>

              {/* Alerta apertura */}
              <div style={{ background: `linear-gradient(135deg, rgba(57,208,216,0.08), rgba(34,197,94,0.08))`, border: "1px solid rgba(57,208,216,0.25)", borderRadius: 14, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ fontSize: 32 }}>🚀</div>
                <div>
                  <div style={{ color: BRAND, fontWeight: 700, fontSize: 14, marginBottom: 3 }}>Apertura este viernes · Cierre fundadores mañana</div>
                  <div style={{ color: "#9ca3af", fontSize: 12 }}>A partir del viernes todos los nuevos socios entran a <strong style={{ color: "#f1f5f9" }}>75€/mes</strong> o <strong style={{ color: "#22c55e" }}>95€/mes con Método Reset</strong>. El ticket medio sube de 62,7€ → hasta 82€ con el mix estimado.</div>
                </div>
              </div>

              {/* KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 20 }}>
                {[
                  { label: "MRR actual", val: `${fmt(currentMRR)}€`, sub: "171 socios fundadores", color: "#6b7280" },
                  { label: "MRR Jun 2026", val: `${fmt(data[0].revTotal)}€`, sub: `${data[0].total} socios`, color: BRAND },
                  { label: "MRR Mar 2027", val: `${fmt(mrrMar27)}€`, sub: `${data[data.length - 1].total} socios`, color: "#22c55e" },
                  { label: "Crecimiento MRR", val: `+${crecimiento}%`, sub: "Jun 26 → Mar 27", color: "#a855f7" },
                  { label: "Ticket medio final", val: `${fmt2(ticketFinal)}€`, sub: `vs 62,7€ actual`, color: "#f97316" },
                ].map(k => (
                  <div key={k.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${k.color},transparent)` }} />
                    <div style={{ color: "#4b5563", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{k.label}</div>
                    <div style={{ color: k.color, fontSize: 16, fontWeight: 800, fontFamily: "'Fraunces',serif" }}>{k.val}</div>
                    <div style={{ color: "#374151", fontSize: 10, marginTop: 3 }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Escenario + ajustes */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {Object.entries(ESCENARIOS).map(([key, c]) => (
                    <button key={key} onClick={() => setEscenario(key)} style={{ padding: "6px 16px", borderRadius: 99, background: escenario === key ? `${c.color}18` : "rgba(255,255,255,0.04)", border: `1px solid ${escenario === key ? c.color + "50" : "rgba(255,255,255,0.08)"}`, color: escenario === key ? c.color : "#6b7280", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "sans-serif" }}>{c.label}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 20, alignItems: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 16px" }}>
                  <div>
                    <div style={{ color: "#6b7280", fontSize: 10, marginBottom:4 }}>Nuevos socios/mes: <span style={{ color: BRAND, fontWeight: 700 }}>{nuevosMes}</span></div>
                    <input type="range" min={3} max={50} value={nuevosMes} onChange={e => setNuevosMes(Number(e.target.value))} style={{ width: 120 }}/>
                  </div>
                  <div>
                    <div style={{ color: "#6b7280", fontSize: 10, marginBottom:4 }}>% con Método Reset: <span style={{ color: "#22c55e", fontWeight: 700 }}>{mixMetodo}%</span></div>
                    <input type="range" min={0} max={80} value={mixMetodo} onChange={e => setMixMetodo(Number(e.target.value))} style={{ width: 120 }}/>
                  </div>
                </div>
              </div>

              {/* MRR chart */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 18px 8px", marginBottom: 14 }}>
                <div style={{ color: "#9ca3af", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>MRR proyectado — Fundadores vs Nuevos socios (€)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="gFund" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6b7280" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6b7280" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gNuevos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={BRAND} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={BRAND} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="mes" tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`}/>
                    <Tooltip content={<CT/>}/>
                    <Area type="monotone" dataKey="revFund" name="Rev. Fundadores" stroke="#6b7280" fill="url(#gFund)" strokeWidth={2} stackId="1"/>
                    <Area type="monotone" dataKey="revNuevos" name="Rev. Nuevos socios" stroke={BRAND} fill="url(#gNuevos)" strokeWidth={2} stackId="1"/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Ticket medio */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 18px 8px" }}>
                <div style={{ color: "#9ca3af", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Ticket medio por socio (€) — sube conforme entran socios al nuevo precio</div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={data}>
                    <XAxis dataKey="mes" tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} domain={[60, 85]}/>
                    <Tooltip formatter={v => [`${v}€`, "Ticket medio"]}/>
                    <ReferenceLine y={75} stroke="#eab308" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: "75€ base", fill: "#eab308", fontSize: 10 }}/>
                    <ReferenceLine y={82} stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: "82€ mix", fill: "#22c55e", fontSize: 10 }}/>
                    <Line type="monotone" dataKey="ticketMedio" name="Ticket medio" stroke="#f97316" strokeWidth={2} dot={{ fill: "#f97316", r: 4 }}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ══ MIX ══ */}
          {tab === "mix" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <div style={{ marginBottom: 18 }}>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, color: "#f1f5f9", marginBottom: 4 }}>Mix de socios y evolución</h2>
                <p style={{ color: "#4b5563", fontSize: 12 }}>Cómo evoluciona la base de socios entre fundadores y nuevos tarifas</p>
              </div>

              {/* Socios chart */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 18px 8px", marginBottom: 14 }}>
                <div style={{ color: "#9ca3af", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Evolución base de socios</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data}>
                    <XAxis dataKey="mes" tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false}/>
                    <Tooltip content={<CT/>}/>
                    <Bar dataKey="sociosFund" name="Fundadores" fill="#6b7280" stackId="a" radius={[0,0,0,0]}/>
                    <Bar dataKey="sociosNuevos" name="Nuevos (75/95€)" fill={BRAND} stackId="a" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Estado actual fundadores */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "18px 20px" }}>
                  <div style={{ color: "#9ca3af", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Socios fundadores actuales</div>
                  {Object.entries(SOCIOS_FUNDADORES).map(([plan, n]) => {
                    const precio = plan.includes("70") ? 70 : plan.includes("65") ? 65 : 60;
                    return (
                      <div key={plan} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 12 }}>
                        <div>
                          <div style={{ color: "#f1f5f9", fontWeight: 600 }}>{plan}</div>
                          <div style={{ color: "#4b5563", fontSize: 10 }}>vs nuevo precio: {precio < 75 ? `+${75-precio}€` : "igual"}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ color: BRAND, fontWeight: 700 }}>{n} socios</div>
                          <div style={{ color: "#6b7280", fontSize: 10 }}>{n * precio}€/mes</div>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontSize: 13 }}>
                    <span style={{ color: "#f1f5f9", fontWeight: 700 }}>TOTAL</span>
                    <span style={{ color: BRAND, fontWeight: 700 }}>{TOTAL_FUND} socios · {fmt(MRR_FUND_ACTUAL)}€/mes</span>
                  </div>
                </div>

                <div style={{ background: "rgba(57,208,216,0.05)", border: "1px solid rgba(57,208,216,0.2)", borderRadius: 12, padding: "18px 20px" }}>
                  <div style={{ color: BRAND, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Nuevo pricing (desde viernes)</div>
                  {[
                    { plan: "Cuota base", precio: 75, desc: "Acceso completo al gimnasio" },
                    { plan: "Con Método Reset", precio: 95, desc: "Base + programa personalizado" },
                    { plan: "Ticket medio estimado", precio: 82, desc: "Asumiendo 35% elige Método" },
                  ].map(p => (
                    <div key={p.plan} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 12 }}>
                      <div>
                        <div style={{ color: "#f1f5f9", fontWeight: 600 }}>{p.plan}</div>
                        <div style={{ color: "#4b5563", fontSize: 10 }}>{p.desc}</div>
                      </div>
                      <div style={{ color: "#22c55e", fontWeight: 800, fontSize: 16, fontFamily: "'Fraunces',serif" }}>{p.precio}€</div>
                    </div>
                  ))}
                  <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, color: "#22c55e", fontSize: 11, lineHeight: 1.5 }}>
                    💡 Con 100 nuevos socios al precio nuevo → +8.200€/mes adicionales vs los 6.271€ que generarían al precio fundador
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ ESCENARIOS ══ */}
          {tab === "escenarios" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <div style={{ marginBottom: 18 }}>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, color: "#f1f5f9", marginBottom: 4 }}>Comparativa de escenarios</h2>
                <p style={{ color: "#4b5563", fontSize: 12 }}>Conservador (+8/mes) · Base (+15/mes) · Optimista (+25/mes)</p>
              </div>

              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 18px 8px", marginBottom: 14 }}>
                <div style={{ color: "#9ca3af", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>MRR proyectado por escenario (€)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={compData}>
                    <XAxis dataKey="mes" tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`}/>
                    <Tooltip content={<CT/>}/>
                    <ReferenceLine y={12000} stroke="#eab308" strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: "Breakeven ~12k€", fill: "#eab308", fontSize: 10 }}/>
                    <Line type="monotone" dataKey="conservador" name="Conservador" stroke="#ef4444" strokeWidth={2} dot={false}/>
                    <Line type="monotone" dataKey="base" name="Base" stroke={BRAND} strokeWidth={2} dot={false}/>
                    <Line type="monotone" dataKey="optimista" name="Optimista" stroke="#22c55e" strokeWidth={2} dot={false}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {allData.map(esc => {
                  const last = esc.data[esc.data.length - 1];
                  const first = esc.data[0];
                  const crec = Math.round((last.revTotal / MRR_FUND_ACTUAL - 1) * 100);
                  return (
                    <div key={esc.key} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${esc.color}30`, borderRadius: 14, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${esc.color},transparent)` }}/>
                      <div style={{ color: esc.color, fontWeight: 800, fontSize: 16, marginBottom: 4, fontFamily: "'Fraunces',serif" }}>{esc.label}</div>
                      <div style={{ color: "#4b5563", fontSize: 11, marginBottom: 14 }}>+{esc.nuevosMes} socios/mes · {Math.round(esc.mixMetodo * 100)}% con Método</div>
                      {[
                        ["MRR Jun 2026", `${fmt(first.revTotal)}€`, BRAND],
                        ["MRR Mar 2027", `${fmt(last.revTotal)}€`, "#22c55e"],
                        ["Crecimiento", `+${crec}%`, esc.color],
                        ["Socios Mar 27", `${last.total}`, "#a855f7"],
                        ["Ticket medio", `${fmt2(last.ticketMedio)}€`, "#f97316"],
                      ].map(([l, v, c]) => (
                        <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 12 }}>
                          <span style={{ color: "#6b7280" }}>{l}</span>
                          <span style={{ color: c, fontWeight: 700 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ TABLA ══ */}
          {tab === "tabla" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, color: "#f1f5f9", marginBottom: 4 }}>Tabla detallada — Escenario {cfg.label}</h2>
                  <p style={{ color: "#4b5563", fontSize: 12 }}>Desglose completo de revenue por tipo de socio</p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {Object.entries(ESCENARIOS).map(([key, c]) => (
                    <button key={key} onClick={() => setEscenario(key)} style={{ padding: "5px 12px", borderRadius: 99, background: escenario === key ? `${c.color}18` : "rgba(255,255,255,0.04)", border: `1px solid ${escenario === key ? c.color + "50" : "rgba(255,255,255,0.08)"}`, color: escenario === key ? c.color : "#6b7280", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "sans-serif" }}>{c.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Mes</th>
                      <th>Socios Fund.</th>
                      <th>Socios Nuevos</th>
                      <th>Total</th>
                      <th>Rev. Fundadores</th>
                      <th>Rev. Base 75€</th>
                      <th>Rev. Método 95€</th>
                      <th>MRR Total</th>
                      <th>Ticket medio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((r, i) => (
                      <tr key={i}>
                        <td style={{ color: "#f1f5f9", fontWeight: 700 }}>{r.mes}</td>
                        <td style={{ color: "#6b7280" }}>{r.sociosFund}</td>
                        <td style={{ color: BRAND }}>{r.sociosNuevos}</td>
                        <td style={{ color: "#f1f5f9", fontWeight: 600 }}>{r.total}</td>
                        <td style={{ color: "#6b7280" }}>{fmt(r.revFund)}€</td>
                        <td style={{ color: BRAND }}>{fmt(r.revNuevosBase)}€</td>
                        <td style={{ color: "#22c55e", fontWeight: 600 }}>{fmt(r.revNuevosMetodo)}€</td>
                        <td style={{ color: "#f1f5f9", fontWeight: 700 }}>{fmt(r.revTotal)}€</td>
                        <td style={{ color: "#f97316", fontWeight: 600 }}>{fmt2(r.ticketMedio)}€</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ PRICING ══ */}
          {tab === "pricing" && (
            <div style={{ animation: "fadeUp 0.3s ease", maxWidth: 700 }}>
              <div style={{ marginBottom: 18 }}>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, color: "#f1f5f9", marginBottom: 4 }}>Análisis de pricing</h2>
                <p style={{ color: "#4b5563", fontSize: 12 }}>Comparativa fundadores vs nuevo pricing y impacto en revenue</p>
              </div>

              {/* Comparativa precios */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "20px 24px", marginBottom: 14 }}>
                <div style={{ color: "#9ca3af", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>Estructura de precios</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Fundadores (cierra mañana)</div>
                    {[
                      { plan: "Fundador 60€", n: 75, mrr: 4500 },
                      { plan: "Fundador 65€", n: 57, mrr: 3705 },
                      { plan: "Fundador 70€", n: 18, mrr: 1260 },
                      { plan: "c/Método 60€", n: 21, mrr: 1260 },
                    ].map(p => (
                      <div key={p.plan} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                        <span style={{ color: "#9ca3af" }}>{p.plan} ({p.n})</span>
                        <span style={{ color: "#6b7280", fontWeight: 600 }}>{fmt(p.mrr)}€/mes</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontSize: 13 }}>
                      <span style={{ color: "#f1f5f9", fontWeight: 700 }}>Total (171 socios)</span>
                      <span style={{ color: "#6b7280", fontWeight: 700 }}>{fmt(MRR_FUND_ACTUAL)}€/mes</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ color: BRAND, fontSize: 11, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nuevo pricing (desde viernes)</div>
                    {[
                      { plan: "Cuota base", precio: 75, desc: "Solo gimnasio" },
                      { plan: "+Método Reset", precio: 20, desc: "Adicional al mes" },
                      { plan: "Total con Método", precio: 95, desc: "Precio completo" },
                    ].map(p => (
                      <div key={p.plan} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                        <div>
                          <div style={{ color: "#f1f5f9", fontWeight: 600 }}>{p.plan}</div>
                          <div style={{ color: "#4b5563", fontSize: 10 }}>{p.desc}</div>
                        </div>
                        <span style={{ color: "#22c55e", fontWeight: 700, fontSize: 15 }}>{p.precio}€</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(57,208,216,0.07)", border: "1px solid rgba(57,208,216,0.2)", borderRadius: 8, fontSize: 11, color: "#9ca3af", lineHeight: 1.5 }}>
                      100 nuevos socios · 65% base + 35% Método<br/>
                      = <strong style={{ color: BRAND }}>65 × 75€ + 35 × 95€ = 8.200€/mes</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Impacto subida de precio fundadores */}
              <div style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ color: "#eab308", fontWeight: 700, fontSize: 13, marginBottom: 12 }}>⚠️ Riesgo: churn de fundadores al nuevo precio</div>
                <div style={{ color: "#9ca3af", fontSize: 12, lineHeight: 1.7, marginBottom: 14 }}>
                  Los socios fundadores que pagaban 60€ verán una subida de <strong style={{ color: "#f1f5f9" }}>+15€/mes (+25%)</strong> cuando renueven al nuevo precio. Esto puede generar bajas.
                </div>
                {[
                  ["Si se van 0 fundadores", `${fmt(MRR_FUND_ACTUAL)}€ MRR base conservado`, "#22c55e"],
                  ["Si se van 20 fundadores", `~${fmt(MRR_FUND_ACTUAL - 20*62)}€ (-${fmt(20*62)}€)`, "#eab308"],
                  ["Si se van 50 fundadores", `~${fmt(MRR_FUND_ACTUAL - 50*62)}€ (-${fmt(50*62)}€)`, "#f97316"],
                  ["Compensación: cada 1 baja fund. necesita", "~0.75 socios nuevos a 82€", BRAND],
                ].map(([l, v, c]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 12 }}>
                    <span style={{ color: "#6b7280" }}>{l}</span>
                    <span style={{ color: c, fontWeight: 700 }}>{v}</span>
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

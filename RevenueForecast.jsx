import { useState } from "react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";

const BRAND = "#39D0D8";

// ── Datos reales TGManager — 08/06/2026 ──────────────────────────
const SOCIOS_FUNDADORES = {
  "Fund. 70€":  { count: 71, precio: 70 },
  "Fund. 65€":  { count: 52, precio: 65 },
  "Fund. 60€":  { count:  8, precio: 60 },
  "c/Método 60€": { count: 3, precio: 60 },
};
const SOCIOS_NUEVOS_ACTIVOS = {
  "Gimnasio 75€":   { count: 39, precio: 75 },
  "Método Reset 95€": { count: 8, precio: 95 },
  "Adicional Método": { count: 6, precio: 20 },
  "Plan 3 meses":   { count: 4, precio: 70 },   // 210/3
  "Plan 6 meses":   { count: 1, precio: 65 },   // 390/6
  "Semana":         { count: 1, precio: 45 },
  "Day Pass":       { count: 2, precio: 16 },
};

const TOTAL_FUND = 71 + 52 + 8 + 3;          // 134
const MRR_FUND   = 71*70 + 52*65 + 8*60 + 3*60; // 4970+3380+480+180 = 9010
const TOTAL_NUEVOS = 39 + 8 + 6 + 4 + 1 + 1 + 2; // 61
const MRR_NUEVOS = 39*75 + 8*95 + 6*20 + 4*70 + 1*65 + 1*45 + 2*16; // 2925+760+120+280+65+45+32 = 4227
const TOTAL_SOCIOS = TOTAL_FUND + TOTAL_NUEVOS; // 195
const MRR_TOTAL  = MRR_FUND + MRR_NUEVOS;      // 13237
const TICKET_MEDIO = Math.round((MRR_TOTAL / TOTAL_SOCIOS) * 100) / 100; // 67.88

const PRICING = { base: 75, conMetodo: 95 };
const MESES = ["Jun","Jul","Ago","Sep","Oct","Nov","Dic","Ene 27","Feb 27","Mar 27"];

// Gastos fijos reales (desde extracto bancario + contratos)
const GASTOS_FIJOS = {
  fitMaker:   4305.55,  // desde agosto
  interesDetlef: 875,
  seguro:     651.56,
  prosegur:   65.17,
  prestamo_me: 493,    // desde septiembre
};
const GASTOS_PERSONAL_REAL = 5880;
const GASTOS_BASE_SIN_FITMAKER = GASTOS_PERSONAL_REAL + GASTOS_FIJOS.interesDetlef + GASTOS_FIJOS.seguro + GASTOS_FIJOS.prosegur;
const GASTOS_DESDE_AGO = GASTOS_BASE_SIN_FITMAKER + GASTOS_FIJOS.fitMaker;
const GASTOS_DESDE_SEP = GASTOS_DESDE_AGO + GASTOS_FIJOS.prestamo_me;

function getGastos(mesIdx) {
  if (mesIdx < 2) return GASTOS_BASE_SIN_FITMAKER;       // Jun, Jul
  if (mesIdx < 3) return GASTOS_DESDE_AGO;               // Ago
  return GASTOS_DESDE_SEP;                               // Sep+
}

function buildForecast({ nuevosMes, bajasMes, mixMetodo = 0.35 }) {
  let sociosFund = TOTAL_FUND;
  let sociosNuevos = TOTAL_NUEVOS; // arrancamos con los que ya hay
  const rows = [];

  for (let i = 0; i < MESES.length; i++) {
    const bajasFund = Math.min(sociosFund, Math.round(bajasMes * 0.6));
    const bajasNuevos = Math.min(sociosNuevos, Math.round(bajasMes * 0.4));
    sociosFund = Math.max(0, sociosFund - bajasFund);
    sociosNuevos = Math.max(0, sociosNuevos - bajasNuevos) + nuevosMes;
    const total = sociosFund + sociosNuevos;

    const revFund = Math.round(sociosFund * (MRR_FUND / TOTAL_FUND));
    const revNuevosBase = Math.round(sociosNuevos * (1 - mixMetodo) * PRICING.base);
    const revNuevosMetodo = Math.round(sociosNuevos * mixMetodo * PRICING.conMetodo);
    const revNuevos = revNuevosBase + revNuevosMetodo;
    const revTotal = revFund + revNuevos;
    const gastos = getGastos(i);
    const margen = revTotal - gastos;
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
      gastos,
      margen,
      ticketMedio,
    });
  }
  return rows;
}

const ESCENARIOS = {
  conservador: { label: "Conservador", color: "#ef4444", nuevosMes: 10, bajasMes: 6, mixMetodo: 0.25 },
  base:        { label: "Base",        color: BRAND,     nuevosMes: 20, bajasMes: 4, mixMetodo: 0.35 },
  optimista:   { label: "Optimista",   color: "#22c55e", nuevosMes: 35, bajasMes: 3, mixMetodo: 0.45 },
};

// Breakeven real
const BREAKEVEN_MRR = GASTOS_DESDE_SEP; // ~12270

function fmt(n)  { return Number(n||0).toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
function fmt2(n) { return Number(n||0).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function CT({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", fontFamily: "sans-serif", fontSize: 12 }}>
      <div style={{ color: "#9ca3af", marginBottom: 4, fontWeight: 700 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color || BRAND, fontWeight: 600 }}>
          {p.name}: {typeof p.value === "number" && p.name.toLowerCase().includes("ticket") ? `${fmt2(p.value)}€` : `${fmt(p.value)}€`}
        </div>
      ))}
    </div>
  );
}

export default function RevenueForecast() {
  const [escenario, setEscenario] = useState("base");
  const [tab, setTab] = useState("forecast");
  const [mixMetodo, setMixMetodo] = useState(35);
  const [nuevosMes, setNuevosMes] = useState(20);

  const cfg = ESCENARIOS[escenario];
  const data = buildForecast({ ...cfg, mixMetodo: mixMetodo / 100, nuevosMes });

  const allData = Object.entries(ESCENARIOS).map(([key, c]) => ({
    key, ...c, data: buildForecast({ ...c })
  }));

  const TABS = [
    { id: "forecast",   label: "📈 Forecast MRR" },
    { id: "mix",        label: "🎯 Socios actuales" },
    { id: "margen",     label: "💰 Margen real" },
    { id: "escenarios", label: "🔀 Escenarios" },
    { id: "tabla",      label: "📊 Tabla" },
  ];

  const mrrMar27 = data[data.length - 1].revTotal;
  const crecimiento = Math.round((mrrMar27 / MRR_TOTAL - 1) * 100);
  const ticketFinal = data[data.length - 1].ticketMedio;

  const compData = MESES.map((mes, i) => ({
    mes,
    conservador: allData[0].data[i]?.revTotal,
    base:        allData[1].data[i]?.revTotal,
    optimista:   allData[2].data[i]?.revTotal,
    gastos:      getGastos(i),
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
              <div style={{ color: "#374151", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em" }}>Revenue Forecast · Datos reales TGManager · 08/06/2026</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "6px 12px", borderRadius: 7, background: tab === t.id ? "rgba(57,208,216,0.14)" : "transparent", border: `1px solid ${tab === t.id ? "rgba(57,208,216,0.3)" : "transparent"}`, color: tab === t.id ? BRAND : "#6b7280", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "sans-serif", whiteSpace: "nowrap" }}>{t.label}</button>
            ))}
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
                  <div style={{ color: BRAND, fontWeight: 700, fontSize: 14, marginBottom: 3 }}>Abiertos desde el 05/06/2026 · 195 socios activos en 3 días</div>
                  <div style={{ color: "#9ca3af", fontSize: 12 }}>MRR real hoy: <strong style={{ color: "#f1f5f9" }}>13.237€</strong> · 134 fundadores + 61 nuevos. Breakeven de gastos fijos: <strong style={{ color: "#22c55e" }}>~12.270€/mes desde sep</strong> — ya superado.</div>
                </div>
              </div>

              {/* KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 20 }}>
                {[
                  { label: "MRR real hoy",       val: `${fmt(MRR_TOTAL)}€`,    sub: `${TOTAL_SOCIOS} socios · 08/06`,  color: BRAND },
                  { label: "Fundadores",          val: `${fmt(MRR_FUND)}€`,     sub: `${TOTAL_FUND} socios · 67,4€ avg`, color: "#6b7280" },
                  { label: "Nuevos (75/95€)",     val: `${fmt(MRR_NUEVOS)}€`,   sub: `${TOTAL_NUEVOS} socios · mix real`, color: "#22c55e" },
                  { label: "MRR Mar 2027",        val: `${fmt(mrrMar27)}€`,     sub: `${data[data.length-1].total} socios`, color: "#a855f7" },
                  { label: "Ticket medio actual", val: `${fmt2(TICKET_MEDIO)}€`, sub: "vs 62,7€ estimado previo",         color: "#f97316" },
                ].map(k => (
                  <div key={k.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${k.color},transparent)` }} />
                    <div style={{ color: "#4b5563", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{k.label}</div>
                    <div style={{ color: k.color, fontSize: 16, fontWeight: 800, fontFamily: "'Fraunces',serif" }}>{k.val}</div>
                    <div style={{ color: "#374151", fontSize: 10, marginTop: 3 }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Controles */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {Object.entries(ESCENARIOS).map(([key, c]) => (
                    <button key={key} onClick={() => setEscenario(key)} style={{ padding: "6px 16px", borderRadius: 99, background: escenario === key ? `${c.color}18` : "rgba(255,255,255,0.04)", border: `1px solid ${escenario === key ? c.color + "50" : "rgba(255,255,255,0.08)"}`, color: escenario === key ? c.color : "#6b7280", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "sans-serif" }}>{c.label}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 20, alignItems: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 16px" }}>
                  <div>
                    <div style={{ color: "#6b7280", fontSize: 10, marginBottom: 4 }}>Nuevos socios/mes: <span style={{ color: BRAND, fontWeight: 700 }}>{nuevosMes}</span></div>
                    <input type="range" min={3} max={60} value={nuevosMes} onChange={e => setNuevosMes(Number(e.target.value))} style={{ width: 120 }} />
                  </div>
                  <div>
                    <div style={{ color: "#6b7280", fontSize: 10, marginBottom: 4 }}>% con Método Reset: <span style={{ color: "#22c55e", fontWeight: 700 }}>{mixMetodo}%</span></div>
                    <input type="range" min={0} max={80} value={mixMetodo} onChange={e => setMixMetodo(Number(e.target.value))} style={{ width: 120 }} />
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
                        <stop offset="5%" stopColor="#6b7280" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gNuevos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={BRAND} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="mes" tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CT />} />
                    <ReferenceLine y={BREAKEVEN_MRR} stroke="#eab308" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: `Breakeven ${fmt(BREAKEVEN_MRR)}€`, fill: "#eab308", fontSize: 10 }} />
                    <Area type="monotone" dataKey="revFund"   name="Rev. Fundadores"    stroke="#6b7280" fill="url(#gFund)"   strokeWidth={2} stackId="1" />
                    <Area type="monotone" dataKey="revNuevos" name="Rev. Nuevos socios" stroke={BRAND}   fill="url(#gNuevos)" strokeWidth={2} stackId="1" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Ticket medio */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 18px 8px" }}>
                <div style={{ color: "#9ca3af", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Ticket medio por socio (€)</div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={data}>
                    <XAxis dataKey="mes" tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} domain={[65, 90]} />
                    <Tooltip formatter={v => [`${v}€`, "Ticket medio"]} />
                    <ReferenceLine y={75} stroke="#eab308" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: "75€ base", fill: "#eab308", fontSize: 10 }} />
                    <ReferenceLine y={TICKET_MEDIO} stroke="#6b7280" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: `${fmt2(TICKET_MEDIO)}€ hoy`, fill: "#6b7280", fontSize: 10 }} />
                    <Line type="monotone" dataKey="ticketMedio" name="Ticket medio" stroke="#f97316" strokeWidth={2} dot={{ fill: "#f97316", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ══ SOCIOS ACTUALES ══ */}
          {tab === "mix" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <div style={{ marginBottom: 18 }}>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, color: "#f1f5f9", marginBottom: 4 }}>Socios actuales — Datos reales TGManager</h2>
                <p style={{ color: "#4b5563", fontSize: 12 }}>195 socios activos · Importado 08/06/2026</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                {/* Fundadores */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "18px 20px" }}>
                  <div style={{ color: "#9ca3af", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Socios fundadores — {TOTAL_FUND} socios</div>
                  {[
                    { plan: "Socio Fundador 70€", count: 71, mrr: 4970 },
                    { plan: "Socio Fundador 65€", count: 52, mrr: 3380 },
                    { plan: "Socio Fundador 60€", count:  8, mrr:  480 },
                    { plan: "c/Método Reset 60€", count:  3, mrr:  180 },
                  ].map(p => (
                    <div key={p.plan} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 12 }}>
                      <div>
                        <div style={{ color: "#f1f5f9", fontWeight: 600 }}>{p.plan}</div>
                        <div style={{ color: "#4b5563", fontSize: 10 }}>ticket vs nuevo: {p.plan.includes("70") ? "−5€" : p.plan.includes("65") ? "−10€" : "−15€"}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "#9ca3af", fontWeight: 700 }}>{p.count} socios</div>
                        <div style={{ color: "#6b7280", fontSize: 10 }}>{fmt(p.mrr)}€/mes</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontSize: 13 }}>
                    <span style={{ color: "#f1f5f9", fontWeight: 700 }}>TOTAL</span>
                    <span style={{ color: "#9ca3af", fontWeight: 700 }}>{fmt(MRR_FUND)}€/mes</span>
                  </div>
                </div>

                {/* Nuevos */}
                <div style={{ background: "rgba(57,208,216,0.04)", border: "1px solid rgba(57,208,216,0.2)", borderRadius: 12, padding: "18px 20px" }}>
                  <div style={{ color: BRAND, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Nuevos socios desde apertura — {TOTAL_NUEVOS} socios</div>
                  {[
                    { plan: "Gimnasio 75€",      count: 39, mrr: 2925, color: BRAND },
                    { plan: "Método Reset 95€",  count:  8, mrr:  760, color: "#22c55e" },
                    { plan: "Adicional Método",  count:  6, mrr:  120, color: "#22c55e" },
                    { plan: "Plan 3 meses 210€", count:  4, mrr:  280, color: "#a855f7" },
                    { plan: "Plan 6 meses 390€", count:  1, mrr:   65, color: "#a855f7" },
                    { plan: "Semana / Day Pass", count:  3, mrr:   77, color: "#6b7280" },
                  ].map(p => (
                    <div key={p.plan} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 12 }}>
                      <div style={{ color: "#f1f5f9", fontWeight: 600 }}>{p.plan}</div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: p.color, fontWeight: 700 }}>{p.count} socios</div>
                        <div style={{ color: "#6b7280", fontSize: 10 }}>{fmt(p.mrr)}€/mes</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontSize: 13 }}>
                    <span style={{ color: "#f1f5f9", fontWeight: 700 }}>TOTAL</span>
                    <span style={{ color: BRAND, fontWeight: 700 }}>{fmt(MRR_NUEVOS)}€/mes</span>
                  </div>
                </div>
              </div>

              {/* Barchart mix */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 18px 8px" }}>
                <div style={{ color: "#9ca3af", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Evolución base de socios proyectada</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={buildForecast({ ...ESCENARIOS.base })}>
                    <XAxis dataKey="mes" tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CT />} />
                    <Bar dataKey="sociosFund"   name="Fundadores"        fill="#6b7280" stackId="a" />
                    <Bar dataKey="sociosNuevos" name="Nuevos (75/95€)"   fill={BRAND}   stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ══ MARGEN REAL ══ */}
          {tab === "margen" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <div style={{ marginBottom: 18 }}>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, color: "#f1f5f9", marginBottom: 4 }}>Margen real — Ingresos vs Gastos comprometidos</h2>
                <p style={{ color: "#4b5563", fontSize: 12 }}>Gastos reales extraídos del extracto bancario y contratos firmados</p>
              </div>

              {/* Gastos breakdown */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div style={{ background: "rgba(255,90,90,0.05)", border: "1px solid rgba(255,90,90,0.15)", borderRadius: 12, padding: "18px 20px" }}>
                  <div style={{ color: "#ef4444", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Gastos fijos mensuales comprometidos</div>
                  {[
                    { label: "Personal real (Alesia+Daniela+Jehison+Jessica)", val: 5880, nota: "incl. 1.000€ negro Daniela", desde: "Jun" },
                    { label: "Fit-Maker cuota maquinaria (SEPA B2B)",          val: 4305.55, nota: "41 cuotas · riesgo retirada", desde: "Ago" },
                    { label: "Intereses Detlef (350k al 3%)",                  val: 875,    nota: "solo intereses, carencia pptal", desde: "Jun" },
                    { label: "Seguro Occident",                                val: 651.56, nota: "póliza domiciliada",             desde: "Jun" },
                    { label: "Prosegur alarma",                                val: 65.17,  nota: "contrato 1-1-50000484122",       desde: "Jun" },
                    { label: "Préstamo M. Elena Paganini (17k, 3%)",           val: 493,    nota: "sistema francés, 38 meses",      desde: "Sep" },
                  ].map(g => (
                    <div key={g.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                      <div>
                        <div style={{ color: "#d1d5db" }}>{g.label}</div>
                        <div style={{ color: "#4b5563", fontSize: 10 }}>{g.nota} · desde {g.desde}</div>
                      </div>
                      <span style={{ color: "#ef4444", fontWeight: 700, whiteSpace: "nowrap", marginLeft: 12 }}>{fmt2(g.val)}€</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontSize: 13, fontWeight: 700 }}>
                    <span style={{ color: "#f1f5f9" }}>TOTAL desde Sep 2026</span>
                    <span style={{ color: "#ef4444" }}>{fmt2(GASTOS_DESDE_SEP)}€/mes</span>
                  </div>
                </div>

                <div style={{ background: "rgba(57,208,216,0.04)", border: "1px solid rgba(57,208,216,0.2)", borderRadius: 12, padding: "18px 20px" }}>
                  <div style={{ color: BRAND, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>MRR real vs breakeven</div>
                  {[
                    { label: "MRR hoy (08/06)",          val: fmt(MRR_TOTAL),               color: BRAND,      check: "✅" },
                    { label: "Gastos base (Jun-Jul)",     val: `${fmt(GASTOS_BASE_SIN_FITMAKER)}€/mes`, color: "#ef4444", check: "" },
                    { label: "Margen Jun-Jul estimado",   val: `+${fmt(MRR_TOTAL - GASTOS_BASE_SIN_FITMAKER)}€`, color: "#22c55e", check: "✅" },
                    { label: "Gastos desde Ago (+Fit-Maker)", val: `${fmt(GASTOS_DESDE_AGO)}€/mes`, color: "#ef4444", check: "" },
                    { label: "Gastos desde Sep (completo)",  val: `${fmt(GASTOS_DESDE_SEP)}€/mes`, color: "#ef4444", check: "" },
                    { label: "Gap con MRR actual (sep+)",    val: `+${fmt(MRR_TOTAL - GASTOS_DESDE_SEP)}€`, color: "#22c55e", check: "✅" },
                  ].map(r => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 12 }}>
                      <span style={{ color: "#9ca3af" }}>{r.check} {r.label}</span>
                      <span style={{ color: r.color, fontWeight: 700 }}>{r.val}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 14, padding: "12px 14px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, color: "#22c55e", fontSize: 12, lineHeight: 1.6 }}>
                    ✅ Con el MRR actual el negocio ya cubre todos los gastos fijos desde septiembre. Cada socio nuevo es margen.
                  </div>
                </div>
              </div>

              {/* Margen chart */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 18px 8px" }}>
                <div style={{ color: "#9ca3af", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Ingresos vs Gastos proyectados (escenario base)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={buildForecast({ ...ESCENARIOS.base })}>
                    <defs>
                      <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={BRAND} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gGastos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="mes" tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CT />} />
                    <Area type="monotone" dataKey="gastos"   name="Gastos fijos" stroke="#ef4444" fill="url(#gGastos)" strokeWidth={2} strokeDasharray="5 3" />
                    <Area type="monotone" dataKey="revTotal" name="MRR"          stroke={BRAND}   fill="url(#gRev)"    strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ══ ESCENARIOS ══ */}
          {tab === "escenarios" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <div style={{ marginBottom: 18 }}>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, color: "#f1f5f9", marginBottom: 4 }}>Comparativa de escenarios</h2>
                <p style={{ color: "#4b5563", fontSize: 12 }}>Conservador (+10/mes) · Base (+20/mes) · Optimista (+35/mes)</p>
              </div>

              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 18px 8px", marginBottom: 14 }}>
                <div style={{ color: "#9ca3af", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>MRR proyectado por escenario (€)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={compData}>
                    <XAxis dataKey="mes" tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CT />} />
                    <ReferenceLine y={BREAKEVEN_MRR} stroke="#eab308" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: `Breakeven ${fmt(BREAKEVEN_MRR)}€`, fill: "#eab308", fontSize: 10 }} />
                    <Line type="monotone" dataKey="conservador" name="Conservador" stroke="#ef4444" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="base"        name="Base"        stroke={BRAND}   strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="optimista"   name="Optimista"   stroke="#22c55e" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {allData.map(esc => {
                  const last = esc.data[esc.data.length - 1];
                  const crec = Math.round((last.revTotal / MRR_TOTAL - 1) * 100);
                  const margenFinal = last.revTotal - GASTOS_DESDE_SEP;
                  return (
                    <div key={esc.key} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${esc.color}30`, borderRadius: 14, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${esc.color},transparent)` }} />
                      <div style={{ color: esc.color, fontWeight: 800, fontSize: 16, marginBottom: 4, fontFamily: "'Fraunces',serif" }}>{esc.label}</div>
                      <div style={{ color: "#4b5563", fontSize: 11, marginBottom: 14 }}>+{esc.nuevosMes}/mes · {Math.round(esc.bajasMes)} bajas/mes</div>
                      {[
                        ["MRR hoy",         `${fmt(MRR_TOTAL)}€`,       BRAND],
                        ["MRR Mar 2027",    `${fmt(last.revTotal)}€`,    "#22c55e"],
                        ["Crecimiento",     `+${crec}%`,                 esc.color],
                        ["Socios Mar 27",   `${last.total}`,             "#a855f7"],
                        ["Ticket medio",    `${fmt2(last.ticketMedio)}€`, "#f97316"],
                        ["Margen mensual",  `${margenFinal >= 0 ? "+" : ""}${fmt(margenFinal)}€`, margenFinal >= 0 ? "#22c55e" : "#ef4444"],
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
                  <p style={{ color: "#4b5563", fontSize: 12 }}>Incluye gastos reales y margen mensual</p>
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
                      <th>Fund.</th>
                      <th>Nuevos</th>
                      <th>Total</th>
                      <th>Rev. Fund.</th>
                      <th>Rev. Base 75€</th>
                      <th>Rev. Método 95€</th>
                      <th>MRR Total</th>
                      <th>Gastos</th>
                      <th>Margen</th>
                      <th>Ticket</th>
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
                        <td style={{ color: "#ef4444" }}>{fmt(r.gastos)}€</td>
                        <td style={{ color: r.margen >= 0 ? "#22c55e" : "#ef4444", fontWeight: 700 }}>{r.margen >= 0 ? "+" : ""}{fmt(r.margen)}€</td>
                        <td style={{ color: "#f97316", fontWeight: 600 }}>{fmt2(r.ticketMedio)}€</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

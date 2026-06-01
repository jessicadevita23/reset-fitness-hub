import { useState } from "react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";

const BRAND = "#39D0D8";

// ── Parámetros base (editables) ──────────────────────────────────
const BASE = {
  sociosActuales: 161,
  precioMedio: 65,
  crecimientoMensual: 15, // nuevos socios/mes estimado
  bajaMensual: 3,         // bajas estimadas/mes
  opexFijo: 2992,
  alquiler: 1900,
  interesesPrestamo: 875,
  fitMakerCuota: 4305,    // desde agosto
  opexVariable: 2000,
  retiroAdmin: 1000,
  saldoInicial: 3515.93,
};

const MESES = ["Jun","Jul","Ago","Sep","Oct","Nov","Dic","Ene 27","Feb 27","Mar 27"];
const MES_FITMAKER_START = 2; // índice agosto (0=jun, 1=jul, 2=ago)

function fmt(n) { return Number(n||0).toLocaleString("es-ES",{minimumFractionDigits:0,maximumFractionDigits:0}); }
function fmt2(n) { return Number(n||0).toLocaleString("es-ES",{minimumFractionDigits:2,maximumFractionDigits:2}); }

function buildProjection(params) {
  let socios = params.sociosActuales;
  let saldo = params.saldoInicial;
  const rows = [];

  for (let i = 0; i < MESES.length; i++) {
    socios = Math.max(0, socios + params.crecimientoMensual - params.bajaMensual);
    const ingresos = Math.round(socios * params.precioMedio);
    const fitmaker = i >= MES_FITMAKER_START ? params.fitMakerCuota : 0;
    const gastos = params.opexFijo + params.alquiler + params.interesesPrestamo + fitmaker + params.opexVariable + params.retiroAdmin;
    const resultado = ingresos - gastos;
    saldo += resultado;

    rows.push({
      mes: MESES[i],
      socios: Math.round(socios),
      ingresos,
      gastosFijos: params.opexFijo + params.alquiler + params.interesesPrestamo,
      fitmaker,
      opexVar: params.opexVariable,
      retiro: params.retiroAdmin,
      gastos,
      resultado,
      saldo: Math.round(saldo),
      breakeven: resultado >= 0,
    });
  }
  return rows;
}

const ESCENARIOS = {
  conservador: { label: "Conservador", color: "#ef4444", crecimientoMensual: 8,  precioMedio: 63 },
  base:        { label: "Base",        color: BRAND,     crecimientoMensual: 15, precioMedio: 65 },
  optimista:   { label: "Optimista",   color: "#22c55e", crecimientoMensual: 25, precioMedio: 68 },
};

function CT({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#0d1117", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"10px 14px", fontFamily:"sans-serif", fontSize:12 }}>
      <div style={{ color:"#9ca3af", marginBottom:4, fontWeight:700 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color:p.color||BRAND, fontWeight:600 }}>
          {p.name}: {fmt(p.value)}€
        </div>
      ))}
    </div>
  );
}

export default function CashFlowProyectado() {
  const [params, setParams] = useState({ ...BASE });
  const [escenario, setEscenario] = useState("base");
  const [tab, setTab] = useState("proyeccion");
  const [showEdit, setShowEdit] = useState(false);

  const activeParams = escenario === "base"
    ? params
    : { ...params, ...ESCENARIOS[escenario] };

  const data = buildProjection(activeParams);

  // All three scenarios for comparison
  const allScenarios = Object.entries(ESCENARIOS).map(([key, cfg]) => ({
    key, ...cfg,
    data: buildProjection({ ...params, ...cfg }),
  }));

  // Find breakeven month
  const breakevenIdx = data.findIndex(r => r.resultado >= 0);
  const criticalIdx = data.findIndex(r => r.saldo < 5000);

  // Provisiones
  const provisiones = [
    { concepto: "Cuota Fit-Maker agosto",     mes: "Ago 2026",  importe: 4305,  tipo: "fijo",     urgencia: "alta",   estado: "pendiente" },
    { concepto: "Cuota Fit-Maker septiembre", mes: "Sep 2026",  importe: 4305,  tipo: "fijo",     urgencia: "media",  estado: "pendiente" },
    { concepto: "Intereses préstamo (mensual)",mes:"Mensual",   importe: 875,   tipo: "fijo",     urgencia: "alta",   estado: "activo"    },
    { concepto: "Alquiler Mario Ribas",        mes: "Mensual",  importe: 1900,  tipo: "fijo",     urgencia: "alta",   estado: "activo"    },
    { concepto: "Saldo pend. Elementents",     mes: "Jul 2026", importe: 3811,  tipo: "variable", urgencia: "media",  estado: "pendiente" },
    { concepto: "Revisión IVA trimestral",     mes: "Jul 2026", importe: 2500,  tipo: "fiscal",   urgencia: "alta",   estado: "estimado"  },
    { concepto: "OPEX variable mensual",       mes: "Mensual",  importe: 2000,  tipo: "variable", urgencia: "baja",   estado: "activo"    },
    { concepto: "Modelo 303 IVA Q2",          mes: "Jul 2026", importe: 1800,  tipo: "fiscal",   urgencia: "alta",   estado: "estimado"  },
  ];

  const URGENCIA = {
    alta:  { c:"#ef4444", bg:"rgba(239,68,68,0.1)",   l:"Alta" },
    media: { c:"#eab308", bg:"rgba(234,179,8,0.1)",   l:"Media" },
    baja:  { c:"#22c55e", bg:"rgba(34,197,94,0.1)",   l:"Baja" },
  };

  const TIPO_PROV = {
    fijo:     { c:BRAND,     l:"Fijo" },
    variable: { c:"#f97316", l:"Variable" },
    fiscal:   { c:"#a855f7", l:"Fiscal" },
  };

  const TABS = [
    { id:"proyeccion",  label:"📈 Proyección" },
    { id:"escenarios",  label:"🔀 Escenarios" },
    { id:"provisiones", label:"📋 Provisiones" },
    { id:"tabla",       label:"📊 Tabla detalle" },
  ];

  const Slider = ({ label, field, min, max, step=1, suffix="€" }) => (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
        <label style={{ color:"#9ca3af", fontSize:12 }}>{label}</label>
        <span style={{ color:BRAND, fontWeight:700, fontSize:13 }}>{params[field]}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={params[field]}
        onChange={e => setParams(p => ({ ...p, [field]: Number(e.target.value) }))}
        style={{ width:"100%", accentColor: BRAND }} />
      <div style={{ display:"flex", justifyContent:"space-between", color:"#374151", fontSize:10 }}>
        <span>{min}{suffix}</span><span>{max}{suffix}</span>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700;900&family=DM+Sans:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
        ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:rgba(57,208,216,0.2);border-radius:2px;}
        table{border-collapse:collapse;width:100%;}
        th{padding:8px 12px;text-align:left;color:#374151;font-size:10px;text-transform:uppercase;letter-spacing:0.07em;border-bottom:1px solid rgba(255,255,255,0.05);}
        td{padding:9px 12px;border-bottom:1px solid rgba(255,255,255,0.04);font-size:12px;color:#d1d5db;}
        tr:hover td{background:rgba(255,255,255,0.02);}
        input[type=range]{height:4px;}
      `}</style>

      <div style={{ minHeight:"100vh", background:"#060d14", color:"#f1f5f9", fontFamily:"'DM Sans',sans-serif" }}>

        {/* Header */}
        <div style={{ padding:"0 24px", background:"rgba(0,0,0,0.45)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"space-between", height:58, position:"sticky", top:0, zIndex:100 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,${BRAND},#1aa8af)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:900,color:"#051015",fontFamily:"serif" }}>R</div>
            <div>
              <div style={{ color:"#f1f5f9", fontFamily:"'Fraunces',serif", fontSize:15, fontWeight:700 }}>Reset Fitness Ibiza</div>
              <div style={{ color:"#374151", fontSize:9, textTransform:"uppercase", letterSpacing:"0.1em" }}>Cash Flow Proyectado · Jun 2026 – Mar 2027</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <div style={{ display:"flex", gap:3 }}>
              {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:"6px 12px", borderRadius:7, background:tab===t.id?"rgba(57,208,216,0.14)":"transparent", border:`1px solid ${tab===t.id?"rgba(57,208,216,0.3)":"transparent"}`, color:tab===t.id?BRAND:"#6b7280", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"sans-serif", whiteSpace:"nowrap" }}>{t.label}</button>)}
            </div>
            <button onClick={() => setShowEdit(p => !p)} style={{ padding:"7px 14px", borderRadius:8, background:showEdit?"rgba(57,208,216,0.15)":"rgba(255,255,255,0.06)", border:`1px solid ${showEdit?"rgba(57,208,216,0.35)":"rgba(255,255,255,0.1)"}`, color:showEdit?BRAND:"#9ca3af", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"sans-serif" }}>
              ⚙ Parámetros
            </button>
          </div>
        </div>

        <div style={{ display:"flex", height:"calc(100vh - 58px)" }}>

          {/* ── Sidebar parámetros ── */}
          {showEdit && (
            <div style={{ width:280, borderRight:"1px solid rgba(255,255,255,0.06)", padding:"20px 18px", overflowY:"auto", background:"rgba(0,0,0,0.2)", flexShrink:0 }}>
              <div style={{ color:BRAND, fontWeight:700, fontSize:13, marginBottom:18 }}>⚙ Ajustar parámetros</div>
              <Slider label="Socios actuales" field="sociosActuales" min={100} max={300} suffix=" socios"/>
              <Slider label="Precio medio/socio" field="precioMedio" min={50} max={120}/>
              <Slider label="Nuevos socios/mes" field="crecimientoMensual" min={0} max={50} suffix=" socios"/>
              <Slider label="Bajas/mes" field="bajaMensual" min={0} max={20} suffix=" socios"/>
              <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"16px 0"}}/>
              <Slider label="OPEX fijo mensual" field="opexFijo" min={1000} max={8000} step={100}/>
              <Slider label="Alquiler mensual" field="alquiler" min={500} max={5000} step={100}/>
              <Slider label="Intereses préstamo" field="interesesPrestamo" min={0} max={2000} step={50}/>
              <Slider label="OPEX variable" field="opexVariable" min={0} max={5000} step={100}/>
              <Slider label="Retiro admin." field="retiroAdmin" min={0} max={3000} step={100}/>
              <button onClick={() => setParams({...BASE})} style={{ width:"100%", marginTop:12, padding:"9px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:8, color:"#ef4444", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"sans-serif" }}>
                Restablecer valores base
              </button>
            </div>
          )}

          {/* ── Main content ── */}
          <div style={{ flex:1, overflowY:"auto", padding:24 }}>

            {/* ══ PROYECCIÓN ══ */}
            {tab==="proyeccion" && (
              <div style={{ animation:"fadeUp 0.3s ease" }}>

                {/* Escenario selector */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                  <div>
                    <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:20, color:"#f1f5f9", marginBottom:3 }}>Proyección mensual</h2>
                    <p style={{ color:"#4b5563", fontSize:12 }}>
                      {breakevenIdx >= 0 ? `Breakeven en ${data[breakevenIdx].mes} con ${data[breakevenIdx].socios} socios` : "Sin breakeven en el horizonte — ajusta parámetros"}
                    </p>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    {Object.entries(ESCENARIOS).map(([key, cfg]) => (
                      <button key={key} onClick={() => setEscenario(key)} style={{ padding:"6px 14px", borderRadius:99, background:escenario===key?`${cfg.color}18`:"rgba(255,255,255,0.04)", border:`1px solid ${escenario===key?cfg.color+"50":"rgba(255,255,255,0.08)"}`, color:escenario===key?cfg.color:"#6b7280", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"sans-serif" }}>{cfg.label}</button>
                    ))}
                  </div>
                </div>

                {/* Alerts */}
                <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" }}>
                  <div style={{ flex:1, minWidth:200, background:"rgba(234,179,8,0.07)", border:"1px solid rgba(234,179,8,0.25)", borderRadius:10, padding:"12px 16px" }}>
                    <div style={{ color:"#eab308", fontWeight:700, fontSize:12, marginBottom:4 }}>⚠️ Agosto — arranque Fit-Maker</div>
                    <div style={{ color:"#9ca3af", fontSize:11 }}>+4.305€/mes de coste fijo. Necesitas {Math.ceil((activeParams.opexFijo + activeParams.alquiler + activeParams.interesesPrestamo + activeParams.fitMakerCuota + activeParams.opexVariable) / activeParams.precioMedio)} socios para cubrir costes.</div>
                  </div>
                  {criticalIdx >= 0 && (
                    <div style={{ flex:1, minWidth:200, background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, padding:"12px 16px" }}>
                      <div style={{ color:"#ef4444", fontWeight:700, fontSize:12, marginBottom:4 }}>🔴 Alerta liquidez — {data[criticalIdx].mes}</div>
                      <div style={{ color:"#9ca3af", fontSize:11 }}>El saldo cae por debajo de 5.000€ en {data[criticalIdx].mes}. Reserva mínima recomendada: 15.000€.</div>
                    </div>
                  )}
                  <div style={{ flex:1, minWidth:200, background:"rgba(57,208,216,0.07)", border:"1px solid rgba(57,208,216,0.25)", borderRadius:10, padding:"12px 16px" }}>
                    <div style={{ color:BRAND, fontWeight:700, fontSize:12, marginBottom:4 }}>✓ Saldo actual verificado</div>
                    <div style={{ color:"#9ca3af", fontSize:11 }}>3.515,93€ en banco Santander. Proyección arranca desde ahí.</div>
                  </div>
                </div>

                {/* Saldo proyectado */}
                <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:"18px 18px 8px", marginBottom:14 }}>
                  <div style={{ color:"#9ca3af", fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:14 }}>Saldo bancario proyectado (€)</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={data}>
                      <defs>
                        <linearGradient id="gSaldo" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={BRAND} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={BRAND} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="mes" tick={{fill:"#4b5563",fontSize:11}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:"#4b5563",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
                      <Tooltip content={<CT/>}/>
                      <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5}/>
                      <ReferenceLine y={15000} stroke="#eab308" strokeDasharray="4 4" strokeOpacity={0.4} label={{value:"Reserva mín.",fill:"#eab308",fontSize:10}}/>
                      <Area type="monotone" dataKey="saldo" name="Saldo" stroke={BRAND} fill="url(#gSaldo)" strokeWidth={2} dot={{fill:BRAND,r:4}}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Ingresos vs Gastos */}
                <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:"18px 18px 8px", marginBottom:14 }}>
                  <div style={{ color:"#9ca3af", fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:14 }}>Ingresos vs Gastos proyectados (€)</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data} barGap={4}>
                      <XAxis dataKey="mes" tick={{fill:"#4b5563",fontSize:11}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:"#4b5563",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                      <Tooltip content={<CT/>}/>
                      <Bar dataKey="ingresos" name="Ingresos" fill={BRAND} radius={[4,4,0,0]}/>
                      <Bar dataKey="gastos" name="Gastos" fill="rgba(239,68,68,0.6)" radius={[4,4,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Socios proyectados */}
                <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:"18px 18px 8px" }}>
                  <div style={{ color:"#9ca3af", fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:14 }}>Evolución de socios proyectada</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={data}>
                      <XAxis dataKey="mes" tick={{fill:"#4b5563",fontSize:11}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:"#4b5563",fontSize:11}} axisLine={false} tickLine={false}/>
                      <Tooltip formatter={(v) => [`${v} socios`]}/>
                      <ReferenceLine y={220} stroke="#eab308" strokeDasharray="4 4" strokeOpacity={0.5} label={{value:"Meta agosto",fill:"#eab308",fontSize:10}}/>
                      <Line type="monotone" dataKey="socios" name="Socios" stroke="#a855f7" strokeWidth={2} dot={{fill:"#a855f7",r:4}}/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* ══ ESCENARIOS ══ */}
            {tab==="escenarios" && (
              <div style={{ animation:"fadeUp 0.3s ease" }}>
                <div style={{ marginBottom:18 }}>
                  <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:20, color:"#f1f5f9", marginBottom:4 }}>Comparativa de escenarios</h2>
                  <p style={{ color:"#4b5563", fontSize:12 }}>Conservador (+8/mes) · Base (+15/mes) · Optimista (+25/mes)</p>
                </div>

                {/* Saldo comparativo */}
                <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:"18px 18px 8px", marginBottom:14 }}>
                  <div style={{ color:"#9ca3af", fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:14 }}>Saldo proyectado por escenario (€)</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={MESES.map((mes,i) => ({
                      mes,
                      conservador: allScenarios[0].data[i]?.saldo,
                      base: allScenarios[1].data[i]?.saldo,
                      optimista: allScenarios[2].data[i]?.saldo,
                    }))}>
                      <XAxis dataKey="mes" tick={{fill:"#4b5563",fontSize:11}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:"#4b5563",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
                      <Tooltip content={<CT/>}/>
                      <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.4}/>
                      <ReferenceLine y={15000} stroke="#eab308" strokeDasharray="4 4" strokeOpacity={0.3}/>
                      <Line type="monotone" dataKey="conservador" name="Conservador" stroke="#ef4444" strokeWidth={2} dot={false}/>
                      <Line type="monotone" dataKey="base" name="Base" stroke={BRAND} strokeWidth={2} dot={false}/>
                      <Line type="monotone" dataKey="optimista" name="Optimista" stroke="#22c55e" strokeWidth={2} dot={false}/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Tabla comparativa */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                  {allScenarios.map(esc => {
                    const beIdx = esc.data.findIndex(r => r.resultado >= 0);
                    const minSaldo = Math.min(...esc.data.map(r => r.saldo));
                    const lastSaldo = esc.data[esc.data.length-1].saldo;
                    return (
                      <div key={esc.key} style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${esc.color}30`, borderRadius:14, padding:"18px 18px", position:"relative", overflow:"hidden" }}>
                        <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${esc.color},transparent)` }}/>
                        <div style={{ color:esc.color, fontWeight:800, fontSize:16, marginBottom:4, fontFamily:"'Fraunces',serif" }}>{esc.label}</div>
                        <div style={{ color:"#4b5563", fontSize:11, marginBottom:14 }}>+{esc.crecimientoMensual} socios/mes · {esc.precioMedio}€ precio</div>
                        {[
                          ["Breakeven", beIdx >= 0 ? esc.data[beIdx].mes : "No alcanzado", beIdx >= 0 ? "#22c55e" : "#ef4444"],
                          ["Saldo mínimo", `${fmt(minSaldo)}€`, minSaldo < 0 ? "#ef4444" : minSaldo < 5000 ? "#eab308" : "#22c55e"],
                          ["Saldo Mar 2027", `${fmt(lastSaldo)}€`, lastSaldo < 0 ? "#ef4444" : lastSaldo < 10000 ? "#eab308" : "#22c55e"],
                          ["Socios Mar 2027", `${esc.data[esc.data.length-1].socios}`, "#a855f7"],
                        ].map(([l,v,c]) => (
                          <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid rgba(255,255,255,0.05)", fontSize:12 }}>
                            <span style={{ color:"#6b7280" }}>{l}</span>
                            <span style={{ color:c, fontWeight:700 }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══ PROVISIONES ══ */}
            {tab==="provisiones" && (
              <div style={{ animation:"fadeUp 0.3s ease" }}>
                <div style={{ marginBottom:18 }}>
                  <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:20, color:"#f1f5f9", marginBottom:4 }}>Provisiones y compromisos futuros</h2>
                  <p style={{ color:"#4b5563", fontSize:12 }}>Pagos conocidos o previstos que impactarán el cash flow</p>
                </div>

                <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, overflow:"hidden", marginBottom:16 }}>
                  <table>
                    <thead><tr><th>Concepto</th><th>Mes</th><th>Importe</th><th>Tipo</th><th>Urgencia</th><th>Estado</th></tr></thead>
                    <tbody>
                      {provisiones.map((p,i) => (
                        <tr key={i}>
                          <td style={{ color:"#f1f5f9", fontWeight:500 }}>{p.concepto}</td>
                          <td style={{ color:"#6b7280" }}>{p.mes}</td>
                          <td style={{ color:TIPO_PROV[p.tipo].c, fontWeight:700 }}>{fmt(p.importe)}€</td>
                          <td><span style={{ color:TIPO_PROV[p.tipo].c, fontSize:11, fontWeight:600 }}>{TIPO_PROV[p.tipo].l}</span></td>
                          <td><span style={{ padding:"2px 8px", borderRadius:99, background:URGENCIA[p.urgencia].bg, color:URGENCIA[p.urgencia].c, fontSize:10, fontWeight:700 }}>{URGENCIA[p.urgencia].l}</span></td>
                          <td style={{ color:"#6b7280", fontSize:11 }}>{p.estado}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Reserva recomendada */}
                <div style={{ background:"rgba(57,208,216,0.05)", border:"1px solid rgba(57,208,216,0.2)", borderRadius:12, padding:"18px 20px" }}>
                  <div style={{ color:BRAND, fontWeight:700, fontSize:14, marginBottom:14 }}>💡 Reserva mínima recomendada</div>
                  {[
                    ["Reserva operativa (1 mes gastos)", "~12.000€", "Para cubrir cualquier mes sin ingresos"],
                    ["Colchón agosto (Fit-Maker)", "~8.000€",  "2 meses de cuota por si hay retraso en socios"],
                    ["Provisión IVA trimestral Q2",  "~2.500€",  "Modelo 303 julio 2026"],
                    ["Provisión Elementents pendiente","~3.800€", "Pago restante carpa/estructura"],
                    ["TOTAL reserva mínima recomendada", "~26.300€", "Para operar con tranquilidad hasta octubre"],
                  ].map(([l,v,n],i) => (
                    <div key={l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.05)", fontSize:12 }}>
                      <div>
                        <div style={{ color:i===4?"#f1f5f9":"#9ca3af", fontWeight:i===4?700:400 }}>{l}</div>
                        <div style={{ color:"#4b5563", fontSize:10 }}>{n}</div>
                      </div>
                      <span style={{ color:i===4?BRAND:"#f1f5f9", fontWeight:700, fontSize:13 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop:14, padding:"12px 14px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:8, color:"#ef4444", fontSize:12, lineHeight:1.6 }}>
                    ⚠️ Saldo actual: <strong>3.515€</strong>. Diferencia vs reserva recomendada: <strong>-22.785€</strong>. Esto hace crítico crecer a 200+ socios antes de agosto para generar el colchón necesario.
                  </div>
                </div>
              </div>
            )}

            {/* ══ TABLA ══ */}
            {tab==="tabla" && (
              <div style={{ animation:"fadeUp 0.3s ease" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                  <div>
                    <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:20, color:"#f1f5f9", marginBottom:4 }}>Tabla detallada — Escenario {ESCENARIOS[escenario].label}</h2>
                    <p style={{ color:"#4b5563", fontSize:12 }}>Desglose completo mes a mes de ingresos, gastos y saldo</p>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    {Object.entries(ESCENARIOS).map(([key,cfg]) => (
                      <button key={key} onClick={()=>setEscenario(key)} style={{ padding:"5px 12px", borderRadius:99, background:escenario===key?`${cfg.color}18`:"rgba(255,255,255,0.04)", border:`1px solid ${escenario===key?cfg.color+"50":"rgba(255,255,255,0.08)"}`, color:escenario===key?cfg.color:"#6b7280", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"sans-serif" }}>{cfg.label}</button>
                    ))}
                  </div>
                </div>
                <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, overflow:"auto" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Mes</th>
                        <th>Socios</th>
                        <th>Ingresos</th>
                        <th>OPEX Fijo</th>
                        <th>Fit-Maker</th>
                        <th>OPEX Var.</th>
                        <th>Total gastos</th>
                        <th>Resultado</th>
                        <th>Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((r,i) => (
                        <tr key={i} style={{ background: r.saldo < 5000 ? "rgba(239,68,68,0.05)" : r.resultado >= 0 ? "rgba(34,197,94,0.02)" : "" }}>
                          <td style={{ color:"#f1f5f9", fontWeight:700 }}>{r.mes}</td>
                          <td style={{ color:"#a855f7", fontWeight:600 }}>{r.socios}</td>
                          <td style={{ color:"#22c55e", fontWeight:700 }}>{fmt(r.ingresos)}€</td>
                          <td style={{ color:"#f97316" }}>{fmt(r.gastosFijos)}€</td>
                          <td style={{ color:r.fitmaker>0?"#ef4444":"#374151", fontWeight:r.fitmaker>0?700:400 }}>{r.fitmaker>0?`${fmt(r.fitmaker)}€`:"—"}</td>
                          <td style={{ color:"#eab308" }}>{fmt(r.opexVar)}€</td>
                          <td style={{ color:"#ef4444" }}>{fmt(r.gastos)}€</td>
                          <td style={{ color:r.resultado>=0?"#22c55e":"#ef4444", fontWeight:700 }}>{r.resultado>=0?"+":""}{fmt(r.resultado)}€</td>
                          <td style={{ color:r.saldo<0?"#ef4444":r.saldo<5000?"#eab308":"#f1f5f9", fontWeight:700 }}>{fmt(r.saldo)}€</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

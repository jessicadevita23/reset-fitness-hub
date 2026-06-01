import { useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const BRAND = "#39D0D8";

const GASTOS_DATA = {"CAPEX":{"total":291864.26,"pct":76.5,"subcategorias":{"Obra y reforma":{"total":129743.73,"n":9},"Maquinaria gimnasio":{"total":108877.04,"n":8},"Instalaciones":{"total":19231.24,"n":3},"Equipamiento audio":{"total":8000.0,"n":2},"Aluminio y cristalería":{"total":6487.9,"n":2},"Estructura exterior":{"total":4000.0,"n":1},"Construcción":{"total":3025.0,"n":1},"Decoración/plantas":{"total":2574.0,"n":2},"Revestimientos/suelos":{"total":1688.38,"n":5},"Honorarios arquitecto":{"total":1590.0,"n":1},"Pintura obra":{"total":1075.59,"n":5},"Consultoría apertura":{"total":1031.86,"n":1},"Constitución/legal":{"total":995.0,"n":2},"Equipamiento digital":{"total":908.0,"n":1},"Césped artificial":{"total":870.4,"n":2},"Notaría":{"total":778.45,"n":2},"Instalación seguridad":{"total":426.07,"n":1},"Equipamiento":{"total":238.78,"n":1},"Material construcción":{"total":172.82,"n":2},"Material equipamiento":{"total":150.0,"n":1}}},"DEUDA":{"total":67957.0,"pct":17.8,"subcategorias":{"Alquiler local (Mario Ribas)":{"total":52840.0,"n":3},"Devolución préstamo Manuel Ríos":{"total":12000.0,"n":1},"Intereses préstamo":{"total":2625.0,"n":3},"Tratamiento/consultoría":{"total":250.0,"n":1},"Asesoría legal":{"total":242.0,"n":1}}},"OPEX_FIJO":{"total":5983.0,"pct":1.6,"subcategorias":{"Servicios profesionales":{"total":3267.0,"n":3},"Diseño/web (Be Virtual)":{"total":1831.94,"n":4},"Renting/limpieza":{"total":322.72,"n":1},"Gestoría/asesoría":{"total":242.0,"n":1},"Software gestión (Intelinova)":{"total":107.46,"n":1},"Asesoría legal":{"total":89.54,"n":1},"Seguridad alarma":{"total":65.17,"n":1},"Telefonía/internet":{"total":46.28,"n":3},"Comisión Bizum":{"total":9.6,"n":24},"Comisión TPV":{"total":1.29,"n":1}}},"OPEX_VAR":{"total":12910.48,"pct":3.4,"subcategorias":{"Setup software (pago único)":{"total":6819.19,"n":2},"Amazon (materiales/suministros)":{"total":1981.76,"n":19},"Catering/eventos":{"total":1827.1,"n":2},"Otros gastos":{"total":780.1,"n":2},"Alquiler vehículo":{"total":406.77,"n":2},"Café/vending":{"total":215.23,"n":1},"Restaurante/representación":{"total":188.09,"n":2},"Varios":{"total":135.63,"n":1},"Ferretería/materiales":{"total":117.14,"n":3},"Apple/tecnología":{"total":99.0,"n":1},"Alimentación/limpieza":{"total":93.79,"n":3},"Compra material":{"total":56.94,"n":1},"Restaurante/viaje":{"total":54.39,"n":1},"Consultoría":{"total":52.03,"n":1},"Imprenta/marketing":{"total":49.05,"n":1},"Combustible":{"total":20.0,"n":1},"Combustible/movilidad":{"total":14.27,"n":1}}},"RETIRO":{"total":3000.0,"pct":0.8,"subcategorias":{"Retiro administradora":{"total":3000.0,"n":3}}}};

const TIPO_CFG = {
  CAPEX:     { label:"CAPEX",      desc:"Inversión inicial · No recurrente",   color:"#a855f7", icon:"🏗" },
  DEUDA:     { label:"DEUDA",      desc:"Alquiler + préstamos + intereses",    color:"#ef4444", icon:"🏦" },
  OPEX_FIJO: { label:"OPEX Fijo",  desc:"Gastos fijos recurrentes mensuales", color:"#f97316", icon:"📋" },
  OPEX_VAR:  { label:"OPEX Var.",  desc:"Gastos variables operativos",        color:"#eab308", icon:"📦" },
  RETIRO:    { label:"Retiros",    desc:"Retiros de la administradora",       color:"#6b7280", icon:"💸" },
};

const TOTAL = 381714.74;
function fmt(n){return Number(n||0).toLocaleString("es-ES",{minimumFractionDigits:2,maximumFractionDigits:2});}

const PIE_DATA = Object.entries(GASTOS_DATA).map(([k,v])=>({
  name: TIPO_CFG[k].label, value: v.total, color: TIPO_CFG[k].color, key:k
}));

const OPEX_MENSUAL = {
  fijo: Math.round(GASTOS_DATA.OPEX_FIJO.total / 2), // 2 months operating
  variable: Math.round(GASTOS_DATA.OPEX_VAR.total / 2),
};

function CT({active,payload,label}){
  if(!active||!payload?.length) return null;
  return <div style={{background:"#0d1117",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"10px 14px",fontFamily:"sans-serif",fontSize:12}}><div style={{color:"#9ca3af",marginBottom:4}}>{label}</div>{payload.map(p=><div key={p.name} style={{color:p.color||BRAND,fontWeight:600}}>{p.name}: {fmt(p.value)}€</div>)}</div>;
}

export default function GastosClasificados(){
  const [tab, setTab] = useState("resumen");
  const [selected, setSelected] = useState(null);

  const TABS = [
    {id:"resumen",   label:"📊 Resumen"},
    {id:"capex",     label:"🏗 CAPEX"},
    {id:"deuda",     label:"🏦 Deuda"},
    {id:"opex",      label:"📋 OPEX"},
    {id:"proyeccion",label:"📈 Proyección"},
  ];

  const barData = Object.entries(GASTOS_DATA).map(([k,v])=>({
    name: TIPO_CFG[k].label,
    value: v.total,
    color: TIPO_CFG[k].color,
  }));

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700;900&family=DM+Sans:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
        ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:rgba(57,208,216,0.2);border-radius:2px;}
        table{border-collapse:collapse;width:100%;}
        th{padding:8px 14px;text-align:left;color:#374151;font-size:10px;text-transform:uppercase;letter-spacing:0.07em;border-bottom:1px solid rgba(255,255,255,0.05);}
        td{padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.04);font-size:12px;color:#d1d5db;}
        tr:hover td{background:rgba(255,255,255,0.02);}
      `}</style>

      <div style={{minHeight:"100vh",background:"#060d14",color:"#f1f5f9",fontFamily:"'DM Sans',sans-serif"}}>

        {/* Header */}
        <div style={{padding:"0 24px",background:"rgba(0,0,0,0.45)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"space-between",height:58,position:"sticky",top:0,zIndex:100}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,${BRAND},#1aa8af)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:900,color:"#051015",fontFamily:"serif"}}>R</div>
            <div>
              <div style={{color:"#f1f5f9",fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:700}}>Reset Fitness Ibiza</div>
              <div style={{color:"#374151",fontSize:9,textTransform:"uppercase",letterSpacing:"0.1em"}}>Análisis de Gastos — CAPEX · OPEX · DEUDA</div>
            </div>
          </div>
          <div style={{display:"flex",gap:3}}>
            {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"6px 14px",borderRadius:7,background:tab===t.id?"rgba(57,208,216,0.14)":"transparent",border:`1px solid ${tab===t.id?"rgba(57,208,216,0.3)":"transparent"}`,color:tab===t.id?BRAND:"#6b7280",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"sans-serif",whiteSpace:"nowrap"}}>{t.label}</button>)}
          </div>
        </div>

        <div style={{padding:24,height:"calc(100vh - 58px)",overflowY:"auto"}}>

          {/* ══ RESUMEN ══ */}
          {tab==="resumen"&&(
            <div style={{animation:"fadeUp 0.3s ease"}}>
              <div style={{marginBottom:20}}>
                <h2 style={{fontFamily:"'Fraunces',serif",fontSize:20,color:"#f1f5f9",marginBottom:4}}>Clasificación de gastos</h2>
                <p style={{color:"#4b5563",fontSize:12}}>Extracto Santander 05/01–01/06/2026 · Total: {fmt(TOTAL)}€ · 148 movimientos</p>
              </div>

              {/* KPI cards */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:22}}>
                {Object.entries(GASTOS_DATA).map(([k,v])=>{
                  const cfg=TIPO_CFG[k];
                  return(
                    <div key={k} onClick={()=>setSelected(selected===k?null:k)} style={{background:selected===k?`${cfg.color}0d`:"rgba(255,255,255,0.02)",border:`1px solid ${selected===k?cfg.color+"40":"rgba(255,255,255,0.06)"}`,borderRadius:14,padding:"16px 16px",cursor:"pointer",position:"relative",overflow:"hidden",transition:"all 0.15s"}}>
                      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${cfg.color},transparent)`}}/>
                      <div style={{fontSize:22,marginBottom:8}}>{cfg.icon}</div>
                      <div style={{color:"#4b5563",fontSize:9,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4}}>{cfg.label}</div>
                      <div style={{color:cfg.color,fontSize:18,fontWeight:800,fontFamily:"'Fraunces',serif"}}>{fmt(v.total)}€</div>
                      <div style={{color:"#374151",fontSize:10,marginTop:3}}>{v.pct}% del total</div>
                      <div style={{color:"#4b5563",fontSize:10,marginTop:2}}>{cfg.desc}</div>
                    </div>
                  );
                })}
              </div>

              {/* Charts */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
                <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"18px 18px 8px"}}>
                  <div style={{color:"#9ca3af",fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:14}}>Distribución total de gastos</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                        {PIE_DATA.map((e,i)=><Cell key={i} fill={e.color}/>)}
                      </Pie>
                      <Tooltip formatter={(v,n)=>[`${fmt(v)}€`,n]}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{display:"flex",flexWrap:"wrap",gap:10,justifyContent:"center",marginTop:8}}>
                    {PIE_DATA.map(d=>(
                      <div key={d.name} style={{display:"flex",alignItems:"center",gap:5}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:d.color}}/>
                        <span style={{color:"#6b7280",fontSize:11}}>{d.name} ({((d.value/TOTAL)*100).toFixed(1)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"18px 18px 8px"}}>
                  <div style={{color:"#9ca3af",fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:14}}>Importe por categoría (€)</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={barData} layout="vertical">
                      <XAxis type="number" tick={{fill:"#4b5563",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                      <YAxis type="category" dataKey="name" tick={{fill:"#9ca3af",fontSize:11}} axisLine={false} tickLine={false} width={70}/>
                      <Tooltip content={<CT/>}/>
                      <Bar dataKey="value" name="Total" radius={[0,4,4,0]}>
                        {barData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Insight boxes */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div style={{background:"rgba(168,85,247,0.06)",border:"1px solid rgba(168,85,247,0.2)",borderRadius:12,padding:"16px 18px"}}>
                  <div style={{color:"#a855f7",fontWeight:700,fontSize:13,marginBottom:10}}>🏗 CAPEX — Inversión de apertura</div>
                  <div style={{color:"#9ca3af",fontSize:12,lineHeight:1.7}}>
                    El <strong style={{color:"#a855f7"}}>76.5%</strong> del gasto total es inversión no recurrente de puesta en marcha. Una vez abierto el gimnasio este gasto desaparece. Los dos grandes bloques son:
                    <br/>• Obra y reforma: <strong style={{color:"#f1f5f9"}}>129.743€</strong>
                    <br/>• Maquinaria Fit-Maker: <strong style={{color:"#f1f5f9"}}>108.877€</strong>
                  </div>
                </div>
                <div style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:12,padding:"16px 18px"}}>
                  <div style={{color:"#ef4444",fontWeight:700,fontSize:13,marginBottom:10}}>🏦 DEUDA — Carga financiera recurrente</div>
                  <div style={{color:"#9ca3af",fontSize:12,lineHeight:1.7}}>
                    <strong style={{color:"#ef4444"}}>67.957€</strong> en pagos de deuda:
                    <br/>• Alquiler Mario Ribas: <strong style={{color:"#f1f5f9"}}>52.840€</strong> (pagos adelantados)
                    <br/>• Devolución préstamo: <strong style={{color:"#f1f5f9"}}>12.000€</strong>
                    <br/>• Intereses préstamo: <strong style={{color:"#f1f5f9"}}>2.625€</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ CAPEX ══ */}
          {tab==="capex"&&(
            <div style={{animation:"fadeUp 0.3s ease"}}>
              <div style={{marginBottom:18}}>
                <h2 style={{fontFamily:"'Fraunces',serif",fontSize:20,color:"#f1f5f9",marginBottom:4}}>CAPEX — Inversión inicial</h2>
                <p style={{color:"#4b5563",fontSize:12}}>Total: {fmt(GASTOS_DATA.CAPEX.total)}€ · Gasto no recurrente · Puesta en marcha del gimnasio</p>
              </div>
              <div style={{background:"rgba(168,85,247,0.05)",border:"1px solid rgba(168,85,247,0.2)",borderRadius:10,padding:"12px 16px",marginBottom:16,fontSize:12,color:"#9ca3af"}}>
                ℹ️ El CAPEX es la inversión que se hace una sola vez para abrir el negocio. No volverá a aparecer en los próximos meses. Lo importante es que esté bien documentado con facturas para la amortización contable.
              </div>
              <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,overflow:"hidden"}}>
                <table>
                  <thead><tr><th>Concepto</th><th>Importe</th><th>% del CAPEX</th><th>Movimientos</th></tr></thead>
                  <tbody>
                    {Object.entries(GASTOS_DATA.CAPEX.subcategorias)
                      .sort((a,b)=>b[1].total-a[1].total)
                      .map(([k,v])=>(
                      <tr key={k}>
                        <td style={{color:"#f1f5f9",fontWeight:500}}>{k}</td>
                        <td style={{color:"#a855f7",fontWeight:700}}>{fmt(v.total)}€</td>
                        <td>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{flex:1,background:"rgba(255,255,255,0.06)",borderRadius:99,height:5,overflow:"hidden"}}>
                              <div style={{height:"100%",width:`${(v.total/GASTOS_DATA.CAPEX.total*100).toFixed(1)}%`,background:"#a855f7",borderRadius:99}}/>
                            </div>
                            <span style={{color:"#6b7280",fontSize:11,minWidth:40}}>{(v.total/GASTOS_DATA.CAPEX.total*100).toFixed(1)}%</span>
                          </div>
                        </td>
                        <td style={{color:"#6b7280"}}>{v.n}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{padding:"10px 14px",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",justifyContent:"flex-end"}}>
                  <span style={{color:"#6b7280",fontSize:11}}>Total CAPEX: <strong style={{color:"#a855f7"}}>{fmt(GASTOS_DATA.CAPEX.total)}€</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* ══ DEUDA ══ */}
          {tab==="deuda"&&(
            <div style={{animation:"fadeUp 0.3s ease"}}>
              <div style={{marginBottom:18}}>
                <h2 style={{fontFamily:"'Fraunces',serif",fontSize:20,color:"#f1f5f9",marginBottom:4}}>Deuda y financiación</h2>
                <p style={{color:"#4b5563",fontSize:12}}>Total pagado: {fmt(GASTOS_DATA.DEUDA.total)}€ · Compromisos recurrentes</p>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                {[
                  {label:"Alquiler local",val:"52.840€",sub:"Mario Ribas · pagos adelantados 2026-2027",color:"#ef4444",nota:"Incluye varios meses adelantados. Revisar estructura de pagos con gestoría."},
                  {label:"Devolución préstamo",val:"12.000€",sub:"Manuel Ríos García · devuelto",color:"#22c55e",nota:"Préstamo corto de 12.000€ ya devuelto. ✓"},
                  {label:"Intereses préstamo",val:"2.625€",sub:"Detlef Vormschlag · 3 pagos",color:"#f97316",nota:"Intereses del préstamo principal de 350.000€. Se pagarán mensualmente."},
                  {label:"Próximo: Fit-Maker",val:"4.305€/mes",sub:"Primer cargo: 15/08/2026",color:"#eab308",nota:"Cuota mensual de la financiación de maquinaria. 41 cuotas restantes."},
                ].map(k=>(
                  <div key={k.label} style={{background:"rgba(255,255,255,0.02)",border:`1px solid ${k.color}25`,borderRadius:12,padding:"16px 18px"}}>
                    <div style={{color:"#4b5563",fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>{k.label}</div>
                    <div style={{color:k.color,fontSize:20,fontWeight:800,fontFamily:"'Fraunces',serif",marginBottom:4}}>{k.val}</div>
                    <div style={{color:"#6b7280",fontSize:11,marginBottom:8}}>{k.sub}</div>
                    <div style={{color:"#9ca3af",fontSize:11,lineHeight:1.5,padding:"8px 10px",background:"rgba(255,255,255,0.03)",borderRadius:7}}>{k.nota}</div>
                  </div>
                ))}
              </div>

              <div style={{background:"rgba(239,68,68,0.05)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:12,padding:"16px 20px"}}>
                <div style={{color:"#ef4444",fontWeight:700,fontSize:13,marginBottom:12}}>📋 Compromisos financieros mensuales recurrentes</div>
                {[
                  ["Alquiler Mario Ribas","~1.900€/mes","(22.840€/año estimado)"],
                  ["Intereses préstamo Detlef","~875€/mes","(basado en pagos históricos)"],
                  ["Fit-Maker (desde agosto)","4.305€/mes","41 cuotas hasta 2029"],
                  ["TOTAL carga fija deuda","~7.080€/mes","solo compromisos financieros"],
                ].map(([l,v,n])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.05)",fontSize:12}}>
                    <span style={{color:"#9ca3af"}}>{l}</span>
                    <div style={{textAlign:"right"}}>
                      <span style={{color:"#ef4444",fontWeight:700}}>{v}</span>
                      <span style={{color:"#4b5563",fontSize:10,marginLeft:8}}>{n}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ OPEX ══ */}
          {tab==="opex"&&(
            <div style={{animation:"fadeUp 0.3s ease"}}>
              <div style={{marginBottom:18}}>
                <h2 style={{fontFamily:"'Fraunces',serif",fontSize:20,color:"#f1f5f9",marginBottom:4}}>OPEX — Gastos operativos</h2>
                <p style={{color:"#4b5563",fontSize:12}}>Fijo: {fmt(GASTOS_DATA.OPEX_FIJO.total)}€ · Variable: {fmt(GASTOS_DATA.OPEX_VAR.total)}€ · Base mayo-junio (2 meses)</p>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
                {/* OPEX Fijo */}
                <div>
                  <div style={{color:"#f97316",fontWeight:700,fontSize:13,marginBottom:10}}>📋 OPEX Fijo — {fmt(GASTOS_DATA.OPEX_FIJO.total)}€</div>
                  <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,overflow:"hidden"}}>
                    <table>
                      <thead><tr><th>Concepto</th><th>Total</th><th>Est. mensual</th></tr></thead>
                      <tbody>
                        {Object.entries(GASTOS_DATA.OPEX_FIJO.subcategorias)
                          .sort((a,b)=>b[1].total-a[1].total)
                          .map(([k,v])=>(
                          <tr key={k}>
                            <td style={{color:"#f1f5f9"}}>{k}</td>
                            <td style={{color:"#f97316",fontWeight:700}}>{fmt(v.total)}€</td>
                            <td style={{color:"#9ca3af"}}>{fmt(v.total/2)}€</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{padding:"8px 14px",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",justifyContent:"space-between",fontSize:11}}>
                      <span style={{color:"#6b7280"}}>Total: <strong style={{color:"#f97316"}}>{fmt(GASTOS_DATA.OPEX_FIJO.total)}€</strong></span>
                      <span style={{color:"#6b7280"}}>~{fmt(GASTOS_DATA.OPEX_FIJO.total/2)}€/mes</span>
                    </div>
                  </div>
                </div>

                {/* OPEX Variable */}
                <div>
                  <div style={{color:"#eab308",fontWeight:700,fontSize:13,marginBottom:10}}>📦 OPEX Variable — {fmt(GASTOS_DATA.OPEX_VAR.total)}€</div>
                  <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,overflow:"hidden"}}>
                    <table>
                      <thead><tr><th>Concepto</th><th>Total</th><th>Movimientos</th></tr></thead>
                      <tbody>
                        {Object.entries(GASTOS_DATA.OPEX_VAR.subcategorias)
                          .sort((a,b)=>b[1].total-a[1].total)
                          .map(([k,v])=>(
                          <tr key={k}>
                            <td style={{color:"#f1f5f9"}}>{k}</td>
                            <td style={{color:"#eab308",fontWeight:700}}>{fmt(v.total)}€</td>
                            <td style={{color:"#6b7280"}}>{v.n}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{padding:"8px 14px",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",justifyContent:"space-between",fontSize:11}}>
                      <span style={{color:"#6b7280"}}>Total: <strong style={{color:"#eab308"}}>{fmt(GASTOS_DATA.OPEX_VAR.total)}€</strong></span>
                      <span style={{color:"#6b7280"}}>~{fmt(GASTOS_DATA.OPEX_VAR.total/2)}€/mes</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{background:"rgba(57,208,216,0.05)",border:"1px solid rgba(57,208,216,0.2)",borderRadius:12,padding:"16px 20px"}}>
                <div style={{color:BRAND,fontWeight:700,fontSize:13,marginBottom:12}}>💡 OPEX mensual estimado en régimen normal</div>
                {[
                  ["OPEX Fijo (servicios recurrentes)","~2.992€/mes","alarma, telefonía, software, gestoría..."],
                  ["OPEX Variable (operaciones)","~1.000-3.000€/mes","Amazon, materiales, varios (muy variable)"],
                  ["TOTAL OPEX operativo","~4.000-6.000€/mes","sin incluir deuda ni CAPEX"],
                  ["+ Carga deuda","~7.080€/mes","alquiler + intereses + Fit-Maker (desde ago)"],
                  ["= COSTE TOTAL MENSUAL","~11.000-13.000€/mes","punto de partida para calcular breakeven"],
                ].map(([l,v,n],i)=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.05)",fontSize:12}}>
                    <span style={{color: i===4?"#f1f5f9":"#9ca3af",fontWeight:i===4?700:400}}>{l}</span>
                    <div style={{textAlign:"right"}}>
                      <span style={{color:i===4?BRAND:"#f1f5f9",fontWeight:700}}>{v}</span>
                      <span style={{color:"#4b5563",fontSize:10,marginLeft:8}}>{n}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ PROYECCIÓN ══ */}
          {tab==="proyeccion"&&(
            <div style={{animation:"fadeUp 0.3s ease"}}>
              <div style={{marginBottom:18}}>
                <h2 style={{fontFamily:"'Fraunces',serif",fontSize:20,color:"#f1f5f9",marginBottom:4}}>Proyección y breakeven</h2>
                <p style={{color:"#4b5563",fontSize:12}}>Basado en estructura de costes real extraída del banco</p>
              </div>

              {/* Breakeven calc */}
              <div style={{background:"rgba(57,208,216,0.05)",border:"1px solid rgba(57,208,216,0.2)",borderRadius:14,padding:"22px 24px",marginBottom:16}}>
                <div style={{color:BRAND,fontWeight:700,fontSize:15,marginBottom:16}}>📐 Cálculo de breakeven mensual</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
                  <div>
                    <div style={{color:"#9ca3af",fontSize:11,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Costes fijos mensuales (régimen normal)</div>
                    {[
                      ["Alquiler (Mario Ribas)","~1.900€"],
                      ["Intereses préstamo","~875€"],
                      ["Fit-Maker (desde ago)","4.305€"],
                      ["OPEX fijo (servicios)","~2.992€"],
                      ["Total costes fijos","~10.072€"],
                    ].map(([l,v],i)=>(
                      <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.05)",fontSize:12}}>
                        <span style={{color:i===4?"#f1f5f9":"#9ca3af",fontWeight:i===4?700:400}}>{l}</span>
                        <span style={{color:i===4?BRAND:"#f1f5f9",fontWeight:i===4?700:400}}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{color:"#9ca3af",fontSize:11,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Ingresos necesarios para cubrir costes</div>
                    {[
                      ["Precio medio socio","~65€/mes"],
                      ["Para cubrir 10.072€","155 socios"],
                      ["Socios actuales","161 ✓"],
                      ["Margen con 161 socios","~+378€/mes"],
                      ["Con OPEX variable (-2k€)","~-1.622€/mes"],
                    ].map(([l,v],i)=>(
                      <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.05)",fontSize:12}}>
                        <span style={{color:i===4?"#f1f5f9":"#9ca3af",fontWeight:i===4?700:400}}>{l}</span>
                        <span style={{color:i===2?"#22c55e":i===3?"#22c55e":i===4?"#f97316":"#f1f5f9",fontWeight:i>=2?700:400}}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{background:"rgba(34,197,94,0.05)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:12,padding:"16px 20px",marginBottom:12}}>
                <div style={{color:"#22c55e",fontWeight:700,fontSize:13,marginBottom:10}}>✓ Conclusión — estás en el umbral</div>
                <div style={{color:"#9ca3af",fontSize:12,lineHeight:1.7}}>
                  Con <strong style={{color:"#f1f5f9"}}>161 socios a 65€ = 10.465€/mes</strong> de ingresos brutos, cubres los costes fijos de <strong style={{color:"#f1f5f9"}}>~10.072€</strong>.
                  El margen es ajustado porque el OPEX variable (Amazon, materiales, catering) añade ~2.000€ más.
                  <br/><br/>
                  <strong style={{color:"#22c55e"}}>Para tener caja positiva necesitas:</strong>
                  <br/>• +30 socios más (191 socios) → ~2.000€/mes de margen limpio, o
                  <br/>• Reducir OPEX variable (Amazon, catering, alquiler coche) en ~1.500€/mes
                </div>
              </div>

              <div style={{background:"rgba(234,179,8,0.05)",border:"1px solid rgba(234,179,8,0.2)",borderRadius:12,padding:"16px 20px"}}>
                <div style={{color:"#eab308",fontWeight:700,fontSize:13,marginBottom:10}}>⚠️ Alerta agosto 2026</div>
                <div style={{color:"#9ca3af",fontSize:12,lineHeight:1.7}}>
                  En agosto empieza la cuota de Fit-Maker de <strong style={{color:"#ef4444"}}>4.305€/mes</strong>. Esto añade 4.305€ a los costes fijos mensuales.
                  Para absorberlo sin perder caja necesitas llegar a <strong style={{color:"#eab308"}}>~220-230 socios</strong> antes de agosto, o tener reserva de liquidez de ~25.000€.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

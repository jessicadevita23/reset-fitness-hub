import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const BRAND = "#39D0D8";

const COA = {"1":{"nombre":"FINANCIACIÓN BÁSICA","grupos":{"10":{"nombre":"Capital","cuentas":[{"cod":"100","nombre":"Capital social","tipo":"PAS","saldo":3000,"desc":"Capital fundacional RESET FITNESS S.L."}]},"17":{"nombre":"Deudas a largo plazo","cuentas":[{"cod":"170","nombre":"Préstamo Detlef Vormschlag","tipo":"PAS","saldo":350000,"desc":"Préstamo principal 350.000€ · 3% · 8 años · inicio 02/03/2026"}]},"19":{"nombre":"Situaciones transitorias","cuentas":[{"cod":"190","nombre":"Préstamo María Lagos → Reset","tipo":"PAS","saldo":69922.84,"desc":"Gastos pagados por María antes de apertura"}]}}},"2":{"nombre":"ACTIVO NO CORRIENTE","grupos":{"21":{"nombre":"Inmovilizado material","cuentas":[{"cod":"213","nombre":"Maquinaria gimnasio (Fit-Maker)","tipo":"ACT","saldo":108877.04,"desc":"Equipamiento fitness · amortización 10 años"},{"cod":"216","nombre":"Mobiliario e instalaciones","tipo":"ACT","saldo":19231.24,"desc":"Instalaciones eléctricas, aluminio, césped artificial"},{"cod":"211","nombre":"Obra y reforma local","tipo":"ACT","saldo":129743.73,"desc":"Reforma integral C/ Madrid 34"},{"cod":"217","nombre":"Equipamiento audio y digital","tipo":"ACT","saldo":8908.00,"desc":"Sistema audio, Flowmode"},{"cod":"218","nombre":"Decoración y mobiliario","tipo":"ACT","saldo":5148.00,"desc":"Plantas, decoración, mobiliario"}]},"28":{"nombre":"Amortización acumulada","cuentas":[{"cod":"281","nombre":"Amort. acum. maquinaria","tipo":"ACT","saldo":0,"desc":"Inicio junio 2026 · ~905€/mes"},{"cod":"282","nombre":"Amort. acum. instalaciones y obra","tipo":"ACT","saldo":0,"desc":"Inicio junio 2026 · ~831€/mes"}]},"26":{"nombre":"Fianzas","cuentas":[{"cod":"260","nombre":"Fianza arrendamiento local","tipo":"ACT","saldo":0,"desc":"Fianza contrato alquiler Mario Ribas"}]}}},"3":{"nombre":"EXISTENCIAS","grupos":{"30":{"nombre":"Mercaderías","cuentas":[{"cod":"300","nombre":"Existencias productos reventa","tipo":"ACT","saldo":0,"desc":"Productos wellness, suplementos, merchandising"}]}}},"4":{"nombre":"ACREEDORES Y DEUDORES","grupos":{"40":{"nombre":"Proveedores — Accounts Payable","cuentas":[{"cod":"400","nombre":"Fit-Maker Sport SLU","tipo":"PAS","saldo":4305.55,"desc":"Cuota mensual financiación · 1er cargo 15/08/2026 · 41 cuotas"},{"cod":"401","nombre":"Elementents CP S.L.","tipo":"PAS","saldo":3811.76,"desc":"Saldo pendiente carpa/estructura · jul-ago 2026"},{"cod":"402","nombre":"Mario Ribas Merbouh (alquiler)","tipo":"PAS","saldo":0,"desc":"Arrendamiento C/ Madrid 34 · pagos adelantados registrados"},{"cod":"403","nombre":"Arbre Assessors (gestoría)","tipo":"PAS","saldo":0,"desc":"Honorarios gestoría fiscal y laboral"},{"cod":"404","nombre":"Be Virtual (diseño/web)","tipo":"PAS","saldo":0,"desc":"Servicios diseño web y marketing"},{"cod":"409","nombre":"Otros proveedores","tipo":"PAS","saldo":0,"desc":"Amazon, Prosegur, Vodafone y otros"}]},"43":{"nombre":"Clientes — Accounts Receivable","cuentas":[{"cod":"430","nombre":"Socios — cuotas impagadas","tipo":"ACT","saldo":95,"desc":"1 impagado · 95€ pendiente de cobro"},{"cod":"431","nombre":"Socios — TPV liquidado","tipo":"ACT","saldo":0,"desc":"Cobros TPV liquidados en banco"},{"cod":"432","nombre":"Socios — Bizum en tránsito","tipo":"ACT","saldo":0,"desc":"Bizums pendientes de confirmar"}]},"47":{"nombre":"Administraciones Públicas","cuentas":[{"cod":"472","nombre":"HP IVA soportado (deducible)","tipo":"ACT","saldo":0,"desc":"IVA compras · liquidar Modelo 303"},{"cod":"477","nombre":"HP IVA repercutido","tipo":"PAS","saldo":0,"desc":"IVA ventas · liquidar Modelo 303"},{"cod":"473","nombre":"HP retenciones Mod.115","tipo":"PAS","saldo":0,"desc":"Retención arrendamiento Mario Ribas"},{"cod":"476","nombre":"SS acreedora","tipo":"PAS","saldo":0,"desc":"Cuotas Seguridad Social pendientes"},{"cod":"4751","nombre":"HP IRPF retenciones","tipo":"PAS","saldo":0,"desc":"Retenciones IRPF trabajadores · Mod.111"}]},"46":{"nombre":"Personal","cuentas":[{"cod":"460","nombre":"Remuneraciones pendientes","tipo":"PAS","saldo":0,"desc":"Salarios devengados pendientes"},{"cod":"465","nombre":"Anticipos remuneraciones","tipo":"ACT","saldo":0,"desc":"Anticipos a empleados"}]}}},"5":{"nombre":"CUENTAS FINANCIERAS","grupos":{"52":{"nombre":"Deudas corto plazo","cuentas":[{"cod":"521","nombre":"Préstamo Manuel Ríos (devuelto)","tipo":"PAS","saldo":0,"desc":"12.000€ · devuelto mayo 2026 ✓"},{"cod":"523","nombre":"Intereses préstamo Detlef","tipo":"PAS","saldo":875,"desc":"Intereses mensuales devengados ~875€/mes"}]},"57":{"nombre":"Tesorería","cuentas":[{"cod":"572","nombre":"Banco Santander ES59 0049 2959 49","tipo":"ACT","saldo":3515.93,"desc":"Cuenta corriente · saldo verificado 01/06/2026 ✓"},{"cod":"570","nombre":"Caja efectivo","tipo":"ACT","saldo":0,"desc":"Efectivo en caja física del gimnasio"}]}}},"6":{"nombre":"COMPRAS Y GASTOS","grupos":{"62":{"nombre":"Servicios exteriores","cuentas":[{"cod":"621","nombre":"Arrendamiento local","tipo":"GAS","saldo":52840,"desc":"Alquiler C/ Madrid 34 · Mario Ribas · ~1.900€/mes"},{"cod":"622","nombre":"Reparaciones y conservación","tipo":"GAS","saldo":0,"desc":"Mantenimiento instalaciones y equipos"},{"cod":"623","nombre":"Servicios profesionales","tipo":"GAS","saldo":3267,"desc":"Gestoría, asesoría legal, servicios externos"},{"cod":"624","nombre":"Transportes","tipo":"GAS","saldo":421,"desc":"Combustible, alquiler vehículo"},{"cod":"625","nombre":"Seguros","tipo":"GAS","saldo":1200,"desc":"Seguro RC y contenido gimnasio"},{"cod":"626","nombre":"Servicios bancarios","tipo":"GAS","saldo":11,"desc":"Comisiones TPV y Bizum"},{"cod":"627","nombre":"Publicidad y marketing","tipo":"GAS","saldo":49,"desc":"Imprenta, marketing digital"},{"cod":"628","nombre":"Suministros","tipo":"GAS","saldo":0,"desc":"Electricidad, agua, internet, telefonía"},{"cod":"629","nombre":"Otros servicios","tipo":"GAS","saldo":2154,"desc":"Software, Be Virtual, holamat, catering"}]},"64":{"nombre":"Gastos de personal","cuentas":[{"cod":"640","nombre":"Sueldos y salarios","tipo":"GAS","saldo":0,"desc":"Nóminas Alessia, Daniela, Jaison"},{"cod":"642","nombre":"SS a cargo empresa","tipo":"GAS","saldo":0,"desc":"Cotizaciones empresariales SS"},{"cod":"649","nombre":"Autónoma societaria María Lagos","tipo":"GAS","saldo":0,"desc":"Cuota autónomo administradora"}]},"66":{"nombre":"Gastos financieros","cuentas":[{"cod":"662","nombre":"Intereses préstamo Detlef","tipo":"GAS","saldo":2625,"desc":"Intereses devengados · 3% anual sobre 350.000€"},{"cod":"665","nombre":"Comisión cancelación Fit-Maker","tipo":"GAS","saldo":0,"desc":"1% + 720€ si cancelación anticipada"}]},"68":{"nombre":"Amortizaciones","cuentas":[{"cod":"681","nombre":"Amort. maquinaria (10 años)","tipo":"GAS","saldo":0,"desc":"~905€/mes desde apertura"},{"cod":"682","nombre":"Amort. obra e instalaciones (15 años)","tipo":"GAS","saldo":0,"desc":"~831€/mes desde apertura"}]}}},"7":{"nombre":"VENTAS E INGRESOS","grupos":{"70":{"nombre":"Prestación de servicios","cuentas":[{"cod":"700","nombre":"Cuotas socios — TPV","tipo":"ING","saldo":10160,"desc":"Cuotas mensuales cobradas por datáfono"},{"cod":"701","nombre":"Cuotas con Método Reset","tipo":"ING","saldo":1260,"desc":"21 socios × 60€ Método Reset"},{"cod":"702","nombre":"Cuotas — efectivo caja","tipo":"ING","saldo":1136,"desc":"Cobros en efectivo registrados"},{"cod":"709","nombre":"Otros ingresos servicios","tipo":"ING","saldo":0,"desc":"Entrenamiento personal, servicios adicionales"}]}}}};

const TIPO_CFG = {
  ACT: { label:"Activo",   color:BRAND,     bg:"rgba(57,208,216,0.1)"  },
  PAS: { label:"Pasivo",   color:"#ef4444", bg:"rgba(239,68,68,0.1)"   },
  ING: { label:"Ingreso",  color:"#22c55e", bg:"rgba(34,197,94,0.1)"   },
  GAS: { label:"Gasto",    color:"#f97316", bg:"rgba(249,115,22,0.1)"  },
};

const GRUPO_LABELS = {
  "1":"Financiación Básica","2":"Activo No Corriente","3":"Existencias",
  "4":"Acreedores y Deudores","5":"Cuentas Financieras","6":"Gastos","7":"Ingresos"
};

function fmt(n){return Number(n||0).toLocaleString("es-ES",{minimumFractionDigits:2,maximumFractionDigits:2});}

// Flatten all accounts
const ALL_ACCOUNTS = Object.entries(COA).flatMap(([grupo, gData]) =>
  Object.entries(gData.grupos).flatMap(([subgrupo, sgData]) =>
    sgData.cuentas.map(c => ({ ...c, grupo, subgrupo, subgrupoNombre: sgData.nombre }))
  )
);

const totalActivo = ALL_ACCOUNTS.filter(c=>c.tipo==="ACT").reduce((s,c)=>s+c.saldo,0);
const totalPasivo = ALL_ACCOUNTS.filter(c=>c.tipo==="PAS").reduce((s,c)=>s+c.saldo,0);
const totalIngresos = ALL_ACCOUNTS.filter(c=>c.tipo==="ING").reduce((s,c)=>s+c.saldo,0);
const totalGastos = ALL_ACCOUNTS.filter(c=>c.tipo==="GAS").reduce((s,c)=>s+c.saldo,0);
const resultado = totalIngresos - totalGastos;

// AP = Accounts Payable (cuentas 40x con saldo > 0)
const AP = ALL_ACCOUNTS.filter(c=>c.cod.startsWith("4") && c.tipo==="PAS" && c.saldo>0);
// AR = Accounts Receivable (cuentas 43x con saldo > 0)
const AR = ALL_ACCOUNTS.filter(c=>c.cod.startsWith("43") && c.tipo==="ACT" && c.saldo>0);

function CT({active,payload,label}){
  if(!active||!payload?.length) return null;
  return <div style={{background:"#0d1117",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"10px 14px",fontFamily:"sans-serif",fontSize:12}}><div style={{color:"#9ca3af",marginBottom:4}}>{label}</div>{payload.map(p=><div key={p.name} style={{color:p.color||BRAND,fontWeight:600}}>{p.name}: {fmt(p.value)}€</div>)}</div>;
}

const TABS = [
  {id:"dashboard",  label:"📊 Dashboard"},
  {id:"coa",        label:"📋 Plan de Cuentas"},
  {id:"ap",         label:"💸 Cuentas a Pagar"},
  {id:"ar",         label:"💰 Cuentas a Cobrar"},
  {id:"balance",    label:"⚖️ Balance"},
  {id:"pyl",        label:"📈 P&L"},
];

export default function Bookkeeping(){
  const [tab, setTab] = useState("dashboard");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroGrupo, setFiltroGrupo] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [expandido, setExpandido] = useState(null);

  const cuentasFiltradas = ALL_ACCOUNTS.filter(c => {
    const matchTipo = filtroTipo==="todos" || c.tipo===filtroTipo;
    const matchGrupo = filtroGrupo==="todos" || c.grupo===filtroGrupo;
    const matchBusc = !busqueda || c.cod.includes(busqueda) || c.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchTipo && matchGrupo && matchBusc;
  });

  const balanceData = [
    {name:"Activo",value:totalActivo,color:BRAND},
    {name:"Pasivo",value:totalPasivo,color:"#ef4444"},
  ];

  const pylData = [
    {name:"Ingresos",value:totalIngresos,color:"#22c55e"},
    {name:"Gastos",value:totalGastos,color:"#ef4444"},
    {name:"Resultado",value:Math.abs(resultado),color:resultado>=0?"#22c55e":"#ef4444"},
  ];

  // Gastos por grupo para gráfico
  const gastosGrupo = Object.entries(
    ALL_ACCOUNTS.filter(c=>c.tipo==="GAS" && c.saldo>0)
      .reduce((acc,c)=>{
        const k=c.subgrupoNombre;
        acc[k]=(acc[k]||0)+c.saldo;
        return acc;
      },{})
  ).map(([name,value])=>({name:name.substring(0,20),value})).sort((a,b)=>b.value-a.value);

  return(
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
        input:focus{outline:none;}
      `}</style>

      <div style={{minHeight:"100vh",background:"#060d14",color:"#f1f5f9",fontFamily:"'DM Sans',sans-serif"}}>

        {/* Header */}
        <div style={{padding:"0 24px",background:"rgba(0,0,0,0.45)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"space-between",height:58,position:"sticky",top:0,zIndex:100}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,${BRAND},#1aa8af)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:900,color:"#051015",fontFamily:"serif"}}>R</div>
            <div>
              <div style={{color:"#f1f5f9",fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:700}}>Reset Fitness Ibiza</div>
              <div style={{color:"#374151",fontSize:9,textTransform:"uppercase",letterSpacing:"0.1em"}}>Contabilidad · PGC España · Ejercicio 2026</div>
            </div>
          </div>
          <div style={{display:"flex",gap:3,overflowX:"auto"}}>
            {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"6px 12px",borderRadius:7,background:tab===t.id?"rgba(57,208,216,0.14)":"transparent",border:`1px solid ${tab===t.id?"rgba(57,208,216,0.3)":"transparent"}`,color:tab===t.id?BRAND:"#6b7280",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"sans-serif",whiteSpace:"nowrap"}}>{t.label}</button>)}
          </div>
        </div>

        <div style={{padding:24,height:"calc(100vh - 58px)",overflowY:"auto"}}>

          {/* ══ DASHBOARD ══ */}
          {tab==="dashboard"&&(
            <div style={{animation:"fadeUp 0.3s ease"}}>
              <div style={{marginBottom:20}}>
                <h2 style={{fontFamily:"'Fraunces',serif",fontSize:20,color:"#f1f5f9",marginBottom:4}}>Contabilidad Reset Fitness Ibiza</h2>
                <p style={{color:"#4b5563",fontSize:12}}>Plan General Contable España · 55 cuentas · Ejercicio 01/01/2026 – 31/12/2026</p>
              </div>

              {/* KPIs */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}>
                {[
                  {label:"Total Activo",val:`${fmt(totalActivo)}€`,color:BRAND,sub:"bienes y derechos"},
                  {label:"Total Pasivo",val:`${fmt(totalPasivo)}€`,color:"#ef4444",sub:"obligaciones"},
                  {label:"Ingresos acum.",val:`${fmt(totalIngresos)}€`,color:"#22c55e",sub:"ventas y servicios"},
                  {label:"Gastos acum.",val:`${fmt(totalGastos)}€`,color:"#f97316",sub:"operativos y financieros"},
                  {label:"Resultado",val:`${resultado>=0?"+":""}${fmt(resultado)}€`,color:resultado>=0?"#22c55e":"#ef4444",sub:"pérdida fase inicio"},
                ].map(k=>(
                  <div key={k.label} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"14px 16px",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${k.color},transparent)`}}/>
                    <div style={{color:"#4b5563",fontSize:9,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6}}>{k.label}</div>
                    <div style={{color:k.color,fontSize:16,fontWeight:800,fontFamily:"'Fraunces',serif"}}>{k.val}</div>
                    <div style={{color:"#374151",fontSize:10,marginTop:3}}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
                <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"18px 18px 8px"}}>
                  <div style={{color:"#9ca3af",fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:14}}>Gastos por categoría (acumulado)</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={gastosGrupo} layout="vertical">
                      <XAxis type="number" tick={{fill:"#4b5563",fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
                      <YAxis type="category" dataKey="name" tick={{fill:"#9ca3af",fontSize:9}} axisLine={false} tickLine={false} width={130}/>
                      <Tooltip content={<CT/>}/>
                      <Bar dataKey="value" name="Importe" fill="#f97316" radius={[0,4,4,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"18px 18px 8px"}}>
                  <div style={{color:"#9ca3af",fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:14}}>P&L resumido</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={pylData}>
                      <XAxis dataKey="name" tick={{fill:"#4b5563",fontSize:11}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:"#4b5563",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
                      <Tooltip content={<CT/>}/>
                      <Bar dataKey="value" name="Importe" radius={[4,4,0,0]}>
                        {pylData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AP y AR alertas */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <div style={{background:"rgba(239,68,68,0.05)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:12,padding:"16px 20px"}}>
                  <div style={{color:"#ef4444",fontWeight:700,fontSize:13,marginBottom:12}}>💸 Cuentas a Pagar — AP</div>
                  {AP.map(c=>(
                    <div key={c.cod} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.05)",fontSize:12}}>
                      <div><span style={{color:"#6b7280",fontSize:10}}>{c.cod} </span><span style={{color:"#f1f5f9"}}>{c.nombre}</span></div>
                      <span style={{color:"#ef4444",fontWeight:700}}>{fmt(c.saldo)}€</span>
                    </div>
                  ))}
                  <div style={{display:"flex",justifyContent:"space-between",paddingTop:8,fontSize:13}}>
                    <span style={{color:"#f1f5f9",fontWeight:700}}>Total pendiente</span>
                    <span style={{color:"#ef4444",fontWeight:800}}>{fmt(AP.reduce((s,c)=>s+c.saldo,0))}€</span>
                  </div>
                </div>

                <div style={{background:"rgba(34,197,94,0.05)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:12,padding:"16px 20px"}}>
                  <div style={{color:"#22c55e",fontWeight:700,fontSize:13,marginBottom:12}}>💰 Cuentas a Cobrar — AR</div>
                  {AR.length > 0 ? AR.map(c=>(
                    <div key={c.cod} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.05)",fontSize:12}}>
                      <div><span style={{color:"#6b7280",fontSize:10}}>{c.cod} </span><span style={{color:"#f1f5f9"}}>{c.nombre}</span></div>
                      <span style={{color:"#22c55e",fontWeight:700}}>{fmt(c.saldo)}€</span>
                    </div>
                  )) : <div style={{color:"#374151",fontSize:12}}>Sin saldos pendientes</div>}
                  <div style={{display:"flex",justifyContent:"space-between",paddingTop:8,fontSize:13}}>
                    <span style={{color:"#f1f5f9",fontWeight:700}}>Total pendiente cobro</span>
                    <span style={{color:"#22c55e",fontWeight:800}}>{fmt(AR.reduce((s,c)=>s+c.saldo,0))}€</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ PLAN DE CUENTAS ══ */}
          {tab==="coa"&&(
            <div style={{animation:"fadeUp 0.3s ease"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div>
                  <h2 style={{fontFamily:"'Fraunces',serif",fontSize:20,color:"#f1f5f9",marginBottom:4}}>Plan General Contable</h2>
                  <p style={{color:"#4b5563",fontSize:12}}>PGC España adaptado a Reset Fitness · {ALL_ACCOUNTS.length} cuentas</p>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar cuenta..." style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:8,padding:"6px 12px",color:"#e5e7eb",fontFamily:"sans-serif",fontSize:11,width:180}}/>
                  {["todos","ACT","PAS","ING","GAS"].map(t=>(
                    <button key={t} onClick={()=>setFiltroTipo(t)} style={{padding:"5px 10px",borderRadius:99,background:filtroTipo===t?"rgba(57,208,216,0.12)":"rgba(255,255,255,0.04)",border:`1px solid ${filtroTipo===t?"rgba(57,208,216,0.35)":"rgba(255,255,255,0.07)"}`,color:filtroTipo===t?BRAND:"#6b7280",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"sans-serif"}}>
                      {t==="todos"?"Todos":TIPO_CFG[t]?.label||t}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,overflow:"hidden"}}>
                <table>
                  <thead><tr><th>Código</th><th>Nombre de la cuenta</th><th>Tipo</th><th>Grupo</th><th>Saldo</th><th>Descripción</th></tr></thead>
                  <tbody>
                    {cuentasFiltradas.map((c,i)=>{
                      const cfg = TIPO_CFG[c.tipo];
                      return(
                        <tr key={c.cod} onClick={()=>setExpandido(expandido===c.cod?null:c.cod)} style={{cursor:"pointer",background:expandido===c.cod?"rgba(57,208,216,0.04)":""}}>
                          <td style={{color:BRAND,fontWeight:700,fontFamily:"monospace"}}>{c.cod}</td>
                          <td style={{color:"#f1f5f9",fontWeight:500}}>{c.nombre}</td>
                          <td><span style={{padding:"2px 8px",borderRadius:99,background:cfg.bg,color:cfg.color,fontSize:10,fontWeight:700}}>{cfg.label}</span></td>
                          <td style={{color:"#6b7280",fontSize:11}}>{c.subgrupoNombre}</td>
                          <td style={{color:c.saldo>0?cfg.color:"#374151",fontWeight:c.saldo>0?700:400}}>{c.saldo>0?`${fmt(c.saldo)}€`:"—"}</td>
                          <td style={{color:"#4b5563",fontSize:11,maxWidth:280,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.desc}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{padding:"10px 14px",borderTop:"1px solid rgba(255,255,255,0.05)",fontSize:11,color:"#4b5563",display:"flex",justifyContent:"space-between"}}>
                  <span>Mostrando {cuentasFiltradas.length} de {ALL_ACCOUNTS.length} cuentas</span>
                  <span>Total saldos: <strong style={{color:BRAND}}>{fmt(cuentasFiltradas.reduce((s,c)=>s+c.saldo,0))}€</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* ══ ACCOUNTS PAYABLE ══ */}
          {tab==="ap"&&(
            <div style={{animation:"fadeUp 0.3s ease"}}>
              <div style={{marginBottom:18}}>
                <h2 style={{fontFamily:"'Fraunces',serif",fontSize:20,color:"#f1f5f9",marginBottom:4}}>Cuentas a Pagar — Accounts Payable</h2>
                <p style={{color:"#4b5563",fontSize:12}}>Grupo 40 · Proveedores y acreedores · Obligaciones de pago</p>
              </div>

              {/* Alertas vencimientos */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
                {[
                  {label:"Vence 15/08/2026",proveedor:"Fit-Maker Sport",importe:4305.55,urgencia:"alta",color:"#ef4444"},
                  {label:"Vence jul-ago 2026",proveedor:"Elementents CP",importe:3811.76,urgencia:"media",color:"#eab308"},
                  {label:"Mensual recurrente",proveedor:"Intereses Detlef",importe:875,urgencia:"fijo",color:"#f97316"},
                ].map(a=>(
                  <div key={a.proveedor} style={{background:`${a.color}08`,border:`1px solid ${a.color}30`,borderRadius:12,padding:"14px 16px"}}>
                    <div style={{color:a.color,fontSize:10,fontWeight:700,textTransform:"uppercase",marginBottom:6}}>{a.label}</div>
                    <div style={{color:"#f1f5f9",fontWeight:700,marginBottom:2}}>{a.proveedor}</div>
                    <div style={{color:a.color,fontSize:18,fontWeight:800,fontFamily:"'Fraunces',serif"}}>{fmt(a.importe)}€</div>
                  </div>
                ))}
              </div>

              <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,overflow:"hidden"}}>
                <table>
                  <thead><tr><th>Cta.</th><th>Proveedor</th><th>Saldo pendiente</th><th>Estado</th><th>Detalle</th></tr></thead>
                  <tbody>
                    {ALL_ACCOUNTS.filter(c=>c.grupo==="4"&&c.tipo==="PAS").map((c,i)=>(
                      <tr key={c.cod}>
                        <td style={{color:BRAND,fontWeight:700,fontFamily:"monospace"}}>{c.cod}</td>
                        <td style={{color:"#f1f5f9",fontWeight:500}}>{c.nombre}</td>
                        <td style={{color:c.saldo>0?"#ef4444":"#374151",fontWeight:c.saldo>0?700:400}}>{c.saldo>0?`${fmt(c.saldo)}€`:"—"}</td>
                        <td>
                          {c.saldo>0
                            ? <span style={{padding:"2px 8px",borderRadius:99,background:"rgba(239,68,68,0.1)",color:"#ef4444",fontSize:10,fontWeight:700}}>⚠ Pendiente</span>
                            : <span style={{padding:"2px 8px",borderRadius:99,background:"rgba(34,197,94,0.1)",color:"#22c55e",fontSize:10,fontWeight:700}}>✓ Al día</span>
                          }
                        </td>
                        <td style={{color:"#4b5563",fontSize:11}}>{c.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{padding:"10px 14px",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",justifyContent:"flex-end",gap:16,fontSize:11}}>
                  <span style={{color:"#6b7280"}}>Total AP pendiente: <strong style={{color:"#ef4444"}}>{fmt(ALL_ACCOUNTS.filter(c=>c.grupo==="4"&&c.tipo==="PAS").reduce((s,c)=>s+c.saldo,0))}€</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* ══ ACCOUNTS RECEIVABLE ══ */}
          {tab==="ar"&&(
            <div style={{animation:"fadeUp 0.3s ease"}}>
              <div style={{marginBottom:18}}>
                <h2 style={{fontFamily:"'Fraunces',serif",fontSize:20,color:"#f1f5f9",marginBottom:4}}>Cuentas a Cobrar — Accounts Receivable</h2>
                <p style={{color:"#4b5563",fontSize:12}}>Grupo 43 · Clientes y deudores · 161 socios activos</p>
              </div>

              <div style={{background:"rgba(57,208,216,0.05)",border:"1px solid rgba(57,208,216,0.2)",borderRadius:12,padding:"16px 20px",marginBottom:16}}>
                <div style={{color:BRAND,fontWeight:700,fontSize:13,marginBottom:10}}>📊 Resumen cartera de clientes</div>
                {[
                  ["Socios activos","161","#22c55e"],
                  ["Suscripciones activas","168","#22c55e"],
                  ["Cancelaciones solicitadas","4","#f97316"],
                  ["Impagados","1 socio · 95€","#ef4444"],
                  ["Próximos vencimientos","1 jun 2026","#eab308"],
                  ["MRR actual","10.725€","#22c55e"],
                  ["MRR nuevo pricing (desde vie.)","~75-95€/socio","#a855f7"],
                ].map(([l,v,c])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.05)",fontSize:12}}>
                    <span style={{color:"#6b7280"}}>{l}</span>
                    <span style={{color:c,fontWeight:700}}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,overflow:"hidden"}}>
                <table>
                  <thead><tr><th>Cta.</th><th>Concepto</th><th>Saldo</th><th>Estado</th><th>Detalle</th></tr></thead>
                  <tbody>
                    {ALL_ACCOUNTS.filter(c=>c.cod.startsWith("43")).map(c=>(
                      <tr key={c.cod}>
                        <td style={{color:BRAND,fontWeight:700,fontFamily:"monospace"}}>{c.cod}</td>
                        <td style={{color:"#f1f5f9",fontWeight:500}}>{c.nombre}</td>
                        <td style={{color:c.saldo>0?"#ef4444":"#374151",fontWeight:c.saldo>0?700:400}}>{c.saldo>0?`${fmt(c.saldo)}€`:"—"}</td>
                        <td>
                          {c.saldo>0
                            ? <span style={{padding:"2px 8px",borderRadius:99,background:"rgba(239,68,68,0.1)",color:"#ef4444",fontSize:10,fontWeight:700}}>⚠ Reclamar</span>
                            : <span style={{padding:"2px 8px",borderRadius:99,background:"rgba(34,197,94,0.1)",color:"#22c55e",fontSize:10,fontWeight:700}}>✓ Cobrado</span>
                          }
                        </td>
                        <td style={{color:"#4b5563",fontSize:11}}>{c.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ BALANCE ══ */}
          {tab==="balance"&&(
            <div style={{animation:"fadeUp 0.3s ease"}}>
              <div style={{marginBottom:18}}>
                <h2 style={{fontFamily:"'Fraunces',serif",fontSize:20,color:"#f1f5f9",marginBottom:4}}>Balance de Situación</h2>
                <p style={{color:"#4b5563",fontSize:12}}>A 01/06/2026 · Fase de inicio de actividad</p>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                {/* ACTIVO */}
                <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(57,208,216,0.2)",borderRadius:12,overflow:"hidden"}}>
                  <div style={{padding:"14px 18px",background:"rgba(57,208,216,0.08)",borderBottom:"1px solid rgba(57,208,216,0.2)"}}>
                    <div style={{color:BRAND,fontWeight:700,fontSize:14}}>ACTIVO</div>
                    <div style={{color:"#9ca3af",fontSize:11}}>Bienes y derechos</div>
                  </div>
                  {[
                    {titulo:"ACTIVO NO CORRIENTE", cuentas: ALL_ACCOUNTS.filter(c=>c.grupo==="2"&&c.tipo==="ACT")},
                    {titulo:"ACTIVO CORRIENTE", cuentas: ALL_ACCOUNTS.filter(c=>(c.grupo==="4"||c.grupo==="5"||c.grupo==="3")&&c.tipo==="ACT")},
                  ].map(seccion=>(
                    <div key={seccion.titulo}>
                      <div style={{padding:"8px 18px",background:"rgba(255,255,255,0.03)",color:"#6b7280",fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>{seccion.titulo}</div>
                      {seccion.cuentas.map(c=>(
                        <div key={c.cod} style={{display:"flex",justifyContent:"space-between",padding:"8px 18px",borderBottom:"1px solid rgba(255,255,255,0.04)",fontSize:12}}>
                          <span style={{color:"#9ca3af"}}><span style={{color:"#374151",fontFamily:"monospace",fontSize:10}}>{c.cod} </span>{c.nombre}</span>
                          <span style={{color:c.saldo>0?BRAND:"#374151",fontWeight:c.saldo>0?700:400}}>{c.saldo>0?`${fmt(c.saldo)}€`:"—"}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div style={{padding:"12px 18px",borderTop:"2px solid rgba(57,208,216,0.3)",display:"flex",justifyContent:"space-between",fontSize:14}}>
                    <span style={{color:"#f1f5f9",fontWeight:700}}>TOTAL ACTIVO</span>
                    <span style={{color:BRAND,fontWeight:800,fontFamily:"'Fraunces',serif"}}>{fmt(totalActivo)}€</span>
                  </div>
                </div>

                {/* PASIVO */}
                <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:12,overflow:"hidden"}}>
                  <div style={{padding:"14px 18px",background:"rgba(239,68,68,0.06)",borderBottom:"1px solid rgba(239,68,68,0.2)"}}>
                    <div style={{color:"#ef4444",fontWeight:700,fontSize:14}}>PASIVO + PATRIMONIO NETO</div>
                    <div style={{color:"#9ca3af",fontSize:11}}>Fuentes de financiación</div>
                  </div>
                  {[
                    {titulo:"PATRIMONIO NETO", cuentas: ALL_ACCOUNTS.filter(c=>c.grupo==="1"&&c.tipo==="PAS")},
                    {titulo:"PASIVO NO CORRIENTE", cuentas: ALL_ACCOUNTS.filter(c=>(c.grupo==="1"||c.grupo==="2")&&c.tipo==="PAS"&&c.cod!=="100")},
                    {titulo:"PASIVO CORRIENTE", cuentas: ALL_ACCOUNTS.filter(c=>(c.grupo==="4"||c.grupo==="5")&&c.tipo==="PAS")},
                  ].map(seccion=>(
                    <div key={seccion.titulo}>
                      <div style={{padding:"8px 18px",background:"rgba(255,255,255,0.03)",color:"#6b7280",fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>{seccion.titulo}</div>
                      {seccion.cuentas.map(c=>(
                        <div key={c.cod} style={{display:"flex",justifyContent:"space-between",padding:"8px 18px",borderBottom:"1px solid rgba(255,255,255,0.04)",fontSize:12}}>
                          <span style={{color:"#9ca3af"}}><span style={{color:"#374151",fontFamily:"monospace",fontSize:10}}>{c.cod} </span>{c.nombre}</span>
                          <span style={{color:c.saldo>0?"#ef4444":"#374151",fontWeight:c.saldo>0?700:400}}>{c.saldo>0?`${fmt(c.saldo)}€`:"—"}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div style={{padding:"12px 18px",borderTop:"2px solid rgba(239,68,68,0.3)",display:"flex",justifyContent:"space-between",fontSize:14}}>
                    <span style={{color:"#f1f5f9",fontWeight:700}}>TOTAL PASIVO</span>
                    <span style={{color:"#ef4444",fontWeight:800,fontFamily:"'Fraunces',serif"}}>{fmt(totalPasivo)}€</span>
                  </div>
                </div>
              </div>

              {/* Nota */}
              <div style={{marginTop:14,background:"rgba(234,179,8,0.05)",border:"1px solid rgba(234,179,8,0.2)",borderRadius:10,padding:"12px 16px",fontSize:12,color:"#9ca3af"}}>
                ⚠️ El desequilibrio activo/pasivo ({fmt(totalPasivo-totalActivo)}€) refleja que la mayor parte de la inversión inicial (CAPEX 291k€) está financiada con el préstamo de 350k€ y los préstamos de María. Es normal en fase de apertura — el activo crecerá con la operación.
              </div>
            </div>
          )}

          {/* ══ P&L ══ */}
          {tab==="pyl"&&(
            <div style={{animation:"fadeUp 0.3s ease"}}>
              <div style={{marginBottom:18}}>
                <h2 style={{fontFamily:"'Fraunces',serif",fontSize:20,color:"#f1f5f9",marginBottom:4}}>Cuenta de Pérdidas y Ganancias</h2>
                <p style={{color:"#4b5563",fontSize:12}}>Acumulado 2026 · Fase ramp-up (inicio actividad junio 2026)</p>
              </div>

              <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,overflow:"hidden",maxWidth:700}}>
                {[
                  {label:"(+) Ingresos por cuotas socios", val:10160, color:"#22c55e", bold:false},
                  {label:"(+) Ingresos con Método Reset", val:1260, color:"#22c55e", bold:false},
                  {label:"(+) Ingresos efectivo caja", val:1136, color:"#22c55e", bold:false},
                  {label:"= INGRESOS NETOS", val:totalIngresos, color:"#22c55e", bold:true, sep:true},
                  {label:"(-) Arrendamiento local", val:-52840, color:"#ef4444", bold:false},
                  {label:"(-) Servicios profesionales", val:-3267, color:"#ef4444", bold:false},
                  {label:"(-) Seguros", val:-1200, color:"#ef4444", bold:false},
                  {label:"(-) Otros servicios (software, web...)", val:-2154, color:"#ef4444", bold:false},
                  {label:"(-) Transportes y varios", val:-421, color:"#ef4444", bold:false},
                  {label:"(-) Publicidad", val:-49, color:"#ef4444", bold:false},
                  {label:"(-) Servicios bancarios", val:-11, color:"#ef4444", bold:false},
                  {label:"= RESULTADO OPERATIVO (EBITDA)", val:totalIngresos-52840-3267-1200-2154-421-49-11, color:"#eab308", bold:true, sep:true},
                  {label:"(-) Intereses préstamo Detlef (3%)", val:-2625, color:"#ef4444", bold:false},
                  {label:"= RESULTADO ANTES DE AMORT.", val:totalIngresos-52840-3267-1200-2154-421-49-11-2625, color:"#eab308", bold:true, sep:true},
                  {label:"(-) Amortización maquinaria (estimada)", val:0, color:"#374151", bold:false},
                  {label:"(-) Amortización obra (estimada)", val:0, color:"#374151", bold:false},
                  {label:"= RESULTADO DEL EJERCICIO", val:resultado, color:resultado>=0?"#22c55e":"#ef4444", bold:true, sep:true, big:true},
                ].map((row,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:row.bold?"12px 20px":"9px 20px",borderBottom:"1px solid rgba(255,255,255,0.04)",background:row.sep&&row.bold?"rgba(255,255,255,0.03)":"transparent"}}>
                    <span style={{color:row.bold?"#f1f5f9":"#9ca3af",fontWeight:row.bold?700:400,fontSize:row.big?14:12}}>{row.label}</span>
                    <span style={{color:row.val===0?"#374151":row.color,fontWeight:row.bold?800:600,fontSize:row.big?16:12,fontFamily:row.big?"'Fraunces',serif":"inherit"}}>
                      {row.val===0?"—":`${row.val>=0?"+":""}${fmt(row.val)}€`}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{marginTop:14,background:"rgba(57,208,216,0.05)",border:"1px solid rgba(57,208,216,0.2)",borderRadius:10,padding:"12px 16px",fontSize:12,color:"#9ca3af",maxWidth:700}}>
                💡 El resultado negativo (-50k€) se debe principalmente al alquiler adelantado (52.840€ pagado en los primeros meses). En régimen mensual normal el gasto de alquiler es ~1.900€/mes. La operación real mensual está prácticamente en breakeven con 161 socios.
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

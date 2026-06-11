import { useState, useRef, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const BRAND = "#39D0D8";

// ── PLAN DE CUENTAS ──────────────────────────────────────────────────────────
const COA_BASE = {
  "572": { nombre: "Banco Santander",               tipo: "ACT", saldo: 5608.82 },
  "570": { nombre: "Caja efectivo",                 tipo: "ACT", saldo: 3072.00 },
  "213": { nombre: "Maquinaria gimnasio",            tipo: "ACT", saldo: 108877.04 },
  "216": { nombre: "Mobiliario e instalaciones",     tipo: "ACT", saldo: 19231.24 },
  "211": { nombre: "Obra y reforma local",           tipo: "ACT", saldo: 129743.73 },
  "472": { nombre: "HP IVA soportado",               tipo: "ACT", saldo: 0 },
  "170": { nombre: "Préstamo Detlef Vormschlag",     tipo: "PAS", saldo: 350000 },
  "400": { nombre: "Fit-Maker Sport SLU",            tipo: "PAS", saldo: 9000 },
  "401": { nombre: "Elementents CP S.L.",            tipo: "PAS", saldo: 3811.76 },
  "402": { nombre: "Mario Ribas (alquiler)",         tipo: "PAS", saldo: 12490 },
  "403": { nombre: "Arbre Assessors",                tipo: "PAS", saldo: 242 },
  "404": { nombre: "Be Virtual",                    tipo: "PAS", saldo: 665.50 },
  "405": { nombre: "Dyfalum S.L.U.",                tipo: "PAS", saldo: 8707.13 },
  "406": { nombre: "Optima Audio S.L.U.",           tipo: "PAS", saldo: 2871.60 },
  "409": { nombre: "Otros proveedores",             tipo: "PAS", saldo: 0 },
  "476": { nombre: "SS acreedora (TGSS)",           tipo: "PAS", saldo: 695.09 },
  "477": { nombre: "HP IVA repercutido",            tipo: "PAS", saldo: 0 },
  "521": { nombre: "Préstamo M. Elena Paganini",    tipo: "PAS", saldo: 17000 },
  "621": { nombre: "Arrendamiento local",           tipo: "GAS", saldo: 42840 },
  "622": { nombre: "Reparaciones y conservación",   tipo: "GAS", saldo: 0 },
  "623": { nombre: "Servicios profesionales",       tipo: "GAS", saldo: 907.50 },
  "625": { nombre: "Seguros",                       tipo: "GAS", saldo: 651.56 },
  "628": { nombre: "Suministros y alarma",          tipo: "GAS", saldo: 65.17 },
  "629": { nombre: "Otros servicios (software/web)",tipo: "GAS", saldo: 665.50 },
  "640": { nombre: "Sueldos y salarios",            tipo: "GAS", saldo: 0 },
  "642": { nombre: "SS empresa",                    tipo: "GAS", saldo: 0 },
  "662": { nombre: "Intereses préstamos",           tipo: "GAS", saldo: 3500 },
  "700": { nombre: "Cuotas socios — TPV",           tipo: "ING", saldo: 7620 },
  "702": { nombre: "Cuotas socios — efectivo",      tipo: "ING", saldo: 7042 },
};

// ── REGLAS DE CLASIFICACIÓN (sin IA — basadas en texto del PDF) ──────────────
const CLASIFICAR = (texto, proveedor) => {
  const t = (texto + " " + proveedor).toLowerCase();
  if (/largal|instalac|aire acondicionado|climatizaci|bolet.n el.ctric/.test(t))
    return { gasto: "622", gastoNombre: "Reparaciones y conservación", prov: "409" };
  if (/dyfalum|aluminio|cristal|espejos/.test(t))
    return { gasto: "216", gastoNombre: "Mobiliario e instalaciones", prov: "405" };
  if (/optima audio|audio/.test(t))
    return { gasto: "216", gastoNombre: "Equipamiento audio", prov: "406" };
  if (/fit.maker|fitmaker|maquinaria|equipamiento gym/.test(t))
    return { gasto: "213", gastoNombre: "Maquinaria gimnasio", prov: "400" };
  if (/arbre|assessors|gest.r|asesori|contab|fiscal/.test(t))
    return { gasto: "623", gastoNombre: "Servicios profesionales", prov: "403" };
  if (/be virtual|virtual studio|dise.o|web|marketing digital/.test(t))
    return { gasto: "629", gastoNombre: "Otros servicios", prov: "404" };
  if (/intelinova|tgmanager|software|licencia/.test(t))
    return { gasto: "629", gastoNombre: "Otros servicios (software)", prov: "409" };
  if (/occident|seguros|seguro/.test(t))
    return { gasto: "625", gastoNombre: "Seguros", prov: "409" };
  if (/prosegur|alarma|seguridad/.test(t))
    return { gasto: "628", gastoNombre: "Suministros y alarma", prov: "409" };
  if (/mario ribas|alquiler|arrendamiento/.test(t))
    return { gasto: "621", gastoNombre: "Arrendamiento local", prov: "402" };
  if (/vassia|torres|reforma|obra|construc/.test(t))
    return { gasto: "211", gastoNombre: "Obra y reforma local", prov: "409" };
  if (/jomas|pintura|fco.*rubio/.test(t))
    return { gasto: "622", gastoNombre: "Reparaciones y conservación", prov: "409" };
  if (/jessica|devita|consultora|cfo/.test(t))
    return { gasto: "623", gastoNombre: "Servicios profesionales", prov: "409" };
  if (/n.mina|salario|sueldo|alesia|daniela/.test(t))
    return { gasto: "640", gastoNombre: "Sueldos y salarios", prov: "409" };
  if (/ss empresa|seguridad social|tgss/.test(t))
    return { gasto: "642", gastoNombre: "SS empresa", prov: "409" };
  if (/detlef|intereses|pr.stamo/.test(t))
    return { gasto: "662", gastoNombre: "Intereses préstamos", prov: "409" };
  if (/ferreteri|materiales|herramientas/.test(t))
    return { gasto: "622", gastoNombre: "Reparaciones y conservación", prov: "409" };
  if (/flowmode|tecnolog|digital/.test(t))
    return { gasto: "629", gastoNombre: "Otros servicios", prov: "409" };
  return { gasto: "629", gastoNombre: "Otros servicios", prov: "409" };
};

// ── PARSE NÚMERO FORMATO EUROPEO ─────────────────────────────────────────────
const parseEuro = (s) => {
  s = (s||"").trim().replace(/[€\s]/g,"");
  if (/^\d{1,3}(\.\d{3})*(,\d{2})?$/.test(s)) return parseFloat(s.replace(/\./g,"").replace(",","."));
  if (/^\d+(,\d{2})$/.test(s)) return parseFloat(s.replace(",","."));
  if (/^\d+\.\d{2}$/.test(s)) return parseFloat(s);
  return 0;
};

// ── EXTRAER IMPORTES DEL TEXTO ────────────────────────────────────────────────
const extraerImportes = (texto) => {
  const lines = texto.split("\n").map(l => l.trim()).filter(Boolean);
  let total = 0, base = 0, iva = 0, fecha = "", numero = "", proveedor = "";

  const PAT = /(?<![.\d])(\d{1,3}(?:\.\d{3})*,\d{2})(?!\d)|(?<![,\d])(\d{1,6}\.\d{2})(?!\d)/g;
  const extractNums = (line) => {
    const nums = []; let m; PAT.lastIndex = 0;
    while ((m = PAT.exec(line)) !== null) { const v = parseEuro(m[1]||m[2]); if(v>0) nums.push(v); }
    return nums;
  };

  for (const line of lines) {
    if (/\btotal\b/i.test(line)) {
      const nums = extractNums(line);
      const v = nums.length ? Math.max(...nums) : 0;
      if (v > total) total = v;
    }
  }
  for (const line of lines) {
    if (/subtotal|base\s*imp/i.test(line)) {
      const nums = extractNums(line);
      if (nums.length) { base = nums[0]; break; }
    }
  }
  for (const line of lines) {
    if (/\biva\b/i.test(line)) {
      const nums = extractNums(line).filter(v => v < 5000);
      if (nums.length) { iva = nums[0]; break; }
    }
  }
  if (total === 0) {
    const allNums = lines.flatMap(l => extractNums(l));
    if (allNums.length) total = Math.max(...allNums);
  }
  if (base === 0 && total > 0) base = parseFloat((total/1.21).toFixed(2));
  if (iva === 0 && base > 0)   iva  = parseFloat((total-base).toFixed(2));

  const mF = texto.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (mF) fecha = `${mF[1].padStart(2,"0")}/${mF[2].padStart(2,"0")}/${mF[3].length===2?"20"+mF[3]:mF[3]}`;

  const mN = texto.match(/(?:n[oº°]?\s*(?:de\s*)?factura|fra\.?|invoice)[:\s]+([A-Z0-9][A-Z0-9\/\-_]{2,20})/i);
  if (mN) numero = mN[1].trim();

  for (const line of lines.slice(0, 12)) {
    if (line.length > 5 && !/cif|nif|tel|fax|email|www|http|reset fitness|madrid|ibiza|factura|fecha|invoice/i.test(line) && !/^\d/.test(line)) {
      proveedor = line.substring(0,50).replace(/s\.l\.u?\.?/gi,"").trim();
      if (proveedor.length > 4) break;
    }
  }
  return { total, base, iva, fecha, numero, proveedor };
};

const TIPO_CFG = {
  ACT: { label: "Activo",  color: BRAND,      bg: "rgba(57,208,216,0.1)" },
  PAS: { label: "Pasivo",  color: "#ef4444",  bg: "rgba(239,68,68,0.1)"  },
  ING: { label: "Ingreso", color: "#22c55e",  bg: "rgba(34,197,94,0.1)"  },
  GAS: { label: "Gasto",   color: "#f97316",  bg: "rgba(249,115,22,0.1)" },
};

const TABS = [
  { id: "upload",    label: "📁 Subir Facturas" },
  { id: "dashboard", label: "📊 Dashboard" },
  { id: "asientos",  label: "📒 Libro Diario" },
  { id: "coa",       label: "📋 Plan Cuentas" },
  { id: "pyl",       label: "📈 P&L" },
];

function fmt(n) { return Number(n||0).toLocaleString("es-ES",{minimumFractionDigits:2,maximumFractionDigits:2}); }
function CT({ active, payload, label }) {
  if (!active||!payload?.length) return null;
  return <div style={{background:"#0d1117",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"10px 14px",fontSize:12}}>
    <div style={{color:"#9ca3af",marginBottom:4}}>{label}</div>
    {payload.map(p=><div key={p.name} style={{color:p.color||BRAND,fontWeight:600}}>{p.name}: {fmt(p.value)}€</div>)}
  </div>;
}

export default function Bookkeeping() {
  const [tab, setTab] = useState("upload");
  const [coa, setCoa] = useState(COA_BASE);
  const [asientos, setAsientos] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progreso, setProgreso] = useState([]);
  const [facturasExtraidas, setFacturasExtraidas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const allAccounts = Object.entries(coa).map(([cod,c])=>({cod,...c}));
  const totalActivo   = allAccounts.filter(c=>c.tipo==="ACT").reduce((s,c)=>s+c.saldo,0);
  const totalPasivo   = allAccounts.filter(c=>c.tipo==="PAS").reduce((s,c)=>s+c.saldo,0);
  const totalIngresos = allAccounts.filter(c=>c.tipo==="ING").reduce((s,c)=>s+c.saldo,0);
  const totalGastos   = allAccounts.filter(c=>c.tipo==="GAS").reduce((s,c)=>s+c.saldo,0);
  const resultado     = totalIngresos - totalGastos;

  const log = (msg, type="info") => setProgreso(p=>[...p,{msg,type,ts:Date.now()}]);

  // ── Leer texto de un PDF usando pdf.js (sin IA) ───────────────────────────
  const leerPDF = async (file) => {
    try {
      const pdfjsLib = window["pdfjs-dist/build/pdf"];
      if (!pdfjsLib) throw new Error("pdf.js no cargado");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let texto = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        texto += content.items.map(item => item.str).join(" ") + "\n";
      }
      return texto;
    } catch (err) {
      return "";
    }
  };

  // ── Procesar archivos ─────────────────────────────────────────────────────
  const procesarArchivos = async (files) => {
    setProcessing(true);
    setProgreso([]);
    setFacturasExtraidas([]);
    const todasFacturas = [];

    try {
      // Cargar librerías via script tag (más compatible)
      const loadScript = (src, check) => new Promise((res, rej) => {
        if (window[check]) return res();
        const s = document.createElement("script");
        s.src = src; s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });

      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js", "pdfjs-dist/build/pdf");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js", "JSZip");
      log("✅ pdf.js + JSZip cargados", "ok");

      for (const file of files) {
        if (file.name.endsWith(".zip")) {
          log(`📦 Procesando ZIP: ${file.name}`, "info");
          const JSZip = window.JSZip;
          const zip = await JSZip.loadAsync(file);
          const entries = Object.entries(zip.files).filter(([n,f]) => !f.dir && n.toLowerCase().endsWith(".pdf"));
          log(`   → ${entries.length} PDFs encontrados`, "info");

          for (const [nombre, entry] of entries) {
            const nombreBase = nombre.split("/").pop();
            log(`   📄 Leyendo: ${nombreBase}...`, "info");
            try {
              const blob = await entry.async("blob");
              const fileObj = new File([blob], nombreBase, { type: "application/pdf" });
              const texto = await leerPDF(fileObj);
              if (texto.trim().length < 20) {
                log(`   ⚠️ ${nombreBase}: PDF sin texto extraíble (imagen escaneada)`, "warn");
                continue;
              }
              const datos = extraerImportes(texto);
              if (datos.total > 0) {
                const clasif = CLASIFICAR(texto, datos.proveedor);
                todasFacturas.push({ ...datos, ...clasif, archivo: nombreBase });
                log(`   ✅ ${nombreBase}: ${datos.proveedor} — ${fmt(datos.total)}€`, "ok");
              } else {
                log(`   ⚠️ ${nombreBase}: no se pudo extraer el importe`, "warn");
              }
            } catch (err) {
              log(`   ❌ ${nombreBase}: ${err.message}`, "error");
            }
          }
        } else if (file.name.endsWith(".pdf")) {
          log(`📄 Leyendo: ${file.name}`, "info");
          const texto = await leerPDF(file);
          if (texto.trim().length > 20) {
            const datos = extraerImportes(texto);
            if (datos.total > 0) {
              const clasif = CLASIFICAR(texto, datos.proveedor);
              todasFacturas.push({ ...datos, ...clasif, archivo: file.name });
              log(`✅ ${file.name}: ${datos.proveedor} — ${fmt(datos.total)}€`, "ok");
            }
          }
        }
      }

      if (todasFacturas.length === 0) {
        log("⚠️ No se extrajeron facturas. Verifica que los PDFs tienen texto (no son imágenes escaneadas).", "warn");
        setProcessing(false);
        return;
      }

      log(`\n✅ ${todasFacturas.length} facturas procesadas. Generando asientos...`, "ok");
      setFacturasExtraidas(todasFacturas);

      // Generar asientos
      const nuevosAsientos = [];
      const newCoa = { ...coa };

      for (const f of todasFacturas) {
        const base = parseFloat(f.base) || 0;
        const iva  = parseFloat(f.iva) || 0;
        const total = parseFloat(f.total) || 0;

        const asiento = {
          id: Date.now() + Math.random(),
          fecha: f.fecha || "—",
          numero: f.numero || "—",
          concepto: `${f.proveedor} — ${f.gastoNombre}`,
          archivo: f.archivo,
          lineas: [
            { cuenta: f.gasto,  nombre: f.gastoNombre,       debe: base,  haber: 0 },
            { cuenta: "472",    nombre: "HP IVA soportado",  debe: iva,   haber: 0 },
            { cuenta: f.prov,   nombre: f.proveedor,         debe: 0,     haber: total },
          ].filter(l => l.debe > 0 || l.haber > 0),
        };
        nuevosAsientos.push(asiento);

        if (newCoa[f.gasto]) newCoa[f.gasto] = { ...newCoa[f.gasto], saldo: (newCoa[f.gasto].saldo||0) + base };
        if (iva > 0 && newCoa["472"]) newCoa["472"] = { ...newCoa["472"], saldo: (newCoa["472"].saldo||0) + iva };
        if (newCoa[f.prov]) newCoa[f.prov] = { ...newCoa[f.prov], saldo: (newCoa[f.prov].saldo||0) + total };
      }

      setAsientos(prev => [...nuevosAsientos, ...prev]);
      setCoa(newCoa);
      log(`\n📒 ${nuevosAsientos.length} asientos generados.`, "ok");
      log(`→ Abrí "Libro Diario" para revisarlos.`, "ok");
      setTimeout(() => setTab("asientos"), 1500);

    } catch (err) {
      log(`❌ Error: ${err.message}`, "error");
    }
    setProcessing(false);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    procesarArchivos(Array.from(e.dataTransfer.files));
  }, []);

  const cuentasFiltradas = allAccounts.filter(c => {
    const matchTipo = filtroTipo === "todos" || c.tipo === filtroTipo;
    const matchBusc = !busqueda || c.cod.includes(busqueda) || c.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchTipo && matchBusc;
  });

  const gastosData = allAccounts.filter(c=>c.tipo==="GAS"&&c.saldo>0)
    .sort((a,b)=>b.saldo-a.saldo).slice(0,6)
    .map(c=>({name:c.nombre.substring(0,20),value:c.saldo}));

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
        ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:rgba(57,208,216,0.2);}
        table{border-collapse:collapse;width:100%;}
        th{padding:8px 14px;text-align:left;color:#374151;font-size:10px;text-transform:uppercase;letter-spacing:0.07em;border-bottom:1px solid rgba(255,255,255,0.05);}
        td{padding:9px 14px;border-bottom:1px solid rgba(255,255,255,0.04);font-size:12px;color:#d1d5db;}
        tr:hover td{background:rgba(255,255,255,0.02);}
      `}</style>

      <div style={{minHeight:"100vh",background:"#060d14",color:"#f1f5f9",fontFamily:"'DM Sans',sans-serif"}}>

        {/* Header */}
        <div style={{padding:"0 24px",background:"rgba(0,0,0,0.5)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"space-between",height:54,position:"sticky",top:44,zIndex:99}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:30,height:30,borderRadius:8,background:`linear-gradient(135deg,${BRAND},#1aa8af)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#051015"}}>R</div>
            <div>
              <div style={{fontSize:13,fontWeight:700}}>Bookkeeping</div>
              <div style={{color:"#374151",fontSize:9,textTransform:"uppercase",letterSpacing:"0.1em"}}>PGC España · Sin IA · Local</div>
            </div>
          </div>
          <div style={{display:"flex",gap:3}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"5px 11px",borderRadius:7,background:tab===t.id?"rgba(57,208,216,0.14)":"transparent",border:`1px solid ${tab===t.id?"rgba(57,208,216,0.3)":"transparent"}`,color:tab===t.id?BRAND:"#6b7280",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
                {t.label}
                {t.id==="asientos"&&asientos.length>0&&<span style={{marginLeft:4,background:BRAND,color:"#051015",borderRadius:99,padding:"0 5px",fontSize:9,fontWeight:800}}>{asientos.length}</span>}
              </button>
            ))}
          </div>
        </div>

        <div style={{padding:24,height:"calc(100vh - 98px)",overflowY:"auto"}}>

          {/* ── UPLOAD ── */}
          {tab==="upload"&&(
            <div style={{animation:"fadeUp 0.3s ease",maxWidth:720,margin:"0 auto"}}>
              <div style={{marginBottom:20}}>
                <h2 style={{fontSize:20,fontWeight:700,marginBottom:4}}>Procesador de Facturas</h2>
                <p style={{color:"#4b5563",fontSize:13}}>Subí el ZIP del mes o PDFs individuales. El sistema lee el texto directamente sin usar IA ni consumir tokens.</p>
              </div>

              {/* Drop zone */}
              <div onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={onDrop} onClick={()=>!processing&&fileRef.current?.click()}
                style={{border:`2px dashed ${dragOver?BRAND:"rgba(57,208,216,0.2)"}`,borderRadius:14,padding:"44px 32px",textAlign:"center",cursor:processing?"wait":"pointer",background:dragOver?"rgba(57,208,216,0.05)":"rgba(255,255,255,0.01)",transition:"all 0.2s",marginBottom:20}}>
                <input ref={fileRef} type="file" accept=".zip,.pdf" multiple style={{display:"none"}} onChange={e=>{const f=Array.from(e.target.files);if(f.length) procesarArchivos(f);}} />
                {processing?(
                  <div>
                    <div style={{width:40,height:40,border:"3px solid rgba(57,208,216,0.2)",borderTop:`3px solid ${BRAND}`,borderRadius:"50%",margin:"0 auto 14px",animation:"spin 0.8s linear infinite"}}/>
                    <div style={{color:BRAND,fontWeight:700,fontSize:14}}>Procesando con pdf.js — sin IA</div>
                    <div style={{color:"#4b5563",fontSize:12,marginTop:4}}>Leyendo texto de los PDFs localmente</div>
                  </div>
                ):(
                  <div>
                    <div style={{fontSize:44,marginBottom:10}}>📁</div>
                    <div style={{color:"#f1f5f9",fontWeight:700,fontSize:15,marginBottom:5}}>Arrastrá el ZIP o PDFs aquí</div>
                    <div style={{color:"#4b5563",fontSize:12}}>Procesamiento 100% local · sin IA · sin tokens · gratis</div>
                  </div>
                )}
              </div>

              {/* Log */}
              {progreso.length>0&&(
                <div style={{background:"#0a1628",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:14,fontFamily:"monospace",fontSize:11,maxHeight:260,overflowY:"auto",marginBottom:16}}>
                  <div style={{color:BRAND,fontWeight:700,marginBottom:6,fontSize:10,textTransform:"uppercase",letterSpacing:"0.1em"}}>Log — pdf.js (local)</div>
                  {progreso.map((p,i)=>(
                    <div key={i} style={{padding:"2px 0",color:p.type==="ok"?"#22c55e":p.type==="warn"?"#eab308":p.type==="error"?"#ef4444":"#6b7280",whiteSpace:"pre-wrap"}}>{p.msg}</div>
                  ))}
                </div>
              )}

              {/* Preview */}
              {facturasExtraidas.length>0&&(
                <div>
                  <div style={{color:"#f1f5f9",fontWeight:700,fontSize:13,marginBottom:8}}>✅ {facturasExtraidas.length} facturas extraídas</div>
                  <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,overflow:"hidden"}}>
                    <table>
                      <thead><tr><th>Archivo</th><th>Proveedor</th><th>Fecha</th><th style={{textAlign:"right"}}>Base</th><th style={{textAlign:"right"}}>IVA</th><th style={{textAlign:"right"}}>Total</th><th>Cta.</th></tr></thead>
                      <tbody>
                        {facturasExtraidas.map((f,i)=>(
                          <tr key={i}>
                            <td style={{color:"#6b7280",fontSize:10}}>{f.archivo}</td>
                            <td style={{fontWeight:500}}>{f.proveedor?.substring(0,25)}</td>
                            <td style={{fontFamily:"monospace"}}>{f.fecha}</td>
                            <td style={{textAlign:"right",fontFamily:"monospace"}}>{fmt(f.base)}€</td>
                            <td style={{textAlign:"right",fontFamily:"monospace",color:"#6b7280"}}>{fmt(f.iva)}€</td>
                            <td style={{textAlign:"right",fontFamily:"monospace",color:"#ef4444",fontWeight:700}}>{fmt(f.total)}€</td>
                            <td style={{fontFamily:"monospace",color:BRAND}}>{f.gasto}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{padding:"8px 14px",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",justifyContent:"space-between",fontSize:11}}>
                      <span style={{color:"#6b7280"}}>Total importado</span>
                      <span style={{color:"#ef4444",fontWeight:700}}>{fmt(facturasExtraidas.reduce((s,f)=>s+parseFloat(f.total||0),0))}€</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Info cards */}
              {progreso.length===0&&(
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:8}}>
                  {[
                    {icon:"🔒",t:"Sin IA ni tokens",d:"Todo se procesa en tu browser con pdf.js. Sin conexión a APIs externas."},
                    {icon:"📄",t:"PDFs con texto",d:"Funciona con PDFs digitales (Zoho, Intelinova, Largal…). No con imágenes escaneadas."},
                    {icon:"⚡",t:"Automático",d:"Extrae proveedor, fecha, base, IVA y clasifica en el Plan General Contable."},
                  ].map(c=>(
                    <div key={c.t} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"14px 16px"}}>
                      <div style={{fontSize:22,marginBottom:6}}>{c.icon}</div>
                      <div style={{fontWeight:700,fontSize:12,marginBottom:4}}>{c.t}</div>
                      <div style={{color:"#4b5563",fontSize:11,lineHeight:1.6}}>{c.d}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── DASHBOARD ── */}
          {tab==="dashboard"&&(
            <div style={{animation:"fadeUp 0.3s ease"}}>
              <div style={{marginBottom:18}}>
                <h2 style={{fontSize:20,fontWeight:700,marginBottom:4}}>Dashboard Contable</h2>
                <p style={{color:"#4b5563",fontSize:12}}>Reset Fitness S.L. · Ejercicio 2026 · {asientos.length} asientos</p>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}>
                {[
                  {label:"Total Activo",  val:`${fmt(totalActivo)}€`,   color:BRAND},
                  {label:"Total Pasivo",  val:`${fmt(totalPasivo)}€`,   color:"#ef4444"},
                  {label:"Ingresos",      val:`${fmt(totalIngresos)}€`, color:"#22c55e"},
                  {label:"Gastos",        val:`${fmt(totalGastos)}€`,   color:"#f97316"},
                  {label:"Resultado",     val:`${resultado>=0?"+":""}${fmt(resultado)}€`, color:resultado>=0?"#22c55e":"#ef4444"},
                ].map(k=>(
                  <div key={k.label} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"13px 15px",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${k.color},transparent)`}}/>
                    <div style={{color:"#4b5563",fontSize:9,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>{k.label}</div>
                    <div style={{color:k.color,fontSize:16,fontWeight:800}}>{k.val}</div>
                  </div>
                ))}
              </div>
              {gastosData.length>0&&(
                <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"16px 18px 8px"}}>
                  <div style={{color:"#9ca3af",fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Gastos por categoría</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={gastosData} layout="vertical">
                      <XAxis type="number" tick={{fill:"#4b5563",fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
                      <YAxis type="category" dataKey="name" tick={{fill:"#9ca3af",fontSize:9}} axisLine={false} tickLine={false} width={140}/>
                      <Tooltip content={<CT/>}/>
                      <Bar dataKey="value" name="Importe" fill="#f97316" radius={[0,4,4,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* ── LIBRO DIARIO ── */}
          {tab==="asientos"&&(
            <div style={{animation:"fadeUp 0.3s ease"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div>
                  <h2 style={{fontSize:20,fontWeight:700,marginBottom:4}}>Libro Diario</h2>
                  <p style={{color:"#4b5563",fontSize:12}}>{asientos.length} asientos generados automáticamente</p>
                </div>
                {asientos.length>0&&<button onClick={()=>setTab("upload")} style={{padding:"6px 14px",borderRadius:8,background:"rgba(57,208,216,0.1)",border:"1px solid rgba(57,208,216,0.2)",color:BRAND,fontSize:11,fontWeight:700,cursor:"pointer"}}>+ Importar más</button>}
              </div>
              {asientos.length===0?(
                <div style={{textAlign:"center",padding:"60px 20px",background:"rgba(255,255,255,0.01)",border:"1px dashed rgba(255,255,255,0.06)",borderRadius:12}}>
                  <div style={{fontSize:36,marginBottom:10}}>📒</div>
                  <div style={{color:"#6b7280",fontSize:13}}>Sin asientos todavía</div>
                  <div style={{color:"#374151",fontSize:11,marginTop:5}}>Subí facturas para generarlos</div>
                  <button onClick={()=>setTab("upload")} style={{marginTop:14,padding:"8px 18px",borderRadius:8,background:`linear-gradient(135deg,${BRAND},#1aa8af)`,border:"none",color:"#051015",fontSize:12,fontWeight:700,cursor:"pointer"}}>Subir facturas →</button>
                </div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {asientos.map((a,i)=>(
                    <div key={a.id} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:9,overflow:"hidden"}}>
                      <div style={{padding:"9px 15px",background:"rgba(255,255,255,0.02)",borderBottom:"1px solid rgba(255,255,255,0.04)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontFamily:"monospace",fontSize:10,color:"#374151"}}>#{String(i+1).padStart(3,"0")}</span>
                          <span style={{fontWeight:600,fontSize:13}}>{a.concepto}</span>
                        </div>
                        <div style={{display:"flex",gap:10,alignItems:"center"}}>
                          <span style={{fontFamily:"monospace",fontSize:10,color:"#6b7280"}}>{a.fecha}</span>
                          <span style={{fontSize:9,color:"#374151"}}>{a.archivo}</span>
                        </div>
                      </div>
                      <table style={{margin:0}}>
                        <thead><tr><th style={{width:70}}>Cuenta</th><th>Concepto</th><th style={{textAlign:"right"}}>Debe</th><th style={{textAlign:"right"}}>Haber</th></tr></thead>
                        <tbody>
                          {a.lineas.map((l,j)=>(
                            <tr key={j}>
                              <td style={{fontFamily:"monospace",color:BRAND,fontWeight:700,fontSize:11}}>{l.cuenta}</td>
                              <td>{l.nombre}</td>
                              <td style={{textAlign:"right",fontFamily:"monospace",color:l.debe>0?"#f1f5f9":"#374151"}}>{l.debe>0?`${fmt(l.debe)}€`:"—"}</td>
                              <td style={{textAlign:"right",fontFamily:"monospace",color:l.haber>0?"#ef4444":"#374151"}}>{l.haber>0?`${fmt(l.haber)}€`:"—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PLAN DE CUENTAS ── */}
          {tab==="coa"&&(
            <div style={{animation:"fadeUp 0.3s ease"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <h2 style={{fontSize:20,fontWeight:700,marginBottom:4}}>Plan General Contable</h2>
                  <p style={{color:"#4b5563",fontSize:12}}>PGC España · {allAccounts.length} cuentas</p>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar..." style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:8,padding:"6px 12px",color:"#e5e7eb",fontSize:11,width:140}}/>
                  {["todos","ACT","PAS","ING","GAS"].map(t=>(
                    <button key={t} onClick={()=>setFiltroTipo(t)} style={{padding:"5px 10px",borderRadius:99,background:filtroTipo===t?"rgba(57,208,216,0.12)":"rgba(255,255,255,0.04)",border:`1px solid ${filtroTipo===t?"rgba(57,208,216,0.35)":"rgba(255,255,255,0.07)"}`,color:filtroTipo===t?BRAND:"#6b7280",fontSize:10,fontWeight:600,cursor:"pointer"}}>
                      {t==="todos"?"Todos":TIPO_CFG[t]?.label||t}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,overflow:"hidden"}}>
                <table>
                  <thead><tr><th>Código</th><th>Cuenta</th><th>Tipo</th><th style={{textAlign:"right"}}>Saldo</th></tr></thead>
                  <tbody>
                    {cuentasFiltradas.map(c=>{
                      const cfg=TIPO_CFG[c.tipo];
                      return(
                        <tr key={c.cod}>
                          <td style={{color:BRAND,fontWeight:700,fontFamily:"monospace"}}>{c.cod}</td>
                          <td style={{fontWeight:500}}>{c.nombre}</td>
                          <td><span style={{padding:"2px 7px",borderRadius:99,background:cfg.bg,color:cfg.color,fontSize:10,fontWeight:700}}>{cfg.label}</span></td>
                          <td style={{textAlign:"right",fontFamily:"monospace",color:c.saldo>0?cfg.color:"#374151",fontWeight:c.saldo>0?700:400}}>{c.saldo>0?`${fmt(c.saldo)}€`:"—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── P&L ── */}
          {tab==="pyl"&&(
            <div style={{animation:"fadeUp 0.3s ease"}}>
              <div style={{marginBottom:16}}>
                <h2 style={{fontSize:20,fontWeight:700,marginBottom:4}}>Cuenta de Pérdidas y Ganancias</h2>
                <p style={{color:"#4b5563",fontSize:12}}>Acumulado 2026 · actualizado con cada importación</p>
              </div>
              <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,overflow:"hidden",maxWidth:620}}>
                {[
                  {label:"(+) Cuotas socios TPV",          val:coa["700"]?.saldo||0, color:"#22c55e"},
                  {label:"(+) Cuotas socios efectivo",      val:coa["702"]?.saldo||0, color:"#22c55e"},
                  {label:"= INGRESOS TOTALES",              val:totalIngresos,         color:"#22c55e", bold:true, sep:true},
                  {label:"(-) Arrendamiento local",         val:-(coa["621"]?.saldo||0), color:"#ef4444"},
                  {label:"(-) Servicios profesionales",     val:-(coa["623"]?.saldo||0), color:"#ef4444"},
                  {label:"(-) Seguros",                     val:-(coa["625"]?.saldo||0), color:"#ef4444"},
                  {label:"(-) Suministros y alarma",        val:-(coa["628"]?.saldo||0), color:"#ef4444"},
                  {label:"(-) Otros servicios",             val:-(coa["629"]?.saldo||0), color:"#ef4444"},
                  {label:"(-) Sueldos y salarios",          val:-(coa["640"]?.saldo||0), color:"#ef4444"},
                  {label:"(-) SS empresa",                  val:-(coa["642"]?.saldo||0), color:"#ef4444"},
                  {label:"(-) Intereses préstamos",         val:-(coa["662"]?.saldo||0), color:"#ef4444"},
                  {label:"= RESULTADO DEL EJERCICIO",       val:resultado,             color:resultado>=0?"#22c55e":"#ef4444", bold:true, sep:true, big:true},
                ].map((row,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:row.bold?"11px 18px":"8px 18px",borderBottom:"1px solid rgba(255,255,255,0.04)",background:row.sep&&row.bold?"rgba(255,255,255,0.02)":"transparent"}}>
                    <span style={{color:row.bold?"#f1f5f9":"#9ca3af",fontWeight:row.bold?700:400,fontSize:row.big?14:12}}>{row.label}</span>
                    <span style={{color:row.val===0?"#374151":row.color,fontWeight:row.bold?800:600,fontSize:row.big?16:12,fontFamily:row.big?"serif":"monospace"}}>
                      {row.val===0?"—":`${row.val>=0?"+":""}${fmt(row.val)}€`}
                    </span>
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

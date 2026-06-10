import { useState, useRef, useCallback } from "react";
import { askClaude } from "../api.js";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const BRAND = "#39D0D8";

// ── PLAN DE CUENTAS BASE ─────────────────────────────────────────────────────
const COA_BASE = {
  "100": { nombre: "Capital social", tipo: "PAS", grupo: "1", saldo: 3000 },
  "170": { nombre: "Préstamo Detlef Vormschlag", tipo: "PAS", grupo: "1", saldo: 350000 },
  "190": { nombre: "Préstamo María Lagos → Reset", tipo: "PAS", grupo: "1", saldo: 69922.84 },
  "213": { nombre: "Maquinaria gimnasio (Fit-Maker)", tipo: "ACT", grupo: "2", saldo: 108877.04 },
  "216": { nombre: "Mobiliario e instalaciones", tipo: "ACT", grupo: "2", saldo: 19231.24 },
  "211": { nombre: "Obra y reforma local", tipo: "ACT", grupo: "2", saldo: 129743.73 },
  "217": { nombre: "Equipamiento audio y digital", tipo: "ACT", grupo: "2", saldo: 8908.00 },
  "281": { nombre: "Amort. acum. maquinaria", tipo: "ACT", grupo: "2", saldo: 0 },
  "282": { nombre: "Amort. acum. instalaciones", tipo: "ACT", grupo: "2", saldo: 0 },
  "400": { nombre: "Fit-Maker Sport SLU", tipo: "PAS", grupo: "4", saldo: 9000 },
  "401": { nombre: "Elementents CP S.L.", tipo: "PAS", grupo: "4", saldo: 3811.76 },
  "402": { nombre: "Mario Ribas (alquiler)", tipo: "PAS", grupo: "4", saldo: 12490 },
  "403": { nombre: "Arbre Assessors (gestoría)", tipo: "PAS", grupo: "4", saldo: 242 },
  "404": { nombre: "Be Virtual (diseño/web)", tipo: "PAS", grupo: "4", saldo: 665.50 },
  "405": { nombre: "Dyfalum S.L.U.", tipo: "PAS", grupo: "4", saldo: 8707.13 },
  "406": { nombre: "Optima Audio S.L.U.", tipo: "PAS", grupo: "4", saldo: 2871.60 },
  "409": { nombre: "Otros proveedores", tipo: "PAS", grupo: "4", saldo: 0 },
  "430": { nombre: "Socios — cuotas pendientes", tipo: "ACT", grupo: "4", saldo: 95 },
  "472": { nombre: "HP IVA soportado", tipo: "ACT", grupo: "4", saldo: 0 },
  "477": { nombre: "HP IVA repercutido", tipo: "PAS", grupo: "4", saldo: 0 },
  "476": { nombre: "SS acreedora", tipo: "PAS", grupo: "4", saldo: 695.09 },
  "521": { nombre: "Deudas corto plazo", tipo: "PAS", grupo: "5", saldo: 0 },
  "523": { nombre: "Intereses préstamo Detlef", tipo: "PAS", grupo: "5", saldo: 875 },
  "572": { nombre: "Banco Santander", tipo: "ACT", grupo: "5", saldo: 5608.82 },
  "570": { nombre: "Caja efectivo", tipo: "ACT", grupo: "5", saldo: 3072.00 },
  "621": { nombre: "Arrendamiento local", tipo: "GAS", grupo: "6", saldo: 42840 },
  "622": { nombre: "Reparaciones y conservación", tipo: "GAS", grupo: "6", saldo: 0 },
  "623": { nombre: "Servicios profesionales", tipo: "GAS", grupo: "6", saldo: 907.50 },
  "624": { nombre: "Transportes", tipo: "GAS", grupo: "6", saldo: 0 },
  "625": { nombre: "Seguros", tipo: "GAS", grupo: "6", saldo: 651.56 },
  "626": { nombre: "Servicios bancarios", tipo: "GAS", grupo: "6", saldo: 0 },
  "627": { nombre: "Publicidad y marketing", tipo: "GAS", grupo: "6", saldo: 0 },
  "628": { nombre: "Suministros", tipo: "GAS", grupo: "6", saldo: 65.17 },
  "629": { nombre: "Otros servicios (software, web)", tipo: "GAS", grupo: "6", saldo: 665.50 },
  "640": { nombre: "Sueldos y salarios", tipo: "GAS", grupo: "6", saldo: 0 },
  "642": { nombre: "SS a cargo empresa", tipo: "GAS", grupo: "6", saldo: 0 },
  "662": { nombre: "Intereses préstamo Detlef", tipo: "GAS", grupo: "6", saldo: 3500 },
  "681": { nombre: "Amort. maquinaria", tipo: "GAS", grupo: "6", saldo: 0 },
  "700": { nombre: "Cuotas socios — TPV", tipo: "ING", grupo: "7", saldo: 7620 },
  "702": { nombre: "Cuotas socios — efectivo caja", tipo: "ING", grupo: "7", saldo: 7042 },
  "709": { nombre: "Otros ingresos servicios", tipo: "ING", grupo: "7", saldo: 0 },
};

const TIPO_CFG = {
  ACT: { label: "Activo",   color: BRAND,      bg: "rgba(57,208,216,0.1)"  },
  PAS: { label: "Pasivo",   color: "#ef4444",  bg: "rgba(239,68,68,0.1)"   },
  ING: { label: "Ingreso",  color: "#22c55e",  bg: "rgba(34,197,94,0.1)"   },
  GAS: { label: "Gasto",    color: "#f97316",  bg: "rgba(249,115,22,0.1)"  },
};

const TABS = [
  { id: "upload",    label: "📁 Subir Facturas" },
  { id: "dashboard", label: "📊 Dashboard" },
  { id: "asientos",  label: "📒 Libro Diario" },
  { id: "coa",       label: "📋 Plan Cuentas" },
  { id: "pyl",       label: "📈 P&L" },
  { id: "balance",   label: "⚖️ Balance" },
];

function fmt(n) { return Number(n || 0).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function CT({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return <div style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
    <div style={{ color: "#9ca3af", marginBottom: 4 }}>{label}</div>
    {payload.map(p => <div key={p.name} style={{ color: p.color || BRAND, fontWeight: 600 }}>{p.name}: {fmt(p.value)}€</div>)}
  </div>;
}

// ── SYSTEM PROMPT PARA EXTRACCIÓN ────────────────────────────────────────────
const EXTRACTION_SYSTEM = `Eres el motor de bookkeeping automático de RESET FITNESS S.L. (CIF B26660720), gimnasio en Ibiza.

Tu tarea es analizar facturas en PDF (en formato base64) y devolver SOLO un JSON con esta estructura exacta:

{
  "facturas": [
    {
      "numero": "número de factura",
      "fecha": "DD/MM/YYYY",
      "proveedor": "nombre del proveedor",
      "concepto": "descripción breve del servicio/producto",
      "base_imponible": 0.00,
      "iva_pct": 21,
      "iva_importe": 0.00,
      "total": 0.00,
      "cuenta_gasto": "621",
      "cuenta_gasto_nombre": "Arrendamiento local",
      "cuenta_proveedor": "402",
      "ya_pagada": false,
      "notas": "observación relevante si la hay"
    }
  ]
}

REGLAS DE CLASIFICACIÓN PGC:
- Alquiler local → 621 / proveedor 402
- Gestoría, asesoría, arquitecto → 623 / proveedor 403
- Seguros → 625 / proveedor 409
- Alarma, seguridad → 628 / proveedor 409
- Software, web, apps → 629 / proveedor 404
- Audio, instalaciones AV → 217 (si es activo) o 629 / proveedor 406
- Maquinaria gimnasio → 213 / proveedor 400
- Obra, reforma, construcción → 211 / proveedor 409
- Aluminio, cristalería → 216 / proveedor 405
- Material ferretería → 622 / proveedor 409
- Fontanería, electricidad → 622 / proveedor 409
- Publicidad, imprenta → 627 / proveedor 409
- Pintura → 622 / proveedor 409
- Transporte, viajes → 624 / proveedor 409
- Alimentación, catering → 629 / proveedor 409
- Intereses préstamos → 662 / proveedor 523

IVA: si el PDF muestra 0% o está exento, usa iva_pct: 0. Por defecto 21%.

Si una factura ya aparece marcada como pagada o tiene sello de pago, marca ya_pagada: true.

NO incluyas texto fuera del JSON. Solo el objeto JSON.`;

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

  // ── Calcular totales desde COA ────────────────────────────────────────────
  const allAccounts = Object.entries(coa).map(([cod, c]) => ({ cod, ...c }));
  const totalActivo   = allAccounts.filter(c => c.tipo === "ACT").reduce((s, c) => s + c.saldo, 0);
  const totalPasivo   = allAccounts.filter(c => c.tipo === "PAS").reduce((s, c) => s + c.saldo, 0);
  const totalIngresos = allAccounts.filter(c => c.tipo === "ING").reduce((s, c) => s + c.saldo, 0);
  const totalGastos   = allAccounts.filter(c => c.tipo === "GAS").reduce((s, c) => s + c.saldo, 0);
  const resultado     = totalIngresos - totalGastos;

  // ── Leer PDF como base64 ──────────────────────────────────────────────────
  const pdfToBase64 = (file) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = () => rej(new Error("Error leyendo archivo"));
    r.readAsDataURL(file);
  });

  // ── Extraer facturas de un PDF via Claude ─────────────────────────────────
  const extraerFactura = async (file, nombre) => {
    const b64 = await pdfToBase64(file);
    const text = await askClaude({
      system: EXTRACTION_SYSTEM,
      messages: [{
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } },
          { type: "text", text: `Analiza esta factura: ${nombre}` }
        ]
      }],
      maxTokens: 2000,
    });
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  };

  // ── Procesar ZIP con JSZip ────────────────────────────────────────────────
  const procesarArchivos = async (files) => {
    setProcessing(true);
    setProgreso([]);
    setFacturasExtraidas([]);

    const todasFacturas = [];
    const log = (msg, type = "info") => setProgreso(p => [...p, { msg, type, ts: Date.now() }]);

    try {
      // Cargar JSZip dinámicamente
      const JSZip = (await import("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js")).default;

      for (const file of files) {
        if (file.name.endsWith(".zip")) {
          log(`📦 Procesando ZIP: ${file.name}`, "info");
          const zip = await JSZip.loadAsync(file);
          const entries = Object.entries(zip.files).filter(([n, f]) =>
            !f.dir && (n.toLowerCase().endsWith(".pdf") || n.toLowerCase().endsWith(".jpg") || n.toLowerCase().endsWith(".png"))
          );

          log(`   → ${entries.length} archivos encontrados`, "info");

          for (const [nombre, entry] of entries) {
            const nombreBase = nombre.split("/").pop();
            log(`   📄 Analizando: ${nombreBase}...`, "info");
            try {
              const blob = await entry.async("blob");
              const isPdf = nombreBase.toLowerCase().endsWith(".pdf");
              const fileObj = new File([blob], nombreBase, { type: isPdf ? "application/pdf" : "image/jpeg" });

              if (isPdf) {
                const resultado = await extraerFactura(fileObj, nombreBase);
                if (resultado?.facturas?.length) {
                  todasFacturas.push(...resultado.facturas.map(f => ({ ...f, archivo: nombreBase })));
                  log(`   ✅ ${resultado.facturas.length} factura(s) extraída(s) de ${nombreBase}`, "ok");
                }
              }
            } catch (err) {
              log(`   ⚠️ Error en ${nombreBase}: ${err.message}`, "warn");
            }
          }
        } else if (file.name.endsWith(".pdf")) {
          log(`📄 Procesando PDF: ${file.name}`, "info");
          try {
            const resultado = await extraerFactura(file, file.name);
            if (resultado?.facturas?.length) {
              todasFacturas.push(...resultado.facturas.map(f => ({ ...f, archivo: file.name })));
              log(`✅ ${resultado.facturas.length} factura(s) extraída(s) de ${file.name}`, "ok");
            }
          } catch (err) {
            log(`⚠️ Error en ${file.name}: ${err.message}`, "warn");
          }
        }
      }

      if (todasFacturas.length === 0) {
        log("⚠️ No se pudieron extraer facturas. Verifica que los PDFs son legibles.", "warn");
        setProcessing(false);
        return;
      }

      log(`\n✅ Total: ${todasFacturas.length} facturas procesadas. Generando asientos...`, "ok");
      setFacturasExtraidas(todasFacturas);

      // ── Generar asientos contables ──────────────────────────────────────
      const nuevosAsientos = [];
      const newCoa = { ...coa };

      for (const f of todasFacturas) {
        const fecha = f.fecha || new Date().toLocaleDateString("es-ES");
        const base  = parseFloat(f.base_imponible) || 0;
        const iva   = parseFloat(f.iva_importe) || 0;
        const total = parseFloat(f.total) || 0;

        // Asiento: DEBE → cuenta gasto + IVA soportado; HABER → proveedor
        const asiento = {
          id:       Date.now() + Math.random(),
          fecha,
          numero:   f.numero || "—",
          concepto: `${f.proveedor} — ${f.concepto}`,
          archivo:  f.archivo,
          lineas: [
            { cuenta: f.cuenta_gasto, nombre: f.cuenta_gasto_nombre, debe: base,  haber: 0 },
            { cuenta: "472",          nombre: "HP IVA soportado",    debe: iva,   haber: 0 },
            { cuenta: f.cuenta_proveedor || "409", nombre: f.proveedor, debe: 0, haber: total },
          ].filter(l => l.debe > 0 || l.haber > 0),
          ya_pagada: f.ya_pagada || false,
        };
        nuevosAsientos.push(asiento);

        // Actualizar saldos COA
        if (newCoa[f.cuenta_gasto]) {
          newCoa[f.cuenta_gasto] = { ...newCoa[f.cuenta_gasto], saldo: (newCoa[f.cuenta_gasto].saldo || 0) + base };
        }
        if (iva > 0 && newCoa["472"]) {
          newCoa["472"] = { ...newCoa["472"], saldo: (newCoa["472"].saldo || 0) + iva };
        }
        const ctaProv = f.cuenta_proveedor || "409";
        if (newCoa[ctaProv]) {
          newCoa[ctaProv] = { ...newCoa[ctaProv], saldo: (newCoa[ctaProv].saldo || 0) + total };
        }
      }

      setAsientos(prev => [...nuevosAsientos, ...prev]);
      setCoa(newCoa);
      log(`\n📒 ${nuevosAsientos.length} asientos generados en el Libro Diario.`, "ok");
      log(`📊 Plan de Cuentas actualizado automáticamente.`, "ok");
      log(`\n→ Ve a "Libro Diario" para revisar los asientos o a "Dashboard" para ver el resumen.`, "ok");

      setTimeout(() => setTab("asientos"), 1500);

    } catch (err) {
      log(`❌ Error general: ${err.message}`, "error");
    }

    setProcessing(false);
  };

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) procesarArchivos(files);
  }, []);

  const cuentasFiltradas = allAccounts.filter(c => {
    const matchTipo  = filtroTipo === "todos" || c.tipo === filtroTipo;
    const matchBusc  = !busqueda || c.cod.includes(busqueda) || c.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchTipo && matchBusc;
  });

  const gastosData = allAccounts.filter(c => c.tipo === "GAS" && c.saldo > 0)
    .sort((a, b) => b.saldo - a.saldo).slice(0, 6)
    .map(c => ({ name: c.nombre.substring(0, 18), value: c.saldo }));

  const pylData = [
    { name: "Ingresos", value: totalIngresos, color: "#22c55e" },
    { name: "Gastos",   value: totalGastos,   color: "#ef4444" },
    { name: resultado >= 0 ? "Beneficio" : "Pérdida", value: Math.abs(resultado), color: resultado >= 0 ? "#22c55e" : "#ef4444" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700;900&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.5;}}
        ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:rgba(57,208,216,0.2);}
        table{border-collapse:collapse;width:100%;}
        th{padding:8px 14px;text-align:left;color:#374151;font-size:10px;text-transform:uppercase;letter-spacing:0.07em;border-bottom:1px solid rgba(255,255,255,0.05);}
        td{padding:9px 14px;border-bottom:1px solid rgba(255,255,255,0.04);font-size:12px;color:#d1d5db;}
        tr:hover td{background:rgba(255,255,255,0.02);}
        input:focus,textarea:focus{outline:none;}
      `}</style>

      <div style={{ minHeight: "100vh", background: "#060d14", color: "#f1f5f9", fontFamily: "'DM Sans',sans-serif" }}>

        {/* Header */}
        <div style={{ padding: "0 24px", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, position: "sticky", top: 44, zIndex: 99 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg,${BRAND},#1aa8af)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900, color: "#051015" }}>R</div>
            <div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 700 }}>Bookkeeping Automático</div>
              <div style={{ color: "#374151", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em" }}>Reset Fitness · PGC España · 2026</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 3 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "5px 11px", borderRadius: 7, background: tab === t.id ? "rgba(57,208,216,0.14)" : "transparent", border: `1px solid ${tab === t.id ? "rgba(57,208,216,0.3)" : "transparent"}`, color: tab === t.id ? BRAND : "#6b7280", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                {t.label}
                {t.id === "asientos" && asientos.length > 0 && <span style={{ marginLeft: 4, background: BRAND, color: "#051015", borderRadius: 99, padding: "0 5px", fontSize: 9, fontWeight: 800 }}>{asientos.length}</span>}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: 24, height: "calc(100vh - 102px)", overflowY: "auto" }}>

          {/* ══ UPLOAD ══ */}
          {tab === "upload" && (
            <div style={{ animation: "fadeUp 0.3s ease", maxWidth: 760, margin: "0 auto" }}>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 22, marginBottom: 6 }}>Procesador de Facturas</h2>
                <p style={{ color: "#4b5563", fontSize: 13 }}>Subí el ZIP de facturas del mes y Claude las analiza, clasifica y genera los asientos automáticamente.</p>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => !processing && fileRef.current?.click()}
                style={{ border: `2px dashed ${dragOver ? BRAND : "rgba(57,208,216,0.2)"}`, borderRadius: 16, padding: "48px 32px", textAlign: "center", cursor: processing ? "wait" : "pointer", background: dragOver ? "rgba(57,208,216,0.05)" : "rgba(255,255,255,0.01)", transition: "all 0.2s", marginBottom: 24 }}
              >
                <input ref={fileRef} type="file" accept=".zip,.pdf" multiple style={{ display: "none" }} onChange={e => { const f = Array.from(e.target.files); if (f.length) procesarArchivos(f); }} />
                {processing ? (
                  <div>
                    <div style={{ width: 44, height: 44, border: `3px solid rgba(57,208,216,0.2)`, borderTop: `3px solid ${BRAND}`, borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
                    <div style={{ color: BRAND, fontWeight: 700, fontSize: 15 }}>Procesando facturas...</div>
                    <div style={{ color: "#4b5563", fontSize: 12, marginTop: 4 }}>Claude está leyendo y clasificando cada factura</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
                    <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Arrastrá el ZIP aquí o hacé click para seleccionar</div>
                    <div style={{ color: "#4b5563", fontSize: 12 }}>ZIP con facturas del mes · PDFs individuales · Imágenes JPG/PNG</div>
                  </div>
                )}
              </div>

              {/* Log de progreso */}
              {progreso.length > 0 && (
                <div style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 16, fontFamily: "'DM Mono',monospace", fontSize: 11, maxHeight: 300, overflowY: "auto" }}>
                  <div style={{ color: BRAND, fontWeight: 700, marginBottom: 8, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>Log de procesamiento</div>
                  {progreso.map((p, i) => (
                    <div key={i} style={{ padding: "2px 0", color: p.type === "ok" ? "#22c55e" : p.type === "warn" ? "#eab308" : p.type === "error" ? "#ef4444" : "#6b7280", whiteSpace: "pre-wrap" }}>
                      {p.msg}
                    </div>
                  ))}
                </div>
              )}

              {/* Facturas extraídas preview */}
              {facturasExtraidas.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
                    ✅ {facturasExtraidas.length} facturas extraídas
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
                    <table>
                      <thead><tr><th>Archivo</th><th>Proveedor</th><th>Fecha</th><th>Base</th><th>IVA</th><th>Total</th><th>Cuenta</th></tr></thead>
                      <tbody>
                        {facturasExtraidas.map((f, i) => (
                          <tr key={i}>
                            <td style={{ color: "#6b7280", fontSize: 10 }}>{f.archivo}</td>
                            <td style={{ color: "#f1f5f9", fontWeight: 500 }}>{f.proveedor}</td>
                            <td style={{ fontFamily: "'DM Mono',monospace" }}>{f.fecha}</td>
                            <td style={{ fontFamily: "'DM Mono',monospace", textAlign: "right" }}>{fmt(f.base_imponible)}€</td>
                            <td style={{ fontFamily: "'DM Mono',monospace", textAlign: "right", color: "#6b7280" }}>{fmt(f.iva_importe)}€</td>
                            <td style={{ fontFamily: "'DM Mono',monospace", textAlign: "right", color: "#ef4444", fontWeight: 700 }}>{fmt(f.total)}€</td>
                            <td style={{ fontFamily: "'DM Mono',monospace", color: BRAND }}>{f.cuenta_gasto}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#6b7280" }}>Total facturas importadas</span>
                      <span style={{ color: "#ef4444", fontWeight: 700 }}>{fmt(facturasExtraidas.reduce((s, f) => s + parseFloat(f.total || 0), 0))}€</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Instrucciones */}
              {progreso.length === 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 8 }}>
                  {[
                    { icon: "📦", titulo: "ZIP mensual", desc: "Subí el ZIP con todas las facturas del mes. Se extraen y procesan automáticamente." },
                    { icon: "🤖", titulo: "Clasificación IA", desc: "Claude lee cada PDF, extrae importes, fechas y clasifica en el Plan General Contable." },
                    { icon: "📒", titulo: "Asientos automáticos", desc: "Se generan los asientos contables y se actualiza el balance y P&L en tiempo real." },
                  ].map(c => (
                    <div key={c.titulo} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px" }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>
                      <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{c.titulo}</div>
                      <div style={{ color: "#4b5563", fontSize: 11, lineHeight: 1.6 }}>{c.desc}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ DASHBOARD ══ */}
          {tab === "dashboard" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, marginBottom: 4 }}>Dashboard Contable</h2>
                <p style={{ color: "#4b5563", fontSize: 12 }}>Reset Fitness S.L. · Ejercicio 2026 · {asientos.length} asientos registrados</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 20 }}>
                {[
                  { label: "Total Activo",    val: `${fmt(totalActivo)}€`,   color: BRAND,      sub: "bienes y derechos" },
                  { label: "Total Pasivo",    val: `${fmt(totalPasivo)}€`,   color: "#ef4444",  sub: "obligaciones" },
                  { label: "Ingresos acum.", val: `${fmt(totalIngresos)}€`, color: "#22c55e",  sub: "ventas y servicios" },
                  { label: "Gastos acum.",   val: `${fmt(totalGastos)}€`,   color: "#f97316",  sub: "operativos" },
                  { label: "Resultado",      val: `${resultado >= 0 ? "+" : ""}${fmt(resultado)}€`, color: resultado >= 0 ? "#22c55e" : "#ef4444", sub: resultado >= 0 ? "beneficio" : "pérdida" },
                ].map(k => (
                  <div key={k.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${k.color},transparent)` }} />
                    <div style={{ color: "#4b5563", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{k.label}</div>
                    <div style={{ color: k.color, fontSize: 16, fontWeight: 800, fontFamily: "'Fraunces',serif" }}>{k.val}</div>
                    <div style={{ color: "#374151", fontSize: 10, marginTop: 3 }}>{k.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 18px 8px" }}>
                  <div style={{ color: "#9ca3af", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Gastos por categoría</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={gastosData} layout="vertical">
                      <XAxis type="number" tick={{ fill: "#4b5563", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 9 }} axisLine={false} tickLine={false} width={130} />
                      <Tooltip content={<CT />} />
                      <Bar dataKey="value" name="Importe" fill="#f97316" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 18px 8px" }}>
                  <div style={{ color: "#9ca3af", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>P&L resumido</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={pylData}>
                      <XAxis dataKey="name" tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                      <Tooltip content={<CT />} />
                      <Bar dataKey="value" name="Importe" radius={[4, 4, 0, 0]}>
                        {pylData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ══ LIBRO DIARIO ══ */}
          {tab === "asientos" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div>
                  <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, marginBottom: 4 }}>Libro Diario</h2>
                  <p style={{ color: "#4b5563", fontSize: 12 }}>{asientos.length} asientos · generados automáticamente desde facturas</p>
                </div>
                {asientos.length > 0 && (
                  <button onClick={() => setTab("upload")} style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(57,208,216,0.1)", border: "1px solid rgba(57,208,216,0.2)", color: BRAND, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    + Importar más facturas
                  </button>
                )}
              </div>

              {asientos.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.06)", borderRadius: 14 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📒</div>
                  <div style={{ color: "#6b7280", fontSize: 14 }}>Aún no hay asientos</div>
                  <div style={{ color: "#374151", fontSize: 12, marginTop: 6 }}>Subí facturas en la pestaña "Subir Facturas" para generarlos automáticamente</div>
                  <button onClick={() => setTab("upload")} style={{ marginTop: 16, padding: "8px 18px", borderRadius: 8, background: `linear-gradient(135deg,${BRAND},#1aa8af)`, border: "none", color: "#051015", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    Subir facturas →
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {asientos.map((a, i) => (
                    <div key={a.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, overflow: "hidden" }}>
                      <div style={{ padding: "10px 16px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#374151" }}>#{String(i + 1).padStart(3, "0")}</span>
                          <span style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 13 }}>{a.concepto}</span>
                          {a.ya_pagada && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 99, background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>PAGADA</span>}
                        </div>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#6b7280" }}>{a.fecha}</span>
                          <span style={{ fontSize: 9, color: "#374151" }}>{a.archivo}</span>
                        </div>
                      </div>
                      <table style={{ margin: 0 }}>
                        <thead><tr><th style={{ width: 80 }}>Cuenta</th><th>Concepto</th><th style={{ textAlign: "right" }}>Debe</th><th style={{ textAlign: "right" }}>Haber</th></tr></thead>
                        <tbody>
                          {a.lineas.map((l, j) => (
                            <tr key={j}>
                              <td style={{ fontFamily: "'DM Mono',monospace", color: BRAND, fontWeight: 700, fontSize: 11 }}>{l.cuenta}</td>
                              <td style={{ color: "#d1d5db" }}>{l.nombre}</td>
                              <td style={{ textAlign: "right", fontFamily: "'DM Mono',monospace", color: l.debe > 0 ? "#f1f5f9" : "#374151" }}>{l.debe > 0 ? `${fmt(l.debe)}€` : "—"}</td>
                              <td style={{ textAlign: "right", fontFamily: "'DM Mono',monospace", color: l.haber > 0 ? "#ef4444" : "#374151" }}>{l.haber > 0 ? `${fmt(l.haber)}€` : "—"}</td>
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

          {/* ══ PLAN DE CUENTAS ══ */}
          {tab === "coa" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, marginBottom: 4 }}>Plan General Contable</h2>
                  <p style={{ color: "#4b5563", fontSize: 12 }}>PGC España · {allAccounts.length} cuentas · se actualiza al importar facturas</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar..." style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 8, padding: "6px 12px", color: "#e5e7eb", fontSize: 11, width: 160 }} />
                  {["todos", "ACT", "PAS", "ING", "GAS"].map(t => (
                    <button key={t} onClick={() => setFiltroTipo(t)} style={{ padding: "5px 10px", borderRadius: 99, background: filtroTipo === t ? "rgba(57,208,216,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${filtroTipo === t ? "rgba(57,208,216,0.35)" : "rgba(255,255,255,0.07)"}`, color: filtroTipo === t ? BRAND : "#6b7280", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                      {t === "todos" ? "Todos" : TIPO_CFG[t]?.label || t}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
                <table>
                  <thead><tr><th>Código</th><th>Cuenta</th><th>Tipo</th><th style={{ textAlign: "right" }}>Saldo</th><th>Descripción</th></tr></thead>
                  <tbody>
                    {cuentasFiltradas.map(c => {
                      const cfg = TIPO_CFG[c.tipo];
                      return (
                        <tr key={c.cod}>
                          <td style={{ color: BRAND, fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>{c.cod}</td>
                          <td style={{ color: "#f1f5f9", fontWeight: 500 }}>{c.nombre}</td>
                          <td><span style={{ padding: "2px 7px", borderRadius: 99, background: cfg.bg, color: cfg.color, fontSize: 10, fontWeight: 700 }}>{cfg.label}</span></td>
                          <td style={{ textAlign: "right", fontFamily: "'DM Mono',monospace", color: c.saldo > 0 ? cfg.color : "#374151", fontWeight: c.saldo > 0 ? 700 : 400 }}>{c.saldo > 0 ? `${fmt(c.saldo)}€` : "—"}</td>
                          <td style={{ color: "#4b5563", fontSize: 11 }}>{c.desc || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", fontSize: 11, color: "#4b5563" }}>
                  <span>Mostrando {cuentasFiltradas.length} de {allAccounts.length} cuentas</span>
                  <span>Total: <strong style={{ color: BRAND }}>{fmt(cuentasFiltradas.reduce((s, c) => s + c.saldo, 0))}€</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* ══ P&L ══ */}
          {tab === "pyl" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <div style={{ marginBottom: 18 }}>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, marginBottom: 4 }}>Cuenta de Pérdidas y Ganancias</h2>
                <p style={{ color: "#4b5563", fontSize: 12 }}>Acumulado 2026 · se actualiza automáticamente al importar facturas</p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden", maxWidth: 680 }}>
                {[
                  { label: "(+) Cuotas socios TPV", val: coa["700"]?.saldo || 0, color: "#22c55e" },
                  { label: "(+) Cuotas socios efectivo", val: coa["702"]?.saldo || 0, color: "#22c55e" },
                  { label: "(+) Otros ingresos", val: coa["709"]?.saldo || 0, color: "#22c55e" },
                  { label: "= INGRESOS NETOS", val: totalIngresos, color: "#22c55e", bold: true, sep: true },
                  { label: "(-) Arrendamiento local", val: -(coa["621"]?.saldo || 0), color: "#ef4444" },
                  { label: "(-) Servicios profesionales", val: -(coa["623"]?.saldo || 0), color: "#ef4444" },
                  { label: "(-) Seguros", val: -(coa["625"]?.saldo || 0), color: "#ef4444" },
                  { label: "(-) Suministros", val: -(coa["628"]?.saldo || 0), color: "#ef4444" },
                  { label: "(-) Otros servicios", val: -(coa["629"]?.saldo || 0), color: "#ef4444" },
                  { label: "(-) Sueldos y salarios", val: -(coa["640"]?.saldo || 0), color: "#ef4444" },
                  { label: "(-) SS empresa", val: -(coa["642"]?.saldo || 0), color: "#ef4444" },
                  { label: "(-) Publicidad", val: -(coa["627"]?.saldo || 0), color: "#ef4444" },
                  { label: "(-) Intereses préstamos", val: -(coa["662"]?.saldo || 0), color: "#ef4444" },
                  { label: "= RESULTADO DEL EJERCICIO", val: resultado, color: resultado >= 0 ? "#22c55e" : "#ef4444", bold: true, sep: true, big: true },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: row.bold ? "12px 20px" : "9px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", background: row.sep && row.bold ? "rgba(255,255,255,0.03)" : "transparent" }}>
                    <span style={{ color: row.bold ? "#f1f5f9" : "#9ca3af", fontWeight: row.bold ? 700 : 400, fontSize: row.big ? 14 : 12 }}>{row.label}</span>
                    <span style={{ color: row.val === 0 ? "#374151" : row.color, fontWeight: row.bold ? 800 : 600, fontSize: row.big ? 16 : 12, fontFamily: row.big ? "'Fraunces',serif" : "'DM Mono',monospace" }}>
                      {row.val === 0 ? "—" : `${row.val >= 0 ? "+" : ""}${fmt(row.val)}€`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ BALANCE ══ */}
          {tab === "balance" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <div style={{ marginBottom: 18 }}>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, marginBottom: 4 }}>Balance de Situación</h2>
                <p style={{ color: "#4b5563", fontSize: 12 }}>Se actualiza automáticamente al importar facturas</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid rgba(57,208,216,0.2)`, borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "14px 18px", background: "rgba(57,208,216,0.08)", borderBottom: `1px solid rgba(57,208,216,0.2)` }}>
                    <div style={{ color: BRAND, fontWeight: 700, fontSize: 14 }}>ACTIVO</div>
                    <div style={{ color: "#9ca3af", fontSize: 11 }}>Bienes y derechos</div>
                  </div>
                  {allAccounts.filter(c => c.tipo === "ACT").map(c => (
                    <div key={c.cod} style={{ display: "flex", justifyContent: "space-between", padding: "8px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                      <span style={{ color: "#9ca3af" }}><span style={{ color: "#374151", fontFamily: "'DM Mono',monospace", fontSize: 10 }}>{c.cod} </span>{c.nombre}</span>
                      <span style={{ color: c.saldo > 0 ? BRAND : "#374151", fontWeight: c.saldo > 0 ? 700 : 400 }}>{c.saldo > 0 ? `${fmt(c.saldo)}€` : "—"}</span>
                    </div>
                  ))}
                  <div style={{ padding: "12px 18px", borderTop: `2px solid rgba(57,208,216,0.3)`, display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#f1f5f9", fontWeight: 700 }}>TOTAL ACTIVO</span>
                    <span style={{ color: BRAND, fontWeight: 800, fontFamily: "'Fraunces',serif" }}>{fmt(totalActivo)}€</span>
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "14px 18px", background: "rgba(239,68,68,0.06)", borderBottom: "1px solid rgba(239,68,68,0.2)" }}>
                    <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 14 }}>PASIVO + PATRIMONIO NETO</div>
                    <div style={{ color: "#9ca3af", fontSize: 11 }}>Fuentes de financiación</div>
                  </div>
                  {allAccounts.filter(c => c.tipo === "PAS").map(c => (
                    <div key={c.cod} style={{ display: "flex", justifyContent: "space-between", padding: "8px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                      <span style={{ color: "#9ca3af" }}><span style={{ color: "#374151", fontFamily: "'DM Mono',monospace", fontSize: 10 }}>{c.cod} </span>{c.nombre}</span>
                      <span style={{ color: c.saldo > 0 ? "#ef4444" : "#374151", fontWeight: c.saldo > 0 ? 700 : 400 }}>{c.saldo > 0 ? `${fmt(c.saldo)}€` : "—"}</span>
                    </div>
                  ))}
                  <div style={{ padding: "12px 18px", borderTop: "2px solid rgba(239,68,68,0.3)", display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#f1f5f9", fontWeight: 700 }}>TOTAL PASIVO</span>
                    <span style={{ color: "#ef4444", fontWeight: 800, fontFamily: "'Fraunces',serif" }}>{fmt(totalPasivo)}€</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

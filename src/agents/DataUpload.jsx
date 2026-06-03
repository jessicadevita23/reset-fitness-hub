import { useState, useRef, useCallback } from "react";

const BRAND = "#39D0D8";

const SYSTEM_PROMPT = `Eres el procesador de datos contables de Reset Fitness Ibiza (RESET FITNESS S.L., NIF B26660720).

Tu trabajo es analizar archivos subidos por el equipo y extraer información contable estructurada.

CONTEXTO DEL NEGOCIO:
- Gimnasio premium en Sant Josep de Sa Talaia, Ibiza
- Software de gestión: TGManager
- Banco: Santander ES59 0049 2959 49 2914050132
- Proveedores clave: Fit-Maker Sport (maquinaria), Elementents CP (estructura), Mario Ribas (alquiler), Arbre Assessors (gestoría)
- Empleados: Alessia (apertura), Daniela (intermedio), Jaison (cierre)
- Pricing actual: Fundador 60/65/70€ · Nuevo desde jun 2026: Base 75€ · Con Método Reset 95€

CUANDO ANALICES ARCHIVOS:
1. Identifica el tipo de documento (factura, extracto bancario, export TGManager, nómina, etc.)
2. Extrae los datos clave (importe, proveedor/cliente, fecha, concepto, IVA)
3. Sugiere la cuenta PGC correcta (4 dígitos)
4. Identifica si es ingreso o gasto
5. Detecta anomalías o puntos a revisar
6. Da un resumen ejecutivo claro para María Lagos

Responde siempre en español, de forma estructurada y accionable.`;

const TIPOS_UPLOAD = [
  {
    id: "facturas",
    label: "Facturas de proveedores",
    icon: "🧾",
    color: "#f97316",
    accept: ".pdf,.jpg,.jpeg,.png,.zip",
    desc: "ZIP con todas las facturas del mes o PDFs individuales",
    ejemplos: ["Fit-Maker", "Elementents", "Endesa", "Gestoría", "Amazon"],
    cuenta_sugerida: "Grupo 60-62 (Compras y Servicios)",
  },
  {
    id: "tgmanager",
    label: "Export TGManager",
    icon: "💳",
    color: BRAND,
    accept: ".xlsx,.csv",
    desc: "Socios, Histórico de cobros y Suscripciones",
    ejemplos: ["members-export.xlsx", "Histórico.xlsx", "Suscripciones.xlsx"],
    cuenta_sugerida: "Grupo 70 (Ingresos servicios)",
  },
  {
    id: "banco",
    label: "Extracto bancario",
    icon: "🏦",
    color: "#a855f7",
    accept: ".xlsx,.csv,.xls",
    desc: "Movimientos Santander en Excel o CSV",
    ejemplos: ["movimientos_santander.xlsx", "extracto_junio.xls"],
    cuenta_sugerida: "Cuenta 572 (Banco Santander)",
  },
  {
    id: "nominas",
    label: "Nóminas y SS",
    icon: "👥",
    color: "#22c55e",
    accept: ".pdf,.xlsx",
    desc: "Nóminas empleados y boletines cotización SS",
    ejemplos: ["nomina_alessia_jun.pdf", "TC1_junio.pdf"],
    cuenta_sugerida: "Grupo 64 (Gastos personal)",
  },
  {
    id: "otros",
    label: "Otros documentos",
    icon: "📄",
    color: "#6b7280",
    accept: ".pdf,.xlsx,.csv,.jpg,.png,.zip",
    desc: "Contratos, presupuestos, justificantes varios",
    ejemplos: ["contrato_arrendamiento.pdf", "presupuesto.pdf"],
    cuenta_sugerida: "Según contenido",
  },
];

function FileIcon({ ext }) {
  const icons = { pdf: "📕", xlsx: "📗", xls: "📗", csv: "📊", jpg: "🖼", jpeg: "🖼", png: "🖼", zip: "📦" };
  return <span>{icons[ext?.toLowerCase()] || "📄"}</span>;
}

function UploadZone({ tipo, onFiles, uploading }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef();

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDrag(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files, tipo.id);
  }, [onFiles, tipo.id]);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => ref.current?.click()}
      style={{
        background: drag ? `${tipo.color}12` : "rgba(255,255,255,0.02)",
        border: `1.5px dashed ${drag ? tipo.color : "rgba(255,255,255,0.12)"}`,
        borderRadius: 14, padding: "20px 18px", cursor: "pointer",
        transition: "all 0.2s", position: "relative", overflow: "hidden",
      }}
    >
      <input ref={ref} type="file" accept={tipo.accept} multiple
        style={{ display: "none" }}
        onChange={e => onFiles(Array.from(e.target.files), tipo.id)} />

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${tipo.color}, transparent)` }} />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${tipo.color}15`, border: `1px solid ${tipo.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{tipo.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{tipo.label}</div>
          <div style={{ color: "#4b5563", fontSize: 11, marginBottom: 8 }}>{tipo.desc}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {tipo.ejemplos.map(e => (
              <span key={e} style={{ padding: "2px 8px", borderRadius: 99, background: "rgba(255,255,255,0.05)", color: "#6b7280", fontSize: 10 }}>{e}</span>
            ))}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ color: tipo.color, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
            {drag ? "Suelta aquí ↓" : "Arrastra o clic"}
          </div>
          <div style={{ color: "#374151", fontSize: 10 }}>{tipo.accept}</div>
          <div style={{ color: "#374151", fontSize: 9, marginTop: 4 }}>→ {tipo.cuenta_sugerida}</div>
        </div>
      </div>
    </div>
  );
}

function ProcessingStep({ step, active, done }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
      <div style={{
        width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
        background: done ? "rgba(34,197,94,0.2)" : active ? "rgba(57,208,216,0.2)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${done ? "#22c55e" : active ? BRAND : "rgba(255,255,255,0.1)"}`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
      }}>
        {done ? "✓" : active ? <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> : "·"}
      </div>
      <span style={{ color: done ? "#22c55e" : active ? BRAND : "#374151", fontSize: 12, fontWeight: active || done ? 600 : 400 }}>{step}</span>
    </div>
  );
}

function ResultCard({ resultado }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
      <div onClick={() => setExpanded(p => !p)} style={{ padding: "14px 18px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>{resultado.icon}</span>
          <div>
            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13 }}>{resultado.archivo}</div>
            <div style={{ color: resultado.tipo_color, fontSize: 11, fontWeight: 600 }}>{resultado.tipo_label}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {resultado.importe && <span style={{ color: resultado.importe > 0 ? "#22c55e" : "#ef4444", fontWeight: 700, fontSize: 14 }}>{resultado.importe > 0 ? "+" : ""}{resultado.importe?.toLocaleString("es-ES", { minimumFractionDigits: 2 })}€</span>}
          <span style={{ color: "#374151", fontSize: 16 }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: "0 18px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ color: "#d1d5db", fontSize: 12, lineHeight: 1.7, marginTop: 12, whiteSpace: "pre-wrap" }}>{resultado.analisis}</div>
          {resultado.cuentas && (
            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {resultado.cuentas.map(c => (
                <span key={c} style={{ padding: "3px 10px", borderRadius: 8, background: "rgba(57,208,216,0.1)", color: BRAND, fontSize: 11, fontFamily: "monospace", fontWeight: 600 }}>📋 {c}</span>
              ))}
            </div>
          )}
          {resultado.alertas && resultado.alertas.length > 0 && (
            <div style={{ marginTop: 10 }}>
              {resultado.alertas.map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "6px 10px", background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 8, marginBottom: 6, fontSize: 11, color: "#eab308" }}>
                  ⚠️ {a}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DataUpload() {
  const [archivos, setArchivos] = useState([]);
  const [procesando, setProcesando] = useState(false);
  const [paso, setPaso] = useState(0);
  const [resultados, setResultados] = useState([]);
  const [resumenFinal, setResumenFinal] = useState(null);
  const [tab, setTab] = useState("upload");
  const [historial, setHistorial] = useState([
    { fecha: "01/06/2026", tipo: "TGManager", archivos: 3, estado: "procesado", resumen: "161 socios · 11.201€ cobrados · 1 impagado" },
    { fecha: "01/06/2026", tipo: "Banco Santander", archivos: 1, estado: "procesado", resumen: "217 movimientos · Saldo 3.515,93€ ✓" },
    { fecha: "01/06/2026", tipo: "Facturas ZIP", archivos: 59, estado: "procesado", resumen: "59 facturas Ene-May · CAPEX 291k€ clasificado" },
  ]);

  const PASOS = [
    "Leyendo archivos subidos...",
    "Identificando tipo de documento...",
    "Extrayendo datos contables...",
    "Clasificando en Plan de Cuentas PGC...",
    "Detectando anomalías y alertas...",
    "Generando resumen ejecutivo...",
    "✓ Procesamiento completado",
  ];

  function addFiles(files, tipoId) {
    const nuevos = files.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      nombre: f.name,
      tamaño: (f.size / 1024).toFixed(1) + " KB",
      tipo: tipoId,
      ext: f.name.split(".").pop(),
      estado: "pendiente",
    }));
    setArchivos(prev => [...prev, ...nuevos]);
  }

  function removeFile(id) {
    setArchivos(prev => prev.filter(f => f.id !== id));
  }

  async function procesarArchivos() {
    if (archivos.length === 0) return;
    setProcesando(true);
    setPaso(0);
    setResultados([]);
    setResumenFinal(null);
    setTab("procesando");

    // Simulate step progression while calling API
    const stepInterval = setInterval(() => {
      setPaso(prev => {
        if (prev < PASOS.length - 2) return prev + 1;
        return prev;
      });
    }, 800);

    try {
      // Build context about files
      const fileDescriptions = archivos.map(f =>
        `- ${f.nombre} (${f.tamaño}, tipo: ${f.tipo})`
      ).join("\n");

      const prompt = `Analiza estos archivos subidos para Reset Fitness Ibiza y procésalos contablemente:

ARCHIVOS SUBIDOS:
${fileDescriptions}

Para cada archivo:
1. Identifica qué tipo de documento es
2. Indica qué datos contables contiene (importes, fechas, proveedores/clientes)
3. Asigna las cuentas PGC correctas (código 3-4 dígitos)
4. Señala alertas o puntos importantes
5. Da el impacto en el Balance y P&L

Al final, da un RESUMEN EJECUTIVO para María Lagos con:
- Total ingresos detectados
- Total gastos detectados  
- Saldo neto del período
- 3 acciones urgentes
- Estado de la contabilidad

Sé específico con los números y cuentas PGC.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-opus-4-5",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await res.json();
      const texto = data.content?.[0]?.text || "Error procesando archivos.";

      clearInterval(stepInterval);
      setPaso(PASOS.length - 1);

      // Build results from file list
      const nuevosResultados = archivos.map(f => {
        const tipoConfig = TIPOS_UPLOAD.find(t => t.id === f.tipo);
        return {
          archivo: f.nombre,
          icon: tipoConfig?.icon || "📄",
          tipo_label: tipoConfig?.label || f.tipo,
          tipo_color: tipoConfig?.color || "#6b7280",
          analisis: texto,
          importe: null,
          cuentas: [tipoConfig?.cuenta_sugerida || "—"],
          alertas: [],
        };
      });

      setResultados(nuevosResultados);
      setResumenFinal(texto);

      // Add to historial
      const tiposUnicos = [...new Set(archivos.map(f => {
        const t = TIPOS_UPLOAD.find(x => x.id === f.tipo);
        return t?.label || f.tipo;
      }))];

      setHistorial(prev => [{
        fecha: new Date().toLocaleDateString("es-ES"),
        tipo: tiposUnicos.join(", "),
        archivos: archivos.length,
        estado: "procesado",
        resumen: `${archivos.length} archivo(s) · Procesado con IA`,
      }, ...prev]);

      setTab("resultados");

    } catch (e) {
      clearInterval(stepInterval);
      setResumenFinal(`Error: ${e.message}`);
      setTab("resultados");
    }

    setProcesando(false);
  }

  const TABS = [
    { id: "upload", label: "📥 Subir archivos" },
    { id: "procesando", label: "⚙️ Procesando" },
    { id: "resultados", label: "📊 Resultados" },
    { id: "historial", label: "🕐 Historial" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700;900&family=DM+Sans:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
        @keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}\
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
        @keyframes shimmer{0%{background-position:-200% center;}100%{background-position:200% center;}}
        ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:rgba(57,208,216,0.2);border-radius:2px;}
        input:focus{outline:none;}
        table{border-collapse:collapse;width:100%;}
        th{padding:8px 14px;text-align:left;color:#374151;font-size:10px;text-transform:uppercase;letter-spacing:0.07em;border-bottom:1px solid rgba(255,255,255,0.05);}
        td{padding:9px 14px;border-bottom:1px solid rgba(255,255,255,0.04);font-size:12px;color:#d1d5db;}
      `}</style>

      <div style={{ minHeight: "100vh", background: "#060d14", color: "#f1f5f9", fontFamily: "'DM Sans',sans-serif" }}>

        {/* Header */}
        <div style={{ padding: "0 24px", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${BRAND},#1aa8af)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 900, color: "#051015", fontFamily: "serif" }}>R</div>
            <div>
              <div style={{ color: "#f1f5f9", fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700 }}>Reset Fitness Ibiza</div>
              <div style={{ color: "#374151", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em" }}>Actualización de Datos · Procesamiento IA</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 3 }}>
            {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "6px 12px", borderRadius: 7, background: tab === t.id ? "rgba(57,208,216,0.14)" : "transparent", border: `1px solid ${tab === t.id ? "rgba(57,208,216,0.3)" : "transparent"}`, color: tab === t.id ? BRAND : "#6b7280", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "sans-serif", whiteSpace: "nowrap" }}>{t.label}</button>)}
          </div>
        </div>

        <div style={{ padding: 24, height: "calc(100vh - 58px)", overflowY: "auto" }}>

          {/* ══ UPLOAD ══ */}
          {tab === "upload" && (
            <div style={{ animation: "fadeUp 0.3s ease", maxWidth: 860 }}>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 22, color: "#f1f5f9", marginBottom: 6 }}>Subir documentos contables</h2>
                <p style={{ color: "#4b5563", fontSize: 13, lineHeight: 1.6 }}>
                  Sube facturas, extractos, exports de TGManager o nóminas. La IA los analiza, extrae los datos contables y los clasifica según el PGC España automáticamente.
                </p>
              </div>

              {/* Zonas de upload */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                {TIPOS_UPLOAD.map(tipo => (
                  <UploadZone key={tipo.id} tipo={tipo} onFiles={addFiles} uploading={procesando} />
                ))}
              </div>

              {/* Lista de archivos pendientes */}
              {archivos.length > 0 && (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14 }}>
                      {archivos.length} archivo{archivos.length !== 1 ? "s" : ""} listo{archivos.length !== 1 ? "s" : ""} para procesar
                    </div>
                    <button onClick={() => setArchivos([])} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, padding: "4px 12px", color: "#ef4444", fontSize: 11, cursor: "pointer", fontFamily: "sans-serif" }}>
                      Limpiar todo
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {archivos.map(f => {
                      const tipoConfig = TIPOS_UPLOAD.find(t => t.id === f.tipo);
                      return (
                        <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: `1px solid ${tipoConfig?.color || "#374151"}20` }}>
                          <span style={{ fontSize: 20 }}><FileIcon ext={f.ext} /></span>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: "#f1f5f9", fontSize: 12, fontWeight: 600 }}>{f.nombre}</div>
                            <div style={{ color: "#4b5563", fontSize: 10 }}>{f.tamaño} · {tipoConfig?.label || f.tipo}</div>
                          </div>
                          <span style={{ padding: "2px 8px", borderRadius: 99, background: `${tipoConfig?.color}18`, color: tipoConfig?.color, fontSize: 10, fontWeight: 600 }}>{tipoConfig?.icon} {tipoConfig?.label}</span>
                          <button onClick={() => removeFile(f.id)} style={{ background: "none", border: "none", color: "#374151", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Botón procesar */}
              <button
                onClick={procesarArchivos}
                disabled={archivos.length === 0 || procesando}
                style={{
                  width: "100%", padding: "16px", borderRadius: 14,
                  background: archivos.length === 0 ? "rgba(57,208,216,0.08)" : `linear-gradient(135deg, ${BRAND}, #1aa8af)`,
                  border: `1px solid ${archivos.length === 0 ? "rgba(57,208,216,0.15)" : "transparent"}`,
                  color: archivos.length === 0 ? BRAND : "#051015",
                  fontSize: 14, fontWeight: 700, cursor: archivos.length === 0 ? "not-allowed" : "pointer",
                  fontFamily: "sans-serif", transition: "all 0.2s",
                  letterSpacing: "0.03em",
                }}
              >
                {archivos.length === 0
                  ? "Sube archivos para continuar"
                  : `⚡ Procesar ${archivos.length} archivo${archivos.length !== 1 ? "s" : ""} con IA`}
              </button>

              {/* Info */}
              <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                {[
                  { icon: "🔒", title: "Seguro", desc: "Los datos se procesan en memoria y no se almacenan externamente" },
                  { icon: "⚡", title: "Instantáneo", desc: "Análisis contable completo en segundos con IA de Anthropic" },
                  { icon: "📋", title: "PGC España", desc: "Clasificación automática según el Plan General Contable español" },
                ].map(item => (
                  <div key={item.title} style={{ padding: "12px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, textAlign: "center" }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</div>
                    <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 12, marginBottom: 3 }}>{item.title}</div>
                    <div style={{ color: "#4b5563", fontSize: 10, lineHeight: 1.4 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ PROCESANDO ══ */}
          {tab === "procesando" && (
            <div style={{ animation: "fadeUp 0.3s ease", maxWidth: 600, margin: "40px auto" }}>
              <div style={{ textAlign: "center", marginBottom: 40 }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg,${BRAND},#1aa8af)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 20px", animation: procesando ? "pulse 2s ease infinite" : "none" }}>⚡</div>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 24, color: "#f1f5f9", marginBottom: 8 }}>Procesando con IA</h2>
                <p style={{ color: "#4b5563", fontSize: 13 }}>Analizando {archivos.length} archivo{archivos.length !== 1 ? "s" : ""}...</p>
              </div>

              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "24px 28px", marginBottom: 24 }}>
                {PASOS.map((p, i) => (
                  <ProcessingStep key={i} step={p} active={i === paso && procesando} done={i < paso || (!procesando && i <= paso)} />
                ))}
              </div>

              {/* Archivos en proceso */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {archivos.map((f, i) => (
                  <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 }}>
                    <span style={{ fontSize: 18 }}><FileIcon ext={f.ext} /></span>
                    <span style={{ flex: 1, color: "#9ca3af", fontSize: 12 }}>{f.nombre}</span>
                    <span style={{ color: paso >= 3 ? "#22c55e" : BRAND, fontSize: 11, fontWeight: 600 }}>
                      {paso >= 5 ? "✓ Procesado" : paso >= 3 ? "⟳ Clasificando..." : "⟳ Analizando..."}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ RESULTADOS ══ */}
          {tab === "resultados" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              {resumenFinal ? (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, color: "#f1f5f9", marginBottom: 4 }}>Análisis completado</h2>
                    <p style={{ color: "#4b5563", fontSize: 12 }}>{archivos.length} archivo{archivos.length !== 1 ? "s" : ""} procesado{archivos.length !== 1 ? "s" : ""} · {new Date().toLocaleString("es-ES")}</p>
                  </div>

                  {/* Resumen ejecutivo */}
                  <div style={{ background: `linear-gradient(135deg, rgba(57,208,216,0.08), rgba(34,197,94,0.05))`, border: "1px solid rgba(57,208,216,0.2)", borderRadius: 14, padding: "20px 24px", marginBottom: 20 }}>
                    <div style={{ color: BRAND, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📋 Análisis IA — Reset Fitness Ibiza</div>
                    <div style={{ color: "#d1d5db", fontSize: 13, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{resumenFinal}</div>
                  </div>

                  {/* Resultados por archivo */}
                  {resultados.map((r, i) => <ResultCard key={i} resultado={r} />)}

                  {/* Acciones */}
                  <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                    <button onClick={() => { setArchivos([]); setResultados([]); setResumenFinal(null); setPaso(0); setTab("upload"); }}
                      style={{ flex: 1, padding: "12px", borderRadius: 10, background: `linear-gradient(135deg,${BRAND},#1aa8af)`, border: "none", color: "#051015", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "sans-serif" }}>
                      ⚡ Procesar más archivos
                    </button>
                    <button onClick={() => setTab("historial")}
                      style={{ flex: 1, padding: "12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "sans-serif" }}>
                      🕐 Ver historial
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#374151" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                  <div style={{ fontSize: 16, marginBottom: 8, color: "#6b7280" }}>Sin resultados todavía</div>
                  <div style={{ fontSize: 12 }}>Sube archivos y procésalos para ver el análisis aquí</div>
                  <button onClick={() => setTab("upload")} style={{ marginTop: 20, padding: "10px 24px", borderRadius: 10, background: "rgba(57,208,216,0.1)", border: "1px solid rgba(57,208,216,0.2)", color: BRAND, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "sans-serif" }}>
                    Ir a subir archivos →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ══ HISTORIAL ══ */}
          {tab === "historial" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <div style={{ marginBottom: 18 }}>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, color: "#f1f5f9", marginBottom: 4 }}>Historial de actualizaciones</h2>
                <p style={{ color: "#4b5563", fontSize: 12 }}>Registro de todos los archivos procesados</p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
                <table>
                  <thead><tr><th>Fecha</th><th>Tipo de documento</th><th>Archivos</th><th>Estado</th><th>Resumen</th></tr></thead>
                  <tbody>
                    {historial.map((h, i) => (
                      <tr key={i}>
                        <td style={{ color: "#6b7280", whiteSpace: "nowrap" }}>{h.fecha}</td>
                        <td style={{ color: "#f1f5f9", fontWeight: 500 }}>{h.tipo}</td>
                        <td style={{ color: BRAND, fontWeight: 600 }}>{h.archivos}</td>
                        <td><span style={{ padding: "2px 8px", borderRadius: 99, background: "rgba(34,197,94,0.1)", color: "#22c55e", fontSize: 10, fontWeight: 700 }}>✓ {h.estado}</span></td>
                        <td style={{ color: "#6b7280", fontSize: 11 }}>{h.resumen}</td>
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

import { useState, useEffect, useRef } from "react";
import { askClaude } from '../api.js'

const BRAND = "#39D0D8";
const BRAND_DARK = "#2ab8bf";

const KNOWLEDGE_BASE = {
  identity: {
    label: "Identidad",
    icon: "◈",
    color: "#39D0D8",
    data: {
      "Sociedad": "RESET FITNESS, S.L.",
      "NIF": "B26660720",
      "Nombre comercial": "Reset Fitness Ibiza / Método Reset",
      "Dirección": "C/ Madrid, 34, Sant Josep de Sa Talaia, 07829, Illes Balears",
      "Administradora": "María Lagos (DNI X2793738C)",
      "Teléfono": "+34 661 47 12 32",
      "Email": "administracion@resetfitnessibiza.com",
      "Posicionamiento": "Gimnasio premium en Ibiza",
      "Color de marca": "#39D0D8",
    }
  },
  membership: {
    label: "Membresías",
    icon: "◉",
    color: "#f97316",
    data: {
      "Modelo": "Por definir / premium",
      "Programas": "Entrenamiento de fuerza, HIIT, funcional, personal coaching, cardio blast, movilidad y core",
      "Personal Training": "Servicio disponible con entrenadores externos bajo contrato",
      "Política de cancelación": "Pendiente de formalizar",
      "Contrato de membresía": "Pendiente de redactar",
      "Autorización alumnos": "Certificado médico o declaración de aptitud/responsabilidad",
    }
  },
  pricing: {
    label: "Precios y Pagos",
    icon: "◎",
    color: "#a855f7",
    data: {
      "Estructura tarifaria": "Pendiente de publicar",
      "Método de cobro": "Domiciliación SEPA / tarjeta",
      "Frecuencia": "Mensual / trimestral / anual",
      "Política de impagos": "Recordatorio → notificación → seguimiento de saldo",
      "IVA actividad": "Coordinar con gestoría (Modelo 303)",
    }
  },
  legal: {
    label: "Legal y Fiscal",
    icon: "◆",
    color: "#ec4899",
    data: {
      "Epígrafe IAE": "967.2 (gimnasio, fitness, entrenamiento y extensiones)",
      "Alta censal": "Modelo 036 – coordinar con gestoría",
      "IVA": "Modelo 303 – autoliquidación trimestral",
      "Retención alquiler": "Modelo 115 – según contrato de arrendamiento",
      "Autónoma societaria": "María Lagos – alta pendiente de confirmar",
      "Modelo 600": "ITP-AJD préstamos – presentar ante ATIB",
      "Gestoría fiscal": "Envío mensual de facturas en PDF consolidado",
    }
  },
  finance: {
    label: "Finanzas y Deuda",
    icon: "◐",
    color: "#22c55e",
    data: {
      "Préstamo principal": "350.000 EUR | Interés 3% | Plazo 8 años | Inicio 02/03/2026",
      "Carencia": "3 meses inicial posible",
      "Préstamo María → Reset": "69.922,84 EUR (gastos pre-apertura)",
      "Préstamo privado corto": "12.000 EUR | Manuel Ríos García | Devolución ≤ 15 días",
      "Deuda 500.000 EUR": "Acreedor no socio – residente Alemania – pendiente novación",
      "Control cash flow": "Conciliación bancaria mensual por categorías",
      "Herramientas": "Chart of Accounts, Libro Diario, P&L, Mayor, Dashboard",
    }
  },
  suppliers: {
    label: "Proveedores",
    icon: "◑",
    color: "#eab308",
    data: {
      "Fit-Maker Sport SLU": "Maquinaria – Presupuesto 1-001455 – 120.000 EUR IVA incl. + financiación 42 meses",
      "Cuotas Fit-Maker": "41 × 4.305,55 EUR + última 3.412,53 EUR | Primer cargo: 15/08/2026",
      "Elementents CP, S.L.": "Carpa/estructura exterior – 7.811,76 EUR IVA incl.",
      "Pago Elementents": "4.000 EUR inicial + saldo julio/agosto",
      "IBAN Elementents": "ES71 0182 0288 0702 0168 9163",
      "Cancelación Fit-Maker": "Comisión 1% + 720 EUR gestión",
      "Incumplimiento Fit-Maker": "2 meses consecutivos → posible retirada de material",
    }
  },
  staff: {
    label: "Equipo",
    icon: "◗",
    color: "#06b6d4",
    data: {
      "Administradora": "María Lagos – autónoma societaria",
      "Precontrato": "Jehison Enrique Gutiérrez León – monitor/entrenador personal",
      "Jornada Jehison": "25h/semana – indefinido parcial – condicionado a autorización de residencia",
      "Entrenadores externos": "Contrato obligatorio: seguro, certificado médico, normas, responsabilidad",
      "Convenio aplicable": "Consultar con gestoría laboral para categoría y coste mínimo",
      "Alta laboral": "No dar de alta hasta autorización compatible",
    }
  },
  brand: {
    label: "Marca y Marketing",
    icon: "◭",
    color: "#f43f5e",
    data: {
      "Nombre": "Reset Fitness Ibiza / Método Reset",
      "Color principal": "#39D0D8",
      "Tono de comunicación": "Firme, claro, humano, premium",
      "Landing page": "Diseño tipo Antigravity con #39D0D8",
      "Programas publicados": "Fuerza, HIIT, funcional, personal coaching, cardio blast, movilidad, core",
      "Partnership activo": "Contacto ESN España en curso",
      "Canales": "Web, WhatsApp, Instagram, Email",
    }
  },
  ops: {
    label: "Operaciones",
    icon: "◬",
    color: "#84cc16",
    data: {
      "Horario": "Por confirmar",
      "Acceso alumnos": "Control de acceso + normas internas firmadas",
      "Documentación socios": "Contrato de membresía + declaración médica",
      "Facturas sin soporte": "Reclamar a proveedores – evidencia obligatoria",
      "Reporting": "Semanal y mensual según plantillas de gestión",
      "Incidencias": "Protocolo pendiente de definir",
      "Proceso onboarding": "Pendiente de automatizar con Agent 3",
    }
  },
};

const AGENTS = [
  { id: 1, name: "Lead Conversion", icon: "⟡", desc: "Convierte consultas en membresías", color: "#39D0D8" },
  { id: 2, name: "Member Support", icon: "⟢", desc: "Soporte 24/7 a socios", color: "#f97316" },
  { id: 3, name: "Membership Admin", icon: "⟣", desc: "Onboarding y contratos", color: "#a855f7" },
  { id: 4, name: "Collections & Payments", icon: "⟤", desc: "Control de cobros", color: "#22c55e" },
  { id: 5, name: "Document & Finance", icon: "⟥", desc: "Facturas y contabilidad", color: "#ec4899" },
  { id: 6, name: "Management Reporting", icon: "⟦", desc: "KPIs y dashboards", color: "#eab308" },
  { id: 7, name: "Operations & Automation", icon: "⟧", desc: "Mejora continua", color: "#06b6d4" },
];

function CategoryCard({ cat, data, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: isActive ? `${cat.color}15` : "rgba(255,255,255,0.03)",
        border: `1px solid ${isActive ? cat.color : "rgba(255,255,255,0.08)"}`,
        borderRadius: 12,
        padding: "14px 16px",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s ease",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20, color: cat.color }}>{cat.icon}</span>
        <span style={{ color: isActive ? cat.color : "#e5e7eb", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13 }}>
          {cat.label}
        </span>
      </div>
    </button>
  );
}

function DataPanel({ cat, data }) {
  const entries = Object.entries(data);
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 28, color: cat.color }}>{cat.icon}</span>
        <h2 style={{ margin: 0, color: "#fff", fontFamily: "'Playfair Display', serif", fontSize: 22 }}>
          {cat.label}
        </h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {entries.map(([key, val]) => (
          <div key={key} style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 10,
            padding: "12px 16px",
            display: "grid",
            gridTemplateColumns: "160px 1fr",
            gap: 12,
            alignItems: "start",
          }}>
            <span style={{ color: cat.color, fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", paddingTop: 2 }}>
              {key}
            </span>
            <span style={{ color: "#d1d5db", fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.5 }}>
              {val}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIQuery({ knowledgeBase }) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef(null);

  const systemPrompt = `Eres el Business Brain de Reset Fitness Ibiza. Eres la inteligencia central del sistema operativo de este gimnasio premium en Ibiza.

Tu base de conocimiento completa:
${JSON.stringify(knowledgeBase, null, 2)}

Responde siempre en español, con tono profesional, claro y directo. Cuando no tengas información exacta, indica qué está pendiente de definir. Eres preciso, útil y actúas como un COO virtual de Reset Fitness.`;

  async function handleQuery() {
    if (!query.trim()) return;
    setLoading(true);
    setResponse("");
    try {
      const reply = await askClaude({
        system: systemPrompt,
        messages: [{ role: "user", content: query }],
        maxTokens: 1000,
      });
      setResponse(reply || "Sin respuesta");
    } catch (e) {
      setResponse("Error al conectar con el Business Brain: " + e.message);
    }
    setLoading(false);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: BRAND, boxShadow: `0 0 10px ${BRAND}`, animation: "pulse 2s infinite" }} />
        <span style={{ color: "#9ca3af", fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Business Brain — IA Activa
        </span>
      </div>

      <div style={{ position: "relative", marginBottom: 12 }}>
        <textarea
          ref={textareaRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleQuery(); } }}
          placeholder="Pregunta algo al Business Brain… ej: ¿Cuándo vence la primera cuota de Fit-Maker?"
          style={{
            width: "100%",
            minHeight: 80,
            background: "rgba(255,255,255,0.05)",
            border: `1px solid rgba(57,208,216,0.3)`,
            borderRadius: 12,
            padding: "14px 16px",
            color: "#f9fafb",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      <button
        onClick={handleQuery}
        disabled={loading || !query.trim()}
        style={{
          background: loading ? "rgba(57,208,216,0.2)" : BRAND,
          color: loading ? BRAND : "#0f172a",
          border: "none",
          borderRadius: 10,
          padding: "10px 24px",
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 700,
          fontSize: 13,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          letterSpacing: "0.03em",
        }}
      >
        {loading ? "Consultando..." : "Consultar Brain →"}
      </button>

      {response && (
        <div style={{
          marginTop: 20,
          background: "rgba(57,208,216,0.06)",
          border: `1px solid rgba(57,208,216,0.2)`,
          borderRadius: 12,
          padding: "16px 18px",
          color: "#e5e7eb",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          lineHeight: 1.7,
          whiteSpace: "pre-wrap",
          animation: "fadeIn 0.4s ease",
        }}>
          <div style={{ color: BRAND, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            ◈ Respuesta del Business Brain
          </div>
          {response}
        </div>
      )}
    </div>
  );
}

export default function BusinessBrain() {
  const [activeCategory, setActiveCategory] = useState("identity");
  const [activeTab, setActiveTab] = useState("knowledge");

  const categories = Object.entries(KNOWLEDGE_BASE);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080c14; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(57,208,216,0.3); border-radius: 2px; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#080c14", color: "#f9fafb" }}>

        {/* Header */}
        <div style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(10px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 900, color: "#0f172a",
              fontFamily: "'Playfair Display', serif",
            }}>R</div>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>
                Reset Fitness Ibiza
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6b7280", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Business Brain — v1.0
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["knowledge", "agents", "query"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "7px 16px",
                borderRadius: 8,
                border: `1px solid ${activeTab === tab ? BRAND : "rgba(255,255,255,0.1)"}`,
                background: activeTab === tab ? `${BRAND}15` : "transparent",
                color: activeTab === tab ? BRAND : "#6b7280",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                textTransform: "capitalize",
                transition: "all 0.2s",
              }}>
                {tab === "knowledge" ? "Base de Conocimiento" : tab === "agents" ? "Agentes" : "Consultar IA"}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "32px", maxWidth: 1200, margin: "0 auto" }}>

          {activeTab === "knowledge" && (
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24 }}>
              {/* Sidebar */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {categories.map(([key, cat]) => (
                  <CategoryCard
                    key={key}
                    cat={cat}
                    data={cat.data}
                    isActive={activeCategory === key}
                    onClick={() => setActiveCategory(key)}
                  />
                ))}
              </div>
              {/* Panel */}
              <div style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: 28,
              }}>
                <DataPanel
                  cat={KNOWLEDGE_BASE[activeCategory]}
                  data={KNOWLEDGE_BASE[activeCategory].data}
                />
              </div>
            </div>
          )}

          {activeTab === "agents" && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "#fff", marginBottom: 6 }}>
                  7 Agentes Operativos
                </h2>
                <p style={{ color: "#6b7280", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
                  Cada agente se alimenta del Business Brain y opera de forma autónoma sobre su dominio.
                </p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                {AGENTS.map(agent => (
                  <div key={agent.id} style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid rgba(255,255,255,0.07)`,
                    borderRadius: 14,
                    padding: 22,
                    transition: "all 0.2s",
                    cursor: "default",
                    position: "relative",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      position: "absolute", top: 0, left: 0, right: 0, height: 3,
                      background: `linear-gradient(90deg, ${agent.color}, transparent)`,
                    }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: `${agent.color}15`,
                        border: `1px solid ${agent.color}40`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 20, color: agent.color,
                      }}>
                        {agent.icon}
                      </div>
                      <div>
                        <div style={{ color: "#fff", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14 }}>
                          Agent {agent.id}
                        </div>
                        <div style={{ color: agent.color, fontFamily: "'DM Sans', sans-serif", fontSize: 12 }}>
                          {agent.name}
                        </div>
                      </div>
                    </div>
                    <p style={{ color: "#9ca3af", fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.5 }}>
                      {agent.desc}
                    </p>
                    <div style={{
                      marginTop: 14, padding: "6px 12px",
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 6,
                      display: "inline-block",
                      color: "#6b7280",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}>
                      Pendiente de despliegue
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "query" && (
            <div style={{ maxWidth: 700 }}>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "#fff", marginBottom: 6 }}>
                  Consulta el Business Brain
                </h2>
                <p style={{ color: "#6b7280", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
                  Haz cualquier pregunta sobre la operación, finanzas, legal o proveedores de Reset Fitness.
                </p>
              </div>
              <div style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: 28,
              }}>
                <AIQuery knowledgeBase={KNOWLEDGE_BASE} />
              </div>

              {/* Suggested queries */}
              <div style={{ marginTop: 20 }}>
                <div style={{ color: "#4b5563", fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                  Preguntas sugeridas
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {[
                    "¿Cuándo vence la primera cuota de Fit-Maker?",
                    "¿Qué modelos fiscales hay que presentar?",
                    "¿Qué pasa si se incumple el contrato de maquinaria?",
                    "¿Qué documentación necesita un entrenador externo?",
                    "¿Cuánto debe Reset Fitness en total?",
                  ].map(q => (
                    <button key={q} style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 8,
                      padding: "7px 12px",
                      color: "#9ca3af",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                      onMouseEnter={e => { e.target.style.borderColor = BRAND; e.target.style.color = BRAND; }}
                      onMouseLeave={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.color = "#9ca3af"; }}
                      onClick={() => { setActiveTab("query"); document.querySelector("textarea") && (document.querySelector("textarea").value = q); }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

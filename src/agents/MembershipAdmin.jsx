import { useState, useRef, useEffect } from "react";
import { askClaude } from '../api.js'

const BRAND = "#39D0D8";

// ── Mock member database ─────────────────────────────────────────
const INITIAL_MEMBERS = [
  { id: "RF001", name: "Ana Martínez", email: "ana@email.com", plan: "Anual", status: "activo", start: "2026-01-15", expiry: "2027-01-15", amount: 0, phone: "+34 612 345 678" },
  { id: "RF002", name: "Carlos Ruiz", email: "carlos@email.com", plan: "Mensual", status: "activo", start: "2026-05-01", expiry: "2026-06-01", amount: 0, phone: "+34 623 456 789" },
  { id: "RF003", name: "Sofia Klein", email: "sofia@email.com", plan: "Trimestral", status: "por-vencer", start: "2026-03-01", expiry: "2026-06-05", amount: 0, phone: "+34 634 567 890" },
  { id: "RF004", name: "Marco Rossi", email: "marco@email.com", plan: "Mensual", status: "expirado", start: "2026-04-01", expiry: "2026-05-01", amount: 0, phone: "+34 645 678 901" },
  { id: "RF005", name: "Laura Pérez", email: "laura@email.com", plan: "Anual", status: "activo", start: "2026-02-10", expiry: "2027-02-10", amount: 0, phone: "+34 656 789 012" },
];

const PLANS = [
  { id: "mensual", label: "Mensual", duration: 1, icon: "◌" },
  { id: "trimestral", label: "Trimestral", duration: 3, icon: "◎" },
  { id: "anual", label: "Anual", duration: 12, icon: "◉" },
];

const STATUS_CONFIG = {
  "activo":     { color: "#22c55e", bg: "rgba(34,197,94,0.1)",  label: "Activo",      icon: "●" },
  "por-vencer": { color: "#eab308", bg: "rgba(234,179,8,0.1)",  label: "Por vencer",  icon: "◑" },
  "expirado":   { color: "#ef4444", bg: "rgba(239,68,68,0.1)",  label: "Expirado",    icon: "○" },
  "pendiente":  { color: BRAND,     bg: "rgba(57,208,216,0.1)", label: "Pendiente",   icon: "◐" },
};

const SYSTEM_PROMPT = `Eres el Agente de Administración de Membresías de Reset Fitness Ibiza. Gestionas altas, bajas, renovaciones y contratos de socios.

GIMNASIO: Reset Fitness Ibiza / Método Reset — C/ Madrid 34, Sant Josep de Sa Talaia, 07829, Ibiza
EMAIL: administracion@resetfitnessibiza.com | TEL: +34 661 47 12 32

PLANES:
- Mensual: renovación automática mensual por SEPA
- Trimestral: 3 meses, renovación automática
- Anual: mejor precio, renovación anual

PROCESO DE ALTA:
1. Recopilar: nombre completo, email, teléfono, plan elegido
2. Confirmar datos y plan
3. Generar resumen del contrato
4. Explicar proceso de domiciliación SEPA
5. Indicar documentación: DNI/NIE + declaración médica de aptitud

RENOVACIONES:
- Automáticas por SEPA salvo aviso contrario
- Recordatorio 15 días antes de vencimiento
- Para cambiar plan: avisar con 7 días de antelación

BAJAS Y CONGELACIONES:
- Baja: preaviso mínimo 30 días
- Congelación: hasta 2 meses por año, solicitar por email

NORMAS CONTRACTUALES:
- Contrato indefinido con renovación automática
- Cesión prohibida de membresía
- Uso personal e intransferible

INSTRUCCIONES:
- Respuestas claras y estructuradas
- Cuando recopiles datos para un alta, confirma cada campo
- Genera contratos en formato limpio cuando se solicite
- Tono administrativo pero amable
- Si hay dudas legales complejas, deriva a administración`;

// ── Utilities ────────────────────────────────────────────────────
function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function now() {
  return new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

// ── Member row ───────────────────────────────────────────────────
function MemberRow({ m, onSelect, selected }) {
  const st = STATUS_CONFIG[m.status];
  const days = daysUntil(m.expiry);
  return (
    <div onClick={() => onSelect(m)} style={{
      display: "grid",
      gridTemplateColumns: "36px 1fr 100px 90px 80px",
      alignItems: "center", gap: 14,
      padding: "12px 16px",
      background: selected ? "rgba(57,208,216,0.07)" : "rgba(255,255,255,0.02)",
      border: `1px solid ${selected ? "rgba(57,208,216,0.3)" : "rgba(255,255,255,0.05)"}`,
      borderRadius: 10, cursor: "pointer",
      transition: "all 0.15s",
      marginBottom: 6,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: "50%",
        background: `linear-gradient(135deg, ${BRAND}30, ${BRAND}15)`,
        border: `1px solid ${BRAND}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: BRAND, fontSize: 13, fontWeight: 700,
      }}>{m.name[0]}</div>
      <div>
        <div style={{ color: "#e5e7eb", fontSize: 13, fontWeight: 600 }}>{m.name}</div>
        <div style={{ color: "#4b5563", fontSize: 11 }}>{m.email}</div>
      </div>
      <div style={{
        padding: "4px 10px", borderRadius: 99,
        background: st.bg, color: st.color,
        fontSize: 11, fontWeight: 700, textAlign: "center",
        whiteSpace: "nowrap",
      }}>{st.icon} {st.label}</div>
      <div style={{ color: "#6b7280", fontSize: 12 }}>{m.plan}</div>
      <div style={{ color: days < 10 ? "#ef4444" : days < 30 ? "#eab308" : "#4b5563", fontSize: 11 }}>
        {days > 0 ? `${days}d` : "Vencido"}
      </div>
    </div>
  );
}

// ── Member detail panel ──────────────────────────────────────────
function MemberDetail({ m, onRenew, onClose }) {
  const st = STATUS_CONFIG[m.status];
  const days = daysUntil(m.expiry);
  const plan = PLANS.find(p => p.label === m.plan) || PLANS[0];

  return (
    <div style={{ animation: "fadeUp 0.25s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ color: "#f1f5f9", fontSize: 18, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700 }}>{m.name}</div>
          <div style={{ color: "#4b5563", fontSize: 12 }}>ID: {m.id}</div>
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: "#6b7280", fontSize: 16 }}>×</button>
      </div>

      <div style={{
        background: st.bg, border: `1px solid ${st.color}40`,
        borderRadius: 10, padding: "10px 14px", marginBottom: 16,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ color: st.color, fontSize: 16 }}>{st.icon}</span>
        <span style={{ color: st.color, fontWeight: 700, fontSize: 13 }}>{st.label}</span>
        {days > 0 && <span style={{ color: st.color, fontSize: 12, marginLeft: "auto" }}>Vence en {days} días</span>}
      </div>

      {[
        ["📧 Email", m.email],
        ["📞 Teléfono", m.phone],
        ["📋 Plan", m.plan],
        ["📅 Inicio", fmtDate(m.start)],
        ["⏳ Vencimiento", fmtDate(m.expiry)],
      ].map(([k, v]) => (
        <div key={k} style={{
          display: "flex", justifyContent: "space-between",
          padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
          fontSize: 13,
        }}>
          <span style={{ color: "#4b5563" }}>{k}</span>
          <span style={{ color: "#9ca3af", fontWeight: 500 }}>{v}</span>
        </div>
      ))}

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={() => onRenew(m, plan)} style={{
          padding: "10px", background: BRAND, border: "none", borderRadius: 10,
          color: "#051015", fontWeight: 700, fontSize: 13, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
        }}>↻ Renovar membresía</button>
        <button style={{
          padding: "10px", background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
          color: "#6b7280", fontSize: 13, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
        }}>✉ Enviar recordatorio</button>
      </div>
    </div>
  );
}

// ── Onboarding form ──────────────────────────────────────────────
const inputStyle = {
  width: "100%", background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.09)", borderRadius: 9,
  padding: "10px 14px", color: "#e5e7eb",
  fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: "none",
};
const labelStyle = { color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 };

function OnboardingForm({ onSubmit }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", plan: "mensual" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit() {
    if (!form.name || !form.email || !form.phone) return;
    const today = new Date().toISOString().split("T")[0];
    const plan = PLANS.find(p => p.id === form.plan);
    const expiry = addMonths(today, plan.duration);
    onSubmit({
      id: "RF" + String(Math.floor(Math.random() * 900) + 100),
      name: form.name, email: form.email, phone: form.phone,
      plan: plan.label, status: "pendiente",
      start: today, expiry, amount: 0,
    });
    setForm({ name: "", email: "", phone: "", plan: "mensual" });
  }

  return (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      <h3 style={{ color: "#f1f5f9", fontFamily: "'Cormorant Garamond', serif", fontSize: 18, marginBottom: 18 }}>
        Alta de nuevo socio
      </h3>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Nombre completo</label>
        <input type="text" value={form.name} onChange={e => set("name", e.target.value)} placeholder="María García López" style={inputStyle} />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Email</label>
        <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="maria@email.com" style={inputStyle} />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Teléfono</label>
        <input type="text" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+34 600 000 000" style={inputStyle} />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 8 }}>Plan</label>
        <div style={{ display: "flex", gap: 8 }}>
          {PLANS.map(p => (
            <button key={p.id} onClick={() => set("plan", p.id)} style={{
              flex: 1, padding: "10px 8px",
              background: form.plan === p.id ? `${BRAND}18` : "rgba(255,255,255,0.04)",
              border: `1px solid ${form.plan === p.id ? BRAND + "60" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 9, cursor: "pointer",
              color: form.plan === p.id ? BRAND : "#6b7280",
              fontSize: 12, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.15s",
            }}>
              <div style={{ fontSize: 16, marginBottom: 3 }}>{p.icon}</div>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleSubmit} disabled={!form.name || !form.email || !form.phone} style={{
        width: "100%", padding: "12px",
        background: !form.name || !form.email || !form.phone ? "rgba(57,208,216,0.15)" : BRAND,
        border: "none", borderRadius: 10,
        color: !form.name || !form.email || !form.phone ? BRAND : "#051015",
        fontWeight: 700, fontSize: 14, cursor: "pointer",
        fontFamily: "'DM Sans', sans-serif",
        transition: "all 0.2s",
      }}>
        + Crear membresía
      </button>
    </div>
  );
}

// ── Chat bubble ──────────────────────────────────────────────────
function Bubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 12, animation: "popIn 0.22s ease" }}>
      {!isUser && (
        <div style={{
          width: 30, height: 30, borderRadius: "50%",
          background: `linear-gradient(135deg, ${BRAND}, #1aa8af)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, color: "#051015", fontWeight: 900,
          marginRight: 8, flexShrink: 0, alignSelf: "flex-end", fontFamily: "serif",
        }}>R</div>
      )}
      <div style={{
        maxWidth: "80%",
        background: isUser ? "#111827" : "rgba(57,208,216,0.07)",
        border: isUser ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(57,208,216,0.2)",
        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        padding: "10px 14px", color: "#e2e8f0",
        fontSize: 13, lineHeight: 1.6,
        fontFamily: "'DM Sans', sans-serif", whiteSpace: "pre-wrap",
      }}>
        {msg.content}
        <div style={{ fontSize: 10, color: "#374151", marginTop: 3, textAlign: "right" }}>{msg.time}</div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────
const STORAGE_KEY = "rf_members_v1";

export default function MembershipAdmin() {
  const [members, setMembers] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_MEMBERS;
  });
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("members");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hola 👋 Soy el agente de administración de membresías. Puedo ayudarte a gestionar altas, renovaciones, contratos y el estado de los socios.\n\n¿Qué necesitas gestionar hoy?", time: now() }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  // Persistencia en localStorage
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(members)); } catch {}
  }, [members]);

  function showNotif(msg, color = "#22c55e") {
    setNotification({ msg, color });
    setTimeout(() => setNotification(null), 3500);
  }

  function handleNewMember(m) {
    setMembers(prev => [m, ...prev]);
    showNotif(`✓ Membresía creada para ${m.name}`);
    setActiveTab("members");
  }

  function handleDelete(m) {
    if (!confirm(`¿Eliminar a ${m.name}?`)) return;
    setMembers(prev => prev.filter(x => x.id !== m.id));
    setSelected(null);
    showNotif(`🗑 ${m.name} eliminado`, "#ef4444");
  }

  function handleClearAll() {
    if (!confirm("¿Borrar TODOS los socios? Esta acción no se puede deshacer.")) return;
    setMembers([]);
    showNotif("Todos los socios eliminados", "#ef4444");
  }

  // Regex Day Pass (compartido entre filtro de import y limpieza posterior)
  const DAY_PASS_REGEX = /\b(day[\s-]?pass|daypass|clase[\s-]?d[ií]a|pase[\s-]?(d[ií]a|diario|de[\s-]?un[\s-]?d[ií]a)|drop[\s-]?in|dropin|1[\s-]?d[ií]a|un[\s-]?d[ií]a|puntual|invitad[oa]|trial|sesi[oó]n[\s-]?suelta|visita[\s-]?[uú]nica)\b/i;

  function handleCleanDayPasses() {
    const toRemove = members.filter(m => DAY_PASS_REGEX.test(m.name) || DAY_PASS_REGEX.test(m.plan || ""));
    if (!toRemove.length) { showNotif("✓ No hay day passes en la lista", "#22c55e"); return; }
    if (!confirm(`¿Eliminar ${toRemove.length} day pass(es) de la lista?`)) return;
    setMembers(prev => prev.filter(m => !DAY_PASS_REGEX.test(m.name) && !DAY_PASS_REGEX.test(m.plan || "")));
    showNotif(`🧹 ${toRemove.length} day pass(es) eliminados`);
  }

  async function handleImport(files) {
    const file = files?.[0];
    if (!file) return;
    showNotif("📥 Leyendo archivo...", "#39D0D8");
    try {
      await new Promise((res, rej) => {
        if (window.XLSX) return res();
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
      const ab = await file.arrayBuffer();
      const wb = window.XLSX.read(ab, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = window.XLSX.utils.sheet_to_json(ws, { defval: "" });
      if (!rows.length) { showNotif("⚠️ Archivo vacío", "#ef4444"); return; }

      // Formatea fechas Date a YYYY-MM-DD; valores no-fecha vuelven como string
      const fmtDate = v => {
        if (v instanceof Date && !isNaN(v)) return v.toISOString().split("T")[0];
        if (typeof v === "string" && v.trim()) return v.trim();
        return "";
      };

      // pick(): primero match exacto del header; si falla, match parcial (header incluye la key)
      const pick = (row, keys, asDate = false) => {
        const headers = Object.keys(row);
        for (const k of keys) {
          const exact = headers.find(rk => rk.toLowerCase().trim() === k.toLowerCase());
          if (exact && row[exact] !== "" && row[exact] != null) {
            return asDate ? fmtDate(row[exact]) : String(row[exact]).trim();
          }
        }
        for (const k of keys) {
          const partial = headers.find(rk => rk.toLowerCase().trim().includes(k.toLowerCase()));
          if (partial && row[partial] !== "" && row[partial] != null) {
            return asDate ? fmtDate(row[partial]) : String(row[partial]).trim();
          }
        }
        return "";
      };

      const today = new Date().toISOString().split("T")[0];
      let dayPassCount = 0;
      let skippedNoName = 0;

      const imported = rows.map((r, i) => {
        // Nombre + Apellidos (export de TGManager separa los campos)
        const first = pick(r, ["nombre", "name", "first name"]);
        const last = pick(r, ["apellidos", "apellido", "last name", "surname"]);
        const name = [first, last].filter(Boolean).join(" ").trim()
          || pick(r, ["socio", "cliente", "nombre completo"]);
        if (!name) { skippedNoName++; return null; }

        const plan = pick(r, ["membresía", "membresia", "plan", "tarifa"]) || "Mensual";

        // Filtro day pass: nombre, plan, tipo, concepto, o cualquier valor de la fila
        if (DAY_PASS_REGEX.test(name) || DAY_PASS_REGEX.test(plan)) { dayPassCount++; return null; }
        const extra = [
          pick(r, ["tipo", "type", "categoria", "categoría"]),
          pick(r, ["concepto", "descripcion", "descripción", "producto"]),
        ].join(" ");
        if (extra && DAY_PASS_REGEX.test(extra)) { dayPassCount++; return null; }
        let foundDP = false;
        for (const v of Object.values(r)) {
          if (typeof v === "string" && DAY_PASS_REGEX.test(v)) { foundDP = true; break; }
        }
        if (foundDP) { dayPassCount++; return null; }

        const email = pick(r, ["email", "correo", "e-mail", "mail"]);
        const phone = pick(r, ["teléfono", "telefono", "phone", "movil", "móvil"]);
        const idExt = pick(r, ["id. socio", "id socio", "id externo", "id"]);
        const rawStatus = (pick(r, ["estado membresía", "estado membresia", "estado", "status"]) || "activo").toLowerCase();
        const start = pick(r, ["fecha inicio", "fecha de alta", "alta", "inicio", "start"], true) || today;
        const expiry = pick(r, ["fecha fin", "próximo pago", "proximo pago", "vencimiento", "expiry", "fin"], true) || addMonths(today, 1);

        // Mapeo de estado
        let status = "activo";
        if (rawStatus.includes("cancel")) status = "cancelado";
        else if (rawStatus.includes("impag")) status = "expirado";
        else if (rawStatus.includes("activ")) status = "activo";
        else if (rawStatus.includes("venc")) status = "por-vencer";
        else if (rawStatus.includes("expir")) status = "expirado";

        // Recalcular por-vencer si faltan menos de 14 días para el vencimiento
        if (status === "activo" && expiry) {
          const days = Math.ceil((new Date(expiry) - new Date()) / 86400000);
          if (days < 0) status = "expirado";
          else if (days <= 14) status = "por-vencer";
        }

        return {
          id: idExt ? "RF" + String(idExt).padStart(3, "0") : "RF" + String(i + 1).padStart(4, "0"),
          name, email, phone, plan, status, start, expiry, amount: 0,
        };
      }).filter(Boolean);

      if (!imported.length) {
        showNotif(`⚠️ 0 socios importados${dayPassCount ? ` (${dayPassCount} day passes excluidos)` : ""}`, "#ef4444");
        return;
      }
      setMembers(imported);
      const extras = [];
      if (dayPassCount) extras.push(`${dayPassCount} day passes excluidos`);
      if (skippedNoName) extras.push(`${skippedNoName} filas sin nombre`);
      showNotif(`✓ ${imported.length} socios importados${extras.length ? ` (${extras.join(", ")})` : ""}`);
    } catch (e) {
      showNotif(`⚠️ Error: ${e.message}`, "#ef4444");
    }
  }

  function handleRenew(m, plan) {
    setMembers(prev => prev.map(x => x.id === m.id ? {
      ...x, status: "activo",
      start: new Date().toISOString().split("T")[0],
      expiry: addMonths(new Date().toISOString().split("T")[0], plan.duration),
    } : x));
    setSelected(null);
    showNotif(`↻ Membresía de ${m.name} renovada`);
  }

  async function sendMessage(text) {
    const txt = text || input.trim();
    if (!txt) return;
    setInput("");
    const userMsg = { role: "user", content: txt, time: now() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);
    setActiveTab("asistente");

    const context = `\nSOCIOS ACTUALES:\n${members.map(m => `${m.id} | ${m.name} | ${m.plan} | ${m.status} | vence: ${m.expiry}`).join("\n")}`;

    try {
      const reply = await askClaude({ system: SYSTEM_PROMPT, messages: updated.map(m => ({ role: m.role, content: m.content })) });
      setMessages(prev => [...prev, { role: "assistant", content: reply, time: now() }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error de conexión. Contacta administración.", time: now() }]);
    }
    setLoading(false);
  }

  const stats = {
    total: members.length,
    activos: members.filter(m => m.status === "activo").length,
    porVencer: members.filter(m => m.status === "por-vencer").length,
    expirados: members.filter(m => m.status === "expirado").length,
  };

  const TABS = ["members", "alta", "asistente"];
  const TAB_LABELS = { members: "👥 Socios", alta: "＋ Alta", asistente: "🤖 Asistente" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
        @keyframes popIn{from{opacity:0;transform:scale(0.92);}to{opacity:1;transform:scale(1);}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}
        ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:rgba(57,208,216,0.2);border-radius:2px;}
        input:focus,textarea:focus{outline:none;border-color:rgba(57,208,216,0.4) !important;}
      `}</style>

      <div style={{ minHeight: "100vh", background: "#07090f", color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>

        {/* Notification */}
        {notification && (
          <div style={{
            position: "fixed", top: 20, right: 20, zIndex: 999,
            background: `${notification.color}18`,
            border: `1px solid ${notification.color}50`,
            borderRadius: 10, padding: "12px 20px",
            color: notification.color, fontSize: 13, fontWeight: 600,
            animation: "slideDown 0.3s ease",
            backdropFilter: "blur(12px)",
          }}>{notification.msg}</div>
        )}

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
              <div style={{ color: "#4b5563", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>Agente 3 — Membership Admin</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4 }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "7px 14px", borderRadius: 8,
                background: activeTab === tab ? "rgba(57,208,216,0.14)" : "transparent",
                border: `1px solid ${activeTab === tab ? "rgba(57,208,216,0.3)" : "transparent"}`,
                color: activeTab === tab ? BRAND : "#6b7280",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
              }}>{TAB_LABELS[tab]}</button>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div style={{
          display: "flex", gap: 0,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(0,0,0,0.2)",
        }}>
          {[
            { label: "Total socios", val: stats.total, color: BRAND },
            { label: "Activos", val: stats.activos, color: "#22c55e" },
            { label: "Por vencer", val: stats.porVencer, color: "#eab308" },
            { label: "Expirados", val: stats.expirados, color: "#ef4444" },
          ].map((s, i) => (
            <div key={s.label} style={{
              flex: 1, padding: "14px 22px",
              borderRight: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'Cormorant Garamond', serif" }}>{s.val}</div>
              <div style={{ color: "#4b5563", fontSize: 12 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ display: "flex", height: "calc(100vh - 130px)" }}>

          {/* Main content */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>

            {activeTab === "members" && (
              <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                {/* List */}
                <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                  <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#f1f5f9" }}>Socios</h2>
                    <div style={{ display: "flex", gap: 8 }}>
                      <label style={{
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 9,
                        padding: "8px 14px", color: "#9ca3af",
                        fontWeight: 600, fontSize: 12, cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                      }}>
                        📥 Importar XLSX
                        <input type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={e => handleImport(e.target.files)} />
                      </label>
                      {members.length > 0 && (
                        <>
                          <button onClick={handleCleanDayPasses} title="Eliminar day passes de la lista" style={{
                            background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.25)", borderRadius: 9,
                            padding: "8px 12px", color: "#eab308",
                            fontWeight: 600, fontSize: 12, cursor: "pointer",
                            fontFamily: "'DM Sans', sans-serif",
                          }}>🧹 Day passes</button>
                          <button onClick={handleClearAll} title="Borrar todos los socios" style={{
                            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 9,
                            padding: "8px 12px", color: "#ef4444",
                            fontWeight: 600, fontSize: 12, cursor: "pointer",
                            fontFamily: "'DM Sans', sans-serif",
                          }}>🗑</button>
                        </>
                      )}
                      <button onClick={() => setActiveTab("alta")} style={{
                        background: BRAND, border: "none", borderRadius: 9,
                        padding: "8px 16px", color: "#051015",
                        fontWeight: 700, fontSize: 12, cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                      }}>+ Nueva alta</button>
                    </div>
                  </div>
                  {/* Column headers */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "36px 1fr 100px 90px 80px",
                    gap: 14, padding: "6px 16px", marginBottom: 6,
                  }}>
                    {["", "Socio", "Estado", "Plan", "Días"].map(h => (
                      <div key={h} style={{ color: "#374151", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</div>
                    ))}
                  </div>
                  {members.map(m => (
                    <MemberRow key={m.id} m={m} selected={selected?.id === m.id} onSelect={setSelected} />
                  ))}
                </div>
                {/* Detail panel */}
                {selected && (
                  <div style={{
                    width: 280, borderLeft: "1px solid rgba(255,255,255,0.06)",
                    padding: 22, overflowY: "auto",
                    background: "rgba(0,0,0,0.2)",
                    animation: "fadeUp 0.2s ease",
                  }}>
                    <MemberDetail m={selected} onRenew={handleRenew} onClose={() => setSelected(null)} />
                  </div>
                )}
              </div>
            )}

            {activeTab === "alta" && (
              <div style={{ flex: 1, overflowY: "auto", padding: 28, maxWidth: 480 }}>
                <OnboardingForm onSubmit={handleNewMember} />
              </div>
            )}

            {activeTab === "asistente" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                  {messages.map((m, i) => <Bubble key={i} msg={m} />)}
                  {loading && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${BRAND}, #1aa8af)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#051015", fontWeight: 900, fontFamily: "serif" }}>R</div>
                      <div style={{ background: "rgba(57,208,216,0.07)", border: "1px solid rgba(57,208,216,0.18)", borderRadius: "16px 16px 16px 4px", padding: "10px 16px", display: "flex", gap: 5 }}>
                        {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: BRAND, animation: `pulse 1.1s ease ${i*0.18}s infinite` }} />)}
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
                {/* Quick actions */}
                <div style={{ padding: "0 24px 10px", display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {["Socios por vencer esta semana", "Generar contrato de membresía anual", "Proceso de baja de un socio", "¿Qué documentación necesita un alta?"].map(q => (
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
                <div style={{ padding: "12px 20px 16px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.2)" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(57,208,216,0.18)", borderRadius: 14, padding: "10px 12px" }}>
                    <textarea value={input} rows={1} onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      placeholder="Consulta sobre socios, contratos, renovaciones..."
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
      </div>
    </>
  );
}

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { askClaude } from '../api.js'

const BRAND = '#39D0D8'

const SECTIONS = [
  {
    title: "Finanzas & Contabilidad",
    color: "#22c55e",
    agents: [
      { code: 'MD',  name: 'Dashboard Maestro',     subtitle: 'Todo en una pantalla',           icon: '📊', color: '#22c55e', path: '/master',       desc: 'Socios, cobros, gastos y cash flow consolidados en tiempo real.' },
      { code: 'CB',  name: 'Conciliación Bancaria', subtitle: 'Banco + facturas + cuadre',      icon: '⚖️', color: BRAND,     path: '/conciliacion', desc: 'Extracto Santander cruzado con facturas de proveedores. Saldo verificado ✓' },
      { code: 'CC',  name: 'Cruce de Cobros',       subtitle: 'TPV + Bizum vs TGManager',       icon: '🔗', color: '#a855f7', path: '/cruce',        desc: 'Cada liquidación bancaria vinculada con los socios que pagaron ese día.' },
      { code: 'TG',  name: 'TGManager',             subtitle: 'Socios y cobros reales',         icon: '💳', color: '#f97316', path: '/tgmanager',    desc: '161 socios · 181 transacciones · 11.201€ cobrados exportados de TGManager.' },
      { code: 'DF',  name: 'Document & Finance',    subtitle: 'Facturas y contabilidad',        icon: '🧾', color: '#eab308', path: '/finance',      desc: 'Facturas de proveedores, IVA desglosado y preparación para gestoría.' },
      { code: 'CF',  name: 'Cash Flow Proyectado',  subtitle: 'Proyección Jun 26 – Mar 27',     icon: '📈', color: '#22c55e', path: '/cashflow',     desc: 'Proyección mes a mes con 3 escenarios, provisiones y alerta agosto Fit-Maker.' },
      { code: 'GC',  name: 'Gastos Clasificados',   subtitle: 'CAPEX · OPEX · DEUDA',           icon: '🏗',  color: '#a855f7', path: '/gastos',       desc: 'Clasificación de 381.714€: CAPEX obra, maquinaria, OPEX fijo y variable.' },
    ]
  },
  {
    title: "Socios & Operaciones",
    color: BRAND,
    agents: [
      { code: 'A3',  name: 'Membership Admin',      subtitle: 'Altas, contratos y renovaciones',icon: '👥', color: '#a855f7', path: '/members',      desc: 'Onboarding automatizado, generación de contratos y tracking de estado.' },
      { code: 'A4',  name: 'Collections',           subtitle: 'Cobros y pagos',                 icon: '💰', color: '#ef4444', path: '/collections',  desc: 'Monitoriza cobros, envía recordatorios y gestiona fallos de pago SEPA.' },
      { code: 'A7',  name: 'Operations',            subtitle: 'Workflows e incidencias',        icon: '⚙️', color: '#84cc16', path: '/operations',   desc: 'Gestiona automatizaciones, workflows de staff, alertas e incidencias.' },
    ]
  },
  {
    title: "Clientes & Marketing",
    color: "#f97316",
    agents: [
      { code: 'A1',  name: 'Lead Conversion',       subtitle: 'Convierte consultas en socios',  icon: '🎯', color: '#22c55e', path: '/leads',        desc: 'Responde a web, WhatsApp e Instagram. Califica leads y agenda visitas.' },
      { code: 'A2',  name: 'Member Support',        subtitle: 'Soporte 24/7 a socios',          icon: '💬', color: '#f97316', path: '/support',      desc: 'Resuelve dudas de horarios, membresías, pagos y normas. Siempre disponible.' },
    ]
  },
  {
    title: "Inteligencia & Reporting",
    color: "#a855f7",
    agents: [
      { code: 'BB',  name: 'Business Brain',        subtitle: 'Inteligencia central',           icon: '◈',  color: BRAND,     path: '/brain',        desc: 'Base de conocimiento maestra. Toda la información del negocio.' },
      { code: 'A6',  name: 'Management Reporting',  subtitle: 'KPIs y dashboards para María',   icon: '📈', color: '#06b6d4', path: '/reporting',    desc: 'Informes semanales y mensuales con métricas de retención y proyecciones.' },
    ]
  },
]

const ALL_AGENTS = SECTIONS.flatMap(s => s.agents)

const SYSTEM_PROMPT = `Eres el COO virtual de Reset Fitness Ibiza. Tienes acceso completo a todos los sistemas.
DATOS: 161 socios · 168 suscripciones activas · 11.201€ cobrados · Saldo banco: 3.515,93€
Préstamo principal: 350.000€ · Cuota Fit-Maker desde agosto: 4.305€/mes
4 cancelaciones solicitadas · 1 impagado · 59 facturas procesadas
Responde como COO: directo, ejecutivo, accionable.`

function now() { return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) }

function AgentCard({ agent, onOpen }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? `${agent.color}0d` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered ? agent.color + '40' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 14, padding: '18px 20px',
        cursor: 'pointer', position: 'relative', overflow: 'hidden',
        transition: 'all 0.18s ease',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onClick={() => onOpen(agent.path)}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${agent.color}, transparent)` }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: `${agent.color}18`, border: `1px solid ${agent.color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>{agent.icon}</div>
        <div>
          <div style={{ color: '#9ca3af', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{agent.code}</div>
          <div style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 700 }}>{agent.name}</div>
          <div style={{ color: agent.color, fontSize: 11 }}>{agent.subtitle}</div>
        </div>
      </div>
      <p style={{ color: '#4b5563', fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>{agent.desc}</p>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: hovered ? agent.color : 'rgba(255,255,255,0.05)',
        border: `1px solid ${hovered ? agent.color : 'rgba(255,255,255,0.09)'}`,
        borderRadius: 8, padding: '6px 14px',
        color: hovered ? '#051015' : '#6b7280',
        fontSize: 11, fontWeight: 700, transition: 'all 0.18s',
      }}>
        Abrir {agent.name} →
      </div>
    </div>
  )
}

function Bubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 14 }}>
      {!isUser && (
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${BRAND}, #1aa8af)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#051015', fontWeight: 900, marginRight: 10, flexShrink: 0, alignSelf: 'flex-end', fontFamily: 'Georgia, serif' }}>R</div>
      )}
      <div style={{ maxWidth: '78%', background: isUser ? '#0f1621' : 'rgba(57,208,216,0.07)', border: isUser ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(57,208,216,0.2)', borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px', padding: '12px 16px', color: '#e2e8f0', fontSize: 13.5, lineHeight: 1.65, whiteSpace: 'pre-wrap', fontFamily: 'sans-serif' }}>
        {msg.content}
        <div style={{ fontSize: 10, color: '#2d3748', marginTop: 5, textAlign: 'right' }}>{msg.time}</div>
      </div>
    </div>
  )
}

export default function Hub() {
  const navigate = useNavigate()
  const [view, setView] = useState('hub')
  const [search, setSearch] = useState('')
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Buenos días 👋 Sistema Reset Fitness AI operativo.\n\n13 módulos activos · 161 socios · Saldo banco: 3.515,93€ ✓\n\n⚠️ Alertas: 4 cancelaciones · 1 impagado · Fit-Maker 4.305€ en agosto\n\n¿Qué quieres gestionar?', time: now() }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [ticker, setTicker] = useState(0)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])
  useEffect(() => { const t = setInterval(() => setTicker(p => (p + 1) % 4), 3000); return () => clearInterval(t) }, [])

  const TICKERS = [
    '⚡ 15 módulos activos · Sistema operativo',
    '👥 161 socios · 168 suscripciones activas',
    '💰 11.201€ cobrados · Saldo banco: 3.515,93€',
    '⚠️ Alerta agosto: Fit-Maker 4.305€/mes',
  ]

  const filtered = search
    ? ALL_AGENTS.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.subtitle.toLowerCase().includes(search.toLowerCase()) ||
        a.desc.toLowerCase().includes(search.toLowerCase())
      )
    : null

  async function sendMessage(text) {
    const txt = text || input.trim()
    if (!txt) return
    setInput('')
    setView('chat')
    const userMsg = { role: 'user', content: txt, time: now() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setLoading(true)
    try {
      const reply = await askClaude({ system: SYSTEM_PROMPT, messages: updated.map(m => ({ role: m.role, content: m.content })) })
      setMessages(prev => [...prev, { role: 'assistant', content: reply, time: now() }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}`, time: now() }])
    }
    setLoading(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&family=DM+Sans:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;} body{background:#060a10;}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}
        @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
        @keyframes ticker{from{opacity:0;transform:translateY(5px);}to{opacity:1;transform:translateY(0);}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(57,208,216,0.15);}50%{box-shadow:0 0 40px rgba(57,208,216,0.3);}}
        ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:rgba(57,208,216,0.2);border-radius:2px;}
        textarea:focus,input:focus{outline:none;}
      `}</style>

      <div style={{ minHeight: '100vh', background: '#060a10', color: '#f1f5f9', fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── HEADER ── */}
        <div style={{ padding: '0 32px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${BRAND}, #1aa8af)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#051015', fontFamily: 'Georgia, serif', animation: 'glow 4s ease infinite' }}>R</div>
            <div>
              <div style={{ color: '#fff', fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700 }}>Reset Fitness Ibiza</div>
              <div style={{ color: '#374151', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI Operations Hub</div>
            </div>
          </div>

          {/* Ticker */}
          <div style={{ flex: 1, maxWidth: 340, margin: '0 32px', background: 'rgba(57,208,216,0.05)', border: '1px solid rgba(57,208,216,0.12)', borderRadius: 99, padding: '6px 16px', textAlign: 'center', overflow: 'hidden' }}>
            <div key={ticker} style={{ color: BRAND, fontSize: 11, fontWeight: 600, animation: 'ticker 0.4s ease' }}>{TICKERS[ticker]}</div>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {/* Search */}
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar módulo..."
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '7px 14px', color: '#e5e7eb', fontFamily: 'sans-serif', fontSize: 12, width: 160 }}
            />
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 }}>
              {[{ id: 'hub', label: 'Hub' }, { id: 'chat', label: 'COO IA' }].map(tab => (
                <button key={tab.id} onClick={() => setView(tab.id)} style={{ padding: '7px 18px', borderRadius: 7, background: view === tab.id ? 'rgba(57,208,216,0.15)' : 'transparent', border: `1px solid ${view === tab.id ? 'rgba(57,208,216,0.35)' : 'transparent'}`, color: view === tab.id ? BRAND : '#6b7280', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif', transition: 'all 0.15s' }}>{tab.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ── HUB ── */}
        {view === 'hub' && (
          <div style={{ padding: '32px 32px 48px', animation: 'fadeIn 0.4s ease' }}>

            {/* Hero */}
            {!search && (
              <div style={{ marginBottom: 36, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ color: '#374151', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Sistema operativo</div>
                  <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 38, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                    15 Módulos.<br /><span style={{ color: BRAND }}>Un gimnasio.</span>
                  </h1>
                  <p style={{ color: '#4b5563', fontSize: 14, marginTop: 12, maxWidth: 440, lineHeight: 1.6 }}>
                    Finanzas, socios, operaciones, marketing e inteligencia. Todo conectado y accesible desde aquí.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { val: '13', label: 'Módulos', color: BRAND },
                    { val: '161', label: 'Socios', color: '#22c55e' },
                    { val: '3.515€', label: 'Saldo', color: '#a855f7' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 18px', textAlign: 'center', minWidth: 80 }}>
                      <div style={{ color: s.color, fontSize: 22, fontWeight: 800, fontFamily: 'Georgia, serif' }}>{s.val}</div>
                      <div style={{ color: '#374151', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search results */}
            {search && filtered && (
              <div style={{ marginBottom: 32, animation: 'fadeUp 0.2s ease' }}>
                <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
                  {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para "<span style={{ color: BRAND }}>{search}</span>"
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  {filtered.map(agent => <AgentCard key={agent.code} agent={agent} onOpen={navigate} />)}
                </div>
              </div>
            )}

            {/* Sections */}
            {!search && SECTIONS.map(section => (
              <div key={section.title} style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 4, height: 20, borderRadius: 2, background: section.color }} />
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: '#f1f5f9', fontWeight: 700 }}>{section.title}</h2>
                  <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.06)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {section.agents.map(agent => <AgentCard key={agent.code} agent={agent} onOpen={navigate} />)}
                </div>
              </div>
            ))}

            {/* Quick actions */}
            {!search && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 4, height: 20, borderRadius: 2, background: '#6b7280' }} />
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: '#f1f5f9', fontWeight: 700 }}>Acciones rápidas del COO</h2>
                  <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.06)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {[
                    { q: 'Dame el estado completo del negocio hoy', icon: '📊', label: 'Estado del negocio' },
                    { q: '¿Cuáles son las 3 prioridades más urgentes?', icon: '🎯', label: 'Prioridades urgentes' },
                    { q: '¿Cuándo llegaremos al breakeven?', icon: '📈', label: 'Proyección breakeven' },
                    { q: 'Riesgos legales y fiscales pendientes', icon: '⚖️', label: 'Riesgos pendientes' },
                    { q: 'Genera informe ejecutivo para María Lagos', icon: '📋', label: 'Informe para María' },
                    { q: 'Análisis del cruce banco vs TGManager', icon: '🔗', label: 'Análisis conciliación' },
                    { q: '¿Cuándo llegaremos al breakeven según la proyección?', icon: '📈', label: 'Cash flow proyectado' },
                  ].map(item => (
                    <button key={item.q} onClick={() => sendMessage(item.q)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 18px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'sans-serif' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(57,208,216,0.06)'; e.currentTarget.style.borderColor = 'rgba(57,208,216,0.25)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
                    >
                      <span style={{ fontSize: 22 }}>{item.icon}</span>
                      <span style={{ color: '#9ca3af', fontSize: 13, fontWeight: 600 }}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── COO CHAT ── */}
        {view === 'chat' && (
          <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e', animation: 'pulse 2s infinite' }} />
                <div>
                  <div style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 700 }}>COO Virtual — Reset Fitness Ibiza</div>
                  <div style={{ color: '#4b5563', fontSize: 11 }}>Acceso completo a todos los módulos y datos del negocio</div>
                </div>
              </div>
              <button onClick={() => setView('hub')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: '7px 16px', color: '#6b7280', fontSize: 12, cursor: 'pointer', fontFamily: 'sans-serif' }}>← Hub</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px 16px' }}>
              {messages.map((m, i) => <Bubble key={i} msg={m} />)}
              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${BRAND}, #1aa8af)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#051015', fontWeight: 900, fontFamily: 'Georgia, serif' }}>R</div>
                  <div style={{ background: 'rgba(57,208,216,0.07)', border: '1px solid rgba(57,208,216,0.18)', borderRadius: '18px 18px 18px 4px', padding: '12px 18px', display: 'flex', gap: 6 }}>
                    {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: BRAND, animation: `pulse 1.1s ease ${i * 0.18}s infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div style={{ padding: '0 32px 10px', display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {['Estado del negocio', 'Prioridades hoy', 'Proyección breakeven', 'Riesgos pendientes', 'Informe para María'].map(q => (
                <button key={q} onClick={() => sendMessage(q)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 99, padding: '6px 14px', color: '#6b7280', fontSize: 12, cursor: 'pointer', fontFamily: 'sans-serif', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = BRAND; e.currentTarget.style.borderColor = BRAND + '50' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                >{q}</button>
              ))}
            </div>

            <div style={{ padding: '12px 28px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(57,208,216,0.2)`, borderRadius: 16, padding: '12px 16px', maxWidth: 860, margin: '0 auto' }}>
                <textarea value={input} rows={1} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }} placeholder="Pregunta al COO virtual sobre cualquier módulo, dato o decisión..." style={{ flex: 1, background: 'transparent', border: 'none', color: '#e5e7eb', fontFamily: 'sans-serif', fontSize: 14, lineHeight: 1.5, maxHeight: 120, overflowY: 'auto', resize: 'none' }} />
                <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: !input.trim() || loading ? 'rgba(57,208,216,0.12)' : BRAND, border: 'none', cursor: !input.trim() || loading ? 'not-allowed' : 'pointer', color: !input.trim() || loading ? BRAND : '#051015', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, transition: 'all 0.2s' }}>↑</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

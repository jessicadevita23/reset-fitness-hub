import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { askClaude } from '../api.js'

const BRAND = '#39D0D8'

const AGENTS = [
  { id: 0, code: 'BB',  name: 'Business Brain',         subtitle: 'Inteligencia central',            icon: '◈', color: BRAND,     path: '/brain',       stats: [{ label: 'Categorías', val: '9' }, { label: 'Datos activos', val: '72' }], alerts: 0, tags: ['Knowledge Base', 'IA Central'] },
  { id: 1, code: 'A1',  name: 'Lead Conversion',        subtitle: 'Convierte consultas en socios',   icon: '⟡', color: '#22c55e', path: '/leads',       stats: [{ label: 'Leads/mes', val: '61' }, { label: 'Conversión', val: '57%' }], alerts: 0, tags: ['WhatsApp', 'Instagram', 'Web'] },
  { id: 2, code: 'A2',  name: 'Member Support',         subtitle: 'Soporte 24/7 a socios',           icon: '⟢', color: '#f97316', path: '/support',     stats: [{ label: 'Socios', val: '52' }, { label: 'Disponible', val: '24/7' }], alerts: 0, tags: ['Socios', 'FAQ', 'Chat'] },
  { id: 3, code: 'A3',  name: 'Membership Admin',       subtitle: 'Altas, contratos y renovaciones', icon: '⟣', color: '#a855f7', path: '/members',     stats: [{ label: 'Socios', val: '52' }, { label: 'Por vencer', val: '3' }],   alerts: 1, tags: ['Contratos', 'Onboarding'] },
  { id: 4, code: 'A4',  name: 'Collections & Payments', subtitle: 'Reduce impagos',                  icon: '⟤', color: '#ef4444', path: '/collections', stats: [{ label: 'Deuda', val: '895€' }, { label: 'Fallidos', val: '2' }],     alerts: 3, tags: ['SEPA', 'Cobros'] },
  { id: 5, code: 'A5',  name: 'Document & Finance',     subtitle: 'Facturas y contabilidad',         icon: '⟥', color: '#eab308', path: '/finance',     stats: [{ label: 'IVA', val: '2.890€' }, { label: 'Sin soporte', val: '1' }],  alerts: 1, tags: ['Facturas', 'IVA'] },
  { id: 6, code: 'A6',  name: 'Management Reporting',   subtitle: 'KPIs y dashboards para María',    icon: '⟦', color: '#06b6d4', path: '/reporting',   stats: [{ label: 'Ingresos', val: '11.2k€' }, { label: 'Retención', val: '91%' }], alerts: 0, tags: ['KPIs', 'Dashboard'] },
  { id: 7, code: 'A7',  name: 'Operations & Automation',subtitle: 'Workflows e incidencias',         icon: '⟧', color: '#84cc16', path: '/operations',  stats: [{ label: 'Workflows', val: '6' }, { label: 'Incidencias', val: '3' }],  alerts: 2, tags: ['Workflows', 'SOPs'] },
]

const SYSTEM_PROMPT = `Eres el COO virtual de Reset Fitness Ibiza. Tienes acceso completo a todos los agentes del sistema.
DATOS: 52 socios activos | Objetivo breakeven: 80 | Ingresos junio: 11.200€ | Retención: 91%
Deuda cobros: 895€ | 3 membresías por vencer | 1 doc sin soporte | 3 incidencias abiertas
Préstamo principal: 350.000€ | Cuota Fit-Maker desde agosto 2026: 4.305€/mes
Responde como COO: directo, ejecutivo, accionable.`

function now() {
  return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function AgentCard({ agent, onOpen, isSelected, onSelect }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={() => onSelect(agent)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isSelected ? `${agent.color}0e` : hovered ? `${agent.color}08` : 'rgba(255,255,255,0.025)',
        border: `1px solid ${isSelected ? agent.color + '50' : hovered ? agent.color + '30' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 16, padding: '20px',
        cursor: 'pointer', position: 'relative', overflow: 'hidden',
        transition: 'all 0.2s ease',
        transform: hovered && !isSelected ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${agent.color}, transparent)` }} />
      {agent.alerts > 0 && (
        <div style={{ position: 'absolute', top: 14, right: 14, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{agent.alerts}</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${agent.color}18`, border: `1px solid ${agent.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: agent.color }}>{agent.icon}</div>
        <div>
          <div style={{ color: '#9ca3af', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{agent.code}</div>
          <div style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 700 }}>{agent.name}</div>
        </div>
      </div>
      <div style={{ color: agent.color, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>{agent.subtitle}</div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        {agent.stats.map(s => (
          <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ color: agent.color, fontSize: 15, fontWeight: 800, fontFamily: 'Georgia, serif' }}>{s.val}</div>
            <div style={{ color: '#374151', fontSize: 10, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
        {agent.tags.map(t => (
          <span key={t} style={{ padding: '3px 8px', borderRadius: 6, background: `${agent.color}10`, border: `1px solid ${agent.color}20`, color: agent.color, fontSize: 10, fontWeight: 600 }}>{t}</span>
        ))}
      </div>
      <button
        onClick={e => { e.stopPropagation(); onOpen(agent.path) }}
        style={{ width: '100%', padding: '9px', background: isSelected ? agent.color : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 9, color: isSelected ? '#051015' : '#6b7280', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'sans-serif' }}
      >Abrir agente →</button>
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
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Buenos días 👋 Sistema Reset Fitness AI operativo.\n\n8 agentes activos · 52 socios · 91% retención · Breakeven en ~80 socios\n\n⚠️ Alertas: 3 membresías por vencer · cobro doble RF003 · doc sin soporte · Fit-Maker agosto\n\n¿Qué quieres gestionar?', time: now() }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [ticker, setTicker] = useState(0)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])
  useEffect(() => { const t = setInterval(() => setTicker(p => (p + 1) % 4), 3000); return () => clearInterval(t) }, [])

  const TICKERS = ['⚡ Sistema operativo · 8/8 agentes activos', '👥 52 socios activos · 9 altas esta semana', '💰 Ingresos junio: 11.200€ · +28% vs mayo', '⚠️ 3 alertas pendientes · revisar hoy']

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

  const totalAlerts = AGENTS.reduce((s, a) => s + a.alerts, 0)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&family=DM+Sans:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;} body{background:#060a10;}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}
        @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
        @keyframes ticker{from{opacity:0;transform:translateY(5px);}to{opacity:1;transform:translateY(0);}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(57,208,216,0.15);}50%{box-shadow:0 0 40px rgba(57,208,216,0.3);}}
        ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:rgba(57,208,216,0.2);border-radius:2px;}
        textarea:focus{outline:none;}
      `}</style>

      <div style={{ minHeight: '100vh', background: '#060a10', color: '#f1f5f9', fontFamily: "'DM Sans', sans-serif" }}>

        {/* Header */}
        <div style={{ padding: '0 32px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${BRAND}, #1aa8af)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#051015', fontFamily: 'Georgia, serif', animation: 'glow 4s ease infinite' }}>R</div>
            <div>
              <div style={{ color: '#fff', fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700 }}>Reset Fitness Ibiza</div>
              <div style={{ color: '#374151', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI Operations Hub</div>
            </div>
          </div>

          <div style={{ flex: 1, maxWidth: 340, margin: '0 32px', background: 'rgba(57,208,216,0.05)', border: '1px solid rgba(57,208,216,0.12)', borderRadius: 99, padding: '6px 16px', textAlign: 'center', overflow: 'hidden' }}>
            <div key={ticker} style={{ color: BRAND, fontSize: 11, fontWeight: 600, animation: 'ticker 0.4s ease' }}>{TICKERS[ticker]}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 }}>
              {[{ id: 'hub', label: 'Hub' }, { id: 'chat', label: 'COO IA' }].map(tab => (
                <button key={tab.id} onClick={() => setView(tab.id)} style={{ padding: '7px 18px', borderRadius: 7, background: view === tab.id ? 'rgba(57,208,216,0.15)' : 'transparent', border: `1px solid ${view === tab.id ? 'rgba(57,208,216,0.35)' : 'transparent'}`, color: view === tab.id ? BRAND : '#6b7280', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif', transition: 'all 0.15s' }}>{tab.label}</button>
              ))}
            </div>
            {totalAlerts > 0 && (
              <div style={{ position: 'relative', width: 36, height: 36, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => sendMessage('Dame un resumen de todas las alertas activas')}>
                <span style={{ fontSize: 16 }}>🔔</span>
                <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', color: '#fff', fontSize: 8, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{totalAlerts}</div>
              </div>
            )}
          </div>
        </div>

        {/* HUB */}
        {view === 'hub' && (
          <div style={{ padding: '32px 32px 48px', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ marginBottom: 36, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#374151', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Sistema operativo</div>
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 38, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>8 Agentes.<br /><span style={{ color: BRAND }}>Un gimnasio.</span></h1>
                <p style={{ color: '#4b5563', fontSize: 14, marginTop: 12, maxWidth: 440, lineHeight: 1.6 }}>Cada agente opera de forma autónoma sobre su dominio. Haz clic para explorar o usa el COO IA para gestionar todo desde aquí.</p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[{ val: '8/8', label: 'Agentes', color: '#22c55e' }, { val: '52', label: 'Socios', color: BRAND }, { val: '91%', label: 'Retención', color: '#a855f7' }, { val: `${totalAlerts}`, label: 'Alertas', color: totalAlerts > 0 ? '#eab308' : '#22c55e' }].map(s => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 18px', textAlign: 'center', minWidth: 80 }}>
                    <div style={{ color: s.color, fontSize: 22, fontWeight: 800, fontFamily: 'Georgia, serif' }}>{s.val}</div>
                    <div style={{ color: '#374151', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
              {AGENTS.map(agent => (
                <AgentCard key={agent.id} agent={agent} onOpen={path => navigate(path)} isSelected={selected?.id === agent.id} onSelect={a => setSelected(a.id === selected?.id ? null : a)} />
              ))}
            </div>

            {/* Quick actions */}
            <div>
              <div style={{ color: '#374151', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Acciones rápidas del COO</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { q: 'Dame el estado completo del negocio hoy', icon: '📊', label: 'Estado del negocio' },
                  { q: '¿Cuáles son las 3 prioridades más urgentes ahora mismo?', icon: '🎯', label: 'Prioridades urgentes' },
                  { q: '¿Cuándo llegaremos al breakeven con la tendencia actual?', icon: '📈', label: 'Proyección breakeven' },
                  { q: 'Resumen de todos los riesgos legales y fiscales pendientes', icon: '⚖️', label: 'Riesgos legales' },
                  { q: 'Genera un informe ejecutivo para María Lagos de esta semana', icon: '📋', label: 'Informe para María' },
                  { q: '¿Qué automatizaciones nuevas deberíamos implementar?', icon: '⚡', label: 'Nuevas automatizaciones' },
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
          </div>
        )}

        {/* COO CHAT */}
        {view === 'chat' && (
          <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e', animation: 'pulse 2s infinite' }} />
                <div>
                  <div style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 700 }}>COO Virtual — Reset Fitness Ibiza</div>
                  <div style={{ color: '#4b5563', fontSize: 11 }}>Acceso completo a todos los agentes y datos del negocio</div>
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
                    {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: BRAND, animation: `pulse 1.1s ease ${i*0.18}s infinite` }} />)}
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
                <textarea value={input} rows={1} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }} placeholder="Pregunta al COO virtual sobre cualquier agente, KPI, riesgo o decisión..." style={{ flex: 1, background: 'transparent', border: 'none', color: '#e5e7eb', fontFamily: 'sans-serif', fontSize: 14, lineHeight: 1.5, maxHeight: 120, overflowY: 'auto', resize: 'none' }} />
                <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: !input.trim() || loading ? 'rgba(57,208,216,0.12)' : BRAND, border: 'none', cursor: !input.trim() || loading ? 'not-allowed' : 'pointer', color: !input.trim() || loading ? BRAND : '#051015', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, transition: 'all 0.2s' }}>↑</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

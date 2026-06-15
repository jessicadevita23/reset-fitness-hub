const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

// Lee los socios importados en /members desde localStorage y devuelve conteos.
// Devuelve null si no hay datos importados (los agents pueden caer a sus textos por defecto).
export function getMemberStats() {
  try {
    const saved = localStorage.getItem('rf_members_v1')
    if (!saved) return null
    const list = JSON.parse(saved)
    if (!Array.isArray(list) || !list.length) return null
    const total = list.length
    const activos = list.filter(m => m.status === 'activo').length
    const porVencer = list.filter(m => m.status === 'por-vencer').length
    const expirados = list.filter(m => m.status === 'expirado' || m.status === 'cancelado').length
    // Por categoría (si los socios tienen el campo)
    const porCategoria = list.reduce((acc, m) => {
      const k = m.category || 'otro'
      acc[k] = (acc[k] || 0) + 1
      return acc
    }, {})
    return { total, activos, porVencer, expirados, porCategoria }
  } catch {
    return null
  }
}

// Resumen corto: "419 socios · 405 activos · 12 por vencer"
export function statsSummary(s = getMemberStats()) {
  if (!s || !s.total) return '161 socios · 168 suscripciones activas'
  return `${s.total} socios · ${s.activos} activos${s.porVencer ? ` · ${s.porVencer} por vencer` : ''}`
}

export async function askClaude({ system, messages, maxTokens = 1000 }) {
  if (!API_KEY) throw new Error('Falta VITE_ANTHROPIC_API_KEY en las variables de entorno')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model: 'claude-opus-4-5', max_tokens: maxTokens, system, messages }),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `HTTP ${res.status}`) }
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

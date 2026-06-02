const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

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

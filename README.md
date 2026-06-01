# Reset Fitness Ibiza — AI Operations Hub 

Sistema operativo completo con 8 agentes de IA para Reset Fitness Ibiza.

---

## Setup en 3 pasos

### Paso 1 — Conseguir la API key de Anthropic

1. Ve a https://console.anthropic.com
2. Crea una cuenta o inicia sesión
3. Ve a "API Keys" → "Create Key"
4. Copia la key (empieza por `sk-ant-api03-...`)

---

### Paso 2 — Subir el proyecto a GitHub

1. Ve a https://github.com y crea una cuenta si no tienes
2. Haz clic en **New repository**
3. Nómbralo `reset-fitness-hub`, déjalo en **Private**, clic en **Create**
4. En la página del repo vacío, haz clic en **uploading an existing file**
5. Arrastra TODOS los archivos de esta carpeta descomprimida
6. Haz clic en **Commit changes**

---

### Paso 3 — Deploy en Vercel

1. Ve a https://vercel.com y crea una cuenta con GitHub
2. Haz clic en **Add New Project**
3. Selecciona el repo `reset-fitness-hub`
4. Antes de hacer deploy, busca la sección **Environment Variables** y añade:
   ```
   Name:  VITE_ANTHROPIC_API_KEY
   Value: sk-ant-api03-tu-key-aqui
   ```
5. Haz clic en **Deploy**

En 2 minutos tendrás una URL como:
`https://reset-fitness-hub.vercel.app`

---

## Listo

Esa URL es tu sistema operativo completo. Ábrela en cualquier navegador, en el móvil o en el ordenador. Compártela solo con María y el equipo.

Si en algún momento quieres un dominio propio como `ops.resetfitnessibiza.com`, en Vercel → Settings → Domains se añade en 2 minutos.

---

## Estructura del proyecto (no hace falta tocar nada)

```
src/
├── api.js              ← conexión con Claude (usa la API key del .env)
├── App.jsx             ← router que conecta todas las páginas
├── main.jsx            ← entrada de la app
└── agents/
    ├── Hub.jsx         ← pantalla principal
    ├── BusinessBrain.jsx
    ├── LeadConversion.jsx
    ├── MemberSupport.jsx
    ├── MembershipAdmin.jsx
    ├── Collections.jsx
    ├── DocumentFinance.jsx
    ├── Reporting.jsx
    └── Operations.jsx
```

---

Reset Fitness Ibiza — AI Operations Hub · 2026

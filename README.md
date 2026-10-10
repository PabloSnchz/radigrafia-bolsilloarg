# 📊 Radiografía del Bolsillo Argentino

> Tu sueldo no perdió contra la inflación. Perdió contra la góndola.

Dashboard interactivo que cruza **precios reales**, **tarifas de servicios** y **salarios** para mostrar cuánto poder de compra perdiste realmente desde 2023. Sin vueltas, sin números abstractos: cuántos kilos de carne, pan o litros de leche podés comprar hoy con lo que ganás.

[![Estado](https://img.shields.io/badge/estado-MVP%20en%20desarrollo-yellow)](.)
[![Licencia](https://img.shields.io/badge/licencia-MIT-blue)](LICENSE)
[![Datos](https://img.shields.io/badge/datos-INDEC%20%7C%20IIEP%20%7C%20OCLA-green)](.)

---

## 🎯 ¿Por qué existe esto?

Los medios te muestran un número de inflación (IPC) que no refleja tu realidad. Ese número es un promedio que mezcla productos que subieron mucho con otros que subieron poco. **Mientras tanto, tu sueldo compra cada vez menos.**

Este proyecto hace tres cosas que el IPC no hace:

1. **Cruza precios reales de góndola** con tu salario neto
2. **Suma tarifas de servicios** (luz, gas, agua, transporte, internet) que el IPC diluye
3. **Traduce todo a unidades concretas**: kilos, litros, viajes en subte

El objetivo es que puedas ver tu propia pérdida de poder adquisitivo con **datos concretos**, no con porcentajes abstractos.

---

## 🖥️ Estado actual

MVP funcional con:

- ✅ Dashboard estático (HTML + CSS + JS vanilla)
- ✅ Tabla de alimentos con desvío vs IPC oficial
- ✅ Tabla de servicios con tarifas y % del SMVM
- ✅ Calculadora interactiva de poder adquisitivo
- ✅ Tarjeta visual para compartir en redes
- ✅ Sistema de diseño Andreani Cartesian aplicado
- ✅ Responsive mobile-first
- ✅ Accesibilidad WCAG 2.1 AA

---

## 🚀 Hoja de ruta

### ✅ Fase 0 — MVP estático (completada)

Dashboard con datos cargados manualmente. Base visual y de interacción lista.

### 🔄 Fase A — Interactividad y datos dinámicos (en curso)

- [ ] Gráficos interactivos con Chart.js (evolución histórica, composición del gasto)
- [ ] Calculadora personalizable (que el usuario cargue su propio presupuesto)
- [ ] Generación de imagen descargable con `html2canvas`
- [ ] Filtros por categoría de producto

### ⏳ Fase B — Automatización de datos

- [ ] Backend en Node.js / Python para consumir APIs
- [ ] Integración con **datos.gob.ar** (IPC, canastas básicas, salarios)
- [ ] Integración con **DolarAPI** (cotización oficial, blue, MEP)
- [ ] Scraper de **Precios Claros** para precios de alimentos en vivo
- [ ] Parsing de informes del **IIEP (UBA-CONICET)** para tarifas

### ⏳ Fase C — Productización

- [ ] Filtro por provincia / región (las tarifas no son iguales en AMBA que en Córdoba)
- [ ] Comparativa histórica personalizable (elegir período de referencia)
- [ ] Exportación a PDF
- [ ] Modo oscuro
- [ ] Versión PWA instalable en el celular

---

## 📊 Fuentes de datos

| Fuente | Qué aporta | Tipo | Estado |
|---|---|---|---|
| [INDEC](https://www.indec.gob.ar/) | IPC, canastas básicas, salarios | Público | ✅ Integrado (manual) |
| [datos.gob.ar](https://datos.gob.ar/) | +30.000 series de tiempo, API REST | Público | ⏳ Pendiente |
| [DolarAPI](https://dolarapi.com/) | Cotizaciones USD (oficial, blue, MEP, CCL) | Público | ⏳ Pendiente |
| [IIEP (UBA-CONICET)](https://www.iiep.com.ar/) | Tarifas de servicios, informes mensuales | Público (PDF) | ✅ Integrado (manual) |
| [OCLA](https://www.ocla.org.ar/) | Precios de lácteos y alimentos en GBA | Público | ⏳ Pendiente |
| [Precios Claros](https://preciosclaros.gob.ar/) | Precios de supermercados en tiempo real | Scraping | ⏳ Pendiente |

---

## 🛠️ Stack técnico

**Frontend (actual):**
- HTML5 semántico
- CSS3 con variables (design tokens)
- JavaScript vanilla (sin frameworks)
- Chart.js (para Fase A)

**Backend (planeado):**
- Node.js + Express **o** Python + FastAPI
- Cache con Redis (para no golpear las APIs en cada request)
- Cron jobs para scraping semanal

**Hosting:**
- Frontend: GitHub Pages / Vercel / Netlify
- Backend (cuando exista): Railway / Render / Fly.io

---

## 🎨 Sistema de diseño

Este proyecto usa el **Andreani Cartesian Design System** (V.1) como base. Reglas clave:

- **Tokens semánticos, nunca hex hardcodeados** (`color.surface.error.subtle`, no `#df474c`)
- **Nomenclatura con punto:** `color.bg.primary`, no `color/bg/primary`
- **Tipografías:** Rubik (headlines) + Roboto (body)
- **Spacing:** escala de 4px (`--c-spacing-1` a `--c-spacing-9`)
- **Border radius:** containers `medium` (16px), botones `xlarge` (99px), chips `xsmall`/`small`
- **Botones:** máximo **un Primary por vista**, altura 40px desktop / 48px mobile
- **Tablas:** row height 40px, sin sombras
- **Accesibilidad:** WCAG 2.1 AA mínimo

---

## 💻 Cómo correr el proyecto localmente

No requiere instalación. Al ser HTML/CSS/JS puro:

```bash
git clone https://github.com/PabloSnchz/radiografia-bolsillo-ar.git
cd radiografia-bolsillo-ar

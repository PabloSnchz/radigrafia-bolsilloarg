/**
 * Capa de render. Toma datos y los pinta en el DOM.
 * No hace fetch, no decide lógica de negocio.
 */

/* ============================================
   FORMATTERS
   ============================================ */
export const fmt = {
  pesos: (n) => '$' + Math.round(n).toLocaleString('es-AR'),
  pesosCompact: (n) => {
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1).replace('.', ',') + 'M';
    if (n >= 1_000) return '$' + Math.round(n / 1000) + 'k';
    return '$' + Math.round(n);
  },
  pct: (n) => (n >= 0 ? '+' : '') + Math.round(n) + '%',
  pctDec: (n) => (n >= 0 ? '+' : '') + n.toFixed(1).replace('.', ',') + '%',
  horas: (n) => n.toFixed(1).replace('.', ',') + ' hs',
};

/* ============================================
   HELPERS INTERNOS
   ============================================ */
const SEVERITY_LABEL = {
  critical: 'Te destruye',
  warning: 'Te pega fuerte',
  moderate: 'En línea',
  ok: 'Zafás',
};
const SEVERITY_FILL = {
  critical: 'fill-danger',
  warning: 'fill-warning',
  moderate: 'fill-caution',
  ok: 'fill-ok',
};

/* ============================================
   RENDER — HEADER / HERO
   ============================================ */
export function renderHeader(state) {
  const dot = document.getElementById('live-dot');
  const status = document.getElementById('live-status');
  const offline = state.inflacion.fuente === 'fallback' && state.smvm.fuente === 'fallback';

  dot.classList.toggle('offline', offline);
  dot.classList.toggle('ok', !offline);
  status.textContent = offline ? 'Datos cacheados' : 'Datos en vivo';
}

export function renderHero(state) {
  document.getElementById('hero-ipc').textContent = '+' + Math.round(state.inflacion.acumuladaPostDeval) + '%';

  const nalga = state.alimentos.find(a => a.id === 'nalga');
  if (nalga) {
    document.getElementById('impact-carne').textContent = fmt.pct(nalga.variacionPostDeval);
    document.getElementById('impact-horas').textContent = '+' + fmt.horas(nalga.deltaHoras);
  }
  document.getElementById('impact-dolar').textContent = state.dolarBlue.venta
    ? fmt.pesos(state.dolarBlue.venta)
    : '$—';
}

/* ============================================
   RENDER — PRODUCTOS
   ============================================ */
export function renderProducts(alimentos, inflacion) {
  const grid = document.getElementById('products-grid');
  const sorted = [...alimentos].sort((a, b) => b.desvioIPC - a.desvioIPC);

  grid.innerHTML = sorted.map(p => `
    <article class="product-card">
      <span class="severity-tag severity-${p.severidad}">${SEVERITY_LABEL[p.severidad]}</span>
      <header class="product-header">
        <span class="product-emoji" aria-hidden="true">${p.emoji}</span>
        <div>
          <div class="product-name">${p.nombre}</div>
          <div class="product-unit">por ${p.unidad}</div>
        </div>
      </header>

      <div class="price-history">
        <div>
          <span class="price-past-label">2023</span>
          <span class="price-past">${fmt.pesos(p.precio2023)}</span>
        </div>
        <span class="price-arrow" aria-hidden="true">→</span>
        <div>
          <span class="price-past-label">Dic 23</span>
          <span class="price-dic">${fmt.pesos(p.precioDic2023)}</span>
        </div>
        <div class="price-today">${fmt.pesos(p.precioHoy)}</div>
      </div>

      <div class="variation-section">
        <div class="variation-row">
          <span class="variation-label">Variación Dic 2023 → hoy</span>
          <span class="variation-value">${fmt.pct(p.variacionPostDeval)}</span>
        </div>
        <div class="variation-bar">
          <div class="variation-bar-fill ${SEVERITY_FILL[p.severidad]}"
               style="width:${Math.min(100, (p.variacionPostDeval / 500) * 100)}%"></div>
        </div>
        <div class="variation-row">
          <span class="variation-label">IPC oficial del período</span>
          <span class="variation-value" style="color:var(--c-color-text-subtle);">
            +${Math.round(inflacion.acumuladaPostDeval)}%
          </span>
        </div>
        <div class="variation-row" style="margin-top:6px;">
          <span class="variation-label" style="color:var(--c-color-text-error); font-weight:700;">Desvío vs IPC</span>
          <span class="variation-value" style="color:var(--c-color-text-error);">${fmt.pctDec(p.desvioIPC)}</span>
        </div>
      </div>

      <div class="work-hours">
        <div class="work-hours-label">Horas de trabajo para comprarlo</div>
        <div class="work-hours-value">
          En 2023: <strong>${fmt.horas(p.horas2023)}</strong> · Hoy: <strong>${fmt.horas(p.horasHoy)}</strong>
        </div>
        ${p.deltaHoras > 0.5 ? `<div class="work-hours-delta">+ ${fmt.horas(p.deltaHoras)} de tu vida por lo mismo</div>` : ''}
      </div>
    </article>
  `).join('');
}

/* ============================================
   RENDER — RANKING
   ============================================ */
export function renderRanking(alimentos) {
  const list = document.getElementById('ranking-list');
  const sorted = [...alimentos].sort((a, b) => b.desvioIPC - a.desvioIPC);

  list.innerHTML = sorted.map((p, i) => `
    <div class="ranking-row">
      <div class="ranking-pos">${(i + 1).toString().padStart(2, '0')}</div>
      <div class="ranking-info">
        <div class="ranking-name">${p.emoji} ${p.nombre}</div>
        <div class="ranking-meta">${fmt.pesos(p.precioDic2023)} → ${fmt.pesos(p.precioHoy)} · ${fmt.pct(p.variacionPostDeval)}</div>
      </div>
      <div class="ranking-badge">
        ${fmt.pctDec(p.desvioIPC)}
        <span class="ranking-badge-label">vs IPC</span>
      </div>
    </div>
  `).join('');
}

/* ============================================
   RENDER — SERVICIOS
   ============================================ */
export function renderServices(servicios) {
  const grid = document.getElementById('services-grid');
  const sorted = [...servicios].sort((a, b) => b.variacionPostDeval - a.variacionPostDeval);

  grid.innerHTML = sorted.map(s => `
    <article class="service-card">
      <span class="service-icon" aria-hidden="true">${s.emoji}</span>
      <div class="service-name">${s.nombre}</div>
      <div class="service-price">${fmt.pesos(s.precioHoy)}</div>
      <div class="service-price-past">Dic 2023: ${fmt.pesos(s.precioDic2023)}</div>
      <div class="service-impact">
        <div class="service-impact-row">
          <span class="label">Variación</span>
          <span class="value">${fmt.pct(s.variacionPostDeval)}</span>
        </div>
        <div class="service-impact-row">
          <span class="label">Desvío vs IPC</span>
          <span class="value">${fmt.pctDec(s.desvioIPC)}</span>
        </div>
      </div>
    </article>
  `).join('');
}

/* ============================================
   RENDER — RESULTADOS DEPENDIENTES DEL SUELDO
   ============================================ */
export function renderUserResults({ sueldo, alimentos, inflacion, costoVivir, score }) {
  const nalga = alimentos.find(a => a.id === 'nalga');

  // Summary bar
  if (sueldo > 0) {
    const equivalente = sueldo / (1 + inflacion.acumuladaPostDeval / 100);
    document.getElementById('summary-salary').textContent = fmt.pesosCompact(sueldo);
    document.getElementById('summary-2023').textContent = fmt.pesosCompact(equivalente);
  }

  // Termómetro
  const marker = document.getElementById('thermo-marker');
  const reading = document.getElementById('thermo-reading');
  const sub = document.getElementById('thermo-sub');

  if (sueldo <= 0 || !score) {
    marker.style.left = '0%';
    reading.innerHTML = '— <span class="unit">/100</span>';
    sub.textContent = 'Cargá tu sueldo para ver tu nivel de alerta';
  } else {
    marker.style.left = score.score + '%';
    const label = score.score < 25 ? 'Tranquilo'
                : score.score < 50 ? 'Ajustado'
                : score.score < 75 ? 'Crítico'
                : 'Emergencia';
    reading.innerHTML = `${score.score} <span class="unit">/100 · ${label}</span>`;
    sub.textContent = `Estás gastando el ${score.pct}% de tu sueldo solo en sobrevivir`;
  }

  // Costo de vivir
  document.getElementById('living-cost-value').textContent = Math.round(costoVivir).toLocaleString('es-AR');
  const costSub = document.getElementById('living-cost-sub');
  if (sueldo > 0) {
    const pct = Math.round((costoVivir / sueldo) * 100);
    costSub.innerHTML =
      `Ese número equivale al <strong>${pct}% de tu sueldo</strong>. ` +
      (pct >= 100 ? 'No te alcanza ni para lo básico.'
       : pct >= 80 ? 'Te queda muy poco para lo demás.'
       : pct >= 60 ? 'Vivís al límite.'
       : 'Podés respirar, pero ajustado.');
  } else {
    costSub.textContent = 'Cargá tu sueldo arriba para ver qué porcentaje se te va en sobrevivir.';
  }

  // Share card
  const shareHeadline = document.getElementById('share-headline');
  if (sueldo > 0 && nalga) {
    const kg = (sueldo / nalga.precioHoy).toFixed(1);
    const kg2023 = (sueldo / nalga.precioDic2023).toFixed(1);
    shareHeadline.innerHTML = `Compro <em>${kg}kg</em> de nalga.<br>En Dic 2023 compraba <em>${kg2023}kg</em>.`;
  } else {
    shareHeadline.textContent = 'Cargá tu sueldo para ver tu resultado';
  }
}

/* ============================================
   ESTADO DE CARGA / ERROR
   ============================================ */
export function setLoading(isLoading) {
  const dot = document.getElementById('live-dot');
  if (isLoading) dot.classList.add('offline');
}
/**
 * Orquestador principal. Importa todo, conecta eventos y ejecuta el ciclo
 * de vida: fetch → calcular → render → reaccionar a input del usuario.
 */

import { CONFIG } from './config.js';
import { fetchAllData } from './data.js';
import { enrichItems, calcularCostoVivir, calcularScoreTermometro } from './calculations.js';
import {
  renderHeader, renderHero, renderProducts, renderRanking,
  renderServices, renderUserResults, setLoading
} from './render.js';

/* ============================================
   ESTADO GLOBAL
   ============================================ */
const state = {
  inflacion: { acumuladaPostDeval: 0, acumuladaTotal: 0 },
  smvm: { actual: 0, dic2023: 0, princ2023: 0 },
  dolarBlue: { venta: null },
  alimentos: [],
  servicios: [],
  costoVivir: 0,
  sueldo: 0,
};

/* ============================================
   INIT
   ============================================ */
async function init() {
  setLoading(true);

  // 1. Traer datos
  const raw = await fetchAllData();

  // 2. Guardar en el estado
  state.inflacion = raw.inflacion;
  state.smvm = raw.smvm;
  state.dolarBlue = raw.dolarBlue;

  // 3. Enriquecer con cálculos
  state.alimentos = enrichItems(raw.alimentos, raw.inflacion, raw.smvm);
  state.servicios = enrichItems(raw.servicios, raw.inflacion, raw.smvm);
  state.costoVivir = calcularCostoVivir(state.alimentos, state.servicios);

  // 4. Primer render
  renderHeader(state);
  renderHero(state);
  renderProducts(state.alimentos, state.inflacion);
  renderRanking(state.alimentos);
  renderServices(state.servicios);
  renderUserResults({ ...state, score: null });

  // 5. Log de fuente de datos
  console.log(
    `[app] Datos cargados · IPC: ${state.inflacion.fuente} · SMVM: ${state.smvm.fuente} · Dólar: ${state.dolarBlue.fuente}`
  );
}

/* ============================================
   EVENTOS
   ============================================ */
function setupSalaryInput() {
  const input = document.getElementById('salary-input');
  const clear = document.getElementById('salary-clear');
  const summary = document.getElementById('salary-summary');
  const bar = document.getElementById('salary-bar');

  function update() {
    const val = parseFloat(input.value);
    state.sueldo = (!val || val <= 0) ? 0 : val;

    clear.classList.toggle('visible', state.sueldo > 0);
    summary.classList.toggle('visible', state.sueldo > 0);

    const score = calcularScoreTermometro(state.costoVivir, state.sueldo);
    renderUserResults({ ...state, score });
  }

  input.addEventListener('input', update);
  clear.addEventListener('click', () => {
    input.value = '';
    update();
    input.focus();
  });

  // Elevar barra al scrollear
  window.addEventListener('scroll', () => {
    bar.classList.toggle('elevated', window.scrollY > 200);
  });
}

function setupShareButton() {
  document.getElementById('btn-share').addEventListener('click', async () => {
    const headlineEl = document.getElementById('share-headline');
    const headlineText = headlineEl.textContent.replace(/\s+/g, ' ').trim();
    const texto = state.sueldo > 0
      ? `Con mi sueldo hoy ${headlineText}. Calculá el tuyo:`
      : 'Mirá cuánto perdió tu sueldo desde 2023. Calculalo acá:';
    const url = window.location.href;

    if (navigator.share) {
      try { await navigator.share({ title: 'Radiografía del Bolsillo', text: texto, url }); }
      catch { /* usuario canceló */ }
    } else {
      await navigator.clipboard.writeText(`${texto} ${url}`);
      const btn = document.getElementById('btn-share');
      const orig = btn.textContent;
      btn.textContent = '✓ Copiado';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    }
  });
}

/* ============================================
   BOOT
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  setupSalaryInput();
  setupShareButton();
  init().catch(err => {
    console.error('[app] Error fatal:', err);
    // La UI queda con los valores por defecto del HTML
  });
});
/**
 * Capa de datos. Intenta traer datos en vivo de las APIs.
 * Si falla algo, cae en fallback estático para no romper la UI.
 */

import { CONFIG } from './config.js';

/* ============================================
   SERVICIOS — datos estáticos
   Pendiente Fase B: parseo de informes IIEP (UBA-CONICET)
   ============================================ */
const SERVICIOS_FALLBACK = [
  { id:'luz',        nombre:'Electricidad',           emoji:'💡', precio2023:2100, precioDic2023:8500,  precioHoy:23463 },
  { id:'gas',        nombre:'Gas natural',            emoji:'🔥', precio2023:1800, precioDic2023:7200,  precioHoy:18500 },
  { id:'agua',       nombre:'Agua (AySA)',            emoji:'💧', precio2023:900,  precioDic2023:3500,  precioHoy:9800  },
  { id:'transporte', nombre:'Transporte (60 viajes)', emoji:'🚌', precio2023:3600, precioDic2023:7500,  precioHoy:45600 },
  { id:'internet',   nombre:'Internet + Cable',       emoji:'📡', precio2023:4500, precioDic2023:12000, precioHoy:38000 },
];

/* ============================================
   ALIMENTOS — valores históricos fijos
   Los precios de 2023 y Dic 2023 son históricos y no cambian.
   El precioHoy se obtiene del scraper (data/precios.json).
   ============================================ */
const PRECIOS_BASE = [
  { id:'nalga',   nombre:'Nalga',          emoji:'🥩', unidad:'kg',    precio2023:1850, precioDic2023:4200  },
  { id:'picada',  nombre:'Carne picada',   emoji:'🥩', unidad:'kg',    precio2023:950,  precioDic2023:2500  },
  { id:'asado',   nombre:'Asado',          emoji:'🥩', unidad:'kg',    precio2023:1400, precioDic2023:4750  },
  { id:'cerdo',   nombre:'Carne de cerdo', emoji:'🐖', unidad:'kg',    precio2023:1600, precioDic2023:3900  },
  { id:'pollo',   nombre:'Pollo entero',   emoji:'🐔', unidad:'kg',    precio2023:950,  precioDic2023:2400  },
  { id:'pan',     nombre:'Pan francés',    emoji:'🥖', unidad:'kg',    precio2023:460,  precioDic2023:1200  },
  { id:'leche',   nombre:'Leche entera',   emoji:'🥛', unidad:'litro', precio2023:216,  precioDic2023:457   },
];

// Fallback de precioHoy si el scraper todavía no corrió o falló
const PRECIOS_HOY_FALLBACK = {
  nalga:  21448,
  picada: 10613,
  asado:  16736,
  cerdo:  15900,
  pollo:  8200,
  pan:    4910,
  leche:  2000,
};

/* ============================================
   HELPERS
   ============================================ */
async function fetchWithTimeout(url, timeout = CONFIG.FETCH_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(id);
  }
}

/* ============================================
   FETCHERS — DATOS MACRO
   ============================================ */

/**
 * Trae la serie de IPC y calcula el acumulado desde la fecha de referencia.
 * La API devuelve { data: [["2024-09-01", 123.4], ...] } ordenado desc.
 */
export async function fetchInflacion() {
  try {
    const url = `${CONFIG.DATOS_GOB_AR}?ids=${CONFIG.SERIES.IPC}&format=json&limit=36&sort=desc`;
    const json = await fetchWithTimeout(url);
    if (!json.data || !json.data.length) throw new Error('Sin datos de IPC');

    const ultimo = json.data[0];
    const refStr = CONFIG.FECHA_REFERENCIA.slice(0, 7); // "2023-12"
    const referencia = json.data.find(d => d[0].startsWith(refStr));
    if (!referencia) throw new Error('Sin dato de Dic 2023');

    const acumuladaPostDeval = ((ultimo[1] / referencia[1]) - 1) * 100;

    // Para el acumulado total desde 2023-01, buscamos el primer mes de 2023
    const principio2023 = json.data.find(d => d[0].startsWith('2023-01'));
    const acumuladaTotal = principio2023
      ? ((ultimo[1] / principio2023[1]) - 1) * 100
      : CONFIG.IPC_FALLBACK.acumuladaTotal;

    return {
      acumuladaPostDeval,
      acumuladaTotal,
      ultimoMes: ultimo[0],
      fuente: 'datos.gob.ar',
    };
  } catch (err) {
    console.warn('[data] Fallback IPC:', err.message);
    return { ...CONFIG.IPC_FALLBACK, ultimoMes: null, fuente: 'fallback' };
  }
}

/**
 * Trae la serie de SMVM actual y el valor de Dic 2023.
 */
export async function fetchSMVM() {
  try {
    const url = `${CONFIG.DATOS_GOB_AR}?ids=${CONFIG.SERIES.SMVM}&format=json&limit=36&sort=desc`;
    const json = await fetchWithTimeout(url);
    if (!json.data || !json.data.length) throw new Error('Sin datos de SMVM');

    const ultimo = json.data[0];
    const refStr = CONFIG.FECHA_REFERENCIA.slice(0, 7);
    const ref = json.data.find(d => d[0].startsWith(refStr));

    return {
      actual: ultimo[1],
      dic2023: ref ? ref[1] : CONFIG.SMVM_FALLBACK.dic2023,
      princ2023: CONFIG.SMVM_FALLBACK.princ2023,
      fuente: 'datos.gob.ar',
    };
  } catch (err) {
    console.warn('[data] Fallback SMVM:', err.message);
    return { ...CONFIG.SMVM_FALLBACK, fuente: 'fallback' };
  }
}

/**
 * Cotización dólar blue desde DolarAPI.
 */
export async function fetchDolarBlue() {
  try {
    const json = await fetchWithTimeout(CONFIG.DOLAR_API);
    const blue = Array.isArray(json) ? json.find(d => d.casa === 'blue') : null;
    if (!blue) throw new Error('Sin dato de blue');
    return { venta: blue.venta, compra: blue.compra, fuente: 'DolarAPI' };
  } catch (err) {
    console.warn('[data] Fallback dólar:', err.message);
    return { venta: null, compra: null, fuente: 'fallback' };
  }
}

/* ============================================
   FETCHER — PRECIOS DE SUPERMERCADOS
   Lee data/precios.json generado por el scraper semanal (GitHub Actions).
   ============================================ */
export async function fetchPreciosSupermercados() {
  try {
    // Cache-busting con timestamp para no leer una versión vieja
    const res = await fetch(`data/precios.json?v=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    // Mezclar precios scrapeados con los valores base históricos
    const alimentos = PRECIOS_BASE.map(item => {
      const scrapeado = json.productos?.[item.id] ?? {};
      const precioHoy = scrapeado.promedio ?? PRECIOS_HOY_FALLBACK[item.id] ?? item.precioDic2023;

      return {
        ...item,
        precioHoy,
        preciosPorSuper: scrapeado.precios ?? {},
        superMasBarato: scrapeado.super_mas_barato ?? null,
        superMasCaro: scrapeado.precios
          ? Object.keys(scrapeado.precios).reduce((a, b) =>
              scrapeado.precios[a] > scrapeado.precios[b] ? a : b
            )
          : null,
      };
    });

    return {
      alimentos,
      fuentes: json.fuentes ?? ['Coto', 'Carrefour', 'Jumbo'],
      actualizado: json.actualizado ?? null,
      origen: 'scraper',
    };
  } catch (err) {
    console.warn('[data] Fallback precios estáticos:', err.message);

    // Fallback completo: usar los precios hardcodeados originales
    const alimentos = PRECIOS_BASE.map(item => ({
      ...item,
      precioHoy: PRECIOS_HOY_FALLBACK[item.id] ?? item.precioDic2023,
      preciosPorSuper: {},
      superMasBarato: null,
      superMasCaro: null,
    }));

    return {
      alimentos,
      fuentes: ['fallback'],
      actualizado: null,
      origen: 'fallback',
    };
  }
}

/* ============================================
   FETCHER — TODO EN PARALELO
   ============================================ */
export async function fetchAllData() {
  const [inflacion, smvm, dolarBlue, precios] = await Promise.all([
    fetchInflacion(),
    fetchSMVM(),
    fetchDolarBlue(),
    fetchPreciosSupermercados(),
  ]);

  return {
    inflacion,
    smvm,
    dolarBlue,
    alimentos: precios.alimentos,
    servicios: [...SERVICIOS_FALLBACK],
    meta: {
      fuentesPrecios: precios.fuentes,
      actualizadoPrecios: precios.actualizado,
      origenPrecios: precios.origen,
    },
  };
}
/**
 * Funciones puras de cálculo. No tocan el DOM, no importan nada del frontend.
 * Esto es testeable y reusable (CLI, bot, backend).
 */

import { CONFIG } from './config.js';

export const calc = {
  /** Variación porcentual entre dos valores */
  variacion(from, to) {
    if (!from || from === 0) return 0;
    return ((to - from) / from) * 100;
  },

  /** Horas de trabajo necesarias para comprar algo */
  horas(precio, smvmMensual) {
    if (!smvmMensual || smvmMensual === 0) return 0;
    return precio / (smvmMensual / CONFIG.HORAS_MES);
  },

  /** Desvío vs. IPC (positivo = subió más que la inflación) */
  desvio(variacionPct, ipcPct) {
    return variacionPct - ipcPct;
  },

  /** Severidad en base al desvío */
  severidad(desvioPct) {
    if (desvioPct >= 60) return 'critical';
    if (desvioPct >= 20) return 'warning';
    if (desvioPct >= -10) return 'moderate';
    return 'ok';
  },
};

/**
 * Enriquece cada ítem con métricas calculadas.
 * Mutación local (no side effects fuera del array que recibe).
 */
export function enrichItems(items, inflacion, smvm) {
  return items.map(item => {
    const variacionTotal = calc.variacion(item.precio2023, item.precioHoy);
    const variacionPostDeval = calc.variacion(item.precioDic2023, item.precioHoy);
    const desvioIPC = calc.desvio(variacionPostDeval, inflacion.acumuladaPostDeval);
    const horas2023 = calc.horas(item.precioDic2023, smvm.dic2023);
    const horasHoy = calc.horas(item.precioHoy, smvm.actual);

    return {
      ...item,
      variacionTotal,
      variacionPostDeval,
      desvioIPC,
      horas2023,
      horasHoy,
      deltaHoras: horasHoy - horas2023,
      severidad: calc.severidad(desvioIPC),
    };
  });
}

/**
 * Costo de vivir: canasta básica mensual + servicios (una persona).
 */
export function calcularCostoVivir(alimentos, servicios) {
  const pan    = (alimentos.find(a => a.id === 'pan')?.precioHoy    ?? 0) * 5;
  const leche  = (alimentos.find(a => a.id === 'leche')?.precioHoy  ?? 0) * 10;
  const pollo  = (alimentos.find(a => a.id === 'pollo')?.precioHoy  ?? 0) * 2;
  const picada = (alimentos.find(a => a.id === 'picada')?.precioHoy ?? 0) * 2;
  const verdura = 15000; // placeholder hasta tener datos de verdulería
  const totalServicios = servicios.reduce((sum, s) => sum + s.precioHoy, 0);
  return pan + leche + pollo + picada + verdura + totalServicios;
}

/**
 * Score del termómetro (0-100).
 * 0 = gastás <30% del sueldo en vivir.
 * 100 = gastás 100%+ del sueldo en vivir.
 */
export function calcularScoreTermometro(costoVivir, sueldo) {
  if (!sueldo || sueldo <= 0) return null;
  const pct = (costoVivir / sueldo) * 100;
  const score = Math.max(0, Math.min(100, ((pct - 30) / 70) * 100));
  return { score: Math.round(score), pct: Math.round(pct) };
}
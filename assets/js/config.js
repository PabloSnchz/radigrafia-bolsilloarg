/**
 * Configuración central del proyecto.
 * Todo lo que sea "ajustable" vive acá.
 */

export const CONFIG = {
  // API datos.gob.ar — Series de tiempo
  DATOS_GOB_AR: 'https://apis.datos.gob.ar/series/api/series/',

  // IDs de series (verificar con /search/ si cambian)
  SERIES: {
    IPC: '148.3_INIVELNAL_DICI_M_26',   // IPC Nacional, mensual
    SMVM: '158.1_SMV_0_0_9',            // Salario Mínimo Vital y Móvil
  },

  // DolarAPI
  DOLAR_API: 'https://dolarapi.com/v1/dolares',

  // Fecha de referencia post-devaluación (usada para todos los desvíos)
  FECHA_REFERENCIA: '2023-12-01',

  // SMVM de referencia histórica (fallback si la API falla)
  SMVM_FALLBACK: {
    actual: 391200,
    dic2023: 156000,
    princ2023: 65427,
  },

  // IPC de referencia histórica (fallback)
  IPC_FALLBACK: {
    acumuladaPostDeval: 330,   // Dic 2023 → hoy
    acumuladaTotal: 1150,      // Princ 2023 → hoy
  },

  // Horas de trabajo asumidas por mes (22 días × 8hs)
  HORAS_MES: 176,

  // Timeout de fetch en ms
  FETCH_TIMEOUT: 8000,
};
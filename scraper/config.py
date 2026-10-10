"""
Configuración del scraper. Productos a buscar, endpoints de APIs
y selectores. Si los sitios cambian su estructura, este es el archivo a tocar.
"""

# Productos a monitorear
PRODUCTOS = [
    {"id": "nalga",   "nombre": "Nalga",          "unidad": "kg",    "busqueda": "nalga"},
    {"id": "picada",  "nombre": "Carne picada",   "unidad": "kg",    "busqueda": "carne picada"},
    {"id": "asado",   "nombre": "Asado",          "unidad": "kg",    "busqueda": "asado"},
    {"id": "cerdo",   "nombre": "Carne de cerdo", "unidad": "kg",    "busqueda": "bondiola cerdo"},
    {"id": "pollo",   "nombre": "Pollo entero",   "unidad": "kg",    "busqueda": "pollo entero"},
    {"id": "pan",     "nombre": "Pan francés",    "unidad": "kg",    "busqueda": "pan frances"},
    {"id": "leche",   "nombre": "Leche entera",   "unidad": "litro", "busqueda": "leche entera"},
]

# ============================================
# SUPERMERCADOS
# ============================================
# Carrefour y Jumbo usan VTEX. Se scrapean vía API JSON (más robusto).
# Coto usa sistema propio. Se scrapea con Playwright.
SUPERMERCADOS = {
    "carrefour": {
        "nombre": "Carrefour",
        "tipo": "vtex",
        "api_url": "https://www.carrefour.com.ar/api/catalog_system/pub/products/search/?ft={query}&_from=0&_to=9",
    },
    "jumbo": {
        "nombre": "Jumbo",
        "tipo": "vtex",
        "api_url": "https://www.jumbo.com.ar/api/catalog_system/pub/products/search/?ft={query}&_from=0&_to=9",
    },
    "coto": {
        "nombre": "Coto",
        "tipo": "playwright",
        "url_busqueda": "https://www.cotodigital3.com.ar/sitios/cdigi/busca/?ft={query}",
        "selectores": {
            "producto":  "[id^='atg_store_prodListItem']",
            "nombre":    ".descripcion",
            "precio":    ".atg_store_newPrice",
        },
    },
}

# User-Agents para Playwright (Coto)
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
]

# Timeouts y delays
PAGE_TIMEOUT = 30000
DELAY_BETWEEN_REQUESTS = 2

# Directorio para screenshots de debug (útil cuando falla un super)
DEBUG_DIR = "debug"
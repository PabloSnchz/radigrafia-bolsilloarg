"""
Configuración del scraper: productos a buscar, URLs base y selectores.
Si los sitios cambian su HTML, este es el único archivo a tocar.
"""

# Productos a monitorear. El `slug` es lo que buscamos en cada super.
PRODUCTOS = [
    {"id": "nalga",   "nombre": "Nalga",           "unidad": "kg",    "busqueda": "nalga"},
    {"id": "picada",  "nombre": "Carne picada",    "unidad": "kg",    "busqueda": "carne picada"},
    {"id": "asado",   "nombre": "Asado",           "unidad": "kg",    "busqueda": "asado"},
    {"id": "cerdo",   "nombre": "Carne de cerdo",  "unidad": "kg",    "busqueda": "bondiola cerdo"},
    {"id": "pollo",   "nombre": "Pollo entero",    "unidad": "kg",    "busqueda": "pollo entero"},
    {"id": "pan",     "nombre": "Pan francés",     "unidad": "kg",    "busqueda": "pan frances"},
    {"id": "leche",   "nombre": "Leche entera",    "unidad": "litro", "busqueda": "leche entera"},
]

# Supermercados a scrapear
SUPERMERCADOS = {
    "coto": {
        "nombre": "Coto",
        "url_busqueda": "https://www.cotodigital3.com.ar/sitios/cdigi/browse/?Ntt={query}",
        "selectores": {
            "producto":  ".producto",           # contenedor de cada producto
            "nombre":    ".descripcion",        # nombre del producto
            "precio":    ".precio",             # precio final
        },
    },
    "carrefour": {
        "nombre": "Carrefour",
        "url_busqueda": "https://www.carrefour.com.ar/{query}?_q={query}&map=ft",
        "selectores": {
            "producto":  "[data-testid='product-card']",
            "nombre":    "[data-testid='product-name']",
            "precio":    "[data-testid='price']",
        },
    },
    "jumbo": {
        "nombre": "Jumbo",
        "url_busqueda": "https://www.jumbo.com.ar/{query}?_q={query}&map=ft",
        "selectores": {
            "producto":  ".product-summary",
            "nombre":    ".product-summary__name",
            "precio":    ".product-summary__price",
        },
    },
}

# User-Agent rotativo para evitar bloqueos
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
]

# Timeout por página (ms)
PAGE_TIMEOUT = 30000

# Delay entre requests (segundos) — ser respetuoso
DELAY_BETWEEN_REQUESTS = 3
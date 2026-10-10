"""
Scraper de precios de supermercados argentinos.
Usa Playwright para renderizar JavaScript y extraer precios reales.
"""

import asyncio
import json
import re
import random
import sys
from datetime import datetime, timezone
from pathlib import Path

from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout

# Importar config local
sys.path.insert(0, str(Path(__file__).parent))
from config import (
    PRODUCTOS, SUPERMERCADOS, USER_AGENTS,
    PAGE_TIMEOUT, DELAY_BETWEEN_REQUESTS,
)

# Ruta de salida
OUTPUT_PATH = Path(__file__).parent.parent / "data" / "precios.json"


def limpiar_precio(texto: str) -> float | None:
    """Convierte '$ 21.448,00' → 21448.0"""
    if not texto:
        return None
    # Extraer solo números, puntos y comas
    limpio = re.sub(r"[^\d.,]", "", texto)
    # Formato argentino: 21.448,00 → 21448.00
    limpio = limpio.replace(".", "").replace(",", ".")
    try:
        return float(limpio)
    except ValueError:
        return None


async def scrape_producto(page, url: str, selectores: dict) -> list[dict]:
    """Entra a una URL de búsqueda y devuelve lista de productos con precio."""
    resultados = []
    try:
        await page.goto(url, timeout=PAGE_TIMEOUT, wait_until="domcontentloaded")
        # Esperar a que carguen los productos (ajustable por sitio)
        await page.wait_for_timeout(4000)

        productos = await page.query_selector_all(selectores["producto"])
        for prod in productos[:5]:  # solo los primeros 5 resultados
            try:
                nombre_el = await prod.query_selector(selectores["nombre"])
                precio_el = await prod.query_selector(selectores["precio"])
                if not nombre_el or not precio_el:
                    continue
                nombre = (await nombre_el.inner_text()).strip()
                precio_raw = (await precio_el.inner_text()).strip()
                precio = limpiar_precio(precio_raw)
                if precio and precio > 0:
                    resultados.append({"nombre": nombre, "precio": precio})
            except Exception:
                continue
    except PlaywrightTimeout:
        print(f"  ⏱️  Timeout en {url}")
    except Exception as e:
        print(f"  ❌ Error: {e}")
    return resultados


def filtrar_por_unidad(productos: list[dict], busqueda: str) -> float | None:
    """
    Toma la lista de productos y devuelve el precio del que mejor matchea.
    Prioriza coincidencia exacta con el término de búsqueda.
    """
    if not productos:
        return None
    # Filtrar los que contienen el término de búsqueda en el nombre
    termino = busqueda.lower()
    candidatos = [p for p in productos if termino in p["nombre"].lower()]
    if not candidatos:
        candidatos = productos  # fallback: cualquier resultado
    # Ordenar por precio (el más barato como referencia)
    candidatos.sort(key=lambda x: x["precio"])
    return candidatos[0]["precio"] if candidatos else None


async def scrape_supermercado(nombre_super: str, config: dict) -> dict:
    """Scrapea todos los productos de un supermercado."""
    print(f"\n🏪 Scrapeando {config['nombre']}...")
    resultados = {}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent=random.choice(USER_AGENTS),
            viewport={"width": 1366, "height": 768},
            locale="es-AR",
        )
        page = await context.new_page()

        for producto in PRODUCTOS:
            print(f"  → {producto['nombre']}...", end=" ", flush=True)
            query = producto["busqueda"].replace(" ", "+")
            url = config["url_busqueda"].replace("{query}", query)

            prods = await scrape_producto(page, url, config["selectores"])
            precio = filtrar_por_unidad(prods, producto["busqueda"])

            if precio:
                resultados[producto["id"]] = precio
                print(f"${precio:,.0f}")
            else:
                print("sin datos")

            await asyncio.sleep(DELAY_BETWEEN_REQUESTS)

        await browser.close()

    return resultados


async def main():
    print("=" * 60)
    print("SCRAPER DE PRECIOS — RADIOGRAFÍA DEL BOLSILLO")
    print(f"Inicio: {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)

    resultado_final = {
        "actualizado": datetime.now(timezone.utc).isoformat(),
        "fuentes": [c["nombre"] for c in SUPERMERCADOS.values()],
        "productos": {},
    }

    # Inicializar estructura por producto
    for p in PRODUCTOS:
        resultado_final["productos"][p["id"]] = {
            "nombre": p["nombre"],
            "unidad": p["unidad"],
            "precios": {},  # {coto: 21448, carrefour: 22000, jumbo: 21800}
        }

    # Scrapear cada supermercado
    for key, config in SUPERMERCADOS.items():
        precios_super = await scrape_supermercado(key, config)
        for prod_id, precio in precios_super.items():
            resultado_final["productos"][prod_id]["precios"][key] = precio

    # Calcular promedios
    for prod_id, data in resultado_final["productos"].items():
        valores = list(data["precios"].values())
        data["promedio"] = round(sum(valores) / len(valores)) if valores else None
        data["min"] = min(valores) if valores else None
        data["max"] = max(valores) if valores else None
        data["super_mas_barato"] = (
            min(data["precios"], key=data["precios"].get) if valores else None
        )

    # Guardar JSON
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(resultado_final, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"\n✅ Datos guardados en {OUTPUT_PATH}")
    print(f"Fin: {datetime.now(timezone.utc).isoformat()}")

    # Resumen
    print("\n📊 Resumen:")
    for prod_id, data in resultado_final["productos"].items():
        if data["promedio"]:
            print(f"  {data['nombre']}: ${data['promedio']:,} (promedio)")


if __name__ == "__main__":
    asyncio.run(main())
"""
Scraper de precios de supermercados argentinos.

- Carrefour y Jumbo: API VTEX (JSON, sin scraping HTML)
- Coto: Playwright con selectores + screenshots de debug
"""

import asyncio
import json
import re
import random
import sys
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

import httpx
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout

sys.path.insert(0, str(Path(__file__).parent))
from config import (
    PRODUCTOS, SUPERMERCADOS, USER_AGENTS,
    PAGE_TIMEOUT, DELAY_BETWEEN_REQUESTS, DEBUG_DIR,
)

OUTPUT_PATH = Path(__file__).parent.parent / "data" / "precios.json"
DEBUG_PATH = Path(__file__).parent / DEBUG_DIR
DEBUG_PATH.mkdir(exist_ok=True)


# ============================================
# UTILS
# ============================================
def limpiar_precio(texto) -> float | None:
    """Convierte '$ 21.448,00' o 21448.0 → 21448.0"""
    if texto is None:
        return None
    if isinstance(texto, (int, float)):
        return float(texto)
    limpio = re.sub(r"[^\d.,]", "", str(texto))
    if not limpio:
        return None
    # Detectar formato argentino vs. americano
    if "," in limpio and "." in limpio:
        if limpio.rfind(",") > limpio.rfind("."):
            limpio = limpio.replace(".", "").replace(",", ".")
        else:
            limpio = limpio.replace(",", "")
    elif "," in limpio:
        limpio = limpio.replace(",", ".")
    try:
        return float(limpio)
    except ValueError:
        return None


def filtrar_por_unidad(productos: list[dict], busqueda: str) -> float | None:
    """Devuelve el precio del producto que mejor matchea (el más barato)."""
    if not productos:
        return None
    termino = busqueda.lower()
    candidatos = [p for p in productos if termino in p["nombre"].lower()]
    if not candidatos:
        candidatos = productos
    candidatos.sort(key=lambda x: x["precio"])
    return candidatos[0]["precio"] if candidatos else None


# ============================================
# SCRAPER VTEX (Carrefour, Jumbo)
# ============================================
async def scrape_vtex(client: httpx.AsyncClient, config: dict) -> dict:
    """Scrapea un supermercado vía API VTEX. Devuelve {producto_id: precio}."""
    print(f"\n🏪 Scrapeando {config['nombre']} (VTEX API)...")
    resultados = {}

    for producto in PRODUCTOS:
        query = urllib.parse.quote(producto["busqueda"])
        url = config["api_url"].replace("{query}", query)
        print(f"  → {producto['nombre']}...", end=" ", flush=True)

        try:
            res = await client.get(url, timeout=15)
            if res.status_code != 200:
                print(f"HTTP {res.status_code}")
                continue

            data = res.json()
            if not isinstance(data, list):
                print("respuesta inválida")
                continue

            # Extraer productos con nombre y precio
            encontrados = []
            for item in data:
                try:
                    nombre = item.get("productName", "")
                    items = item.get("items", [])
                    if not items:
                        continue
                    sellers = items[0].get("sellers", [])
                    if not sellers:
                        continue
                    offer = sellers[0].get("commertialOffer", {})
                    precio = offer.get("Price")
                    if nombre and precio and precio > 0:
                        encontrados.append({"nombre": nombre, "precio": float(precio)})
                except (KeyError, IndexError, TypeError):
                    continue

            precio = filtrar_por_unidad(encontrados, producto["busqueda"])
            if precio:
                resultados[producto["id"]] = precio
                print(f"${precio:,.0f}")
            else:
                print(f"sin datos ({len(data)} productos en respuesta)")
        except Exception as e:
            print(f"error: {e}")

        await asyncio.sleep(DELAY_BETWEEN_REQUESTS)

    return resultados


# ============================================
# SCRAPER PLAYWRIGHT (Coto)
# ============================================
async def scrape_producto_playwright(page, url: str, selectores: dict, slug: str) -> list[dict]:
    """Extrae lista de productos de una página de búsqueda."""
    resultados = []
    try:
        await page.goto(url, timeout=PAGE_TIMEOUT, wait_until="domcontentloaded")
        await page.wait_for_timeout(4000)

        productos = await page.query_selector_all(selectores["producto"])
        print(f"[{len(productos)} items]", end=" ", flush=True)

        for prod in productos[:10]:
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

        # Screenshot de debug
        try:
            await page.screenshot(path=str(DEBUG_PATH / f"coto_{slug}.png"), full_page=False)
        except Exception:
            pass

    except PlaywrightTimeout:
        print("timeout")
    except Exception as e:
        print(f"error: {e}")
    return resultados


async def scrape_coto(config: dict) -> dict:
    """Scrapea Coto con Playwright."""
    print(f"\n🏪 Scrapeando {config['nombre']} (Playwright)...")
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
            query = urllib.parse.quote(producto["busqueda"])
            url = config["url_busqueda"].replace("{query}", query)
            print(f"  → {producto['nombre']}...", end=" ", flush=True)

            prods = await scrape_producto_playwright(page, url, config["selectores"], producto["id"])
            precio = filtrar_por_unidad(prods, producto["busqueda"])

            if precio:
                resultados[producto["id"]] = precio
                print(f"→ ${precio:,.0f}")
            else:
                print("sin datos")

            await asyncio.sleep(DELAY_BETWEEN_REQUESTS)

        await browser.close()

    return resultados


# ============================================
# MAIN
# ============================================
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

    # Estructura por producto
    for p in PRODUCTOS:
        resultado_final["productos"][p["id"]] = {
            "nombre": p["nombre"],
            "unidad": p["unidad"],
            "precios": {},
        }

    # Scrapear cada super
    async with httpx.AsyncClient(
        headers={"User-Agent": random.choice(USER_AGENTS), "Accept": "application/json"},
        follow_redirects=True,
    ) as client:
        for key, config in SUPERMERCADOS.items():
            try:
                if config["tipo"] == "vtex":
                    precios = await scrape_vtex(client, config)
                else:
                    precios = await scrape_coto(config)

                for prod_id, precio in precios.items():
                    resultado_final["productos"][prod_id]["precios"][key] = precio
            except Exception as e:
                print(f"\n❌ {config['nombre']} falló completo: {e}")

    # Calcular promedios y metadata
    for prod_id, data in resultado_final["productos"].items():
        valores = list(data["precios"].values())
        if valores:
            data["promedio"] = round(sum(valores) / len(valores))
            data["min"] = min(valores)
            data["max"] = max(valores)
            data["super_mas_barato"] = min(data["precios"], key=data["precios"].get)
        else:
            data["promedio"] = None
            data["min"] = None
            data["max"] = None
            data["super_mas_barato"] = None

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
        else:
            print(f"  {data['nombre']}: sin datos")


if __name__ == "__main__":
    asyncio.run(main())
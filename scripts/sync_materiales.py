"""
Sincroniza artículos desde Defontana → tabla materiales en Supabase.
Uso: python scripts/sync_materiales.py
Requiere: pip install requests openpyxl supabase
"""

import requests
import json
import io
import sys
from openpyxl import load_workbook
from supabase import create_client

# ── Configuración ────────────────────────────────────────────────────────────
DEFONTANA_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1laWQiOiJBRDEyM0ZULUhHREY1Ni1LSTIzS0wtS0pUUDk4NzYtSEdUMTIiLCJ1bmlxdWVfbmFtZSI6ImNsaWVudC5sZWdhY3lAZGVmb250YW5hLmNvbSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vYWNjZXNzY29udHJvbHNlcnZpY2UvMjAxMC8wNy9jbGFpbXMvaWRlbnRpdHlwcm92aWRlciI6IkFTUC5ORVQgSWRlbnRpdHkiLCJBc3BOZXQuSWRlbnRpdHkuU2VjdXJpdHlTdGFtcCI6IkdIVEQyMzQtS0xISjc4NjgtRkc0OTIzLUhKRzA4RlQ1NiIsImNvbXBhbnkiOiIyMDIyMDQxMjIxMDMzMjExNTAwMSIsImNsaWVudCI6IjIwMjIwNDEyMjEwMzMyMTE1MDAxIiwib2xkc2VydmljZSI6InZpc2lvbmFyeSIsInVzZXIiOiJhZG1pbiIsInNlc3Npb24iOiIxNzYxNTcwMzU2Iiwic2VydmljZSI6InZpc2lvbmFyeSIsImNvdW50cnkiOiJDTCIsImNvbXBhbnlfbmFtZSI6Ik5ldyBFbmVyZ3kgQnVzaW5lc3MgU1BBIiwiY29tcGFueV9jb3VudHJ5IjoiQ0wiLCJ1c2VyX25hbWUiOiJDw6lzYXIgRXNwaW5vemEiLCJleHBpcmF0aW9uX2RhdGUiOjE3NjQ2MzM2MDAsImNsaWVudF9jb25kaXRpb24iOiJTIiwiY29tcGFueV9sZWdhbF9jb2RlIjoiNzczMDk5ODEtMiIsInJvbGVzUG9zIjoiW1widXN1YXJpb1wiLFwidXN1YXJpb2VycFwiLFwicm9vdGVycFwiXSIsInJ1dF91c3VhcmlvIjoiQWRtaW5pc3RyYWRvciIsImlzcyI6Imh0dHBzOi8vKi5kZWZvbnRhbmEuY29tIiwiYXVkIjoiMDk5MTUzYzI2MjUxNDliYzhlY2IzZTg1ZTAzZjAwMjIiLCJleHAiOjE3OTMxOTAwODMsIm5iZiI6MTc2MTY1NDA4M30.szjTXoT3bSQtj8JEmDgj_gD70LknqU56wqz0Nr4Zjk8"

SUPABASE_URL = "https://pcfidqnbnmmquxuuzxif.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjZmlkcW5ibm1tcXV4dXV6eGlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE3MjkwNCwiZXhwIjoyMDkzNzQ4OTA0fQ.nXOlBWAdbkAC2S204H6mWkUEE_EJ_RRGKbBlEC9GIEg"  # Supabase Dashboard → Settings → API → service_role
# ─────────────────────────────────────────────────────────────────────────────


def descargar_excel():
    print("→ Solicitando exportación a Defontana...")
    response = requests.post(
        "https://maestro.defontana.com/api/bulk/ExportArticles",
        headers={
            "authorization": f"bearer {DEFONTANA_TOKEN}",
            "content-type": "application/json",
            "origin": "https://maestro-ux.defontana.com",
        },
        json={
            "idCategoria": list(range(-1, 70)) + [None],
            "pageIndex": 0,
            "pageSize": 9999,
            "text": "",
            "withStock": True,
            "active": True,
            "availableSale": True,
            "supply": False,
        },
    )
    response.raise_for_status()
    data = response.json()

    url = data.get("url") or data.get("message")
    if not url or not url.startswith("http"):
        print("Error: no se obtuvo URL de descarga.")
        print("Response:", json.dumps(data, indent=2, ensure_ascii=False))
        sys.exit(1)

    print(f"→ Descargando archivo desde Defontana...")
    file_response = requests.get(url)  # URL pre-firmada de S3, no requiere headers
    file_response.raise_for_status()
    return file_response.content


def parsear_excel(contenido: bytes) -> list[dict]:
    wb = load_workbook(filename=io.BytesIO(contenido), read_only=True, data_only=True)
    ws = wb.active

    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        print("Error: el Excel está vacío.")
        sys.exit(1)

    # Detectar columnas por cabecera (fila 1)
    headers = [str(h).strip() if h else "" for h in rows[0]]
    print(f"  Columnas detectadas: {headers}")

    def col(name: str) -> int:
        for i, h in enumerate(headers):
            if name.lower() in h.lower():
                return i
        return -1

    idx_codigo    = col("código") if col("código") >= 0 else col("codigo")
    idx_nombre    = col("nombre")
    idx_categoria = col("categoría") if col("categoría") >= 0 else col("categoria")
    idx_precio    = col("precio")

    if any(i < 0 for i in [idx_codigo, idx_nombre, idx_categoria]):
        print(f"Error: no se encontraron columnas esperadas. Headers: {headers}")
        sys.exit(1)

    materiales = []
    for row in rows[1:]:
        codigo = str(row[idx_codigo]).strip() if row[idx_codigo] else None
        nombre = str(row[idx_nombre]).strip() if row[idx_nombre] else None
        if not codigo or not nombre:
            continue

        precio = None
        if idx_precio >= 0 and row[idx_precio] is not None:
            try:
                precio = float(row[idx_precio])
                if precio == 0:
                    precio = None
            except (ValueError, TypeError):
                precio = None

        materiales.append({
            "codigo":           codigo,
            "nombre":           nombre,
            "categoria":        str(row[idx_categoria]).strip() if row[idx_categoria] else "SIN CATEGORÍA",
            "unidad":           "UN",
            "precio_referencia": precio,
            "activo":           True,
        })

    return materiales


def sincronizar(materiales: list[dict]):
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    print(f"\n→ {len(materiales)} artículos parseados desde el Excel")

    # Categorías presentes
    cats = sorted(set(m["categoria"] for m in materiales))
    print(f"  Categorías encontradas ({len(cats)}): {', '.join(cats[:10])}{'...' if len(cats) > 10 else ''}")

    confirm = input(f"\n¿Sincronizar {len(materiales)} materiales desde Defontana? (s/N): ")
    if confirm.strip().lower() != "s":
        print("Cancelado.")
        sys.exit(0)

    # Upsert: actualiza existentes, inserta nuevos (no borra nada → no rompe FK)
    print("→ Sincronizando materiales con upsert...")
    batch_size = 500
    total = 0
    codigos_defontana = set(m["codigo"] for m in materiales)
    for i in range(0, len(materiales), batch_size):
        batch = materiales[i : i + batch_size]
        supabase.table("materiales").upsert(batch, on_conflict="codigo").execute()
        total += len(batch)
        print(f"  {total}/{len(materiales)} procesados...")

    # Marcar como inactivos los materiales que ya no están en Defontana
    todos = supabase.table("materiales").select("id,codigo").execute()
    ids_inactivos = [r["id"] for r in todos.data if r["codigo"] not in codigos_defontana]
    if ids_inactivos:
        supabase.table("materiales").update({"activo": False}).in_("id", ids_inactivos).execute()
        print(f"  {len(ids_inactivos)} materiales marcados como inactivos (no están en Defontana).")

    print(f"\n✓ Sincronización completa: {total} materiales procesados.")


if __name__ == "__main__":
    contenido = descargar_excel()
    materiales = parsear_excel(contenido)
    sincronizar(materiales)

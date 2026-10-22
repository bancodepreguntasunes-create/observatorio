import sys
import webbrowser
import threading
import time
import uvicorn
from pathlib import Path

# Agregar directorio raíz al path
ROOT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT_DIR))

from app.database import init_db, get_db_connection
from app.seed_data import generate_sample_surveys

def check_and_seed():
    """Inicializa la BD y si no hay encuestas, inserta un set de muestra inicial representativo"""
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM surveys")
    count = cursor.fetchone()[0]
    conn.close()

    if count == 0:
        print("[Observatorio] Base de datos vacía detectada. Insertando muestra inicial del Piloto Caracas...")
        generate_sample_surveys(target_count=450, scenario="realistic_pilot")
        print("[Observatorio] Muestra cargada con éxito para demostración y evaluación.")
    else:
        print(f"[Observatorio] Base de datos activa con {count} encuestas registradas.")

def open_browser():
    """Abre el navegador tras iniciar el servidor"""
    time.sleep(1.2)
    url = "http://localhost:8000"
    print(f"\n[Observatorio] Abriendo portal en navegador: {url}\n")
    try:
        webbrowser.open(url)
    except Exception:
        pass

if __name__ == "__main__":
    print("=" * 70)
    print("  OBSERVATORIO DE PAZ Y CONVIVENCIA DEMOCRÁTICA UNIVERSITARIA")
    print("  Ecosistema de Medición, GIS y Diagnóstico Institucional (Caracas)")
    print("=" * 70)

    check_and_seed()

    # Abrir navegador en hilo separado
    threading.Thread(target=open_browser, daemon=True).start()

    # Iniciar servidor Uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)

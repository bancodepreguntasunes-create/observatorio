import sys
from pathlib import Path

# Asegurar que el directorio raíz del proyecto esté en sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.main import app

# Exportar 'app' para el runtime serverless de Vercel (@vercel/python)
# Vercel detecta automáticamente la instancia ASGI de FastAPI.

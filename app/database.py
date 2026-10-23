import sqlite3
import os
import json
import shutil
import tempfile
from pathlib import Path

# En Vercel, el sistema de archivos raíz es de solo lectura.
# Solo el directorio temporal del sistema (/tmp en Linux) tiene permisos de lectura y escritura.
IS_VERCEL = bool(os.environ.get("VERCEL"))
LOCAL_DB_PATH = Path(__file__).resolve().parent.parent / "observatorio.db"

if IS_VERCEL:
    DB_PATH = Path(tempfile.gettempdir()) / "observatorio.db"
else:
    DB_PATH = LOCAL_DB_PATH

def ensure_db_ready():
    """Garantiza que la base de datos exista y tenga datos tanto en local como en Vercel"""
    if IS_VERCEL and not DB_PATH.exists():
        if LOCAL_DB_PATH.exists():
            try:
                shutil.copy2(LOCAL_DB_PATH, DB_PATH)
            except Exception:
                pass
    if not DB_PATH.exists():
        _create_schema()
        # Sembrar datos iniciales si no existen encuestas
        try:
            from app.seed_data import generate_sample_surveys
            generate_sample_surveys(target_count=450, scenario="realistic_pilot")
        except Exception:
            pass

def get_db_connection():
    ensure_db_ready()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    _create_schema()

def _create_schema():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Tabla de Encuestas / Reportes (anonimizados según requerimientos de ciberseguridad)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS surveys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        is_field_survey INTEGER DEFAULT 0,
        consent INTEGER NOT NULL DEFAULT 1,
        
        -- Sección 1: Sociodemográfico
        cedula TEXT DEFAULT '',
        role TEXT NOT NULL,
        gender TEXT NOT NULL,
        age_group TEXT NOT NULL,
        shift TEXT NOT NULL,
        institution_type TEXT DEFAULT 'Universidades Públicas Nacionales y Experimentales',
        institution_name TEXT DEFAULT 'Universidad Central de Venezuela (UCV)',
        faculty TEXT DEFAULT '',
        campus TEXT NOT NULL DEFAULT 'Campus Central Caracas',
        
        -- Sección 2: Paz y Convivencia
        verbal_conflicts INTEGER NOT NULL,
        physical_aggressions INTEGER NOT NULL,
        respect_common_spaces INTEGER NOT NULL,
        cordial_treatment INTEGER NOT NULL,
        peaceful_channels TEXT NOT NULL,
        
        -- Sección 3: Tolerancia y Diversidad Ideológica
        safe_expressing_opinions TEXT NOT NULL,
        ideological_discrimination TEXT NOT NULL,
        grades_affected_divergence TEXT DEFAULT 'no_aplica',
        group_dialogue_attitude TEXT NOT NULL,
        
        -- Sección 4: Percepción y Zonificación
        safety_score INTEGER NOT NULL,
        crime_victim TEXT NOT NULL,
        night_lighting TEXT NOT NULL,
        selected_zones TEXT NOT NULL, -- JSON string de cuadrantes
        zone_reasons TEXT NOT NULL,   -- JSON string de motivos
        
        -- Sección 5: Cualitativo
        improvement_suggestion TEXT
    );
    """)

    # Tabla de Cuadrantes / Zonas Universitarias (Modelo GIS)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS zones (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        area_type TEXT NOT NULL,
        description TEXT NOT NULL,
        polygon_geojson TEXT NOT NULL,
        center_lat REAL NOT NULL,
        center_lng REAL NOT NULL
    );
    """)

    # Tabla de Configuración de Cuotas y Parámetros del Piloto
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS pilot_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
    """)

    # Inicializar cuadrantes predefinidos si no existen
    cursor.execute("SELECT COUNT(*) FROM zones")
    if cursor.fetchone()[0] == 0:
        seed_zones(cursor)

    # Migración de columnas si la tabla ya existía
    for col, col_type in [("cedula", "TEXT DEFAULT ''"),
                          ("institution_type", "TEXT DEFAULT 'Universidades Públicas Nacionales y Experimentales'"),
                          ("institution_name", "TEXT DEFAULT 'Universidad Central de Venezuela (UCV)'")]:
        try:
            cursor.execute(f"ALTER TABLE surveys ADD COLUMN {col} {col_type}")
        except Exception:
            pass

    # Configuración por defecto de cuotas (según Especificación Parte II del PDF)
    default_configs = [
        ("target_total", "500"),
        ("quota_estudiantes", "400"),      # 80%
        ("quota_docentes", "50"),          # 10%
        ("quota_administrativos", "35"),   # 7%
        ("quota_obreros", "15"),           # 3%
        ("quota_noche_fines", "160"),      # 40% de estudiantes
        ("quota_manana_tarde", "240"),     # 60% de estudiantes
        ("active_period", "Piloto Caracas 2026-I"),
        ("survey_status", "OPEN")          # OPEN / CLOSED
    ]
    for key, val in default_configs:
        cursor.execute("INSERT OR IGNORE INTO pilot_config (key, value) VALUES (?, ?)", (key, val))

    conn.commit()
    conn.close()

def seed_zones(cursor):
    """Zonificación y cuadrantes para el Campus Piloto en Caracas"""
    zones_data = [
        {
            "id": "C1",
            "name": "Puerta Principal y Estacionamiento Este",
            "code": "CUAD-01",
            "area_type": "Acceso y Tránsito Vehicular",
            "description": "Punto de acceso perimetral, paradas de transporte público y estacionamiento este sin vigilancia continua.",
            "polygon_geojson": json.dumps([
                [-66.8850, 10.4900], [-66.8820, 10.4900], [-66.8820, 10.4875], [-66.8850, 10.4875]
            ]),
            "center_lat": 10.4887,
            "center_lng": -66.8835
        },
        {
            "id": "C2",
            "name": "Pasillos Aulas Norte y Rectorado",
            "code": "CUAD-02",
            "area_type": "Académica y Administrativa",
            "description": "Corredores cubiertos de facultades norte y plazas adyacentes al edificio rectoral.",
            "polygon_geojson": json.dumps([
                [-66.8885, 10.4905], [-66.8855, 10.4905], [-66.8855, 10.4878], [-66.8885, 10.4878]
            ]),
            "center_lat": 10.4891,
            "center_lng": -66.8870
        },
        {
            "id": "C3",
            "name": "Biblioteca Central y Plaza Cubierta",
            "code": "CUAD-03",
            "area_type": "Patrimonial y Estudio",
            "description": "Zona neurálgica de estudio, sala de lectura, murales y área de encuentro de gran afluencia.",
            "polygon_geojson": json.dumps([
                [-66.8880, 10.4875], [-66.8850, 10.4875], [-66.8850, 10.4850], [-66.8880, 10.4850]
            ]),
            "center_lat": 10.4862,
            "center_lng": -66.8865
        },
        {
            "id": "C4",
            "name": "Comedor Universitario y Talleres de Mantenimiento",
            "code": "CUAD-04",
            "area_type": "Servicios y Operaciones",
            "description": "Comedor central, galpones de servicio obrero y áreas de almacenamiento y desechos.",
            "polygon_geojson": json.dumps([
                [-66.8915, 10.4880], [-66.8885, 10.4880], [-66.8885, 10.4855], [-66.8915, 10.4855]
            ]),
            "center_lat": 10.4867,
            "center_lng": -66.8900
        },
        {
            "id": "C5",
            "name": "Facultad de Ciencias y Galpones de Ingeniería",
            "code": "CUAD-05",
            "area_type": "Laboratorios y Docencia",
            "description": "Edificios de laboratorios especializados, aulas de clase y pasillos perimetrales oeste.",
            "polygon_geojson": json.dumps([
                [-66.8920, 10.4850], [-66.8885, 10.4850], [-66.8885, 10.4820], [-66.8920, 10.4820]
            ]),
            "center_lat": 10.4835,
            "center_lng": -66.8902
        },
        {
            "id": "C6",
            "name": "Complejo Deportivo y Estadios",
            "code": "CUAD-06",
            "area_type": "Deportiva y Recreativa",
            "description": "Canchas al aire libre, piscinas y graderías de estadios. Zonas amplias poco transitadas en la noche.",
            "polygon_geojson": json.dumps([
                [-66.8850, 10.4850], [-66.8810, 10.4850], [-66.8810, 10.4815], [-66.8850, 10.4815]
            ]),
            "center_lat": 10.4832,
            "center_lng": -66.8830
        },
        {
            "id": "C7",
            "name": "Jardines Botánicos y Senderos Perimetrales",
            "code": "CUAD-07",
            "area_type": "Áreas Verdes y Perímetro",
            "description": "Caminerías arboladas, linderos con la ciudad y senderos con reportes históricos de soledad nocturna.",
            "polygon_geojson": json.dumps([
                [-66.8885, 10.4820], [-66.8840, 10.4820], [-66.8840, 10.4785], [-66.8885, 10.4785]
            ]),
            "center_lat": 10.4802,
            "center_lng": -66.8862
        },
        {
            "id": "C8",
            "name": "Residencias Estudiantiles y Centro de Salud",
            "code": "CUAD-08",
            "area_type": "Residencial y Bienestar",
            "description": "Módulos asistenciales de salud estudiantil, cafeterías anexas y caminerías de conexión sur.",
            "polygon_geojson": json.dumps([
                [-66.8925, 10.4820], [-66.8885, 10.4820], [-66.8885, 10.4790], [-66.8925, 10.4790]
            ]),
            "center_lat": 10.4805,
            "center_lng": -66.8905
        }
    ]

    for z in zones_data:
        cursor.execute("""
        INSERT OR REPLACE INTO zones (id, name, code, area_type, description, polygon_geojson, center_lat, center_lng)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (z["id"], z["name"], z["code"], z["area_type"], z["description"], z["polygon_geojson"], z["center_lat"], z["center_lng"]))

if __name__ == "__main__":
    init_db()
    print("Base de datos inicializada correctamente.")

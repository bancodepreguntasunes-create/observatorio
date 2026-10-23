"""
Database connection and initialization module for Observatorio de Paz API.
Uses SQLite in-memory database with singleton pattern for Vercel Serverless Functions.
"""

import sqlite3
from typing import Optional

_db: Optional[sqlite3.Connection] = None


def init_db(conn: Optional[sqlite3.Connection] = None) -> sqlite3.Connection:
    """
    Creates the 'surveys' table with all required fields if it does not exist.
    """
    global _db
    if conn is None:
        if _db is None:
            _db = sqlite3.connect(":memory:", check_same_thread=False)
            _db.row_factory = sqlite3.Row
        conn = _db

    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS surveys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        consentimiento INTEGER DEFAULT 1,
        rol TEXT NOT NULL,
        genero TEXT NOT NULL,
        edad TEXT NOT NULL,
        turno TEXT NOT NULL,
        facultad TEXT NOT NULL,
        conflictos_verbales INTEGER,
        agresiones_fisicas INTEGER,
        respeto_espacios INTEGER,
        trato_cordial INTEGER,
        canales_dialogo INTEGER,
        seguridad_opiniones INTEGER,
        discriminacion_ideologica INTEGER,
        clima_asambleas INTEGER,
        temor_represalias INTEGER,
        percepcion_seguridad INTEGER,
        victimizacion INTEGER DEFAULT 0,
        iluminacion_nocturna INTEGER,
        zonas_criticas TEXT,
        factores_riesgo TEXT,
        propuestas TEXT,
        modo_brigada INTEGER DEFAULT 0
    )
    """)
    conn.commit()
    return conn


def get_db_connection() -> sqlite3.Connection:
    """
    Returns the singleton SQLite in-memory database connection,
    initializing the schema if needed.
    """
    global _db
    if _db is None:
        _db = sqlite3.connect(":memory:", check_same_thread=False)
        _db.row_factory = sqlite3.Row
        init_db(_db)
    return _db


def get_db_and_seed() -> sqlite3.Connection:
    """
    Ensures DB is initialized and automatically seeds sample data if table is empty.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM surveys")
    count = cursor.fetchone()[0]

    if count == 0:
        try:
            from .seed_data import generate_sample_surveys
        except ImportError:
            try:
                from _shared.seed_data import generate_sample_surveys
            except ImportError:
                from seed_data import generate_sample_surveys

        generate_sample_surveys(conn, target_count=450, scenario="realistic_pilot")

    return conn


def reset_db(conn: Optional[sqlite3.Connection] = None) -> sqlite3.Connection:
    """
    Drops and recreates the surveys table.
    """
    global _db
    if conn is None:
        conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS surveys")
    conn.commit()
    init_db(conn)
    return conn

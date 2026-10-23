"""
Realistic sample data generator for Observatorio de Paz y Convivencia Democrática Universitaria.
Generates seed data reflecting the Caracas Pilot campus demographics and indicators.
"""

import random
import json
from datetime import datetime, timedelta
from typing import Optional
import sqlite3

FACTORES_DISPONIBLES = [
    "Iluminación deficiente",
    "Zonas aisladas",
    "Accesos no vigilados",
    "Aglomeraciones",
    "Infraestructura deteriorada",
    "Falta de cámaras",
    "Ausencia de vigilancia",
]

FACTOR_WEIGHTS = [0.26, 0.20, 0.16, 0.10, 0.11, 0.10, 0.07]

FACULTADES = [
    "Ingeniería",
    "Derecho",
    "Medicina",
    "Ciencias Económicas",
    "Humanidades",
    "Ciencias",
    "Arquitectura",
    "Odontología",
]

FACULTAD_WEIGHTS = [0.20, 0.15, 0.16, 0.16, 0.12, 0.09, 0.06, 0.06]

CUADRANTES_CONFIG = [
    ("C1", 1.0),
    ("C2", 1.0),
    ("C3", 2.8),  # Higher probability
    ("C4", 1.0),
    ("C5", 2.4),  # Higher probability
    ("C6", 1.2),
    ("C7", 2.2),  # Higher probability
    ("C8", 1.0),
]

PROPUESTAS_EJEMPLOS = [
    "Instalar mayor iluminación LED en pasillos exteriores y áreas de estacionamiento.",
    "Aumentar los recorridos preventivos del personal de seguridad en horario nocturno.",
    "Implementar cámaras de seguridad conectadas a un centro de monitoreo central.",
    "Reactivar y regular las rutas del transporte universitario interno con horarios fijos.",
    "Reparar los cerramientos perimetrales y controlar el acceso en las puertas principales.",
    "Fomentar mesas de diálogo estudiantil y canales anónimos para denunciar acoso.",
    "Promover brigadas comunitarias de acompañamiento hacia las estaciones de transporte público.",
    "Mejorar el mantenimiento y limpieza en los baños y áreas comunes de las facultades.",
    "Realizar podas preventivas en árboles que bloquean las luminarias y pasillos.",
    "Establecer protocolos de actuación rápida ante incidentes de violencia o inseguridad.",
    "Garantizar condiciones de debate plural y libre de represalias en asambleas.",
]


def _weighted_sample_no_replacement(pool, weights, k):
    """Samples k items from pool without replacement using weights."""
    current_pool = list(pool)
    current_weights = list(weights)
    selected = []
    for _ in range(min(k, len(current_pool))):
        choice = random.choices(current_pool, weights=current_weights)[0]
        idx = current_pool.index(choice)
        selected.append(choice)
        current_pool.pop(idx)
        current_weights.pop(idx)
    return selected


def generate_sample_surveys(
    conn: sqlite3.Connection,
    target_count: int = 450,
    scenario: str = "realistic_pilot",
) -> int:
    """
    Generates realistic survey data for the Caracas pilot and inserts it into SQLite.

    Distribution:
    - 80% Estudiante (360), 10% Docente (45), 7% Administrativo (32), 3% Obrero (13) for 450 target.
    - Gender parity ~50/50
    - Ages weighted by role
    - Shifts: 60% Diurno, 30% Nocturno, 10% Fines de semana
    - Likert scales: realistic distributions
    - Percepcion seguridad: normal distribution around 5.8
    - Victimizacion: ~15% yes
    - Zonas criticas: random 1-3 from C1-C8 with C3, C5, C7 having higher probability
    - Factores riesgo: realistic subset
    - Propuestas: Spanish proposals, some empty
    - Modo brigada: ~20% true
    - Temor represalias: only for students
    """
    cursor = conn.cursor()

    if target_count == 450:
        role_plan = (
            ["Estudiante"] * 360
            + ["Docente"] * 45
            + ["Administrativo"] * 32
            + ["Obrero"] * 13
        )
    else:
        c_est = int(round(target_count * 0.80))
        c_doc = int(round(target_count * 0.10))
        c_adm = int(round(target_count * 0.07))
        c_obr = target_count - (c_est + c_doc + c_adm)
        role_plan = (
            ["Estudiante"] * c_est
            + ["Docente"] * c_doc
            + ["Administrativo"] * c_adm
            + ["Obrero"] * max(0, c_obr)
        )

    random.shuffle(role_plan)

    now = datetime.now()
    records = []

    for rol in role_plan:
        # Genero (~50/50 parity)
        genero = random.choices(
            ["Masculino", "Femenino", "No binario", "Prefiero no decir"],
            weights=[0.49, 0.49, 0.01, 0.01],
        )[0]

        # Edad ponderada según rol
        if rol == "Estudiante":
            edad = random.choices(["18-24", "25-34", "35-44"], weights=[0.85, 0.12, 0.03])[0]
        elif rol == "Docente":
            edad = random.choices(["25-34", "35-44", "45-54", "55+"], weights=[0.08, 0.36, 0.36, 0.20])[0]
        elif rol == "Administrativo":
            edad = random.choices(["18-24", "25-34", "35-44", "45-54", "55+"], weights=[0.05, 0.32, 0.35, 0.20, 0.08])[0]
        else:  # Obrero
            edad = random.choices(["18-24", "25-34", "35-44", "45-54", "55+"], weights=[0.04, 0.26, 0.36, 0.24, 0.10])[0]

        # Turno (60% Diurno, 30% Nocturno, 10% Fines de semana)
        turno = random.choices(
            ["Diurno", "Nocturno", "Fines de semana"],
            weights=[0.60, 0.30, 0.10],
        )[0]

        # Facultad
        facultad = random.choices(FACULTADES, weights=FACULTAD_WEIGHTS)[0]

        # Escalas Likert (1-5)
        conflictos_verbales = random.choices([1, 2, 3, 4, 5], weights=[0.16, 0.38, 0.28, 0.13, 0.05])[0]
        agresiones_fisicas = random.choices([1, 2, 3, 4, 5], weights=[0.58, 0.24, 0.11, 0.05, 0.02])[0]
        respeto_espacios = random.choices([1, 2, 3, 4, 5], weights=[0.07, 0.20, 0.38, 0.25, 0.10])[0]
        trato_cordial = random.choices([1, 2, 3, 4, 5], weights=[0.05, 0.18, 0.42, 0.25, 0.10])[0]
        canales_dialogo = random.choices([1, 2, 3, 4, 5], weights=[0.15, 0.30, 0.35, 0.15, 0.05])[0]
        seguridad_opiniones = random.choices([1, 2, 3, 4, 5], weights=[0.08, 0.22, 0.36, 0.24, 0.10])[0]
        discriminacion_ideologica = random.choices([1, 2, 3, 4, 5], weights=[0.24, 0.36, 0.22, 0.12, 0.06])[0]
        clima_asambleas = random.choices([1, 2, 3, 4, 5], weights=[0.18, 0.32, 0.32, 0.13, 0.05])[0]

        # Temor a represalias (solo estudiantes)
        if rol == "Estudiante":
            temor_represalias = random.choices([1, 2, 3, 4, 5], weights=[0.26, 0.34, 0.22, 0.11, 0.07])[0]
        else:
            temor_represalias = None

        # Percepción de seguridad (1-10 normal alrededor de 5.8)
        raw_seguridad = int(round(random.gauss(5.8, 1.6)))
        percepcion_seguridad = max(1, min(10, raw_seguridad))

        # Victimización (~15%)
        victimizacion = 1 if random.random() < 0.15 else 0

        # Iluminación nocturna (1-5)
        iluminacion_nocturna = random.choices([1, 2, 3, 4, 5], weights=[0.24, 0.36, 0.26, 0.10, 0.04])[0]

        # Zonas críticas (1 a 3 cuadrantes, C3, C5, C7 mayor peso)
        num_zonas = random.randint(1, 3)
        c_names = [c[0] for c in CUADRANTES_CONFIG]
        c_weights = [c[1] for c in CUADRANTES_CONFIG]
        zonas_seleccionadas = _weighted_sample_no_replacement(c_names, c_weights, num_zonas)
        zonas_seleccionadas.sort()
        zonas_criticas_json = json.dumps(zonas_seleccionadas)

        # Factores de riesgo
        num_factores = random.randint(1, 3)
        factores_sel = _weighted_sample_no_replacement(FACTORES_DISPONIBLES, FACTOR_WEIGHTS, num_factores)
        factores_riesgo_json = json.dumps(factores_sel)

        # Propuestas (~45% con propuesta)
        if random.random() < 0.45:
            propuestas = random.choice(PROPUESTAS_EJEMPLOS)
        else:
            propuestas = ""

        # Modo brigada (~20% true)
        modo_brigada = 1 if random.random() < 0.20 else 0

        # Timestamp en los últimos 30 días
        delta_days = random.uniform(0, 30)
        ts = (now - timedelta(days=delta_days)).strftime("%Y-%m-%d %H:%M:%S")

        records.append((
            ts,
            1,  # consentimiento
            rol,
            genero,
            edad,
            turno,
            facultad,
            conflictos_verbales,
            agresiones_fisicas,
            respeto_espacios,
            trato_cordial,
            canales_dialogo,
            seguridad_opiniones,
            discriminacion_ideologica,
            clima_asambleas,
            temor_represalias,
            percepcion_seguridad,
            victimizacion,
            iluminacion_nocturna,
            zonas_criticas_json,
            factores_riesgo_json,
            propuestas,
            modo_brigada,
        ))

    cursor.executemany("""
    INSERT INTO surveys (
        timestamp, consentimiento, rol, genero, edad, turno, facultad,
        conflictos_verbales, agresiones_fisicas, respeto_espacios,
        trato_cordial, canales_dialogo, seguridad_opiniones,
        discriminacion_ideologica, clima_asambleas, temor_represalias,
        percepcion_seguridad, victimizacion, iluminacion_nocturna,
        zonas_criticas, factores_riesgo, propuestas, modo_brigada
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, records)

    conn.commit()
    return len(records)

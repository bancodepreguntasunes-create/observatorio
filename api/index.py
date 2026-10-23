"""
Main FastAPI application for Observatorio de Paz y Convivencia Democrática Universitaria.
Configured for deployment as Vercel Serverless Functions.
"""

import sys
import os
import io
import csv
import json
import sqlite3
from typing import Optional

# Import shared modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _shared.database import get_db_and_seed, get_db_connection, init_db, reset_db
from _shared.models import SurveyCreate, SurveyResponse
from _shared.seed_data import generate_sample_surveys

from fastapi import FastAPI, APIRouter, Query, Request, Response
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Observatorio de Paz API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter()

QUADRANT_INFO = {
    "C1": "Zona Rectorado",
    "C2": "Facultad de Ingeniería",
    "C3": "Estacionamientos",
    "C4": "Biblioteca Central",
    "C5": "Comedor Universitario",
    "C6": "Canchas Deportivas",
    "C7": "Residencias",
    "C8": "Jardín Botánico",
}


@router.get("/health")
def health_check():
    """
    Health check endpoint.
    Ensures database is initialized and auto-seeded if empty, returns survey count.
    """
    try:
        conn = get_db_and_seed()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM surveys")
        count = cursor.fetchone()[0]
        return {"status": "ok", "surveys_count": count}
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "error": str(e)})


@router.post("/submit", status_code=201)
def submit_survey(survey: SurveyCreate):
    """
    Accepts SurveyCreate JSON payload, validates fields, and inserts into DB.
    Converts list fields to JSON strings.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        zonas_json = json.dumps(survey.zonas_criticas)
        factores_json = json.dumps(survey.factores_riesgo)
        temor = survey.temor_represalias if survey.rol == "Estudiante" else None
        victim = 1 if survey.victimizacion else 0
        brigada = 1 if survey.modo_brigada else 0

        cursor.execute("""
            INSERT INTO surveys (
                consentimiento, rol, genero, edad, turno, facultad,
                conflictos_verbales, agresiones_fisicas, respeto_espacios,
                trato_cordial, canales_dialogo, seguridad_opiniones,
                discriminacion_ideologica, clima_asambleas, temor_represalias,
                percepcion_seguridad, victimizacion, iluminacion_nocturna,
                zonas_criticas, factores_riesgo, propuestas, modo_brigada
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            survey.consentimiento,
            survey.rol,
            survey.genero,
            survey.edad,
            survey.turno,
            survey.facultad,
            survey.conflictos_verbales,
            survey.agresiones_fisicas,
            survey.respeto_espacios,
            survey.trato_cordial,
            survey.canales_dialogo,
            survey.seguridad_opiniones,
            survey.discriminacion_ideologica,
            survey.clima_asambleas,
            temor,
            survey.percepcion_seguridad,
            victim,
            survey.iluminacion_nocturna,
            zonas_json,
            factores_json,
            survey.propuestas or "",
            brigada,
        ))
        conn.commit()
        return {"success": True, "id": cursor.lastrowid}
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})


@router.get("/surveys")
def get_surveys(
    rol: Optional[str] = None,
    turno: Optional[str] = None,
    genero: Optional[str] = None,
):
    """
    Returns list of surveys filtered by rol, turno, and/or genero.
    Unpacks JSON array strings back to Python lists.
    """
    try:
        conn = get_db_and_seed()
        cursor = conn.cursor()

        query = "SELECT * FROM surveys WHERE 1=1"
        params = []
        if rol:
            query += " AND rol = ?"
            params.append(rol)
        if turno:
            query += " AND turno = ?"
            params.append(turno)
        if genero:
            query += " AND genero = ?"
            params.append(genero)

        query += " ORDER BY id DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()

        results = []
        for row in rows:
            d = dict(row)
            for json_field in ("zonas_criticas", "factores_riesgo"):
                val = d.get(json_field)
                if isinstance(val, str):
                    try:
                        d[json_field] = json.loads(val)
                    except Exception:
                        d[json_field] = []
                elif not isinstance(val, list):
                    d[json_field] = []
            results.append(d)

        return results
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.get("/stats")
def get_stats():
    """
    Calculates and returns comprehensive diagnostic statistics:
    - Quota tracking
    - Macro-indicators (Índice de Paz, Tolerancia Ideológica, Percepción Promedio, Victimización)
    - Demographics
    - Top problem factors
    """
    try:
        conn = get_db_and_seed()
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM surveys")
        total = cursor.fetchone()[0]

        if total == 0:
            return {
                "total": 0,
                "quotas": {
                    "estudiantes": {"current": 0, "target": 400, "percentage": 0.0},
                    "docentes": {"current": 0, "target": 50, "percentage": 0.0},
                    "administrativos": {"current": 0, "target": 35, "percentage": 0.0},
                    "obreros": {"current": 0, "target": 15, "percentage": 0.0},
                    "nocturno": {"current": 0, "target": 160, "percentage": 0.0},
                    "genero_m": {"current": 0, "percentage": 0.0},
                    "genero_f": {"current": 0, "percentage": 0.0},
                },
                "macro_indicators": {
                    "indice_paz": 0.0,
                    "tolerancia_ideologica": 0.0,
                    "percepcion_seguridad_promedio": 0.0,
                    "tasa_victimizacion": 0.0,
                },
                "demographics": {
                    "by_role": {},
                    "by_gender": {},
                    "by_age": {},
                    "by_shift": {},
                    "by_faculty": {},
                },
                "top_problems": [],
            }

        # Demographics counts by role
        cursor.execute("SELECT rol, COUNT(*) FROM surveys GROUP BY rol")
        roles_dict = {row[0]: row[1] for row in cursor.fetchall()}
        c_est = roles_dict.get("Estudiante", 0)
        c_doc = roles_dict.get("Docente", 0)
        c_adm = roles_dict.get("Administrativo", 0)
        c_obr = roles_dict.get("Obrero", 0)

        # Nocturnal & weekend count
        cursor.execute("SELECT COUNT(*) FROM surveys WHERE turno IN ('Nocturno', 'Fines de semana')")
        c_noc = cursor.fetchone()[0]

        # Gender counts
        cursor.execute("SELECT genero, COUNT(*) FROM surveys GROUP BY genero")
        gen_dict = {row[0]: row[1] for row in cursor.fetchall()}
        c_gen_m = gen_dict.get("Masculino", 0)
        c_gen_f = gen_dict.get("Femenino", 0)

        quotas = {
            "estudiantes": {
                "current": c_est,
                "target": 400,
                "percentage": round((c_est / 400) * 100, 1),
            },
            "docentes": {
                "current": c_doc,
                "target": 50,
                "percentage": round((c_doc / 50) * 100, 1),
            },
            "administrativos": {
                "current": c_adm,
                "target": 35,
                "percentage": round((c_adm / 35) * 100, 1),
            },
            "obreros": {
                "current": c_obr,
                "target": 15,
                "percentage": round((c_obr / 15) * 100, 1),
            },
            "nocturno": {
                "current": c_noc,
                "target": 160,
                "percentage": round((c_noc / 160) * 100, 1),
            },
            "genero_m": {
                "current": c_gen_m,
                "percentage": round((c_gen_m / total) * 100, 1),
            },
            "genero_f": {
                "current": c_gen_f,
                "percentage": round((c_gen_f / total) * 100, 1),
            },
        }

        # Macro indicators averages
        cursor.execute("""
            SELECT 
                AVG(conflictos_verbales),
                AVG(agresiones_fisicas),
                AVG(seguridad_opiniones),
                AVG(discriminacion_ideologica),
                AVG(clima_asambleas),
                AVG(percepcion_seguridad),
                SUM(CASE WHEN victimizacion = 1 THEN 1 ELSE 0 END)
            FROM surveys
        """)
        row = cursor.fetchone()
        avg_conf_verb = row[0] if row[0] is not None else 1.0
        avg_agr_fis = row[1] if row[1] is not None else 1.0
        avg_seg_opin = row[2] if row[2] is not None else 3.0
        avg_disc_ideo = row[3] if row[3] is not None else 1.0
        avg_clima_asamb = row[4] if row[4] is not None else 3.0
        avg_perc_seg = row[5] if row[5] is not None else 5.0
        sum_victim = row[6] if row[6] is not None else 0

        # Formulas:
        # Índice de Paz (0-100): 100 - ((avg_conflictos_verbales + avg_agresiones_fisicas - 2) / 8 * 100)
        calc_paz = 100.0 - (((avg_conf_verb + avg_agr_fis - 2.0) / 8.0) * 100.0)
        indice_paz = round(max(0.0, min(100.0, calc_paz)), 1)

        # Tolerancia Ideológica (0-100): ((avg_seguridad_opiniones + (6-avg_discriminacion_ideologica) + avg_clima_asambleas - 3) / 12 * 100)
        calc_tol = ((avg_seg_opin + (6.0 - avg_disc_ideo) + avg_clima_asamb - 3.0) / 12.0) * 100.0
        tolerancia_ideologica = round(max(0.0, min(100.0, calc_tol)), 1)

        # Percepción Seguridad Promedio (1-10)
        percepcion_seguridad_promedio = round(float(avg_perc_seg), 1)

        # Tasa Victimización (%)
        tasa_victimizacion = round((sum_victim / total) * 100.0, 1)

        macro_indicators = {
            "indice_paz": indice_paz,
            "tolerancia_ideologica": tolerancia_ideologica,
            "percepcion_seguridad_promedio": percepcion_seguridad_promedio,
            "tasa_victimizacion": tasa_victimizacion,
        }

        # Demographics
        cursor.execute("SELECT edad, COUNT(*) FROM surveys GROUP BY edad")
        by_age = {r[0]: r[1] for r in cursor.fetchall()}

        cursor.execute("SELECT turno, COUNT(*) FROM surveys GROUP BY turno")
        by_shift = {r[0]: r[1] for r in cursor.fetchall()}

        cursor.execute("SELECT facultad, COUNT(*) FROM surveys GROUP BY facultad")
        by_faculty = {r[0]: r[1] for r in cursor.fetchall()}

        demographics = {
            "by_role": roles_dict,
            "by_gender": gen_dict,
            "by_age": by_age,
            "by_shift": by_shift,
            "by_faculty": by_faculty,
        }

        # Top problems
        cursor.execute("SELECT factores_riesgo FROM surveys WHERE factores_riesgo IS NOT NULL AND factores_riesgo != ''")
        factor_counts = {}
        for (fr_str,) in cursor.fetchall():
            try:
                fr_list = json.loads(fr_str)
                if isinstance(fr_list, list):
                    for f in fr_list:
                        f_clean = str(f).strip()
                        if f_clean:
                            factor_counts[f_clean] = factor_counts.get(f_clean, 0) + 1
            except Exception:
                continue

        sorted_factors = sorted(factor_counts.items(), key=lambda x: x[1], reverse=True)
        top_problems = [{"factor": f, "count": c} for f, c in sorted_factors]

        return {
            "total": total,
            "quotas": quotas,
            "macro_indicators": macro_indicators,
            "demographics": demographics,
            "top_problems": top_problems,
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.get("/quadrant_data")
def get_quadrant_data(
    rol: Optional[str] = None,
    turno: Optional[str] = None,
):
    """
    Returns spatial analytics and heat index for quadrants C1-C8.
    Supports filtering by rol and/or turno.
    Heat index formula: freq_norm * 0.40 + severity_norm * 0.25 + victim_norm * 0.20 + lighting_norm * 0.15
    """
    try:
        conn = get_db_and_seed()
        cursor = conn.cursor()

        query = """
            SELECT zonas_criticas, conflictos_verbales, agresiones_fisicas,
                   victimizacion, iluminacion_nocturna, factores_riesgo
            FROM surveys
            WHERE 1=1
        """
        params = []
        if rol:
            query += " AND rol = ?"
            params.append(rol)
        if turno:
            query += " AND turno = ?"
            params.append(turno)

        cursor.execute(query, params)
        rows = cursor.fetchall()

        q_stats = {
            f"C{i}": {
                "reports": 0,
                "severity_sum": 0.0,
                "victim_count": 0,
                "lighting_deficit_sum": 0.0,
                "factors": {},
            }
            for i in range(1, 9)
        }

        for r in rows:
            zonas_raw, c_verb, a_fis, victim, ilum, factores_raw = r

            try:
                zonas = json.loads(zonas_raw) if zonas_raw else []
            except Exception:
                zonas = []
            if not isinstance(zonas, list):
                zonas = []

            try:
                factores = json.loads(factores_raw) if factores_raw else []
            except Exception:
                factores = []
            if not isinstance(factores, list):
                factores = []

            # Severity: 1-5 scale
            s_verb = c_verb if c_verb is not None else 1
            s_fis = a_fis if a_fis is not None else 1
            survey_severity = (s_verb + s_fis) / 2.0

            # Lighting deficit: 1 (worst) -> 100%, 5 (best) -> 0%
            ilum_val = ilum if ilum is not None else 3
            lighting_def = max(0.0, min(100.0, (5.0 - ilum_val) / 4.0 * 100.0))

            is_victim = 1 if victim else 0

            for z in zonas:
                z_upper = str(z).strip().upper()
                if z_upper in q_stats:
                    q_stats[z_upper]["reports"] += 1
                    q_stats[z_upper]["severity_sum"] += survey_severity
                    q_stats[z_upper]["victim_count"] += is_victim
                    q_stats[z_upper]["lighting_deficit_sum"] += lighting_def
                    for f in factores:
                        f_clean = str(f).strip()
                        if f_clean:
                            q_stats[z_upper]["factors"][f_clean] = (
                                q_stats[z_upper]["factors"].get(f_clean, 0) + 1
                            )

        max_reports = max((q_stats[f"C{i}"]["reports"] for i in range(1, 9)), default=1)
        if max_reports == 0:
            max_reports = 1

        result = []
        for i in range(1, 9):
            q_id = f"C{i}"
            st = q_stats[q_id]
            cnt = st["reports"]

            if cnt > 0:
                severity_avg = round(st["severity_sum"] / cnt, 1)
                victim_rate = round((st["victim_count"] / cnt) * 100.0, 1)
                lighting_deficit = round(st["lighting_deficit_sum"] / cnt, 1)

                freq_norm = cnt / max_reports
                severity_norm = max(0.0, min(1.0, (severity_avg - 1.0) / 4.0))
                victim_norm = max(0.0, min(1.0, victim_rate / 100.0))
                lighting_norm = max(0.0, min(1.0, lighting_deficit / 100.0))

                # Heat Index formula
                heat_index = round(
                    freq_norm * 0.40 + severity_norm * 0.25 + victim_norm * 0.20 + lighting_norm * 0.15,
                    2,
                )

                sorted_factors = sorted(st["factors"].items(), key=lambda x: x[1], reverse=True)
                top_factors = [f for f, _ in sorted_factors[:2]]

                if lighting_deficit >= 40.0:
                    recommendation = "Reforzar iluminación táctica y luminarias LED en accesos principales y áreas peatonales."
                elif victim_rate >= 18.0:
                    recommendation = "Incrementar rondas de vigilancia preventiva y establecer puntos de control asistido."
                elif severity_avg >= 2.8:
                    recommendation = "Activar protocolos de mediación comunitaria, canales de alerta temprana y presencia institucional."
                else:
                    recommendation = "Mantener patrullaje preventivo continuo y mantenimiento periódico de infraestructura."
            else:
                severity_avg = 1.0
                victim_rate = 0.0
                lighting_deficit = 0.0
                heat_index = 0.0
                top_factors = []
                recommendation = "Zona sin reportes críticos registrados. Mantener monitoreo preventivo."

            result.append({
                "quadrant": q_id,
                "name": QUADRANT_INFO[q_id],
                "reports": cnt,
                "heat_index": heat_index,
                "severity_avg": severity_avg,
                "victimization_rate": victim_rate,
                "lighting_deficit": lighting_deficit,
                "top_factors": top_factors,
                "recommendation": recommendation,
            })

        return result
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.get("/export_csv")
def export_csv():
    """
    Exports all survey rows as a CSV file with UTF-8 BOM encoding and download headers.
    """
    try:
        conn = get_db_and_seed()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM surveys ORDER BY id ASC")
        rows = cursor.fetchall()

        if rows:
            columns = [col[0] for col in cursor.description]
        else:
            columns = [
                "id", "timestamp", "consentimiento", "rol", "genero", "edad",
                "turno", "facultad", "conflictos_verbales", "agresiones_fisicas",
                "respeto_espacios", "trato_cordial", "canales_dialogo",
                "seguridad_opiniones", "discriminacion_ideologica", "clima_asambleas",
                "temor_represalias", "percepcion_seguridad", "victimizacion",
                "iluminacion_nocturna", "zonas_criticas", "factores_riesgo",
                "propuestas", "modo_brigada",
            ]

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(columns)
        for row in rows:
            writer.writerow([row[c] for c in columns])

        csv_content = "\ufeff" + output.getvalue()
        return Response(
            content=csv_content.encode("utf-8"),
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": "attachment; filename=encuestas_observatorio.csv"},
        )
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.get("/export_json")
def export_json():
    """
    Exports all survey rows as a JSON file array with download headers.
    """
    try:
        conn = get_db_and_seed()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM surveys ORDER BY id ASC")
        rows = cursor.fetchall()

        results = []
        for row in rows:
            d = dict(row)
            for json_field in ("zonas_criticas", "factores_riesgo"):
                val = d.get(json_field)
                if isinstance(val, str):
                    try:
                        d[json_field] = json.loads(val)
                    except Exception:
                        d[json_field] = []
            results.append(d)

        json_bytes = json.dumps(results, ensure_ascii=False, indent=2).encode("utf-8")
        return Response(
            content=json_bytes,
            media_type="application/json; charset=utf-8",
            headers={"Content-Disposition": "attachment; filename=encuestas_observatorio.json"},
        )
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.post("/seed")
def seed_surveys(count: int = Query(default=450)):
    """
    Generates realistic sample surveys.
    """
    try:
        conn = get_db_connection()
        inserted = generate_sample_surveys(conn, target_count=count)
        return {"success": True, "count": inserted}
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})


@router.post("/reset")
def reset_surveys():
    """
    Drops and recreates the surveys table.
    """
    try:
        reset_db()
        return {"success": True}
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})


# Register router with /api prefix as well as root prefix for Vercel rewrite compatibility
app.include_router(router, prefix="/api")
app.include_router(router, prefix="")


@app.options("/{rest_of_path:path}")
def preflight_handler(rest_of_path: str):
    """
    Handles CORS preflight OPTIONS requests across all routes.
    """
    return JSONResponse(
        status_code=200,
        content={"status": "ok"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
            "Access-Control-Allow-Headers": "*",
        },
    )

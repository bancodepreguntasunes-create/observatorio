import json
from typing import Dict, Any, List

def calculate_quota_status(surveys: List[Dict[str, Any]], quotas_config: Dict[str, int]) -> Dict[str, Any]:
    """
    Calcula el estado del Dashboard de Cuotas (Muestreo Aleatorio Estratificado con Cuotas)
    conforme a la Parte II del Documento del Observatorio.
    """
    total_surveys = len(surveys)
    
    # Conteo por rol
    roles_count = {
        "estudiante": 0,
        "docente": 0,
        "administrativo": 0,
        "obrero": 0,
        "directivo": 0
    }
    
    # Conteo por turno en estudiantes
    student_shifts = {
        "manana_tarde": 0,
        "noche_fines": 0
    }
    
    # Conteo de género
    genders = {
        "femenino": 0,
        "masculino": 0,
        "otro": 0,
        "no_dice": 0
    }

    for s in surveys:
        # Rol
        r_raw = s["role"].strip().lower()
        if "estud" in r_raw:
            roles_count["estudiante"] += 1
            sh_raw = s["shift"].strip().lower()
            if "noche" in sh_raw or "fin" in sh_raw:
                student_shifts["noche_fines"] += 1
            else:
                student_shifts["manana_tarde"] += 1
        elif "docent" in r_raw:
            roles_count["docente"] += 1
        elif "admin" in r_raw:
            roles_count["administrativo"] += 1
        elif "obrer" in r_raw:
            roles_count["obrero"] += 1
        else:
            roles_count["directivo"] += 1

        # Género
        g_raw = s["gender"].strip().lower()
        if "fem" in g_raw:
            genders["femenino"] += 1
        elif "masc" in g_raw:
            genders["masculino"] += 1
        elif "prefiero" in g_raw:
            genders["no_dice"] += 1
        else:
            genders["otro"] += 1

    def get_traffic_light(actual: int, target: int):
        pct = (actual / target * 100) if target > 0 else 0
        if pct >= 100:
            status = "GREEN"
            color = "#10b981"
            label = "Cuota Cumplida"
        elif pct >= 65:
            status = "YELLOW"
            color = "#f59e0b"
            label = "Avance Moderado"
        else:
            status = "RED"
            color = "#ef4444"
            label = "Déficit Crítico"
        return {
            "actual": actual,
            "target": target,
            "pct": round(pct, 1),
            "status": status,
            "color": color,
            "label": label
        }

    # Cuotas objetivos configuradas
    target_total = quotas_config.get("target_total", 500)
    target_estudiantes = quotas_config.get("quota_estudiantes", 400)
    target_docentes = quotas_config.get("quota_docentes", 50)
    target_administrativos = quotas_config.get("quota_administrativos", 35)
    target_obreros = quotas_config.get("quota_obreros", 15)
    target_noche_fines = quotas_config.get("quota_noche_fines", 160)
    target_manana_tarde = quotas_config.get("quota_manana_tarde", 240)

    # Generación de Alertas Tácticas para el Coordinador de Campo
    tactical_alerts = []
    
    if roles_count["obrero"] < target_obreros * 0.7:
        tactical_alerts.append({
            "level": "CRITICAL",
            "team": "Brigada A (Mantenimiento)",
            "message": f"Déficit crítico en Personal Obrero ({roles_count['obrero']}/{target_obreros}). Desplegar voluntarios con instrumentos impresos hacia talleres, almacenes y áreas de jardinería."
        })
    
    if student_shifts["noche_fines"] < target_noche_fines * 0.7:
        tactical_alerts.append({
            "level": "WARNING",
            "team": "Brigada B (Turno Nocturno)",
            "message": f"Déficit en Turno Noche ({student_shifts['noche_fines']}/{target_noche_fines}). Activar cuadrillas entre las 18:00 y 20:00 en cafetines, paradas y accesos norte."
        })
        
    if roles_count["administrativo"] < target_administrativos * 0.7:
        tactical_alerts.append({
            "level": "NOTICE",
            "team": "Brigada C (Administración)",
            "message": f"Avance lento en Personal Administrativo ({roles_count['administrativo']}/{target_administrativos}). Coordinar abordaje en Dirección de Recursos Humanos y Control de Estudios."
        })

    is_all_green = (
        roles_count["estudiante"] >= target_estudiantes and
        roles_count["docente"] >= target_docentes and
        roles_count["administrativo"] >= target_administrativos and
        roles_count["obrero"] >= target_obreros and
        student_shifts["noche_fines"] >= target_noche_fines
    )

    return {
        "total_surveys": total_surveys,
        "target_total": target_total,
        "overall_progress_pct": round(min(100.0, (total_surveys / target_total * 100)), 1) if target_total > 0 else 0,
        "is_sample_ready_for_closure": is_all_green,
        "quotas": {
            "estudiantes": get_traffic_light(roles_count["estudiante"], target_estudiantes),
            "docentes": get_traffic_light(roles_count["docente"], target_docentes),
            "administrativos": get_traffic_light(roles_count["administrativo"], target_administrativos),
            "obreros": get_traffic_light(roles_count["obrero"], target_obreros),
            "estudiantes_noche": get_traffic_light(student_shifts["noche_fines"], target_noche_fines),
            "estudiantes_diurno": get_traffic_light(student_shifts["manana_tarde"], target_manana_tarde)
        },
        "gender_balance": {
            "counts": genders,
            "pct_female": round((genders["femenino"] / total_surveys * 100), 1) if total_surveys else 0,
            "pct_male": round((genders["masculino"] / total_surveys * 100), 1) if total_surveys else 0
        },
        "tactical_alerts": tactical_alerts
    }

def calculate_zone_heat_levels(zones: List[Dict[str, Any]], surveys: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Algoritmo Matemático de Nivel de Calor (Heat Index) por Cuadrante.
    Calcula el gradiente térmico de cada zona del campus en una escala 0-100:
    - 0-25: Azul (Tranquilidad / Zona de Convivencia Positiva)
    - 26-50: Verde (Riesgo Leve / Estable)
    - 51-70: Amarillo (Atención / Tensión Moderada)
    - 71-85: Naranja (Riesgo Elevado / Foco de Inseguridad)
    - 86-100: Rojo (Alerta Crítica / Requiere Intervención Institucional Inmediata)
    """
    total_surveys = len(surveys)
    if total_surveys == 0:
        # Retorno en estado base neutral/azul
        results = []
        for z in zones:
            results.append({
                **z,
                "reports_count": 0,
                "heat_index": 10.0,
                "heat_category": "Tranquilidad",
                "heat_color": "#2563eb",
                "risk_factors": {},
                "victim_ratio": 0.0,
                "night_risk_ratio": 0.0
            })
        return results

    # Pesos ponderados para motivos de inseguridad
    reason_weights = {
        "hurtos": 1.0,
        "robos": 1.0,
        "delito": 1.0,
        "falta de patrullaje": 0.85,
        "seguridad": 0.85,
        "roces": 0.80,
        "conflictos": 0.80,
        "ajenas": 0.75,
        "aislada": 0.70,
        "solitaria": 0.70,
        "iluminación": 0.65
    }

    zone_metrics = {z["id"]: {
        "count": 0,
        "victims_count": 0,
        "night_poor_light": 0,
        "reason_hits": {},
        "weighted_severity_sum": 0.0
    } for z in zones}

    for s in surveys:
        try:
            sel = json.loads(s["selected_zones"]) if isinstance(s["selected_zones"], str) else s["selected_zones"]
        except Exception:
            sel = []

        try:
            reasons = json.loads(s["zone_reasons"]) if isinstance(s["zone_reasons"], str) else s["zone_reasons"]
        except Exception:
            reasons = []

        is_victim = (str(s["crime_victim"]).strip().lower() in ["si", "sí", "true", "1"])
        bad_light = (str(s["night_lighting"]).strip().lower() in ["deficiente", "pesima", "pésima"])

        for zid in sel:
            if zid in zone_metrics:
                zone_metrics[zid]["count"] += 1
                if is_victim:
                    zone_metrics[zid]["victims_count"] += 1
                if bad_light:
                    zone_metrics[zid]["night_poor_light"] += 1
                
                # Severidad de motivos
                for r in reasons:
                    r_clean = r.lower()
                    zone_metrics[zid]["reason_hits"][r] = zone_metrics[zid]["reason_hits"].get(r, 0) + 1
                    
                    matched_weight = 0.5
                    for k, w in reason_weights.items():
                        if k in r_clean:
                            matched_weight = max(matched_weight, w)
                    zone_metrics[zid]["weighted_severity_sum"] += matched_weight

    results = []
    # Encontrar el valor máximo de menciones para normalización
    max_mentions = max([m["count"] for m in zone_metrics.values()] + [1])

    for z in zones:
        zid = z["id"]
        m = zone_metrics[zid]
        count = m["count"]

        # Componente 1: Frecuencia de selección normalizada (peso 40%)
        # Tasa de mención relativa sobre el total de respuestas posibles
        mention_freq = count / total_surveys
        comp_freq = min(1.0, (count / max(10, max_mentions))) * 40.0

        # Componente 2: Severidad de los motivos señalados (peso 25%)
        avg_severity = (m["weighted_severity_sum"] / count) if count > 0 else 0.0
        comp_severity = (avg_severity / 1.0) * 25.0

        # Componente 3: Tasa de victimización real de quienes reportaron la zona (peso 20%)
        victim_ratio = (m["victims_count"] / count) if count > 0 else 0.0
        comp_victim = victim_ratio * 20.0

        # Componente 4: Vulnerabilidad lumínica y nocturna (peso 15%)
        light_ratio = (m["night_poor_light"] / count) if count > 0 else 0.0
        comp_light = light_ratio * 15.0

        raw_index = comp_freq + comp_severity + comp_victim + comp_light
        # Escalar a 5 - 100 para visualización armónica
        heat_index = round(min(100.0, max(5.0, raw_index)), 1)

        # Categorización cromática
        if heat_index >= 80:
            category = "Alerta Crítica (Tensión Máxima)"
            color = "#ef4444" # Rojo
        elif heat_index >= 65:
            category = "Riesgo Elevado (Tensión Alta)"
            color = "#f97316" # Naranja
        elif heat_index >= 45:
            category = "Atención Preventiva (Tensión Media)"
            color = "#eab308" # Amarillo
        elif heat_index >= 25:
            category = "Riesgo Bajo (Estable)"
            color = "#10b981" # Verde
        else:
            category = "Tranquilidad (Convivencia Armónica)"
            color = "#2563eb" # Azul

        results.append({
            "id": z["id"],
            "name": z["name"],
            "code": z["code"],
            "area_type": z["area_type"],
            "description": z["description"],
            "center_lat": z["center_lat"],
            "center_lng": z["center_lng"],
            "polygon_geojson": json.loads(z["polygon_geojson"]) if isinstance(z["polygon_geojson"], str) else z["polygon_geojson"],
            "reports_count": count,
            "mention_percentage": round(mention_freq * 100, 1),
            "heat_index": heat_index,
            "heat_category": category,
            "heat_color": color,
            "victim_ratio": round(victim_ratio * 100, 1),
            "poor_light_ratio": round(light_ratio * 100, 1),
            "top_reasons": sorted(m["reason_hits"].items(), key=lambda x: x[1], reverse=True)[:4]
        })

    return results

def calculate_global_observatory_kpis(surveys: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calcula indicadores globales cuantitativos del Observatorio para el informe directivo"""
    n = len(surveys)
    if n == 0:
        return {
            "total_surveys": 0,
            "peace_index": 0,
            "tolerance_index": 0,
            "avg_safety_score": 0,
            "victimization_rate": 0,
            "institutional_channel_trust": 0,
            "academic_freedom_fear_rate": 0
        }

    # 1. Índice de Paz y Convivencia (0 a 100)
    # Menor agresión verbal y física + mayor respeto y trato cordial = mayor paz
    peace_scores = []
    for s in surveys:
        # Invertir escalas de agresión (1 es bueno, 5 es malo)
        verbal_inv = 6 - s["verbal_conflicts"]
        phys_inv = 6 - s["physical_aggressions"]
        respect = s["respect_common_spaces"]
        cordial = s["cordial_treatment"]
        # Promedio sobre 5 escalado a 100
        score = ((verbal_inv + phys_inv + respect + cordial) / 20.0) * 100
        peace_scores.append(score)
    peace_index = round(sum(peace_scores) / n, 1)

    # 2. Percepción de Seguridad (1-10)
    avg_safety = round(sum(s["safety_score"] for s in surveys) / n, 2)

    # 3. Tasa de Victimización (% Sí)
    victims_count = sum(1 for s in surveys if str(s["crime_victim"]).strip().lower() in ["si", "sí", "true", "1"])
    victimization_rate = round((victims_count / n) * 100, 1)

    # 4. Confianza en Canales Pacíficos Institucionales
    trust_channels_count = sum(1 for s in surveys if str(s["peaceful_channels"]).strip().lower() in ["si", "sí"])
    channel_trust_rate = round((trust_channels_count / n) * 100, 1)

    # 5. Tolerancia e Ideología
    safe_opining_count = sum(1 for s in surveys if "totalmente seguro" in str(s["safe_expressing_opinions"]).lower() or "medianamente" in str(s["safe_expressing_opinions"]).lower())
    tolerance_index = round((safe_opining_count / n) * 100, 1)

    # 6. Temor a represalias académicas en estudiantes (Pregunta condicional 3.3)
    student_surveys = [s for s in surveys if "estud" in str(s["role"]).lower()]
    student_fears = sum(1 for s in student_surveys if str(s["grades_affected_divergence"]).strip().lower() in ["si", "sí"])
    fear_rate = round((student_fears / len(student_surveys) * 100), 1) if student_surveys else 0.0

    return {
        "total_surveys": n,
        "peace_index": peace_index,
        "tolerance_index": tolerance_index,
        "avg_safety_score": avg_safety,
        "victimization_rate": victimization_rate,
        "institutional_channel_trust": channel_trust_rate,
        "student_academic_fear_rate": fear_rate
    }

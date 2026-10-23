import random
import json
from datetime import datetime, timedelta
from app.database import get_db_connection

INSTITUTIONS_BY_TYPE = {
    "Universidades Públicas Nacionales y Experimentales": [
        "Universidad Bolivariana de Venezuela (UBV)",
        "Universidad de los Pueblos del Sur (UNISUR)",
        "Universidad Indígena de Venezuela (UIV)",
        "Universidad Militar Bolivariana de Venezuela (UMBV)",
        "Universidad Nacional Experimental de la Gran Caracas (UNEXCA)",
        "Universidad Nacional Experimental de la Seguridad (UNES)",
        "Universidad Nacional Experimental de Guayana (UNEG)",
        "Universidad Nacional Experimental del Magisterio Samuel Robinson (UNEM)",
        "Universidad Nacional Experimental del Táchira (UNET)",
        "Universidad Nacional Experimental Francisco de Miranda (UNEFM)",
        "Universidad Nacional Experimental de los Llanos Occidentales Ezequiel Zamora (UNELLEZ)",
        "Universidad Nacional Experimental de las Artes (UNEARTE)",
        "Universidad Pedagógica Experimental Libertador (UPEL)",
        "Universidad Nacional Experimental Politécnica Antonio José de Sucre (UNEXPO)",
        "Universidad Nacional Experimental Rafael María Baralt (UNERMB)",
        "Universidad Nacional Experimental de los Llanos Centrales Rómulo Gallegos (UNERG)",
        "Universidad Nacional Experimental Simón Rodríguez (UNESR)",
        "Universidad Nacional Experimental Politécnica de la Fuerza Armada Nacional (UNEFA)",
        "Universidad de las Ciencias de la Salud Hugo Chávez Frías (UCS)",
        "Universidad Deportiva del Sur (UDS)",
        "Universidad Internacional de las Comunicaciones (LAUICOM)",
        "Universidad Nacional Abierta (UNA)",
        "Universidad del Zulia (LUZ)",
        "Universidad de Oriente (UDO)",
        "Universidad de Carabobo (UC)",
        "Universidad Simón Bolívar (USB)",
        "Universidad de Los Andes (ULA)",
        "Universidad Central de Venezuela (UCV)",
        "Universidad Centro Occidental Lisandro Alvarado (UCLA)"
    ],
    "Universidades Politécnicas Territoriales": [
        "UPT de Falcón Alonso Gamero (UPTAG)",
        "UPT del Norte de Monagas Ludovico Silva (UMLS)",
        "UPT del estado Portuguesa Juan de Jesús Montilla (UPJM)",
        "UPT del Oeste de Sucre Clodosbaldo Russián (UPTO)",
        "UPT de Paria Luis Mariano Rivera (UPTP)",
        "UPT del estado Mérida Kléber Ramírez (UPTM)",
        "UPT de Yaracuy Arístides Bastidas (UPTYAB)",
        "UPT José Antonio Anzoátegui (UPTJAA)",
        "UPT del Zulia (UPTZ)",
        "UPT de Maracaibo (UPTMA)",
        "UPT del estado Trujillo Mario Briceño Iragorry (UPTTMBI)",
        "UPT de Puerto Cabello (UPTPC)",
        "Universidad Territorial Deltaica Francisco Tamayo (UTDFT)"
    ],
    "Universidades Privadas": [
        "Universidad Gran Mariscal de Ayacucho (UGMA)",
        "Universidad Alejandro de Humboldt (UAH)",
        "Universidad Alonso de Ojeda (UNIOJEDA)",
        "Universidad Católica Andrés Bello (UCAB)",
        "Universidad Metropolitana (UNIMET)",
        "Universidad Monteávila (UMA)",
        "Universidad Nueva Esparta (UNE)",
        "Universidad Santa María (USM)",
        "Universidad Tecnológica del Centro (UNITEC)",
        "Universidad José María Vargas (UJMV)",
        "Universidad Rafael Urdaneta (URU)",
        "Universidad Rafael Belloso Chacín (URBE)",
        "Universidad Bicentenaria de Aragua (UBA)",
        "Universidad Fermín Toro (UFT)",
        "Universidad de Falcón (UDEFA)",
        "Universidad Católica del Táchira (UCAT)",
        "Universidad Católica Cecilio Acosta",
        "Universidad de Margarita (UNIMAR)",
        "Universidad José Antonio Páez (UJAP)",
        "Universidad Privada Arturo Michelena (UAM)",
        "Universidad Panamericana del Puerto (UNIPAP)",
        "Universidad Santa Inés (USI)",
        "Universidad Valle del Momboy (UVM)",
        "Universidad Yacambú (UNY)",
        "Universidad Tecnológica Sucre"
    ],
    "Institutos Universitarios y Colegios Universitarios (Selección)": [
        "Instituto Universitario Politécnico Santiago Mariño (IUPSM)",
        "Instituto Universitario de Tecnología Industrial (IUTI)",
        "Instituto Universitario de Tecnología Juan Pablo Pérez Alfonso (IUTEPAL)",
        "Instituto Universitario de Tecnología Readic (UNIR)",
        "Instituto Universitario de Tecnología Antonio José de Sucre",
        "Instituto Universitario de Tecnología de Administración Industrial (IUTA)",
        "Instituto Universitario de Tecnología Industrial Rodolfo Loero Arismendi (IUTIRLA)",
        "Instituto Universitario de Mercadotecnia (ISUM)",
        "Instituto Universitario de Nuevas Profesiones (IUNP)",
        "Instituto Universitario de Tecnología Amazonas (IUTAMA)",
        "Instituto Universitario Adventista de Venezuela (IUNAV)",
        "Colegio Universitario Monseñor de Talavera (CUMT)",
        "Instituto Universitario Eclesiástico Santo Tomás de Aquino (IUESTA)",
        "Instituto Universitario de Tecnología de Valencia (IUTVAL)",
        "Instituto Universitario Tecnológico Américo Vespucio (IUTAV)",
        "Instituto Universitario de Tecnología Antonio Ricaurte (IUTAR)",
        "Instituto Universitario de Tecnología para la Informática",
        "Instituto Universitario de Gerencia y Tecnología (IUGT)",
        "Instituto Universitario Jesús Obrero"
    ]
}

ALL_INSTITUTION_TYPES = list(INSTITUTIONS_BY_TYPE.keys())

REASONS_POOL = [
    "Falta de iluminación/soledad de la zona.",
    "Presencia frecuente de personas ajenas a la universidad.",
    "Historial previo de robos o conflictos en esa área.",
    "Falta de patrullaje interno (personal de seguridad).",
    "En esa zona ocurren hurtos frecuentemente.",
    "Es un punto de reunión donde se generan roces o conflictos grupales."
]

PROPOSALS_POOL = [
    "Instalación prioritaria de luminarias LED solares en las caminerías del este y paradas.",
    "Presencia permanente de vigilancia interna en la salida nocturna de las 18:00 a 20:00.",
    "Crear mesas de mediación estudiantil para resolver roces políticos sin violencia.",
    "Cámaras de seguridad en pasillos periféricos y entrada de laboratorios.",
    "Control de acceso digital o con carnet institucional en puertas vehiculares y peatonales.",
    "Fomentar talleres de resolución pacífica de conflictos y cultura democrática en los primeros semestres.",
    "Reparación de cerraduras e iluminación en los baños y pasillos norte.",
    "Reactivar rutas de transporte interno seguro para el turno nocturno.",
    "Establecer una defensoría universitaria autónoma para denuncias sin represalias académicas."
]

def generate_sample_surveys(target_count=450, scenario="realistic_pilot"):
    """
    Genera encuestas realistas simulando el escenario del piloto en Caracas
    con estratificación conforme a las especificaciones del Observatorio.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Si scenario == 'in_progress', generamos un déficit para que el dashboard muestre semáforos rojos realistas
    # Por ejemplo: muchos estudiantes diurnos, pero déficit de obreros y turno noche
    if scenario == "in_progress":
        n_estudiantes = 280
        n_docentes = 35
        n_admin = 20
        n_obreros = 4    # Déficit crítico (< 15)
        n_directivos = 2
    else: # Completo o casi completo (495 a 510)
        n_estudiantes = 405
        n_docentes = 52
        n_admin = 36
        n_obreros = 16
        n_directivos = 5

    population = (
        [("Estudiante", "16-20", "21-25")] * n_estudiantes +
        [("Docente", "26-35", "36-50", "Más de 50")] * n_docentes +
        [("Personal Administrativo", "26-35", "36-50")] * n_admin +
        [("Personal Obrero", "26-35", "36-50", "Más de 50")] * n_obreros +
        [("Personal Directivo/Autoridad", "36-50", "Más de 50")] * n_directivos
    )

    random.shuffle(population)
    base_date = datetime.now() - timedelta(days=20)

    for i, pop_item in enumerate(population):
        role = pop_item[0]
        age_group = random.choice(pop_item[1:])
        cedula_prefix = random.choices(["V", "E"], weights=[0.97, 0.03])[0]
        cedula_num = random.randint(12000000, 32000000)
        cedula = f"{cedula_prefix}-{cedula_num}"
        gender = random.choice(["Femenino", "Masculino"])
        inst_type = random.choices(
            ALL_INSTITUTION_TYPES,
            weights=[0.55, 0.15, 0.20, 0.10]
        )[0]
        inst_name = random.choice(INSTITUTIONS_BY_TYPE[inst_type])
        faculty = inst_name
        
        # Turno
        if scenario == "in_progress" and role == "Estudiante":
            shift = random.choices(["Mañana", "Tarde", "Noche", "Fines de semana", "Mixto"], weights=[0.55, 0.35, 0.05, 0.01, 0.04])[0]
        else:
            shift = random.choices(["Mañana", "Tarde", "Noche", "Fines de semana", "Mixto"], weights=[0.40, 0.25, 0.25, 0.03, 0.07])[0]

        is_field = 1 if role in ["Personal Obrero", "Personal Administrativo"] and random.random() < 0.8 else (1 if random.random() < 0.25 else 0)

        # Respuestas de paz y convivencia (probabilidades realistas universitarias)
        verbal_conflicts = random.choices([1, 2, 3, 4, 5], weights=[0.15, 0.35, 0.30, 0.15, 0.05])[0]
        physical_aggressions = random.choices([1, 2, 3, 4, 5], weights=[0.60, 0.25, 0.10, 0.04, 0.01])[0]
        respect_spaces = random.choices([1, 2, 3, 4, 5], weights=[0.05, 0.20, 0.35, 0.30, 0.10])[0]
        cordial_treatment = random.choices([1, 2, 3, 4, 5], weights=[0.03, 0.12, 0.30, 0.40, 0.15])[0]
        peaceful_channels = random.choices(["Sí", "No", "Desconozco los canales"], weights=[0.38, 0.32, 0.30])[0]

        # Tolerancia
        safe_expressing = random.choices(
            ["Totalmente seguro", "Medianamente seguro", "Inseguro", "Totalmente inseguro", "Prefiero no opinar"],
            weights=[0.25, 0.40, 0.20, 0.08, 0.07]
        )[0]
        ideo_discrim = random.choices(
            ["Sí, he sido víctima", "Sí, he sido testigo", "No, nunca", "Prefiero no responder"],
            weights=[0.08, 0.24, 0.62, 0.06]
        )[0]

        grades_affected = "no_aplica"
        if role == "Estudiante":
            grades_affected = random.choices(["Sí", "No"], weights=[0.28, 0.72])[0]

        dialogue_attitude = random.choices(
            ["Altamente tolerante y dispuesta al diálogo", "Indiferente / Apática", "Intolerante y propensa a la imposición o el conflicto"],
            weights=[0.35, 0.45, 0.20]
        )[0]

        # Percepción de seguridad (menor de noche o en zonas solitarias)
        night_shift = shift in ["Noche", "Fines de semana"]
        if night_shift:
            safety_score = random.randint(2, 6)
            night_light = random.choices(["Excelente", "Buena", "Regular", "Deficiente", "Pésima"], weights=[0.02, 0.10, 0.25, 0.40, 0.23])[0]
        else:
            safety_score = random.randint(4, 8)
            night_light = random.choices(["Excelente", "Buena", "Regular", "Deficiente", "Pésima"], weights=[0.08, 0.28, 0.38, 0.20, 0.06])[0]

        crime_victim = random.choices(["Sí", "No"], weights=[0.22 if night_shift else 0.12, 0.78 if night_shift else 0.88])[0]

        # Selección de Cuadrantes críticos (máximo 3)
        # Zonas con mayor tensión natural: C1 (Estacionamiento), C7 (Jardines botánicos), C4 (Comedor/Talleres), C6 (Canchas)
        zone_weights = {"C1": 0.25, "C7": 0.22, "C4": 0.16, "C6": 0.14, "C3": 0.08, "C2": 0.06, "C5": 0.05, "C8": 0.04}
        num_zones = random.choices([1, 2, 3], weights=[0.3, 0.45, 0.25])[0]
        chosen_zones = random.choices(list(zone_weights.keys()), weights=list(zone_weights.values()), k=num_zones)
        chosen_zones = list(set(chosen_zones))

        # Motivos
        num_reasons = random.randint(1, 3)
        chosen_reasons = random.sample(REASONS_POOL, num_reasons)

        # Propuesta cualitativa
        proposal = random.choice(PROPOSALS_POOL) if random.random() < 0.65 else ""

        # Marca de tiempo realista escalonada
        ts = (base_date + timedelta(hours=i * 0.9, minutes=random.randint(0, 50))).isoformat()

        cursor.execute("""
        INSERT INTO surveys (
            timestamp, is_field_survey, consent,
            cedula, role, gender, age_group, shift, institution_type, institution_name, faculty, campus,
            verbal_conflicts, physical_aggressions, respect_common_spaces, cordial_treatment, peaceful_channels,
            safe_expressing_opinions, ideological_discrimination, grades_affected_divergence, group_dialogue_attitude,
            safety_score, crime_victim, night_lighting, selected_zones, zone_reasons, improvement_suggestion
        ) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            ts, is_field,
            cedula, role, gender, age_group, shift, inst_type, inst_name, faculty, "Campus Central Caracas",
            verbal_conflicts, physical_aggressions, respect_spaces, cordial_treatment, peaceful_channels,
            safe_expressing, ideo_discrim, grades_affected, dialogue_attitude,
            safety_score, crime_victim, night_light, json.dumps(chosen_zones), json.dumps(chosen_reasons), proposal
        ))

    conn.commit()
    conn.close()
    return len(population)

if __name__ == "__main__":
    count = generate_sample_surveys()
    print(f"Insertados {count} registros de muestra exitosamente.")

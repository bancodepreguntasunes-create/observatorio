# DICCIONARIO DE VARIABLES Y ALGORITMO MATEMÁTICO DE CALOR GEOESPACIAL

**Código del Documento:** DOC-MT-02  
**Versión:** 1.0.0 (Piloto Caracas)  
**Clasificación:** Metodología y Modelado Estadístico  

---

## 1. Diccionario de Variables del Instrumento Diagnóstico

| Variable | Nombre en Sistema | Tipo de Dato | Escala / Valores Posibles | Dimensión |
| :--- | :--- | :--- | :--- | :--- |
| Cédula de Identidad | `cedula` | Alfanumérico | V-XXXXXXXX / E-XXXXXXXX (5 a 9 dígitos) | Identificación / Registro |
| Sexo | `gender` | Categórico | Femenino, Masculino | Heterogeneidad |
| Rol Universitario | `role` | Categórico | Estudiante, Docente, Admin., Obrero, Directivo | Heterogeneidad |
| Rango de Edad | `age_group` | Ordinal | 16-20, 21-25, 26-35, 36-50, >50 | Heterogeneidad |
| Turno Habitual | `shift` | Categórico | Mañana, Tarde, Noche, Fines de semana, Mixto | Heterogeneidad |
| Tipo de Institución | `institution_type` | Categórico | Públicas, Politécnicas, Privadas, Institutos | Institucional |
| Institución Universitaria | `institution_name` | Categórico | Nombre oficial de la universidad (86 casas de estudio) | Institucional |
| Conflictos Verbales | `verbal_conflicts` | Ordinal (Likert) | 1 (Nunca) a 5 (Muy frecuentemente) | Convivencia |
| Agresiones Físicas | `physical_aggressions` | Ordinal (Likert) | 1 (Nunca) a 5 (Muy frecuentemente) | Convivencia |
| Cuidado de Espacios | `respect_common_spaces` | Ordinal (Likert) | 1 (Nunca) a 5 (Siempre) | Convivencia |
| Trato Cordial | `cordial_treatment` | Ordinal (Likert) | 1 (Nunca) a 5 (Siempre) | Convivencia |
| Canales Institucionales | `peaceful_channels` | Categórico | Sí, No, Desconozco los canales | Gobernanza |
| Seguridad al Opinar | `safe_expressing_opinions`| Ordinal | Totalmente seguro ... Totalmente inseguro | Pluralismo |
| Discriminación Ideológica | `ideological_discrimination`| Categórico | Víctima, Testigo, Nunca, Prefiero no responder | Pluralismo |
| Afectación en Calificaciones | `grades_affected_divergence`| Dicotómica | Sí, No, No aplica (Condicional: solo Estudiantes) | Pluralismo |
| Percepción de Seguridad | `safety_score` | Numérico | 1 (Muy Inseguro) a 10 (Totalmente Seguro) | Seguridad Subjetiva |
| Victimización Delictiva | `crime_victim` | Dicotómica | Sí, No | Seguridad Objetiva |
| Calidad Iluminación | `night_lighting` | Ordinal | Excelente, Buena, Regular, Deficiente, Pésima | Entorno Físico |
| Cuadrantes Críticos | `selected_zones` | Array GeoJSON | Lista de códigos de cuadrantes (máximo 3) | Cartografía GIS |
| Motivos de Inseguridad | `zone_reasons` | Multivariado | Falta luz, ajenos, robos, patrullaje, roces | Factores de Riesgo |

---

## 2. Modelo Matemático del Algoritmo de "Nivel de Calor" (Heat Index)

El índice de calor de cada cuadrante $z$ del campus ($H_z \in [0, 100]$) se determina a través de una función de ponderación multidimensional que integra cuatro componentes normalizados:

$$H_z = \min\left(100, \; w_1 \cdot C_{\text{frec}, z} + w_2 \cdot C_{\text{severidad}, z} + w_3 \cdot C_{\text{delito}, z} + w_4 \cdot C_{\text{luz}, z}\right)$$

Donde la suma de los ponderadores es unitaria:
$$w_1 = 0.40, \quad w_2 = 0.25, \quad w_3 = 0.20, \quad w_4 = 0.15$$

### Componente 1: Frecuencia Relativa Normalizada ($C_{\text{frec}, z}$)
Mide la proporción de encuestados que señalaron al cuadrante $z$ como área de riesgo en comparación con la zona de mayor reporte del campus:
$$C_{\text{frec}, z} = \left(\frac{n_z}{\max(10, \max_k n_k)}\right) \times 100$$
Donde $n_z$ es el número de veces que el cuadrante $z$ fue seleccionado y $\max_k n_k$ es el máximo de reportes obtenidos por cualquier zona.

### Componente 2: Severidad de Factores de Riesgo ($C_{\text{severidad}, z}$)
Cada motivo señalado posee un coeficiente de gravedad empírica $\beta_m$:
- Historial de robos o hurtos: $\beta = 1.00$
- Ausencia total de vigilancia / patrullaje: $\beta = 0.85$
- Punto de roces o agresiones grupales: $\beta = 0.80$
- Presencia frecuente de personas ajenas: $\beta = 0.75$
- Falta de iluminación o soledad: $\beta = 0.70$

$$C_{\text{severidad}, z} = \left(\frac{1}{n_z} \sum_{i=1}^{n_z} \max_{m \in M_i} \beta_m\right) \times 100$$

### Componente 3: Tasa de Victimización Directa ($C_{\text{delito}, z}$)
Proporción de personas que marcaron la zona y que además reportaron haber sufrido un delito dentro del campus durante el último año:
$$C_{\text{delito}, z} = \left(\frac{n_{\text{víctimas}, z}}{n_z}\right) \times 100$$

### Componente 4: Vulnerabilidad Lumínica Nocturna ($C_{\text{luz}, z}$)
Proporción de encuestados que calificaron la iluminación nocturna como "Deficiente" o "Pésima" en relación a la zona evaluada:
$$C_{\text{luz}, z} = \left(\frac{n_{\text{luz deficiente}, z}}{n_z}\right) \times 100$$

---

## 3. Escala Cromática e Interpretación Operativa

| Rango de Calor ($H_z$) | Color Hex | Categoría Oficial | Protocolo de Acción Recomendado |
| :---: | :---: | :--- | :--- |
| **0.0 - 24.9** | `#2563eb` (Azul) | **Tranquilidad / Convivencia Armónica** | Mantenimiento preventivo regular. |
| **25.0 - 44.9** | `#10b981` (Verde) | **Riesgo Bajo / Estable** | Supervisión ordinaria por rondas. |
| **45.0 - 64.9** | `#eab308` (Amarillo) | **Atención Preventiva / Tensión Moderada** | Fomento de actividades académicas/culturales. |
| **65.0 - 79.9** | `#f97316` (Naranja) | **Riesgo Elevado / Tensión Alta** | Reorientación de vigilancia nocturna (18:00 a 20:30). |
| **80.0 - 100.0** | `#ef4444` (Rojo) | **Alerta Crítica / Tensión Máxima** | Intervención inmediata: alumbrado urgente y mesas de diálogo. |

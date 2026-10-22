# Observatorio de Paz y Convivencia Democrática Universitaria

**Ecosistema Integral de Medición, Cartografía Geoespacial (GIS) y Diagnóstico Institucional**  
*Desarrollo basado en el Proyecto de Observatorio Universitario (Sede Piloto Caracas)*

---

## 🎯 Visión General del Proyecto

El **Observatorio de Paz y Convivencia Democrática Universitaria** es una plataforma tecnológica desarrollada para diagnosticar, espacializar y analizar la convivencia, la paz y la percepción de seguridad en el entorno universitario. Proporciona insumos empíricos de alta fidelidad para sustentar políticas académicas, bienestar institucional y la toma de decisiones gerenciales del Consejo Universitario.

---

## 🚀 Puesta en Marcha Rápida (Windows)

### Opción 1: Ejecución en 1 Clic
Haz doble clic en el archivo:
```
iniciar_observatorio.bat
```

### Opción 2: Ejecución por Terminal (PowerShell / CMD)
```powershell
python run.py
```
El sistema iniciará automáticamente el servidor en `http://127.0.0.1:8000` y abrirá el navegador en el portal.

---

## 🧩 Módulos y Arquitectura Implementada

### 1. Ingesta de Datos y Formulario de Diagnóstico (`/`)
- **Instrumento 1 Completo:**
  - **Sección 0:** Consentimiento Informado Institucional (garantía de anonimato y confidencialidad).
  - **Sección 1:** Perfilamiento Sociodemográfico (Roles, Género, Edad, Turno, Facultad).
  - **Sección 2:** Dimensión de Paz y Convivencia (Conflictos verbales 1-5, agresiones físicas 1-5, respeto de espacios 1-5, trato cordial 1-5, efectividad de canales de diálogo).
  - **Sección 3:** Tolerancia y Pluralismo Ideológico (Seguridad de opiniones, discriminación ideológica, clima en asambleas).
    - **Regla de Salto Condicional:** Pregunta 3.3 (temor a represalias en calificaciones) solo se despliega para el rol de Estudiante.
  - **Sección 4:** Percepción de Seguridad e Identificación Espacial (Escala 1-10, victimización delictiva, calidad de iluminación nocturna).
    - **Selector Geoespacial Interactivo:** Plano del campus con los 8 cuadrantes universitarios en SVG, selección de hasta 3 zonas críticas y matriz de factores de riesgo.
  - **Sección 5:** Propuestas y Comentarios Cualitativos.
  - **Modo Brigada de Voluntariado:** Interruptor táctico para recolección asistida en campo.

### 2. Cartografía de Convivencia y Visor GIS (`/cartografia`)
- **Lienzo Cartográfico del Campus (Caracas):** 8 cuadrantes georreferenciados (C1 a C8).
- **Algoritmo de Nivel de Calor Multidimensional:**
  - Ponderación continua: Frecuencia de reportes (40%) + Severidad de motivos (25%) + Victimización real (20%) + Agravante de oscuridad nocturna (15%).
  - Gradiente cromático: **Azul** (Tranquilidad) $\rightarrow$ **Verde** $\rightarrow$ **Amarillo** $\rightarrow$ **Naranja** $\rightarrow$ **Rojo** (Alerta Crítica).
- **Filtros en Tiempo Real:** Por Rol Universitario, por Turno (diurno vs nocturno) y por Motivo de riesgo.
- **Ficha de Diagnóstico Táctico:** Proporción de quejas, victimización asociada, déficit lumínico y recomendaciones operativas inmediatas al hacer clic en cada cuadrante.

### 3. Tablero de Control Gerencial del Comité Directivo (`/admin`)
- **Dashboard de Cuotas en Tiempo Real (Muestreo Aleatorio Estratificado):**
  - Semáforos visuales (Verde / Amarillo / Rojo) para cada estrato:
    - Estudiantes: Meta 400 (80%)
    - Docentes: Meta 50 (10%)
    - Personal Administrativo: Meta 35 (7%)
    - Personal Obrero: Meta 15 (3%)
    - Turno Noche / Fin de Semana en estudiantes: Meta 160 (40%)
    - Paridad de Género: Indicador de paridad ~50% / 50%
  - **Alertas Tácticas Automáticas para Brigadas:** Detecta déficits en tiempo real y asigna misiones dirigidas (ej. Brigada A a mantenimiento para obreros, Brigada B a noche).
  - **Indicador de Cierre de Muestra:** Valida cuándo la recolección alcanza el 100% de heterogeneidad para cerrar el censo.
- **Macroindicadores de Convivencia:** Índice de Paz (0-100), Tolerancia Ideológica, Percepción Promedio de Seguridad (1-10) y Tasa de Victimización.
- **Gráficos Dinámicos (Chart.js):** Distribución demográfica y ranking de problemas de campus.
- **Exportación para Investigación (Ciencia de Datos):**
  - Descarga directa en **CSV** (con codificación UTF-8 con BOM compatible con Excel y SPSS).
  - Descarga estructurada en **JSON** para análisis en Python/Pandas/R.
- **Auditoría Alfa (Fase II Paso 4):**
  - Precarga de escenarios piloto representativos (completo vs con déficit).
  - Simulacro de carga masiva (**Stress Test** de hasta 1,000 registros con métricas de rendimiento).
  - Reinicio seguro para nuevo periodo académico.

---

## 📚 Documentación Institucional Generada (Directorio `/docs`)

Conforme a los requerimientos de la Sección B del documento técnico:

1. [`docs/01_MANUAL_DE_OPERACIONES.md`](file:///c:/Users/PC/Desktop/paz/docs/01_MANUAL_DE_OPERACIONES.md): Visión, misión, estructura de gobierno del Comité Directivo y cronograma de actualización semestral.
2. [`docs/02_DICCIONARIO_DE_VARIABLES_Y_ALGORITMO.md`](file:///c:/Users/PC/Desktop/paz/docs/02_DICCIONARIO_DE_VARIABLES_Y_ALGORITMO.md): Definición formal de variables y fórmula matemática exacta del cálculo del Índice de Calor ($H_z$).
3. [`docs/03_MANUAL_DE_USUARIO_FRONTEND.md`](file:///c:/Users/PC/Desktop/paz/docs/03_MANUAL_DE_USUARIO_FRONTEND.md): Instructivo para el usuario universitario sobre cómo llenar el instrumento e interactuar con el mapa.
4. [`docs/04_MANUAL_DE_ADMINISTRACION_BACKEND.md`](file:///c:/Users/PC/Desktop/paz/docs/04_MANUAL_DE_ADMINISTRACION_BACKEND.md): Guía técnica de bases de datos, despliegue, auditoría y mantenimiento de servidores.
5. [`docs/05_PROTOCOLO_DE_ABORDAJE_VOLUNTARIOS.md`](file:///c:/Users/PC/Desktop/paz/docs/05_PROTOCOLO_DE_ABORDAJE_VOLUNTARIOS.md): Guiones de entrevista para brigadas de campo, ética de confidencialidad y protocolo ante emergencias activas.

---

## 🛠️ Tecnologías Empleadas

- **Backend:** Python 3.13, FastAPI, Uvicorn, Pydantic v2, SQLite 3.
- **Frontend:** HTML5, CSS3, Tailwind CSS (CDN), FontAwesome 6, Chart.js.
- **Cartografía:** Modelo de Sistema de Información Geográfica (GIS) con capas vectoriales georreferenciadas y gradientes térmicos.
- **Ciberseguridad:** Anonimización en base de datos sin almacenamiento de datos identificables ni direcciones IP.

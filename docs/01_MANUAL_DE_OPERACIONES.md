# MANUAL DE OPERACIONES DEL OBSERVATORIO DE PAZ Y CONVIVENCIA DEMOCRÁTICA UNIVERSITARIA

**Código del Documento:** DOC-OP-01  
**Versión:** 1.0.0 (Piloto Caracas)  
**Clasificación:** Institucional / Gobernanza  

---

## 1. Misión, Visión y Marco Institucional

### 1.1 Misión
Diagnosticar, espacializar y analizar la convivencia, la paz y la percepción de seguridad física e ideológica dentro del entorno universitario mediante el uso de tecnologías de información geográfica y métodos empíricos rigurosos, con el objeto de fundamentar políticas de bienestar, gobernanza institucional y mediación académica.

### 1.2 Visión
Consolidarse como la plataforma tecnológica y metodológica de referencia en Venezuela para la transformación pacífica de conflictos y la promoción de la cultura democrática en los recintos universitarios nacionales.

---

## 2. Estructura Organizativa y Roles del Comité Directivo

Conforme al marco del Observatorio, la operación técnica y estratégica descansa en seis perfiles funcionales:

```
               ┌────────────────────────────────────────────────┐
               │    DIRECTOR EJECUTIVO DEL OBSERVATORIO         │
               │         (Nivel Autoridad Universitaria)        │
               └───────────────────────┬────────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         │                             │                             │
┌────────┴───────────────┐ ┌───────────┴──────────────┐ ┌────────────┴─────────────┐
│  INVESTIGADOR JEFE /   │ │   LÍDER DE DESARROLLO    │ │  COORDINADOR DE CAMPO /  │
│      METODÓLOGO        │ │       TECNOLÓGICO        │ │      VOLUNTARIADO        │
└────────┬───────────────┘ └───────────┬──────────────┘ └────────────┬─────────────┘
         │                             │                             │
┌────────┴───────────────┐ ┌───────────┴──────────────┐ ┌────────────┴─────────────┐
│    ANALISTA DE DATOS   │ │     ESPECIALISTA GIS     │ │  BRIGADAS DE VOLUNTARIOS │
│   (Científico Datos)   │ │  (Cartografía / Polígonos)│ │   (Servicio Comunitario) │
└────────────────────────┘ └──────────────────────────┘ └──────────────────────────┘
```

### Funciones por Rol:
1. **Director Ejecutivo (Autoridad Universitaria):** Aprobación de políticas institucionales, enlace interuniversitario y asignación de presupuesto operativo.
2. **Coordinador Metodológico / Investigador Jefe:** Validación psicométrica de variables, redacción de informes diagnósticos de línea base y enlace con proyectos de investigación y tesistas.
3. **Líder de Desarrollo Tecnológico:** Arquitectura del sistema web, gestión de bases de datos relacionales, políticas de ciberseguridad y preservación del anonimato criptográfico.
4. **Especialista GIS:** Georreferenciación de campus, digitalización de planos vectoriales (GeoJSON), configuración de gradientes térmicos y validación de cuadrantes.
5. **Coordinador de Trabajo de Campo:** Reclutamiento, adiestramiento ético y distribución táctica de las brigadas de estudiantes en servicio comunitario.
6. **Analista de Datos:** Control diario del Dashboard de Cuotas, limpieza de datos crudos, auditoría de sesgos muestrales y generación de tableros de control.

---

## 3. Cronograma del Ciclo Semestral de Actualización

El mapa de calor y diagnóstico se actualiza periódicamente bajo un ciclo de cuatro fases:

| Fase | Duración | Acciones Clave |
| :--- | :--- | :--- |
| **Fase I: Planificación y Ajuste** | Semanas 1 a 4 | Actualización de planos de infraestructura, calibración de cuadrantes y apertura de convocatoria de brigadas. |
| **Fase II: Levantamiento de Datos (Pinza)** | Semanas 5 a 10 | Campaña digital masiva y despliegue coordinado de brigadas con semáforos de estratificación en tiempo real. |
| **Fase III: Cierre de Muestra y Depuración** | Semanas 11 a 12 | Verificación de semáforos verdes en cuotas, cierre formal del censo y eliminación de duplicados o respuestas inconsistentes. |
| **Fase IV: Publicación de Informe y Acción** | Semanas 13 a 16 | Publicación de la Cartografía Oficial, entrega de bases anonimizadas a tesistas e implementación de recomendaciones tácticas. |

---

## 4. Protocolo de Gobernanza y Cierre del Censo

1. La recolección de datos permanecerá en estado `OPEN` hasta que el Dashboard de Cuotas certifique que todos los estratos (Estudiantes, Docentes, Administrativos, Obreros y Turno Noche) han cumplido su cuota representativa.
2. Una vez alcanzado el semáforo verde general, el Director Ejecutivo procederá a cambiar el estado a `CLOSED` mediante el módulo de control del panel gerencial.
3. Se generará la instantánea oficial del Dataset y se emitirá el informe de recomendaciones para Consejo Universitario.

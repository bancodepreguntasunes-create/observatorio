# MANUAL DE ADMINISTRACIÓN DE LA PLATAFORMA (BACKEND Y SERVIDORES)

**Código del Documento:** DOC-ADM-04  
**Versión:** 1.0.0 (Piloto Caracas)  
**Clasificación:** Manual de Operaciones Técnicas y Sistemas  

---

## 1. Arquitectura de Software y Base de Datos

El sistema del Observatorio está desarrollado con una arquitectura ligera de alto desempeño y cero fricción:

- **Servidor Web / API:** Python 3.13 con **FastAPI** y **Uvicorn** (asincronía nativa y alto rendimiento).
- **Base de Datos:** SQLite 3 relacional (`observatorio.db`) con soporte ACID y modo de bloqueo transaccional seguro para alta concurrencia.
- **Frontend:** HTML5 semántico, Tailwind CSS y Vanilla JS reactivo sin dependencias de compilación complejas.
- **Visualización Cartográfica:** SVG vectorial georreferenciado escalable y Chart.js para tableros gerenciales.

### Esquema Relacional de Tablas:
1. `surveys`: Registro anónimo de cada formulario diligenciado (sociodemográfico, Likert de paz, tolerancia, cuadrantes GIS y motivos).
2. `zones`: Catálogo de cuadrantes del campus con coordenadas vectoriales, códigos, tipos de uso y centroides espaciales.
3. `pilot_config`: Parámetros de cuotas del plan de muestreo, periodo lectivo activo y estado del censo (`OPEN` / `CLOSED`).

---

## 2. Puesta en Marcha y Ejecución del Servidor

### En Entornos Locales o Servidores Dedicados (Windows):
1. **Inicio en un solo clic:** Ejecutar el archivo `iniciar_observatorio.bat` en la raíz del proyecto.
2. **Inicio por línea de comandos (Python):**
   ```powershell
   python run.py
   ```
   El servidor se iniciará en `http://localhost:8000/` y abrirá automáticamente el navegador predeterminado.

---

## 3. Extracción de Datos para Centros de Investigación y Tesistas

El sistema incluye dos canales oficiales de exportación accesibles desde el panel `/admin`:

1. **Exportación CSV (Compatible con Excel y SPSS):**
   - Endpoint: `GET /api/export/csv`
   - Características: Codificación UTF-8 con marca de orden de bytes (BOM) para evitar caracteres ilegibles en Microsoft Excel. Delimitador punto y coma (`;`).
   - Todos los identificadores personales están omitidos; se asigna un `ID_Anonimo` secuencial único.
2. **Exportación JSON (Estructurado para Python, R y Pandas):**
   - Endpoint: `GET /api/export/json`
   - Entrega un objeto JSON tipado con metadatos del proyecto y arreglos anidados de cuadrantes y motivos de riesgo.

---

## 4. Auditoría de Carga Masiva (Stress Test Alfa)

Para verificar la estabilidad del servidor ante simulacros masivos de hasta 1,000 estudiantes simultáneos (Fase II Paso 4 del plan piloto):
1. Ingrese a `http://localhost:8000/admin`.
2. En la sección *Auditoría y Control*, haga clic en **"Simulacro Masivo (Stress)"**.
3. El sistema inyectará transacciones masivas directas a la base de datos midiendo:
   - Tiempo total transcurrido (en segundos).
   - Tasa de respuestas procesadas por segundo (RPS).
   - Validación de consistencia relacional.

---

## 5. Protocolo de Apertura y Reinicio de Periodo Académico

Al finalizar un semestre académico y haber publicado el reporte de línea base:
1. Haga clic en **"Exportar CSV"** y conserve una copia de seguridad del dataset semestral.
2. Presione el botón **"Reiniciar Base de Datos"** en el panel `/admin`.
3. Esto vaciará las encuestas anteriores (`surveys`), reiniciará el autoincremento de ID y dejará los cuadrantes y metas de cuotas listos para el nuevo periodo lectivo.

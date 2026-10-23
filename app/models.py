from pydantic import BaseModel, Field, field_validator
from typing import List, Optional

class SurveySubmission(BaseModel):
    consent: bool = Field(..., description="Aceptación de consentimiento informado")
    is_field_survey: bool = Field(False, description="Indica si la encuesta fue tomada en campo por voluntario")
    
    # Sección 1: Perfilamiento Sociodemográfico
    cedula: str = Field(..., description="Cédula de identidad (V/E)")
    role: str = Field(..., description="Estudiante, Docente, Personal Administrativo, Personal Obrero, Personal Directivo/Autoridad")
    gender: str = Field(..., description="Masculino o Femenino")
    age_group: str = Field(..., description="16-20, 21-25, 26-35, 36-50, Mas de 50")
    shift: str = Field(..., description="Mañana, Tarde, Noche, Fines de semana, Mixto")
    institution_type: Optional[str] = Field("Universidades Públicas Nacionales y Experimentales", description="Tipo de Institución")
    institution_name: Optional[str] = Field("", description="Nombre de la Institución")
    faculty: Optional[str] = Field("", description="Facultad o Escuela de adscripción")
    campus: str = Field("Campus Central Caracas", description="Sede o campus universitario")
    
    # Sección 2: Paz y Convivencia
    verbal_conflicts: int = Field(..., ge=1, le=5, description="Frecuencia de conflictos verbales (1-5)")
    physical_aggressions: int = Field(..., ge=1, le=5, description="Frecuencia de agresiones físicas (1-5)")
    respect_common_spaces: int = Field(..., ge=1, le=5, description="Respeto por espacios comunes (1-5)")
    cordial_treatment: int = Field(..., ge=1, le=5, description="Trato cordial estudiantes-personal (1-5)")
    peaceful_channels: str = Field(..., description="Canales institucionales pacíficos: Si, No, Desconozco los canales")
    
    # Sección 3: Tolerancia y Diversidad Ideológica
    safe_expressing_opinions: str = Field(..., description="Seguridad para opinar: Totalmente seguro, Medianamente seguro, Inseguro, Totalmente inseguro, Prefiero no opinar")
    ideological_discrimination: str = Field(..., description="Discriminación ideológica: victima, testigo, nunca, prefiero_no_responder")
    grades_affected_divergence: Optional[str] = Field("no_aplica", description="Solo para estudiantes: Si, No, no_aplica")
    group_dialogue_attitude: str = Field(..., description="Actitud en asambleas/debates: tolerante, indiferente, intolerante")
    
    # Sección 4: Percepción de Seguridad y Zonificación
    safety_score: int = Field(..., ge=1, le=10, description="Percepción de seguridad física (1-10)")
    crime_victim: str = Field(..., description="Victima de delito: Si, No")
    night_lighting: str = Field(..., description="Calidad de iluminación: Excelente, Buena, Regular, Deficiente, Pésima")
    selected_zones: List[str] = Field(default=[], description="Máximo 3 cuadrantes críticos seleccionados")
    zone_reasons: List[str] = Field(default=[], description="Motivos de selección de cuadrantes")
    
    # Sección 5: Comentarios Abiertos (Cualitativo)
    improvement_suggestion: Optional[str] = Field("", description="Acción inmediata sugerida para mejorar la convivencia")

    @field_validator('consent')
    def validate_consent(cls, v):
        if not v:
            raise ValueError("El consentimiento informado es obligatorio para participar.")
        return v

    @field_validator('selected_zones')
    def validate_zones_length(cls, v):
        if len(v) > 3:
            raise ValueError("No puede seleccionar más de 3 cuadrantes críticos.")
        return v

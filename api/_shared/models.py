"""
Pydantic v2 models for survey requests and responses.
"""

from typing import Optional, List, Union
import json
from pydantic import BaseModel, Field, ConfigDict, field_validator


class SurveyCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    consentimiento: int = 1
    rol: str  # 'Estudiante', 'Docente', 'Administrativo', 'Obrero'
    genero: str  # 'Masculino', 'Femenino', 'No binario', 'Prefiero no decir'
    edad: str  # '18-24', '25-34', '35-44', '45-54', '55+'
    turno: str  # 'Diurno', 'Nocturno', 'Fines de semana'
    facultad: str
    conflictos_verbales: Optional[int] = None  # 1-5
    agresiones_fisicas: Optional[int] = None  # 1-5
    respeto_espacios: Optional[int] = None  # 1-5
    trato_cordial: Optional[int] = None  # 1-5
    canales_dialogo: Optional[int] = None  # 1-5
    seguridad_opiniones: Optional[int] = None  # 1-5
    discriminacion_ideologica: Optional[int] = None  # 1-5
    clima_asambleas: Optional[int] = None  # 1-5
    temor_represalias: Optional[int] = None  # 1-5 (NULL if not student)
    percepcion_seguridad: Optional[int] = None  # 1-10
    victimizacion: Union[int, bool] = 0  # 0 or 1
    iluminacion_nocturna: Optional[int] = None  # 1-5
    zonas_criticas: List[str] = Field(default_factory=list)
    factores_riesgo: List[str] = Field(default_factory=list)
    propuestas: Optional[str] = ""
    modo_brigada: Union[int, bool] = 0

    @field_validator("zonas_criticas", mode="before")
    @classmethod
    def parse_zonas_criticas(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return [str(x) for x in parsed]
            except Exception:
                return [s.strip() for s in v.split(",") if s.strip()]
        if isinstance(v, (list, tuple, set)):
            return [str(x) for x in v]
        return []

    @field_validator("factores_riesgo", mode="before")
    @classmethod
    def parse_factores_riesgo(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return [str(x) for x in parsed]
            except Exception:
                return [s.strip() for s in v.split(",") if s.strip()]
        if isinstance(v, (list, tuple, set)):
            return [str(x) for x in v]
        return []

    @field_validator("victimizacion", "modo_brigada", mode="before")
    @classmethod
    def coerce_int_flag(cls, v):
        if isinstance(v, bool):
            return 1 if v else 0
        if isinstance(v, (int, float)):
            return 1 if v else 0
        if isinstance(v, str):
            return 1 if v.lower() in ("true", "1", "t", "yes", "si") else 0
        return 0


class SurveyResponse(SurveyCreate):
    id: int
    timestamp: Optional[str] = None

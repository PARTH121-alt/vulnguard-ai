from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class AnalysisRequest(BaseModel):
    source_code: str
    language: str = "python"
    model: str = "random_forest"
    explain: bool = True


class Finding(BaseModel):
    line: int
    vulnerability_type: str
    severity: str
    confidence: float
    explanation: str
    code_snippet: str = ""


class AnalysisResponse(BaseModel):
    id: int
    status: str
    vulnerability_detected: bool
    vulnerability_type: Optional[str] = None
    severity: Optional[str] = None
    confidence: float
    findings: List[Finding] = []
    highlighted_lines: List[Dict[str, Any]] = []
    explanation: Optional[Dict[str, Any]] = None
    feature_importance: List[Dict[str, Any]] = []
    model_used: str
    is_demo: bool = False
    timestamp: datetime


class AnalysisHistoryItem(BaseModel):
    id: int
    language: str
    vulnerability_detected: bool
    vulnerability_type: Optional[str]
    severity: Optional[str]
    confidence: float
    model_used: str
    timestamp: datetime

    class Config:
        from_attributes = True

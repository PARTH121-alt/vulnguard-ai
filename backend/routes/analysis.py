from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone
import json

from backend.database import get_db
from backend.models.user import User
from backend.models.analysis import Analysis
from backend.schemas.analysis import (
    AnalysisRequest,
    AnalysisResponse,
    AnalysisHistoryItem,
    Finding,
)
from backend.middleware.auth import get_current_user, get_optional_user
from backend.services.analyzer import analyze_code
from backend.services.explainer import explain_prediction

router = APIRouter(prefix="/api", tags=["Analysis"])


@router.post("/analyze", response_model=AnalysisResponse)
def analyze(
    request: AnalysisRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    if len(request.source_code.strip()) == 0:
        raise HTTPException(status_code=400, detail="Source code cannot be empty")
    if len(request.source_code) > 50000:
        raise HTTPException(status_code=400, detail="Source code too large (max 50,000 characters)")
    if request.language not in ["python", "javascript", "java", "cpp"]:
        raise HTTPException(status_code=400, detail="Unsupported language")

    results = analyze_code(
        source_code=request.source_code,
        language=request.language,
        model_name=request.model,
        explain=request.explain,
    )

    if request.explain and not results.get("explanation"):
        results["explanation"] = explain_prediction(
            request.source_code, request.model
        )

    timestamp = datetime.now(timezone.utc)

    analysis = Analysis(
        user_id=current_user.id if current_user else None,
        source_code=request.source_code,
        language=request.language,
        model_used=request.model,
        vulnerability_detected=results["vulnerability_detected"],
        vulnerability_type=results.get("vulnerability_type"),
        severity=results.get("severity"),
        confidence=results["confidence"],
        findings=json.dumps(results["findings"]),
        highlighted_lines=json.dumps(results["highlighted_lines"]),
        explanation=json.dumps(results.get("explanation")),
        feature_importance=json.dumps(results.get("feature_importance", [])),
        timestamp=timestamp,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    findings = [Finding(**f) for f in results["findings"]]

    return AnalysisResponse(
        status=results["status"],
        vulnerability_detected=results["vulnerability_detected"],
        vulnerability_type=results.get("vulnerability_type"),
        severity=results.get("severity"),
        confidence=results["confidence"],
        findings=findings,
        highlighted_lines=results["highlighted_lines"],
        explanation=results.get("explanation"),
        feature_importance=results.get("feature_importance", []),
        model_used=results["model_used"],
        is_demo=results.get("is_demo", False),
        timestamp=timestamp,
    )


@router.get("/history", response_model=list[AnalysisHistoryItem])
def get_history(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analyses = (
        db.query(Analysis)
        .filter(Analysis.user_id == current_user.id)
        .order_by(Analysis.timestamp.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        AnalysisHistoryItem(
            id=a.id,
            language=a.language,
            vulnerability_detected=a.vulnerability_detected,
            vulnerability_type=a.vulnerability_type,
            severity=a.severity,
            confidence=a.confidence,
            model_used=a.model_used,
            timestamp=a.timestamp,
        )
        for a in analyses
    ]


@router.get("/history/{analysis_id}")
def get_analysis_detail(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analysis = (
        db.query(Analysis)
        .filter(Analysis.id == analysis_id, Analysis.user_id == current_user.id)
        .first()
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return {
        "id": analysis.id,
        "language": analysis.language,
        "source_code": analysis.source_code,
        "model_used": analysis.model_used,
        "vulnerability_detected": analysis.vulnerability_detected,
        "vulnerability_type": analysis.vulnerability_type,
        "severity": analysis.severity,
        "confidence": analysis.confidence,
        "findings": json.loads(analysis.findings) if analysis.findings else [],
        "highlighted_lines": json.loads(analysis.highlighted_lines) if analysis.highlighted_lines else [],
        "explanation": json.loads(analysis.explanation) if analysis.explanation else None,
        "feature_importance": json.loads(analysis.feature_importance) if analysis.feature_importance else [],
        "timestamp": analysis.timestamp.isoformat() if analysis.timestamp else None,
    }


@router.delete("/history/{analysis_id}")
def delete_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analysis = (
        db.query(Analysis)
        .filter(Analysis.id == analysis_id, Analysis.user_id == current_user.id)
        .first()
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    db.delete(analysis)
    db.commit()
    return {"message": "Analysis deleted successfully"}


@router.get("/models")
def get_models():
    models = [
        {
            "id": "random_forest",
            "name": "Random Forest",
            "description": "Ensemble learning method using multiple decision trees",
            "type": "traditional_ml",
            "available": True,
            "metrics": {
                "accuracy": 0.87,
                "precision": 0.85,
                "recall": 0.89,
                "f1_score": 0.87,
                "roc_auc": 0.92,
            },
        },
        {
            "id": "xgboost",
            "name": "XGBoost",
            "description": "Gradient boosting framework optimized for performance",
            "type": "traditional_ml",
            "available": True,
            "metrics": {
                "accuracy": 0.91,
                "precision": 0.89,
                "recall": 0.93,
                "f1_score": 0.91,
                "roc_auc": 0.95,
            },
        },
        {
            "id": "codebert",
            "name": "CodeBERT",
            "description": "Pre-trained code-aware transformer model (demo integration)",
            "type": "transformer",
            "available": False,
            "note": "Requires fine-tuning on vulnerability dataset. Currently showing demo metrics.",
            "metrics": {
                "accuracy": 0.94,
                "precision": 0.92,
                "recall": 0.96,
                "f1_score": 0.94,
                "roc_auc": 0.97,
            },
        },
        {
            "id": "ensemble",
            "name": "Ensemble",
            "description": "Combined predictions from multiple models",
            "type": "ensemble",
            "available": True,
            "metrics": {
                "accuracy": 0.93,
                "precision": 0.91,
                "recall": 0.95,
                "f1_score": 0.93,
                "roc_auc": 0.96,
            },
        },
    ]
    return {"models": models}


@router.get("/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0", "service": "VulnGuard AI Backend"}

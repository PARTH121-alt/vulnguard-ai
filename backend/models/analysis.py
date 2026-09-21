from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from backend.database import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    source_code = Column(Text, nullable=False)
    language = Column(String(20), nullable=False)
    model_used = Column(String(50), nullable=False)
    vulnerability_detected = Column(Boolean, nullable=False)
    vulnerability_type = Column(String(100), nullable=True)
    severity = Column(String(20), nullable=True)
    confidence = Column(Float, nullable=False)
    findings = Column(Text, nullable=True)
    highlighted_lines = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    feature_importance = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="analyses")

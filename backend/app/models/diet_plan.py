from sqlalchemy import Column, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class DietPlan(Base):
    __tablename__ = "diet_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    report_id = Column(Integer, ForeignKey("lab_reports.id"), nullable=False)
    diet_data = Column(Text, nullable=False)  # JSON data for the diet plan

    user = relationship("User", back_populates="diet_plans")
    report = relationship("LabReport", back_populates="diet_plan")

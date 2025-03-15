from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.lab_report import LabReport
from app.models.user import User

router = APIRouter()


@router.post("/reports/upload")
async def upload_pdf(
    file: UploadFile = File(..., description="PDF file to upload"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lab_report = LabReport(
        user_id=current_user.id,
        filename=file.filename,
        processed_data="Processed data from PDF",
    )
    db.add(lab_report)
    db.commit()
    db.refresh(lab_report)
    return {
        "filename": file.filename,
        "report_id": lab_report.id,
        "message": "Report uploaded successfully",
    }


@router.get("/reports/history")
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reports = db.query(LabReport).filter(LabReport.user_id == current_user.id).all()
    return {
        "user_id": current_user.id,
        "history": [
            {
                "report_id": report.id,
                "filename": report.filename,
                "uploaded_at": report.id,
            }
            for report in reports
        ],
    }


@router.get("/reports/{report_id}")
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = db.query(LabReport).filter(LabReport.id == report_id).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access")

    return {
        "report_id": report.id,
        "filename": report.filename,
        "processed_data": report.processed_data,
    }

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.lab_report import LabReport
from app.models.user import User
from fastapi import status

router = APIRouter()


@router.post("/reports/upload")
async def upload_pdf(
    file: UploadFile = File(..., description="PDF file to upload"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        lab_report = LabReport(
            user_id=current_user.id,
            filename=file.filename,
            processed_data="Processed data from PDF",
        )
        db.add(lab_report)
        await db.commit()
        await db.refresh(lab_report)
        return {
            "filename": file.filename,
            "report_id": lab_report.id,
            "message": "Report uploaded successfully",
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload report: {str(e)}"
        )


@router.get("/reports/history")
async def get_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = await db.execute(select(LabReport).where(LabReport.user_id == current_user.id))
        reports = result.scalars().all()
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve report history: {str(e)}"
        )


@router.get("/reports/{report_id}")
async def get_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = await db.execute(select(LabReport).where(LabReport.id == report_id))
        report = result.scalars().first()

        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        if report.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized access")

        return {
            "report_id": report.id,
            "filename": report.filename,
            "processed_data": report.processed_data,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve report: {str(e)}"
        )

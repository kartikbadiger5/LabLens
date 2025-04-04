from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.lab_report import LabReport
from app.models.user import User
from fastapi import status
from dotenv import load_dotenv
from app.models.diet_plan import DietPlan
import pdfplumber
import google.generativeai as genai
from elevenlabs.client import ElevenLabs
import base64
import os
import json
import re

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))

router = APIRouter()


def validate_lab_report(text: str) -> bool:
    """Validate if text contains lab report elements using Gemini"""
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = f"""Analyze this document and determine if it's a medical lab report:

    {text[:5000]}  # First 5000 chars for efficiency

    Respond ONLY with JSON:
    {{
        "is_lab_report": boolean,
        "validation_reason": "string"
    }}"""

    try:
        response = model.generate_content(prompt)
        result = json.loads(re.sub(r"```json|```", "", response.text))
        return result.get("is_lab_report", False)
    except:
        return False

def analyze_with_gemini(text: str) -> dict:
    """Full analysis using Gemini 1.5 Flash"""
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = f"""**Medical Lab Report Analysis Task**

Analyze this lab report and provide a detailed and comprehensive analysis. In addition to extracting the patient demographics and lab test results, please perform the following:

1. **Data Processing & Ingestion:**  
   - Extract the lab report data from the provided PDF text, handling both structured and unstructured formats.
   - Recognize and appropriately categorize different lab test types (e.g., blood tests, liver function, cholesterol, etc.).

2. **Natural Language Interpretation:**  
   - Translate any medical jargon into plain, human-friendly language.
   - Provide clear, plain language explanations for each test result.

3. **Data Visualization:**  
   - Identify and suggest trends over time (e.g., changes in blood work like cholesterol levels).
   - Indicate how test results might be visually represented, including historical comparisons if applicable.

4. **Risk & Abnormality Detection:**  
   - Highlight any abnormal results with clear, color-coded alerts.
   - Provide personalized recommendations such as dietary or lifestyle changes based on the findings.

5. **Population Health Comparison:**  
   - Compare the individual test results with age-group population benchmarks.
   - Indicate whether each value falls within a normal distribution for the given demographic.
   - Provide commentary on any deviations from the expected benchmarks.

Now, analyze the lab report below and provide structured output:

{text}

**Required Output Format (strict JSON):**
{{
    "patient": {{
        "name": "str",
        "age": "str",
        "gender": "str",
        "patient_id": "str"
    }},
    "abnormal_results": [
        {{
            "test_name": "str",
            "result": "str",
            "normal_range": "str",
            "significance": "str"
        }}
    ],
    "recommendations": {{
        "immediate_actions": ["str"],
        "lifestyle_changes": ["str"],
        "follow_up_tests": ["str"]
    }},
    "red_flags": ["str"],
    "population_comparison": {{
        "benchmark": "str",
        "normal_distribution": "str",
        "commentary": "str"
    }}
}}

**Validation Rules:**
1. Document must contain patient demographics.
2. Must include lab test results with numerical values.
3. Should reference medical measurement units.
4. Must have collection date/time.
"""

    try:
        response = model.generate_content(prompt)
        cleaned = re.sub(r"```json|```", "", response.text)
        return json.loads(cleaned)
    except Exception as e:
        return {"error": str(e)}


def generate_summary_text(analysis: dict) -> str:
    """Generate structured text summary from analysis data"""
    summary = []

    # Patient information
    patient = analysis.get("patient", {})
    if patient:
        summary.append(
            f"Patient {patient.get('name', 'Unknown')}, "
            f"age {patient.get('age', 'unknown')}, "
            f"{patient.get('gender', 'unspecified gender')}."
        )

    # Abnormal results
    abnormal = analysis.get("abnormal_results", [])
    if abnormal:
        summary.append(f"Found {len(abnormal)} abnormal results:")
        for result in abnormal:
            summary.append(
                f"{result['test_name']}: {result['result']}. "
                f"Normal range is {result['normal_range']}. "
                f"This indicates {result['significance']}."
            )

    # Critical alerts
    alerts = analysis.get("red_flags", [])
    if alerts:
        summary.append("Critical alerts detected:")
        summary.extend(alerts)

    # Recommendations
    recs = analysis.get("recommendations", {})
    if recs:
        summary.append("Recommendations:")
        for category, items in recs.items():
            if items:
                friendly_name = category.replace("_", " ").title()
                summary.append(f"{friendly_name}:")
                summary.extend(items)

    return " ".join(summary)


def generate_diet_plan(analysis: dict) -> dict:
    """Generate a personalized diet plan based on lab analysis."""
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = f"""Based on the following lab report analysis, create a personalized diet plan:

    {json.dumps(analysis, indent=2)}

    **Diet Plan Format (strict JSON, no additional text):**
    {{
        "diet_recommendations": [
            {{
                "meal": "Breakfast",
                "foods": ["food1", "food2"],
                "reason": "Why these foods are recommended"
            }},
            {{
                "meal": "Lunch",
                "foods": ["food1", "food2"],
                "reason": "Why these foods are recommended"
            }}
        ],
        "general_nutrition_tips": ["Tip 1", "Tip 2"]
    }}
    """

    try:
        response = model.generate_content(prompt)
        match = re.search(r"\{.*\}", response.text, re.DOTALL)
        if not match:
            return {"error": "Invalid JSON format received from Gemini"}
        cleaned_json = match.group(0)
        return json.loads(cleaned_json)
    except Exception as e:
        return {"error": str(e)}

def extract_visualization_data(analysis: dict) -> dict:
    """
    Extracts visualization data from abnormal results.
    It parses numerical values and normal ranges from each abnormal result.
    """
    trends = []
    for result in analysis.get("abnormal_results", []):
        test_name = result.get("test_name", "Unknown Test")
        # Ensure the result field is a string
        result_str = str(result.get("result") or "")
        # Attempt to extract a numeric value from the result string.
        numeric_result = None
        numeric_match = re.findall(r"[-+]?\d*\.\d+|\d+", result_str)
        if numeric_match:
            try:
                numeric_result = float(numeric_match[0])
            except Exception:
                numeric_result = None

        # Ensure the normal_range field is a string
        normal_range_str = str(result.get("normal_range") or "")
        normal_min, normal_max = None, None
        range_vals = re.findall(r"[-+]?\d*\.\d+|\d+", normal_range_str)
        if len(range_vals) >= 2:
            try:
                normal_min = float(range_vals[0])
                normal_max = float(range_vals[1])
            except Exception:
                normal_min, normal_max = None, None

        trends.append({
            "test_name": test_name,
            "current_value": numeric_result,
            "normal_min": normal_min,
            "normal_max": normal_max,
        })
    return {"trends": trends}


@router.post("/reports/upload")
async def upload_pdf(
    file: UploadFile = File(..., description="PDF file to upload"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        if file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF files accepted")

        # Extract text from PDF
        with pdfplumber.open(file.file) as pdf:
            text = "\n".join([p.extract_text() for p in pdf.pages if p.extract_text()])

        # Initial keyword validation
        if not any(kw in text.lower() for kw in ["patient", "result", "test", "lab"]):
            raise HTTPException(
                status_code=400, detail="Document lacks basic lab report elements"
            )

        # AI validation
        if not validate_lab_report(text):
            raise HTTPException(status_code=400, detail="Invalid lab report format")

        # Full analysis
        analysis = analyze_with_gemini(text)
        if "error" in analysis:
            raise HTTPException(status_code=500, detail=analysis["error"])

        # Extract visualization data for enhanced frontend visualizations
        visualization_data = extract_visualization_data(analysis)

        # Check if report with same filename already exists for this user.
        result = await db.execute(
            select(LabReport).where(
                LabReport.user_id == current_user.id,
                LabReport.filename == file.filename
            )
        )
        existing_report = result.scalars().first()

        if existing_report:
            # Override processed_data and visualization_data of the existing report.
            existing_report.processed_data = json.dumps(analysis)
            existing_report.visualization_data = json.dumps(visualization_data)
            lab_report = existing_report
        else:
            # Create new LabReport with both processed_data and visualization_data.
            lab_report = LabReport(
                user_id=current_user.id,
                filename=file.filename,
                processed_data=json.dumps(analysis),
                visualization_data=json.dumps(visualization_data)
            )
            db.add(lab_report)

        await db.commit()
        await db.refresh(lab_report)

        # Generate audio summary
        audio_response = {}
        try:
            summary_text = generate_summary_text(analysis)
            audio = client.generate(
                text=summary_text,
                voice="MF3mGyEYCl7XYWbV9V6O",  # Rachel's voice ID
                model="eleven_monolingual_v1",
            )

            # Collect audio chunks
            audio_data = bytes()
            for chunk in audio:
                if chunk:
                    audio_data += chunk

            audio_base64 = base64.b64encode(audio_data).decode("utf-8")
            audio_response = {
                "content": audio_base64,
                "content_type": "audio/mpeg",
                "text_length": len(summary_text),
            }
        except Exception as e:
            audio_response = {"error": f"Audio generation failed: {str(e)}"}

        # Return combined response including visualization_data and population_comparison.
        return {
            "upload_details": {
                "filename": file.filename,
                "report_id": lab_report.id,
                "message": "Report uploaded and analyzed successfully",
            },
            "analysis": {
                "patient_info": analysis.get("patient", {}),
                "clinical_findings": {
                    "abnormal_results": analysis.get("abnormal_results", []),
                    "critical_alerts": analysis.get("red_flags", []),
                },
                "recommendations": analysis.get("recommendations", {}),
                "warnings": [
                    "This analysis should be verified by a medical professional"
                ],
                "population_comparison": analysis.get("population_comparison")
            },
            "audio_summary": audio_response,
            "visualization_data": visualization_data
        }

    except HTTPException as he:
        await db.rollback()
        raise he
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload and analyze report: {str(e)}",
        )


@router.get("/reports/history")
async def get_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = await db.execute(
            select(LabReport).where(LabReport.user_id == current_user.id)
        )
        reports = result.scalars().all()
        return {
            "user_id": current_user.id,
            "history": [
                {
                    "report_id": report.id,
                    "filename": report.filename,
                }
                for report in reports
            ],
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve report history: {str(e)}",
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

        # Parse the stored JSON data
        try:
            analysis_data = json.loads(report.processed_data)
        except json.JSONDecodeError:
            analysis_data = {"error": "Failed to parse stored analysis data"}
        # Retrieve visualization data from the stored column
        visualization = {}
        try:
            visualization = json.loads(report.visualization_data) if report.visualization_data else {}
        except Exception:
            visualization = {}

        # Structure the response including visualization_data and population_comparison
        return {
            "upload_details": {
                "filename": report.filename,
                "report_id": report.id,
                "message": "Report retrieved successfully",
            },
            "analysis": {
                "patient_info": analysis_data.get("patient", {}),
                "clinical_findings": {
                    "abnormal_results": analysis_data.get("abnormal_results", []),
                    "critical_alerts": analysis_data.get("red_flags", []),
                },
                "recommendations": analysis_data.get("recommendations", {}),
                "warnings": [
                    "This analysis should be verified by a medical professional"
                ],
                "population_comparison": analysis_data.get("population_comparison")
            },
            "visualization_data": visualization
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve report: {str(e)}",
        )

@router.get("/reports/{report_id}/diet-plan")
async def get_diet_plan(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a diet plan based on the lab report and store it in the database."""
    try:
        result = await db.execute(select(LabReport).where(LabReport.id == report_id))
        report = result.scalars().first()

        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        if report.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized access")

        analysis_data = json.loads(report.processed_data)
        diet_plan_data = generate_diet_plan(analysis_data)

        if "error" in diet_plan_data:
            raise HTTPException(status_code=500, detail=diet_plan_data["error"])

        # Store the diet plan in the database
        diet_plan = DietPlan(
            user_id=current_user.id,
            report_id=report_id,
            diet_data=json.dumps(diet_plan_data),
        )
        db.add(diet_plan)
        await db.commit()
        await db.refresh(diet_plan)

        return {"report_id": report_id, "diet_plan": diet_plan_data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate and store diet plan: {str(e)}"
        )


@router.get("/reports/download-pdf/{report_id}")
async def get_report_summary(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetches both the lab report details and diet plan for a given report ID."""
    try:
        # Fetch Lab Report
        result = await db.execute(select(LabReport).where(LabReport.id == report_id))
        report = result.scalars().first()

        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        if report.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized access")

        # Parse stored JSON data from lab report
        try:
            analysis_data = json.loads(report.processed_data)
        except json.JSONDecodeError:
            analysis_data = {"error": "Failed to parse stored analysis data"}

        # Fetch Diet Plan
        diet_result = await db.execute(
            select(DietPlan).where(DietPlan.report_id == report_id)
        )
        diet_plan = diet_result.scalars().first()

        diet_plan_data = json.loads(diet_plan.diet_data) if diet_plan else {"message": "No diet plan available"}

        # Structure the response
        return {
            "website": "LabLens",
            "report_summary": {
                "headline": "Lab Report Details",
                "upload_details": {
                    "filename": report.filename,
                    "report_id": report.id,
                    "message": "Report retrieved successfully",
                },
                "analysis": {
                    "patient_info": analysis_data.get("patient", {}),
                    "clinical_findings": {
                        "abnormal_results": analysis_data.get("abnormal_results", []),
                        "critical_alerts": analysis_data.get("red_flags", []),
                    },
                    "recommendations": analysis_data.get("recommendations", {}),
                    "warnings": [
                        "This analysis should be verified by a medical professional"
                    ],
                },
            },
            "diet_summary": {
                "headline": "Diet Plan Details",
                "report_id": report_id,
                "diet_plan": diet_plan_data,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve report summary: {str(e)}"
        )

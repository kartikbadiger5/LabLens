from fastapi import FastAPI
from app.routes.api_v1.endpoints import auth, pdf_processing, health_check
from app.core.database import engine, Base  # Import Base and engine

app = FastAPI()


# Create tables on startup
@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)


app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(
    pdf_processing.router, prefix="/api/v1/reports", tags=["Lab Reports"]
)
app.include_router(health_check.router, prefix="/api/v1", tags=["Health Check"])


@app.get("/")
def read_root():
    return {"message": "Welcome to the Laboratory Report Processing System API"}

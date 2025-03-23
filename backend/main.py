from fastapi import FastAPI
from app.routes.api_v1.endpoints import auth, pdf_processing, health_check
from app.core.database import engine, Base  # Import Base and engine
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create tables on startup
@app.on_event("startup")
async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


    
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(
    pdf_processing.router, prefix="/api/v1/reports", tags=["Lab Reports"]
)
app.include_router(health_check.router, prefix="/api/v1", tags=["Health Check"])


@app.get("/")
def read_root():
    return {"message": "Welcome to the Laboratory Report Processing System API"}

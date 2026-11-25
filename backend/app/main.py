from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.logging_config import setup_logging, logger
from app.core.config import settings
from app.routers import auth, orders, tickets, messages, refunds, escalations

setup_logging()

app = FastAPI(
    title="SupportAI API",
    description="AI-powered e-commerce customer support platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception", path=request.url.path, error=str(exc))
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

app.include_router(auth.router)
app.include_router(orders.router)
app.include_router(tickets.router)
app.include_router(messages.router)
app.include_router(refunds.router)
app.include_router(escalations.router)

@app.get("/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME}

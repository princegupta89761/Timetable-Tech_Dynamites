"""
main.py
Main application entrypoint.
Wires FastAPI, registers contract exception handlers, includes API routes,
seeds problem on startup, and mounts built frontend static files if present.
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from api.routes import AppException, load_seed_problem, router

REPO_ROOT = Path(__file__).resolve().parent
FRONTEND_DIST = REPO_ROOT / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load seed problem data on startup
    load_seed_problem()
    yield


app = FastAPI(
    title="Buildsaur Timetable Generator & VCS",
    version="1.0.0",
    lifespan=lifespan,
)


# Exception handler for contract error format
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            }
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    code = "NOT_FOUND" if exc.status_code == 404 else "BAD_REQUEST"
    detail_msg = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": code,
                "message": detail_msg,
                "details": [],
            }
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_messages = [err.get("msg", str(err)) for err in exc.errors()]
    return JSONResponse(
        status_code=400,
        content={
            "error": {
                "code": "BAD_REQUEST",
                "message": "Invalid request body or parameters.",
                "details": error_messages,
            }
        },
    )


# Include API routes under /api
app.include_router(router)

# Mount frontend/dist if present
if FRONTEND_DIST.exists() and FRONTEND_DIST.is_dir():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")
else:
    @app.get("/")
    def index():
        return {
            "status": "online",
            "message": "Buildsaur Timetable Generator & VCS API is running.",
        }


if __name__ == "__main__":
    import uvicorn
    # Single uvicorn worker per contract/workflow
    uvicorn.run("main:app", host="0.0.0.0", port=8000, workers=1, reload=False)
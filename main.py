"""
main.py
Main application entrypoint.
Wires FastAPI, registers contract exception handlers, adds CORS middleware,
includes API routes, seeds problem on startup, serves built frontend with SPA fallback,
and binds to dynamic cloud PORT when run directly.
"""

from contextlib import asynccontextmanager
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

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

# 1. CORS Middleware allowing local frontend development origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


# 5. Serve frontend/dist with SPA fallback; unknown /api paths return contract NOT_FOUND
@app.get("/{full_path:path}")
async def catch_all_frontend(full_path: str):
    # Unknown /api paths must return contract NOT_FOUND error
    if full_path == "api" or full_path.startswith("api/"):
        raise HTTPException(
            status_code=404,
            detail=f"API route '/{full_path}' not found.",
        )

    # Check if a specific file exists in frontend/dist
    if FRONTEND_DIST.exists():
        target_file = FRONTEND_DIST / full_path
        if full_path and target_file.is_file():
            return FileResponse(target_file)
        # Fallback to index.html for SPA client-side routes
        index_html = FRONTEND_DIST / "index.html"
        if index_html.is_file():
            return FileResponse(index_html)

    # If frontend/dist is not built yet
    if not full_path:
        return {
            "status": "online",
            "message": "Buildsaur Timetable Generator & VCS API is running.",
        }

    raise HTTPException(status_code=404, detail=f"Path '/{full_path}' not found.")


# 2. Dynamic PORT binding for Render/Railway or local run
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, workers=1, reload=False)
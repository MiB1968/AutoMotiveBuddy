from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth_routes, admin_routes, user_routes
from app.core.watchdog import get_system_stats

app = FastAPI(title="Automotive Buddy Neural API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Build system-level routes
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "system": get_system_stats()
    }

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Mount modular routers
app.include_router(auth_routes.router, prefix="/auth", tags=["Authentication"])
app.include_router(user_routes.router, prefix="/user", tags=["User"])
app.include_router(admin_routes.router, prefix="/admin", tags=["Admin"])
app.include_router(dtc_routes.router, prefix="/api/dtc", tags=["DTC"])
app.include_router(ai_routes.router, prefix="/api/ai", tags=["AI"])

# Serve Static Files (Vite Build)
dist_path = os.path.join(os.getcwd(), "dist")
if os.path.exists(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="static")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    index_file = os.path.join(dist_path, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "Neural Interface Offline - Build Required"}

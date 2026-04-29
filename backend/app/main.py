from fastapi import FastAPI
from app.routes import auth_routes, admin_routes, user_routes

app = FastAPI()

app.include_router(auth_routes.router, prefix="/auth")
app.include_router(admin_routes.router, prefix="/admin")
app.include_router(user_routes.router, prefix="/user")

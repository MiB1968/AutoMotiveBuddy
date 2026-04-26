import os

print("\n🔍 AutoMotive Buddy Deployment Safety Check\n")

errors = []

# ---------------------------
# 1. Backend entrypoint check
# ---------------------------
if not os.path.exists("backend/main.py"):
    errors.append("❌ Missing backend/main.py (FastAPI entrypoint)")

# ---------------------------
# 2. Requirements check
# ---------------------------
if not os.path.exists("backend/requirements.txt"):
    errors.append("❌ Missing backend/requirements.txt")

# ---------------------------
# 3. DTCEngine file check
# ---------------------------
if not os.path.exists("backend/domain/dtc_engine.py"):
    errors.append("❌ Missing DTCEngine (domain layer)")

# ---------------------------
# 4. Data file check
# ---------------------------
if not os.path.exists("backend/data/dtc_master.json"):
    errors.append("❌ Missing dtc_master.json dataset")

# ---------------------------
# 5. Render config check
# ---------------------------
if not os.path.exists("render.yaml"):
    errors.append("❌ Missing render.yaml (Render deployment config)")

# ---------------------------
# 6. Vercel config check
# ---------------------------
if not os.path.exists("vercel.json"):
    errors.append("❌ Missing vercel.json (Vercel SPA config)")

# ---------------------------
# 7. Frontend env check
# ---------------------------
if os.path.exists(".env"):
    with open(".env", "r") as f:
        content = f.read()
        if "localhost" in content:
            errors.append("❌ Frontend still using localhost in .env (must use production API URL)")

if os.path.exists("frontend/.env"):
    with open("frontend/.env", "r") as f:
        content = f.read()
        if "localhost" in content:
            errors.append("❌ Frontend still using localhost in .env (must use production API URL)")

# ---------------------------
# 8. Backend JSON safety check
# ---------------------------
dtc_engine_path = "backend/domain/dtc_engine.py"
if os.path.exists(dtc_engine_path):
    with open(dtc_engine_path, "r") as f:
        code = f.read()
        if "open(\"dtc_master.json\")" in code:
            errors.append("❌ Unsafe JSON path detected (must use os.path.join for Render compatibility)")

# ---------------------------
# 9. Uvicorn config hint check
# ---------------------------
if os.path.exists("render.yaml"):
    with open("render.yaml", "r") as f:
        if "api.main:app" in f.read():
            errors.append("❌ Wrong uvicorn path detected (should be main:app if using backend root)")

# ---------------------------
# RESULT
# ---------------------------
if errors:
    print("🚨 DEPLOYMENT BLOCKED — FIX ISSUES BELOW:\n")
    for e in errors:
        print(e)
    print("\n❌ DO NOT PUSH TO GITHUB UNTIL FIXED\n")
else:
    print("✅ ALL CHECKS PASSED — SAFE TO DEPLOY 🚀\n")

from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/api/v2/health")
async def health():
    return {"status": "OpenClaw AI Stack v2 Standby"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

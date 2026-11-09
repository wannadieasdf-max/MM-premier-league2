import os
from copy import deepcopy
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List

app = FastAPI(title="MMPL Live Scoring API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

def fresh_state():
    return {
        "teams": [f"Team {i}" for i in range(1, 9)],
        "scores": [
            {"aRuns": 0, "aWkts": 0, "aOvers": "0.0",
             "bRuns": 0, "bWkts": 0, "bOvers": "0.0", "winner": ""}
            for _ in range(7)
        ],
    }

state = fresh_state()
mongo_client = None
collection = None

# Optional MongoDB persistence. If MONGO_URL is configured on Render,
# tournament data survives server restarts and redeployments.
mongo_url = os.getenv("MONGO_URL") or os.getenv("MONGODB_URL")
if mongo_url:
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        mongo_client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        db_name = os.getenv("MONGO_DB_NAME", "mmpl")
        collection = mongo_client[db_name]["tournament"]
    except Exception:
        mongo_client = None
        collection = None

class TournamentState(BaseModel):
    teams: List[str] = Field(min_length=8, max_length=8)
    scores: List[dict] = Field(min_length=7, max_length=7)

@app.get("/")
async def root():
    return {"message": "MMPL Live Scoring API is running", "status": "success", "format": "8 teams, 7 knockout matches"}

@app.get("/api/state")
async def get_state():
    global state
    if collection is not None:
        try:
            doc = await collection.find_one({"_id": "main"})
            if doc and "data" in doc:
                state = doc["data"]
        except Exception:
            pass
    return deepcopy(state)

@app.put("/api/state")
async def save_state(payload: TournamentState):
    global state
    teams = [str(name).strip()[:40] or f"Team {i+1}" for i, name in enumerate(payload.teams)]
    scores = []
    for score in payload.scores:
        scores.append({
            "aRuns": max(0, int(score.get("aRuns", 0))),
            "aWkts": max(0, min(10, int(score.get("aWkts", 0)))),
            "aOvers": str(score.get("aOvers", "0.0"))[:8],
            "bRuns": max(0, int(score.get("bRuns", 0))),
            "bWkts": max(0, min(10, int(score.get("bWkts", 0)))),
            "bOvers": str(score.get("bOvers", "0.0"))[:8],
            "winner": str(score.get("winner", ""))[:40],
        })
    state = {"teams": teams, "scores": scores}
    if collection is not None:
        try:
            await collection.update_one(
                {"_id": "main"},
                {"$set": {"data": state}},
                upsert=True
            )
        except Exception as exc:
            raise HTTPException(status_code=503, detail=f"Database save failed: {exc}")
    return {"status": "success", "message": "Tournament saved", "data": state}

@app.post("/api/reset")
async def reset_state():
    global state
    state = fresh_state()
    if collection is not None:
        try:
            await collection.update_one(
                {"_id": "main"},
                {"$set": {"data": state}},
                upsert=True
            )
        except Exception as exc:
            raise HTTPException(status_code=503, detail=f"Database reset failed: {exc}")
    return {"status": "success", "message": "Tournament reset"}

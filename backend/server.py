from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="MMPL Live Scoring API")

# Allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initial match data
match = {
    "team": "SADEYA",
    "opponent": "KUDWA",
    "runs": 0,
    "wickets": 0,
    "balls": 0,
    "batsman": "Batsman 1",
    "bowler": "Bowler 1",
    "history": []
}


class ScoreUpdate(BaseModel):
    runs: int = 0
    wicket: bool = False
    legal_ball: bool = True


class MatchDetails(BaseModel):
    team: Optional[str] = None
    opponent: Optional[str] = None
    batsman: Optional[str] = None
    bowler: Optional[str] = None


@app.get("/")
def home():
    return {
        "message": "MMPL Live Scoring API is running",
        "status": "success"
    }


@app.get("/api/score")
def get_score():
    return {
        "team": match["team"],
        "opponent": match["opponent"],
        "runs": match["runs"],
        "wickets": match["wickets"],
        "balls": match["balls"],
        "overs": f'{match["balls"] // 6}.{match["balls"] % 6}',
        "batsman": match["batsman"],
        "bowler": match["bowler"]
    }


@app.post("/api/score/update")
def update_score(data: ScoreUpdate):

    if data.runs < 0:
        return {"status": "error", "message": "Invalid runs"}

    match["history"].append({
        "runs": match["runs"],
        "wickets": match["wickets"],
        "balls": match["balls"]
    })

    match["runs"] += data.runs

    if data.wicket:
        match["wickets"] += 1

    if data.legal_ball:
        match["balls"] += 1

    return get_score()


@app.post("/api/match/details")
def update_details(data: MatchDetails):

    for key in ["team", "opponent", "batsman", "bowler"]:
        value = getattr(data, key)
        if value is not None:
            match[key] = value

    return {"status": "success", "match": get_score()}


@app.post("/api/score/undo")
def undo_score():

    if not match["history"]:
        return {"status": "error", "message": "Nothing to undo"}

    previous = match["history"].pop()

    match["runs"] = previous["runs"]
    match["wickets"] = previous["wickets"]
    match["balls"] = previous["balls"]

    return get_score()


@app.post("/api/score/reset")
def reset_score():

    match["runs"] = 0
    match["wickets"] = 0
    match["balls"] = 0
    match["history"] = []

    return {"status": "success", "message": "Score reset"}


@app.get("/api/health")
def health():
    return {"status": "healthy"}

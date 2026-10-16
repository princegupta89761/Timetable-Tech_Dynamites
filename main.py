from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from solver.engine import solve_timetable
from vcs.vcs_engine import TimetableVCS

app = FastAPI(title="Timetable Generator API", version="1.0.0")

# Initialize global VCS instance and default seed dataset
vcs = TimetableVCS()

DEFAULT_SEED_DATA = {
    "teachers": ["Prof. Smith", "Prof. Doe", "Prof. Alan"],
    "rooms": ["Room 101", "Room 102", "Room 103"],
    "batches": ["CS-A", "CS-B", "CS-C"],
    "slots": [1, 2, 3, 4, 5],
    "demands": [
        {"subject": "Data Structures", "teacher": "Prof. Smith", "batch": "CS-A", "lectures_needed": 2},
        {"subject": "Algorithms", "teacher": "Prof. Doe", "batch": "CS-B", "lectures_needed": 2},
        {"subject": "Operating Systems", "teacher": "Prof. Alan", "batch": "CS-C", "lectures_needed": 2}
    ]
}

@app.get("/")
def read_root():
    return {"status": "online", "message": "Timetable generator and VCS backend are running."}

@app.post("/api/generate")
def generate_timetable():
    """Runs the OR-Tools solver and saves the output as a new Git-like commit."""
    result = solve_timetable(DEFAULT_SEED_DATA)
    if result["status"] == "infeasible":
        raise HTTPException(status_code=400, detail={"error": "Infeasible constraints", "reasons": result["reasons"]})
    
    commit = vcs.create_commit(result["timetable"], message="Generated clash-free timetable")
    return {"status": "success", "commit": commit}

@app.get("/api/commits")
def get_commits():
    """Returns all commits recorded in the VCS history."""
    return {"head": vcs.head, "commits": vcs.commits}

class DiffRequest(BaseModel):
    commit_id_1: str
    commit_id_2: str

@app.post("/api/diff")
def compute_commit_diff(req: DiffRequest):
    """Computes plain-English diff between two commits."""
    diff = vcs.compute_diff(req.commit_id_1, req.commit_id_2)
    if "error" in diff:
        raise HTTPException(status_code=404, detail=diff["error"])
    return diff
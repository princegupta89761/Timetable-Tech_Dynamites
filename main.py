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

class EditRequest(BaseModel):
    slot: int
    room: str
    batch: str
    subject: str

@app.post("/api/edit")
def edit_timetable(req: EditRequest):
    """Edits a slot manually. Rejects if it causes a clash."""
    validation = vcs.validate_and_edit(req.slot, req.room, req.batch, req.subject)
    if not validation["valid"]:
        raise HTTPException(status_code=400, detail={"error": "Clash detected", "reason": validation["reason"]})
        
    commit = vcs.create_commit(validation["new_timetable"], message=f"Edited lecture for {req.batch} at Slot {req.slot}")
    return {"status": "success", "commit": commit}

class RevertRequest(BaseModel):
    commit_id: str

@app.post("/api/revert")
def revert_timetable(req: RevertRequest):
    """Reverts the timetable to a specific past commit."""
    result = vcs.revert_to_commit(req.commit_id)
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return {"status": "success", "commit": result}
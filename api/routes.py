"""
api/routes.py
FastAPI router implementing all endpoints in Contract Section 8.
Wires real solver and VCS functions with contract error shapes.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from solver.engine import solve
from vcs import commits
from vcs.commits import ClashError
from vcs.diff import compute_diff
from vcs.validate import validate

router = APIRouter(prefix="/api", tags=["timetable"])

REPO_ROOT = Path(__file__).resolve().parent.parent
SEED_FILE = REPO_ROOT / "data" / "seed.json"


class AppException(Exception):
    def __init__(self, status_code: int, code: str, message: str, details: list[str] | None = None):
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details or []
        super().__init__(message)


# In-memory active problem state initialized from data/seed.json
_current_problem: dict[str, Any] = {}


def load_seed_problem() -> dict[str, Any]:
    global _current_problem
    if SEED_FILE.exists():
        with open(SEED_FILE, "r", encoding="utf-8") as f:
            _current_problem = json.load(f)
    else:
        _current_problem = {
            "config": {"days": [0, 1, 2, 3, 4], "periods": []},
            "teachers": [],
            "rooms": [],
            "batches": [],
            "subjects": [],
            "requirements": [],
            "time_limit_seconds": 10,
        }
    return _current_problem


def get_problem() -> dict[str, Any]:
    global _current_problem
    if not _current_problem:
        load_seed_problem()
    return _current_problem


def set_problem(problem: dict[str, Any]) -> None:
    global _current_problem
    _current_problem = problem


# Pydantic models for request bodies
class GenerateRequest(BaseModel):
    message: str = "Generated clash-free timetable"


class RevertRequest(BaseModel):
    commit_id: str


class SlotKey(BaseModel):
    batch_id: str
    day: int
    period: int


class SlotNew(BaseModel):
    day: int
    period: int
    room_id: str | None = None
    teacher_id: str | None = None


class EditRequest(BaseModel):
    message: str = "Edit timetable slot"
    slot_key: SlotKey
    new: SlotNew


# 1. GET /api/problem
@router.get("/problem")
def get_current_problem() -> dict[str, Any]:
    return get_problem()


# 2. PUT /api/problem
@router.put("/problem")
def replace_current_problem(problem: dict[str, Any]) -> dict[str, Any]:
    set_problem(problem)
    return get_problem()


# 3. POST /api/generate
@router.post("/generate")
def generate_timetable(body: GenerateRequest | None = None) -> dict[str, Any]:
    problem = get_problem()
    msg = body.message if body else "Generated clash-free timetable"

    result = solve(problem)
    status = result.get("status")

    if status == "ok":
        timetable = result.get("timetable", {"slots": []})
        commit = commits.create_commit(
            snapshot=timetable,
            message=msg,
            kind="generate",
        )
        return {"commit": commit}
    elif status == "infeasible":
        raise AppException(
            status_code=400,
            code="INFEASIBLE",
            message="Timetable constraints are infeasible.",
            details=result.get("reasons", []),
        )
    elif status == "timeout":
        raise AppException(
            status_code=400,
            code="TIMEOUT",
            message="Solver timed out without finding a feasible timetable.",
            details=result.get("reasons", []),
        )
    else:
        raise AppException(
            status_code=400,
            code="BAD_REQUEST",
            message=f"Solver returned unexpected status: {status}",
            details=result.get("reasons", []),
        )


# 4. GET /api/timetable
@router.get("/timetable")
def get_head_timetable() -> dict[str, Any]:
    head_id = commits._default_vcs.head
    if not head_id:
        return {"slots": []}
    commit = commits.get_commit(head_id)
    if not commit or "snapshot" not in commit:
        return {"slots": []}
    return commit["snapshot"]


# 5. POST /api/edit
@router.post("/edit")
def edit_slot(body: EditRequest) -> dict[str, Any]:
    problem = get_problem()
    edit_dict = body.model_dump()
    try:
        commit = commits.apply_edit(edit_dict, problem)
        return {"commit": commit}
    except ClashError as ce:
        raise AppException(
            status_code=400,
            code="CLASH",
            message=str(ce),
            details=ce.violations,
        )
    except ValueError as ve:
        raise AppException(
            status_code=400,
            code="BAD_REQUEST",
            message=str(ve),
            details=[],
        )


# 6. GET /api/commits
@router.get("/commits")
def get_commits() -> list[dict[str, Any]]:
    return commits.list_commits()


# 7. GET /api/commits/{id}
@router.get("/commits/{commit_id}")
def get_single_commit(commit_id: str) -> dict[str, Any]:
    commit = commits.get_commit(commit_id)
    if not commit:
        raise AppException(
            status_code=404,
            code="NOT_FOUND",
            message=f"Commit '{commit_id}' not found.",
            details=[],
        )
    return commit


# 8. GET /api/diff?from=c0006&to=c0007
@router.get("/diff")
def diff_commits(
    from_id: str = Query(..., alias="from"),
    to_id: str = Query(..., alias="to"),
) -> dict[str, Any]:
    problem = get_problem()
    try:
        diff_result = compute_diff(
            snap_from=from_id,
            snap_to=to_id,
            problem=problem,
            from_id=from_id,
            to_id=to_id,
            vcs=commits._default_vcs,
        )
        return diff_result
    except ValueError as ve:
        raise AppException(
            status_code=404,
            code="NOT_FOUND",
            message=str(ve),
            details=[],
        )


# 9. POST /api/revert
@router.post("/revert")
def revert_commit(body: RevertRequest) -> dict[str, Any]:
    try:
        commit = commits.revert(body.commit_id)
        return {"commit": commit}
    except ValueError as ve:
        raise AppException(
            status_code=404,
            code="NOT_FOUND",
            message=str(ve),
            details=[],
        )


# 10. GET /api/view?batch=... | teacher=... | room=...
@router.get("/view")
def get_grid_view(
    batch: str | None = None,
    teacher: str | None = None,
    room: str | None = None,
) -> dict[str, Any]:
    # Exactly one filter required
    specified = [x for x in (batch, teacher, room) if x is not None]
    if len(specified) != 1:
        raise AppException(
            status_code=400,
            code="BAD_REQUEST",
            message="Exactly one of 'batch', 'teacher', or 'room' query parameter must be specified.",
            details=[],
        )

    problem = get_problem()
    config = problem.get("config", {})
    days = config.get("days", [0, 1, 2, 3, 4])
    periods = config.get("periods", [])

    day_to_col = {d: col for col, d in enumerate(days)}
    period_to_row = {p["index"]: row for row, p in enumerate(periods)}

    teachers_map = {t["id"]: t.get("name", t["id"]) for t in problem.get("teachers", [])}
    rooms_map = {r["id"]: r.get("name", r["id"]) for r in problem.get("rooms", [])}
    batches_map = {b["id"]: b.get("name", b["id"]) for b in problem.get("batches", [])}
    subjects_map = {s["id"]: s.get("name", s["id"]) for s in problem.get("subjects", [])}

    # Initialize empty grid: grid[period_row][day_col]
    num_rows = len(periods)
    num_cols = len(days)
    grid: list[list[dict[str, Any] | None]] = [[None for _ in range(num_cols)] for _ in range(num_rows)]

    # Fetch slots from HEAD commit
    head_id = commits._default_vcs.head
    head_commit = commits.get_commit(head_id) if head_id else None
    slots = head_commit["snapshot"].get("slots", []) if head_commit else []

    if batch is not None:
        if batch not in batches_map:
            raise AppException(status_code=404, code="NOT_FOUND", message=f"Batch '{batch}' not found.")
        owner = {"type": "batch", "id": batch, "name": batches_map[batch]}
        target_slots = [s for s in slots if s.get("batch_id") == batch]
        for s in target_slots:
            r = period_to_row.get(s.get("period"))
            c = day_to_col.get(s.get("day"))
            if r is not None and c is not None:
                grid[r][c] = {
                    "subject": subjects_map.get(s.get("subject_id"), s.get("subject_id")),
                    "teacher": teachers_map.get(s.get("teacher_id"), s.get("teacher_id")),
                    "room": rooms_map.get(s.get("room_id"), s.get("room_id")),
                }

    elif teacher is not None:
        if teacher not in teachers_map:
            raise AppException(status_code=404, code="NOT_FOUND", message=f"Teacher '{teacher}' not found.")
        owner = {"type": "teacher", "id": teacher, "name": teachers_map[teacher]}
        target_slots = [s for s in slots if s.get("teacher_id") == teacher]
        for s in target_slots:
            r = period_to_row.get(s.get("period"))
            c = day_to_col.get(s.get("day"))
            if r is not None and c is not None:
                grid[r][c] = {
                    "subject": subjects_map.get(s.get("subject_id"), s.get("subject_id")),
                    "batch": batches_map.get(s.get("batch_id"), s.get("batch_id")),
                    "room": rooms_map.get(s.get("room_id"), s.get("room_id")),
                }

    else:
        # room is not None
        if room not in rooms_map:
            raise AppException(status_code=404, code="NOT_FOUND", message=f"Room '{room}' not found.")
        owner = {"type": "room", "id": room, "name": rooms_map[room]}
        target_slots = [s for s in slots if s.get("room_id") == room]
        for s in target_slots:
            r = period_to_row.get(s.get("period"))
            c = day_to_col.get(s.get("day"))
            if r is not None and c is not None:
                grid[r][c] = {
                    "subject": subjects_map.get(s.get("subject_id"), s.get("subject_id")),
                    "batch": batches_map.get(s.get("batch_id"), s.get("batch_id")),
                    "teacher": teachers_map.get(s.get("teacher_id"), s.get("teacher_id")),
                }

    return {"owner": owner, "grid": grid}


# 11. POST /api/seed
@router.post("/seed")
def seed_demo_data() -> dict[str, Any]:
    load_seed_problem()
    return {"ok": True}

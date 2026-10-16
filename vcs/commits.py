"""
vcs/commits.py
Version control layer for timetables per Contract Section 7 & 8.
Stores full snapshots, manages commits, atomic persistence, revert, and validated edits.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
import tempfile
import threading
from datetime import datetime, timezone
from typing import Any

from vcs.validate import validate

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DATA_DIR = REPO_ROOT / "data"
DEFAULT_COMMITS_FILE = DEFAULT_DATA_DIR / "commits.json"


class ClashError(Exception):
    """Raised when an edit violates timetable hard constraints."""

    def __init__(self, message: str, violations: list[str]):
        super().__init__(message)
        self.violations = violations


class VCS:
    """
    Manages Git-style commits for timetables with atomic disk persistence.
    """

    def __init__(self, storage_path: Path | str = DEFAULT_COMMITS_FILE):
        self.storage_path = Path(storage_path)
        self._lock = threading.Lock()
        self.commits: dict[str, dict[str, Any]] = {}
        self.head: str | None = None
        self.counter: int = 1
        self._load()

    def _load(self) -> None:
        """Loads commits from storage. Starts clean if missing or corrupt."""
        with self._lock:
            self.commits = {}
            self.head = None
            self.counter = 1

            if not self.storage_path.exists():
                return

            try:
                with open(self.storage_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if not isinstance(data, dict):
                    return

                raw_commits = data.get("commits", [])
                if isinstance(raw_commits, list):
                    for c in raw_commits:
                        if isinstance(c, dict) and "id" in c:
                            self.commits[c["id"]] = c
                elif isinstance(raw_commits, dict):
                    self.commits = raw_commits

                self.head = data.get("head")
                if self.head not in self.commits and self.commits:
                    # Fallback to last commit if head is invalid
                    self.head = list(self.commits.keys())[-1]

                # Update counter based on highest existing commit id (c0001...)
                max_num = 0
                for cid in self.commits:
                    if cid.startswith("c") and cid[1:].isdigit():
                        max_num = max(max_num, int(cid[1:]))
                self.counter = max_num + 1
            except Exception:
                # Corrupt file starts clean without crashing
                self.commits = {}
                self.head = None
                self.counter = 1

    def _save_unlocked(self) -> None:
        """Atomically saves commits to storage using a temp file + os.replace."""
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "head": self.head,
            "commits": list(self.commits.values()),
        }

        temp_dir = self.storage_path.parent
        with tempfile.NamedTemporaryFile("w", dir=temp_dir, delete=False, encoding="utf-8") as tf:
            temp_path = Path(tf.name)
            json.dump(payload, tf, indent=2)
            tf.flush()
            os.fsync(tf.fileno())

        os.replace(temp_path, self.storage_path)

    def create_commit(
        self,
        snapshot: dict[str, Any],
        message: str,
        kind: str = "generate",
        author: str = "system",
        branch: str = "main",
        parent_id: str | None = ...,  # type: ignore
    ) -> dict[str, Any]:
        """
        Creates and persists a new commit with the given timetable snapshot.
        """
        with self._lock:
            cid = f"c{self.counter:04d}"
            actual_parent = self.head if parent_id is ... else parent_id

            # Ensure slots in snapshot are deterministically sorted
            sorted_slots = list(snapshot.get("slots", []))
            sorted_slots.sort(key=lambda s: (s.get("batch_id", ""), s.get("day", 0), s.get("period", 0)))
            clean_snapshot = {"slots": sorted_slots}

            commit_record = {
                "id": cid,
                "parent_id": actual_parent,
                "branch": branch,
                "message": message,
                "author": author,
                "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                "kind": kind,
                "snapshot": clean_snapshot,
            }

            self.commits[cid] = commit_record
            self.head = cid
            self.counter += 1
            self._save_unlocked()
            return commit_record

    def get_commit(self, commit_id: str) -> dict[str, Any] | None:
        """Returns the full commit with snapshot, or None if not found."""
        with self._lock:
            commit = self.commits.get(commit_id)
            if commit:
                # Return deep copy so caller cannot mutate stored commit
                return json.loads(json.dumps(commit))
            return None

    def list_commits(self, branch: str = "main") -> list[dict[str, Any]]:
        """
        Returns commit summaries without snapshots, newest first.
        """
        with self._lock:
            filtered = [
                {k: v for k, v in c.items() if k != "snapshot"}
                for c in self.commits.values()
                if branch is None or c.get("branch") == branch
            ]
            # Newest first
            filtered.reverse()
            return filtered

    def revert(
        self,
        commit_id: str,
        author: str = "system",
        branch: str = "main",
        message: str | None = None,
    ) -> dict[str, Any]:
        """
        Reverts to a previous commit by creating a NEW commit with the target snapshot.
        History is never rewritten.
        """
        with self._lock:
            target = self.commits.get(commit_id)
            if not target:
                raise ValueError(f"Cannot revert: commit {commit_id} not found.")

            rev_message = message or f"Revert to commit {commit_id}"
            snapshot_copy = json.loads(json.dumps(target["snapshot"]))

        # create_commit acquires lock internally
        return self.create_commit(
            snapshot=snapshot_copy,
            message=rev_message,
            kind="revert",
            author=author,
            branch=branch,
        )

    def apply_edit(
        self,
        edit: dict[str, Any],
        problem: dict[str, Any],
        author: str = "system",
        branch: str = "main",
    ) -> dict[str, Any]:
        """
        Applies a validated edit to the current HEAD timetable snapshot per Contract Section 8.
        If the slot is part of a 2-period block, moves the whole block (new.period = block start).
        Validates FIRST with validate(); on violation raises ClashError and creates NO commit.
        """
        with self._lock:
            if not self.head or self.head not in self.commits:
                raise ValueError("No active commit at HEAD. Cannot apply edit.")

            head_commit = self.commits[self.head]
            current_slots = [dict(s) for s in head_commit["snapshot"].get("slots", [])]

        slot_key = edit.get("slot_key", {})
        target_batch = slot_key.get("batch_id")
        target_day = slot_key.get("day")
        target_period = slot_key.get("period")

        new_data = edit.get("new", {})
        new_day = new_data.get("day")
        new_period = new_data.get("period")
        new_room_id = new_data.get("room_id")
        new_teacher_id = new_data.get("teacher_id")

        if new_day is None or new_period is None:
            raise ValueError("Edit 'new' specification must include 'day' and 'period'.")

        # Locate the slot to edit
        target_idx = None
        for i, s in enumerate(current_slots):
            if s.get("batch_id") == target_batch and s.get("day") == target_day and s.get("period") == target_period:
                target_idx = i
                break

        if target_idx is None:
            raise ValueError(
                f"Slot not found for batch {target_batch} at Day {target_day}, Period {target_period}."
            )

        target_slot = current_slots[target_idx]
        req_id = target_slot.get("requirement_id")

        # Check if requirement is part of a 2-period block
        requirements = {q["id"]: q for q in problem.get("requirements", [])}
        req = requirements.get(req_id, {})
        block_size = req.get("block_size", 1)

        updated_slots = [dict(s) for s in current_slots]

        if block_size == 2:
            # Find the block's slots (all slots with this req_id on target_day and same room)
            block_indices = [
                i
                for i, s in enumerate(updated_slots)
                if s.get("requirement_id") == req_id
                and s.get("day") == target_day
                and s.get("room_id") == target_slot.get("room_id")
            ]
            if len(block_indices) != 2:
                # Fallback: find any slots with same req_id and batch_id on target_day
                block_indices = [
                    i
                    for i, s in enumerate(updated_slots)
                    if s.get("requirement_id") == req_id and s.get("day") == target_day
                ]

            block_indices.sort(key=lambda idx: updated_slots[idx]["period"])
            # Move whole block: first slot at new_period, second slot at new_period + 1
            for offset, idx in enumerate(block_indices):
                slot_to_update = updated_slots[idx]
                slot_to_update["day"] = new_day
                slot_to_update["period"] = new_period + offset
                if new_room_id is not None:
                    slot_to_update["room_id"] = new_room_id
                if new_teacher_id is not None:
                    slot_to_update["teacher_id"] = new_teacher_id
        else:
            # Single-period lecture
            slot_to_update = updated_slots[target_idx]
            slot_to_update["day"] = new_day
            slot_to_update["period"] = new_period
            if new_room_id is not None:
                slot_to_update["room_id"] = new_room_id
            if new_teacher_id is not None:
                slot_to_update["teacher_id"] = new_teacher_id

        # Sort slots deterministically
        updated_slots.sort(key=lambda s: (s.get("batch_id", ""), s.get("day", 0), s.get("period", 0)))
        candidate_timetable = {"slots": updated_slots}

        # Run validate FIRST
        violations = validate(candidate_timetable, problem)
        if violations:
            raise ClashError(
                f"Clash or validation error: {'; '.join(violations)}",
                violations=violations,
            )

        # Create commit only if completely valid
        commit_message = edit.get("message", f"Edit slot for {target_batch}")
        return self.create_commit(
            snapshot=candidate_timetable,
            message=commit_message,
            kind="edit",
            author=author,
            branch=branch,
        )


# Global default instance
_default_vcs = VCS()


def create_commit(
    snapshot: dict[str, Any],
    message: str,
    kind: str = "generate",
    author: str = "system",
    branch: str = "main",
    parent_id: str | None = ...,  # type: ignore
) -> dict[str, Any]:
    return _default_vcs.create_commit(
        snapshot=snapshot,
        message=message,
        kind=kind,
        author=author,
        branch=branch,
        parent_id=parent_id,
    )


def get_commit(commit_id: str) -> dict[str, Any] | None:
    return _default_vcs.get_commit(commit_id)


def list_commits(branch: str = "main") -> list[dict[str, Any]]:
    return _default_vcs.list_commits(branch=branch)


def revert(
    commit_id: str,
    author: str = "system",
    branch: str = "main",
    message: str | None = None,
) -> dict[str, Any]:
    return _default_vcs.revert(commit_id, author=author, branch=branch, message=message)


def apply_edit(
    edit: dict[str, Any],
    problem: dict[str, Any],
    author: str = "system",
    branch: str = "main",
) -> dict[str, Any]:
    return _default_vcs.apply_edit(edit, problem, author=author, branch=branch)

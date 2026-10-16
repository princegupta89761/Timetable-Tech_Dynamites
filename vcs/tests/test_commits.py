import json
from pathlib import Path
import pytest

from vcs.commits import VCS, ClashError


@pytest.fixture
def sample_problem():
    return {
        "config": {
            "days": [0, 1, 2, 3, 4],
            "periods": [
                {"index": 0, "label": "09:00-10:00"},
                {"index": 1, "label": "10:00-11:00"},
                {"index": 2, "label": "11:15-12:15"},
                {"index": 3, "label": "12:15-13:15"},
                {"index": 4, "label": "14:00-15:00"},
                {"index": 5, "label": "15:00-16:00"},
            ],
        },
        "teachers": [
            {"id": "t1", "name": "Prof. Sharma", "unavailable": [{"day": 2, "period": 4}], "max_per_day": 4},
            {"id": "t2", "name": "Prof. Rao", "unavailable": [], "max_per_day": 4},
        ],
        "rooms": [
            {"id": "r101", "name": "Room 101", "capacity": 60, "type": "classroom"},
            {"id": "r102", "name": "Room 102", "capacity": 60, "type": "classroom"},
            {"id": "l201", "name": "Lab 201", "capacity": 60, "type": "lab"},
        ],
        "batches": [
            {"id": "b1", "name": "SE-A", "size": 50},
            {"id": "b2", "name": "SE-B", "size": 50},
        ],
        "subjects": [
            {"id": "s_dbms", "name": "DBMS", "room_type": "classroom"},
            {"id": "s_os", "name": "OS", "room_type": "classroom"},
            {"id": "s_lab", "name": "DBMS Lab", "room_type": "lab"},
        ],
        "requirements": [
            {"id": "q1", "batch_id": "b1", "subject_id": "s_dbms", "teacher_id": "t1", "lectures_per_week": 2, "block_size": 1},
            {"id": "q2", "batch_id": "b2", "subject_id": "s_os", "teacher_id": "t2", "lectures_per_week": 1, "block_size": 1},
            {"id": "q_block", "batch_id": "b1", "subject_id": "s_lab", "teacher_id": "t1", "lectures_per_week": 2, "block_size": 2},
        ],
    }


@pytest.fixture
def initial_timetable():
    return {
        "slots": [
            {"batch_id": "b1", "day": 1, "period": 0, "subject_id": "s_dbms", "teacher_id": "t1", "room_id": "r101", "requirement_id": "q1"},
            {"batch_id": "b1", "day": 2, "period": 0, "subject_id": "s_dbms", "teacher_id": "t1", "room_id": "r101", "requirement_id": "q1"},
            {"batch_id": "b2", "day": 1, "period": 0, "subject_id": "s_os", "teacher_id": "t2", "room_id": "r102", "requirement_id": "q2"},
            # Lab block of 2: day 3 periods 0 and 1
            {"batch_id": "b1", "day": 3, "period": 0, "subject_id": "s_lab", "teacher_id": "t1", "room_id": "l201", "requirement_id": "q_block"},
            {"batch_id": "b1", "day": 3, "period": 1, "subject_id": "s_lab", "teacher_id": "t1", "room_id": "l201", "requirement_id": "q_block"},
        ]
    }


def test_commit_creation_and_listing(tmp_path, initial_timetable):
    file_path = tmp_path / "commits.json"
    vcs = VCS(storage_path=file_path)

    c1 = vcs.create_commit(initial_timetable, message="Initial generate", kind="generate", author="demolisher")
    assert c1["id"] == "c0001"
    assert c1["parent_id"] is None
    assert c1["kind"] == "generate"
    assert len(c1["snapshot"]["slots"]) == 5

    c2 = vcs.create_commit(initial_timetable, message="Second commit", kind="edit")
    assert c2["id"] == "c0002"
    assert c2["parent_id"] == "c0001"

    # list_commits returns newest first without snapshots
    summaries = vcs.list_commits()
    assert len(summaries) == 2
    assert summaries[0]["id"] == "c0002"
    assert summaries[1]["id"] == "c0001"
    assert "snapshot" not in summaries[0]

    # get_commit returns full commit
    full_c1 = vcs.get_commit("c0001")
    assert full_c1 is not None
    assert "snapshot" in full_c1
    assert full_c1["id"] == "c0001"


def test_persistence_reload(tmp_path, initial_timetable):
    file_path = tmp_path / "commits.json"
    vcs1 = VCS(storage_path=file_path)
    vcs1.create_commit(initial_timetable, message="Commit 1")
    vcs1.create_commit(initial_timetable, message="Commit 2")
    assert vcs1.head == "c0002"

    # Reload from disk into a new VCS instance
    vcs2 = VCS(storage_path=file_path)
    assert vcs2.head == "c0002"
    assert len(vcs2.list_commits()) == 2
    c3 = vcs2.create_commit(initial_timetable, message="Commit 3")
    assert c3["id"] == "c0003"
    assert c3["parent_id"] == "c0002"


def test_revert_keeps_history(tmp_path, initial_timetable):
    file_path = tmp_path / "commits.json"
    vcs = VCS(storage_path=file_path)

    # c0001 has 5 slots
    c1 = vcs.create_commit(initial_timetable, message="Generate")

    # c0002 modified snapshot with 4 slots (drop last slot)
    mod_snapshot = {"slots": initial_timetable["slots"][:4]}
    c2 = vcs.create_commit(mod_snapshot, message="Removed a slot", kind="edit")

    # Revert to c0001
    c3 = vcs.revert("c0001")
    assert c3["id"] == "c0003"
    assert c3["parent_id"] == "c0002"
    assert c3["kind"] == "revert"
    # c0003 has restored the 5 slots from c0001
    assert len(c3["snapshot"]["slots"]) == 5

    # History is strictly preserved: c0001, c0002, c0003 all exist
    assert vcs.get_commit("c0001") is not None
    assert vcs.get_commit("c0002") is not None
    assert vcs.get_commit("c0003") is not None
    history = vcs.list_commits()
    assert [c["id"] for c in history] == ["c0003", "c0002", "c0001"]


def test_clashing_edit_rejected_with_no_commit(tmp_path, initial_timetable, sample_problem):
    file_path = tmp_path / "commits.json"
    vcs = VCS(storage_path=file_path)
    vcs.create_commit(initial_timetable, message="Base generation")
    assert vcs.head == "c0001"

    # Move b1's DBMS lecture at Day 1 Period 0 to Room 102 where b2 is already having OS with Teacher Rao!
    # That causes a room clash with b2 in Room 102 at Day 1 Period 0
    edit_payload = {
        "message": "Clashing move",
        "slot_key": {"batch_id": "b1", "day": 1, "period": 0},
        "new": {"day": 1, "period": 0, "room_id": "r102"},
    }

    with pytest.raises(ClashError) as exc_info:
        vcs.apply_edit(edit_payload, sample_problem)

    assert "Room clash" in str(exc_info.value)
    # Ensure NO commit was created
    assert vcs.head == "c0001"
    assert len(vcs.list_commits()) == 1


def test_block_edit_moves_both_periods(tmp_path, initial_timetable, sample_problem):
    file_path = tmp_path / "commits.json"
    vcs = VCS(storage_path=file_path)
    vcs.create_commit(initial_timetable, message="Base generation")

    # The DBMS lab block is at Day 3, Periods 0 and 1 in l201.
    # Target one period of the block: Day 3 Period 1.
    # Move block to Day 4, Period 2.
    edit_payload = {
        "message": "Move lab block",
        "slot_key": {"batch_id": "b1", "day": 3, "period": 1},
        "new": {"day": 4, "period": 2},
    }

    c2 = vcs.apply_edit(edit_payload, sample_problem)
    assert c2["id"] == "c0002"
    assert c2["kind"] == "edit"

    # Verify both periods of the block moved to Day 4, Periods 2 and 3!
    lab_slots = [
        s for s in c2["snapshot"]["slots"]
        if s["requirement_id"] == "q_block"
    ]
    assert len(lab_slots) == 2
    assert {s["day"] for s in lab_slots} == {4}
    assert {s["period"] for s in lab_slots} == {2, 3}
    assert {s["room_id"] for s in lab_slots} == {"l201"}


def test_corrupt_file_starts_clean(tmp_path):
    file_path = tmp_path / "commits.json"
    # Write garbage JSON
    file_path.write_text("{ this is not valid json !!!", encoding="utf-8")

    vcs = VCS(storage_path=file_path)
    assert vcs.head is None
    assert vcs.list_commits() == []
    assert vcs.counter == 1

    # Should be able to commit normally
    c1 = vcs.create_commit({"slots": []}, message="Fresh start")
    assert c1["id"] == "c0001"
    assert vcs.head == "c0001"

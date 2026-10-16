import pytest
from vcs.diff import compute_diff
from vcs.commits import VCS


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
            {"id": "t01", "name": "Prof. Sharma", "unavailable": [], "max_per_day": 4},
            {"id": "t02", "name": "Prof. Rao", "unavailable": [], "max_per_day": 4},
            {"id": "t03", "name": "Prof. Iyer", "unavailable": [], "max_per_day": 4},
        ],
        "rooms": [
            {"id": "r204", "name": "Room 204", "capacity": 60, "type": "classroom"},
            {"id": "r101", "name": "Room 101", "capacity": 60, "type": "classroom"},
            {"id": "r301", "name": "Room 301", "capacity": 60, "type": "classroom"},
        ],
        "batches": [
            {"id": "b_se_a", "name": "SE-A", "size": 55},
            {"id": "b_te_b", "name": "TE-B", "size": 50},
        ],
        "subjects": [
            {"id": "s_dbms", "name": "DBMS", "room_type": "classroom"},
            {"id": "s_os", "name": "OS", "room_type": "classroom"},
            {"id": "s_math", "name": "Maths", "room_type": "classroom"},
        ],
        "requirements": [
            {"id": "q01", "batch_id": "b_se_a", "subject_id": "s_dbms", "teacher_id": "t01", "lectures_per_week": 2, "block_size": 1},
            {"id": "q02", "batch_id": "b_te_b", "subject_id": "s_os", "teacher_id": "t02", "lectures_per_week": 1, "block_size": 1},
            {"id": "q03", "batch_id": "b_se_a", "subject_id": "s_math", "teacher_id": "t03", "lectures_per_week": 1, "block_size": 1},
        ],
    }


def test_bug_case_two_lectures_same_subject_one_moves(sample_problem):
    """
    Exposes the bug from vcs_engine.py:
    Subject DBMS has 2 lectures per week for batch SE-A.
    In snapshot 1:
      Lecture 1: Mon 09:00 Room 204
      Lecture 2: Tue 11:15 Room 204
    In snapshot 2:
      Lecture 1: Mon 09:00 Room 204 (unchanged)
      Lecture 2: Wed 14:00 Room 101 (moved!)

    vcs_engine collapsed both into (batch, subject) key, failing to detect or corrupting the diff.
    vcs.diff must report exactly 1 moved lecture with correct plain-English text.
    """
    snap1 = {
        "slots": [
            {"batch_id": "b_se_a", "day": 0, "period": 0, "subject_id": "s_dbms", "teacher_id": "t01", "room_id": "r204", "requirement_id": "q01"},
            {"batch_id": "b_se_a", "day": 1, "period": 2, "subject_id": "s_dbms", "teacher_id": "t01", "room_id": "r204", "requirement_id": "q01"},
        ]
    }
    snap2 = {
        "slots": [
            {"batch_id": "b_se_a", "day": 0, "period": 0, "subject_id": "s_dbms", "teacher_id": "t01", "room_id": "r204", "requirement_id": "q01"},
            {"batch_id": "b_se_a", "day": 2, "period": 4, "subject_id": "s_dbms", "teacher_id": "t01", "room_id": "r101", "requirement_id": "q01"},
        ]
    }

    diff = compute_diff(snap1, snap2, sample_problem, from_id="c0001", to_id="c0002")

    assert diff["from"] == "c0001"
    assert diff["to"] == "c0002"
    assert diff["summary"]["moved"] == 1
    assert diff["summary"]["added"] == 0
    assert diff["summary"]["removed"] == 0
    assert len(diff["changes"]) == 1

    change = diff["changes"][0]
    assert change["type"] == "moved"
    assert change["batch_id"] == "b_se_a"
    assert change["requirement_id"] == "q01"
    assert change["from"] == {"day": 1, "period": 2, "room_id": "r204"}
    assert change["to"] == {"day": 2, "period": 4, "room_id": "r101"}
    # Verify plain-English text matches contract section 7
    expected_text = "SE-A DBMS (Prof. Sharma): Tue 11:15 Room 204 -> Wed 14:00 Room 101"
    assert change["text"] == expected_text


def test_diff_added_and_removed(sample_problem):
    snap1 = {
        "slots": [
            # Maths to be removed
            {"batch_id": "b_se_a", "day": 0, "period": 0, "subject_id": "s_math", "teacher_id": "t03", "room_id": "r204", "requirement_id": "q03"},
        ]
    }
    snap2 = {
        "slots": [
            # OS to be added
            {"batch_id": "b_te_b", "day": 3, "period": 1, "subject_id": "s_os", "teacher_id": "t02", "room_id": "r301", "requirement_id": "q02"},
        ]
    }

    diff = compute_diff(snap1, snap2, sample_problem)
    assert diff["summary"]["removed"] == 1
    assert diff["summary"]["added"] == 1
    assert diff["summary"]["moved"] == 0

    texts = [c["text"] for c in diff["changes"]]
    assert any("Removed: SE-A Maths (Prof. Iyer) Mon 09:00 Room 204" in t for t in texts)
    assert any("Added: TE-B OS (Prof. Rao) Thu 10:00 Room 301" in t for t in texts)


def test_diff_changed_room_same_time(sample_problem):
    snap1 = {
        "slots": [
            {"batch_id": "b_se_a", "day": 0, "period": 0, "subject_id": "s_dbms", "teacher_id": "t01", "room_id": "r204", "requirement_id": "q01"},
        ]
    }
    snap2 = {
        "slots": [
            {"batch_id": "b_se_a", "day": 0, "period": 0, "subject_id": "s_dbms", "teacher_id": "t01", "room_id": "r101", "requirement_id": "q01"},
        ]
    }

    diff = compute_diff(snap1, snap2, sample_problem)
    assert diff["summary"]["changed"] == 1
    assert diff["changes"][0]["type"] == "changed"
    assert "Room 204 -> Room 101" in diff["changes"][0]["text"]


def test_diff_via_commit_ids(tmp_path, sample_problem):
    file_path = tmp_path / "commits.json"
    vcs = VCS(storage_path=file_path)

    snap1 = {
        "slots": [
            {"batch_id": "b_se_a", "day": 1, "period": 2, "subject_id": "s_dbms", "teacher_id": "t01", "room_id": "r204", "requirement_id": "q01"},
        ]
    }
    snap2 = {
        "slots": [
            {"batch_id": "b_se_a", "day": 2, "period": 4, "subject_id": "s_dbms", "teacher_id": "t01", "room_id": "r101", "requirement_id": "q01"},
        ]
    }

    c1 = vcs.create_commit(snap1, message="Initial")
    c2 = vcs.create_commit(snap2, message="Moved")

    diff = compute_diff(c1["id"], c2["id"], sample_problem, vcs=vcs)
    assert diff["from"] == c1["id"]
    assert diff["to"] == c2["id"]
    assert diff["summary"]["moved"] == 1
    assert "SE-A DBMS (Prof. Sharma): Tue 11:15 Room 204 -> Wed 14:00 Room 101" in diff["changes"][0]["text"]

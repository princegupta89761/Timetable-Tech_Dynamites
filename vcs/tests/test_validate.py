import pytest
from vcs.validate import validate


@pytest.fixture
def base_problem():
    return {
        "config": {
            "days": [0, 1, 2, 3, 4],
            "periods": [
                {"index": 0, "label": "09:00-10:00"},
                {"index": 1, "label": "10:00-11:00"},
                {"index": 2, "label": "11:15-12:15"},
                {"index": 3, "label": "12:15-13:15"},
            ],
        },
        "teachers": [
            {"id": "t1", "name": "Prof. One", "unavailable": [{"day": 0, "period": 3}], "max_per_day": 2},
            {"id": "t2", "name": "Prof. Two", "unavailable": [], "max_per_day": 3},
        ],
        "rooms": [
            {"id": "r101", "name": "Room 101", "capacity": 60, "type": "classroom"},
            {"id": "r102", "name": "Room 102", "capacity": 30, "type": "classroom"},
            {"id": "l201", "name": "Lab 201", "capacity": 50, "type": "lab"},
        ],
        "batches": [
            {"id": "b1", "name": "Batch A", "size": 40},
            {"id": "b2", "name": "Batch B", "size": 25},
        ],
        "subjects": [
            {"id": "s_math", "name": "Maths", "room_type": "classroom"},
            {"id": "s_phy", "name": "Physics", "room_type": "classroom"},
            {"id": "s_cs_lab", "name": "CS Lab", "room_type": "lab"},
        ],
        "requirements": [
            {"id": "q1", "batch_id": "b1", "subject_id": "s_math", "teacher_id": "t1", "lectures_per_week": 2, "block_size": 1},
            {"id": "q2", "batch_id": "b2", "subject_id": "s_phy", "teacher_id": "t2", "lectures_per_week": 1, "block_size": 1},
            {"id": "q3", "batch_id": "b2", "subject_id": "s_cs_lab", "teacher_id": "t2", "lectures_per_week": 2, "block_size": 2},
        ],
    }


@pytest.fixture
def valid_timetable():
    return {
        "slots": [
            # q1: b1, s_math, t1, 2 slots
            {"batch_id": "b1", "day": 0, "period": 0, "subject_id": "s_math", "teacher_id": "t1", "room_id": "r101", "requirement_id": "q1"},
            {"batch_id": "b1", "day": 1, "period": 0, "subject_id": "s_math", "teacher_id": "t1", "room_id": "r101", "requirement_id": "q1"},
            # q2: b2, s_phy, t2, 1 slot
            {"batch_id": "b2", "day": 0, "period": 1, "subject_id": "s_phy", "teacher_id": "t2", "room_id": "r102", "requirement_id": "q2"},
            # q3: b2, s_cs_lab, t2, 2 slots (block_size 2, consecutive at period 0 and 1 on day 2 in lab)
            {"batch_id": "b2", "day": 2, "period": 0, "subject_id": "s_cs_lab", "teacher_id": "t2", "room_id": "l201", "requirement_id": "q3"},
            {"batch_id": "b2", "day": 2, "period": 1, "subject_id": "s_cs_lab", "teacher_id": "t2", "room_id": "l201", "requirement_id": "q3"},
        ]
    }


def test_valid_timetable_passes(valid_timetable, base_problem):
    violations = validate(valid_timetable, base_problem)
    assert violations == []


def test_constraint_1_batch_clash(valid_timetable, base_problem):
    tt = {"slots": [dict(s) for s in valid_timetable["slots"]]}
    # Move second slot of b1 to day 0 period 0 (where b1 already has a lecture)
    tt["slots"][1]["day"] = 0
    tt["slots"][1]["period"] = 0
    violations = validate(tt, base_problem)
    assert any("Batch clash" in v and "Batch A" in v for v in violations)


def test_constraint_2_teacher_clash(valid_timetable, base_problem):
    tt = {"slots": [dict(s) for s in valid_timetable["slots"]]}
    # Slot 0 has t1 at day 0 period 0; make slot 2 (which has t2 at day 0 period 1) into t1 at period 0
    tt["slots"][2]["period"] = 0
    tt["slots"][2]["teacher_id"] = "t1"
    violations = validate(tt, base_problem)
    assert any("Teacher clash" in v and "Prof. One" in v for v in violations)


def test_constraint_3_room_clash(valid_timetable, base_problem):
    tt = {"slots": [dict(s) for s in valid_timetable["slots"]]}
    # Slot 0 is in r101 at day 0 period 0; move slot 2 (at day 0 period 1) to day 0 period 0 in r101
    tt["slots"][2]["day"] = 0
    tt["slots"][2]["period"] = 0
    tt["slots"][2]["room_id"] = "r101"
    violations = validate(tt, base_problem)
    assert any("Room clash" in v and "Room 101" in v for v in violations)


def test_constraint_4_room_fit_capacity(valid_timetable, base_problem):
    tt = {"slots": [dict(s) for s in valid_timetable["slots"]]}
    # Batch b1 has size 40. Room r102 has capacity 30.
    tt["slots"][0]["room_id"] = "r102"
    violations = validate(tt, base_problem)
    assert any("Room fit capacity violation" in v and "Room 102" in v for v in violations)


def test_constraint_4_room_fit_type(valid_timetable, base_problem):
    tt = {"slots": [dict(s) for s in valid_timetable["slots"]]}
    # Subject s_cs_lab requires type 'lab', but assign room r101 (classroom)
    tt["slots"][3]["room_id"] = "r101"
    violations = validate(tt, base_problem)
    assert any("Room fit type mismatch" in v for v in violations)


def test_constraint_5_teacher_availability(valid_timetable, base_problem):
    tt = {"slots": [dict(s) for s in valid_timetable["slots"]]}
    # Teacher t1 is unavailable at Day 0, Period 3
    tt["slots"][0]["day"] = 0
    tt["slots"][0]["period"] = 3
    violations = validate(tt, base_problem)
    assert any("Teacher availability violation" in v and "Prof. One" in v for v in violations)


def test_constraint_6_teacher_max_per_day(valid_timetable, base_problem):
    tt = {"slots": [dict(s) for s in valid_timetable["slots"]]}
    # Teacher t1 has max_per_day = 2. Add an extra slot for t1 on Day 0
    extra = {
        "batch_id": "b1",
        "day": 0,
        "period": 2,
        "subject_id": "s_math",
        "teacher_id": "t1",
        "room_id": "r101",
        "requirement_id": "q1",
    }
    # Also move slot 1 to Day 0 Period 1
    tt["slots"][1]["day"] = 0
    tt["slots"][1]["period"] = 1
    tt["slots"].append(extra)
    violations = validate(tt, base_problem)
    assert any("Teacher max_per_day violation" in v and "Prof. One" in v for v in violations)


def test_constraint_7_coverage(valid_timetable, base_problem):
    tt = {"slots": [dict(s) for s in valid_timetable["slots"]]}
    # Drop one slot of q1 (expected 2, now 1)
    tt["slots"] = tt["slots"][1:]
    violations = validate(tt, base_problem)
    assert any("Coverage violation" in v and "q1" in v for v in violations)


def test_constraint_8_blocks_non_consecutive(valid_timetable, base_problem):
    tt = {"slots": [dict(s) for s in valid_timetable["slots"]]}
    # q3 has block_size 2 at day 2 periods 0 and 1. Change period 1 to period 3
    tt["slots"][4]["period"] = 3
    violations = validate(tt, base_problem)
    assert any("Block violation" in v for v in violations)

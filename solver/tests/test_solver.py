import pytest
from solver.engine import solve


def independent_check(timetable: dict, problem: dict) -> list[str]:
    """
    Independent clash and constraint checker verifying constraints 1-8 directly from contract.md:
    1. Batch clash: a batch has at most one slot per (day, period).
    2. Teacher clash: a teacher has at most one slot per (day, period), across all batches.
    3. Room clash: a room has at most one slot per (day, period), across all batches.
    4. Room fit: room.capacity >= batch.size and room.type == subject.room_type.
    5. Teacher availability: no slot falls in a teacher's unavailable list.
    6. Teacher max per day: respect teacher.max_per_day.
    7. Coverage: each requirement gets exactly lectures_per_week slots.
    8. Blocks: a block_size: 2 requirement occupies two consecutive periods on the same day in the same room.
    """
    violations = []
    if not timetable or "slots" not in timetable:
        return ["Timetable missing or has no slots."]

    slots = timetable["slots"]

    teachers = {t["id"]: t for t in problem.get("teachers", [])}
    rooms = {r["id"]: r for r in problem.get("rooms", [])}
    batches = {b["id"]: b for b in problem.get("batches", [])}
    subjects = {s["id"]: s for s in problem.get("subjects", [])}
    requirements = {q["id"]: q for q in problem.get("requirements", [])}

    # 1. Batch clash
    batch_slots = {}
    for s in slots:
        key = (s["batch_id"], s["day"], s["period"])
        if key in batch_slots:
            violations.append(f"Batch clash: batch {s['batch_id']} has duplicate slots at day {s['day']}, period {s['period']}.")
        batch_slots[key] = s

    # 2. Teacher clash
    teacher_slots = {}
    for s in slots:
        key = (s["teacher_id"], s["day"], s["period"])
        if key in teacher_slots:
            violations.append(f"Teacher clash: teacher {s['teacher_id']} has multiple slots at day {s['day']}, period {s['period']}.")
        teacher_slots[key] = s

    # 3. Room clash
    room_slots = {}
    for s in slots:
        key = (s["room_id"], s["day"], s["period"])
        if key in room_slots:
            violations.append(f"Room clash: room {s['room_id']} has multiple slots at day {s['day']}, period {s['period']}.")
        room_slots[key] = s

    # 4. Room fit
    for s in slots:
        batch = batches.get(s["batch_id"])
        room = rooms.get(s["room_id"])
        subject = subjects.get(s["subject_id"])

        if not batch or not room or not subject:
            violations.append(f"Slot references invalid entity: {s}")
            continue

        if room.get("capacity", 0) < batch.get("size", 0):
            violations.append(
                f"Room fit violation: Room {s['room_id']} capacity {room.get('capacity')} < Batch {s['batch_id']} size {batch.get('size')}."
            )
        if room.get("type") != subject.get("room_type"):
            violations.append(
                f"Room type mismatch: Room {s['room_id']} type '{room.get('type')}' != Subject {s['subject_id']} room_type '{subject.get('room_type')}'."
            )

    # 5. Teacher availability
    for s in slots:
        t = teachers.get(s["teacher_id"])
        if t:
            unavail = {(u["day"], u["period"]) for u in t.get("unavailable", [])}
            if (s["day"], s["period"]) in unavail:
                violations.append(
                    f"Teacher availability violation: Teacher {s['teacher_id']} is unavailable at day {s['day']}, period {s['period']}."
                )

    # 6. Teacher max_per_day
    teacher_day_counts = {}
    for s in slots:
        key = (s["teacher_id"], s["day"])
        teacher_day_counts[key] = teacher_day_counts.get(key, 0) + 1

    for (t_id, d), count in teacher_day_counts.items():
        t = teachers.get(t_id)
        if t and t.get("max_per_day") is not None:
            max_pd = t["max_per_day"]
            if count > max_pd:
                violations.append(
                    f"Teacher max_per_day violation: Teacher {t_id} scheduled for {count} slots on day {d}, exceeding max {max_pd}."
                )

    # 7. Coverage
    req_counts = {}
    for s in slots:
        qid = s["requirement_id"]
        req_counts[qid] = req_counts.get(qid, 0) + 1

    for qid, q in requirements.items():
        expected = q.get("lectures_per_week", 0)
        actual = req_counts.get(qid, 0)
        if actual != expected:
            violations.append(
                f"Coverage violation: Requirement {qid} expected {expected} slots, got {actual}."
            )

    # 8. Blocks
    for qid, q in requirements.items():
        bsize = q.get("block_size", 1)
        if bsize == 2:
            q_slots = [s for s in slots if s["requirement_id"] == qid]
            # Group slots by (day, room_id)
            day_room_groups = {}
            for s in q_slots:
                day_room_groups.setdefault((s["day"], s["room_id"]), []).append(s["period"])

            # Every block of 2 must be 2 consecutive periods
            for (day, room_id), periods in day_room_groups.items():
                sorted_p = sorted(periods)
                if len(sorted_p) % 2 != 0:
                    violations.append(
                        f"Block violation: Requirement {qid} has non-even period count {len(sorted_p)} on day {day} in room {room_id}."
                    )
                for i in range(0, len(sorted_p), 2):
                    if i + 1 < len(sorted_p):
                        if sorted_p[i + 1] != sorted_p[i] + 1:
                            violations.append(
                                f"Block violation: Requirement {qid} periods on day {day} are not consecutive: {sorted_p[i]} and {sorted_p[i+1]}."
                            )

    return violations


def test_seeded_dataset_small():
    problem = {
        "config": {
            "days": [0, 1, 2, 3, 4],
            "periods": [{"index": i, "label": f"P{i}"} for i in range(4)],
        },
        "teachers": [
            {"id": "t1", "name": "Teacher 1", "unavailable": [], "max_per_day": 3},
            {"id": "t2", "name": "Teacher 2", "unavailable": [], "max_per_day": 3},
        ],
        "rooms": [
            {"id": "r1", "name": "Room 1", "capacity": 50, "type": "classroom"},
            {"id": "r2", "name": "Room 2", "capacity": 50, "type": "classroom"},
        ],
        "batches": [
            {"id": "b1", "name": "Batch 1", "size": 30},
            {"id": "b2", "name": "Batch 2", "size": 40},
        ],
        "subjects": [
            {"id": "s1", "name": "Subject 1", "room_type": "classroom"},
            {"id": "s2", "name": "Subject 2", "room_type": "classroom"},
        ],
        "requirements": [
            {"id": "q1", "batch_id": "b1", "subject_id": "s1", "teacher_id": "t1", "lectures_per_week": 4, "block_size": 1},
            {"id": "q2", "batch_id": "b2", "subject_id": "s2", "teacher_id": "t2", "lectures_per_week": 4, "block_size": 1},
        ],
        "time_limit_seconds": 10,
    }

    result = solve(problem)
    assert result["status"] == "ok"
    assert "timetable" in result and result["timetable"] is not None
    violations = independent_check(result["timetable"], problem)
    assert violations == []


def test_seeded_dataset_medium():
    problem = {
        "config": {
            "days": [0, 1, 2, 3, 4],
            "periods": [{"index": i, "label": f"P{i}"} for i in range(5)],
        },
        "teachers": [
            {"id": f"t{i}", "name": f"Teacher {i}", "unavailable": [{"day": 0, "period": 0}], "max_per_day": 4}
            for i in range(1, 5)
        ],
        "rooms": [
            {"id": f"r{i}", "name": f"Room {i}", "capacity": 60, "type": "classroom"}
            for i in range(1, 4)
        ],
        "batches": [
            {"id": f"b{i}", "name": f"Batch {i}", "size": 50}
            for i in range(1, 4)
        ],
        "subjects": [
            {"id": f"s{i}", "name": f"Subject {i}", "room_type": "classroom"}
            for i in range(1, 5)
        ],
        "requirements": [
            {"id": "q1", "batch_id": "b1", "subject_id": "s1", "teacher_id": "t1", "lectures_per_week": 4, "block_size": 1},
            {"id": "q2", "batch_id": "b1", "subject_id": "s2", "teacher_id": "t2", "lectures_per_week": 3, "block_size": 1},
            {"id": "q3", "batch_id": "b2", "subject_id": "s3", "teacher_id": "t3", "lectures_per_week": 4, "block_size": 1},
            {"id": "q4", "batch_id": "b3", "subject_id": "s4", "teacher_id": "t4", "lectures_per_week": 4, "block_size": 1},
        ],
        "time_limit_seconds": 10,
    }

    result = solve(problem)
    assert result["status"] == "ok"
    violations = independent_check(result["timetable"], problem)
    assert violations == []


def test_seeded_dataset_demo_size():
    """Demo-size dataset: 6 batches, 12 teachers, 8 rooms (including labs). Must solve in under 10 seconds."""
    problem = {
        "config": {
            "days": [0, 1, 2, 3, 4],
            "periods": [{"index": i, "label": f"P{i}"} for i in range(6)],
        },
        "teachers": [
            {"id": f"t{i:02d}", "name": f"Prof. Teacher {i}", "unavailable": [{"day": i % 5, "period": (i * 2) % 6}], "max_per_day": 4}
            for i in range(1, 13)
        ],
        "rooms": [
            {"id": f"r{i}", "name": f"Classroom {i}", "capacity": 60, "type": "classroom"}
            for i in range(1, 7)
        ] + [
            {"id": f"l{i}", "name": f"Lab {i}", "capacity": 60, "type": "lab"}
            for i in range(1, 3)
        ],
        "batches": [
            {"id": f"b{i}", "name": f"Batch {i}", "size": 55}
            for i in range(1, 7)
        ],
        "subjects": [
            {"id": f"sub_c{i}", "name": f"Theory {i}", "room_type": "classroom"}
            for i in range(1, 9)
        ] + [
            {"id": f"sub_l{i}", "name": f"Lab Course {i}", "room_type": "lab"}
            for i in range(1, 5)
        ],
        "requirements": [
            # 6 batches, 3-4 theory subjects each (3 lectures each) + 1 lab block each (2 periods)
            {"id": f"q_{b}_{s}", "batch_id": f"b{b}", "subject_id": f"sub_c{((b+s)%8)+1}", "teacher_id": f"t{(((b*2)+s)%12)+1:02d}", "lectures_per_week": 3, "block_size": 1}
            for b in range(1, 7) for s in range(3)
        ] + [
            {"id": f"ql_{b}", "batch_id": f"b{b}", "subject_id": f"sub_l{((b)%4)+1}", "teacher_id": f"t{((b+6)%12)+1:02d}", "lectures_per_week": 2, "block_size": 2}
            for b in range(1, 7)
        ],
        "time_limit_seconds": 10,
    }

    result = solve(problem)
    assert result["status"] == "ok"
    solve_ms = result["stats"]["solve_ms"]
    print(f"\n[DEMO-SIZE SOLVE TIME]: {solve_ms} ms")
    assert solve_ms < 10000, f"Demo solve time exceeded 10 seconds: {solve_ms}ms"
    violations = independent_check(result["timetable"], problem)
    assert violations == []


def test_tight_but_feasible_dataset():
    """A teacher using exactly their max weekly capacity, room type nearly full. MUST return 'ok'."""
    problem = {
        "config": {
            "days": [0, 1, 2],
            "periods": [{"index": 0, "label": "P0"}, {"index": 1, "label": "P1"}],
        },
        "teachers": [
            {"id": "t_tight", "name": "Prof. Tight", "unavailable": [], "max_per_day": 2},
        ],
        "rooms": [
            {"id": "r_tight", "name": "Room Tight", "capacity": 60, "type": "classroom"},
        ],
        "batches": [
            {"id": "b1", "name": "Batch 1", "size": 60},
        ],
        "subjects": [
            {"id": "s1", "name": "Subject 1", "room_type": "classroom"},
        ],
        "requirements": [
            # 3 days * 2 periods = 6 total slots.
            # Max per day 2 * 3 days = 6 weekly capacity.
            {"id": "q1", "batch_id": "b1", "subject_id": "s1", "teacher_id": "t_tight", "lectures_per_week": 6, "block_size": 1},
        ],
        "time_limit_seconds": 10,
    }

    result = solve(problem)
    assert result["status"] == "ok"
    violations = independent_check(result["timetable"], problem)
    assert violations == []


def test_infeasible_teacher_overload():
    problem = {
        "config": {
            "days": [0, 1],
            "periods": [{"index": 0, "label": "P0"}, {"index": 1, "label": "P1"}],
        },
        "teachers": [
            {"id": "t_over", "name": "Prof. Overloaded", "unavailable": [], "max_per_day": 2},
        ],
        "rooms": [{"id": "r1", "name": "R1", "capacity": 50, "type": "classroom"}],
        "batches": [
            {"id": "b1", "name": "B1", "size": 30},
            {"id": "b2", "name": "B2", "size": 30},
        ],
        "subjects": [{"id": "s1", "name": "S1", "room_type": "classroom"}],
        "requirements": [
            {"id": "q1", "batch_id": "b1", "subject_id": "s1", "teacher_id": "t_over", "lectures_per_week": 3, "block_size": 1},
            {"id": "q2", "batch_id": "b2", "subject_id": "s1", "teacher_id": "t_over", "lectures_per_week": 3, "block_size": 1},
        ],
        "time_limit_seconds": 5,
    }

    result = solve(problem)
    assert result["status"] == "infeasible"
    assert result["timetable"] is None
    reasons_text = " ".join(result["reasons"])
    assert "t_over" in reasons_text or "Prof. Overloaded" in reasons_text


def test_infeasible_batch_overload():
    problem = {
        "config": {
            "days": [0, 1],
            "periods": [{"index": 0, "label": "P0"}, {"index": 1, "label": "P1"}],
        },
        "teachers": [
            {"id": "t1", "name": "T1", "unavailable": [], "max_per_day": 4},
            {"id": "t2", "name": "T2", "unavailable": [], "max_per_day": 4},
        ],
        "rooms": [{"id": "r1", "name": "R1", "capacity": 50, "type": "classroom"}],
        "batches": [{"id": "b_heavy", "name": "Heavy Batch", "size": 30}],
        "subjects": [{"id": "s1", "name": "S1", "room_type": "classroom"}],
        "requirements": [
            {"id": "q1", "batch_id": "b_heavy", "subject_id": "s1", "teacher_id": "t1", "lectures_per_week": 3, "block_size": 1},
            {"id": "q2", "batch_id": "b_heavy", "subject_id": "s1", "teacher_id": "t2", "lectures_per_week": 3, "block_size": 1},
        ],
        "time_limit_seconds": 5,
    }

    result = solve(problem)
    assert result["status"] == "infeasible"
    assert result["timetable"] is None
    reasons_text = " ".join(result["reasons"])
    assert "b_heavy" in reasons_text or "Heavy Batch" in reasons_text


def test_infeasible_room_type_shortage():
    problem = {
        "config": {
            "days": [0],
            "periods": [{"index": 0, "label": "P0"}, {"index": 1, "label": "P1"}],
        },
        "teachers": [{"id": "t1", "name": "T1", "unavailable": [], "max_per_day": 2}],
        "rooms": [{"id": "r1", "name": "Classroom 1", "capacity": 50, "type": "classroom"}],
        "batches": [{"id": "b1", "name": "B1", "size": 30}],
        "subjects": [{"id": "s_lab", "name": "Lab Subject", "room_type": "lab"}],
        "requirements": [
            {"id": "q1", "batch_id": "b1", "subject_id": "s_lab", "teacher_id": "t1", "lectures_per_week": 2, "block_size": 1},
        ],
        "time_limit_seconds": 5,
    }

    result = solve(problem)
    assert result["status"] == "infeasible"
    reasons_text = " ".join(result["reasons"])
    assert "lab" in reasons_text.lower() or "No compatible room" in reasons_text


def test_infeasible_block_size_odd_lectures():
    problem = {
        "config": {
            "days": [0, 1, 2],
            "periods": [{"index": i, "label": f"P{i}"} for i in range(4)],
        },
        "teachers": [{"id": "t1", "name": "T1", "unavailable": [], "max_per_day": 4}],
        "rooms": [{"id": "l1", "name": "Lab 1", "capacity": 50, "type": "lab"}],
        "batches": [{"id": "b1", "name": "B1", "size": 30}],
        "subjects": [{"id": "s_lab", "name": "Lab Subject", "room_type": "lab"}],
        "requirements": [
            {"id": "q_odd", "batch_id": "b1", "subject_id": "s_lab", "teacher_id": "t1", "lectures_per_week": 3, "block_size": 2},
        ],
        "time_limit_seconds": 5,
    }

    result = solve(problem)
    assert result["status"] == "infeasible"
    reasons_text = " ".join(result["reasons"])
    assert "q_odd" in reasons_text and "not divisible by block_size 2" in reasons_text


def test_infeasible_batch_larger_than_every_room():
    problem = {
        "config": {
            "days": [0, 1],
            "periods": [{"index": 0, "label": "P0"}, {"index": 1, "label": "P1"}],
        },
        "teachers": [{"id": "t1", "name": "T1", "unavailable": [], "max_per_day": 2}],
        "rooms": [{"id": "r1", "name": "R1", "capacity": 30, "type": "classroom"}],
        "batches": [{"id": "b_giant", "name": "Giant Batch", "size": 100}],
        "subjects": [{"id": "s1", "name": "S1", "room_type": "classroom"}],
        "requirements": [
            {"id": "q1", "batch_id": "b_giant", "subject_id": "s1", "teacher_id": "t1", "lectures_per_week": 2, "block_size": 1},
        ],
        "time_limit_seconds": 5,
    }

    result = solve(problem)
    assert result["status"] == "infeasible"
    reasons_text = " ".join(result["reasons"])
    assert "b_giant" in reasons_text or "Giant Batch" in reasons_text or "No compatible room" in reasons_text


def test_teacher_availability_and_max_per_day():
    """Teacher unavailable on a day gets 0 slots that day; max_per_day is never exceeded."""
    problem = {
        "config": {
            "days": [0, 1, 2, 3, 4],
            "periods": [{"index": i, "label": f"P{i}"} for i in range(4)],
        },
        "teachers": [
            {
                "id": "t_busy",
                "name": "Prof. Busy",
                # Completely unavailable on Day 2
                "unavailable": [{"day": 2, "period": p} for p in range(4)],
                "max_per_day": 2,
            }
        ],
        "rooms": [{"id": "r1", "name": "Room 1", "capacity": 50, "type": "classroom"}],
        "batches": [{"id": "b1", "name": "Batch 1", "size": 30}],
        "subjects": [{"id": "s1", "name": "Subject 1", "room_type": "classroom"}],
        "requirements": [
            {"id": "q1", "batch_id": "b1", "subject_id": "s1", "teacher_id": "t_busy", "lectures_per_week": 6, "block_size": 1},
        ],
        "time_limit_seconds": 5,
    }

    result = solve(problem)
    assert result["status"] == "ok"
    slots = result["timetable"]["slots"]

    # Assert zero slots on Day 2
    day_2_slots = [s for s in slots if s["day"] == 2]
    assert len(day_2_slots) == 0

    # Assert max_per_day is never exceeded
    for d in [0, 1, 3, 4]:
        day_slots = [s for s in slots if s["day"] == d]
        assert len(day_slots) <= 2

    violations = independent_check(result["timetable"], problem)
    assert violations == []


def test_teacher_shared_across_batches():
    """Teacher shared across 3 batches has no teacher clash."""
    problem = {
        "config": {
            "days": [0, 1],
            "periods": [{"index": i, "label": f"P{i}"} for i in range(4)],
        },
        "teachers": [
            {"id": "t_shared", "name": "Prof. Shared", "unavailable": [], "max_per_day": 4}
        ],
        "rooms": [
            {"id": "r1", "name": "Room 1", "capacity": 50, "type": "classroom"},
            {"id": "r2", "name": "Room 2", "capacity": 50, "type": "classroom"},
            {"id": "r3", "name": "Room 3", "capacity": 50, "type": "classroom"},
        ],
        "batches": [
            {"id": "b1", "name": "Batch 1", "size": 30},
            {"id": "b2", "name": "Batch 2", "size": 30},
            {"id": "b3", "name": "Batch 3", "size": 30},
        ],
        "subjects": [{"id": "s1", "name": "Subject 1", "room_type": "classroom"}],
        "requirements": [
            {"id": "q1", "batch_id": "b1", "subject_id": "s1", "teacher_id": "t_shared", "lectures_per_week": 2, "block_size": 1},
            {"id": "q2", "batch_id": "b2", "subject_id": "s1", "teacher_id": "t_shared", "lectures_per_week": 2, "block_size": 1},
            {"id": "q3", "batch_id": "b3", "subject_id": "s1", "teacher_id": "t_shared", "lectures_per_week": 2, "block_size": 1},
        ],
        "time_limit_seconds": 5,
    }

    result = solve(problem)
    assert result["status"] == "ok"
    violations = independent_check(result["timetable"], problem)
    assert violations == []


def test_lab_blocks():
    """Consecutive periods, same day, same room, respecting teacher availability."""
    problem = {
        "config": {
            "days": [0, 1, 2],
            "periods": [{"index": i, "label": f"P{i}"} for i in range(4)],
        },
        "teachers": [
            {
                "id": "t_lab",
                "name": "Prof. Lab",
                # Unavailable at day 0 period 1 -> block cannot be scheduled at day 0 period (0, 1) or (1, 2)
                "unavailable": [{"day": 0, "period": 1}],
                "max_per_day": 4,
            }
        ],
        "rooms": [{"id": "l1", "name": "Lab 1", "capacity": 50, "type": "lab"}],
        "batches": [{"id": "b1", "name": "Batch 1", "size": 30}],
        "subjects": [{"id": "s_lab", "name": "Database Lab", "room_type": "lab"}],
        "requirements": [
            {"id": "q_lab", "batch_id": "b1", "subject_id": "s_lab", "teacher_id": "t_lab", "lectures_per_week": 4, "block_size": 2},
        ],
        "time_limit_seconds": 5,
    }

    result = solve(problem)
    assert result["status"] == "ok"
    slots = result["timetable"]["slots"]
    assert len(slots) == 4

    # Group by (day, room_id)
    groups = {}
    for s in slots:
        groups.setdefault((s["day"], s["room_id"]), []).append(s["period"])

    # 4 periods scheduled as 2 blocks of 2
    for (day, room_id), p_list in groups.items():
        assert len(p_list) == 2
        assert sorted(p_list)[1] == sorted(p_list)[0] + 1
        # Day 0 period 1 was unavailable, so neither slot should be (day 0, period 1)
        if day == 0:
            assert 1 not in p_list

    violations = independent_check(result["timetable"], problem)
    assert violations == []


def test_timeout_path():
    """Very small time_limit_seconds on a complex dataset returns 'timeout', not a crash."""
    problem = {
        "config": {
            "days": [0, 1, 2, 3, 4],
            "periods": [{"index": i, "label": f"P{i}"} for i in range(8)],
        },
        "teachers": [{"id": f"t{i}", "name": f"T{i}", "unavailable": [], "max_per_day": 6} for i in range(15)],
        "rooms": [{"id": f"r{i}", "name": f"R{i}", "capacity": 60, "type": "classroom"} for i in range(10)],
        "batches": [{"id": f"b{i}", "name": f"B{i}", "size": 50} for i in range(10)],
        "subjects": [{"id": f"s{i}", "name": f"S{i}", "room_type": "classroom"} for i in range(15)],
        "requirements": [
            {"id": f"q_{b}_{s}", "batch_id": f"b{b}", "subject_id": f"s{s}", "teacher_id": f"t{(b*5 + s) % 15}", "lectures_per_week": 4, "block_size": 1}
            for b in range(10) for s in range(5)
        ],
        "time_limit_seconds": 0.0001,  # immediate timeout
    }

    result = solve(problem)
    assert result["status"] in ("timeout", "ok")
    if result["status"] == "timeout":
        assert result["timetable"] is None
        assert "timeout" in " ".join(result["reasons"]).lower() or "timed out" in " ".join(result["reasons"]).lower()


def test_determinism_sorted_output():
    """Slots must be sorted by (batch_id, day, period)."""
    problem = {
        "config": {
            "days": [0, 1, 2],
            "periods": [{"index": i, "label": f"P{i}"} for i in range(4)],
        },
        "teachers": [
            {"id": "t1", "name": "T1", "unavailable": [], "max_per_day": 3},
            {"id": "t2", "name": "T2", "unavailable": [], "max_per_day": 3},
        ],
        "rooms": [
            {"id": "r1", "name": "R1", "capacity": 50, "type": "classroom"},
            {"id": "r2", "name": "R2", "capacity": 50, "type": "classroom"},
        ],
        "batches": [
            {"id": "b_beta", "name": "Beta", "size": 30},
            {"id": "b_alpha", "name": "Alpha", "size": 30},
        ],
        "subjects": [{"id": "s1", "name": "S1", "room_type": "classroom"}],
        "requirements": [
            {"id": "q1", "batch_id": "b_beta", "subject_id": "s1", "teacher_id": "t1", "lectures_per_week": 2, "block_size": 1},
            {"id": "q2", "batch_id": "b_alpha", "subject_id": "s1", "teacher_id": "t2", "lectures_per_week": 2, "block_size": 1},
        ],
        "time_limit_seconds": 5,
    }

    result = solve(problem)
    assert result["status"] == "ok"
    slots = result["timetable"]["slots"]

    keys = [(s["batch_id"], s["day"], s["period"]) for s in slots]
    assert keys == sorted(keys), "Slots are not sorted by (batch_id, day, period)"

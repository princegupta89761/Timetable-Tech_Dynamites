"""
vcs/validate.py
Contract Section 5 & 7 validator.
Pure function validating a timetable against problem constraints.
Independent of solver: does not import anything from solver/.
"""


def validate(timetable: dict, problem: dict) -> list[str]:
    """
    Validates a timetable against all 8 hard constraints in contract.md.
    Returns a list of human-readable violation messages.
    An empty list means the timetable is valid.
    """
    violations: list[str] = []

    if not isinstance(timetable, dict) or "slots" not in timetable or not isinstance(timetable["slots"], list):
        return ["Invalid timetable format: missing or non-list 'slots'."]

    slots = timetable["slots"]

    # Index problem entities
    teachers = {t["id"]: t for t in problem.get("teachers", [])}
    rooms = {r["id"]: r for r in problem.get("rooms", [])}
    batches = {b["id"]: b for b in problem.get("batches", [])}
    subjects = {s["id"]: s for s in problem.get("subjects", [])}
    requirements = {q["id"]: q for q in problem.get("requirements", [])}

    # 1. Batch clash: a batch has at most one slot per (day, period)
    batch_slots: dict[tuple, dict] = {}
    for slot in slots:
        b_id = slot.get("batch_id")
        d = slot.get("day")
        p = slot.get("period")
        key = (b_id, d, p)
        if key in batch_slots:
            b_name = batches.get(b_id, {}).get("name", b_id)
            violations.append(
                f"Batch clash: Batch {b_name} ({b_id}) has multiple lectures scheduled at Day {d}, Period {p}."
            )
        batch_slots[key] = slot

    # 2. Teacher clash: a teacher has at most one slot per (day, period)
    teacher_slots: dict[tuple, dict] = {}
    for slot in slots:
        t_id = slot.get("teacher_id")
        d = slot.get("day")
        p = slot.get("period")
        key = (t_id, d, p)
        if key in teacher_slots:
            t_name = teachers.get(t_id, {}).get("name", t_id)
            violations.append(
                f"Teacher clash: Teacher {t_name} ({t_id}) is double-booked at Day {d}, Period {p}."
            )
        teacher_slots[key] = slot

    # 3. Room clash: a room has at most one slot per (day, period)
    room_slots: dict[tuple, dict] = {}
    for slot in slots:
        r_id = slot.get("room_id")
        d = slot.get("day")
        p = slot.get("period")
        key = (r_id, d, p)
        if key in room_slots:
            r_name = rooms.get(r_id, {}).get("name", r_id)
            violations.append(
                f"Room clash: Room {r_name} ({r_id}) is double-booked at Day {d}, Period {p}."
            )
        room_slots[key] = slot

    # 4. Room fit: capacity >= batch.size and type == subject.room_type
    for slot in slots:
        b_id = slot.get("batch_id")
        r_id = slot.get("room_id")
        s_id = slot.get("subject_id")

        batch = batches.get(b_id)
        room = rooms.get(r_id)
        subject = subjects.get(s_id)

        if not batch or not room or not subject:
            violations.append(
                f"Entity lookup failure for slot: batch={b_id}, room={r_id}, subject={s_id}."
            )
            continue

        b_name = batch.get("name", b_id)
        r_name = room.get("name", r_id)
        s_name = subject.get("name", s_id)

        room_cap = room.get("capacity", 0)
        batch_size = batch.get("size", 0)
        if room_cap < batch_size:
            violations.append(
                f"Room fit capacity violation: Room {r_name} ({r_id}) capacity ({room_cap}) < Batch {b_name} ({b_id}) size ({batch_size})."
            )

        room_type = room.get("type")
        required_type = subject.get("room_type")
        if room_type != required_type:
            violations.append(
                f"Room fit type mismatch: Room {r_name} ({r_id}) type '{room_type}' != Subject {s_name} ({s_id}) required type '{required_type}'."
            )

    # 5. Teacher availability: no slot falls in teacher's unavailable list
    for slot in slots:
        t_id = slot.get("teacher_id")
        d = slot.get("day")
        p = slot.get("period")
        t = teachers.get(t_id)
        if t:
            unavail = {(u["day"], u["period"]) for u in t.get("unavailable", [])}
            if (d, p) in unavail:
                t_name = t.get("name", t_id)
                violations.append(
                    f"Teacher availability violation: Teacher {t_name} ({t_id}) is marked unavailable at Day {d}, Period {p}."
                )

    # 6. Teacher max per day: respect teacher.max_per_day
    teacher_day_counts: dict[tuple, int] = {}
    for slot in slots:
        t_id = slot.get("teacher_id")
        d = slot.get("day")
        teacher_day_counts[(t_id, d)] = teacher_day_counts.get((t_id, d), 0) + 1

    for (t_id, d), count in teacher_day_counts.items():
        t = teachers.get(t_id)
        if t and t.get("max_per_day") is not None:
            max_pd = t["max_per_day"]
            if count > max_pd:
                t_name = t.get("name", t_id)
                violations.append(
                    f"Teacher max_per_day violation: Teacher {t_name} ({t_id}) is assigned {count} periods on Day {d}, exceeding max_per_day limit ({max_pd})."
                )

    # 7. Coverage: each requirement gets exactly lectures_per_week slots
    req_counts: dict[str, int] = {}
    for slot in slots:
        qid = slot.get("requirement_id")
        if qid:
            req_counts[qid] = req_counts.get(qid, 0) + 1

    for qid, q in requirements.items():
        expected = q.get("lectures_per_week", 0)
        actual = req_counts.get(qid, 0)
        if actual != expected:
            violations.append(
                f"Coverage violation: Requirement {qid} expected {expected} slots, but found {actual} in timetable."
            )

    # 8. Blocks: block_size: 2 requirement occupies two consecutive periods on the same day in the same room
    for qid, q in requirements.items():
        bsize = q.get("block_size", 1)
        if bsize == 2:
            q_slots = [s for s in slots if s.get("requirement_id") == qid]
            # Group slots by (day, room_id)
            day_room_groups: dict[tuple, list[int]] = {}
            for s in q_slots:
                day_room_groups.setdefault((s.get("day"), s.get("room_id")), []).append(s.get("period"))

            total_q_slots = len(q_slots)
            if total_q_slots % 2 != 0:
                violations.append(
                    f"Block violation: Requirement {qid} with block_size 2 has an odd number of total periods ({total_q_slots})."
                )

            for (d, r_id), periods in day_room_groups.items():
                sorted_p = sorted(periods)
                if len(sorted_p) % 2 != 0:
                    r_name = rooms.get(r_id, {}).get("name", r_id)
                    violations.append(
                        f"Block violation: Requirement {qid} has non-even period count {len(sorted_p)} on Day {d} in Room {r_name} ({r_id})."
                    )
                for i in range(0, len(sorted_p), 2):
                    if i + 1 < len(sorted_p):
                        if sorted_p[i + 1] != sorted_p[i] + 1:
                            r_name = rooms.get(r_id, {}).get("name", r_id)
                            violations.append(
                                f"Block violation: Requirement {qid} on Day {d} in Room {r_name} has non-consecutive periods {sorted_p[i]} and {sorted_p[i + 1]}."
                            )

    return violations

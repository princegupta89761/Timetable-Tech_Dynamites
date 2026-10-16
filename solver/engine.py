import time
from ortools.sat.python import cp_model


def _precheck_feasibility(problem: dict) -> list[str]:
    """
    Performs quick static checks before launching the CP-SAT solver.
    Returns a list of human-readable infeasibility reasons, or empty list if passed.
    """
    reasons = []
    config = problem.get("config", {})
    days = config.get("days", [])
    periods = config.get("periods", [])
    total_slots = len(days) * len(periods)

    teachers = {t["id"]: t for t in problem.get("teachers", [])}
    rooms = {r["id"]: r for r in problem.get("rooms", [])}
    batches = {b["id"]: b for b in problem.get("batches", [])}
    subjects = {s["id"]: s for s in problem.get("subjects", [])}
    requirements = problem.get("requirements", [])

    # Validate block_size and divisibility
    for req in requirements:
        req_id = req.get("id", "unknown")
        block_size = req.get("block_size", 1)
        lpw = req.get("lectures_per_week", 0)
        if block_size not in (1, 2):
            reasons.append(f"Requirement {req_id} has unsupported block_size {block_size}.")
        elif lpw % block_size != 0:
            reasons.append(
                f"Requirement {req_id} requires {lpw} periods per week, which is not divisible by block_size {block_size}."
            )

    # 1. Batch load vs available slots
    batch_loads = {b_id: 0 for b_id in batches}
    for req in requirements:
        b_id = req.get("batch_id")
        if b_id in batch_loads:
            batch_loads[b_id] += req.get("lectures_per_week", 0)
        else:
            reasons.append(f"Requirement {req.get('id')} references unknown batch {b_id}.")

    for b_id, load in batch_loads.items():
        if load > total_slots:
            b_name = batches[b_id].get("name", b_id)
            reasons.append(
                f"Batch {b_name} ({b_id}) needs {load} lectures/week but only {total_slots} slots exist."
            )

    # 2. Teacher load vs available slots (accounting for unavailable slots and max_per_day)
    teacher_loads = {t_id: 0 for t_id in teachers}
    for req in requirements:
        t_id = req.get("teacher_id")
        if t_id in teacher_loads:
            teacher_loads[t_id] += req.get("lectures_per_week", 0)
        else:
            reasons.append(f"Requirement {req.get('id')} references unknown teacher {t_id}.")

    for t_id, load in teacher_loads.items():
        t = teachers[t_id]
        t_name = t.get("name", t_id)
        unavailable = t.get("unavailable", [])
        # Unique unavailable slots that fall within valid days and periods
        unavail_set = {
            (u["day"], u["period"])
            for u in unavailable
            if u.get("day") in days and any(p.get("index") == u.get("period") for p in periods)
        }
        teacher_available_slots = total_slots - len(unavail_set)

        if load > teacher_available_slots:
            reasons.append(
                f"Teacher {t_name} ({t_id}) needs {load} periods/week but only {teacher_available_slots} available slots exist."
            )

        # Max per day theoretical limit
        max_per_day = t.get("max_per_day")
        if max_per_day is not None:
            max_possible_weekly = max_per_day * len(days)
            if load > max_possible_weekly:
                reasons.append(
                    f"Teacher {t_name} ({t_id}) needs {load} periods/week which exceeds weekly max capacity ({max_possible_weekly}) based on max_per_day {max_per_day}."
                )

    # 3. Room-type and capacity fit pre-check
    # For each requirement, ensure at least one compatible room exists
    for req in requirements:
        b_id = req.get("batch_id")
        s_id = req.get("subject_id")
        batch = batches.get(b_id)
        subject = subjects.get(s_id)
        if not batch or not subject:
            continue

        required_room_type = subject.get("room_type", "classroom")
        batch_size = batch.get("size", 0)

        compatible_rooms = [
            r_id
            for r_id, r in rooms.items()
            if r.get("type") == required_room_type and r.get("capacity", 0) >= batch_size
        ]

        if not compatible_rooms:
            b_name = batch.get("name", b_id)
            s_name = subject.get("name", s_id)
            reasons.append(
                f"No compatible room found for Subject {s_name} (type: {required_room_type}) and Batch {b_name} (size: {batch_size})."
            )

    # Aggregate room type capacity check
    room_type_total_slots = {}
    for r in rooms.values():
        rtype = r.get("type", "classroom")
        room_type_total_slots[rtype] = room_type_total_slots.get(rtype, 0) + total_slots

    type_demand = {}
    for req in requirements:
        s = subjects.get(req.get("subject_id"))
        if s:
            rtype = s.get("room_type", "classroom")
            type_demand[rtype] = type_demand.get(rtype, 0) + req.get("lectures_per_week", 0)

    for rtype, demand in type_demand.items():
        avail = room_type_total_slots.get(rtype, 0)
        if demand > avail:
            reasons.append(
                f"Room type '{rtype}' shortage: requires {demand} periods/week across all batches, but only {avail} slots are available across all {rtype} rooms."
            )

    return reasons


def solve(problem: dict) -> dict:
    """
    Takes ProblemInput, returns SolveResult per Contract Section 6.
    Pure function: no file or database access.
    """
    start_time = time.perf_counter()

    # Pre-check feasibility
    precheck_reasons = _precheck_feasibility(problem)
    if precheck_reasons:
        return {
            "status": "infeasible",
            "timetable": None,
            "reasons": precheck_reasons,
        }

    config = problem.get("config", {})
    days = config.get("days", [])
    period_objs = sorted(config.get("periods", []), key=lambda p: p["index"])
    period_indices = [p["index"] for p in period_objs]

    teachers = {t["id"]: t for t in problem.get("teachers", [])}
    rooms = {r["id"]: r for r in problem.get("rooms", [])}
    batches = {b["id"]: b for b in problem.get("batches", [])}
    subjects = {s["id"]: s for s in problem.get("subjects", [])}
    requirements = problem.get("requirements", [])
    time_limit_seconds = float(problem.get("time_limit_seconds", 10.0))

    # Pre-calculate candidate rooms per requirement based on Constraint 4 (Room fit)
    req_compatible_rooms = {}
    for req in requirements:
        req_id = req["id"]
        batch = batches[req["batch_id"]]
        subject = subjects[req["subject_id"]]
        compat = [
            r_id
            for r_id, r in rooms.items()
            if r.get("type") == subject.get("room_type", "classroom")
            and r.get("capacity", 0) >= batch.get("size", 0)
        ]
        req_compatible_rooms[req_id] = compat

    # Pre-calculate teacher unavailable slots
    teacher_unavail_sets = {}
    for t_id, t in teachers.items():
        unavail = t.get("unavailable", [])
        teacher_unavail_sets[t_id] = {(u["day"], u["period"]) for u in unavail}

    # Expand requirements into individual units to be scheduled
    # For block_size=1: lpw units of length 1
    # For block_size=2: (lpw // 2) units of length 2
    units = []
    unit_id = 0
    for req in requirements:
        req_id = req["id"]
        block_size = req.get("block_size", 1)
        lpw = req["lectures_per_week"]
        count = lpw // block_size
        for _ in range(count):
            units.append({
                "unit_id": unit_id,
                "req_id": req_id,
                "batch_id": req["batch_id"],
                "teacher_id": req["teacher_id"],
                "subject_id": req["subject_id"],
                "block_size": block_size,
            })
            unit_id += 1

    # Build CP-SAT model
    model = cp_model.CpModel()

    # Decision variables:
    # unit_vars[u_idx, day, start_p, room_id] = 1 if unit u starts at (day, start_p) in room_id
    unit_vars = {}
    unit_candidate_placements = {u["unit_id"]: [] for u in units}

    # Map of occupied slots: (owner_type, id, day, period) -> list of var
    batch_slot_vars = {}
    teacher_slot_vars = {}
    room_slot_vars = {}

    # For soft objectives:
    # batch_day_subject_vars[batch_id, day, subject_id] -> list of placement vars
    batch_day_subject_vars = {}
    # batch_day_has_lecture[batch_id, day] = BoolVar
    batch_day_units = {}
    # batch_slot_active[batch_id, day, period] = BoolVar
    batch_slot_active = {}

    for u in units:
        u_idx = u["unit_id"]
        req_id = u["req_id"]
        b_id = u["batch_id"]
        t_id = u["teacher_id"]
        s_id = u["subject_id"]
        bsize = u["block_size"]
        compat_rooms = req_compatible_rooms[req_id]
        t_unavail = teacher_unavail_sets.get(t_id, set())

        # Determine valid start periods for this block size
        valid_start_periods = []
        for i, p_idx in enumerate(period_indices):
            if bsize == 1:
                valid_start_periods.append((p_idx, [p_idx]))
            elif bsize == 2:
                # Must be consecutive periods on the same day
                if i + 1 < len(period_indices) and period_indices[i + 1] == p_idx + 1:
                    valid_start_periods.append((p_idx, [p_idx, p_idx + 1]))

        for d in days:
            for start_p, occupied_periods in valid_start_periods:
                # Constraint 5: Teacher availability for ALL periods in the block
                if any((d, p) in t_unavail for p in occupied_periods):
                    continue

                for r_id in compat_rooms:
                    var = model.NewBoolVar(f"u{u_idx}_d{d}_p{start_p}_r{r_id}")
                    unit_vars[(u_idx, d, start_p, r_id)] = var
                    unit_candidate_placements[u_idx].append((var, d, start_p, r_id, occupied_periods))

                    # Track occupancy for each period in the block
                    for p in occupied_periods:
                        batch_slot_vars.setdefault((b_id, d, p), []).append(var)
                        teacher_slot_vars.setdefault((t_id, d, p), []).append(var)
                        room_slot_vars.setdefault((r_id, d, p), []).append(var)

                    # Track for soft goal: subject twice in one day for batch
                    batch_day_subject_vars.setdefault((b_id, d, s_id), []).append(var)
                    batch_day_units.setdefault((b_id, d), []).append(var)

    # Constraint 7: Coverage — each unit must be placed exactly once
    for u in units:
        u_idx = u["unit_id"]
        candidates = [v for v, _, _, _, _ in unit_candidate_placements[u_idx]]
        if not candidates:
            # Unit has zero valid placements
            b_name = batches[u["batch_id"]].get("name", u["batch_id"])
            t_name = teachers[u["teacher_id"]].get("name", u["teacher_id"])
            s_name = subjects[u["subject_id"]].get("name", u["subject_id"])
            return {
                "status": "infeasible",
                "timetable": None,
                "reasons": [
                    f"No valid time slot or room available for Batch {b_name}, Subject {s_name}, Teacher {t_name} (block size {u['block_size']})."
                ],
            }
        model.Add(sum(candidates) == 1)

    # Constraint 1: Batch clash (at most one slot per (day, period))
    for (b_id, d, p), vlist in batch_slot_vars.items():
        model.Add(sum(vlist) <= 1)
        # Create active indicator for gaps analysis
        b_active_var = model.NewBoolVar(f"active_b_{b_id}_d{d}_p{p}")
        model.Add(b_active_var == sum(vlist))
        batch_slot_active[(b_id, d, p)] = b_active_var

    # Constraint 2: Teacher clash (at most one slot per (day, period))
    for (t_id, d, p), vlist in teacher_slot_vars.items():
        model.Add(sum(vlist) <= 1)

    # Constraint 3: Room clash (at most one slot per (day, period))
    for (r_id, d, p), vlist in room_slot_vars.items():
        model.Add(sum(vlist) <= 1)

    # Constraint 6: Teacher max_per_day
    for t_id, t in teachers.items():
        max_pd = t.get("max_per_day")
        if max_pd is not None:
            for d in days:
                day_t_vars = []
                for p in period_indices:
                    if (t_id, d, p) in teacher_slot_vars:
                        day_t_vars.extend(teacher_slot_vars[(t_id, d, p)])
                if day_t_vars:
                    # Note: since teacher clash ensures sum <= 1 at each period,
                    # the sum across all periods for day d is the exact number of periods worked.
                    model.Add(sum(day_t_vars) <= max_pd)

    # --- Soft Goals / Objective ---
    penalty_terms = []

    # 1. Soft Goal: Avoid same subject twice in one day for a batch
    # Penalize if sum of sessions of same subject in a day > 1
    for (b_id, d, s_id), vlist in batch_day_subject_vars.items():
        if len(vlist) > 1:
            excess = model.NewIntVar(0, len(vlist), f"excess_{b_id}_d{d}_s{s_id}")
            # excess >= sum(vlist) - 1
            model.Add(excess >= sum(vlist) - 1)
            penalty_terms.append(excess * 50)

    # 2. Soft Goal: Spread lectures across days (balance load across days for a batch)
    for b_id in batches:
        day_loads = []
        for d in days:
            d_vars = []
            for p in period_indices:
                if (b_id, d, p) in batch_slot_active:
                    d_vars.append(batch_slot_active[(b_id, d, p)])
            load_var = model.NewIntVar(0, len(period_indices), f"load_{b_id}_d{d}")
            if d_vars:
                model.Add(load_var == sum(d_vars))
            else:
                model.Add(load_var == 0)
            day_loads.append(load_var)

        # Penalize max day load - min day load or variance proxy (max load for batch)
        if day_loads:
            max_day_load = model.NewIntVar(0, len(period_indices), f"max_load_{b_id}")
            model.AddMaxEquality(max_day_load, day_loads)
            penalty_terms.append(max_day_load * 10)

    # 3. Soft Goal: Avoid gaps within a day for a batch
    # A gap occurs if period p is empty, but some earlier period p1 < p is active and some later period p2 > p is active.
    for b_id in batches:
        for d in days:
            active_p_vars = [batch_slot_active.get((b_id, d, p)) for p in period_indices]
            # For each intermediate period p_k (not first or last)
            for k in range(1, len(period_indices) - 1):
                p_var = active_p_vars[k]
                if p_var is None:
                    continue
                earlier = [v for v in active_p_vars[:k] if v is not None]
                later = [v for v in active_p_vars[k+1:] if v is not None]
                if earlier and later:
                    has_earlier = model.NewBoolVar(f"has_earlier_{b_id}_d{d}_k{k}")
                    has_later = model.NewBoolVar(f"has_later_{b_id}_d{d}_k{k}")
                    is_gap = model.NewBoolVar(f"gap_{b_id}_d{d}_k{k}")

                    model.Add(sum(earlier) >= 1).OnlyEnforceIf(has_earlier)
                    model.Add(sum(earlier) == 0).OnlyEnforceIf(has_earlier.Not())

                    model.Add(sum(later) >= 1).OnlyEnforceIf(has_later)
                    model.Add(sum(later) == 0).OnlyEnforceIf(has_later.Not())

                    # is_gap = has_earlier AND has_later AND (NOT p_var)
                    model.AddBoolAnd([has_earlier, has_later, p_var.Not()]).OnlyEnforceIf(is_gap)
                    model.AddBoolOr([has_earlier.Not(), has_later.Not(), p_var]).OnlyEnforceIf(is_gap.Not())

                    penalty_terms.append(is_gap * 20)

    if penalty_terms:
        model.Minimize(sum(penalty_terms))

    # Solve
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit_seconds
    solver.parameters.num_workers = 4  # multithreaded solving for speed

    status = solver.Solve(model)
    elapsed_ms = int((time.perf_counter() - start_time) * 1000)

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        slots = []
        for u in units:
            u_idx = u["unit_id"]
            for var, d, start_p, r_id, occupied_periods in unit_candidate_placements[u_idx]:
                if solver.Value(var) == 1:
                    for p in occupied_periods:
                        slots.append({
                            "batch_id": u["batch_id"],
                            "day": d,
                            "period": p,
                            "subject_id": u["subject_id"],
                            "teacher_id": u["teacher_id"],
                            "room_id": r_id,
                            "requirement_id": u["req_id"],
                        })

        # Sort slots deterministically by (batch_id, day, period)
        slots.sort(key=lambda s: (s["batch_id"], s["day"], s["period"]))

        soft_score = int(solver.ObjectiveValue()) if penalty_terms else 0
        return {
            "status": "ok",
            "timetable": {"slots": slots},
            "stats": {
                "solve_ms": elapsed_ms,
                "soft_score": soft_score,
            },
        }
    elif status == cp_model.INFEASIBLE:
        # Detailed conflict diagnosis
        reasons = ["The constraints (room/teacher/batch availability and block sizes) are mutually infeasible."]
        # Add any partial diagnostics
        return {
            "status": "infeasible",
            "timetable": None,
            "reasons": reasons,
        }
    else:
        # UNKNOWN or MODEL_INVALID -> timeout
        return {
            "status": "timeout",
            "timetable": None,
            "reasons": [f"Solver timed out after {time_limit_seconds} seconds without finding a feasible solution."],
        }
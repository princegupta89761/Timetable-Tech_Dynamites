from ortools.sat.python import cp_model

def solve_timetable(data):
    """
    data format expected:
    {
        "teachers": ["T1", "T2"],
        "rooms": ["R1", "R2"],
        "batches": ["B1", "B2"],
        "slots": [1, 2, 3, 4], # e.g., Day-Hour slots
        "demands": [
            {"subject": "Math", "teacher": "T1", "batch": "B1", "lectures_needed": 2},
            {"subject": "Physics", "teacher": "T2", "batch": "B2", "lectures_needed": 2}
        ]
    }
    """
    model = cp_model.CpModel()
    
    teachers = data["teachers"]
    rooms = data["rooms"]
    batches = data["batches"]
    slots = data["slots"]
    demands = data["demands"]
    
    # Decision variables: x[d_idx, s, r] = 1 if demand d is scheduled at slot s in room r
    # To simplify, let's represent a lecture assignment as a tuple of variables:
    # (teacher, batch, room, slot)
    
    assignments = {}
    
    # For each demand, we need to schedule 'lectures_needed' sessions
    lecture_vars = []
    
    for d_idx, demand in enumerate(demands):
        teacher = demand["teacher"]
        batch = demand["batch"]
        needed = demand["lectures_needed"]
        
        # Create variables for each possible slot and room for this demand
        demand_sessions = []
        for s in slots:
            for r in rooms:
                var_name = f"d{d_idx}_t{teacher}_b{batch}_s{s}_r{r}"
                var = model.NewBoolVar(var_name)
                assignments[(d_idx, s, r)] = var
                demand_sessions.append(var)
                
        # Each demand must satisfy its exact lecture count requirement
        model.Add(sum(demand_sessions) == needed)

    # Hard Constraint 1: Teacher Clash (A teacher can only be in one room at a given slot)
    for t in teachers:
        for s in slots:
            teacher_slot_vars = [
                assignments[(d_idx, s, r)] 
                for d_idx, demand in enumerate(demands) if demand["teacher"] == t
                for r in rooms
            ]
            if teacher_slot_vars:
                model.Add(sum(teacher_slot_vars) <= 1)

    # Hard Constraint 2: Room Clash (A room can only host one lecture at a given slot)
    for r in rooms:
        for s in slots:
            room_slot_vars = [
                assignments[(d_idx, s, r)] 
                for d_idx, demand in enumerate(demands)
                for _r in rooms if _r == r
            ]
            # Sum across all demands assigned to room r at slot s <= 1
            active_in_room = [
                assignments[(d_idx, s, r)]
                for d_idx, demand in enumerate(demands)
                for r_name in rooms if r_name == r
            ]
            # Simplified room clash check
            model.Add(sum(assignments[(d, s, r)] for d in range(len(demands)) ) <= 1)

    # Hard Constraint 3: Batch Clash (A batch can only attend one lecture at a given slot)
    for b in batches:
        for s in slots:
            batch_slot_vars = [
                assignments[(d_idx, s, r)]
                for d_idx, demand in enumerate(demands) if demand["batch"] == b
                for r in rooms
            ]
            if batch_slot_vars:
                model.Add(sum(batch_slot_vars) <= 1)

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 10.0
    status = solver.Solve(model)
    
    results = []
    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        for (d_idx, s, r), var in assignments.items():
            if solver.Value(var) == 1:
                dem = demands[d_idx]
                results.append({
                    "slot": s,
                    "room": r,
                    "teacher": dem["teacher"],
                    "batch": dem["batch"],
                    "subject": dem["subject"]
                })
        return {"status": "success", "timetable": results}
    else:
        return {"status": "infeasible", "reasons": "Constraints could not be satisfied within limits."}

if __name__ == "__main__":
    test_data = {
        "teachers": ["Prof. Smith", "Prof. Doe"],
        "rooms": ["Room 101", "Room 102"],
        "batches": ["CS-A", "CS-B"],
        "slots": [1, 2, 3],
        "demands": [
            {"subject": "Data Structures", "teacher": "Prof. Smith", "batch": "CS-A", "lectures_needed": 2},
            {"subject": "Algorithms", "teacher": "Prof. Doe", "batch": "CS-B", "lectures_needed": 2}
        ]
    }
    print(solve_timetable(test_data))
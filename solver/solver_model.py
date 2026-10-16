from ortools.sat.python import cp_model

def solve_dummy_timetable():
    model = cp_model.CpModel()
    
    # Example: 2 teachers, 2 time slots, 1 room
    # Variables: x[teacher, slot] = room_id
    teachers = ['T1', 'T2']
    slots = [1, 2]
    
    assignments = {}
    for t in teachers:
        for s in slots:
            assignments[(t, s)] = model.NewBoolVar(f'teacher_{t}_slot_{s}')
            
    # Constraint: Each teacher must be assigned to exactly 1 slot
    for t in teachers:
        model.Add(sum(assignments[(t, s)] for s in slots) == 1)
        
    solver = cp_model.CpSolver()
    status = solver.Solve(model)
    
    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        print("Solver successfully generated a schedule layout!")
        for t in teachers:
            for s in slots:
                if solver.Value(assignments[(t, s)]) == 1:
                    print(f"Teacher {t} assigned to Slot {s}")
    else:
        print("No feasible solution found.")

if __name__ == "__main__":
    solve_dummy_timetable()
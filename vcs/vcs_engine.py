import json
import hashlib
from datetime import datetime, timezone

class TimetableVCS:
    def __init__(self):
        self.commits = {}
        self.head = None
        self.counter = 1

    def create_commit(self, timetable_data, message="Generated timetable"):
        # Generate a unique commit ID (e.g., c0001, c0002)
        commit_id = f"c{self.counter:04d}"
        
        snapshot = {
            "id": commit_id,
            "parent": self.head,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message": message,
            "timetable": timetable_data
        }
        
        self.commits[commit_id] = snapshot
        self.head = commit_id
        self.counter += 1
        return snapshot

    def compute_diff(self, commit_id_1, commit_id_2):
        """Compare two commits and return a plain-English list of changes."""
        snap1 = self.commits.get(commit_id_1)
        snap2 = self.commits.get(commit_id_2)
        
        if not snap1 or not snap2:
            return {"error": "One or both commit IDs not found."}

        t1 = {(item["batch"], item["subject"]): item for item in snap1["timetable"]}
        t2 = {(item["batch"], item["subject"]): item for item in snap2["timetable"]}

        changes = []
        
        all_keys = set(t1.keys()).union(set(t2.keys()))
        for key in all_keys:
            b, sub = key
            if key not in t1:
                item = t2[key]
                changes.append(f"Added lecture: {sub} for batch {b} at Slot {item['slot']} in {item['room']}")
            elif key not in t2:
                changes.append(f"Removed lecture: {sub} for batch {b}")
            else:
                item1 = t1[key]
                item2 = t2[key]
                if item1["slot"] != item2["slot"] or item1["room"] != item2["room"]:
                    changes.append(
                        f"Modified {sub} for batch {b}: moved from (Slot {item1['slot']}, {item1['room']}) "
                        f"to (Slot {item2['slot']}, {item2['room']})"
                    )
                    
        return {
            "from": commit_id_1,
            "to": commit_id_2,
            "changes": changes if changes else ["No differences found between commits."]
        }

if __name__ == "__main__":
    vcs = TimetableVCS()
    
    # Commit 1: Initial generated timetable
    state_v1 = [
        {"slot": 1, "room": "Room 101", "teacher": "Prof. Smith", "batch": "CS-A", "subject": "Data Structures"}
    ]
    c1 = vcs.create_commit(state_v1, message="Initial generate")
    
    # Commit 2: Edited timetable (moved slot)
    state_v2 = [
        {"slot": 2, "room": "Room 102", "teacher": "Prof. Smith", "batch": "CS-A", "subject": "Data Structures"}
    ]
    c2 = vcs.create_commit(state_v2, message="Moved Data Structures to slot 2")
    
    # Print Diff
    diff_result = vcs.compute_diff(c1["id"], c2["id"])
    print(json.dumps(diff_result, indent=2))
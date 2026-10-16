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
    
    def validate_and_edit(self, slot: int, room: str, batch: str, subject: str):
        """Validates a manual edit against existing slots at HEAD to prevent clashes."""
        if not self.head:
            return {"valid": False, "reason": "No active timetable found. Generate one first."}
            
        current_timetable = self.commits[self.head]["timetable"]
        
        # Check for room clash or batch clash in the target slot
        for item in current_timetable:
            if item["slot"] == slot:
                if item["room"] == room:
                    return {"valid": False, "reason": f"Room {room} is already booked at Slot {slot} by batch {item['batch']} for {item['subject']}."}
                if item["batch"] == batch:
                    return {"valid": False, "reason": f"Batch {batch} already has a lecture ({item['subject']}) at Slot {slot}."}
                    
        # If valid, apply the edit (modify or add)
        updated_timetable = [dict(item) for item in current_timetable]
        found = False
        for item in updated_timetable:
            if item["batch"] == batch and item["subject"] == subject:
                item["slot"] = slot
                item["room"] = room
                found = True
                break
                
        if not found:
            # Add new if not present
            updated_timetable.append({"slot": slot, "room": room, "batch": batch, "subject": subject, "teacher": "Prof. Assigned"})
            
        return {"valid": True, "new_timetable": updated_timetable}

    def revert_to_commit(self, target_commit_id: str):
        """Reverts the state back to a previous commit by creating a new commit."""
        target_snap = self.commits.get(target_commit_id)
        if not target_snap:
            return {"error": "Target commit ID not found."}
            
        new_commit = self.create_commit(
            target_snap["timetable"], 
            message=f"Reverted to {target_commit_id}"
        )
        return new_commit

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
import pytest
from fastapi.testclient import TestClient

from api import routes
from main import app
from vcs.commits import VCS


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_api_full_workflow(client):
    """
    Test full user flow per Contract Section 8 and Workflow Section 2:
    seed -> generate -> edit valid -> edit clashing (expect 400 CLASH) -> diff -> revert -> view.
    """
    # 1. POST /api/seed
    seed_res = client.post("/api/seed")
    assert seed_res.status_code == 200
    assert seed_res.json() == {"ok": True}

    # Verify GET /api/problem
    prob_res = client.get("/api/problem")
    assert prob_res.status_code == 200
    problem = prob_res.json()
    assert len(problem["batches"]) == 6
    assert len(problem["teachers"]) == 12

    # 2. POST /api/generate
    gen_res = client.post("/api/generate", json={"message": "First generated timetable"})
    assert gen_res.status_code == 200
    gen_data = gen_res.json()
    assert "commit" in gen_data
    commit_1 = gen_data["commit"]
    c1_id = commit_1["id"]
    assert commit_1["kind"] == "generate"
    assert len(commit_1["snapshot"]["slots"]) > 0

    # Verify GET /api/timetable at HEAD
    tt_res = client.get("/api/timetable")
    assert tt_res.status_code == 200
    tt_slots = tt_res.json()["slots"]
    assert len(tt_slots) == len(commit_1["snapshot"]["slots"])

    # 3. POST /api/edit (valid edit)
    # Find a non-block theory slot to move to an unoccupied time
    target_slot = None
    for s in tt_slots:
        # q_b_se_a_s_dbms has block_size 1
        if s["batch_id"] == "b_se_a" and s["subject_id"] == "s_dbms":
            target_slot = s
            break
    assert target_slot is not None, "Could not find a theory slot to edit"

    # Find a (day, period) not currently occupied by b_se_a or target_slot's teacher
    occupied_batch = {(s["day"], s["period"]) for s in tt_slots if s["batch_id"] == "b_se_a"}
    occupied_teacher = {(s["day"], s["period"]) for s in tt_slots if s["teacher_id"] == target_slot["teacher_id"]}

    all_days = problem["config"]["days"]
    all_periods = [p["index"] for p in problem["config"]["periods"]]

    new_day = None
    new_period = None
    for d in all_days:
        for p in all_periods:
            if (d, p) not in occupied_batch and (d, p) not in occupied_teacher:
                new_day = d
                new_period = p
                break
        if new_day is not None:
            break

    assert new_day is not None and new_period is not None, "Could not find free slot for valid edit"

    edit_payload = {
        "message": "Valid slot move",
        "slot_key": {
            "batch_id": target_slot["batch_id"],
            "day": target_slot["day"],
            "period": target_slot["period"],
        },
        "new": {
            "day": new_day,
            "period": new_period,
            "room_id": target_slot["room_id"],
            "teacher_id": target_slot["teacher_id"],
        },
    }

    edit_res = client.post("/api/edit", json=edit_payload)
    assert edit_res.status_code == 200
    commit_2 = edit_res.json()["commit"]
    c2_id = commit_2["id"]
    assert commit_2["kind"] == "edit"
    assert commit_2["parent_id"] == c1_id

    # 4. POST /api/edit (clashing edit -> expect 400 CLASH)
    # Move a slot directly onto another batch's slot in the same room at the same time
    slot_a = commit_2["snapshot"]["slots"][0]
    slot_b = commit_2["snapshot"]["slots"][1]
    # Attempt to move slot_a to slot_b's day, period, and room
    clash_payload = {
        "message": "Intentional clashing move",
        "slot_key": {
            "batch_id": slot_a["batch_id"],
            "day": slot_a["day"],
            "period": slot_a["period"],
        },
        "new": {
            "day": slot_b["day"],
            "period": slot_b["period"],
            "room_id": slot_b["room_id"],
        },
    }

    clash_res = client.post("/api/edit", json=clash_payload)
    assert clash_res.status_code == 400
    clash_json = clash_res.json()
    assert "error" in clash_json
    assert clash_json["error"]["code"] == "CLASH"
    assert len(clash_json["error"]["details"]) > 0

    # 5. GET /api/diff?from=c1&to=c2
    diff_res = client.get(f"/api/diff?from={c1_id}&to={c2_id}")
    assert diff_res.status_code == 200
    diff_data = diff_res.json()
    assert diff_data["from"] == c1_id
    assert diff_data["to"] == c2_id
    assert diff_data["summary"]["moved"] >= 1
    assert any(c["type"] == "moved" for c in diff_data["changes"])

    # 6. POST /api/revert
    revert_res = client.post("/api/revert", json={"commit_id": c1_id})
    assert revert_res.status_code == 200
    commit_3 = revert_res.json()["commit"]
    assert commit_3["kind"] == "revert"
    assert commit_3["parent_id"] == c2_id
    # Restored slot count should match c1
    assert len(commit_3["snapshot"]["slots"]) == len(commit_1["snapshot"]["slots"])

    # 7. GET /api/view
    # Batch view
    view_batch = client.get("/api/view?batch=b_se_a")
    assert view_batch.status_code == 200
    vb_data = view_batch.json()
    assert vb_data["owner"]["type"] == "batch"
    assert vb_data["owner"]["id"] == "b_se_a"
    assert len(vb_data["grid"]) == len(problem["config"]["periods"])
    assert len(vb_data["grid"][0]) == len(problem["config"]["days"])

    # Teacher view
    view_teacher = client.get("/api/view?teacher=t01")
    assert view_teacher.status_code == 200
    vt_data = view_teacher.json()
    assert vt_data["owner"]["type"] == "teacher"
    assert vt_data["owner"]["id"] == "t01"

    # Room view
    view_room = client.get("/api/view?room=r101")
    assert view_room.status_code == 200
    vr_data = view_room.json()
    assert vr_data["owner"]["type"] == "room"
    assert vr_data["owner"]["id"] == "r101"

    # Invalid view queries (expect 400 BAD_REQUEST)
    err_none = client.get("/api/view")
    assert err_none.status_code == 400
    assert err_none.json()["error"]["code"] == "BAD_REQUEST"

    err_multi = client.get("/api/view?batch=b_se_a&teacher=t01")
    assert err_multi.status_code == 400
    assert err_multi.json()["error"]["code"] == "BAD_REQUEST"


def test_api_commits_endpoints(client):
    # Verify GET /api/commits
    commits_res = client.get("/api/commits")
    assert commits_res.status_code == 200
    commits_list = commits_res.json()
    assert isinstance(commits_list, list)
    assert len(commits_list) > 0
    # Summaries do not contain snapshots
    assert "snapshot" not in commits_list[0]

    # Verify GET /api/commits/{id}
    cid = commits_list[0]["id"]
    single_res = client.get(f"/api/commits/{cid}")
    assert single_res.status_code == 200
    single_commit = single_res.json()
    assert single_commit["id"] == cid
    assert "snapshot" in single_commit

    # Non-existent commit returns 404 NOT_FOUND
    missing_res = client.get("/api/commits/c9999")
    assert missing_res.status_code == 404
    assert missing_res.json()["error"]["code"] == "NOT_FOUND"


def test_api_export_ics_for_teacher(client, tmp_path, monkeypatch):
    monkeypatch.setattr(routes.commits, "_default_vcs", VCS(tmp_path / "commits.json"))

    seed_res = client.post("/api/seed")
    assert seed_res.status_code == 200
    problem = client.get("/api/problem").json()

    block_requirements = [
        requirement
        for requirement in problem["requirements"]
        if requirement.get("block_size") == 2
    ]
    assert block_requirements
    teacher_id = block_requirements[0]["teacher_id"]

    generate_res = client.post("/api/generate", json={"message": "ICS export test"})
    assert generate_res.status_code == 200
    timetable = generate_res.json()["commit"]["snapshot"]
    teacher_slots = [slot for slot in timetable["slots"] if slot["teacher_id"] == teacher_id]
    assert teacher_slots

    merged_away = sum(
        (requirement["lectures_per_week"] // requirement["block_size"])
        * (requirement["block_size"] - 1)
        for requirement in problem["requirements"]
        if requirement["teacher_id"] == teacher_id and requirement["block_size"] > 1
    )
    expected_events = len(teacher_slots) - merged_away

    export_res = client.get("/api/export/ics", params={"teacher": teacher_id})
    assert export_res.status_code == 200
    assert export_res.headers["content-type"].startswith("text/calendar")
    assert export_res.text.startswith("BEGIN:VCALENDAR")
    assert export_res.text.endswith("END:VCALENDAR")
    assert export_res.text.count("BEGIN:VEVENT\r\n") == expected_events

    block_requirement = next(
        requirement
        for requirement in problem["requirements"]
        if requirement["teacher_id"] == teacher_id and requirement["block_size"] > 1
    )
    block_subject = next(
        subject for subject in problem["subjects"] if subject["id"] == block_requirement["subject_id"]
    )
    block_batch = next(
        batch for batch in problem["batches"] if batch["id"] == block_requirement["batch_id"]
    )
    block_events = [
        event
        for event in export_res.text.split("BEGIN:VEVENT\r\n")[1:]
        if f"SUMMARY:{block_subject['name']} ({block_batch['name']})" in event
    ]
    assert block_events

    from datetime import datetime, timedelta

    event_fields = {
        line.split(":", 1)[0]: line.split(":", 1)[1]
        for line in block_events[0].split("\r\n")
        if ":" in line
    }
    start = datetime.strptime(event_fields["DTSTART"], "%Y%m%dT%H%M%S")
    end = datetime.strptime(event_fields["DTEND"], "%Y%m%dT%H%M%S")
    assert end - start == timedelta(hours=2)


def test_api_diff_filter_by_teacher(client, tmp_path, monkeypatch):
    test_vcs = VCS(tmp_path / "commits.json")
    monkeypatch.setattr(routes.commits, "_default_vcs", test_vcs)

    seed_res = client.post("/api/seed")
    assert seed_res.status_code == 200
    problem = client.get("/api/problem").json()

    generate_res = client.post("/api/generate", json={"message": "Diff filter test"})
    assert generate_res.status_code == 200
    commit_1 = generate_res.json()["commit"]
    assert commit_1["id"] == "c0001"
    slots = commit_1["snapshot"]["slots"]

    requirements = {item["id"]: item for item in problem["requirements"]}
    target_slot = next(
        slot
        for slot in slots
        if requirements[slot["requirement_id"]].get("block_size", 1) == 1
    )
    teacher_id = target_slot["teacher_id"]
    teacher = next(item for item in problem["teachers"] if item["id"] == teacher_id)

    other_batch_times = {
        (slot["day"], slot["period"])
        for slot in slots
        if slot is not target_slot and slot["batch_id"] == target_slot["batch_id"]
    }
    other_teacher_times = {
        (slot["day"], slot["period"])
        for slot in slots
        if slot is not target_slot and slot["teacher_id"] == teacher_id
    }
    other_room_times = {
        (slot["day"], slot["period"])
        for slot in slots
        if slot is not target_slot and slot["room_id"] == target_slot["room_id"]
    }
    unavailable = {
        (entry["day"], entry["period"])
        for entry in teacher.get("unavailable", [])
    }
    teacher_day_load: dict[int, int] = {}
    for slot in slots:
        if slot is not target_slot and slot["teacher_id"] == teacher_id:
            teacher_day_load[slot["day"]] = teacher_day_load.get(slot["day"], 0) + 1

    new_location = None
    for day in problem["config"]["days"]:
        if teacher_day_load.get(day, 0) >= teacher.get("max_per_day", len(problem["config"]["periods"])):
            continue
        for period in (item["index"] for item in problem["config"]["periods"]):
            location = (day, period)
            if location == (target_slot["day"], target_slot["period"]):
                continue
            if location in other_batch_times or location in other_teacher_times:
                continue
            if location in other_room_times or location in unavailable:
                continue
            new_location = location
            break
        if new_location is not None:
            break
    assert new_location is not None, "Could not find a valid destination for the lecture"

    edit_res = client.post(
        "/api/edit",
        json={
            "message": "Move lecture for diff filter test",
            "slot_key": {
                "batch_id": target_slot["batch_id"],
                "day": target_slot["day"],
                "period": target_slot["period"],
            },
            "new": {
                "day": new_location[0],
                "period": new_location[1],
                "room_id": target_slot["room_id"],
                "teacher_id": teacher_id,
            },
        },
    )
    assert edit_res.status_code == 200
    commit_2 = edit_res.json()["commit"]
    assert commit_2["id"] == "c0002"

    filtered_res = client.get(
        "/api/diff",
        params={"from": commit_1["id"], "to": commit_2["id"], "teacher": teacher_id},
    )
    assert filtered_res.status_code == 200
    filtered = filtered_res.json()
    assert filtered["changes"]

    for change in filtered["changes"]:
        if change["type"] in {"moved", "changed"}:
            requirement_teacher = next(
                item["teacher_id"]
                for item in problem["requirements"]
                if item["id"] == change["requirement_id"]
            )
            changed_teachers = {
                change.get("from", {}).get("teacher_id"),
                change.get("to", {}).get("teacher_id"),
            }
            assert requirement_teacher == teacher_id or (
                change["type"] == "changed" and teacher_id in changed_teachers
            )
        else:
            assert change["slot"]["teacher_id"] == teacher_id

    expected_summary = {
        kind: sum(change["type"] == kind for change in filtered["changes"])
        for kind in ("moved", "added", "removed", "changed")
    }
    assert filtered["summary"] == expected_summary

    uninvolved_teacher = next(
        item["id"] for item in problem["teachers"] if item["id"] != teacher_id
    )
    uninvolved_res = client.get(
        "/api/diff",
        params={"from": commit_1["id"], "to": commit_2["id"], "teacher": uninvolved_teacher},
    )
    assert uninvolved_res.status_code == 200
    assert uninvolved_res.json()["changes"] == []
    assert uninvolved_res.json()["summary"] == {
        "moved": 0,
        "added": 0,
        "removed": 0,
        "changed": 0,
    }

    unfiltered_res = client.get(
        "/api/diff",
        params={"from": commit_1["id"], "to": commit_2["id"]},
    )
    assert unfiltered_res.status_code == 200
    from vcs.diff import compute_diff

    assert unfiltered_res.json() == compute_diff(
        snap_from=commit_1["id"],
        snap_to=commit_2["id"],
        problem=problem,
        from_id=commit_1["id"],
        to_id=commit_2["id"],
        vcs=test_vcs,
    )
    assert len(unfiltered_res.json()["changes"]) >= len(filtered["changes"])

    unknown_teacher_res = client.get(
        "/api/diff",
        params={"from": commit_1["id"], "to": commit_2["id"], "teacher": "unknown_id"},
    )
    assert unknown_teacher_res.status_code == 404
    assert unknown_teacher_res.json()["error"]["code"] == "NOT_FOUND"

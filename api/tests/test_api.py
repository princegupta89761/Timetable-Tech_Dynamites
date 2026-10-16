import pytest
from fastapi.testclient import TestClient

from main import app


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

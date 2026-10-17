import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_chat_english_generation_help(client):
    res = client.post("/api/chat", json={
        "message": "How do I generate a clash-free timetable?",
        "language": "en",
        "role": "admin"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["language"] == "en"
    assert "generate" in data["reply"].lower() or "solver" in data["reply"].lower()
    assert data["source"] in ["application-help", "timetable-data", "rule-based-fallback"]
    assert data["navAction"] is not None
    assert data["navAction"]["page"] == "generate"


def test_chat_hindi_query(client):
    res = client.post("/api/chat", json={
        "message": "टाइमटेबल कैसे बनाएं?",
        "language": "hi",
        "role": "student"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["language"] == "hi"
    assert "टाइमटेबल" in data["reply"]
    assert data["navAction"]["page"] == "generate"


def test_chat_conflict_diagnosis(client):
    res = client.post("/api/chat", json={
        "message": "What does a scheduling conflict mean?",
        "language": "en",
        "role": "coordinator"
    })
    assert res.status_code == 200
    data = res.json()
    assert "conflict" in data["reply"].lower() or "clash" in data["reply"].lower()
    assert data["navAction"]["page"] == "history"


def test_chat_role_aware_next_class(client):
    res = client.post("/api/chat", json={
        "message": "Where is my next class today?",
        "language": "en",
        "role": "teacher"
    })
    assert res.status_code == 200
    data = res.json()
    assert "teacher" in data["reply"].lower() or "room" in data["reply"].lower()
    assert data["navAction"]["page"] == "timetable"


def test_chat_empty_message(client):
    res = client.post("/api/chat", json={
        "message": "   ",
        "language": "en",
        "role": "student"
    })
    assert res.status_code == 200
    data = res.json()
    assert "valid" in data["reply"].lower() or "please" in data["reply"].lower()

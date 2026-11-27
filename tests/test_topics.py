from datetime import timedelta

import pytest

from database import get_alltopics
from retention import complete_review, undo_review


@pytest.mark.parametrize("path", [
    "/api/topics", "/api/inbox", "/api/daily_logs", "/api/streak", "/api/topics/percentage",
])
def test_logged_out_requests_are_rejected(client, path):
    assert client.get(path).status_code == 401


def test_cannot_read_another_users_topic(client, make_user, make_topic, login_as):
    alice, bob = make_user("alice"), make_user("bob") #returns user id
    bobs_topic = make_topic(bob)
    login_as(alice)
    r = client.post("/api/topics/stats", json={"id": bobs_topic})
    assert r.status_code == 404


def test_review_not_due_yet_is_rejected(client, make_user, make_topic, login_as, today):
    uid = make_user()
    tid = make_topic(uid, next_review=today + timedelta(days=3))
    login_as(uid)
    r = client.post("/api/topics/update", json={"id": tid, "rating": 75})
    assert r.status_code == 409
    assert "isn't due until" in r.get_json()["error"]


@pytest.mark.parametrize("bad_rating", [-1, 99, "75", None, 75.0, True])
def test_invalid_ratings_are_rejected(client, make_user, make_topic, login_as, bad_rating):
    uid = make_user()
    tid = make_topic(uid)
    login_as(uid)
    r = client.post("/api/topics/update", json={"id": tid, "rating": bad_rating})
    assert r.status_code == 400


def test_mastery_is_not_capped_at_100(make_user, make_topic, log_entry):
    uid = make_user()
    log = [log_entry(rating=100, step=s) for s in range(1, 8)]
    tid = make_topic(uid, step=7, log=log)
    result = complete_review(uid, tid, 100)
    assert result["progress"] > 100


def test_undo_restores_the_previous_state(make_user, make_topic):
    uid = make_user()
    tid = make_topic(uid)
    before = get_alltopics(uid)[0]
    complete_review(uid, tid, 75)
    undo_review(uid, tid)
    after = get_alltopics(uid)[0]
    for key in ("interval_step", "next_review", "review_log", "level", "progress"):
        assert after[key] == before[key], key

def test_invalid_undo_is_rejected(client, make_user, make_topic, login_as):
    uid = make_user()
    tid = make_topic(uid)
    login_as(uid)
    r = client.post("/api/topics/undo", json={"id": tid})
    assert r.status_code == 400
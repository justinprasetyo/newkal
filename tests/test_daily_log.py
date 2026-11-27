from datetime import timedelta

import pytest

from dailylog import get_allDaily_logs, edit_log_description
from retention import get_streak

def test_delete_nonexistant_log(client, make_user, login_as, make_daily_Log):
    uid = make_user()
    tid = make_daily_Log(uid)
    login_as(uid)
    r = client.post("/api/daily_logs/delete", json={"id": tid + 1})
    assert r.status_code == 404
    
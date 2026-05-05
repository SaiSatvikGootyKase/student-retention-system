"""
One-time: rename MongoDB collection students -> profiles in the configured student database.

  python ML_model/scripts/rename_students_to_profiles.py
"""

from __future__ import annotations

import sys
from pathlib import Path

_SCRIPTS = Path(__file__).resolve().parent
if str(_SCRIPTS) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS))

from mongo_common import get_lms_database, get_mongo_client  # noqa: E402

OLD = "students"
NEW = "profiles"


def main() -> None:
    client = get_mongo_client(serverSelectionTimeoutMS=15000)
    db = get_lms_database(client)
    names = set(db.list_collection_names())
    if OLD not in names:
        print(f"No collection {OLD!r}; skip rename (already using {NEW!r} or empty DB).")
        client.close()
        return
    if NEW in names:
        n_old = db[OLD].count_documents({})
        n_new = db[NEW].count_documents({})
        if n_new == 0 and n_old > 0:
            db[NEW].drop()
            db[OLD].rename(NEW)
            print(f"Dropped empty {NEW!r}, renamed {OLD!r} -> {NEW!r} ({n_old} documents).")
        elif n_new > 0 and n_old > 0:
            print(
                f"Both {OLD!r} ({n_old} docs) and {NEW!r} ({n_new} docs) exist; "
                "merge manually or drop one collection before re-running."
            )
        else:
            db[OLD].drop()
            print(f"Removed stale {OLD!r}; {NEW!r} already has data.")
    else:
        db[OLD].rename(NEW)
        n = db[NEW].count_documents({})
        print(f"Renamed {OLD!r} -> {NEW!r} ({n} documents).")
    client.close()


if __name__ == "__main__":
    main()

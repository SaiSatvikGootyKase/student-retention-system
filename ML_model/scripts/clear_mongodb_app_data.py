"""
Drop entire MongoDB database(s) used by this project (destructive).

Default: only the `student` database (profiles, users, collections inside it).

Usage (from student-retention-system folder):

  python ML_model/scripts/clear_mongodb_app_data.py --confirm

Also clear faculty + admin_portal + test:

  python ML_model/scripts/clear_mongodb_app_data.py --confirm --extra-dbs faculty,admin_portal,test

Uses the same URI as Spring (application.properties). Does NOT touch Mongo system DBs (admin, local, config).
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

_SCRIPTS = Path(__file__).resolve().parent
if str(_SCRIPTS) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS))

from mongo_common import get_mongo_client, read_spring_mongodb_database  # noqa: E402


def main() -> None:
    ap = argparse.ArgumentParser(description="Drop MongoDB app database(s).")
    ap.add_argument(
        "--confirm",
        action="store_true",
        help="Required. Without this flag, nothing is dropped.",
    )
    ap.add_argument(
        "--extra-dbs",
        type=str,
        default="",
        help="Comma-separated extra database names to drop (e.g. faculty,admin_portal,test).",
    )
    args = ap.parse_args()
    if not args.confirm:
        print("Refusing to run: pass --confirm to drop databases.")
        print("Example: python ML_model/scripts/clear_mongodb_app_data.py --confirm")
        sys.exit(1)

    primary = read_spring_mongodb_database()
    to_drop = [primary]
    if args.extra_dbs.strip():
        for name in args.extra_dbs.split(","):
            n = name.strip()
            if n and n not in to_drop:
                to_drop.append(n)

    for n in to_drop:
        if n in ("admin", "local", "config"):
            print(f"skip system database: {n}")
            continue
        print(f"Dropping database: {n}")

    client = get_mongo_client(serverSelectionTimeoutMS=15000)
    for n in to_drop:
        if n in ("admin", "local", "config"):
            continue
        client.drop_database(n)
        print(f"  dropped: {n}")
    client.close()
    print("Done. Restart Spring Boot; collections will be recreated on next bootstrap/seed if configured.")


if __name__ == "__main__":
    main()

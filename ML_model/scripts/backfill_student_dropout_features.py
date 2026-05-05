"""
Backfill profiles.dropoutMlFeatures (and demographics.droppedOut) for documents missing the
embedded ML row. Uses deterministic dummy values in CSV-like ranges.

Run from repo root:
  python ML_model/scripts/backfill_student_dropout_features.py
"""

from __future__ import annotations

import sys
from pathlib import Path

_SCRIPTS = Path(__file__).resolve().parent
if str(_SCRIPTS) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS))

from mongo_common import get_lms_database, get_mongo_client  # noqa: E402


def dummy_row(seed: int) -> dict:
    s = seed % 1_000_000
    schools = ["GP", "MS"]
    genders = ["F", "M"]
    addr = ["U", "R"]
    fam = ["LE3", "GT3"]
    par = ["A", "T"]
    jobs = ["at_home", "teacher", "health", "services", "other"]
    reasons = ["course", "home", "reputation", "other"]
    guardians = ["mother", "father", "other"]
    yn = ["yes", "no"]
    g1 = 10 + (s % 8)
    g2 = 10 + ((s // 83) % 8)
    final_g = min(20, (g1 + g2 + (s % 5)) // 2)
    return {
        "School": schools[s % 2],
        "Gender": genders[(s // 3) % 2],
        "Age": 15 + (s % 4),
        "Address": addr[(s // 5) % 2],
        "Family_Size": fam[(s // 7) % 2],
        "Parental_Status": par[(s // 11) % 2],
        "Mother_Education": 1 + (s % 4),
        "Father_Education": 1 + ((s // 13) % 4),
        "Mother_Job": jobs[s % len(jobs)],
        "Father_Job": jobs[(s // 17) % len(jobs)],
        "Reason_for_Choosing_School": reasons[(s // 19) % len(reasons)],
        "Guardian": guardians[(s // 23) % len(guardians)],
        "Travel_Time": 1 + (s % 4),
        "Study_Time": 1 + ((s // 29) % 4),
        "Number_of_Failures": s % 4,
        "School_Support": yn[(s // 31) % 2],
        "Family_Support": yn[(s // 37) % 2],
        "Extra_Paid_Class": yn[(s // 41) % 2],
        "Extra_Curricular_Activities": yn[(s // 43) % 2],
        "Attended_Nursery": yn[(s // 47) % 2],
        "Wants_Higher_Education": yn[(s // 53) % 2],
        "Internet_Access": yn[(s // 59) % 2],
        "In_Relationship": yn[(s // 61) % 2],
        "Family_Relationship": 1 + (s % 5),
        "Free_Time": 1 + ((s // 67) % 5),
        "Going_Out": 1 + ((s // 71) % 5),
        "Weekend_Alcohol_Consumption": 1 + (s % 5),
        "Weekday_Alcohol_Consumption": 1 + ((s // 73) % 5),
        "Health_Status": 1 + ((s // 79) % 5),
        "Number_of_Absences": s % 25,
        "Grade_1": g1,
        "Grade_2": g2,
        "Final_Grade": final_g,
        "Dropped_Out": (s % 11) == 0,
    }


def main() -> None:
    client = get_mongo_client(serverSelectionTimeoutMS=15000)
    db = get_lms_database(client)
    coll = db["profiles"]
    query = {"$or": [{"dropoutMlFeatures": {"$exists": False}}, {"dropoutMlFeatures": None}]}
    cursor = coll.find(query, projection=["_id"])
    n = 0
    for doc in cursor:
        sid = str(doc["_id"])
        seed = hash(sid) % (2**31)
        row = dummy_row(seed)
        coll.update_one(
            {"_id": doc["_id"]},
            {"$set": {"dropoutMlFeatures": row, "demographics.droppedOut": row["Dropped_Out"]}},
        )
        n += 1
    client.close()
    print(f"Updated {n} profile document(s) with dropoutMlFeatures (database={db.name}).")


if __name__ == "__main__":
    main()

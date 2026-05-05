"""
Create normalized structural collections + indexes on MongoDB database "student"
(same effect as scripts/mongodb/normalized_student_db.mongosh.js).

Run from student-retention-system:
  python ML_model/scripts/apply_normalized_mongo_schema.py
"""

from __future__ import annotations

import sys
from pathlib import Path

_SCRIPTS = Path(__file__).resolve().parent
if str(_SCRIPTS) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS))

from mongo_common import get_lms_database, get_mongo_client  # noqa: E402

NEW_COLLECTIONS = [
    "courses",
    "sections",
    "admin_profiles",
    "faculty_profiles",
    "faculty_sections",
    "student_sections",
    "mentors",
    "assignment_submissions",
    "evaluations",
    "course_recommendations",
]

INDEX_SPECS: list[tuple[str, list[tuple[str, int]], dict]] = [
    ("courses", [("code", 1)], {"unique": True, "sparse": True, "name": "ix_courses_code_uq"}),
    ("courses", [("name", 1)], {"name": "ix_courses_name"}),
    ("sections", [("course_id", 1)], {"name": "ix_sections_course_id"}),
    ("sections", [("course_id", 1), ("name", 1)], {"unique": True, "name": "ix_sections_course_name_uq"}),
    ("admin_profiles", [("user_id", 1)], {"unique": True, "name": "ix_admin_profiles_user_id_uq"}),
    ("faculty_profiles", [("user_id", 1)], {"unique": True, "name": "ix_faculty_profiles_user_id_uq"}),
    ("faculty_profiles", [("course_id", 1)], {"name": "ix_faculty_profiles_course_id"}),
    ("faculty_profiles", [("department", 1)], {"name": "ix_faculty_profiles_department"}),
    ("faculty_sections", [("faculty_id", 1), ("section_id", 1)], {"unique": True, "name": "ix_faculty_sections_map_uq"}),
    ("faculty_sections", [("section_id", 1)], {"name": "ix_faculty_sections_section_id"}),
    ("student_sections", [("student_id", 1), ("section_id", 1)], {"unique": True, "name": "ix_student_sections_map_uq"}),
    ("student_sections", [("section_id", 1)], {"name": "ix_student_sections_section_id"}),
    ("mentors", [("faculty_id", 1), ("student_id", 1)], {"unique": True, "name": "ix_mentors_pair_uq"}),
    ("mentors", [("student_id", 1)], {"name": "ix_mentors_student_id"}),
    (
        "assignment_submissions",
        [("assignment_id", 1), ("student_id", 1)],
        {"unique": True, "name": "ix_submission_assignment_student_uq"},
    ),
    ("assignment_submissions", [("student_id", 1)], {"name": "ix_submission_student_id"}),
    ("evaluations", [("student_id", 1), ("course_id", 1)], {"name": "ix_evaluations_student_course"}),
    ("course_recommendations", [("student_id", 1)], {"name": "ix_course_rec_student_id"}),
    ("course_recommendations", [("recommended_course_id", 1)], {"name": "ix_course_rec_course_id"}),
]


def main() -> None:
    client = get_mongo_client(serverSelectionTimeoutMS=15000)
    db = get_lms_database(client)
    names = set(db.list_collection_names())
    for name in NEW_COLLECTIONS:
        if name not in names:
            db.create_collection(name)
            print(f"created collection: {db.name}.{name}")
        else:
            print(f"exists: {db.name}.{name}")

    for coll, keys, opts in INDEX_SPECS:
        db[coll].create_index(keys, **opts)
        print(f"index ensured: {coll} {opts.get('name', keys)}")

    for coll in ("announcements", "assignments", "attendance", "fees", "results", "timetable", "chat_messages"):
        if coll not in db.list_collection_names():
            continue
        try:
            db[coll].create_index([("course_id", 1)], name=f"ix_{coll}_course_id", sparse=True)
            print(f"sparse index: {coll}.course_id")
        except Exception as e:
            print(f"skip {coll}.course_id: {e}")

    client.close()
    print(f"done (database={db.name}).")


if __name__ == "__main__":
    main()

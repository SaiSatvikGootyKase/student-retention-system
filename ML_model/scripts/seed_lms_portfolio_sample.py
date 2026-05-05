"""
Insert LMS demo data into MongoDB (database from application.properties — usually `student`).

Uses four faculty accounts and 200 student accounts (50 per section CSIT-A..D), each profile has `section`,
`mentor`, and imbalanced risk tiers. `mentors` collection links mentor user id to student profile id.
Assignments: section-wise tasks (4 faculties x 4 sections = 16 assignments). Each faculty posts one assignment for
CSIT-A, CSIT-B, CSIT-C, and CSIT-D (50 students each section). Every student receives four assignments total
(one from each faculty for their section). Student emails: `batch1.s001@student.birlauniv.ac.in` .. `batch4.s050@..`.
Inserts: users, profiles, mentors, announcements, assignments, attendance, exams, fees, results, timetable.

Default password for every seeded account (plain text, matches AuthService): UnivPortal2025

Run from repo root (student-retention-system):
  python ML_model/scripts/seed_lms_portfolio_sample.py
  python ML_model/scripts/seed_lms_portfolio_sample.py --replace
"""

from __future__ import annotations

import argparse
import hashlib
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from bson import ObjectId

_SCRIPTS = Path(__file__).resolve().parent
if str(_SCRIPTS) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS))

from mongo_common import get_lms_database, get_mongo_client  # noqa: E402

# Internal marker only (not shown in UI); used to replace this script's rows safely.
SEED_TAG = "lms_seed_batch_001"
SEED_PASSWORD = "UnivPortal2025"


def oid_from(text: str) -> ObjectId:
    h = hashlib.sha256(text.encode()).hexdigest()[:24]
    return ObjectId(h)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def d_iso(d: date) -> datetime:
    return datetime(d.year, d.month, d.day, 0, 0, 0, tzinfo=timezone.utc)


# Faculty — names with surname + initials; emails are literals (institutional style).
FACULTY = [
    {
        "key": "fac_ananya_iyer",
        "name": "Dr. Ananya S. Iyer",
        "email": "ananya.iyer@faculty.birlauniv.ac.in",
        "department": "Computer Science & IT",
        "phone": "+91 98765 11101",
    },
    {
        "key": "fac_rajesh_khanna",
        "name": "Prof. Rajesh K. Khanna",
        "email": "rajesh.khanna@faculty.birlauniv.ac.in",
        "department": "Computer Science & IT",
        "phone": "+91 98765 11102",
    },
    {
        "key": "fac_meera_patel",
        "name": "Dr. Meera V. Patel",
        "email": "meera.patel@faculty.birlauniv.ac.in",
        "department": "Mathematics",
        "phone": "+91 98765 11103",
    },
    {
        "key": "fac_arvind_krishnan",
        "name": "Mr. Arvind N. Krishnan",
        "email": "arvind.krishnan@faculty.birlauniv.ac.in",
        "department": "Humanities & Sciences",
        "phone": "+91 98765 11104",
    },
]

# 200 students in 4 batches of 50; batch i (0–3) is mentored by FACULTY[i].
STUDENTS_PER_MENTOR = 50
STUDENT_BATCH_COUNT = len(FACULTY)
TOTAL_STUDENTS = STUDENTS_PER_MENTOR * STUDENT_BATCH_COUNT

_FIRST_NAMES = (
    "Aarav", "Aditya", "Ananya", "Arjun", "Diya", "Ishaan", "Kavya", "Kiara", "Neha", "Pari",
    "Rahul", "Riya", "Rohan", "Saanvi", "Shaurya", "Vivaan", "Aisha", "Dev", "Ira", "Kabir",
    "Laksh", "Meera", "Nikhil", "Pooja", "Reyansh", "Sara", "Tara", "Vihaan", "Yash", "Zara",
    "Aryan", "Dhruv", "Esha", "Harsh", "Ishan", "Jiya", "Krish", "Mira", "Naina", "Om",
    "Pranav", "Rudra", "Siya", "Tanvi", "Ved", "Advik", "Anika", "Bhavya", "Chetan", "Disha",
)
_LAST_NAMES = (
    "Sharma", "Verma", "Patel", "Reddy", "Iyer", "Nair", "Menon", "Kulkarni", "Desai", "Joshi",
    "Singh", "Kapoor", "Malhotra", "Chopra", "Bansal", "Agarwal", "Mehta", "Shah", "Rao", "Pillai",
    "Nambiar", "Krishnan", "Subramanian", "Banerjee", "Ghosh", "Mukherjee", "Das", "Sen", "Bose", "Dutta",
)


def build_students() -> list[dict]:
    rows: list[dict] = []
    for i in range(TOTAL_STUDENTS):
        batch = i // STUDENTS_PER_MENTOR
        n_in_batch = i % STUDENTS_PER_MENTOR + 1
        fn = _FIRST_NAMES[i % len(_FIRST_NAMES)]
        ln = _LAST_NAMES[(i // len(_FIRST_NAMES)) % len(_LAST_NAMES)]
        name = f"{fn} {ln}"
        key = f"stu_batch{batch}_{n_in_batch:03d}"
        email = f"batch{batch + 1}.s{n_in_batch:03d}@student.birlauniv.ac.in"
        phone_last = 30000 + i + 1
        section_code = f"CSIT-{chr(65 + batch)}"
        rows.append(
            {
                "key": key,
                "name": name,
                "email": email,
                "department": "CSIT",
                "phone": f"+91 98765 {phone_last:05d}",
                "major": "B.Tech CSE",
                "section": section_code,
                "mentorBatch": batch + 1,
                "mentorFacultyKey": FACULTY[batch]["key"],
            }
        )
    return rows


STUDENTS = build_students()

ALL_SEED_EMAILS = [r["email"] for r in FACULTY] + [r["email"] for r in STUDENTS]

COURSES = [
    ("CS301", "Data Structures & Algorithms"),
    ("CS302", "Database Management Systems"),
    ("MA201", "Engineering Mathematics — II"),
    ("HS101", "Indian Constitution & Ethics"),
]

# Within each section cohort: imbalanced risk (~40% LOW good / ~44% MEDIUM avg / ~16% HIGH at-risk for size 50).


def cohort_partition_sizes(cohort_size: int) -> tuple[int, int, int]:
    """Returns (n_low, n_med, n_high) summing to cohort_size; LOW=floor(40%%), HIGH=ceil(15%%), MED=remainder."""
    n_low = max(1, cohort_size * 40 // 100)
    n_high = max(1, (cohort_size * 15 + 99) // 100)  # ceil(15%): e.g. 50 -> 8
    n_med = cohort_size - n_low - n_high
    if n_med < 1:
        n_med = 1
        n_high = max(1, cohort_size - n_low - n_med)
    return n_low, n_med, n_high


def cohort_risk_score_and_tier(slot_in_cohort: int, cohort_size: int) -> tuple[float, str]:
    """slot_in_cohort: 0 .. cohort_size-1 within one mentor section."""
    n_low, n_med, n_high = cohort_partition_sizes(cohort_size)

    if slot_in_cohort < n_low:
        lo, hi = 16.0, 36.0
        span = max(n_low - 1, 1)
        t = slot_in_cohort / span
        score = lo + t * (hi - lo) + (slot_in_cohort % 5) * 0.35
        tier = "LOW"
    elif slot_in_cohort < n_low + n_med:
        j = slot_in_cohort - n_low
        lo, hi = 43.0, 63.0
        span = max(n_med - 1, 1)
        t = j / span
        score = lo + t * (hi - lo) + (j % 7) * 0.4
        tier = "MEDIUM"
    else:
        j = slot_in_cohort - n_low - n_med
        lo, hi = 72.0, 94.0
        span = max(n_high - 1, 1)
        t = j / span
        score = lo + t * (hi - lo) + (j % 6) * 0.5
        tier = "HIGH"

    score = max(0.0, min(100.0, round(score, 1)))
    return score, tier


def clear_seed_collections(db) -> None:
    q = {"_seedTag": SEED_TAG}
    for coll in ("announcements", "assignments", "attendance", "exams", "fees", "results", "timetable", "mentors"):
        db[coll].delete_many(q)


def wipe_seed_users_and_lms(db) -> None:
    clear_seed_collections(db)
    print("  cleared tagged LMS rows")
    seed_users = list(db.users.find({"email": {"$in": ALL_SEED_EMAILS}}))
    uids = [u["_id"] for u in seed_users]
    if uids:
        pr = db.profiles.delete_many({"userId": {"$in": [str(x) for x in uids]}})
        print(f"  deleted {pr.deleted_count} profiles for seeded users")
    ur = db.users.delete_many({"$or": [{"email": {"$in": ALL_SEED_EMAILS}}, {"_seedTag": SEED_TAG}]})
    print(f"  deleted {ur.deleted_count} users (seed list or tagged)")


def upsert_user(db, *, _id: ObjectId, name: str, email: str, role: str, department: str, phone: str) -> str:
    local = email.split("@")[0]
    doc = {
        "_id": _id,
        "name": name,
        "email": email,
        "passwordHash": SEED_PASSWORD,
        "password": SEED_PASSWORD,
        "role": role,
        "phone": phone,
        "department": department,
        "avatarUrl": f"https://api.dicebear.com/7.x/initials/svg?seed={local}",
        "_seedTag": SEED_TAG,
    }
    db.users.replace_one({"_id": _id}, doc, upsert=True)
    return str(_id)


def upsert_profile(
    db,
    *,
    _id: ObjectId,
    user_id: str,
    major: str,
    demographics_extra: dict | None = None,
    mentor_user_id: str | None = None,
    section_code: str | None = None,
    current_risk_score: float | None = None,
    current_risk_tier: str | None = None,
) -> str:
    now = utc_now()
    demo = {
        "studentDisplayCode": f"S{str(_id)[-4:].upper()}",
        "profileSource": "bulk_import",
        "campus": "Main",
    }
    if demographics_extra:
        demo.update(demographics_extra)
    doc = {
        "_id": _id,
        "userId": user_id,
        "enrollmentDate": d_iso(date(2024, 8, 1)),
        "major": major,
        "demographics": demo,
        "dropoutProfileComplete": True,
        "currentRiskScore": 42.0 if current_risk_score is None else float(current_risk_score),
        "currentRiskTier": "MEDIUM" if current_risk_tier is None else current_risk_tier,
        "lastRiskAssessmentAt": now,
        "_seedTag": SEED_TAG,
    }
    if mentor_user_id:
        doc["mentor"] = mentor_user_id
    if section_code:
        doc["section"] = section_code
    db.profiles.replace_one({"_id": _id}, doc, upsert=True)
    return str(_id)


def link_user_profile(db, user_id: str, profile_id: str) -> None:
    db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"linkedProfileId": profile_id}})


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--replace", action="store_true", help="Remove users/profiles/LMS rows from this seed, then re-insert.")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    client = get_mongo_client(serverSelectionTimeoutMS=20000)
    db = get_lms_database(client)
    print(f"Database: {db.name}")

    if args.dry_run:
        print("Dry run - no writes.")
        client.close()
        return

    if args.replace:
        print("Removing previous seed (matched emails + tagged docs)...")
        wipe_seed_users_and_lms(db)
    else:
        clear_seed_collections(db)

    fac_ids: list[str] = []
    for f in FACULTY:
        uid = upsert_user(
            db,
            _id=oid_from(f["key"]),
            name=f["name"],
            email=f["email"],
            role="FACULTY",
            department=f["department"],
            phone=f["phone"],
        )
        fac_ids.append(uid)
        print(f"  faculty: {f['name']} | {f['email']}")

    stu_pairs: list[tuple[str, str]] = []
    for idx, s in enumerate(STUDENTS):
        uid = oid_from(s["key"])
        pid = oid_from(s["key"] + "_profile")
        upsert_user(
            db,
            _id=uid,
            name=s["name"],
            email=s["email"],
            role="STUDENT",
            department=s["department"],
            phone=s["phone"],
        )
        extra_demo = {
            "mentorBatch": s["mentorBatch"],
            "mentorFacultyKey": s["mentorFacultyKey"],
        }
        mentor_uid = fac_ids[s["mentorBatch"] - 1]
        slot_in_section = idx % STUDENTS_PER_MENTOR
        risk_score, risk_tier = cohort_risk_score_and_tier(slot_in_section, STUDENTS_PER_MENTOR)
        prof_id = upsert_profile(
            db,
            _id=pid,
            user_id=str(uid),
            major=s["major"],
            demographics_extra=extra_demo,
            mentor_user_id=mentor_uid,
            section_code=s["section"],
            current_risk_score=risk_score,
            current_risk_tier=risk_tier,
        )
        link_user_profile(db, str(uid), prof_id)
        stu_pairs.append((str(uid), prof_id))

    demo_low, demo_med, demo_high = cohort_partition_sizes(STUDENTS_PER_MENTOR)
    print(
        f"  risk mix (each section of {STUDENTS_PER_MENTOR}): "
        f"LOW={demo_low} (~good), MEDIUM={demo_med} (~average), HIGH={demo_high} (~at-risk)"
    )

    print(
        f"  students: {len(STUDENTS)} total - {STUDENTS_PER_MENTOR} per faculty x {STUDENT_BATCH_COUNT} mentors"
    )
    for b in range(STUDENT_BATCH_COUNT):
        lo, hi = b * STUDENTS_PER_MENTOR, (b + 1) * STUDENTS_PER_MENTOR
        s0, s1 = STUDENTS[lo], STUDENTS[hi - 1]
        print(
            f"    batch {b + 1}: {FACULTY[b]['name']} <- {s0['name']} .. {s1['name']} ({STUDENTS_PER_MENTOR} students)"
        )

    n_users = db.users.count_documents({"email": {"$in": ALL_SEED_EMAILS}})
    print(f"\nUsers in DB matching seed emails: {n_users} (expected {len(ALL_SEED_EMAILS)})")

    profile_ids = [p[1] for p in stu_pairs]
    mentees_by_fac: list[list[str]] = []
    for b in range(STUDENT_BATCH_COUNT):
        lo, hi = b * STUDENTS_PER_MENTOR, (b + 1) * STUDENTS_PER_MENTOR
        mentees_by_fac.append([p for _u, p in stu_pairs[lo:hi]])
    profile_to_mentor_faculty: dict[str, str] = {}
    for batch_idx, fac_uid in enumerate(fac_ids):
        for pid in mentees_by_fac[batch_idx]:
            profile_to_mentor_faculty[pid] = fac_uid

    now = utc_now()
    base_day = date.today() - timedelta(days=21)

    def tag(doc: dict) -> dict:
        doc["_seedTag"] = SEED_TAG
        return doc

    mentor_rows = []
    for batch_idx in range(STUDENT_BATCH_COUNT):
        fac_uid = fac_ids[batch_idx]
        lo, hi = batch_idx * STUDENTS_PER_MENTOR, (batch_idx + 1) * STUDENTS_PER_MENTOR
        for _u, prof_id in stu_pairs[lo:hi]:
            mentor_rows.append(
                tag(
                    {
                        "_id": ObjectId(),
                        "faculty_id": fac_uid,
                        "student_id": prof_id,
                        "assigned_at": now,
                    }
                )
            )
    if mentor_rows:
        db.mentors.insert_many(mentor_rows)
    print(f"Inserted {len(mentor_rows)} mentor assignments (student profile -> faculty user id)")

    ann = []
    for i, (code, title) in enumerate(COURSES):
        fid = fac_ids[i % len(fac_ids)]
        fac_name = FACULTY[i % len(FACULTY)]["name"]
        ann.append(
            tag(
                {
                    "_id": ObjectId(),
                    "title": f"{code} — Weekly update & reading list",
                    "body": (
                        f"Dear students,\n\nThis week we continue with core topics for **{title}**. "
                        f"Please review the uploaded notes and attempt practice set {i + 1} before lab.\n\n"
                        f"— {fac_name}"
                    ),
                    "course": code,
                    "facultyId": fid,
                    "createdAt": now - timedelta(days=14 - i),
                }
            )
        )
    extras = [
        (
            "Campus",
            "Placement drive — pre-registration open",
            (
                "TCS and Infosys will conduct pooled campus interviews next month. "
                "Complete your profile on the placement portal and upload updated resumes (PDF). "
                "— Training & Placement Cell (coordinated by Dr. Meera V. Patel)"
            ),
            fac_ids[2],
        ),
        (
            "Library",
            "Digital repository maintenance window",
            (
                "The IEEE / ACM digital library will be unavailable on Sunday 02:00–06:00 IST for maintenance. "
                "Plan literature survey work accordingly.\n\n— Prof. Rajesh K. Khanna"
            ),
            fac_ids[1],
        ),
        (
            "CS301",
            "Hackathon practice session — Saturday",
            (
                "Optional DSA practice for interested teams. Bring laptops; problems will mirror ICPC-style rounds. "
                "Snacks sponsored by the student chapter.\n\n— Dr. Ananya S. Iyer"
            ),
            fac_ids[0],
        ),
    ]
    for code, ttl, body, fid in extras:
        ann.append(
            tag(
                {
                    "_id": ObjectId(),
                    "title": ttl,
                    "body": body,
                    "course": code,
                    "facultyId": fid,
                    "createdAt": now - timedelta(days=5),
                }
            )
        )
    db.announcements.insert_many(ann)
    print(f"Inserted {len(ann)} announcements")

    # Section-wise assignment matrix (16 total): each faculty assigns once per section (A/B/C/D).
    asg = []
    section_codes = [f"CSIT-{chr(65 + i)}" for i in range(STUDENT_BATCH_COUNT)]
    for fi, fid in enumerate(fac_ids):
        code, subj = COURSES[fi % len(COURSES)]
        short_title = subj.split("—")[0].strip() if "—" in subj else subj.strip()
        for sec_idx, sec in enumerate(section_codes):
            due = now + timedelta(days=8 + fi * 3 + sec_idx)
            section_profiles = mentees_by_fac[sec_idx]
            subs: list[dict] = []
            # Leave two assignments per section with no seeded submissions (students see Pending / not submitted).
            # Per section: skip sample submission for faculty index 2 and 3 (third & fourth course author).
            skip_sample_submission = fi >= 2
            if section_profiles and not skip_sample_submission:
                subs.append(
                    {
                        "studentId": section_profiles[0],
                        "content": f"Submission for {code} in {sec}: lab write-up attached.",
                        "submittedAt": now - timedelta(days=2),
                        "grade": "B+",
                        "feedback": "Good structure; expand on edge cases.",
                        "status": "GRADED",
                    }
                )
            asg.append(
                tag(
                    {
                        "_id": ObjectId(),
                        "title": f"{code} — {sec}: {short_title} (set by faculty {fi + 1})",
                        "description": (
                            f"Assigned to all students in {sec} ({len(section_profiles)} students). "
                            "Submit through the LMS by the due date."
                        ),
                        "course": code,
                        "dueDate": due,
                        "facultyId": fid,
                        "assignedStudentIds": section_profiles,
                        "submissions": subs,
                        "createdAt": now - timedelta(days=8 - fi + sec_idx),
                    }
                )
            )
    db.assignments.insert_many(asg)
    print(
        f"Inserted {len(asg)} section-wise assignments "
        f"({len(fac_ids)} faculties x {STUDENT_BATCH_COUNT} sections)"
    )

    att = []
    statuses = ("PRESENT", "PRESENT", "LATE", "ABSENT", "PRESENT")
    for d_off in range(15):
        day = base_day + timedelta(days=d_off)
        for ci, (code, _) in enumerate(COURSES):
            for si, sid in enumerate(profile_ids):
                fid = profile_to_mentor_faculty[sid]
                att.append(
                    tag(
                        {
                            "_id": ObjectId(),
                            "studentId": sid,
                            "facultyId": fid,
                            "course": code,
                            "date": d_iso(day),
                            "status": statuses[(d_off + ci + si) % len(statuses)],
                        }
                    )
                )
    db.attendance.insert_many(att)
    print(f"Inserted {len(att)} attendance rows")

    exams = []
    for i, (code, subj) in enumerate(COURSES):
        fid = fac_ids[i % len(fac_ids)]
        exams.append(
            tag(
                {
                    "_id": ObjectId(),
                    "title": f"{code} Mid-semester examination — {subj}",
                    "course": code,
                    "date": now + timedelta(days=20 + i * 3),
                    "venue": f"Block A — Hall {chr(65 + i)}",
                    "durationMinutes": 120 if i < 2 else 90,
                    "facultyId": fid,
                    "description": (
                        "Syllabus: all units covered till week 8. Scientific calculators allowed where applicable. "
                        "Carry college ID."
                    ),
                }
            )
        )
    db.exams.insert_many(exams)
    print(f"Inserted {len(exams)} exams")

    fees = []
    fee_rows = [
        ("Tuition — Semester II", 185000.0, "PENDING"),
        ("Examination fee", 3500.0, "PAID"),
        ("Library & digital resources", 2200.0, "PENDING"),
        ("Laboratory consumables", 4500.0, "OVERDUE"),
    ]
    for si, sid in enumerate(profile_ids):
        for j, (desc, amt, st) in enumerate(fee_rows):
            row = {
                "_id": ObjectId(),
                "studentId": sid,
                "description": desc,
                "amount": amt + si * 100,
                "dueDate": d_iso(date.today() + timedelta(days=15 + j * 7)),
                "status": st,
            }
            if st == "PAID":
                row["paidAt"] = now - timedelta(days=5)
            fees.append(tag(row))
    db.fees.insert_many(fees)
    print(f"Inserted {len(fees)} fees")

    grades_cycle = ("A", "B+", "A-", "B", "A+")
    subs = [
        ("Unit I — Internal", 0.3),
        ("Unit II — Internal", 0.3),
        ("End-semester", 0.4),
    ]
    res = []
    sem = "2024-Even"
    for fac_idx, cohort in enumerate(mentees_by_fac):
        fid = fac_ids[fac_idx]
        for si, sid in enumerate(cohort):
            for ci, (code, title) in enumerate(COURSES):
                for ti, (part, w) in enumerate(subs):
                    max_m = 100.0 * w
                    base = 72 + (si * 3 + ci * 2 + ti) % 24
                    mo = min(max_m - 1, base * w)
                    g = grades_cycle[(si + ci + ti) % len(grades_cycle)]
                    res.append(
                        tag(
                            {
                                "_id": ObjectId(),
                                "studentId": sid,
                                "course": code,
                                "semester": sem,
                                "subject": f"{title} — {part}",
                                "marksObtained": round(mo, 1),
                                "maxMarks": round(max_m, 1),
                                "grade": g,
                                "facultyId": fid,
                                "createdAt": now - timedelta(days=30 - ti - ci),
                            }
                        )
                    )
    db.results.insert_many(res)
    print(f"Inserted {len(res)} results")

    days = ("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY")
    rooms = ("A-101", "A-204", "B-310", "Lab-2", "C-112")
    tt = []
    for i, (code, subj) in enumerate(COURSES):
        fac_idx = i % len(fac_ids)
        fid = fac_ids[fac_idx]
        start_h = 9 + (i * 2) % 5
        tt.append(
            tag(
                {
                    "_id": ObjectId(),
                    "course": code,
                    "subject": subj,
                    "facultyId": fid,
                    "dayOfWeek": days[i % len(days)],
                    "startTime": f"{start_h:02d}:00",
                    "endTime": f"{start_h + 1:02d}:30",
                    "room": rooms[i % len(rooms)],
                    "studentIds": profile_ids,
                }
            )
        )
    db.timetable.insert_many(tt)
    print(f"Inserted {len(tt)} timetable entries")

    print(f"\nPassword for all seeded accounts: {SEED_PASSWORD}")
    client.close()


if __name__ == "__main__":
    main()

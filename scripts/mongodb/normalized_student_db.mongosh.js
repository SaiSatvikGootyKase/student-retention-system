/**
 * Normalized structural collections + indexes on database "student"
 * (mongodb://localhost:27017/student or default DB from URI).
 *
 * Does NOT drop or rename existing app collections (users, profiles, announcements,
 * assignments, attendance, exams, fees, results, timetable, chat_messages,
 * student_dropouts, course_recommendation).
 *
 * Run:
 *   mongosh "mongodb://localhost:27017/student" scripts/mongodb/normalized_student_db.mongosh.js
 * or from repo root:
 *   mongosh mongodb://localhost:27017 --file scripts/mongodb/normalized_student_db.mongosh.js
 */

const studentDb = db.getSiblingDB("student");

const newCollections = [
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
];

for (const name of newCollections) {
  const exists = studentDb.getCollectionInfos({ name }).length > 0;
  if (!exists) {
    studentDb.createCollection(name);
    print(`created collection: student.${name}`);
  } else {
    print(`exists (skip create): student.${name}`);
  }
}

function ensureIndex(coll, keys, opts) {
  const c = studentDb.getCollection(coll);
  const name = opts && opts.name ? opts.name : null;
  const existing = c.getIndexes().map((x) => x.name);
  if (name && existing.includes(name)) {
    print(`index exists: ${coll}.${name}`);
    return;
  }
  c.createIndex(keys, opts || {});
  print(`created index: ${coll} ${JSON.stringify(keys)}`);
}

ensureIndex("courses", { code: 1 }, { unique: true, sparse: true, name: "ix_courses_code_uq" });
ensureIndex("courses", { name: 1 }, { name: "ix_courses_name" });
ensureIndex("sections", { course_id: 1 }, { name: "ix_sections_course_id" });
ensureIndex("sections", { course_id: 1, name: 1 }, { unique: true, name: "ix_sections_course_name_uq" });
ensureIndex("admin_profiles", { user_id: 1 }, { unique: true, name: "ix_admin_profiles_user_id_uq" });
ensureIndex("faculty_profiles", { user_id: 1 }, { unique: true, name: "ix_faculty_profiles_user_id_uq" });
ensureIndex("faculty_profiles", { course_id: 1 }, { name: "ix_faculty_profiles_course_id" });
ensureIndex("faculty_profiles", { department: 1 }, { name: "ix_faculty_profiles_department" });
ensureIndex("faculty_sections", { faculty_id: 1, section_id: 1 }, { unique: true, name: "ix_faculty_sections_map_uq" });
ensureIndex("faculty_sections", { section_id: 1 }, { name: "ix_faculty_sections_section_id" });
ensureIndex("student_sections", { student_id: 1, section_id: 1 }, { unique: true, name: "ix_student_sections_map_uq" });
ensureIndex("student_sections", { section_id: 1 }, { name: "ix_student_sections_section_id" });
ensureIndex("mentors", { faculty_id: 1, student_id: 1 }, { unique: true, name: "ix_mentors_pair_uq" });
ensureIndex("mentors", { student_id: 1 }, { name: "ix_mentors_student_id" });
ensureIndex("assignment_submissions", { assignment_id: 1, student_id: 1 }, { unique: true, name: "ix_submission_assignment_student_uq" });
ensureIndex("assignment_submissions", { student_id: 1 }, { name: "ix_submission_student_id" });
ensureIndex("evaluations", { student_id: 1, course_id: 1 }, { name: "ix_evaluations_student_course" });
ensureIndex("course_recommendations", { student_id: 1 }, { name: "ix_course_rec_student_id" });
ensureIndex("course_recommendations", { recommended_course_id: 1 }, { name: "ix_course_rec_course_id" });

// Shared modules already in DB — optional indexes for future snake_case / FK fields (no-op if empty)
["announcements", "assignments", "attendance", "fees", "results", "timetable", "chat_messages"].forEach((coll) => {
  if (studentDb.getCollectionInfos({ name: coll }).length === 0) return;
  try {
    studentDb.getCollection(coll).createIndex({ course_id: 1 }, { name: `ix_${coll}_course_id`, sparse: true });
    print(`created sparse index: ${coll}.course_id`);
  } catch (e) {
    print(`skip index ${coll}.course_id: ${e.message}`);
  }
});

print("normalized_student_db.mongosh.js finished on database: " + studentDb.getName());

-- =============================================================================
-- College management system — normalized relational schema (PostgreSQL 14+)
--
-- First-time: createdb college_mgmt && psql college_mgmt -f college_management_normalized.sql
-- Re-run: uncomment the DROP block below first (destroys all data in that database).
-- =============================================================================
-- MongoDB (mongodb://localhost:27017, database "student") alignment:
--   users, announcements, assignments, attendance, exams, fees, results,
--   timetable, chat_messages, profiles (= student_profiles), student_dropouts,
--   course_recommendation (marks row) + new collection course_recommendations (FK ML).
-- =============================================================================

-- ----- DEV RESET (uncomment to wipe and recreate) -----
-- DROP TABLE IF EXISTS student_dropouts, course_recommendations, timetable, fees,
--   messaging, results, exams, evaluations, attendance, assignment_submissions,
--   assignments, announcements, mentors, student_sections, faculty_sections,
--   student_profiles, faculty_profiles, admin_profiles, sections, courses, users
--   CASCADE;
-- DROP TYPE IF EXISTS fee_status, attendance_status, user_role CASCADE;

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('admin', 'faculty', 'student');

DROP TYPE IF EXISTS attendance_status CASCADE;
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'excused', 'late');

DROP TYPE IF EXISTS fee_status CASCADE;
CREATE TYPE fee_status AS ENUM ('pending', 'partial', 'paid', 'waived', 'overdue');

CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL,
    email       TEXT        NOT NULL UNIQUE,
    password    TEXT        NOT NULL,
    role        user_role   NOT NULL,
    phone       TEXT,
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE courses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL,
    code        TEXT        NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sections (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id   UUID        NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    UNIQUE (course_id, name)
);

CREATE TABLE admin_profiles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    title       TEXT,
    office      TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE faculty_profiles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    course_id   UUID REFERENCES courses (id) ON DELETE SET NULL,
    department  TEXT NOT NULL,
    age         INTEGER,
    employee_id TEXT UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE student_profiles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    section_id  UUID NOT NULL REFERENCES sections (id) ON DELETE RESTRICT,
    age         INTEGER,
    enrollment_date DATE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE faculty_sections (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id  UUID NOT NULL REFERENCES faculty_profiles (id) ON DELETE CASCADE,
    section_id  UUID NOT NULL REFERENCES sections (id) ON DELETE CASCADE,
    role_label  TEXT,
    UNIQUE (faculty_id, section_id)
);

CREATE TABLE student_sections (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id  UUID NOT NULL REFERENCES student_profiles (id) ON DELETE CASCADE,
    section_id  UUID NOT NULL REFERENCES sections (id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (student_id, section_id)
);

CREATE TABLE mentors (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id  UUID NOT NULL REFERENCES faculty_profiles (id) ON DELETE CASCADE,
    student_id  UUID NOT NULL REFERENCES student_profiles (id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (faculty_id, student_id)
);

CREATE TABLE announcements (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    body        TEXT NOT NULL,
    course_id   UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    faculty_id  UUID NOT NULL REFERENCES faculty_profiles (id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE assignments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    description TEXT,
    course_id   UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    faculty_id  UUID NOT NULL REFERENCES faculty_profiles (id) ON DELETE CASCADE,
    due_date    TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE assignment_submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id   UUID NOT NULL REFERENCES assignments (id) ON DELETE CASCADE,
    student_id      UUID NOT NULL REFERENCES student_profiles (id) ON DELETE CASCADE,
    submission_text TEXT,
    submission_file TEXT,
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    marks           NUMERIC(6,2),
    UNIQUE (assignment_id, student_id)
);

CREATE TABLE attendance (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id  UUID NOT NULL REFERENCES student_profiles (id) ON DELETE CASCADE,
    course_id   UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    faculty_id  UUID NOT NULL REFERENCES faculty_profiles (id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    status      attendance_status NOT NULL,
    note        TEXT,
    UNIQUE (student_id, course_id, faculty_id, session_date)
);

CREATE TABLE evaluations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id  UUID NOT NULL REFERENCES student_profiles (id) ON DELETE CASCADE,
    course_id   UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    faculty_id  UUID NOT NULL REFERENCES faculty_profiles (id) ON DELETE CASCADE,
    marks       NUMERIC(6,2) NOT NULL,
    exam_type   TEXT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE exams (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id   UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    title       TEXT,
    exam_date   DATE NOT NULL,
    start_time  TIME,
    end_time    TIME,
    location    TEXT
);

CREATE TABLE results (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id   UUID NOT NULL REFERENCES student_profiles (id) ON DELETE CASCADE,
    course_id    UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    total_marks  NUMERIC(7,2) NOT NULL,
    grade        TEXT NOT NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (student_id, course_id)
);

CREATE TABLE messaging (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    receiver_id  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    message      TEXT NOT NULL,
    "timestamp"  TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_read      BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE fees (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id  UUID NOT NULL REFERENCES student_profiles (id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount      NUMERIC(12,2) NOT NULL,
    due_date    DATE NOT NULL,
    status      fee_status NOT NULL DEFAULT 'pending'
);

CREATE TABLE timetable (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id  UUID NOT NULL REFERENCES sections (id) ON DELETE CASCADE,
    course_id   UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    faculty_id  UUID NOT NULL REFERENCES faculty_profiles (id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    room        TEXT,
    UNIQUE (section_id, course_id, faculty_id, day_of_week, start_time)
);

CREATE TABLE course_recommendations (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id            UUID NOT NULL REFERENCES student_profiles (id) ON DELETE CASCADE,
    recommended_course_id UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    score_data            JSONB NOT NULL DEFAULT '{}',
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE student_dropouts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id   UUID NOT NULL REFERENCES student_profiles (id) ON DELETE CASCADE,
    risk_score   NUMERIC(5,2),
    predicted    BOOLEAN,
    details      JSONB NOT NULL DEFAULT '{}',
    assessed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_sections_course_id ON sections (course_id);
CREATE INDEX ix_faculty_profiles_course ON faculty_profiles (course_id);
CREATE INDEX ix_student_profiles_section ON student_profiles (section_id);
CREATE INDEX ix_faculty_sections_section ON faculty_sections (section_id);
CREATE INDEX ix_student_sections_section ON student_sections (section_id);
CREATE INDEX ix_mentors_student ON mentors (student_id);
CREATE INDEX ix_announcements_course ON announcements (course_id);
CREATE INDEX ix_assignments_course_due ON assignments (course_id, due_date);
CREATE INDEX ix_submissions_student ON assignment_submissions (student_id);
CREATE INDEX ix_attendance_student_date ON attendance (student_id, session_date);
CREATE INDEX ix_evaluations_student_course ON evaluations (student_id, course_id);
CREATE INDEX ix_exams_course_date ON exams (course_id, exam_date);
CREATE INDEX ix_results_student ON results (student_id);
CREATE INDEX ix_messaging_receiver_time ON messaging (receiver_id, "timestamp");
CREATE INDEX ix_messaging_sender_time ON messaging (sender_id, "timestamp");
CREATE INDEX ix_fees_student_status ON fees (student_id, status);
CREATE INDEX ix_timetable_section ON timetable (section_id);
CREATE INDEX ix_course_rec_student ON course_recommendations (student_id);
CREATE INDEX ix_dropout_student ON student_dropouts (student_id);
CREATE INDEX ix_dropout_predicted ON student_dropouts (predicted) WHERE predicted IS NOT NULL;

COMMIT;

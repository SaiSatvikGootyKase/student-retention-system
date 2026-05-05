package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.model.enums.Role;
import com.example.demo.model.enums.RiskTier;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class SyncService {

    private final StudentDropoutRepository dropoutRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final ResultRepository resultRepository;
    private final AttendanceRepository attendanceRepository;
    private final AssignmentRepository assignmentRepository;
    private final ExamRepository examRepository;
    private final AnnouncementRepository announcementRepository;
    private final FeeRepository feeRepository;
    private final TimetableRepository timetableRepository;

    // ---------------------------------------------------------------
    // SYNC STUDENTS FROM student_dropouts COLLECTION
    // ---------------------------------------------------------------
    public Map<String, Object> syncDropoutStudents() {
        List<StudentDropout> dropouts = dropoutRepository.findAll();
        int synced = 0, skipped = 0;

        for (int i = 0; i < dropouts.size(); i++) {
            StudentDropout d = dropouts.get(i);

            // Generate a deterministic email from index
            String baseName = "student" + (i + 1);
            String email    = baseName + "@university.edu";
            String name     = "Student " + (i + 1);

            // IDEMPOTENT: skip if user already exists
            if (userRepository.findByEmail(email).isPresent()) {
                skipped++;
                continue;
            }

            // 1. Create User
            User user = new User();
            user.setName(name);
            user.setEmail(email);
            user.setPasswordHash("student123");
            user.setRole(Role.STUDENT);
            user.setDepartment(d.getSchool() != null ? d.getSchool() : "General");
            user = userRepository.save(user);

            // 2. Create Student profile
            Student student = new Student();
            student.setUserId(user.getId());
            student.setEnrollmentDate(LocalDate.of(2023, 9, 1));
            student.setMajor("Science");

            Map<String, Object> demo = new LinkedHashMap<>();
            demo.put("gender",                  d.getGender());
            demo.put("age",                     d.getAge());
            demo.put("address",                 d.getAddress());
            demo.put("familySize",              d.getFamilySize());
            demo.put("parentalStatus",          d.getParentalStatus());
            demo.put("motherEducation",         d.getMotherEducation());
            demo.put("fatherEducation",         d.getFatherEducation());
            demo.put("motherJob",               d.getMotherJob());
            demo.put("fatherJob",               d.getFatherJob());
            demo.put("reasonForChoosingSchool", d.getReasonForChoosingSchool());
            demo.put("school",                  d.getSchool());
            demo.put("grade1",                  d.getGrade1());
            demo.put("grade2",                  d.getGrade2());
            demo.put("finalGrade",              d.getFinalGrade());
            demo.put("guardian",                d.getGuardian());
            demo.put("travelTime",              d.getTravelTime());
            demo.put("studyTime",               d.getStudyTime());
            demo.put("numberOfFailures",        d.getNumberOfFailures());
            demo.put("schoolSupport",           d.getSchoolSupport());
            demo.put("familySupport",           d.getFamilySupport());
            demo.put("extraPaidClass",          d.getExtraPaidClass());
            demo.put("extraCurricularActivities", d.getExtraCurricularActivities());
            demo.put("attendedNursery",         d.getAttendedNursery());
            demo.put("wantsHigherEducation",    d.getWantsHigherEducation());
            demo.put("internetAccess",          d.getInternetAccess());
            demo.put("inRelationship",          d.getInRelationship());
            demo.put("familyRelationship",      d.getFamilyRelationship());
            demo.put("freeTime",                d.getFreeTime());
            demo.put("goingOut",                d.getGoingOut());
            demo.put("weekendAlcohol",          d.getWeekendAlcohol());
            demo.put("weekdayAlcohol",          d.getWeekdayAlcohol());
            demo.put("healthStatus",            d.getHealthStatus());
            demo.put("numberOfAbsences",        d.getNumberOfAbsences());
            demo.put("droppedOut",              d.getDroppedOut());
            demo.put("studentDisplayCode",      String.format(java.util.Locale.ROOT, "S%03d", i + 1));
            demo.put("mlCourseMarksStudentId", String.format(java.util.Locale.ROOT, "S%05d", i));
            student.setDemographics(demo);
            student.setDropoutMlFeatures(DropoutMlFeatures.fromStudentDropout(d));

            // Risk score: base on failures, absences, finalGrade
            int failures  = d.getNumberOfFailures()  != null ? d.getNumberOfFailures()  : 0;
            int absences  = d.getNumberOfAbsences()  != null ? d.getNumberOfAbsences()  : 0;
            int finalGrade = d.getFinalGrade()        != null ? d.getFinalGrade()         : 10;

            double riskScore = Math.min(100,
                    (failures * 15) + (absences * 2) + Math.max(0, (10 - finalGrade) * 3)
            );
            if (Boolean.TRUE.equals(d.getDroppedOut())) riskScore = Math.min(100, riskScore + 30);

            RiskTier tier = riskScore >= 60 ? RiskTier.HIGH
                          : riskScore >= 30 ? RiskTier.MEDIUM
                          : RiskTier.LOW;

            student.setCurrentRiskScore(riskScore);
            student.setCurrentRiskTier(tier);
            student.setLastRiskAssessmentAt(LocalDateTime.now());
            student = studentRepository.save(student);

            user.setLinkedProfileId(student.getId());
            userRepository.save(user);

            // 3. Create Results (Grade_1, Grade_2, Final_Grade)
            String[] subjects   = {"Term 1 Assessment", "Term 2 Assessment", "Final Examination"};
            Integer[] marks     = {d.getGrade1(), d.getGrade2(), d.getFinalGrade()};
            String[] semesters  = {"Semester 1", "Semester 1", "Semester 1"};

            for (int j = 0; j < 3; j++) {
                Result result = new Result();
                result.setStudentId(student.getId());
                result.setSubject(subjects[j]);
                result.setCourse("General Science");
                result.setSemester(semesters[j]);
                result.setMarksObtained(marks[j] != null ? marks[j].doubleValue() : 0.0);
                result.setMaxMarks(20.0);
                result.setGrade(gradeLabel(marks[j]));
                result.setCreatedAt(LocalDateTime.now());
                resultRepository.save(result);
            }

            // 4. Create Attendance records (30 total, absences from dataset)
            int totalDays  = 30;
            int absentDays = Math.min(absences, totalDays);
            int presentDays = totalDays - absentDays;
            LocalDate baseDate = LocalDate.of(2024, 1, 15);

            for (int day = 0; day < presentDays; day++) {
                saveAttendance(student.getId(), "General Science", baseDate.plusDays(day), "PRESENT");
            }
            for (int day = 0; day < absentDays; day++) {
                saveAttendance(student.getId(), "General Science", baseDate.plusDays(presentDays + day), "ABSENT");
            }

            synced++;
        }

        log.info("Sync complete: synced={}, skipped={}", synced, skipped);
        return Map.of(
                "total",   dropouts.size(),
                "synced",  synced,
                "skipped", skipped
        );
    }

    // ---------------------------------------------------------------
    // STATUS
    // ---------------------------------------------------------------
    public Map<String, Object> getStatus() {
        return Map.of(
                "totalDropoutRecords",  dropoutRepository.count(),
                "totalUsers",           userRepository.count(),
                "totalStudents",        studentRepository.count(),
                "totalResults",         resultRepository.count(),
                "totalAttendance",      attendanceRepository.count(),
                "totalAssignments",     assignmentRepository.count(),
                "totalExams",           examRepository.count(),
                "totalAnnouncements",   announcementRepository.count(),
                "totalFees",            feeRepository.count(),
                "totalTimetable",       timetableRepository.count()
        );
    }

    // ---------------------------------------------------------------
    // HELPERS
    // ---------------------------------------------------------------
    private void saveAttendance(String studentId, String course, LocalDate date, String status) {
        Attendance a = new Attendance();
        a.setStudentId(studentId);
        a.setCourse(course);
        a.setDate(date);
        a.setStatus(status);
        attendanceRepository.save(a);
    }

    private String gradeLabel(Integer mark) {
        if (mark == null) return "F";
        if (mark >= 18) return "A+";
        if (mark >= 16) return "A";
        if (mark >= 14) return "B";
        if (mark >= 12) return "C";
        if (mark >= 10) return "D";
        return "F";
    }
}

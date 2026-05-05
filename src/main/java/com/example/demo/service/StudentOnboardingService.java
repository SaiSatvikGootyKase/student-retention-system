package com.example.demo.service;

import com.example.demo.model.DropoutMlFeatures;
import com.example.demo.model.MlStudentCourseMark;
import com.example.demo.model.Student;
import com.example.demo.model.User;
import com.example.demo.model.enums.Role;
import com.example.demo.model.enums.RiskTier;
import com.example.demo.repository.MlStudentCourseMarkRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/**
 * Links each student-role {@link User} to a {@link Student} document and maintains a
 * corresponding {@code course_recommendation} row for lecture analytics.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StudentOnboardingService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final MlStudentCourseMarkRepository mlStudentCourseMarkRepository;

    public void ensureStudentLinked(User user) {
        if (user == null || user.getRole() != Role.STUDENT || user.getId() == null) {
            return;
        }
        if (user.getLinkedProfileId() != null && !user.getLinkedProfileId().isBlank()) {
            if (studentRepository.findById(user.getLinkedProfileId()).isEmpty()) {
                log.info("Clearing stale linkedProfileId for user {}", user.getEmail());
                user.setLinkedProfileId(null);
                userRepository.save(user);
            }
        }
        Optional<Student> byUser = studentRepository.findByUserId(user.getId());
        if (byUser.isPresent()) {
            if (user.getLinkedProfileId() == null || !byUser.get().getId().equals(user.getLinkedProfileId())) {
                user.setLinkedProfileId(byUser.get().getId());
                userRepository.save(user);
            }
            Student patched = normalizeStudentDocument(byUser.get());
            studentRepository.save(patched);
            upsertMlMarksRowForStudent(patched);
            fillStudentUserDefaults(user);
            userRepository.save(user);
            return;
        }
        int mlSlot = Math.floorMod(Objects.hash(user.getId()), 50_000);
        Student created = createStudentForUser(user, mlSlot);
        user.setLinkedProfileId(created.getId());
        fillStudentUserDefaults(user);
        userRepository.save(user);
        log.info("Created student profile for user {} -> student {}", user.getEmail(), created.getId());
    }

    private Student createStudentForUser(User user, int mlSlot) {
        Student student = new Student();
        student.setUserId(user.getId());
        student.setEnrollmentDate(LocalDate.now());
        String dept = user.getDepartment() != null && !user.getDepartment().isBlank()
                ? user.getDepartment()
                : "Undeclared";
        student.setMajor(dept);

        applyNewStudentRegistrationProfile(student, user, mlSlot);

        int h = Objects.hash(user.getId(), user.getEmail());
        double riskScore = 22 + (Math.floorMod(h, 58));
        RiskTier tier = riskScore >= 60 ? RiskTier.HIGH : riskScore >= 38 ? RiskTier.MEDIUM : RiskTier.LOW;
        student.setCurrentRiskScore(riskScore);
        student.setCurrentRiskTier(tier);
        student.setLastRiskAssessmentAt(LocalDateTime.now());
        Student saved = studentRepository.save(student);
        upsertMlMarksRowForStudent(saved);
        return saved;
    }

    private void fillStudentUserDefaults(User user) {
        if (user.getDepartment() == null || user.getDepartment().isBlank()) {
            user.setDepartment("General Studies");
        }
        if (user.getPhone() == null) {
            user.setPhone("");
        }
        if (user.getAvatarUrl() == null || user.getAvatarUrl().isBlank()) {
            String seed = URLEncoder.encode(
                    user.getName() != null && !user.getName().isBlank() ? user.getName() : user.getEmail(),
                    StandardCharsets.UTF_8
            );
            user.setAvatarUrl("https://api.dicebear.com/7.x/initials/svg?seed=" + seed);
        }
        user.setLastLogin(LocalDateTime.now());
    }

    /**
     * New student signup: only school (from registration) + placeholders; {@link Student#setDropoutProfileComplete(Boolean)} false.
     */
    private void applyNewStudentRegistrationProfile(Student student, User user, int mlSlot) {
        int slot = Math.floorMod(mlSlot, 50_000);
        String mlId = String.format(Locale.ROOT, "S%05d", slot);
        int displayNum = (slot % 997) + 1;
        String displayCode = String.format(Locale.ROOT, "S%03d", displayNum);
        int v = Math.floorMod(Objects.hash(student.getUserId(), slot, "registration"), 1_000_000);

        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("studentDisplayCode", displayCode);
        profile.put("mlCourseMarksStudentId", mlId);
        profile.put("droppedOut", Boolean.FALSE);
        profile.put("profileSource", "registration");
        profile.put("campus", "Main");
        profile.put("programLevel", "Undergraduate");
        profile.put("studyYear", String.valueOf(1 + (v % 4)));
        if (user.getName() != null && !user.getName().isBlank()) {
            profile.put("listedName", user.getName());
        }
        student.setDemographics(profile);

        DropoutMlFeatures ml = new DropoutMlFeatures();
        ml.setSchool(user.getDepartment() != null ? user.getDepartment().trim() : null);
        ml.setDroppedOut(false);
        student.setDropoutMlFeatures(ml);
        student.setDropoutProfileComplete(false);
    }

    private void applyStudentProfileDemographics(Student student, int mlSlot, String source, String displayNameHint) {
        int slot = Math.floorMod(mlSlot, 50_000);
        String mlId = String.format(Locale.ROOT, "S%05d", slot);
        int displayNum = (slot % 997) + 1;
        String displayCode = String.format(Locale.ROOT, "S%03d", displayNum);
        int v = Math.floorMod(Objects.hash(student.getUserId(), slot, source), 1_000_000);

        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("studentDisplayCode", displayCode);
        profile.put("mlCourseMarksStudentId", mlId);
        DropoutMlFeatures mlRow = DropoutMlFeatures.dummy(slot);
        profile.put("droppedOut", mlRow.getDroppedOut() != null ? mlRow.getDroppedOut() : Boolean.FALSE);
        profile.put("profileSource", source);
        profile.put("campus", "Main");
        profile.put("programLevel", "Undergraduate");
        profile.put("studyYear", String.valueOf(1 + (v % 4)));
        if (displayNameHint != null && !displayNameHint.isBlank()) {
            profile.put("listedName", displayNameHint);
        }
        student.setDemographics(profile);
        student.setDropoutMlFeatures(mlRow);
    }

    /**
     * Ensures a complete {@code course_recommendation} row exists for {@code mlStudentId}
     * (used when provisioning a student profile; import pipelines may overwrite).
     */
    public void upsertMlStudentCourseMarkRow(String mlStudentId, int varietyIndex) {
        if (mlStudentId == null || mlStudentId.isBlank()) {
            return;
        }
        String[] subjects = {"Math", "Physics", "Chemistry", "English", "Computer_Science"};
        int salt = Math.floorMod(varietyIndex, 10_000);
        double base = 42 + (salt * 7) % 48;
        MlStudentCourseMark m = mlStudentCourseMarkRepository.findByStudentId(mlStudentId).orElseGet(MlStudentCourseMark::new);
        m.setStudentId(mlStudentId.trim());
        m.setMath(clampMark(base + (salt % 11)));
        m.setPhysics(clampMark(base + 5 + ((salt / 3) % 13)));
        m.setChemistry(clampMark(base + 9 + ((salt / 5) % 12)));
        m.setEnglish(clampMark(base + 3 + ((salt / 7) % 14)));
        m.setComputerScience(clampMark(base + 11 + ((salt / 11) % 10)));
        m.setRecommendedSubject(subjects[salt % subjects.length]);
        mlStudentCourseMarkRepository.save(m);
    }

    private static double clampMark(double v) {
        return Math.round(Math.max(36.0, Math.min(99.0, v)) * 10.0) / 10.0;
    }

    private void upsertMlMarksRowForStudent(Student student) {
        String mlId = readMlCourseMarksStudentId(student);
        if (mlId == null || mlId.isBlank()) {
            return;
        }
        upsertMlStudentCourseMarkRow(mlId, Objects.hash(student.getId(), student.getUserId(), mlId));
    }

    private static String readMlCourseMarksStudentId(Student student) {
        Map<String, Object> d = student.getDemographics();
        if (d == null) {
            return null;
        }
        Object ml = d.get("mlCourseMarksStudentId");
        return ml != null ? String.valueOf(ml).trim() : null;
    }

    public Student normalizeStudentDocument(Student student) {
        if (student.getEnrollmentDate() == null) {
            student.setEnrollmentDate(LocalDate.now());
        }
        if (student.getMajor() == null || student.getMajor().isBlank()) {
            student.setMajor("Undeclared");
        }
        Map<String, Object> d = student.getDemographics();
        if (d == null || d.get("mlCourseMarksStudentId") == null || String.valueOf(d.get("mlCourseMarksStudentId")).isBlank()) {
            int slot = Math.floorMod(Objects.hash(student.getId(), student.getUserId()), 50_000);
            applyStudentProfileDemographics(student, slot, "profile_normalize", null);
        } else {
            Map<String, Object> merged = new LinkedHashMap<>(d);
            if (merged.get("profileSource") == null && merged.get("seedSource") != null) {
                merged.put("profileSource", merged.get("seedSource"));
            }
            merged.putIfAbsent("profileSource", "imported");
            student.setDemographics(merged);
        }
        if (student.getDropoutMlFeatures() == null) {
            if (Boolean.FALSE.equals(student.getDropoutProfileComplete())) {
                DropoutMlFeatures ml = new DropoutMlFeatures();
                ml.setDroppedOut(false);
                student.setDropoutMlFeatures(ml);
            } else {
                int slot = Math.floorMod(Objects.hash(student.getId(), student.getUserId()), 50_000);
                DropoutMlFeatures mlRow = DropoutMlFeatures.dummy(slot);
                student.setDropoutMlFeatures(mlRow);
                Map<String, Object> d2 = student.getDemographics();
                if (d2 != null) {
                    Map<String, Object> merged = new LinkedHashMap<>(d2);
                    merged.putIfAbsent("droppedOut", mlRow.getDroppedOut());
                    student.setDemographics(merged);
                }
            }
        }
        if (student.getCurrentRiskScore() == null || student.getCurrentRiskTier() == null) {
            int h = Objects.hash(student.getId(), student.getUserId());
            double riskScore = 20 + (Math.floorMod(h, 62));
            RiskTier tier = riskScore >= 60 ? RiskTier.HIGH : riskScore >= 38 ? RiskTier.MEDIUM : RiskTier.LOW;
            student.setCurrentRiskScore(riskScore);
            student.setCurrentRiskTier(tier);
        }
        if (student.getLastRiskAssessmentAt() == null) {
            student.setLastRiskAssessmentAt(LocalDateTime.now());
        }
        return student;
    }

    private static int parseMlSlotFromId(String mlId) {
        if (mlId == null) {
            return 0;
        }
        String t = mlId.trim();
        if (t.length() >= 2 && (t.charAt(0) == 'S' || t.charAt(0) == 's')) {
            try {
                return Integer.parseInt(t.substring(1));
            } catch (NumberFormatException ignored) {
                return Math.floorMod(t.hashCode(), 50_000);
            }
        }
        return Math.floorMod(t.hashCode(), 50_000);
    }
}

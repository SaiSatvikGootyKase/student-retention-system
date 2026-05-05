package com.example.demo.service;

import com.example.demo.dto.AcademicHealthDto;
import com.example.demo.dto.DropoutMlProfileUpdateDto;
import com.example.demo.model.DropoutMlFeatures;
import com.example.demo.model.Student;
import com.example.demo.model.StudentDropout;
import com.example.demo.model.User;
import com.example.demo.repository.StudentDropoutRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final StudentDropoutRepository studentDropoutRepository;

    public Map<String, Object> getStudentProfile(String studentIdOrUserId) {
        Student student = resolveStudent(studentIdOrUserId);
        
        User user = userRepository.findById(student.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("studentId", student.getId());
        body.put("name", user.getName());
        body.put("email", user.getEmail());
        body.put("major", student.getMajor());
        body.put("mentor", student.getMentor());
        body.put("section", student.getSection());
        body.put("enrollmentDate", student.getEnrollmentDate());
        body.put("demographics", student.getDemographics() != null ? student.getDemographics() : Map.of());
        body.put("dropoutMlFeatures", student.getDropoutMlFeatures());
        body.put("predictedDropout", student.getPredictedDropout());
        Boolean rawComplete = student.getDropoutProfileComplete();
        body.put(
                "dropoutProfileComplete",
                Boolean.FALSE.equals(rawComplete) ? Boolean.FALSE : Boolean.TRUE
        );
        return body;
    }

    /**
     * Saves full dropout-model inputs on the student profile and marks the onboarding gate complete.
     * Writes to MongoDB {@code student} / {@code profiles} ({@link Student}): {@code dropoutMlFeatures},
     * {@code dropoutProfileComplete}, {@code demographics.droppedOut}; updates {@code users.department} from School.
     */
    public Map<String, Object> updateDropoutProfile(String studentIdOrUserId, DropoutMlProfileUpdateDto dto) {
        Student student = resolveStudent(studentIdOrUserId);
        DropoutMlFeatures f = student.getDropoutMlFeatures() != null
                ? student.getDropoutMlFeatures()
                : new DropoutMlFeatures();
        applyDtoToFeatures(dto, f);
        if (f.getDroppedOut() == null) {
            f.setDroppedOut(Boolean.FALSE);
        }
        applyMlDefaultsForFieldsNotCollectedInUi(f);
        validateDropoutProfile(f);
        student.setDropoutMlFeatures(f);
        student.setDropoutProfileComplete(true);

        Map<String, Object> demo = student.getDemographics();
        if (demo == null) {
            demo = new LinkedHashMap<>();
        } else {
            demo = new LinkedHashMap<>(demo);
        }
        demo.put("droppedOut", f.getDroppedOut());

        student.setDemographics(demo);
        studentRepository.save(student);

        StudentDropout mirrored = StudentDropout.fromMlFeatures(student.getId(), f);
        if (mirrored != null) {
            studentDropoutRepository.save(mirrored);
        }

        User u = userRepository.findById(student.getUserId()).orElse(null);
        if (u != null && f.getSchool() != null && !f.getSchool().isBlank()) {
            u.setDepartment(f.getSchool().trim());
            userRepository.save(u);
        }

        return Map.of(
                "dropoutProfileComplete", true,
                "studentId", student.getId(),
                "message", "Dropout profile saved."
        );
    }

    private static void applyDtoToFeatures(DropoutMlProfileUpdateDto dto, DropoutMlFeatures f) {
        f.setSchool(trimOrNull(dto.getSchool()));
        f.setGender(trimOrNull(dto.getGender()));
        f.setAge(dto.getAge());
        f.setAddress(trimOrNull(dto.getAddress()));
        f.setFamilySize(trimOrNull(dto.getFamilySize()));
        f.setParentalStatus(trimOrNull(dto.getParentalStatus()));
        f.setMotherEducation(dto.getMotherEducation());
        f.setFatherEducation(dto.getFatherEducation());
        f.setMotherJob(trimOrNull(dto.getMotherJob()));
        f.setFatherJob(trimOrNull(dto.getFatherJob()));
        f.setReasonForChoosingSchool(trimOrNull(dto.getReasonForChoosingSchool()));
        f.setGuardian(trimOrNull(dto.getGuardian()));
        f.setTravelTime(dto.getTravelTime());
        f.setStudyTime(dto.getStudyTime());
        f.setNumberOfFailures(dto.getNumberOfFailures());
        f.setSchoolSupport(trimOrNull(dto.getSchoolSupport()));
        f.setFamilySupport(trimOrNull(dto.getFamilySupport()));
        f.setExtraPaidClass(trimOrNull(dto.getExtraPaidClass()));
        f.setExtraCurricularActivities(trimOrNull(dto.getExtraCurricularActivities()));
        f.setAttendedNursery(trimOrNull(dto.getAttendedNursery()));
        f.setWantsHigherEducation(trimOrNull(dto.getWantsHigherEducation()));
        f.setInternetAccess(trimOrNull(dto.getInternetAccess()));
        f.setInRelationship(trimOrNull(dto.getInRelationship()));
        f.setFamilyRelationship(dto.getFamilyRelationship());
        f.setFreeTime(dto.getFreeTime());
        f.setGoingOut(dto.getGoingOut());
        f.setWeekendAlcohol(dto.getWeekendAlcohol());
        f.setWeekdayAlcohol(dto.getWeekdayAlcohol());
        f.setHealthStatus(dto.getHealthStatus());
        f.setNumberOfAbsences(dto.getNumberOfAbsences());
        f.setGrade1(dto.getGrade1());
        f.setGrade2(dto.getGrade2());
        f.setFinalGrade(dto.getFinalGrade());
        if (dto.getDroppedOut() != null) {
            f.setDroppedOut(dto.getDroppedOut());
        }
    }

    /**
     * Nursery / relationship / alcohol fields are no longer shown in the student UI; keep BSON row valid for ML.
     */
    private static void applyMlDefaultsForFieldsNotCollectedInUi(DropoutMlFeatures f) {
        if (isBlank(f.getAttendedNursery())) {
            f.setAttendedNursery("no");
        }
        if (isBlank(f.getInRelationship())) {
            f.setInRelationship("no");
        }
        if (f.getWeekendAlcohol() == null) {
            f.setWeekendAlcohol(1);
        }
        if (f.getWeekdayAlcohol() == null) {
            f.setWeekdayAlcohol(1);
        }
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private static String trimOrNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static void validateDropoutProfile(DropoutMlFeatures f) {
        requireText(f.getSchool(), "school");
        requireText(f.getGender(), "gender");
        requireInt(f.getAge(), "age");
        requireText(f.getAddress(), "address");
        requireText(f.getFamilySize(), "familySize");
        requireText(f.getParentalStatus(), "parentalStatus");
        requireInt(f.getMotherEducation(), "motherEducation");
        requireInt(f.getFatherEducation(), "fatherEducation");
        requireText(f.getMotherJob(), "motherJob");
        requireText(f.getFatherJob(), "fatherJob");
        requireText(f.getReasonForChoosingSchool(), "reasonForChoosingSchool");
        requireText(f.getGuardian(), "guardian");
        requireInt(f.getTravelTime(), "travelTime");
        requireInt(f.getStudyTime(), "studyTime");
        requireInt(f.getNumberOfFailures(), "numberOfFailures");
        requireText(f.getSchoolSupport(), "schoolSupport");
        requireText(f.getFamilySupport(), "familySupport");
        requireText(f.getExtraPaidClass(), "extraPaidClass");
        requireText(f.getExtraCurricularActivities(), "extraCurricularActivities");
        requireText(f.getWantsHigherEducation(), "wantsHigherEducation");
        requireText(f.getInternetAccess(), "internetAccess");
        requireInt(f.getFamilyRelationship(), "familyRelationship");
        requireInt(f.getFreeTime(), "freeTime");
        requireInt(f.getGoingOut(), "goingOut");
        requireInt(f.getHealthStatus(), "healthStatus");
        requireInt(f.getNumberOfAbsences(), "numberOfAbsences");
        requireGrade0To10(f.getGrade1(), "grade1");
        requireGrade0To10(f.getGrade2(), "grade2");
        requireGrade0To10(f.getFinalGrade(), "finalGrade");
    }

    private static void requireGrade0To10(Integer v, String field) {
        requireInt(v, field);
        if (v < 0 || v > 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " must be between 0 and 10");
        }
    }

    private static void requireText(String v, String field) {
        if (v == null || v.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing or empty: " + field);
        }
    }

    private static void requireInt(Integer v, String field) {
        if (v == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing: " + field);
        }
    }

    public AcademicHealthDto getAcademicHealth(String studentIdOrUserId) {
        Student student = resolveStudent(studentIdOrUserId);

        // Here we would typically fetch the latest RiskAssessment from the database
        // For now, we return the current values from the Student entity directly
        
        String statusMsg = student.getCurrentRiskTier() != null && student.getCurrentRiskTier().name().equals("HIGH") 
                ? "Needs Attention" : "On Track";

        return AcademicHealthDto.builder()
                .studentId(student.getId())
                .currentRiskScore(student.getCurrentRiskScore())
                .currentRiskTier(student.getCurrentRiskTier())
                .contributingFactors(List.of("Recent drop in attendance", "Low score on Midterm")) // Mocked factors
                .statusMessage(statusMsg)
                .build();
    }

    private Student resolveStudent(String studentIdOrUserId) {
        return studentRepository.findById(studentIdOrUserId)
                .or(() -> studentRepository.findByUserId(studentIdOrUserId))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Student not found for id or userId: " + studentIdOrUserId
                ));
    }
}

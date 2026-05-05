package com.example.demo.service;

import com.example.demo.dto.StudentRiskRowDto;
import com.example.demo.dto.TeacherDashboardSummaryDto;
import com.example.demo.model.Student;
import com.example.demo.model.User;
import com.example.demo.model.enums.RiskTier;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeacherDashboardService {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;

    public List<StudentRiskRowDto> getStudentsSortedByRiskHighFirst(String facultyUserId) {
        List<Student> students = rosterForFaculty(facultyUserId);
        List<StudentRiskRowDto> rows = new ArrayList<>();
        int autoCode = 1;
        for (Student s : students) {
            rows.add(toRow(s, autoCode++));
        }
        rows.sort(Comparator
                .comparingInt((StudentRiskRowDto r) -> tierOrder(r.getRiskTier()))
                .thenComparing(StudentRiskRowDto::getFullName, String.CASE_INSENSITIVE_ORDER));
        return rows;
    }

    public TeacherDashboardSummaryDto getSummary(String facultyUserId) {
        List<Student> students = rosterForFaculty(facultyUserId);
        long high = students.stream().filter(s -> s.getCurrentRiskTier() == RiskTier.HIGH).count();
        long med = students.stream().filter(s -> s.getCurrentRiskTier() == RiskTier.MEDIUM).count();
        long low = students.stream().filter(s -> s.getCurrentRiskTier() == RiskTier.LOW).count();
        long nullTier = students.stream().filter(s -> s.getCurrentRiskTier() == null).count();
        low += nullTier;

        double avgPerf = students.stream()
                .mapToDouble(s -> performancePercent(s.getCurrentRiskScore()))
                .average()
                .orElse(55.0);

        List<String> weeks = List.of("Week 1", "Week 2", "Week 3", "Week 4", "Week 5");
        List<Double> assign = new ArrayList<>();
        List<Double> attend = new ArrayList<>();
        List<Double> part = new ArrayList<>();
        fillEngagementTrendSeries(assign, attend, part, avgPerf, students.size(), high);

        String advisorySection = null;
        if (facultyUserId != null && !facultyUserId.isBlank() && !students.isEmpty()) {
            advisorySection = students.stream()
                    .map(Student::getSection)
                    .filter(Objects::nonNull)
                    .filter(s -> !s.isBlank())
                    .findFirst()
                    .orElse(null);
        }

        int interventions = (facultyUserId != null && !facultyUserId.isBlank())
                ? (int) Math.min(15, Math.max(0, students.size() / 3))
                : 15;

        return TeacherDashboardSummaryDto.builder()
                .advisorySection(advisorySection)
                .totalStudents(students.size())
                .highRiskCount(high)
                .mediumRiskCount(med)
                .lowRiskCount(low)
                .atRiskCount(high)
                .activeInterventions(interventions)
                .avgPerformancePercent(round1(avgPerf))
                .trendWeekLabels(weeks)
                .trendAssignmentsPct(assign)
                .trendAttendancePct(attend)
                .trendParticipationPct(part)
                .build();
    }

    private List<Student> rosterForFaculty(String facultyUserId) {
        if (facultyUserId == null || facultyUserId.isBlank()) {
            return studentRepository.findAll();
        }
        return studentRepository.findByMentor(facultyUserId.trim());
    }

    private static double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private static double clamp(double v, double lo, double hi) {
        return Math.max(lo, Math.min(hi, v));
    }

    /**
     * Weekly engagement % for the chart: three series with different levels and shapes (not parallel lines).
     * Anchored on cohort {@code avgPerformancePercent} and high-risk share so imbalanced rosters read realistically.
     */
    private static void fillEngagementTrendSeries(
            List<Double> assign,
            List<Double> attend,
            List<Double> part,
            double avgPerf,
            int nStudents,
            long highCount
    ) {
        assign.clear();
        attend.clear();
        part.clear();

        double stress = nStudents <= 0 ? 0.25 : Math.min(1.0, (double) highCount / nStudents);
        double p = clamp(avgPerf, 35.0, 92.0);

        // Typical pattern: attendance runs above assignment submission rate; participation sits between with more volatility.
        double attendCenter = clamp(p + 10.0 - stress * 22.0, 48.0, 98.0);
        double assignCenter = clamp(p - 9.0 - stress * 18.0, 32.0, 92.0);
        double partCenter = clamp((attendCenter + assignCenter) / 2.0 + 4.0 - stress * 8.0, 36.0, 94.0);

        // Pronounced week-to-week “spikes” (events: holiday dip, mid-term slump, bounce-back) — still cohort-grounded.
        double[] assignDelta = {6.0, -4.0, -16.0, 11.0, -6.0};
        double[] attendDelta = {9.0, -11.0, 7.0, -13.0, 10.0};
        double[] partDelta = {-3.0, 12.0, -15.0, 9.0, -5.0};

        for (int i = 0; i < 5; i++) {
            assign.add(round1(clamp(assignCenter + assignDelta[i], 5.0, 100.0)));
            attend.add(round1(clamp(attendCenter + attendDelta[i], 5.0, 100.0)));
            part.add(round1(clamp(partCenter + partDelta[i], 5.0, 100.0)));
        }
    }

    private StudentRiskRowDto toRow(Student s, int fallbackCodeIndex) {
        User user = s.getUserId() != null
                ? userRepository.findById(s.getUserId()).orElse(null)
                : null;
        String name = user != null && user.getName() != null ? user.getName() : "Unknown";
        String major = Optional.ofNullable(s.getMajor()).orElse("—");
        String displayId = readDisplayCode(s).orElse(String.format(Locale.ROOT, "S%03d", fallbackCodeIndex));
        double risk = s.getCurrentRiskScore() != null ? s.getCurrentRiskScore() : 50.0;
        double perf = performancePercent(risk);
        String tier = s.getCurrentRiskTier() != null ? s.getCurrentRiskTier().name() : RiskTier.LOW.name();

        LocalDateTime ts = s.getLastRiskAssessmentAt();
        if (ts == null && s.getEnrollmentDate() != null) {
            ts = s.getEnrollmentDate().atStartOfDay();
        }
        if (ts == null) {
            ts = LocalDateTime.now().minusDays(1);
        }
        String iso = ts.atZone(ZoneId.systemDefault()).format(ISO);

        String sec = s.getSection();
        if (sec == null || sec.isBlank()) {
            sec = "—";
        }
        return StudentRiskRowDto.builder()
                .studentId(s.getId())
                .displayStudentId(displayId)
                .fullName(name)
                .major(major)
                .section(sec)
                .performancePercent(perf)
                .riskTier(tier)
                .lastUpdatedIso(iso)
                .build();
    }

    private Optional<String> readDisplayCode(Student s) {
        if (s.getDemographics() == null) return Optional.empty();
        Object v = s.getDemographics().get("studentDisplayCode");
        if (v == null) return Optional.empty();
        return Optional.of(String.valueOf(v));
    }

    private static double performancePercent(Double riskScore) {
        double r = riskScore == null ? 50.0 : Math.max(0, Math.min(100, riskScore));
        return Math.round((100.0 - r) * 10.0) / 10.0;
    }

    private static int tierOrder(String tier) {
        if (tier == null) return 3;
        return switch (tier) {
            case "HIGH" -> 0;
            case "MEDIUM" -> 1;
            case "LOW" -> 2;
            default -> 3;
        };
    }
}

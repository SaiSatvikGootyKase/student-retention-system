package com.example.demo.service;

import com.example.demo.dto.CourseRecommendationItemDto;
import com.example.demo.dto.StudentMlInsightsDto;
import com.example.demo.model.MlStudentCourseMark;
import com.example.demo.model.Result;
import com.example.demo.model.Student;
import com.example.demo.model.User;
import com.example.demo.model.enums.Role;
import com.example.demo.model.enums.RiskTier;
import com.example.demo.repository.MlStudentCourseMarkRepository;
import com.example.demo.repository.ResultRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dto.SubjectProbabilityDto;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class StudentMlInsightsService {

    private record SubjectMark(String key, Double mark) {}

    private static final Map<String, String> SUBJECT_TITLES = Map.of(
            "Math", "Mathematics & Problem Solving",
            "Physics", "Physics for Engineers",
            "Chemistry", "Chemistry Fundamentals",
            "English", "Academic English & Communication",
            "Computer_Science", "Data Structures & Algorithms"
    );

    private static final Map<String, String> SUBJECT_BLURBS = Map.of(
            "Math", "Strengthen core quantitative skills used across STEM courses.",
            "Physics", "Build intuition for mechanics and applied concepts.",
            "Chemistry", "Solidify lab and theory foundations for advanced work.",
            "English", "Improve reading, writing, and presentation outcomes.",
            "Computer_Science", "Practice coding patterns, DSA, and software design."
    );

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final StudentOnboardingService studentOnboardingService;
    private final MlStudentCourseMarkRepository marksRepository;
    private final ResultRepository resultRepository;
    private final LectureRfPythonRunner lectureRfPythonRunner;

    /** Mutable accumulator for average % across result rows. */
    private static final class MutableAvg {
        double sum;
        int n;
        String firstSubject;
    }

    public StudentMlInsightsDto getInsights(String studentIdOrUserId) {
        Student student = resolveStudent(studentIdOrUserId);

        RiskTier tier = student.getCurrentRiskTier() != null ? student.getCurrentRiskTier() : RiskTier.LOW;
        double riskScore = student.getCurrentRiskScore() != null ? student.getCurrentRiskScore() : 0.0;
        String riskLabel = tierLabel(tier);

        Boolean dropped = readDroppedOut(student);
        String dropoutSummary = buildDropoutSummary(dropped, student.getPredictedDropout(), tier, riskScore);

        List<Result> dashboardResults = resultRepository.findByStudentId(student.getId());
        boolean hasDashboardResults = dashboardResults != null && !dashboardResults.isEmpty();

        String mlSubject;
        String inferenceSource;
        List<SubjectProbabilityDto> lectureProbs;
        List<CourseRecommendationItemDto> courses;
        boolean marksRowFound;

        if (hasDashboardResults) {
            Map<String, Double> keyAvgs = averageMlKeyPercents(dashboardResults);
            List<CourseRecommendationItemDto> fromResults = coursesFromResultsBySubjectBuckets(dashboardResults, keyAvgs);
            courses = fromResults.isEmpty() ? resultsWithoutMarksPlaceholder() : fromResults;
            lectureProbs = lectureProbsFromKeyAverages(keyAvgs);
            mlSubject = primaryWeakMlKey(keyAvgs);
            if (mlSubject == null && !lectureProbs.isEmpty()) {
                mlSubject = lectureProbs.get(0).getSubject();
            }
            inferenceSource = "results_dashboard";
            marksRowFound = true;
        } else {
            String marksKey = resolveMarksStudentId(student);
            Optional<MlStudentCourseMark> marksOpt = marksKey != null
                    ? marksRepository.findByStudentId(marksKey)
                    : Optional.empty();

            mlSubject = marksOpt.map(MlStudentCourseMark::getRecommendedSubject).orElse(null);
            inferenceSource = marksOpt.isPresent() ? "mongo_dataset" : "none";
            lectureProbs = Collections.emptyList();

            if (marksOpt.isPresent() && marksComplete(marksOpt.get())) {
                MlStudentCourseMark m = marksOpt.get();
                Optional<LectureRfPythonRunner.RfResult> rf = lectureRfPythonRunner.predict(
                        nz(m.getMath()),
                        nz(m.getPhysics()),
                        nz(m.getChemistry()),
                        nz(m.getEnglish()),
                        nz(m.getComputerScience())
                );
                if (rf.isPresent()) {
                    mlSubject = rf.get().primary();
                    lectureProbs = rf.get().top() != null ? rf.get().top() : Collections.emptyList();
                    lectureProbs = topNByProbability(lectureProbs, 2);
                    inferenceSource = "runtime_python_rf";
                }
            }

            final String primaryForUi = mlSubject;
            courses = marksOpt
                    .map(this::coursesFromMarks)
                    .orElseGet(() -> placeholderCourses(primaryForUi));
            marksRowFound = marksOpt.isPresent();
        }

        String goal;
        if (hasDashboardResults) {
            goal = mlSubject != null
                    ? "Focus on " + humanSubject(mlSubject)
                    + " — derived from averages on your Results page (same rows as the Results dashboard)."
                    : "Prioritize the courses below; they have the lowest average % among your posted results.";
        } else {
            goal = mlSubject != null
                    ? "Focus on " + humanSubject(mlSubject) + " — highlighted by the lecture recommendation model."
                    : "No results on file yet and no course_recommendation row linked; post results or import marks for personalized picks.";
        }

        return StudentMlInsightsDto.builder()
                .studentId(student.getId())
                .riskTier(tier.name())
                .riskScore(round1(riskScore))
                .riskLevelLabel(riskLabel)
                .dropoutDatasetLabel(dropped)
                .predictedDropout(student.getPredictedDropout())
                .dropoutInsightSummary(dropoutSummary)
                .mlRecommendedSubject(mlSubject)
                .learningGoalHint(goal)
                .marksRowFound(marksRowFound)
                .recommendedCourses(courses)
                .lectureInferenceSource(inferenceSource)
                .lectureModelTopProbabilities(lectureProbs)
                .build();
    }

    private Student resolveStudent(String studentIdOrUserId) {
        Optional<Student> byId = studentRepository.findById(studentIdOrUserId);
        if (byId.isPresent()) {
            return byId.get();
        }
        Optional<Student> byUserId = studentRepository.findByUserId(studentIdOrUserId);
        if (byUserId.isPresent()) {
            return byUserId.get();
        }
        Optional<User> userOpt = userRepository.findById(studentIdOrUserId);
        if (userOpt.isPresent() && userOpt.get().getRole() == Role.STUDENT) {
            studentOnboardingService.ensureStudentLinked(userOpt.get());
            User fresh = userRepository.findById(userOpt.get().getId()).orElseThrow();
            if (fresh.getLinkedProfileId() != null && !fresh.getLinkedProfileId().isBlank()) {
                Optional<Student> linked = studentRepository.findById(fresh.getLinkedProfileId());
                if (linked.isPresent()) {
                    return linked.get();
                }
            }
            return studentRepository.findByUserId(fresh.getId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Could not provision student profile for userId: " + studentIdOrUserId
                    ));
        }
        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Student not found for id or userId: " + studentIdOrUserId
        );
    }

    private static boolean marksComplete(MlStudentCourseMark m) {
        return m.getMath() != null && m.getPhysics() != null && m.getChemistry() != null
                && m.getEnglish() != null && m.getComputerScience() != null;
    }

    private static double nz(Double v) {
        return v != null ? v : 0.0;
    }

    private static Boolean readDroppedOut(Student student) {
        if (student.getDropoutMlFeatures() != null && student.getDropoutMlFeatures().getDroppedOut() != null) {
            return student.getDropoutMlFeatures().getDroppedOut();
        }
        if (student.getDemographics() == null) return null;
        Object v = student.getDemographics().get("droppedOut");
        if (v instanceof Boolean b) return b;
        if (v != null && "true".equalsIgnoreCase(String.valueOf(v))) return true;
        if (v != null && "false".equalsIgnoreCase(String.valueOf(v))) return false;
        return null;
    }

    private static String buildDropoutSummary(Boolean dropped, Boolean predicted, RiskTier tier, double riskScore) {
        String tierLine = "Retention tier from analytics: " + tier.name() + " (score " + round1(riskScore) + ").";
        if (predicted != null) {
            tierLine += Boolean.TRUE.equals(predicted)
                    ? " Dropout model prediction: at elevated risk of stopping out."
                    : " Dropout model prediction: likely to continue.";
        }
        if (Boolean.TRUE.equals(dropped)) {
            return tierLine + " The dropout dataset flags this profile as withdrawn — prioritize the recommended lectures and mentor check-ins.";
        }
        if (Boolean.FALSE.equals(dropped)) {
            return tierLine + " The dropout dataset does not mark withdrawal; keep steady habits to stay on track.";
        }
        if (predicted != null) {
            return tierLine;
        }
        return tierLine + " Link complete profile + ML batch jobs for a full dropout-model readout.";
    }

    private String resolveMarksStudentId(Student student) {
        Map<String, Object> d = student.getDemographics();
        if (d == null) return null;
        Object ml = d.get("mlCourseMarksStudentId");
        if (ml != null && !String.valueOf(ml).isBlank()) {
            return String.valueOf(ml).trim();
        }
        Object display = d.get("studentDisplayCode");
        if (display instanceof String code) {
            String c = code.trim();
            if (c.matches("S\\d+")) {
                int n = Integer.parseInt(c.substring(1));
                if (n >= 1) {
                    return String.format(Locale.ROOT, "S%05d", n - 1);
                }
            }
        }
        return null;
    }

    private List<CourseRecommendationItemDto> coursesFromMarks(MlStudentCourseMark m) {
        List<SubjectMark> pairs = new ArrayList<>();
        addMark(pairs, "Math", m.getMath());
        addMark(pairs, "Physics", m.getPhysics());
        addMark(pairs, "Chemistry", m.getChemistry());
        addMark(pairs, "English", m.getEnglish());
        addMark(pairs, "Computer_Science", m.getComputerScience());
        pairs.sort(Comparator.comparingDouble(s -> s.mark() != null ? s.mark() : 0.0));

        List<CourseRecommendationItemDto> out = new ArrayList<>();
        int rank = 0;
        for (SubjectMark s : pairs) {
            if (s.mark() == null) continue;
            int pct = (int) Math.round(Math.max(0, Math.min(100, s.mark())));
            boolean weak = rank < 2;
            rank++;
            out.add(CourseRecommendationItemDto.builder()
                    .id(s.key().toLowerCase(Locale.ROOT))
                    .title(SUBJECT_TITLES.getOrDefault(s.key(), s.key()))
                    .tag(weak ? "Core" : "Elective")
                    .description(SUBJECT_BLURBS.getOrDefault(s.key(), "Recommended based on your marks profile."))
                    .progressPercent(pct)
                    .subjectKey(s.key())
                    .build());
        }
        if (out.isEmpty()) {
            return placeholderCourses(m.getRecommendedSubject());
        }
        // UI shows top 2 priority recommendations only (lowest marks first = focus areas).
        if (out.size() > 2) {
            return new ArrayList<>(out.subList(0, 2));
        }
        return out;
    }

    private static void addMark(List<SubjectMark> pairs, String key, Double mark) {
        pairs.add(new SubjectMark(key, mark));
    }

    private List<CourseRecommendationItemDto> placeholderCourses(String mlSubject) {
        String focus = mlSubject != null ? humanSubject(mlSubject) : "STEM foundations";
        return List.of(
                CourseRecommendationItemDto.builder()
                        .id("placeholder-1")
                        .title("Connect your marks profile")
                        .tag("Info")
                        .description("Import rows into course_recommendation and set mlCourseMarksStudentId on the student profile for full recommendations. Suggested focus: " + focus + ".")
                        .progressPercent(0)
                        .subjectKey("—")
                        .build()
        );
    }

    /** Shown when the student has result rows but none carry computable marks. */
    private static List<CourseRecommendationItemDto> resultsWithoutMarksPlaceholder() {
        return List.of(
                CourseRecommendationItemDto.builder()
                        .id("results-no-marks")
                        .title("Results on file — marks pending")
                        .tag("Info")
                        .description("You have entries on the Results page, but none include scores yet. Once marks are posted, this page will rank courses by average %.")
                        .progressPercent(0)
                        .subjectKey("—")
                        .build()
        );
    }

    /**
     * Pick two cards aligned with the lecture buckets: same subject-bucket order (lowest bucket average first),
     * and within each bucket the weakest course by average %. Falls back to global weakest courses if needed.
     */
    private List<CourseRecommendationItemDto> coursesFromResultsBySubjectBuckets(
            List<Result> results,
            Map<String, Double> keyAvgs
    ) {
        if (results == null || results.isEmpty()) {
            return Collections.emptyList();
        }
        if (keyAvgs == null || keyAvgs.isEmpty()) {
            return coursesFromResultsByCourseOnly(results, new HashSet<>(), 2);
        }
        List<String> buckets = keyAvgs.entrySet().stream()
                .sorted(Comparator.comparingDouble(Map.Entry::getValue))
                .limit(2)
                .map(Map.Entry::getKey)
                .toList();
        List<CourseRecommendationItemDto> out = new ArrayList<>();
        Set<String> usedCourses = new HashSet<>();
        for (String bucket : buckets) {
            List<Map.Entry<String, MutableAvg>> ranked = coursesInBucketSortedByAvgAsc(results, bucket);
            for (Map.Entry<String, MutableAvg> e : ranked) {
                if (!usedCourses.add(e.getKey())) {
                    continue;
                }
                out.add(buildResultCourseCard(e.getKey(), e.getValue(), bucket));
                break;
            }
            if (out.size() >= 2) {
                return out;
            }
        }
        int need = 2 - out.size();
        if (need > 0) {
            out.addAll(coursesFromResultsByCourseOnly(results, usedCourses, need));
        }
        return out;
    }

    /** Global weakest courses by course code (used when no bucket map or as fill). */
    private List<CourseRecommendationItemDto> coursesFromResultsByCourseOnly(
            List<Result> results,
            Set<String> skipCourses,
            int limit
    ) {
        Map<String, MutableAvg> byCourse = aggregateResultsByCourse(results);
        if (byCourse.isEmpty()) {
            return Collections.emptyList();
        }
        List<Map.Entry<String, MutableAvg>> sorted = new ArrayList<>(byCourse.entrySet());
        sorted.sort(Comparator.comparingDouble(e -> e.getValue().sum / Math.max(1, e.getValue().n)));
        List<CourseRecommendationItemDto> out = new ArrayList<>();
        for (Map.Entry<String, MutableAvg> e : sorted) {
            if (skipCourses.contains(e.getKey())) {
                continue;
            }
            skipCourses.add(e.getKey());
            String bucket = resolveSubjectKeyForCourse(e.getKey(), e.getValue().firstSubject);
            out.add(buildResultCourseCard(e.getKey(), e.getValue(), bucket));
            if (out.size() >= limit) {
                break;
            }
        }
        return out;
    }

    private static Map<String, MutableAvg> aggregateResultsByCourse(List<Result> results) {
        Map<String, MutableAvg> byCourse = new HashMap<>();
        for (Result r : results) {
            if (r == null || r.getCourse() == null || r.getCourse().isBlank()) {
                continue;
            }
            if (r.getMarksObtained() == null || r.getMaxMarks() == null || r.getMaxMarks() <= 0) {
                continue;
            }
            double pct = 100.0 * r.getMarksObtained() / r.getMaxMarks();
            String c = r.getCourse().trim();
            MutableAvg a = byCourse.computeIfAbsent(c, k -> new MutableAvg());
            a.sum += pct;
            a.n++;
            if (a.firstSubject == null && r.getSubject() != null && !r.getSubject().isBlank()) {
                a.firstSubject = r.getSubject().trim();
            }
        }
        return byCourse;
    }

    /** Courses whose rows map to {@code bucketKey}, sorted by average % ascending (weakest first). */
    private static List<Map.Entry<String, MutableAvg>> coursesInBucketSortedByAvgAsc(List<Result> results, String bucketKey) {
        Map<String, MutableAvg> byCourse = new HashMap<>();
        for (Result r : results) {
            if (r == null || r.getCourse() == null || r.getCourse().isBlank()) {
                continue;
            }
            if (r.getMarksObtained() == null || r.getMaxMarks() == null || r.getMaxMarks() <= 0) {
                continue;
            }
            String key = resolveSubjectKeyForCourse(r.getCourse(), r.getSubject());
            if (!bucketKey.equals(key)) {
                continue;
            }
            double pct = 100.0 * r.getMarksObtained() / r.getMaxMarks();
            String c = r.getCourse().trim();
            MutableAvg a = byCourse.computeIfAbsent(c, k -> new MutableAvg());
            a.sum += pct;
            a.n++;
            if (a.firstSubject == null && r.getSubject() != null && !r.getSubject().isBlank()) {
                a.firstSubject = r.getSubject().trim();
            }
        }
        List<Map.Entry<String, MutableAvg>> ranked = new ArrayList<>(byCourse.entrySet());
        ranked.sort(Comparator.comparingDouble(e -> e.getValue().sum / Math.max(1, e.getValue().n)));
        return ranked;
    }

    private CourseRecommendationItemDto buildResultCourseCard(String course, MutableAvg agg, String bucketKey) {
        double avg = agg.sum / agg.n;
        int pct = (int) Math.round(Math.max(0, Math.min(100, avg)));
        String title = displaySubjectNameFromResult(agg.firstSubject);
        if (title.isBlank()) {
            title = SUBJECT_TITLES.getOrDefault(bucketKey, bucketKey.replace('_', ' '));
        }
        if (title.length() > 90) {
            title = title.substring(0, 87) + "…";
        }
        return CourseRecommendationItemDto.builder()
                .id(slugCourseId(course))
                .title(title)
                .tag("Core")
                .description("Average % for " + course + " on your Results page.")
                .progressPercent(pct)
                .subjectKey(bucketKey)
                .build();
    }

    /**
     * Strip assessment suffixes from the Results subject line (e.g. " — Unit I — Internal")
     * so cards show the course subject name only.
     */
    private static String displaySubjectNameFromResult(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        String t = raw.trim();
        int sep = firstAssessmentSeparatorIndex(t);
        if (sep < 0) {
            return t;
        }
        int sepLen = assessmentSeparatorLength(t, sep);
        if (sepLen <= 0 || sep + sepLen > t.length()) {
            return t;
        }
        String rest = t.substring(sep + sepLen).toLowerCase(Locale.ROOT);
        if (rest.contains("internal")
                || rest.contains("external")
                || rest.contains("unit")
                || rest.contains("semester")
                || rest.contains("mid ")
                || rest.contains("mid-")
                || rest.contains("quiz")
                || rest.contains("exam")) {
            return t.substring(0, sep).trim();
        }
        return t;
    }

    /** Earliest spaced separator: ASCII " — " or typographic " \u2014 " (em dash). */
    private static int firstAssessmentSeparatorIndex(String t) {
        int hyphenPair = t.indexOf(" — ");
        int emDash = t.indexOf(" \u2014 ");
        if (hyphenPair < 0) {
            return emDash;
        }
        if (emDash < 0) {
            return hyphenPair;
        }
        return Math.min(hyphenPair, emDash);
    }

    private static int assessmentSeparatorLength(String t, int sep) {
        if (sep + 3 <= t.length() && t.charAt(sep) == ' ' && t.charAt(sep + 1) == '\u2014' && t.charAt(sep + 2) == ' ') {
            return 3;
        }
        if (sep + 4 <= t.length() && t.charAt(sep) == ' ' && t.charAt(sep + 1) == '-' && t.charAt(sep + 2) == '-' && t.charAt(sep + 3) == ' ') {
            return 4;
        }
        return 0;
    }

    private static String slugCourseId(String course) {
        String s = course.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-");
        if (s.isEmpty()) {
            return "course";
        }
        s = s.replaceAll("^-+", "").replaceAll("-+$", "");
        return s.isEmpty() ? "course" : s;
    }

    /** Map course code / subject line to ML subject keys used by lecture cards and YouTube lists. */
    private static String resolveSubjectKeyForCourse(String course, String subject) {
        String k = courseCodeToMlSubjectKey(course);
        if (k != null) {
            return k;
        }
        k = inferMlKeyFromSubject(subject);
        return k != null ? k : "—";
    }

    private static String courseCodeToMlSubjectKey(String course) {
        if (course == null || course.isBlank()) {
            return null;
        }
        String u = course.trim().toUpperCase(Locale.ROOT);
        if (u.startsWith("CS") || u.startsWith("CSE") || u.startsWith("IT") || u.contains("COMP")) {
            return "Computer_Science";
        }
        if (u.startsWith("MA") || u.startsWith("MTH") || u.startsWith("MT") || u.startsWith("STAT")) {
            return "Math";
        }
        if (u.startsWith("HS") || u.startsWith("EN") || u.startsWith("HU") || u.contains("ENG")) {
            return "English";
        }
        if (u.startsWith("PH") || u.startsWith("PHY")) {
            return "Physics";
        }
        if (u.startsWith("CH") || u.startsWith("CY") || u.startsWith("CHEM")) {
            return "Chemistry";
        }
        return null;
    }

    private static String inferMlKeyFromSubject(String subject) {
        if (subject == null || subject.isBlank()) {
            return null;
        }
        String s = subject.toLowerCase(Locale.ROOT);
        if (s.contains("physics") || s.contains("mechanic")) {
            return "Physics";
        }
        if (s.contains("chem") || s.contains("organic")) {
            return "Chemistry";
        }
        if (s.contains("math") || s.contains("calculus") || s.contains("algebra") || s.contains("discrete")) {
            return "Math";
        }
        if (s.contains("english") || s.contains("writing") || s.contains("communication") || s.contains("grammar")) {
            return "English";
        }
        if (s.contains("program") || s.contains("algorithm") || s.contains("software") || s.contains("computing")) {
            return "Computer_Science";
        }
        return null;
    }

    private Map<String, Double> averageMlKeyPercents(List<Result> results) {
        Map<String, MutableAvg> byKey = new HashMap<>();
        for (Result r : results) {
            if (r == null) {
                continue;
            }
            if (r.getMarksObtained() == null || r.getMaxMarks() == null || r.getMaxMarks() <= 0) {
                continue;
            }
            String course = r.getCourse() != null ? r.getCourse() : "";
            String key = resolveSubjectKeyForCourse(course, r.getSubject());
            if ("—".equals(key)) {
                continue;
            }
            double pct = 100.0 * r.getMarksObtained() / r.getMaxMarks();
            MutableAvg a = byKey.computeIfAbsent(key, k -> new MutableAvg());
            a.sum += pct;
            a.n++;
        }
        Map<String, Double> out = new HashMap<>();
        for (Map.Entry<String, MutableAvg> e : byKey.entrySet()) {
            if (e.getValue().n > 0) {
                out.put(e.getKey(), e.getValue().sum / e.getValue().n);
            }
        }
        return out;
    }

    private static String primaryWeakMlKey(Map<String, Double> avgs) {
        if (avgs == null || avgs.isEmpty()) {
            return null;
        }
        return avgs.entrySet().stream()
                .min(Comparator.comparingDouble(Map.Entry::getValue))
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    private List<SubjectProbabilityDto> lectureProbsFromKeyAverages(Map<String, Double> avgs) {
        if (avgs == null || avgs.isEmpty()) {
            return Collections.emptyList();
        }
        List<SubjectProbabilityDto> list = new ArrayList<>();
        for (Map.Entry<String, Double> e : avgs.entrySet()) {
            double avg = e.getValue();
            double prob = Math.max(0, Math.min(1.0, (100.0 - avg) / 100.0));
            list.add(SubjectProbabilityDto.builder().subject(e.getKey()).probability(prob).build());
        }
        return topNByProbability(list, 2);
    }

    private static String tierLabel(RiskTier tier) {
        return switch (tier) {
            case HIGH -> "High";
            case MEDIUM -> "Moderate";
            case LOW -> "Low";
        };
    }

    private static String humanSubject(String key) {
        if (key == null) return "your subjects";
        return SUBJECT_TITLES.getOrDefault(key, key.replace('_', ' '));
    }

    private static double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    /** Keep only the highest-probability subjects for UI (e.g. top 2). Probabilities may be 0–1 or 0–100. */
    private static List<SubjectProbabilityDto> topNByProbability(List<SubjectProbabilityDto> list, int n) {
        if (list == null || list.isEmpty() || n <= 0) {
            return list == null ? Collections.emptyList() : list;
        }
        return list.stream()
                .sorted(Comparator.comparingDouble((SubjectProbabilityDto s) -> normalizeProbability(s.getProbability()))
                        .reversed())
                .limit(n)
                .toList();
    }

    private static double normalizeProbability(Double p) {
        if (p == null) {
            return 0.0;
        }
        return p <= 1.0 ? p : p / 100.0;
    }
}

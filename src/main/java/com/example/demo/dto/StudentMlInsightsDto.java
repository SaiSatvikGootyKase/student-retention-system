package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Dropout / retention signals plus lecture recommendations derived from {@code course_recommendation}.
 */
@Data
@Builder
public class StudentMlInsightsDto {
    private String studentId;
    /** HIGH, MEDIUM, LOW — aligned with retention analytics on the student record. */
    private String riskTier;
    private double riskScore;
    /** e.g. Low, Moderate, High — student-friendly. */
    private String riskLevelLabel;
    /** Whether the seeded dropout dataset marked this profile as dropped out (ground truth), if known. */
    private Boolean dropoutDatasetLabel;
    /** Last dropout model prediction ({@code true} / {@code false}), when a batch job has written it. */
    private Boolean predictedDropout;
    /** Short copy for the UI explaining dropout-related insight. */
    private String dropoutInsightSummary;
    /** Primary subject from ML marks table ({@code recommended_subject} column = RF training label). */
    private String mlRecommendedSubject;
    private String learningGoalHint;
    private boolean marksRowFound;
    private List<CourseRecommendationItemDto> recommendedCourses;
    /**
     * {@code runtime_python_rf} when {@link com.example.demo.service.LectureRfPythonRunner} succeeded,
     * else {@code mongo_dataset} from {@code recommended_subject} in Mongo.
     */
    private String lectureInferenceSource;
    /** Top class probabilities from live RF when {@code lectureInferenceSource} is runtime. */
    private List<SubjectProbabilityDto> lectureModelTopProbabilities;
}

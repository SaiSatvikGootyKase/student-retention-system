package com.example.demo.model;

import com.example.demo.model.enums.RiskTier;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Document(collection = "profiles")
public class Student {
    @Id
    private String id;
    
    // ref: Users
    private String userId;

    /** Faculty mentor: {@code users._id} of the assigned faculty (same as LMS {@code facultyId}). */
    private String mentor;

    /** Advisory section code (e.g. CSIT-A); each section is tied to one faculty mentor in seed data. */
    private String section;

    private LocalDate enrollmentDate;
    private String major;
    
    // Can store various demographic attributes
    private Map<String, Object> demographics;

    /**
     * Full ML dropout feature row (same BSON field names as {@code student_dropouts} / training CSV).
     * Persisted in MongoDB database {@code student}, collection {@code profiles}, on this document.
     */
    private DropoutMlFeatures dropoutMlFeatures;

    /** Latest batch dropout model prediction; ground truth label stays in {@code dropoutMlFeatures.droppedOut}. */
    private Boolean predictedDropout;

    /**
     * When {@code false}, the student must complete {@link #dropoutMlFeatures} (dropout model inputs).
     * {@code null} on legacy profiles means "no gate" (treated as complete in API).
     */
    private Boolean dropoutProfileComplete;

    private Double currentRiskScore;
    private RiskTier currentRiskTier;

    /** When risk tier/score was last evaluated (ISO timestamp in API). */
    private LocalDateTime lastRiskAssessmentAt;
}

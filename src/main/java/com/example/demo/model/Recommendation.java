package com.example.demo.model;

import com.example.demo.model.enums.RecommendationStatus;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "recommendations")
public class Recommendation {
    @Id
    private String id;
    private String studentId;
    private String lectureId;
    private Double confidenceScore;
    private RecommendationStatus status;
    private LocalDateTime generatedAt;
    private LocalDateTime completedAt;
}

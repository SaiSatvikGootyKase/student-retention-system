package com.example.demo.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Document(collection = "risk_assessments")
@CompoundIndex(def = "{'studentId': 1, 'timestamp': -1}", name = "student_time_idx")
public class RiskAssessment {
    @Id
    private String id;
    
    @Indexed
    private String studentId;
    
    private LocalDateTime timestamp;
    private Double calculatedScore;
    private List<String> contributingFactors;
    private String modelId;
}

package com.example.demo.model;

import com.example.demo.model.enums.InterventionType;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Data
@Document(collection = "intervention_logs")
@CompoundIndex(def = "{'teacherId': 1, 'createdAt': -1}", name = "teacher_time_idx")
public class InterventionLog {
    @Id
    private String id;
    
    @Indexed
    private String studentId;
    
    @Indexed
    private String teacherId;
    
    private InterventionType type;
    private String notes;
    private String outcome;
    private LocalDateTime createdAt;
}

package com.example.demo.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.Map;

@Data
@Document(collection = "academic_records")
public class AcademicRecord {
    @Id
    private String id;
    private String studentId;
    private String courseId;
    
    // Using a Map for assignments where key is assignment name and value is the score
    private List<Map<String, Double>> assignments;
    
    private Double attendanceRate;
    private String term;
}

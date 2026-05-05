package com.example.demo.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "results")
public class Result {
    @Id
    private String id;
    private String studentId;
    private String course;
    private String semester;
    private String subject;
    private Double marksObtained;
    private Double maxMarks;
    private String grade;
    private String facultyId;
    private LocalDateTime createdAt;
}

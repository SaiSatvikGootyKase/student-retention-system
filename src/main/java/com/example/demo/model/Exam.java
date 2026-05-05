package com.example.demo.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "exams")
public class Exam {
    @Id
    private String id;
    private String title;
    private String course;
    private LocalDateTime date;
    private String venue;
    private Integer durationMinutes;
    private String facultyId;
    private String description;
}

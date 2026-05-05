package com.example.demo.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Document(collection = "assignments")
public class Assignment {
    @Id
    private String id;
    private String title;
    private String description;
    private String course;
    private LocalDateTime dueDate;
    private String facultyId;
    private List<String> assignedStudentIds = new ArrayList<>();
    private List<Submission> submissions = new ArrayList<>();
    private Boolean completed = Boolean.FALSE;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;

    @Data
    public static class Submission {
        private String studentId;
        private String content;
        private String attachmentFileName;
        private String attachmentMimeType;
        private String attachmentBase64;
        private LocalDateTime submittedAt;
        private String grade;
        private String feedback;
        private String status; // PENDING, SUBMITTED, GRADED
    }
}

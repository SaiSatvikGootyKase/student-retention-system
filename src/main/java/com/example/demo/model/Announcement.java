package com.example.demo.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "announcements")
public class Announcement {
    @Id
    private String id;
    private String title;
    private String body;
    private String course;
    private String facultyId;
    private LocalDateTime createdAt;
}

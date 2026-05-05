package com.example.demo.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Data
@Document(collection = "lectures")
public class Lecture {
    @Id
    private String id;
    private String title;
    private String description;
    private List<String> tags;
    private String difficultyLevel;
    private Long durationSeconds;
    private String videoUrl;
}

package com.example.demo.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Data
@Document(collection = "attendance")
public class Attendance {
    @Id
    private String id;
    private String studentId;
    private String facultyId;
    private String course;
    private LocalDate date;
    private String status; // PRESENT, ABSENT, LATE
}

package com.example.demo.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Document(collection = "fees")
public class Fee {
    @Id
    private String id;
    private String studentId;
    private String description;
    private Double amount;
    private LocalDate dueDate;
    private String status; // PENDING, PAID, OVERDUE
    private LocalDateTime paidAt;
}

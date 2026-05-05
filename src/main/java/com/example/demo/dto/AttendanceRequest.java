package com.example.demo.dto;

import lombok.Data;

@Data
public class AttendanceRequest {
    private String studentId;
    private String course;
    private String date; // yyyy-MM-dd
    private String status; // PRESENT, ABSENT, LATE
}

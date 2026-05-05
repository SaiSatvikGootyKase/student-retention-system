package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StudentRiskRowDto {
    private String studentId;
    private String displayStudentId;
    private String fullName;
    private String major;
    /** Section code (e.g. CSIT-A). */
    private String section;
    /** 0–100, higher is better academic standing (inverse of risk emphasis in UI). */
    private double performancePercent;
    private String riskTier;
    /** ISO-8601 instant for "Last updated" column. */
    private String lastUpdatedIso;
}

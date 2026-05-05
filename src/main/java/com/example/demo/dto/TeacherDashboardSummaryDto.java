package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class TeacherDashboardSummaryDto {
    /** When dashboard is scoped to a faculty, the section they advise (e.g. CSIT-A). */
    private String advisorySection;
    private long totalStudents;
    private long highRiskCount;
    private long mediumRiskCount;
    private long lowRiskCount;
    /** Same as highRiskCount — students needing attention first. */
    private long atRiskCount;
    /** Placeholder until interventions collection is wired. */
    private int activeInterventions;
    private double avgPerformancePercent;
    private List<String> trendWeekLabels;
    private List<Double> trendAssignmentsPct;
    private List<Double> trendAttendancePct;
    private List<Double> trendParticipationPct;
}

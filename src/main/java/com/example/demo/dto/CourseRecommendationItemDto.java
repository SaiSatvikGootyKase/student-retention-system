package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CourseRecommendationItemDto {
    private String id;
    private String title;
    private String tag;
    private String description;
    /** 0–100 from subject mark in ML dataset. */
    private int progressPercent;
    private String subjectKey;
}

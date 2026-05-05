package com.example.demo.dto;

import com.example.demo.model.enums.RiskTier;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AcademicHealthDto {
    private String studentId;
    private Double currentRiskScore;
    private RiskTier currentRiskTier;
    private List<String> contributingFactors;
    private String statusMessage;
}

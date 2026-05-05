package com.example.demo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * Request body for completing student dropout-model fields (camelCase JSON).
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class DropoutMlProfileUpdateDto {

    private String school;
    private String gender;
    private Integer age;
    private String address;
    private String familySize;
    private String parentalStatus;
    private Integer motherEducation;
    private Integer fatherEducation;
    private String motherJob;
    private String fatherJob;
    private String reasonForChoosingSchool;
    private String guardian;
    private Integer travelTime;
    private Integer studyTime;
    private Integer numberOfFailures;
    private String schoolSupport;
    private String familySupport;
    private String extraPaidClass;
    private String extraCurricularActivities;
    private String attendedNursery;
    private String wantsHigherEducation;
    private String internetAccess;
    private String inRelationship;
    private Integer familyRelationship;
    private Integer freeTime;
    private Integer goingOut;
    private Integer weekendAlcohol;
    private Integer weekdayAlcohol;
    private Integer healthStatus;
    private Integer numberOfAbsences;
    private Integer grade1;
    private Integer grade2;
    private Integer finalGrade;
    private Boolean droppedOut;
}

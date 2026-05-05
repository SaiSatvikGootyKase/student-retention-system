package com.example.demo.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Data
@Document(collection = "student_dropouts")
public class StudentDropout {

    @Id
    private String id;

    @Field("School")
    private String school;

    @Field("Gender")
    private String gender;

    @Field("Age")
    private Integer age;

    @Field("Address")
    private String address;

    @Field("Family_Size")
    private String familySize;

    @Field("Parental_Status")
    private String parentalStatus;

    @Field("Mother_Education")
    private Integer motherEducation;

    @Field("Father_Education")
    private Integer fatherEducation;

    @Field("Mother_Job")
    private String motherJob;

    @Field("Father_Job")
    private String fatherJob;

    @Field("Reason_for_Choosing_School")
    private String reasonForChoosingSchool;

    @Field("Guardian")
    private String guardian;

    @Field("Travel_Time")
    private Integer travelTime;

    @Field("Study_Time")
    private Integer studyTime;

    @Field("Number_of_Failures")
    private Integer numberOfFailures;

    @Field("School_Support")
    private String schoolSupport;

    @Field("Family_Support")
    private String familySupport;

    @Field("Extra_Paid_Class")
    private String extraPaidClass;

    @Field("Extra_Curricular_Activities")
    private String extraCurricularActivities;

    @Field("Attended_Nursery")
    private String attendedNursery;

    @Field("Wants_Higher_Education")
    private String wantsHigherEducation;

    @Field("Internet_Access")
    private String internetAccess;

    @Field("In_Relationship")
    private String inRelationship;

    @Field("Family_Relationship")
    private Integer familyRelationship;

    @Field("Free_Time")
    private Integer freeTime;

    @Field("Going_Out")
    private Integer goingOut;

    @Field("Weekend_Alcohol_Consumption")
    private Integer weekendAlcohol;

    @Field("Weekday_Alcohol_Consumption")
    private Integer weekdayAlcohol;

    @Field("Health_Status")
    private Integer healthStatus;

    @Field("Number_of_Absences")
    private Integer numberOfAbsences;

    @Field("Grade_1")
    private Integer grade1;

    @Field("Grade_2")
    private Integer grade2;

    @Field("Final_Grade")
    private Integer finalGrade;

    @Field("Dropped_Out")
    private Boolean droppedOut;

    /**
     * Mirror {@link DropoutMlFeatures} into {@code student_dropouts} (same CSV column names) for analytics / ML jobs.
     * Uses the LMS {@code profiles} document id as {@code _id} so each student upserts one row.
     */
    public static StudentDropout fromMlFeatures(String profileDocumentId, DropoutMlFeatures f) {
        if (f == null) {
            return null;
        }
        StudentDropout d = new StudentDropout();
        d.setId(profileDocumentId);
        d.setSchool(f.getSchool());
        d.setGender(f.getGender());
        d.setAge(f.getAge());
        d.setAddress(f.getAddress());
        d.setFamilySize(f.getFamilySize());
        d.setParentalStatus(f.getParentalStatus());
        d.setMotherEducation(f.getMotherEducation());
        d.setFatherEducation(f.getFatherEducation());
        d.setMotherJob(f.getMotherJob());
        d.setFatherJob(f.getFatherJob());
        d.setReasonForChoosingSchool(f.getReasonForChoosingSchool());
        d.setGuardian(f.getGuardian());
        d.setTravelTime(f.getTravelTime());
        d.setStudyTime(f.getStudyTime());
        d.setNumberOfFailures(f.getNumberOfFailures());
        d.setSchoolSupport(f.getSchoolSupport());
        d.setFamilySupport(f.getFamilySupport());
        d.setExtraPaidClass(f.getExtraPaidClass());
        d.setExtraCurricularActivities(f.getExtraCurricularActivities());
        d.setAttendedNursery(f.getAttendedNursery());
        d.setWantsHigherEducation(f.getWantsHigherEducation());
        d.setInternetAccess(f.getInternetAccess());
        d.setInRelationship(f.getInRelationship());
        d.setFamilyRelationship(f.getFamilyRelationship());
        d.setFreeTime(f.getFreeTime());
        d.setGoingOut(f.getGoingOut());
        d.setWeekendAlcohol(f.getWeekendAlcohol());
        d.setWeekdayAlcohol(f.getWeekdayAlcohol());
        d.setHealthStatus(f.getHealthStatus());
        d.setNumberOfAbsences(f.getNumberOfAbsences());
        d.setGrade1(f.getGrade1());
        d.setGrade2(f.getGrade2());
        d.setFinalGrade(f.getFinalGrade());
        d.setDroppedOut(f.getDroppedOut());
        return d;
    }
}

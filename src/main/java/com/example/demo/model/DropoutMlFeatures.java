package com.example.demo.model;

import lombok.Data;
import org.springframework.data.mongodb.core.mapping.Field;

/**
 * Embedded ML feature row (same field names as {@link StudentDropout} / training CSV) stored on
 * {@link Student} so batch dropout models can read one document without joining collections.
 */
@Data
public class DropoutMlFeatures {

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

    public static DropoutMlFeatures fromStudentDropout(StudentDropout d) {
        if (d == null) {
            return null;
        }
        DropoutMlFeatures f = new DropoutMlFeatures();
        f.setSchool(d.getSchool());
        f.setGender(d.getGender());
        f.setAge(d.getAge());
        f.setAddress(d.getAddress());
        f.setFamilySize(d.getFamilySize());
        f.setParentalStatus(d.getParentalStatus());
        f.setMotherEducation(d.getMotherEducation());
        f.setFatherEducation(d.getFatherEducation());
        f.setMotherJob(d.getMotherJob());
        f.setFatherJob(d.getFatherJob());
        f.setReasonForChoosingSchool(d.getReasonForChoosingSchool());
        f.setGuardian(d.getGuardian());
        f.setTravelTime(d.getTravelTime());
        f.setStudyTime(d.getStudyTime());
        f.setNumberOfFailures(d.getNumberOfFailures());
        f.setSchoolSupport(d.getSchoolSupport());
        f.setFamilySupport(d.getFamilySupport());
        f.setExtraPaidClass(d.getExtraPaidClass());
        f.setExtraCurricularActivities(d.getExtraCurricularActivities());
        f.setAttendedNursery(d.getAttendedNursery());
        f.setWantsHigherEducation(d.getWantsHigherEducation());
        f.setInternetAccess(d.getInternetAccess());
        f.setInRelationship(d.getInRelationship());
        f.setFamilyRelationship(d.getFamilyRelationship());
        f.setFreeTime(d.getFreeTime());
        f.setGoingOut(d.getGoingOut());
        f.setWeekendAlcohol(d.getWeekendAlcohol());
        f.setWeekdayAlcohol(d.getWeekdayAlcohol());
        f.setHealthStatus(d.getHealthStatus());
        f.setNumberOfAbsences(d.getNumberOfAbsences());
        f.setGrade1(d.getGrade1());
        f.setGrade2(d.getGrade2());
        f.setFinalGrade(d.getFinalGrade());
        f.setDroppedOut(d.getDroppedOut());
        return f;
    }

    /**
     * Deterministic pseudo-random row in the same value ranges as the UCI-style dropout CSV.
     */
    public static DropoutMlFeatures dummy(int seed) {
        int s = Math.floorMod(seed, 1_000_000);
        String[] schools = {"GP", "MS"};
        String[] genders = {"F", "M"};
        String[] addr = {"U", "R"};
        String[] fam = {"LE3", "GT3"};
        String[] par = {"A", "T"};
        String[] jobs = {"at_home", "teacher", "health", "services", "other"};
        String[] reasons = {"course", "home", "reputation", "other"};
        String[] guardians = {"mother", "father", "other"};
        String[] yn = {"yes", "no"};

        DropoutMlFeatures f = new DropoutMlFeatures();
        f.setSchool(schools[s % schools.length]);
        f.setGender(genders[(s / 3) % genders.length]);
        f.setAge(15 + (s % 4));
        f.setAddress(addr[(s / 5) % addr.length]);
        f.setFamilySize(fam[(s / 7) % fam.length]);
        f.setParentalStatus(par[(s / 11) % par.length]);
        f.setMotherEducation(1 + (s % 4));
        f.setFatherEducation(1 + ((s / 13) % 4));
        f.setMotherJob(jobs[s % jobs.length]);
        f.setFatherJob(jobs[(s / 17) % jobs.length]);
        f.setReasonForChoosingSchool(reasons[(s / 19) % reasons.length]);
        f.setGuardian(guardians[(s / 23) % guardians.length]);
        f.setTravelTime(1 + (s % 4));
        f.setStudyTime(1 + ((s / 29) % 4));
        f.setNumberOfFailures(s % 4);
        f.setSchoolSupport(yn[(s / 31) % 2]);
        f.setFamilySupport(yn[(s / 37) % 2]);
        f.setExtraPaidClass(yn[(s / 41) % 2]);
        f.setExtraCurricularActivities(yn[(s / 43) % 2]);
        f.setAttendedNursery(yn[(s / 47) % 2]);
        f.setWantsHigherEducation(yn[(s / 53) % 2]);
        f.setInternetAccess(yn[(s / 59) % 2]);
        f.setInRelationship(yn[(s / 61) % 2]);
        f.setFamilyRelationship(1 + (s % 5));
        f.setFreeTime(1 + ((s / 67) % 5));
        f.setGoingOut(1 + ((s / 71) % 5));
        f.setWeekendAlcohol(1 + (s % 5));
        f.setWeekdayAlcohol(1 + ((s / 73) % 5));
        f.setHealthStatus(1 + ((s / 79) % 5));
        f.setNumberOfAbsences(s % 25);
        int g1 = 10 + (s % 8);
        int g2 = 10 + ((s / 83) % 8);
        f.setGrade1(g1);
        f.setGrade2(g2);
        f.setFinalGrade(Math.min(20, (g1 + g2 + (s % 5)) / 2));
        f.setDroppedOut(s % 11 == 0);
        return f;
    }
}

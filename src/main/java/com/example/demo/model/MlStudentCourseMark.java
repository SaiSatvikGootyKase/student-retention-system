package com.example.demo.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

/**
 * Rows from {@code course_recommendation} (seeded from lecture recommendation CSV / ML pipeline).
 */
@Data
@Document(collection = "course_recommendation")
public class MlStudentCourseMark {

    @Id
    private String id;

    @Indexed
    @Field("student_id")
    private String studentId;

    @Field("Math")
    private Double math;

    @Field("Physics")
    private Double physics;

    @Field("Chemistry")
    private Double chemistry;

    @Field("English")
    private Double english;

    @Field("Computer_Science")
    private Double computerScience;

    /** Label from trained RF model (same CSV column). */
    @Field("recommended_subject")
    private String recommendedSubject;
}

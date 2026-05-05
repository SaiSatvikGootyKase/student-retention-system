package com.example.demo.repository;

import com.example.demo.model.MlStudentCourseMark;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MlStudentCourseMarkRepository extends MongoRepository<MlStudentCourseMark, String> {
    Optional<MlStudentCourseMark> findByStudentId(String studentId);
}

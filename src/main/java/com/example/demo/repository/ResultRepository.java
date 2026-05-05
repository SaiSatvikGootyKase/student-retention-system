package com.example.demo.repository;

import com.example.demo.model.Result;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResultRepository extends MongoRepository<Result, String> {
    List<Result> findByStudentId(String studentId);
    List<Result> findByFacultyId(String facultyId);
    List<Result> findByStudentIdAndCourse(String studentId, String course);
}

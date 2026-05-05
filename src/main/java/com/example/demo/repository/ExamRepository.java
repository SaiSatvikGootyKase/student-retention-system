package com.example.demo.repository;

import com.example.demo.model.Exam;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamRepository extends MongoRepository<Exam, String> {
    List<Exam> findByFacultyId(String facultyId);
    List<Exam> findByCourse(String course);
    List<Exam> findByFacultyIdOrderByDateAsc(String facultyId);
}

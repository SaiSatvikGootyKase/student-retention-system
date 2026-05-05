package com.example.demo.repository;

import com.example.demo.model.Assignment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepository extends MongoRepository<Assignment, String> {
    List<Assignment> findByFacultyId(String facultyId);
    List<Assignment> findByCourse(String course);
    List<Assignment> findByAssignedStudentIdsContaining(String studentId);
}

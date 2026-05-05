package com.example.demo.repository;

import com.example.demo.model.Student;
import com.example.demo.model.enums.RiskTier;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends MongoRepository<Student, String> {
    List<Student> findByCurrentRiskTier(RiskTier riskTier);

    Optional<Student> findByUserId(String userId);

    List<Student> findByMentor(String mentorFacultyUserId);
}

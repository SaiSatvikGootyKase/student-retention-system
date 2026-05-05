package com.example.demo.repository;

import com.example.demo.model.Fee;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeeRepository extends MongoRepository<Fee, String> {
    List<Fee> findByStudentId(String studentId);
    List<Fee> findByStudentIdAndStatus(String studentId, String status);
}

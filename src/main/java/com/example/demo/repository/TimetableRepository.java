package com.example.demo.repository;

import com.example.demo.model.TimetableEntry;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimetableRepository extends MongoRepository<TimetableEntry, String> {
    List<TimetableEntry> findByStudentIdsContaining(String studentId);
    List<TimetableEntry> findByFacultyId(String facultyId);
    List<TimetableEntry> findByCourse(String course);
}

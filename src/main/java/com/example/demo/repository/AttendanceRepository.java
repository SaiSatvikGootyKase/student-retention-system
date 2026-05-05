package com.example.demo.repository;

import com.example.demo.model.Attendance;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends MongoRepository<Attendance, String> {
    List<Attendance> findByStudentId(String studentId);
    List<Attendance> findByFacultyIdAndCourse(String facultyId, String course);
    List<Attendance> findByStudentIdAndCourse(String studentId, String course);
    List<Attendance> findByFacultyIdAndCourseAndDate(String facultyId, String course, LocalDate date);
    Optional<Attendance> findByStudentIdAndCourseAndDate(String studentId, String course, LocalDate date);
}

package com.example.demo.service;

import com.example.demo.model.Exam;
import com.example.demo.repository.ExamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExamService {

    private final ExamRepository examRepository;

    public List<Exam> getByFaculty(String facultyId) {
        return examRepository.findByFacultyIdOrderByDateAsc(facultyId);
    }

    public List<Exam> getByCourse(String course) {
        return examRepository.findByCourse(course);
    }

    public Exam create(Exam exam) {
        return examRepository.save(exam);
    }

    public Exam update(String id, Exam updated) {
        updated.setId(id);
        return examRepository.save(updated);
    }

    public void delete(String id) {
        examRepository.deleteById(id);
    }
}

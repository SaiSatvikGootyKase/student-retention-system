package com.example.demo.controller;

import com.example.demo.model.Exam;
import com.example.demo.service.ExamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/exams")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ExamController {

    private final ExamService examService;

    @GetMapping
    public ResponseEntity<List<Exam>> get(@RequestParam(required = false) String facultyId,
                                           @RequestParam(required = false) String course) {
        if (facultyId != null) return ResponseEntity.ok(examService.getByFaculty(facultyId));
        if (course != null) return ResponseEntity.ok(examService.getByCourse(course));
        return ResponseEntity.ok(List.of());
    }

    @PostMapping
    public ResponseEntity<Exam> create(@RequestBody Exam exam) {
        return ResponseEntity.ok(examService.create(exam));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Exam> update(@PathVariable String id, @RequestBody Exam exam) {
        return ResponseEntity.ok(examService.update(id, exam));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        examService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

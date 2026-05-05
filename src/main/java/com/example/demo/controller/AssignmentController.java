package com.example.demo.controller;

import com.example.demo.dto.GradeRequest;
import com.example.demo.dto.SubmissionRequest;
import com.example.demo.model.Assignment;
import com.example.demo.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/assignments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AssignmentController {

    private final AssignmentService assignmentService;

    @GetMapping
    public ResponseEntity<List<Assignment>> getAll(@RequestParam(required = false) String facultyId,
                                                    @RequestParam(required = false) String studentId) {
        if (facultyId != null) return ResponseEntity.ok(assignmentService.getByFaculty(facultyId));
        if (studentId != null) return ResponseEntity.ok(assignmentService.getByStudent(studentId));
        return ResponseEntity.ok(assignmentService.getAllAssignments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Assignment> getById(@PathVariable String id) {
        return ResponseEntity.ok(assignmentService.getById(id));
    }

    @PostMapping
    public ResponseEntity<Assignment> create(@RequestBody Assignment assignment) {
        return ResponseEntity.ok(assignmentService.create(assignment));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Assignment> update(@PathVariable String id, @RequestBody Assignment assignment) {
        return ResponseEntity.ok(assignmentService.update(id, assignment));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        assignmentService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<Assignment> markComplete(@PathVariable String id) {
        return ResponseEntity.ok(assignmentService.markComplete(id));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<Assignment> submit(@PathVariable String id, @RequestBody SubmissionRequest req) {
        return ResponseEntity.ok(assignmentService.submit(id, req));
    }

    @PutMapping("/{id}/submissions/{studentId}/grade")
    public ResponseEntity<Assignment> grade(@PathVariable String id,
                                             @PathVariable String studentId,
                                             @RequestBody GradeRequest req) {
        return ResponseEntity.ok(assignmentService.gradeSubmission(id, studentId, req));
    }
}

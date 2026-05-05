package com.example.demo.controller;

import com.example.demo.model.Result;
import com.example.demo.service.ResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/results")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ResultController {

    private final ResultService resultService;

    @GetMapping
    public ResponseEntity<List<Result>> get(@RequestParam(required = false) String studentId,
                                             @RequestParam(required = false) String facultyId) {
        if (studentId != null) return ResponseEntity.ok(resultService.getByStudent(studentId));
        if (facultyId != null) return ResponseEntity.ok(resultService.getByFaculty(facultyId));
        return ResponseEntity.ok(List.of());
    }

    @PostMapping
    public ResponseEntity<Result> create(@RequestBody Result result) {
        return ResponseEntity.ok(resultService.create(result));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Result> update(@PathVariable String id, @RequestBody Result result) {
        return ResponseEntity.ok(resultService.update(id, result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        resultService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

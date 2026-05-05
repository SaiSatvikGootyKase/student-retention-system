package com.example.demo.controller;

import com.example.demo.model.TimetableEntry;
import com.example.demo.service.TimetableService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/timetable")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TimetableController {

    private final TimetableService timetableService;

    @GetMapping
    public ResponseEntity<List<TimetableEntry>> get(@RequestParam(required = false) String studentId,
                                                     @RequestParam(required = false) String facultyId) {
        if (studentId != null) return ResponseEntity.ok(timetableService.getByStudent(studentId));
        if (facultyId != null) return ResponseEntity.ok(timetableService.getByFaculty(facultyId));
        return ResponseEntity.ok(List.of());
    }

    @PostMapping
    public ResponseEntity<TimetableEntry> create(@RequestBody TimetableEntry entry) {
        return ResponseEntity.ok(timetableService.create(entry));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TimetableEntry> update(@PathVariable String id, @RequestBody TimetableEntry entry) {
        return ResponseEntity.ok(timetableService.update(id, entry));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        timetableService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

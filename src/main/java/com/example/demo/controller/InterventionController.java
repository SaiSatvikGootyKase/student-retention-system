package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "*")
public class InterventionController {

    @GetMapping("/alerts/active")
    public ResponseEntity<List<String>> getActiveAlerts() {
        // Stub: Fetch active unacknowledged high-risk alerts for the authenticated teacher.
        return ResponseEntity.ok(List.of("Alert: Student 123 attendance dropped Below 70%"));
    }

    @PostMapping("/interventions")
    public ResponseEntity<String> logIntervention() {
        // Stub: Create a new intervention log
        return ResponseEntity.ok("Intervention logged successfully");
    }

    @GetMapping("/students/{id}/interventions")
    public ResponseEntity<List<String>> getStudentInterventions(@PathVariable("id") String id) {
        // Stub: Retrieve intervention history for a student
        return ResponseEntity.ok(List.of("Meeting scheduled on 2026-03-20", "Added to tutoring list"));
    }
}

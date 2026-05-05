package com.example.demo.controller;

import com.example.demo.dto.StudentMlInsightsDto;
import com.example.demo.service.StudentMlInsightsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RecommendationController {

    private final StudentMlInsightsService studentMlInsightsService;

    /** Same payload as {@code GET /api/v1/students/{id}/ml-insights} (lecture RF + retention tier). */
    @GetMapping("/students/{id}/recommendations")
    public ResponseEntity<StudentMlInsightsDto> getStudentRecommendations(@PathVariable("id") String id) {
        return ResponseEntity.ok(studentMlInsightsService.getInsights(id));
    }

    @PostMapping("/recommendations/{recId}/interact")
    public ResponseEntity<String> logInteraction(@PathVariable("recId") String recId, @RequestParam String status) {
        // Stub: Log interaction (e.g., CLICKED, WATCHING, COMPLETED)
        return ResponseEntity.ok("Interaction logged: " + status + " for recommendation " + recId);
    }
}

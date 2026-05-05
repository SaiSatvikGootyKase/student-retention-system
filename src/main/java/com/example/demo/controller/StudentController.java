package com.example.demo.controller;

import com.example.demo.dto.AcademicHealthDto;
import com.example.demo.dto.StudentMlInsightsDto;
import com.example.demo.service.StudentMlInsightsService;
import com.example.demo.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import com.example.demo.dto.DropoutMlProfileUpdateDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/students")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StudentController {

    private final StudentService studentService;
    private final StudentMlInsightsService studentMlInsightsService;

    @GetMapping("/{id}/profile")
    public ResponseEntity<Map<String, Object>> getStudentProfile(@PathVariable("id") String id) {
        return ResponseEntity.ok(studentService.getStudentProfile(id));
    }

    @GetMapping("/{id}/academic-health")
    public ResponseEntity<AcademicHealthDto> getAcademicHealth(@PathVariable("id") String id) {
        return ResponseEntity.ok(studentService.getAcademicHealth(id));
    }

    /** Dropout / risk tier plus lecture recommendations from {@code course_recommendation}. */
    @GetMapping("/{id}/ml-insights")
    public ResponseEntity<StudentMlInsightsDto> getMlInsights(@PathVariable("id") String id) {
        return ResponseEntity.ok(studentMlInsightsService.getInsights(id));
    }

    /** Save required dropout-model fields (user id or student profile id). */
    @PatchMapping("/{id}/dropout-profile")
    public ResponseEntity<Map<String, Object>> updateDropoutProfile(
            @PathVariable("id") String id,
            @RequestBody DropoutMlProfileUpdateDto body
    ) {
        return ResponseEntity.ok(studentService.updateDropoutProfile(id, body));
    }
}

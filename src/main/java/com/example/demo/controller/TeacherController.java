package com.example.demo.controller;

import com.example.demo.dto.StudentRiskRowDto;
import com.example.demo.dto.TeacherDashboardSummaryDto;
import com.example.demo.model.Student;
import com.example.demo.model.enums.RiskTier;
import com.example.demo.repository.StudentRepository;
import com.example.demo.service.TeacherDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/teachers")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TeacherController {

    private final StudentRepository studentRepository;
    private final TeacherDashboardService teacherDashboardService;

    @GetMapping("/roster")
    public ResponseEntity<List<Student>> getRoster(
            @RequestParam(value = "riskFilter", required = false) String riskFilter,
            @RequestParam(value = "facultyUserId", required = false) String facultyUserId
    ) {
        if (riskFilter != null && !riskFilter.isBlank()) {
            try {
                RiskTier tier = RiskTier.valueOf(riskFilter.trim().toUpperCase());
                List<Student> byTier = studentRepository.findByCurrentRiskTier(tier);
                if (facultyUserId != null && !facultyUserId.isBlank()) {
                    String fid = facultyUserId.trim();
                    byTier = byTier.stream().filter(s -> fid.equals(s.getMentor())).collect(Collectors.toList());
                }
                return ResponseEntity.ok(byTier);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        }
        if (facultyUserId != null && !facultyUserId.isBlank()) {
            return ResponseEntity.ok(studentRepository.findByMentor(facultyUserId.trim()));
        }
        return ResponseEntity.ok(studentRepository.findAll());
    }

    /** KPIs + chart series for faculty home. Pass {@code facultyUserId} to scope to that mentor's section. */
    @GetMapping("/dashboard/summary")
    public ResponseEntity<TeacherDashboardSummaryDto> dashboardSummary(
            @RequestParam(value = "facultyUserId", required = false) String facultyUserId
    ) {
        return ResponseEntity.ok(teacherDashboardService.getSummary(facultyUserId));
    }

    /**
     * Students for "at risk" table: HIGH first, then MEDIUM, then LOW (stable secondary sort by name).
     * Includes ISO {@code lastUpdatedIso} for the Last updated column.
     */
    @GetMapping("/dashboard/students-risk")
    public ResponseEntity<List<StudentRiskRowDto>> studentsRiskSorted(
            @RequestParam(value = "facultyUserId", required = false) String facultyUserId
    ) {
        return ResponseEntity.ok(teacherDashboardService.getStudentsSortedByRiskHighFirst(facultyUserId));
    }
}

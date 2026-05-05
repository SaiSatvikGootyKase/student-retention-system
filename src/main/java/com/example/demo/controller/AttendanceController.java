package com.example.demo.controller;

import com.example.demo.dto.AttendanceRequest;
import com.example.demo.model.Attendance;
import com.example.demo.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/attendance")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AttendanceController {

    private final AttendanceService attendanceService;

    @GetMapping
    public ResponseEntity<List<Attendance>> get(@RequestParam(required = false) String studentId,
                                                 @RequestParam(required = false) String facultyId,
                                                 @RequestParam(required = false) String course,
                                                 @RequestParam(required = false) String date) {
        if (studentId != null) return ResponseEntity.ok(attendanceService.getByStudent(studentId));
        if (facultyId != null && course != null && date != null)
            return ResponseEntity.ok(attendanceService.getByFacultyAndCourseAndDate(facultyId, course, date));
        if (facultyId != null && course != null)
            return ResponseEntity.ok(attendanceService.getByFacultyAndCourse(facultyId, course));
        return ResponseEntity.ok(List.of());
    }

    @PostMapping("/{facultyId}/mark")
    public ResponseEntity<Attendance> mark(@PathVariable String facultyId,
                                            @RequestBody AttendanceRequest req) {
        return ResponseEntity.ok(attendanceService.markAttendance(facultyId, req));
    }

    @GetMapping("/summary/{studentId}")
    public ResponseEntity<Map<String, Long>> summary(@PathVariable String studentId) {
        return ResponseEntity.ok(attendanceService.getSummaryByStudent(studentId));
    }
}

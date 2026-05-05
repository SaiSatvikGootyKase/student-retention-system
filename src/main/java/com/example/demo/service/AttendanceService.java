package com.example.demo.service;

import com.example.demo.dto.AttendanceRequest;
import com.example.demo.model.Attendance;
import com.example.demo.repository.AttendanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final MentorAccessService mentorAccessService;

    public List<Attendance> getByStudent(String studentId) {
        return attendanceRepository.findByStudentId(studentId);
    }

    public List<Attendance> getByFacultyAndCourse(String facultyId, String course) {
        List<Attendance> rows = attendanceRepository.findByFacultyIdAndCourse(facultyId, course);
        return filterAttendanceForMentor(facultyId, rows);
    }

    public List<Attendance> getByFacultyAndCourseAndDate(String facultyId, String course, String date) {
        List<Attendance> rows = attendanceRepository.findByFacultyIdAndCourseAndDate(
                facultyId, course, LocalDate.parse(date));
        return filterAttendanceForMentor(facultyId, rows);
    }

    private List<Attendance> filterAttendanceForMentor(String facultyId, List<Attendance> rows) {
        Set<String> mentees = mentorAccessService.menteeProfileIdsForFaculty(facultyId);
        if (mentees.isEmpty()) {
            return rows;
        }
        return rows.stream()
                .filter(a -> mentees.contains(a.getStudentId()))
                .collect(Collectors.toList());
    }

    public Attendance markAttendance(String facultyId, AttendanceRequest req) {
        mentorAccessService.assertFacultyManagesStudent(facultyId, req.getStudentId());
        LocalDate date = LocalDate.parse(req.getDate());
        // Upsert: remove existing and re-save
        attendanceRepository.findByStudentIdAndCourseAndDate(req.getStudentId(), req.getCourse(), date)
                .ifPresent(existing -> attendanceRepository.deleteById(existing.getId()));

        Attendance attendance = new Attendance();
        attendance.setStudentId(req.getStudentId());
        attendance.setFacultyId(facultyId);
        attendance.setCourse(req.getCourse());
        attendance.setDate(date);
        attendance.setStatus(req.getStatus());
        return attendanceRepository.save(attendance);
    }

    public Map<String, Long> getSummaryByStudent(String studentId) {
        List<Attendance> records = attendanceRepository.findByStudentId(studentId);
        long present = records.stream().filter(a -> "PRESENT".equals(a.getStatus())).count();
        long absent = records.stream().filter(a -> "ABSENT".equals(a.getStatus())).count();
        long late = records.stream().filter(a -> "LATE".equals(a.getStatus())).count();
        return Map.of("present", present, "absent", absent, "late", late, "total", (long) records.size());
    }
}

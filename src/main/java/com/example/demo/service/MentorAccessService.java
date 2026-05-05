package com.example.demo.service;

import com.example.demo.model.Student;
import com.example.demo.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MentorAccessService {

    private final StudentRepository studentRepository;

    /**
     * When {@code student.mentor} is null/blank, any faculty may act (legacy profiles).
     * Otherwise only that faculty user id may manage the student.
     */
    public boolean facultyManagesStudent(String facultyUserId, String studentProfileId) {
        if (facultyUserId == null || studentProfileId == null) {
            return false;
        }
        return studentRepository.findById(studentProfileId)
                .map(s -> facultyManagesStudent(facultyUserId, s))
                .orElse(false);
    }

    public boolean facultyManagesStudent(String facultyUserId, Student student) {
        if (facultyUserId == null || student == null) {
            return false;
        }
        String m = student.getMentor();
        if (m == null || m.isBlank()) {
            return true;
        }
        return facultyUserId.equals(m);
    }

    public void assertFacultyManagesStudent(String facultyUserId, String studentProfileId) {
        if (!facultyManagesStudent(facultyUserId, studentProfileId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "This student is not assigned to you as a mentee."
            );
        }
    }

    public void assertFacultyManagesStudentUser(String facultyUserId, String studentUserId) {
        Student s = studentRepository.findByUserId(studentUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student profile not found"));
        assertFacultyManagesStudent(facultyUserId, s.getId());
    }

    /** Profile ids for students explicitly assigned to this faculty mentor. */
    public Set<String> menteeProfileIdsForFaculty(String facultyUserId) {
        if (facultyUserId == null || facultyUserId.isBlank()) {
            return Set.of();
        }
        return studentRepository.findByMentor(facultyUserId).stream()
                .map(Student::getId)
                .collect(Collectors.toSet());
    }

}

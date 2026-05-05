package com.example.demo.service;

import com.example.demo.model.Result;
import com.example.demo.repository.ResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResultService {

    private final ResultRepository resultRepository;
    private final MentorAccessService mentorAccessService;

    public List<Result> getByStudent(String studentId) {
        return resultRepository.findByStudentId(studentId);
    }

    public List<Result> getByFaculty(String facultyId) {
        List<Result> rows = resultRepository.findByFacultyId(facultyId);
        Set<String> mentees = mentorAccessService.menteeProfileIdsForFaculty(facultyId);
        if (mentees.isEmpty()) {
            return rows;
        }
        return rows.stream().filter(r -> mentees.contains(r.getStudentId())).collect(Collectors.toList());
    }

    public Result create(Result result) {
        if (result.getFacultyId() != null && result.getStudentId() != null) {
            mentorAccessService.assertFacultyManagesStudent(result.getFacultyId(), result.getStudentId());
        }
        result.setCreatedAt(LocalDateTime.now());
        return resultRepository.save(result);
    }

    public Result update(String id, Result updated) {
        updated.setId(id);
        if (updated.getFacultyId() != null && updated.getStudentId() != null) {
            mentorAccessService.assertFacultyManagesStudent(updated.getFacultyId(), updated.getStudentId());
        }
        return resultRepository.save(updated);
    }

    public void delete(String id) {
        resultRepository.deleteById(id);
    }
}

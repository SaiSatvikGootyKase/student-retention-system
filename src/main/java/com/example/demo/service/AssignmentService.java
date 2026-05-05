package com.example.demo.service;

import com.example.demo.dto.GradeRequest;
import com.example.demo.dto.SubmissionRequest;
import com.example.demo.model.Assignment;
import com.example.demo.repository.AssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;

    public List<Assignment> getAllAssignments() {
        return assignmentRepository.findAll();
    }

    /** Full assignment rows (all assignees) — faculty may assign across sections. */
    public List<Assignment> getByFaculty(String facultyId) {
        return assignmentRepository.findByFacultyId(facultyId);
    }

    public List<Assignment> getByStudent(String studentId) {
        return assignmentRepository.findByAssignedStudentIdsContaining(studentId);
    }

    public Assignment getById(String id) {
        return assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found: " + id));
    }

    public Assignment create(Assignment assignment) {
        assignment.setCreatedAt(LocalDateTime.now());
        if (assignment.getCompleted() == null) {
            assignment.setCompleted(Boolean.FALSE);
        }
        if (!Boolean.TRUE.equals(assignment.getCompleted())) {
            assignment.setCompletedAt(null);
        } else if (assignment.getCompletedAt() == null) {
            assignment.setCompletedAt(LocalDateTime.now());
        }
        return assignmentRepository.save(assignment);
    }

    public Assignment update(String id, Assignment updated) {
        Assignment existing = getById(id);
        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());
        existing.setCourse(updated.getCourse());
        existing.setDueDate(updated.getDueDate());
        if (updated.getFacultyId() != null) {
            existing.setFacultyId(updated.getFacultyId());
        }
        existing.setAssignedStudentIds(updated.getAssignedStudentIds());
        if (updated.getCompleted() != null) {
            existing.setCompleted(updated.getCompleted());
            existing.setCompletedAt(Boolean.TRUE.equals(updated.getCompleted()) ? LocalDateTime.now() : null);
        }
        return assignmentRepository.save(existing);
    }

    public Assignment markComplete(String id) {
        Assignment assignment = getById(id);
        assignment.setCompleted(Boolean.TRUE);
        assignment.setCompletedAt(LocalDateTime.now());
        return assignmentRepository.save(assignment);
    }

    public void delete(String id) {
        assignmentRepository.deleteById(id);
    }

    public Assignment submit(String assignmentId, SubmissionRequest req) {
        Assignment assignment = getById(assignmentId);
        List<String> roster = assignment.getAssignedStudentIds();
        if (roster != null && !roster.isEmpty() && !roster.contains(req.getStudentId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "You are not assigned to this coursework."
            );
        }
        assignment.getSubmissions().removeIf(s -> s.getStudentId().equals(req.getStudentId()));
        String rawContent = req.getContent() != null ? req.getContent() : "";
        String b64 = req.getAttachmentBase64();
        if (rawContent.trim().isEmpty() && (b64 == null || b64.isBlank())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Add a written response or attach a document before submitting."
            );
        }
        if (b64 != null && b64.length() > 14_000_000) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Attached file is too large. Please use a file under about 8 MB."
            );
        }
        Assignment.Submission submission = new Assignment.Submission();
        submission.setStudentId(req.getStudentId());
        submission.setContent(rawContent.trim().isEmpty() ? "(document only)" : rawContent.trim());
        submission.setSubmittedAt(LocalDateTime.now());
        submission.setStatus("SUBMITTED");
        if (b64 != null && !b64.isBlank()
                && req.getAttachmentFileName() != null && !req.getAttachmentFileName().isBlank()) {
            submission.setAttachmentFileName(req.getAttachmentFileName().trim());
            submission.setAttachmentMimeType(
                    req.getAttachmentMimeType() != null ? req.getAttachmentMimeType().trim() : "application/octet-stream"
            );
            submission.setAttachmentBase64(b64.trim());
        }
        assignment.getSubmissions().add(submission);
        return assignmentRepository.save(assignment);
    }

    public Assignment gradeSubmission(String assignmentId, String studentId, GradeRequest req) {
        Assignment assignment = getById(assignmentId);
        List<String> ids = assignment.getAssignedStudentIds();
        if (ids != null && !ids.isEmpty() && !ids.contains(studentId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Student is not on the assignment roster."
            );
        }
        assignment.getSubmissions().stream()
                .filter(s -> s.getStudentId().equals(studentId))
                .findFirst()
                .ifPresent(s -> {
                    s.setGrade(req.getGrade());
                    s.setFeedback(req.getFeedback());
                    s.setStatus("GRADED");
                });
        return assignmentRepository.save(assignment);
    }
}

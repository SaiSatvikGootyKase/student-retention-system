package com.example.demo.service;

import com.example.demo.model.TimetableEntry;
import com.example.demo.repository.TimetableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TimetableService {

    private final TimetableRepository timetableRepository;
    private final MentorAccessService mentorAccessService;

    public List<TimetableEntry> getByStudent(String studentId) {
        return timetableRepository.findByStudentIdsContaining(studentId);
    }

    public List<TimetableEntry> getByFaculty(String facultyId) {
        List<TimetableEntry> rows = timetableRepository.findByFacultyId(facultyId);
        Set<String> mentees = mentorAccessService.menteeProfileIdsForFaculty(facultyId);
        if (mentees.isEmpty()) {
            return rows;
        }
        List<TimetableEntry> out = new ArrayList<>();
        for (TimetableEntry e : rows) {
            TimetableEntry copy = copyEntryWithFilteredStudents(e, mentees);
            out.add(copy);
        }
        return out;
    }

    private static TimetableEntry copyEntryWithFilteredStudents(TimetableEntry e, Set<String> menteeProfileIds) {
        TimetableEntry o = new TimetableEntry();
        o.setId(e.getId());
        o.setCourse(e.getCourse());
        o.setSubject(e.getSubject());
        o.setFacultyId(e.getFacultyId());
        o.setDayOfWeek(e.getDayOfWeek());
        o.setStartTime(e.getStartTime());
        o.setEndTime(e.getEndTime());
        o.setRoom(e.getRoom());
        List<String> ids = e.getStudentIds() == null ? List.of() : e.getStudentIds().stream()
                .filter(menteeProfileIds::contains)
                .toList();
        o.setStudentIds(new ArrayList<>(ids));
        return o;
    }

    public TimetableEntry create(TimetableEntry entry) {
        assertTimetableStudentsForFaculty(entry);
        return timetableRepository.save(entry);
    }

    public TimetableEntry update(String id, TimetableEntry updated) {
        updated.setId(id);
        assertTimetableStudentsForFaculty(updated);
        return timetableRepository.save(updated);
    }

    private void assertTimetableStudentsForFaculty(TimetableEntry entry) {
        if (entry.getFacultyId() == null || entry.getStudentIds() == null || entry.getStudentIds().isEmpty()) {
            return;
        }
        for (String sid : entry.getStudentIds()) {
            mentorAccessService.assertFacultyManagesStudent(entry.getFacultyId(), sid);
        }
    }

    public void delete(String id) {
        timetableRepository.deleteById(id);
    }
}

package com.example.demo.service;

import com.example.demo.model.Announcement;
import com.example.demo.repository.AnnouncementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;

    public List<Announcement> getAll() {
        return announcementRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Announcement> getByFaculty(String facultyId) {
        return announcementRepository.findByFacultyId(facultyId);
    }

    public List<Announcement> getByCourse(String course) {
        return announcementRepository.findByCourse(course);
    }

    public Announcement create(Announcement announcement) {
        announcement.setCreatedAt(LocalDateTime.now());
        return announcementRepository.save(announcement);
    }

    public void delete(String id) {
        announcementRepository.deleteById(id);
    }
}

package com.example.demo.repository;

import com.example.demo.model.Announcement;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementRepository extends MongoRepository<Announcement, String> {
    List<Announcement> findByFacultyId(String facultyId);
    List<Announcement> findByCourse(String course);
    List<Announcement> findAllByOrderByCreatedAtDesc();
}

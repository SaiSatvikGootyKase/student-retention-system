package com.example.demo.controller;

import com.example.demo.model.Announcement;
import com.example.demo.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/announcements")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @GetMapping
    public ResponseEntity<List<Announcement>> getAll(@RequestParam(required = false) String facultyId,
                                                      @RequestParam(required = false) String course) {
        if (facultyId != null) return ResponseEntity.ok(announcementService.getByFaculty(facultyId));
        if (course != null) return ResponseEntity.ok(announcementService.getByCourse(course));
        return ResponseEntity.ok(announcementService.getAll());
    }

    @PostMapping
    public ResponseEntity<Announcement> create(@RequestBody Announcement announcement) {
        return ResponseEntity.ok(announcementService.create(announcement));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        announcementService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

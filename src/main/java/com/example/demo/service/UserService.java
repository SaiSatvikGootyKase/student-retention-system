package com.example.demo.service;

import com.example.demo.model.Student;
import com.example.demo.model.User;
import com.example.demo.model.enums.Role;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;

    public User getById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
    }

    public List<User> getAll() {
        return userRepository.findAll();
    }

    /**
     * Chat / faculty pickers: students see assigned mentor only; faculty sees their mentees only.
     * If a student has no {@link Student#getMentor()}, all faculty are listed (legacy).
     */
    public List<User> getContactsForUser(String forUserId) {
        User u = getById(forUserId);
        if (u.getRole() == Role.STUDENT) {
            return studentRepository.findByUserId(forUserId)
                    .map(s -> {
                        String mid = s.getMentor();
                        if (mid == null || mid.isBlank()) {
                            return userRepository.findAll().stream()
                                    .filter(x -> x.getRole() == Role.FACULTY)
                                    .toList();
                        }
                        return userRepository.findById(mid)
                                .filter(f -> f.getRole() == Role.FACULTY)
                                .map(List::of)
                                .orElseGet(List::of);
                    })
                    .orElseGet(List::of);
        }
        if (u.getRole() == Role.FACULTY) {
            List<User> out = new ArrayList<>();
            for (Student st : studentRepository.findByMentor(forUserId)) {
                userRepository.findById(st.getUserId()).ifPresent(out::add);
            }
            return out;
        }
        return List.of();
    }

    public User update(String id, User updated) {
        User existing = getById(id);
        existing.setName(updated.getName());
        existing.setPhone(updated.getPhone());
        existing.setDepartment(updated.getDepartment());
        existing.setAvatarUrl(updated.getAvatarUrl());
        return userRepository.save(existing);
    }
}

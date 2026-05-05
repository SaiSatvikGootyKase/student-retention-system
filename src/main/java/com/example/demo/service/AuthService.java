package com.example.demo.service;

import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.LoginResponse;
import com.example.demo.model.Student;
import com.example.demo.model.User;
import com.example.demo.model.enums.Role;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final StudentOnboardingService studentOnboardingService;
    private final BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder(12);

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found with email: " + request.getEmail()));

        validateLoginPortal(user, request.getExpectedRole());

        if (!passwordMatches(request.getPassword(), user)) {
            throw new RuntimeException("Invalid credentials");
        }

        studentOnboardingService.ensureStudentLinked(user);
        User fresh = userRepository.findById(user.getId()).orElseThrow();

        return toLoginResponse(fresh);
    }

    private static void validateLoginPortal(User user, String expectedRole) {
        if (expectedRole == null || expectedRole.isBlank()) {
            throw new RuntimeException(
                    "expectedRole is required: send STUDENT or FACULTY from the login tab (client must be up to date)."
            );
        }
        String want = expectedRole.trim().toUpperCase(Locale.ROOT);
        if (!"STUDENT".equals(want) && !"FACULTY".equals(want)) {
            throw new RuntimeException("expectedRole must be STUDENT or FACULTY");
        }
        if (user.getRole() == null) {
            throw new RuntimeException("Wrong login tab: this account has no role assigned.");
        }
        if (!user.getRole().name().equals(want)) {
            String label = switch (user.getRole()) {
                case STUDENT -> "Student";
                case FACULTY -> "Faculty";
                case ADMIN -> "Admin";
            };
            throw new RuntimeException(
                    "Wrong login tab: this account is a " + label + " account. Use the " + label + " tab to sign in."
            );
        }
    }

    private LoginResponse toLoginResponse(User user) {
        String linkedProfileId = user.getLinkedProfileId();
        if (user.getRole() == Role.STUDENT && (linkedProfileId == null || linkedProfileId.isBlank())) {
            linkedProfileId = studentRepository.findByUserId(user.getId())
                    .map(Student::getId)
                    .orElse(null);
        }

        Boolean dropoutProfileComplete = null;
        if (user.getRole() == Role.STUDENT) {
            Boolean raw = studentRepository.findByUserId(user.getId())
                    .map(Student::getDropoutProfileComplete)
                    .orElse(null);
            dropoutProfileComplete = Boolean.FALSE.equals(raw) ? Boolean.FALSE : Boolean.TRUE;
        }

        return LoginResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .linkedProfileId(linkedProfileId)
                .phone(user.getPhone())
                .department(user.getDepartment())
                .avatarUrl(user.getAvatarUrl())
                .dropoutProfileComplete(dropoutProfileComplete)
                .build();
    }

    private boolean passwordMatches(String rawPassword, User user) {
        if (rawPassword == null) {
            return false;
        }
        String a = user.getPasswordHash();
        String b = user.getLegacyPassword();
        if (matchesOne(rawPassword, a)) {
            return true;
        }
        return matchesOne(rawPassword, b);
    }

    private boolean matchesOne(String rawPassword, String stored) {
        if (stored == null || stored.isBlank()) {
            return false;
        }
        String s = stored.trim();
        if (s.startsWith("$2a$") || s.startsWith("$2b$") || s.startsWith("$2y$")) {
            return bcrypt.matches(rawPassword, s);
        }
        return rawPassword.equals(s);
    }

    public User register(User user) {
        if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
            throw new RuntimeException("passwordHash is required");
        }
        if (user.getRole() == null || (user.getRole() != Role.STUDENT && user.getRole() != Role.FACULTY)) {
            throw new RuntimeException("Registration is only allowed for STUDENT or FACULTY roles.");
        }
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("User already exists with email: " + user.getEmail());
        }
        if (user.getRole() == Role.STUDENT) {
            String school = user.getDepartment() == null ? "" : user.getDepartment().trim();
            if (school.isEmpty()) {
                throw new RuntimeException("School is required for student registration (use the School field).");
            }
            user.setDepartment(school);
        }
        User saved = userRepository.save(user);
        if (saved.getRole() == Role.STUDENT) {
            studentOnboardingService.ensureStudentLinked(saved);
            return userRepository.findById(saved.getId()).orElse(saved);
        }
        return saved;
    }
}

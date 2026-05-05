package com.example.demo.controller;

import com.example.demo.service.TestToStudentMigrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Manual migration trigger (no Node.js). Set {@code app.migration.http-token} to a secret value;
 * send it in header {@code X-Migration-Token}. If token is blank, endpoint is disabled.
 */
@RestController
@RequestMapping("/api/v1/admin/migrations")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class MigrationController {

    private final TestToStudentMigrationService testToStudentMigrationService;

    @Value("${app.migration.http-token:}")
    private String httpToken;

    @PostMapping("/test-to-student")
    public ResponseEntity<String> migrateTestToStudent(
            @RequestHeader(value = "X-Migration-Token", required = false) String token
    ) {
        if (httpToken == null || httpToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Migration HTTP trigger is disabled");
        }
        if (token == null || !httpToken.equals(token)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid migration token");
        }
        testToStudentMigrationService.migrate();
        return ResponseEntity.ok("Migration completed: test → student");
    }
}

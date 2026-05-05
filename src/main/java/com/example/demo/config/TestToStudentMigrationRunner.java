package com.example.demo.config;

import com.example.demo.service.TestToStudentMigrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Runs {@link TestToStudentMigrationService#migrate()} at startup when {@code app.migration.copy-test-to-student=true}.
 * The service skips work after the first successful run unless {@code app.migration.force-rerun=true}.
 */
@Component
@Order(Integer.MAX_VALUE - 100)
@ConditionalOnProperty(prefix = "app.migration", name = "copy-test-to-student", havingValue = "true")
@RequiredArgsConstructor
public class TestToStudentMigrationRunner implements ApplicationRunner {

    private final TestToStudentMigrationService testToStudentMigrationService;

    @Override
    public void run(ApplicationArguments args) {
        testToStudentMigrationService.migrate();
    }
}

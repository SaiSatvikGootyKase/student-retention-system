package com.example.demo.config;

import com.example.demo.service.FacultyAdminPortalBootstrapService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Creates {@code faculty} and {@code admin_portal} databases with portal collections when enabled.
 */
@Component
@Order(Integer.MAX_VALUE - 50)
@ConditionalOnProperty(prefix = "app.portal", name = "bootstrap-databases", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class FacultyAdminPortalBootstrapRunner implements ApplicationRunner {

    private final FacultyAdminPortalBootstrapService facultyAdminPortalBootstrapService;

    @Override
    public void run(ApplicationArguments args) {
        facultyAdminPortalBootstrapService.bootstrap();
    }
}

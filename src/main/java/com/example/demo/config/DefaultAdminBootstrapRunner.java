package com.example.demo.config;

import com.example.demo.model.User;
import com.example.demo.model.enums.Role;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Ensures at least one {@link Role#ADMIN} exists in {@code users} so the admin portal can sign in.
 * Default credentials (change after first login): admin@retentio.edu / admin123
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(
		prefix = "app.admin", name = "bootstrap-default", havingValue = "true", matchIfMissing = true)
public class DefaultAdminBootstrapRunner {

    private final UserRepository userRepository;

    @Bean
    ApplicationRunner ensureDefaultAdminUser() {
        return args -> {
            if (userRepository.existsByRole(Role.ADMIN)) {
                return;
            }
            BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder(12);
            User admin = new User();
            admin.setName("System Admin");
            admin.setEmail("admin@retentio.edu");
            admin.setPasswordHash(bcrypt.encode("admin123"));
            admin.setRole(Role.ADMIN);
            admin.setDepartment("IT");
            userRepository.save(admin);
            log.warn(
                    "Created default ADMIN user {} (password: admin123). Change this password in production.",
                    admin.getEmail()
            );
        };
    }
}

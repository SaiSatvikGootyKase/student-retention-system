package com.example.demo.dto;

import com.example.demo.model.enums.Role;
import lombok.Data;

@Data
public class AdminCreateUserRequest {
    /** ID of the signed-in admin (must have role ADMIN). */
    private String adminUserId;
    private String name;
    private String email;
    /** Plaintext password; stored as bcrypt hash. */
    private String password;
    private Role role;
    /** Required for students (school / major seed); optional for faculty. */
    private String department;
}

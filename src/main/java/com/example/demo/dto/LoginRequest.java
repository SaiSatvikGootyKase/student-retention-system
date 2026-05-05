package com.example.demo.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String email;
    private String password;
    /**
     * Optional: {@code STUDENT} or {@code FACULTY}. When sent, login fails if the account role does not match
     * (prevents signing in on the wrong portal tab).
     */
    private String expectedRole;
}

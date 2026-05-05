package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponse {
    private String userId;
    private String name;
    private String email;
    private String role;
    private String linkedProfileId;
    private String phone;
    private String department;
    private String avatarUrl;
    /** For students: {@code false} until required dropout-profile fields are saved; {@code null} omits gate (legacy). */
    private Boolean dropoutProfileComplete;
}

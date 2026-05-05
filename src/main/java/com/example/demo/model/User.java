package com.example.demo.model;

import com.example.demo.model.enums.Role;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

@Data
@Document(collection = "users")
public class User {
    @Id
    private String id;
    private String name;
    private String email;
    /** Not exposed on GET /users; still accepted on register/update body when sent as passwordHash. */
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String passwordHash;

    /** Older / migrated BSON field name (plain or bcrypt). Prefer {@link #passwordHash}. */
    @Field("password")
    private String legacyPassword;

    private Role role;
    private String phone;
    private String department;
    private String avatarUrl;
    private String linkedProfileId; // links to student or faculty profile doc
    private LocalDateTime lastLogin;
}


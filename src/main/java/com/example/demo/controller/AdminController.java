package com.example.demo.controller;

import com.example.demo.dto.AdminCreateUserRequest;
import com.example.demo.model.User;
import com.example.demo.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final AuthService authService;

    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody AdminCreateUserRequest body) {
        return ResponseEntity.ok(authService.createUserByAdmin(body));
    }
}

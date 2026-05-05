package com.example.demo.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        String message = ex.getMessage();
        HttpStatus status;

        if (message != null && message.startsWith("User not found")) {
            status = HttpStatus.NOT_FOUND; // 404
        } else if (message != null && message.contains("Invalid credentials")) {
            status = HttpStatus.UNAUTHORIZED; // 401
        } else if (message != null && message.contains("already exists")) {
            status = HttpStatus.CONFLICT; // 409
        } else if (message != null && message.startsWith("Wrong login tab:")) {
            status = HttpStatus.FORBIDDEN; // 403
        } else if (message != null && message.startsWith("expectedRole is required")) {
            status = HttpStatus.BAD_REQUEST; // 400
        } else {
            status = HttpStatus.BAD_REQUEST; // 400
        }

        return ResponseEntity.status(status).body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "message", message != null ? message : "An unexpected error occurred"
        ));
    }
}

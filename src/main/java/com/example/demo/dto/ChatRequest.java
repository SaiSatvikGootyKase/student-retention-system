package com.example.demo.dto;

import lombok.Data;

@Data
public class ChatRequest {
    private String senderId;
    private String receiverId;
    private String message;
}

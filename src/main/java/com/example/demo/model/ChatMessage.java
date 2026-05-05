package com.example.demo.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "chat_messages")
public class ChatMessage {
    @Id
    private String id;
    private String senderId;
    private String receiverId;
    private String message;
    private LocalDateTime timestamp;
    private boolean read;
}

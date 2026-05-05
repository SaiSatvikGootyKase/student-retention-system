package com.example.demo.controller;

import com.example.demo.dto.ChatRequest;
import com.example.demo.model.ChatMessage;
import com.example.demo.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/conversation")
    public ResponseEntity<List<ChatMessage>> getConversation(@RequestParam String userId1,
                                                               @RequestParam String userId2) {
        return ResponseEntity.ok(chatService.getConversation(userId1, userId2));
    }

    @PostMapping
    public ResponseEntity<ChatMessage> send(@RequestBody ChatRequest req) {
        return ResponseEntity.ok(chatService.sendMessage(req));
    }

    @PutMapping("/read/{receiverId}")
    public ResponseEntity<Void> markRead(@PathVariable String receiverId) {
        chatService.markRead(receiverId);
        return ResponseEntity.noContent().build();
    }
}

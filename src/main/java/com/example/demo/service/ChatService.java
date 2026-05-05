package com.example.demo.service;

import com.example.demo.dto.ChatRequest;
import com.example.demo.model.ChatMessage;
import com.example.demo.model.User;
import com.example.demo.model.enums.Role;
import com.example.demo.repository.ChatMessageRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final MentorAccessService mentorAccessService;

    public List<ChatMessage> getConversation(String userId1, String userId2) {
        assertAllowedChat(userId1, userId2);
        return chatMessageRepository.findConversation(userId1, userId2);
    }

    public ChatMessage sendMessage(ChatRequest req) {
        assertAllowedChat(req.getSenderId(), req.getReceiverId());
        ChatMessage msg = new ChatMessage();
        msg.setSenderId(req.getSenderId());
        msg.setReceiverId(req.getReceiverId());
        msg.setMessage(req.getMessage());
        msg.setTimestamp(LocalDateTime.now());
        msg.setRead(false);
        return chatMessageRepository.save(msg);
    }

    public void markRead(String receiverId) {
        List<ChatMessage> unread = chatMessageRepository.findByReceiverIdAndReadFalse(receiverId);
        unread.forEach(m -> m.setRead(true));
        chatMessageRepository.saveAll(unread);
    }

    private void assertAllowedChat(String userId1, String userId2) {
        User u1 = userRepository.findById(userId1)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userId1));
        User u2 = userRepository.findById(userId2)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userId2));
        if (u1.getRole() == Role.STUDENT && u2.getRole() == Role.STUDENT) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Student-to-student chat is not enabled.");
        }
        if (u1.getRole() == Role.FACULTY && u2.getRole() == Role.FACULTY) {
            return;
        }
        if (u1.getRole() == Role.STUDENT && u2.getRole() == Role.FACULTY) {
            mentorAccessService.assertFacultyManagesStudentUser(u2.getId(), u1.getId());
            return;
        }
        if (u1.getRole() == Role.FACULTY && u2.getRole() == Role.STUDENT) {
            mentorAccessService.assertFacultyManagesStudentUser(u1.getId(), u2.getId());
            return;
        }
    }
}

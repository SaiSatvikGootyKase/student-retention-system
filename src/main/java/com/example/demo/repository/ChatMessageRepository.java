package com.example.demo.repository;

import com.example.demo.model.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {

    @Query("{ $or: [ { 'senderId': ?0, 'receiverId': ?1 }, { 'senderId': ?1, 'receiverId': ?0 } ] }")
    List<ChatMessage> findConversation(String userId1, String userId2);

    List<ChatMessage> findByReceiverIdAndReadFalse(String receiverId);
}

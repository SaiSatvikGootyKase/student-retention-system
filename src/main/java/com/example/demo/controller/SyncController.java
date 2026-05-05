package com.example.demo.controller;

import com.example.demo.service.SyncService;
import com.mongodb.client.MongoClient;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/sync")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SyncController {

    private final SyncService syncService;
    private final MongoTemplate mongoTemplate;
    private final MongoClient mongoClient;

    /** Import students from the {@code student_dropouts} Mongo collection into {@code users} + {@code profiles}. */
    @PostMapping("/dropouts")
    public ResponseEntity<Map<String, Object>> syncDropouts() {
        return ResponseEntity.ok(syncService.syncDropoutStudents());
    }

    /**
     * Runs dropout import. Faculty and students are otherwise created via {@code POST /api/v1/auth/register}.
     */
    @PostMapping("/all")
    public ResponseEntity<Map<String, Object>> syncAll() {
        Map<String, Object> dropouts = syncService.syncDropoutStudents();
        return ResponseEntity.ok(Map.of(
                "dropouts", dropouts,
                "note", "Use POST /api/v1/auth/register for faculty and student accounts."
        ));
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        return ResponseEntity.ok(syncService.getStatus());
    }

    @GetMapping("/collections")
    public ResponseEntity<Set<String>> listCollections() {
        return ResponseEntity.ok(mongoTemplate.getCollectionNames());
    }

    @GetMapping("/databases")
    public ResponseEntity<Map<String, List<String>>> listDatabases() {
        Map<String, List<String>> result = new LinkedHashMap<>();
        for (String dbName : mongoClient.listDatabaseNames()) {
            List<String> cols = new ArrayList<>();
            for (String col : mongoClient.getDatabase(dbName).listCollectionNames()) {
                cols.add(col);
            }
            result.put(dbName, cols);
        }
        return ResponseEntity.ok(result);
    }
}

package com.example.demo.service;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.IndexOptions;
import com.mongodb.client.model.Indexes;
import com.mongodb.client.model.UpdateOptions;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * Copies collections from {@code test} → {@code student}, ensures {@code faculty} / {@code admins},
 * indexes, and optional bcrypt demo rows. Enable via {@code app.migration.copy-test-to-student=true}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TestToStudentMigrationService {

    private static final String SOURCE_DB = "test";
    private static final String TARGET_DB = "student";
    /** Marker doc so migration does not wipe {@code student} on every startup. */
    private static final String META_COLLECTION = "_app_migrations";
    private static final String META_ID = "test_to_student_v1";

    private static final List<String> COLLECTIONS_TO_COPY = List.of(
            "announcements",
            "assignments",
            "attendance",
            "chat_messages",
            "exams",
            "fees",
            "course_recommendation",
            "results",
            "timetable",
            "users"
    );

    private static final String STUDENT_JSON_SCHEMA = """
            {
              "bsonType": "object",
              "additionalProperties": true,
              "properties": {
                "_id": { "bsonType": "objectId" },
                "firstName": { "bsonType": "string" },
                "lastName": { "bsonType": "string" },
                "email": { "bsonType": "string" },
                "password": { "bsonType": "string" },
                "phone": { "bsonType": "string" },
                "dateOfBirth": { "bsonType": ["date", "null"] },
                "gender": { "bsonType": "string" },
                "address": { "bsonType": "string" },
                "studentId": { "bsonType": "string" },
                "course": { "bsonType": "string" },
                "department": { "bsonType": "string" },
                "year": { "bsonType": ["int", "long", "double", "null"] },
                "createdAt": { "bsonType": "date" },
                "updatedAt": { "bsonType": "date" }
              }
            }
            """;

    private static final String FACULTY_JSON_SCHEMA = """
            {
              "bsonType": "object",
              "additionalProperties": true,
              "required": ["firstName", "lastName", "email", "password", "department", "designation", "employeeId", "createdAt", "updatedAt"],
              "properties": {
                "_id": { "bsonType": "objectId" },
                "firstName": { "bsonType": "string" },
                "lastName": { "bsonType": "string" },
                "email": { "bsonType": "string" },
                "password": { "bsonType": "string" },
                "phone": { "bsonType": "string" },
                "department": { "bsonType": "string" },
                "designation": { "bsonType": "string" },
                "employeeId": { "bsonType": "string" },
                "coursesHandled": { "bsonType": "array", "items": { "bsonType": "string" } },
                "createdAt": { "bsonType": "date" },
                "updatedAt": { "bsonType": "date" }
              }
            }
            """;

    private static final String ADMIN_JSON_SCHEMA = """
            {
              "bsonType": "object",
              "additionalProperties": true,
              "required": ["firstName", "lastName", "email", "password", "role", "createdAt", "updatedAt"],
              "properties": {
                "_id": { "bsonType": "objectId" },
                "firstName": { "bsonType": "string" },
                "lastName": { "bsonType": "string" },
                "email": { "bsonType": "string" },
                "password": { "bsonType": "string" },
                "phone": { "bsonType": "string" },
                "role": { "bsonType": "string" },
                "permissions": { "bsonType": "array", "items": { "bsonType": "string" } },
                "createdAt": { "bsonType": "date" },
                "updatedAt": { "bsonType": "date" }
              }
            }
            """;

    private final MongoClient mongoClient;

    @Value("${app.migration.drop-source-test:false}")
    private boolean dropSourceTest;

    @Value("${app.migration.seed-demo-identities:false}")
    private boolean seedDemoIdentities;

    @Value("${app.migration.force-rerun:false}")
    private boolean forceRerun;

    public void migrate() {
        MongoDatabase source = mongoClient.getDatabase(SOURCE_DB);
        MongoDatabase student = mongoClient.getDatabase(TARGET_DB);

        if (!forceRerun) {
            MongoCollection<Document> meta = student.getCollection(META_COLLECTION);
            if (meta.find(new Document("_id", META_ID)).first() != null) {
                log.info(
                        "Skipping test→student migration (marker {}.{}) — set app.migration.force-rerun=true to copy again",
                        TARGET_DB,
                        META_COLLECTION
                );
                return;
            }
        }

        log.warn("Running test→student migration (source DB: {})", SOURCE_DB);

        for (String name : COLLECTIONS_TO_COPY) {
            copyCollection(source, student, name);
        }

        copyProfilesCollection(source, student);

        ensureCollectionWithValidator(student, "profiles", Document.parse(STUDENT_JSON_SCHEMA.trim()),
                "moderate", "warn");
        ensureCollectionWithValidator(student, "faculty", Document.parse(FACULTY_JSON_SCHEMA.trim()),
                "strict", "error");
        ensureCollectionWithValidator(student, "admins", Document.parse(ADMIN_JSON_SCHEMA.trim()),
                "strict", "error");

        MongoCollection<Document> st = student.getCollection("profiles");
        st.createIndex(Indexes.ascending("email"), new IndexOptions().unique(true).sparse(true));
        st.createIndex(Indexes.ascending("studentId"), new IndexOptions().unique(true).sparse(true));

        MongoCollection<Document> fc = student.getCollection("faculty");
        fc.createIndex(Indexes.ascending("email"), new IndexOptions().unique(true));
        fc.createIndex(Indexes.ascending("employeeId"), new IndexOptions().unique(true));

        MongoCollection<Document> ad = student.getCollection("admins");
        ad.createIndex(Indexes.ascending("email"), new IndexOptions().unique(true));

        if (seedDemoIdentities) {
            seedFacultyAndAdmins(student);
        }

        if (dropSourceTest) {
            log.warn("Dropping database {}", SOURCE_DB);
            source.drop();
        }

        student.getCollection(META_COLLECTION).updateOne(
                new Document("_id", META_ID),
                new Document("$set", new Document("completedAt", Date.from(Instant.now()))
                        .append("sourceDb", SOURCE_DB)
                        .append("targetDb", TARGET_DB)),
                new UpdateOptions().upsert(true)
        );

        log.info("Migration finished: {} -> {} (indexes + validators applied; marker written)", SOURCE_DB, TARGET_DB);
    }

    private static boolean collectionExists(MongoDatabase db, String name) {
        for (String n : db.listCollectionNames()) {
            if (n.equals(name)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Copies legacy {@code test.students} or {@code test.profiles} into {@code student.profiles}.
     */
    private void copyProfilesCollection(MongoDatabase source, MongoDatabase target) {
        String srcName = null;
        if (collectionExists(source, "profiles")) {
            srcName = "profiles";
        } else if (collectionExists(source, "students")) {
            srcName = "students";
        }
        if (srcName == null) {
            if (!collectionExists(target, "profiles")) {
                target.createCollection("profiles");
            }
            log.info("Created empty {}.profiles (no source students/profiles in {})", TARGET_DB, SOURCE_DB);
            return;
        }
        MongoCollection<Document> src = source.getCollection(srcName);
        long n = src.estimatedDocumentCount();
        if (n == 0) {
            if (!collectionExists(target, "profiles")) {
                target.createCollection("profiles");
            }
            log.info("Created empty {}.profiles", TARGET_DB);
            return;
        }
        MongoCollection<Document> dst = target.getCollection("profiles");
        dst.deleteMany(new Document());
        final int batchSize = 500;
        List<Document> batch = new ArrayList<>(batchSize);
        try (MongoCursor<Document> cur = src.find().batchSize(batchSize).iterator()) {
            while (cur.hasNext()) {
                batch.add(cur.next());
                if (batch.size() >= batchSize) {
                    dst.insertMany(batch);
                    batch.clear();
                }
            }
        }
        if (!batch.isEmpty()) {
            dst.insertMany(batch);
        }
        log.info("Copied {} documents: {}.{} -> {}.profiles", n, SOURCE_DB, srcName, TARGET_DB);
    }

    private void copyCollection(MongoDatabase source, MongoDatabase target, String name) {
        if (!collectionExists(source, name)) {
            target.createCollection(name);
            log.info("Created empty {}.{}", TARGET_DB, name);
            return;
        }
        MongoCollection<Document> src = source.getCollection(name);
        long n = src.estimatedDocumentCount();
        if (n == 0) {
            if (!collectionExists(target, name)) {
                target.createCollection(name);
            }
            log.info("Created empty {}.{}", TARGET_DB, name);
            return;
        }
        MongoCollection<Document> dst = target.getCollection(name);
        dst.deleteMany(new Document());
        final int batchSize = 500;
        List<Document> batch = new ArrayList<>(batchSize);
        try (MongoCursor<Document> cur = src.find().batchSize(batchSize).iterator()) {
            while (cur.hasNext()) {
                batch.add(cur.next());
                if (batch.size() >= batchSize) {
                    dst.insertMany(batch);
                    batch.clear();
                }
            }
        }
        if (!batch.isEmpty()) {
            dst.insertMany(batch);
        }
        log.info("Copied {} documents: {}.{} -> {}.{}", n, SOURCE_DB, name, TARGET_DB, name);
    }

    private void ensureCollectionWithValidator(
            MongoDatabase student,
            String collName,
            Document jsonSchema,
            String validationLevel,
            String validationAction
    ) {
        Document validator = new Document("$jsonSchema", jsonSchema);
        if (!collectionExists(student, collName)) {
            Document create = new Document("create", collName)
                    .append("validator", validator)
                    .append("validationLevel", validationLevel)
                    .append("validationAction", validationAction);
            Document res = student.runCommand(create);
            log.info("create {}.{} ok={}", TARGET_DB, collName, res.get("ok", 0));
            return;
        }
        Document res = student.runCommand(new Document("collMod", collName)
                .append("validator", validator)
                .append("validationLevel", "moderate")
                .append("validationAction", "warn"));
        log.info("collMod {}: {}", collName, res.get("ok", 0));
    }

    private void seedFacultyAndAdmins(MongoDatabase student) {
        BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder(12);
        Date now = Date.from(Instant.now());

        Document faculty = new Document()
                .append("firstName", "Jane")
                .append("lastName", "Faculty")
                .append("email", "faculty@example.edu")
                .append("password", bcrypt.encode("faculty123"))
                .append("phone", "")
                .append("department", "Computer Science")
                .append("designation", "Assistant Professor")
                .append("employeeId", "EMP00001")
                .append("coursesHandled", List.of("CS101"))
                .append("createdAt", now)
                .append("updatedAt", now);

        Document admin = new Document()
                .append("firstName", "Sys")
                .append("lastName", "Admin")
                .append("email", "admin@example.edu")
                .append("password", bcrypt.encode("admin123"))
                .append("phone", "")
                .append("role", "SUPER_ADMIN")
                .append("permissions", List.of("users:read", "users:write"))
                .append("createdAt", now)
                .append("updatedAt", now);

        student.getCollection("faculty").updateOne(
                new Document("email", "faculty@example.edu"),
                new Document("$setOnInsert", faculty),
                new UpdateOptions().upsert(true)
        );
        student.getCollection("admins").updateOne(
                new Document("email", "admin@example.edu"),
                new Document("$setOnInsert", admin),
                new UpdateOptions().upsert(true)
        );
        log.info("Upserted demo faculty@example.edu and admin@example.edu (bcrypt)");
    }
}

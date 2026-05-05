package com.example.demo.service;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.UpdateOptions;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Date;
import java.util.List;

/**
 * Creates role-scoped MongoDB databases and empty collections (same idea as scaffolding {@code student}).
 * <p>
 * Uses database names {@code faculty} and {@code admin_portal} — not {@code admin}, which is reserved
 * for MongoDB authentication metadata on the cluster.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FacultyAdminPortalBootstrapService {

    public static final String FACULTY_DB = "faculty";
    /** Avoid MongoDB system database name {@code admin}. */
    public static final String ADMIN_DB = "admin_portal";
    private static final String META_COLLECTION = "_app_migrations";
    private static final String META_ID = "portal_collections_v1";

    /**
     * Faculty portal: dashboard, assignments, evaluation, attendance, exams, messaging, announcements, profile.
     */
    public static final List<String> FACULTY_COLLECTIONS = List.of(
            "dashboard",
            "assignments",
            "evaluations",
            "attendance",
            "exam_scheduling",
            "messaging",
            "announcements",
            "profiles"
    );

    /**
     * Admin portal: admin profile, student profiles, faculty profiles.
     */
    public static final List<String> ADMIN_PORTAL_COLLECTIONS = List.of(
            "profiles",
            "student_profiles",
            "faculty_profiles"
    );

    private final MongoClient mongoClient;

    @Value("${app.portal.force-bootstrap:false}")
    private boolean forceBootstrap;

    public void bootstrap() {
        ensureDbCollections(FACULTY_DB, FACULTY_COLLECTIONS, "faculty portal");
        ensureDbCollections(ADMIN_DB, ADMIN_PORTAL_COLLECTIONS, "admin portal");
    }

    private void ensureDbCollections(String dbName, List<String> collections, String label) {
        MongoDatabase db = mongoClient.getDatabase(dbName);
        if (forceBootstrap) {
            db.getCollection(META_COLLECTION).deleteOne(new Document("_id", META_ID));
        }
        if (!forceBootstrap && migrationDone(db)) {
            log.debug("Skip {} bootstrap (marker present). app.portal.force-bootstrap=true to re-check collections", label);
            return;
        }
        for (String coll : collections) {
            if (!collectionExists(db, coll)) {
                db.createCollection(coll);
                log.info("Created {}.{}", dbName, coll);
            }
        }
        db.getCollection(META_COLLECTION).updateOne(
                new Document("_id", META_ID),
                new Document("$set", new Document("completedAt", Date.from(Instant.now()))
                        .append("collections", collections)),
                new UpdateOptions().upsert(true)
        );
        log.info("{} database ready: {} ({} collections)", label, dbName, collections.size());
    }

    private static boolean migrationDone(MongoDatabase db) {
        MongoCollection<Document> meta = db.getCollection(META_COLLECTION);
        return meta.find(new Document("_id", META_ID)).first() != null;
    }

    private static boolean collectionExists(MongoDatabase db, String name) {
        for (String n : db.listCollectionNames()) {
            if (n.equals(name)) {
                return true;
            }
        }
        return false;
    }
}

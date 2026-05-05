package com.example.demo.config;

import com.example.demo.model.MlStudentCourseMark;
import com.example.demo.model.Student;
import com.example.demo.model.StudentDropout;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

/**
 * MongoDB only lists a collection after it exists. Ensures {@code student_dropouts} and {@code course_recommendation}
 * exist on startup. For {@link Student}, creates {@code profiles} only when neither {@code students} nor
 * {@code profiles} exists (so a one-time rename from {@code students} is not blocked).
 */
@Slf4j
@Component
@Order(Integer.MAX_VALUE - 40)
@ConditionalOnProperty(prefix = "app.student", name = "ensure-ml-collections", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class StudentMlCollectionsBootstrapRunner implements ApplicationRunner {

    private final MongoTemplate mongoTemplate;

    @Override
    public void run(ApplicationArguments args) {
        ensure(StudentDropout.class, "student_dropouts");
        ensure(MlStudentCourseMark.class, "course_recommendation");
        ensureStudentProfilesCollection();
    }

    private void ensureStudentProfilesCollection() {
        if (mongoTemplate.collectionExists("profiles") || mongoTemplate.collectionExists("students")) {
            return;
        }
        mongoTemplate.createCollection(Student.class);
        log.info("Created empty MongoDB collection profiles");
    }

    private void ensure(Class<?> documentClass, String collectionName) {
        if (mongoTemplate.collectionExists(collectionName)) {
            return;
        }
        mongoTemplate.createCollection(documentClass);
        log.info("Created empty MongoDB collection {}", collectionName);
    }
}

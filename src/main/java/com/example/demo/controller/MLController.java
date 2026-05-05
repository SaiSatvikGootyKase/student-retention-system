package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ml")
@CrossOrigin(origins = "*")
public class MLController {

    @PostMapping("/predict-dropout")
    public ResponseEntity<String> triggerDropoutPrediction() {
        // Here we would call the Python Microservice or embedded model to run batch inferences.
        return ResponseEntity.ok("Batch inference for Dropout Prediction triggered successfully.");
    }

    @PostMapping("/recommend-lectures")
    public ResponseEntity<String> triggerLectureRecommendations() {
        // Here we would call the Python Microservice to generate recommendations.
        return ResponseEntity.ok("Lecture Recommendation generation triggered successfully.");
    }
}

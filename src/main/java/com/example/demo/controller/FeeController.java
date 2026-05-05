package com.example.demo.controller;

import com.example.demo.model.Fee;
import com.example.demo.service.FeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/fees")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FeeController {

    private final FeeService feeService;

    @GetMapping
    public ResponseEntity<List<Fee>> getByStudent(@RequestParam String studentId) {
        return ResponseEntity.ok(feeService.getByStudent(studentId));
    }

    @PostMapping
    public ResponseEntity<Fee> create(@RequestBody Fee fee) {
        return ResponseEntity.ok(feeService.create(fee));
    }

    @PutMapping("/{id}/pay")
    public ResponseEntity<Fee> markPaid(@PathVariable String id) {
        return ResponseEntity.ok(feeService.markPaid(id));
    }
}

package com.example.demo.service;

import com.example.demo.model.Fee;
import com.example.demo.repository.FeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FeeService {

    private final FeeRepository feeRepository;

    public List<Fee> getByStudent(String studentId) {
        return feeRepository.findByStudentId(studentId);
    }

    public Fee create(Fee fee) {
        return feeRepository.save(fee);
    }

    public Fee markPaid(String feeId) {
        Fee fee = feeRepository.findById(feeId)
                .orElseThrow(() -> new RuntimeException("Fee not found: " + feeId));
        fee.setStatus("PAID");
        fee.setPaidAt(LocalDateTime.now());
        return feeRepository.save(fee);
    }
}

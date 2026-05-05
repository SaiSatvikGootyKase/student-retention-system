package com.example.demo.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Data
@Document(collection = "timetable")
public class TimetableEntry {
    @Id
    private String id;
    private String course;
    private String subject;
    private String facultyId;
    private String dayOfWeek; // MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY
    private String startTime; // HH:mm format
    private String endTime;
    private String room;
    private List<String> studentIds = new ArrayList<>();
}

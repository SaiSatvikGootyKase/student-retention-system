package com.example.demo.dto;

import lombok.Data;

@Data
public class SubmissionRequest {
    private String studentId;
    /** Written answer (may be empty if only a document is attached). */
    private String content;
    /** Optional uploaded document (stored as base64 for this demo build). */
    private String attachmentFileName;
    private String attachmentMimeType;
    private String attachmentBase64;
}

package com.example.demo.service;

import com.example.demo.dto.SubjectProbabilityDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

/**
 * Optionally runs {@code predict_recommendation.py} to get live RF outputs when Python + model artifact exist.
 */
@Slf4j
@Component
public class LectureRfPythonRunner {

    private static final ObjectMapper JSON = new ObjectMapper();

    public record RfResult(String primary, List<SubjectProbabilityDto> top) {}

    public Optional<RfResult> predict(
            double math,
            double physics,
            double chemistry,
            double english,
            double computerScience
    ) {
        Path script = resolveScriptPath();
        if (script == null || !Files.isRegularFile(script)) {
            log.debug("Lecture RF script not found at expected path; skipping runtime inference.");
            return Optional.empty();
        }

        String python = System.getenv().getOrDefault("PYTHON_EXE", pythonCommand());
        List<String> cmd = new ArrayList<>();
        cmd.add(python);
        cmd.add(script.toAbsolutePath().toString());
        cmd.add("--json");
        cmd.add("--math");
        cmd.add(Double.toString(math));
        cmd.add("--physics");
        cmd.add(Double.toString(physics));
        cmd.add("--chemistry");
        cmd.add(Double.toString(chemistry));
        cmd.add("--english");
        cmd.add(Double.toString(english));
        cmd.add("--computer_science");
        cmd.add(Double.toString(computerScience));

        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.redirectErrorStream(true);
        pb.directory(script.getParent().toFile());
        try {
            Process p = pb.start();
            String out = new String(p.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            boolean finished = p.waitFor(45, TimeUnit.SECONDS);
            if (!finished) {
                p.destroyForcibly();
                log.warn("Lecture RF python timed out");
                return Optional.empty();
            }
            if (p.exitValue() != 0) {
                log.warn("Lecture RF python exit {} stderr/out tail: {}", p.exitValue(), tail(out, 400));
                return Optional.empty();
            }
            return parseJsonLine(out);
        } catch (Exception e) {
            log.debug("Lecture RF python not run: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private static Optional<RfResult> parseJsonLine(String out) {
        for (String raw : out.split("\\R")) {
            String line = raw.trim();
            if (!line.startsWith("{")) continue;
            try {
                JsonNode n = JSON.readTree(line);
                String primary = n.path("primary").asText(null);
                if (primary == null || primary.isBlank()) continue;
                List<SubjectProbabilityDto> top = new ArrayList<>();
                if (n.has("top") && n.get("top").isArray()) {
                    for (JsonNode item : n.get("top")) {
                        top.add(SubjectProbabilityDto.builder()
                                .subject(item.path("subject").asText(""))
                                .probability(item.path("probability").asDouble(0))
                                .build());
                    }
                }
                return Optional.of(new RfResult(primary, top));
            } catch (Exception e) {
                log.debug("Skip non-json line: {}", e.getMessage());
            }
        }
        return Optional.empty();
    }

    private static String tail(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(s.length() - max);
    }

    private static Path resolveScriptPath() {
        Path cwd = Paths.get(System.getProperty("user.dir", ".")).toAbsolutePath().normalize();
        Path[] candidates = {
                cwd.resolve("ML_model").resolve("Lecture Recommendation System").resolve("predict_recommendation.py"),
                cwd.resolve("student-retention-system").resolve("ML_model")
                        .resolve("Lecture Recommendation System").resolve("predict_recommendation.py"),
        };
        for (Path p : candidates) {
            if (Files.isRegularFile(p)) return p;
        }
        return null;
    }

    private static String pythonCommand() {
        return System.getProperty("os.name", "").toLowerCase().contains("win") ? "python" : "python3";
    }
}

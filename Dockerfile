FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace/app

# Copy gradle configuration
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

# Copy source code
COPY src src

# gradlew often loses the executable bit when copied from Windows → chmod fixes Render/Docker builds
RUN chmod +x gradlew

# Build the application
RUN ./gradlew build -x test --no-daemon

# Debian-based JRE (not Alpine): reliable DNS SRV lookup for mongodb+srv Atlas URIs on Render.
FROM eclipse-temurin:21-jre
VOLUME /tmp
ARG DEPENDENCY=/workspace/app/build/libs
COPY --from=build ${DEPENDENCY}/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java -jar /app.jar --server.port=${PORT:-8080}"]

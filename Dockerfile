FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /workspace/app

# Copy gradle configuration
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

# Copy source code
COPY src src

# Build the application
RUN ./gradlew build -x test

# Create final minimal image
FROM eclipse-temurin:21-jre-alpine
VOLUME /tmp
ARG DEPENDENCY=/workspace/app/build/libs
COPY --from=build ${DEPENDENCY}/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java","-jar","/app.jar"]

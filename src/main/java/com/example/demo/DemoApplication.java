package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.Map;

@SpringBootApplication
public class DemoApplication {

	public static void main(String[] args) {
		SpringApplication application = new SpringApplication(DemoApplication.class);
		application.addListeners((ApplicationListener<ApplicationEnvironmentPreparedEvent>) DemoApplication::configureEnvironment);
		application.run(args);
	}

	private static void configureEnvironment(ApplicationEnvironmentPreparedEvent event) {
		ConfigurableEnvironment environment = event.getEnvironment();
		if (isRenderRuntime()) {
			// Honour SPRING_MONGODB_URI from Render; skip local-only startup jobs (no test DB / extra DBs on Atlas).
			environment.getPropertySources().addFirst(new MapPropertySource("renderDefaults", Map.of(
					"app.migration.copy-test-to-student", false,
					"app.portal.bootstrap-databases", false,
					"app.student.ensure-ml-collections", false,
					"app.admin.bootstrap-default", false
			)));
			return;
		}

		// When app.mongodb.use-localhost-only=true, pin Mongo to localhost for local dev.
		boolean force = environment.getProperty("app.mongodb.use-localhost-only", Boolean.class, true);
		if (!Boolean.TRUE.equals(force)) {
			return;
		}
		Map<String, Object> map = Map.of(
				"spring.mongodb.uri", "mongodb://localhost:27017/student",
				"spring.mongodb.database", "student"
		);
		environment.getPropertySources().addFirst(new MapPropertySource("pinLocalMongo", map));
	}

	private static boolean isRenderRuntime() {
		String render = System.getenv("RENDER");
		return render != null && render.equalsIgnoreCase("true");
	}
}

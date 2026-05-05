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
		application.addListeners((ApplicationListener<ApplicationEnvironmentPreparedEvent>) DemoApplication::pinLocalMongoIfEnabled);
		application.run(args);
	}

	/**
	 * When {@code app.mongodb.use-localhost-only=true}, prepends a property source so
	 * {@code spring.mongodb.uri} / {@code spring.mongodb.database} win over env (e.g. Atlas / compose).
	 */
	private static void pinLocalMongoIfEnabled(ApplicationEnvironmentPreparedEvent event) {
		ConfigurableEnvironment environment = event.getEnvironment();
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
}

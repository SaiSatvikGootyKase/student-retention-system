package com.example.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Default: local dev. Set APP_CORS_ORIGINS to comma-separated patterns for production
        // (e.g. "https://yourapp.vercel.app,https://www.yourdomain.com") or use * behind HTTPS only with care.
        String origins = System.getenv("APP_CORS_ORIGINS");
        // Default: local Vite + any Render static site (*.onrender.com). Override APP_CORS_ORIGINS for custom domains.
        String[] patterns = (origins == null || origins.isBlank())
                ? new String[] {
                        "http://localhost:*",
                        "http://127.0.0.1:*",
                        "https://*.onrender.com",
                }
                : origins.trim().split("\\s*,\\s*");
        registry.addMapping("/api/**")
                .allowedOriginPatterns(patterns)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false);
    }
}

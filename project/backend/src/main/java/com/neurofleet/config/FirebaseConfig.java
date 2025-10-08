package com.neurofleet.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;

import java.io.FileInputStream;
import java.io.IOException;

@Configuration
public class FirebaseConfig {

    @Value("${app.firebase.credentials}")
    private String credentialsPath;

    @Bean
    public String firebaseInitializer() throws IOException {
        // Allow app to start even if Firebase credentials are missing in local dev
        if (credentialsPath == null || credentialsPath.isBlank() || !new java.io.File(credentialsPath).exists()) {
            System.out.println("[FirebaseConfig] Credentials file not found at '" + credentialsPath + "'. Skipping Firebase initialization for local dev.");
            return "firebase-not-initialized";
        }
        try (FileInputStream serviceAccount = new FileInputStream(credentialsPath)) {
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .setDatabaseUrl("https://neurofleetx-project-default-rtdb.firebaseio.com")
                    .build();
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }
            System.out.println("[FirebaseConfig] Firebase initialized with database URL.");
            return "firebase-initialized";
        }
    }
}
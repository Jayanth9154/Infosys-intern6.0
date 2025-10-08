package com.neurofleet.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;
import com.google.firebase.FirebaseApp;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;

@Configuration
public class FirestoreConfig {

    @Bean
    @DependsOn("firebaseInitializer")
    public Firestore firestore() {
        // Use Firebase Admin SDK to get Firestore instance
        try {
            if (!FirebaseApp.getApps().isEmpty()) {
                return FirestoreClient.getFirestore();
            } else {
                // Fallback: create Firestore with project ID
                FirestoreOptions options = FirestoreOptions.newBuilder()
                        .setProjectId("neurofleetx-project")
                        .build();
                return options.getService();
            }
        } catch (Exception e) {
            System.out.println("[FirestoreConfig] Warning: Could not initialize Firestore. Using mock configuration for development.");
            // Return null for development - controllers should handle this gracefully
            return null;
        }
    }
}
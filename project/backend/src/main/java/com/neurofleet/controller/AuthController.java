package com.neurofleet.controller;

import com.google.cloud.firestore.Firestore;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final Firestore db;

    public AuthController(Firestore db) {
        this.db = db;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) throws Exception {
        String email = body.get("email");
        String password = body.get("password");
        if (email == null || password == null) return ResponseEntity.badRequest().body(Map.of("error","Email and password are required."));
        UserRecord.CreateRequest request = new UserRecord.CreateRequest()
                .setEmail(email).setPassword(password);
        UserRecord userRecord = FirebaseAuth.getInstance().createUser(request);
        
        // Create initial user profile document in Firestore
        if (db != null) {
            try {
                Map<String, Object> initialProfile = new HashMap<>();
                initialProfile.put("email", email);
                initialProfile.put("name", "");
                initialProfile.put("phone", "");
                initialProfile.put("address", "");
                initialProfile.put("createdAt", System.currentTimeMillis());
                
                db.collection("users").document(userRecord.getUid()).set(initialProfile).get();
                System.out.println("[AuthController] Created user profile document for: " + userRecord.getUid());
            } catch (Exception e) {
                System.err.println("[AuthController] Failed to create user profile document: " + e.getMessage());
            }
        }
        
        return ResponseEntity.status(201).body(Map.of("message","User registered successfully!","uid", userRecord.getUid()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) throws Exception {
        String email = body.get("email");
        if (email == null) return ResponseEntity.badRequest().body(Map.of("error","Email is required."));
        UserRecord record = FirebaseAuth.getInstance().getUserByEmail(email);
        String customToken = FirebaseAuth.getInstance().createCustomToken(record.getUid());
        return ResponseEntity.ok(Map.of("token", customToken));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        // In a real app, enrich with claims; here we expose principal only
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return ResponseEntity.status(401).body(Map.of("error","Unauthorized"));
        return ResponseEntity.ok(Map.of("uid", auth.getName()));
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "message", "NeuroFleet Backend is running",
            "timestamp", System.currentTimeMillis(),
            "firebase", "Connected"
        ));
    }
}

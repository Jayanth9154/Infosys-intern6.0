package com.neurofleet.controller;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) throws Exception {
        String email = body.get("email");
        String password = body.get("password");
        if (email == null || password == null) return ResponseEntity.badRequest().body(Map.of("error","Email and password are required."));
        UserRecord.CreateRequest request = new UserRecord.CreateRequest()
                .setEmail(email).setPassword(password);
        UserRecord userRecord = FirebaseAuth.getInstance().createUser(request);
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
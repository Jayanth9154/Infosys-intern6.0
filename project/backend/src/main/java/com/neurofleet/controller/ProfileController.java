package com.neurofleet.controller;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.SetOptions;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final Firestore db;

    public ProfileController(Firestore db) {
        this.db = db;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(Authentication authentication) throws Exception {
        if (authentication == null || !authentication.isAuthenticated()) return ResponseEntity.status(401).build();
        if (db == null) return ResponseEntity.ok(Map.of("message", "Firestore not available in development mode"));
        
        String uid = authentication.getName();
        DocumentSnapshot snap = db.collection("users").document(uid).get().get();
        return ResponseEntity.ok(snap.exists() ? snap.getData() : Map.of());
    }

    @PutMapping("/me")
    public ResponseEntity<?> upsertMyProfile(Authentication authentication, @RequestBody Map<String, Object> body) throws Exception {
        if (authentication == null || !authentication.isAuthenticated()) return ResponseEntity.status(401).build();
        if (db == null) return ResponseEntity.ok(Map.of("message", "Profile update not available in development mode"));
        
        String uid = authentication.getName();
        DocumentReference ref = db.collection("users").document(uid);
        ApiFuture<?> fut = ref.set(body, SetOptions.merge());
        fut.get();
        return ResponseEntity.ok(body);
    }
}
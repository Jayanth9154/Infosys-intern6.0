package com.neurofleet.controller;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.SetOptions;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
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
        // Log authentication details for debugging
        System.out.println("ProfileController.getMyProfile called with authentication: " + authentication);
        
        if (authentication == null || !authentication.isAuthenticated()) {
            System.out.println("User not authenticated, returning 401");
            if (db == null) {
                return ResponseEntity.ok(buildDevelopmentProfile());
            }
            return ResponseEntity.status(401).body(Map.of("error", "User not authenticated", "message", "No valid authentication token provided"));
        }
        
        // Log user authorities for debugging
        System.out.println("User authorities: " + authentication.getAuthorities());
        
        if (db == null) {
            return ResponseEntity.ok(buildDevelopmentProfile());
        }

        String uid = authentication.getName();
        System.out.println("Authenticated user ID: " + uid);

        try {
            DocumentSnapshot userSnap = db.collection("users").document(uid).get().get();
            Map<String, Object> profileData = userSnap.exists() ? userSnap.getData() : Map.of();

            // Fetch assigned vehicles
            ApiFuture<QuerySnapshot> vehiclesFuture = db.collection("vehicles")
                    .whereEqualTo("currentDriver", uid)
                    .get();
            List<Map<String, Object>> assignedVehicles = new ArrayList<>();
            for (QueryDocumentSnapshot doc : vehiclesFuture.get().getDocuments()) {
                Map<String, Object> m = doc.getData();
                m.put("id", doc.getId());
                assignedVehicles.add(m);
            }

            // Fetch recent trips (limit 10)
            List<Map<String, Object>> recentTrips = new ArrayList<>();
            try {
                ApiFuture<QuerySnapshot> tripsFuture = db.collection("trips")
                        .whereEqualTo("driverId", uid)
                        .orderBy("startTime", Query.Direction.DESCENDING)
                        .limit(10)
                        .get();
                for (QueryDocumentSnapshot doc : tripsFuture.get().getDocuments()) {
                    Map<String, Object> m = doc.getData();
                    m.put("id", doc.getId());
                    recentTrips.add(m);
                }
            } catch (Exception e) {
                // Handle Firestore index error gracefully - return empty trips
                System.out.println("[ProfileController] Could not fetch trips (may need Firestore index): " + e.getMessage());
            }

            Map<String, Object> tripsPayload = Map.of(
                    "items", recentTrips,
                    "page", 0,
                    "totalPages", recentTrips.isEmpty() ? 0 : 1
            );

            return ResponseEntity.ok(Map.of(
                    "profile", profileData,
                    "assignedVehicles", assignedVehicles,
                    "recentTrips", tripsPayload
            ));
        } catch (Exception e) {
            System.err.println("Error in getMyProfile: " + e.getMessage());
            e.printStackTrace();
            // Return a more descriptive error message
            return ResponseEntity.status(500).body(Map.of("error", "Failed to load profile data", "message", e.getMessage()));
        }
    }

    @PutMapping("/me")
    public ResponseEntity<?> upsertMyProfile(Authentication authentication, @RequestBody Map<String, Object> body) throws Exception {
        System.out.println("ProfileController.upsertMyProfile called with authentication: " + authentication);
        
        if (authentication == null || !authentication.isAuthenticated()) {
            System.out.println("User not authenticated, returning 401");
            if (db == null) {
                return ResponseEntity.ok(Map.of("message", "Profile update not available in development mode"));
            }
            return ResponseEntity.status(401).build();
        }

        if (db == null) {
            return ResponseEntity.ok(Map.of("message", "Profile update not available in development mode"));
        }

        String uid = authentication.getName();
        System.out.println("Authenticated user ID: " + uid);
        
        try {
            DocumentReference ref = db.collection("users").document(uid);
            ApiFuture<?> fut = ref.set(body, SetOptions.merge());
            fut.get();
            return ResponseEntity.ok(Map.of("profile", body));
        } catch (Exception e) {
            System.err.println("Error in upsertMyProfile: " + e.getMessage());
            e.printStackTrace();
            // Return a more descriptive error message
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update profile", "message", e.getMessage()));
        }
    }

    private Map<String, Object> buildDevelopmentProfile() {
        Map<String, Object> profileStub = Map.of(
                "name", "John Smith",
                "phone", "+1 (555) 123-4567",
                "address", "456 Fleet Avenue, San Francisco, CA 94102",
                "dateOfBirth", "1990-05-15",
                "licenseNumber", "D1234567",
                "emergencyContact", "Jane Smith",
                "emergencyPhone", "+1 (555) 987-6543",
                "preferredVehicleType", "electric",
                "experienceYears", "8"
        );

        List<Map<String, Object>> vehiclesStub = List.of(
                Map.of(
                        "id", "dev-vehicle-1",
                        "name", "Tesla Model 3",
                        "status", "AVAILABLE",
                        "licensePlate", "CAL-1234",
                        "currentBattery", 82,
                        "lastKnownLocation", "HQ Depot - Bay Area"
                ),
                Map.of(
                        "id", "dev-vehicle-2",
                        "name", "Rivian R1T",
                        "status", "ON_TRIP",
                        "licensePlate", "CAL-5678",
                        "currentBattery", 47,
                        "lastKnownLocation", "Mission District"
                ),
                Map.of(
                        "id", "dev-vehicle-3",
                        "name", "Ford E-Transit",
                        "status", "CHARGING",
                        "licensePlate", "CAL-9012",
                        "currentBattery", 28,
                        "lastKnownLocation", "Charging Station #7"
                )
        );

        List<Map<String, Object>> tripsStub = List.of(
                Map.of(
                        "id", "trip-20250113-001",
                        "vehicleId", "dev-vehicle-2",
                        "startTime", "2025-01-13T08:05:00Z",
                        "endTime", "2025-01-13T08:48:00Z",
                        "status", "COMPLETED",
                        "distanceKm", 18.4
                ),
                Map.of(
                        "id", "trip-20250113-002",
                        "vehicleId", "dev-vehicle-1",
                        "startTime", "2025-01-13T09:15:00Z",
                        "status", "IN_PROGRESS",
                        "distanceKm", 6.1
                ),
                Map.of(
                        "id", "trip-20250112-005",
                        "vehicleId", "dev-vehicle-1",
                        "startTime", "2025-01-12T14:30:00Z",
                        "endTime", "2025-01-12T15:45:00Z",
                        "status", "COMPLETED",
                        "distanceKm", 32.7
                ),
                Map.of(
                        "id", "trip-20250112-003",
                        "vehicleId", "dev-vehicle-3",
                        "startTime", "2025-01-12T10:00:00Z",
                        "endTime", "2025-01-12T12:20:00Z",
                        "status", "COMPLETED",
                        "distanceKm", 45.3
                ),
                Map.of(
                        "id", "trip-20250111-008",
                        "vehicleId", "dev-vehicle-2",
                        "startTime", "2025-01-11T16:45:00Z",
                        "endTime", "2025-01-11T17:30:00Z",
                        "status", "COMPLETED",
                        "distanceKm", 15.8
                )
        );

        return Map.of(
                "profile", profileStub,
                "assignedVehicles", vehiclesStub,
                "recentTrips", Map.of(
                        "items", tripsStub,
                        "page", 0,
                        "totalPages", 1
                ),
                "message", "Development profile data loaded (Firestore disabled)."
        );
    }
}
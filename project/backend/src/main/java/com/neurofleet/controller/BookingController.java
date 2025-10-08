package com.neurofleet.controller;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final Firestore db;

    public BookingController(Firestore db) {
        this.db = db;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getBookings() throws Exception {
        if (db == null) {
            // Return mock data for development
            return ResponseEntity.ok(List.of(
                Map.of("id", "booking-1", "customerEmail", "customer@example.com", "vehicleType", "economy", "status", "confirmed"),
                Map.of("id", "booking-2", "customerEmail", "customer2@example.com", "vehicleType", "premium", "status", "pending")
            ));
        }
        
        ApiFuture<QuerySnapshot> future = db.collection("bookings").get();
        List<QueryDocumentSnapshot> docs = future.get().getDocuments();
        List<Map<String, Object>> list = new ArrayList<>();
        for (QueryDocumentSnapshot d : docs) {
            Map<String, Object> m = d.getData();
            m.put("id", d.getId());
            list.add(m);
        }
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getBooking(@PathVariable String id) throws Exception {
        if (db == null) {
            return ResponseEntity.ok(Map.of("id", id, "status", "pending"));
        }
        
        DocumentSnapshot doc = db.collection("bookings").document(id).get().get();
        if (!doc.exists()) return ResponseEntity.notFound().build();
        Map<String, Object> m = doc.getData();
        m.put("id", doc.getId());
        return ResponseEntity.ok(m);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createBooking(@RequestBody Map<String, Object> body) throws Exception {
        if (db == null) {
            // Mock response for development
            body.put("id", "booking-" + System.currentTimeMillis());
            body.put("status", "pending");
            body.put("createdAt", new Date());
            return ResponseEntity.status(201).body(body);
        }
        
        DocumentReference ref = db.collection("bookings").document();
        body.put("createdAt", new Date());
        body.put("status", "pending");
        ref.set(body).get();
        
        // Add to booking history
        appendBookingHistory(ref.getId(), "created", body);
        
        return ResponseEntity.status(201).body(withId(ref.getId(), body));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateBooking(@PathVariable String id, @RequestBody Map<String, Object> update) throws Exception {
        if (db == null) {
            update.put("id", id);
            return ResponseEntity.ok(update);
        }
        
        db.collection("bookings").document(id).set(update, SetOptions.merge()).get();
        appendBookingHistory(id, "updated", update);
        return ResponseEntity.ok(withId(id, update));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteBooking(@PathVariable String id) throws Exception {
        if (db == null) {
            return ResponseEntity.ok(Map.of("message", "Booking cancelled successfully"));
        }
        
        db.collection("bookings").document(id).delete().get();
        appendBookingHistory(id, "cancelled", Map.of());
        return ResponseEntity.ok(Map.of("message", "Booking cancelled successfully"));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Map<String, Object>>> getCustomerBookings(@PathVariable String customerId) throws Exception {
        if (db == null) {
            return ResponseEntity.ok(List.of(
                Map.of("id", "booking-1", "customerId", customerId, "status", "confirmed"),
                Map.of("id", "booking-2", "customerId", customerId, "status", "completed")
            ));
        }
        
        ApiFuture<QuerySnapshot> future = db.collection("bookings")
                .whereEqualTo("customerId", customerId)
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .get();
        List<QueryDocumentSnapshot> docs = future.get().getDocuments();
        List<Map<String, Object>> list = new ArrayList<>();
        for (QueryDocumentSnapshot d : docs) {
            Map<String, Object> m = d.getData();
            m.put("id", d.getId());
            list.add(m);
        }
        return ResponseEntity.ok(list);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateBookingStatus(@PathVariable String id, @RequestBody Map<String, Object> body) throws Exception {
        String status = Objects.toString(body.get("status"), "pending");
        
        if (db == null) {
            return ResponseEntity.ok(Map.of("id", id, "status", status));
        }
        
        db.collection("bookings").document(id).set(Map.of("status", status, "updatedAt", new Date()), SetOptions.merge()).get();
        appendBookingHistory(id, "status_changed", Map.of("newStatus", status));
        return ResponseEntity.ok(Map.of("id", id, "status", status));
    }

    private void appendBookingHistory(String id, String type, Map<String, Object> details) throws Exception {
        if (db == null) return;
        
        db.collection("bookings").document(id).collection("history").add(Map.of(
                "eventType", type,
                "details", details,
                "timestamp", new Date()
        )).get();
    }

    private Map<String, Object> withId(String id, Map<String, Object> body) {
        Map<String, Object> m = new HashMap<>(body);
        m.put("id", id);
        return m;
    }
}
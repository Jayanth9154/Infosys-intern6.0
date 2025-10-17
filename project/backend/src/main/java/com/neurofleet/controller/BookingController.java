package com.neurofleet.controller;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.*;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final Firestore db;
    
    @Autowired(required = false)
    private JavaMailSender emailSender;

    public BookingController(Firestore db) {
        this.db = db;
    }

    // Add email service method with actual email sending
    private void sendEmailNotification(String to, String subject, String body) {
        // Check if we have email configuration and sender
        String host = System.getenv("SMTP_HOST");
        
        // If we have email configuration and sender, send actual email
        if (host != null && !host.isEmpty() && emailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(to);
                message.setSubject(subject);
                message.setText(body);
                emailSender.send(message);
                System.out.println("Email sent successfully to: " + to);
            } catch (Exception e) {
                System.err.println("Failed to send email: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            // Log to console (development mode)
            System.out.println("=== EMAIL NOTIFICATION ===");
            System.out.println("To: " + to);
            System.out.println("Subject: " + subject);
            System.out.println("Body: " + body);
            System.out.println("=========================");
            if (host == null || host.isEmpty()) {
                System.out.println("NOTE: Email configuration not found. Set SMTP_HOST, SMTP_PORT, SMTP_USERNAME, and SMTP_PASSWORD environment variables to enable actual email sending.");
            } else if (emailSender == null) {
                System.out.println("NOTE: Email sender not configured. Make sure spring-boot-starter-mail is in dependencies and mail properties are set.");
            }
        }
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
        
        // Send confirmation email
        String customerEmail = (String) body.get("customerEmail");
        if (customerEmail != null && !customerEmail.isEmpty()) {
            String subject = "Booking Confirmation - NeuroFleetX";
            String messageBody = String.format(
                "Dear Customer,\n\n" +
                "Your booking has been confirmed!\n\n" +
                "Booking ID: %s\n" +
                "Vehicle Type: %s\n" +
                "Pickup Location: %s\n" +
                "Dropoff Location: %s\n" +
                "Pickup Date: %s\n" +
                "Pickup Time: %s\n" +
                "Estimated Cost: ₹%.2f\n\n" +
                "We'll notify you when your vehicle is on the way.\n\n" +
                "Thank you for choosing NeuroFleetX!",
                ref.getId(),
                body.get("vehicleType"),
                body.get("pickupLocation"),
                body.get("dropoffLocation"),
                body.get("pickupDate"),
                body.get("pickupTime"),
                ((Number) body.getOrDefault("estimatedCost", 0)).doubleValue()
            );
            sendEmailNotification(customerEmail, subject, messageBody);
        }
        
        return ResponseEntity.status(201).body(withId(ref.getId(), body));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateBooking(@PathVariable String id, @RequestBody Map<String, Object> update) throws Exception {
        if (db == null) {
            update.put("id", id);
            return ResponseEntity.ok(update);
        }
        
        // Get current booking data for email notification
        DocumentSnapshot currentDoc = db.collection("bookings").document(id).get().get();
        Map<String, Object> currentData = currentDoc.exists() ? currentDoc.getData() : new HashMap<>();
        
        db.collection("bookings").document(id).set(update, SetOptions.merge()).get();
        appendBookingHistory(id, "updated", update);
        
        // Send update notification email
        String customerEmail = (String) currentData.get("customerEmail");
        String status = (String) update.get("status");
        if (customerEmail != null && !customerEmail.isEmpty() && status != null) {
            String subject = "Booking Update - NeuroFleetX";
            String messageBody = String.format(
                "Dear Customer,\n\n" +
                "Your booking status has been updated.\n\n" +
                "Booking ID: %s\n" +
                "New Status: %s\n\n" +
                "Thank you for choosing NeuroFleetX!",
                id,
                status
            );
            sendEmailNotification(customerEmail, subject, messageBody);
        }
        
        return ResponseEntity.ok(withId(id, update));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteBooking(@PathVariable String id) throws Exception {
        if (db == null) {
            return ResponseEntity.ok(Map.of("message", "Booking cancelled successfully"));
        }
        
        // Get current booking data for email notification
        DocumentSnapshot currentDoc = db.collection("bookings").document(id).get().get();
        Map<String, Object> currentData = currentDoc.exists() ? currentDoc.getData() : new HashMap<>();
        
        db.collection("bookings").document(id).delete().get();
        appendBookingHistory(id, "cancelled", Map.of());
        
        // Send cancellation notification email
        String customerEmail = (String) currentData.get("customerEmail");
        if (customerEmail != null && !customerEmail.isEmpty()) {
            String subject = "Booking Cancellation - NeuroFleetX";
            String messageBody = String.format(
                "Dear Customer,\n\n" +
                "Your booking has been cancelled successfully.\n\n" +
                "Booking ID: %s\n" +
                "Vehicle Type: %s\n" +
                "Pickup Location: %s\n" +
                "Dropoff Location: %s\n\n" +
                "If you have any questions, please contact our support team.\n\n" +
                "Thank you for choosing NeuroFleetX!",
                id,
                currentData.get("vehicleType"),
                currentData.get("pickupLocation"),
                currentData.get("dropoffLocation")
            );
            sendEmailNotification(customerEmail, subject, messageBody);
        }
        
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

    // New endpoint to get bookings for the current authenticated user
    @GetMapping("/user")
    public ResponseEntity<?> getUserBookings(Authentication authentication) throws Exception {
        System.out.println("getUserBookings called with authentication: " + authentication);
        
        if (authentication == null) {
            System.out.println("Authentication is null, returning 401");
            return ResponseEntity.status(401).build();
        }
        
        String userId = authentication.getName();
        System.out.println("Authenticated user ID: " + userId);
        
        // Log additional debugging information
        System.out.println("Database connection status: " + (db != null ? "Connected" : "Not connected"));
        if (db != null) {
            System.out.println("Attempting to fetch bookings for user: " + userId);
        }
        
        if (db == null) {
            System.out.println("Database is null, returning mock data");
            return ResponseEntity.ok(List.of(
                Map.of("id", "booking-1", "customerId", userId, "vehicleType", "economy", "status", "confirmed", "pickupLocation", "Downtown", "dropoffLocation", "Airport"),
                Map.of("id", "booking-2", "customerId", userId, "vehicleType", "suv", "status", "pending", "pickupLocation", "Mall", "dropoffLocation", "University")
            ));
        }
        
        try {
            System.out.println("Fetching bookings for user: " + userId);
            // First try the optimized query with index
            ApiFuture<QuerySnapshot> future = db.collection("bookings")
                    .whereEqualTo("customerId", userId)
                    .orderBy("createdAt", Query.Direction.DESCENDING)
                    .get();
            List<QueryDocumentSnapshot> docs = future.get().getDocuments();
            List<Map<String, Object>> list = new ArrayList<>();
            for (QueryDocumentSnapshot d : docs) {
                Map<String, Object> m = d.getData();
                m.put("id", d.getId());
                list.add(m);
            }
            System.out.println("Found " + list.size() + " bookings for user: " + userId);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            System.err.println("Error fetching bookings for user " + userId + ": " + e.getMessage());
            e.printStackTrace();
            
            // Check if it's a Firebase index error
            if (e.getMessage() != null && e.getMessage().contains("index")) {
                System.out.println("Attempting fallback query without composite index...");
                try {
                    // Fallback: fetch all bookings and filter on the server side
                    ApiFuture<QuerySnapshot> future = db.collection("bookings")
                            .orderBy("createdAt", Query.Direction.DESCENDING)
                            .get();
                    List<QueryDocumentSnapshot> docs = future.get().getDocuments();
                    List<Map<String, Object>> list = new ArrayList<>();
                    for (QueryDocumentSnapshot d : docs) {
                        Map<String, Object> m = d.getData();
                        // Filter by customerId on the server side
                        if (userId.equals(m.get("customerId"))) {
                            m.put("id", d.getId());
                            list.add(m);
                        }
                    }
                    System.out.println("Found " + list.size() + " bookings for user (fallback query): " + userId);
                    return ResponseEntity.ok(list);
                } catch (Exception fallbackException) {
                    System.err.println("Fallback query also failed: " + fallbackException.getMessage());
                    fallbackException.printStackTrace();
                }
                
                String errorMessage = "Firebase index required for this query. Please create a composite index in the Firebase Console with these fields: " +
                    "customerId (equality) and createdAt (descending). " +
                    "Visit: https://console.firebase.google.com/project/neurofleetx-project/firestore/indexes";
                System.err.println(errorMessage);
                return ResponseEntity.status(500).body(Map.of("error", errorMessage));
            }
            
            // Return empty list instead of error to prevent UI issues
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateBookingStatus(@PathVariable String id, @RequestBody Map<String, Object> body) throws Exception {
        String status = Objects.toString(body.get("status"), "pending");
        
        if (db == null) {
            return ResponseEntity.ok(Map.of("id", id, "status", status));
        }
        
        // Get current booking data for email notification
        DocumentSnapshot currentDoc = db.collection("bookings").document(id).get().get();
        Map<String, Object> currentData = currentDoc.exists() ? currentDoc.getData() : new HashMap<>();
        
        db.collection("bookings").document(id).set(Map.of("status", status, "updatedAt", new Date()), SetOptions.merge()).get();
        appendBookingHistory(id, "status_changed", Map.of("newStatus", status));
        
        // Send status update notification email
        String customerEmail = (String) currentData.get("customerEmail");
        if (customerEmail != null && !customerEmail.isEmpty()) {
            String subject = "Booking Status Update - NeuroFleetX";
            String messageBody = String.format(
                "Dear Customer,\n\n" +
                "Your booking status has been updated.\n\n" +
                "Booking ID: %s\n" +
                "New Status: %s\n\n" +
                "Thank you for choosing NeuroFleetX!",
                id,
                status
            );
            sendEmailNotification(customerEmail, subject, messageBody);
        }
        
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
package com.neurofleet.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.neurofleet.service.TelemetryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final Firestore db;
    private final TelemetryService telemetry;
    private final ObjectMapper mapper = new ObjectMapper();

    public VehicleController(Firestore db, TelemetryService telemetry) {
        this.db = db;
        this.telemetry = telemetry;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getVehicles() throws Exception {
        if (db == null) {
            // Return mock data for development
            return ResponseEntity.ok(List.of(
                Map.of("id", "dev-vehicle-1", "make", "Tesla", "model", "Model 3", "licensePlate", "DEV-001", "status", "available"),
                Map.of("id", "dev-vehicle-2", "make", "BMW", "model", "i3", "licensePlate", "DEV-002", "status", "on-trip")
            ));
        }
        
        ApiFuture<QuerySnapshot> future = db.collection("vehicles").get();
        List<QueryDocumentSnapshot> docs = future.get().getDocuments();
        List<Map<String, Object>> list = new ArrayList<>();
        for (QueryDocumentSnapshot d : docs) {
            Map<String, Object> m = d.getData();
            m.put("id", d.getId());
            list.add(m);
            if (telemetry != null) telemetry.addOrInitVehicle(d.getId(), m);
        }
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getVehicle(@PathVariable String id) throws Exception {
        DocumentSnapshot doc = db.collection("vehicles").document(id).get().get();
        if (!doc.exists()) return ResponseEntity.notFound().build();
        Map<String, Object> m = doc.getData();
        m.put("id", doc.getId());
        return ResponseEntity.ok(m);
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<Map<String, Object>> getVehicleHistory(@PathVariable String id) throws Exception {
        QuerySnapshot snap = db.collection("vehicles").document(id).collection("history")
                .orderBy("timestamp", Query.Direction.DESCENDING).limit(50).get().get();
        List<Map<String, Object>> events = new ArrayList<>();
        for (QueryDocumentSnapshot d : snap) {
            Map<String, Object> m = d.getData();
            m.put("id", d.getId());
            events.add(m);
        }
        return ResponseEntity.ok(Map.of("vehicleId", id, "events", events));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Map<String, Object>> createVehicle(@RequestBody Map<String, Object> body) throws Exception {
        DocumentReference ref = db.collection("vehicles").document();
        body.put("createdAt", new Date());
        ref.set(body).get();
        if (telemetry != null) telemetry.addOrInitVehicle(ref.getId(), body);
        appendHistory(ref.getId(), "created", body);
        return ResponseEntity.status(201).body(withId(ref.getId(), body));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateVehicle(@PathVariable String id, @RequestBody Map<String, Object> update) throws Exception {
        db.collection("vehicles").document(id).set(update, SetOptions.merge()).get();
        appendHistory(id, "updated", update);
        return ResponseEntity.ok(withId(id, update));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteVehicle(@PathVariable String id) throws Exception {
        db.collection("vehicles").document(id).delete().get();
        if (telemetry != null) telemetry.removeVehicle(id);
        appendHistory(id, "deleted", Map.of());
        return ResponseEntity.ok(Map.of("message", "Vehicle deleted successfully"));
    }

    @GetMapping("/{id}/telemetry")
    public ResponseEntity<Map<String, Object>> getVehicleTelemetry(@PathVariable String id) {
        Map<String, Object> t = telemetry != null ? telemetry.getTelemetry(id) : null;
        if (t == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(t);
    }

    @GetMapping("/telemetry/all")
    public ResponseEntity<List<Map<String, Object>>> getAllTelemetry() {
        return ResponseEntity.ok(telemetry != null ? telemetry.getAllTelemetry() : List.of());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(@PathVariable String id, @RequestBody Map<String, Object> body) {
        String status = Objects.toString(body.get("status"), "available");
        if (telemetry != null) telemetry.updateStatus(id, status);
        return ResponseEntity.ok(Map.of("id", id, "status", status));
    }

    @PostMapping("/{id}/driver")
    public ResponseEntity<Map<String, Object>> assignDriver(@PathVariable String id, @RequestBody Map<String, Object> body) throws Exception {
        String driverName = Objects.toString(body.get("driverName"), null);
        db.collection("vehicles").document(id).set(Map.of("currentDriver", driverName), SetOptions.merge()).get();
        appendHistory(id, "driver_assigned", Map.of("driverName", driverName));
        return ResponseEntity.ok(Map.of("id", id, "driverName", driverName));
    }

    @DeleteMapping("/{id}/driver")
    public ResponseEntity<Map<String, Object>> removeDriver(@PathVariable String id) throws Exception {
        db.collection("vehicles").document(id).set(Map.of("currentDriver", null), SetOptions.merge()).get();
        appendHistory(id, "driver_removed", Map.of());
        return ResponseEntity.ok(Map.of("id", id, "message", "Driver removed successfully"));
    }

    private void appendHistory(String id, String type, Map<String, Object> details) throws Exception {
        db.collection("vehicles").document(id).collection("history").add(Map.of(
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
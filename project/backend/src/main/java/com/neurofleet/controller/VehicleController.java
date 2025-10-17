package com.neurofleet.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.neurofleet.service.TelemetryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/vehicles")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3002", "http://127.0.0.1:3000"}, allowCredentials = "true")
public class VehicleController {

    private final Firestore db;
    private final TelemetryService telemetry;
    private final ObjectMapper mapper = new ObjectMapper();

    public VehicleController(Firestore db, @org.springframework.beans.factory.annotation.Autowired(required = false) TelemetryService telemetry) {
        this.db = db;
        this.telemetry = telemetry;
    }

    @GetMapping("/telemetry/all")
    public ResponseEntity<List<Map<String, Object>>> getAllTelemetry() {
        // For development, allow unauthenticated access
        return ResponseEntity.ok(telemetry != null ? telemetry.getAllTelemetry() : List.of());
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getVehicles(
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String type,
        @RequestParam(required = false) Double latitude,
        @RequestParam(required = false) Double longitude
    ) throws Exception {
        try {
            // For development, allow unauthenticated access
            if (db == null) {
                // Return mock data for development while still seeding telemetry so downstream metrics stay functional
                List<Map<String, Object>> devVehicles = List.of(
                    Map.of("id", "dev-vehicle-1", "make", "Tesla", "model", "Model 3", "licensePlate", "DEV-001", "status", "available", "latitude", 28.6139, "longitude", 77.2090, "speed", 35, "batteryLevel", 85),
                    Map.of("id", "dev-vehicle-2", "make", "BMW", "model", "i3", "licensePlate", "DEV-002", "status", "on-trip", "latitude", 28.6239, "longitude", 77.2190, "speed", 45, "batteryLevel", 65),
                    Map.of("id", "dev-vehicle-3", "make", "Nissan", "model", "Leaf", "licensePlate", "DEV-003", "status", "available", "latitude", 28.6339, "longitude", 77.2290, "speed", 25, "batteryLevel", 45),
                    Map.of("id", "dev-vehicle-4", "make", "Hyundai", "model", "Kona", "licensePlate", "DEV-004", "status", "charging", "latitude", 28.6439, "longitude", 77.2390, "speed", 0, "batteryLevel", 30),
                    Map.of("id", "dev-vehicle-5", "make", "Tata", "model", "Nexon", "licensePlate", "DEV-005", "status", "available", "latitude", 28.6539, "longitude", 77.2490, "speed", 0, "batteryLevel", 90)
                );
                
                // Filter by status and type if provided
                List<Map<String, Object>> filteredVehicles = devVehicles.stream()
                    .filter(v -> status == null || status.equals(v.get("status")))
                    .filter(v -> type == null || type.equals(v.get("type")))
                    .collect(Collectors.toList());
                
                // Sort by proximity if latitude and longitude are provided
                if (latitude != null && longitude != null) {
                    filteredVehicles.sort((v1, v2) -> {
                        double distance1 = calculateDistance(latitude, longitude, 
                            ((Number) v1.get("latitude")).doubleValue(), 
                            ((Number) v1.get("longitude")).doubleValue());
                        double distance2 = calculateDistance(latitude, longitude, 
                            ((Number) v2.get("latitude")).doubleValue(), 
                            ((Number) v2.get("longitude")).doubleValue());
                        return Double.compare(distance1, distance2);
                    });
                }
                
                if (telemetry != null) {
                    for (Map<String, Object> vehicle : filteredVehicles) {
                        Object idObj = vehicle.get("id");
                        if (idObj != null) {
                            telemetry.addOrInitVehicle(idObj.toString(), vehicle);
                        }
                    }
                }
                return ResponseEntity.ok(filteredVehicles);
            }

            System.out.println("Fetching vehicles with filters - status: " + status + ", type: " + type + ", lat: " + latitude + ", lng: " + longitude);
            CollectionReference vehiclesRef = db.collection("vehicles");
            Query query = vehiclesRef;
            
            // Apply filters if provided
            if (status != null && !status.isEmpty()) {
                query = query.whereEqualTo("status", status);
                System.out.println("Applying status filter: " + status);
            }
            
            if (type != null && !type.isEmpty()) {
                query = query.whereEqualTo("type", type);
                System.out.println("Applying type filter: " + type);
            }
            
            ApiFuture<QuerySnapshot> future = query.get();
            List<QueryDocumentSnapshot> docs = future.get().getDocuments();
            System.out.println("Found " + docs.size() + " vehicles in database");
            List<Map<String, Object>> list = new ArrayList<>();
            for (QueryDocumentSnapshot d : docs) {
                Map<String, Object> m = d.getData();
                m.put("id", d.getId());
                System.out.println("Adding vehicle: " + m);
                list.add(m);
                if (telemetry != null) telemetry.addOrInitVehicle(d.getId(), m);
            }
            System.out.println("Returning " + list.size() + " vehicles");
            
            // If no vehicles found and no filters applied, return some default vehicles
            if (list.isEmpty() && status == null && type == null) {
                System.out.println("No vehicles found and no filters applied, returning default vehicles");
                list = getDefaultVehicles();
            }
            
            // Sort by proximity if latitude and longitude are provided
            if (latitude != null && longitude != null) {
                System.out.println("Sorting vehicles by proximity to lat: " + latitude + ", lng: " + longitude);
                list.sort((v1, v2) -> {
                    Object lat1Obj = v1.get("latitude");
                    Object lon1Obj = v1.get("longitude");
                    Object lat2Obj = v2.get("latitude");
                    Object lon2Obj = v2.get("longitude");
                    
                    if (lat1Obj instanceof Number && lon1Obj instanceof Number && 
                        lat2Obj instanceof Number && lon2Obj instanceof Number) {
                        double distance1 = calculateDistance(latitude, longitude, 
                            ((Number) lat1Obj).doubleValue(), 
                            ((Number) lon1Obj).doubleValue());
                        double distance2 = calculateDistance(latitude, longitude, 
                            ((Number) lat2Obj).doubleValue(), 
                            ((Number) lon2Obj).doubleValue());
                        System.out.println("Vehicle " + v1.get("licensePlate") + " distance: " + distance1 + " km");
                        System.out.println("Vehicle " + v2.get("licensePlate") + " distance: " + distance2 + " km");
                        return Double.compare(distance1, distance2);
                    }
                    return 0;
                });
            }
            
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            // Return mock data if there's an error
            List<Map<String, Object>> mockVehicles = List.of(
                Map.of("id", "mock-vehicle-1", "make", "Tesla", "model", "Model 3", "licensePlate", "MOCK-001", "status", "available", "latitude", 28.6139, "longitude", 77.2090, "speed", 35, "batteryLevel", 85),
                Map.of("id", "mock-vehicle-2", "make", "BMW", "model", "i3", "licensePlate", "MOCK-002", "status", "on-trip", "latitude", 28.6239, "longitude", 77.2190, "speed", 45, "batteryLevel", 65),
                Map.of("id", "mock-vehicle-3", "make", "Nissan", "model", "Leaf", "licensePlate", "MOCK-003", "status", "available", "latitude", 28.6339, "longitude", 77.2290, "speed", 25, "batteryLevel", 45),
                Map.of("id", "mock-vehicle-4", "make", "Hyundai", "model", "Kona", "licensePlate", "MOCK-004", "status", "charging", "latitude", 28.6439, "longitude", 77.2390, "speed", 0, "batteryLevel", 30),
                Map.of("id", "mock-vehicle-5", "make", "Tata", "model", "Nexon", "licensePlate", "MOCK-005", "status", "available", "latitude", 28.6539, "longitude", 77.2490, "speed", 0, "batteryLevel", 90)
            );
            return ResponseEntity.ok(mockVehicles);
        }
    }
    
    // Helper method to calculate distance between two points (Haversine formula)
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of the earth in km
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    }
    
    // Helper method to provide default vehicles when database is empty
    private List<Map<String, Object>> getDefaultVehicles() {
        List<Map<String, Object>> defaultVehicles = new ArrayList<>();
        
        // Add some default vehicles with realistic dispersed locations around Delhi/NCR
        defaultVehicles.add(createDefaultVehicle("Tesla", "Model 3", "EV-001", "ev", "available", 28.6139, 77.2090, 75.0, 400.0));
        defaultVehicles.add(createDefaultVehicle("BMW", "i3", "EV-002", "ev", "available", 28.6239, 77.2190, 60.0, 300.0));
        defaultVehicles.add(createDefaultVehicle("Nissan", "Leaf", "EV-003", "ev", "charging", 28.6339, 77.2290, 40.0, 240.0));
        defaultVehicles.add(createDefaultVehicle("Hyundai", "Kona", "EV-004", "ev", "on-trip", 28.6439, 77.2390, 64.0, 415.0));
        defaultVehicles.add(createDefaultVehicle("Tata", "Nexon", "EV-005", "ev", "available", 28.6539, 77.2490, 55.0, 350.0));
        defaultVehicles.add(createDefaultVehicle("Mahindra", "e2o", "EV-006", "ev", "available", 28.6039, 77.1990, 45.0, 200.0));
        defaultVehicles.add(createDefaultVehicle("MG", "ZS EV", "EV-007", "ev", "charging", 28.5939, 77.1890, 70.0, 420.0));
        defaultVehicles.add(createDefaultVehicle("Renault", "Twizy", "EV-008", "ev", "on-trip", 28.5839, 77.1790, 30.0, 150.0));
        
        return defaultVehicles;
    }
    
    // Helper method to create a default vehicle
    private Map<String, Object> createDefaultVehicle(String make, String model, String licensePlate, String type, String status, 
                                            double latitude, double longitude, double batteryCapacity, double range) {
        Map<String, Object> vehicle = new HashMap<>();
        vehicle.put("make", make);
        vehicle.put("model", model);
        vehicle.put("licensePlate", licensePlate);
        vehicle.put("type", type);
        vehicle.put("status", status);
        vehicle.put("latitude", latitude);
        vehicle.put("longitude", longitude);
        vehicle.put("batteryCapacity", batteryCapacity);
        vehicle.put("batteryLevel", 20 + Math.random() * 70); // Random battery level between 20-90%
        vehicle.put("range", range);
        vehicle.put("id", "default-" + System.currentTimeMillis() + "-" + licensePlate.toLowerCase().replace("-", ""));
        // Add additional fields for completeness
        vehicle.put("createdAt", new Date());
        vehicle.put("speed", status.equals("on-trip") ? 20 + Math.random() * 40 : 0); // Random speed if on trip
        return vehicle;
    }

    @GetMapping("/status-distribution")
    public ResponseEntity<Map<String, Object>> getVehicleStatusDistribution() {
        try {
            ResponseEntity<List<Map<String, Object>>> vehiclesResponse = getVehiclesInternal(null, null, null, null);
            if (!vehiclesResponse.getStatusCode().is2xxSuccessful()) {
                return ResponseEntity.status(vehiclesResponse.getStatusCode()).build();
            }

            List<Map<String, Object>> vehicles = vehiclesResponse.getBody();
            if (vehicles == null) {
                return ResponseEntity.ok(Map.of(
                    "totalVehicles", 0,
                    "activeTrips", 0,
                    "availableVehicles", 0,
                    "chargingVehicles", 0
                ));
            }

            Map<String, Long> statusCounts = vehicles.stream()
                    .map(v -> Objects.toString(v.getOrDefault("status", "unknown")))
                    .collect(Collectors.groupingBy(s -> s, Collectors.counting()));

            long onTrip = statusCounts.getOrDefault("on-trip", 0L);
            long charging = statusCounts.getOrDefault("charging", 0L);
            long available = statusCounts.getOrDefault("available", 0L);

            Map<String, Object> payload = new HashMap<>();
            payload.put("totalVehicles", vehicles.size());
            payload.put("activeTrips", onTrip);
            payload.put("availableVehicles", available);
            payload.put("chargingVehicles", charging);
            payload.put("statusBreakdown", statusCounts);

            return ResponseEntity.ok(payload);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get vehicle status distribution"));
        }
    }
    
    // Private helper method to get vehicles without authentication for internal use
    private ResponseEntity<List<Map<String, Object>>> getVehiclesInternal(
        String status,
        String type,
        Double latitude,
        Double longitude
    ) {
        try {
            // For development, allow unauthenticated access
            if (db == null) {
                // Return mock data for development while still seeding telemetry so downstream metrics stay functional
                List<Map<String, Object>> devVehicles = List.of(
                    Map.of("id", "dev-vehicle-1", "make", "Tesla", "model", "Model 3", "licensePlate", "DEV-001", "status", "available", "latitude", 28.6139, "longitude", 77.2090, "speed", 35, "batteryLevel", 85),
                    Map.of("id", "dev-vehicle-2", "make", "BMW", "model", "i3", "licensePlate", "DEV-002", "status", "on-trip", "latitude", 28.6239, "longitude", 77.2190, "speed", 45, "batteryLevel", 65),
                    Map.of("id", "dev-vehicle-3", "make", "Nissan", "model", "Leaf", "licensePlate", "DEV-003", "status", "available", "latitude", 28.6339, "longitude", 77.2290, "speed", 25, "batteryLevel", 45),
                    Map.of("id", "dev-vehicle-4", "make", "Hyundai", "model", "Kona", "licensePlate", "DEV-004", "status", "charging", "latitude", 28.6439, "longitude", 77.2390, "speed", 0, "batteryLevel", 30),
                    Map.of("id", "dev-vehicle-5", "make", "Tata", "model", "Nexon", "licensePlate", "DEV-005", "status", "available", "latitude", 28.6539, "longitude", 77.2490, "speed", 0, "batteryLevel", 90)
                );
                
                // Filter by status and type if provided
                List<Map<String, Object>> filteredVehicles = devVehicles.stream()
                    .filter(v -> status == null || status.equals(v.get("status")))
                    .filter(v -> type == null || type.equals(v.get("type")))
                    .collect(Collectors.toList());
                
                // Sort by proximity if latitude and longitude are provided
                if (latitude != null && longitude != null) {
                    filteredVehicles.sort((v1, v2) -> {
                        double distance1 = calculateDistance(latitude, longitude, 
                            ((Number) v1.get("latitude")).doubleValue(), 
                            ((Number) v1.get("longitude")).doubleValue());
                        double distance2 = calculateDistance(latitude, longitude, 
                            ((Number) v2.get("latitude")).doubleValue(), 
                            ((Number) v2.get("longitude")).doubleValue());
                        return Double.compare(distance1, distance2);
                    });
                }
                
                if (telemetry != null) {
                    for (Map<String, Object> vehicle : filteredVehicles) {
                        Object idObj = vehicle.get("id");
                        if (idObj != null) {
                            telemetry.addOrInitVehicle(idObj.toString(), vehicle);
                        }
                    }
                }
                return ResponseEntity.ok(filteredVehicles);
            }

            CollectionReference vehiclesRef = db.collection("vehicles");
            Query query = vehiclesRef;
            
            // Apply filters if provided
            if (status != null && !status.isEmpty()) {
                query = query.whereEqualTo("status", status);
            }
            
            if (type != null && !type.isEmpty()) {
                query = query.whereEqualTo("type", type);
            }
            
            ApiFuture<QuerySnapshot> future = query.get();
            List<QueryDocumentSnapshot> docs = future.get().getDocuments();
            List<Map<String, Object>> list = new ArrayList<>();
            for (QueryDocumentSnapshot d : docs) {
                Map<String, Object> m = d.getData();
                m.put("id", d.getId());
                list.add(m);
                if (telemetry != null) telemetry.addOrInitVehicle(d.getId(), m);
            }
            
            // Sort by proximity if latitude and longitude are provided
            if (latitude != null && longitude != null) {
                list.sort((v1, v2) -> {
                    Object lat1Obj = v1.get("latitude");
                    Object lon1Obj = v1.get("longitude");
                    Object lat2Obj = v2.get("latitude");
                    Object lon2Obj = v2.get("longitude");
                    
                    if (lat1Obj instanceof Number && lon1Obj instanceof Number && 
                        lat2Obj instanceof Number && lon2Obj instanceof Number) {
                        double distance1 = calculateDistance(latitude, longitude, 
                            ((Number) lat1Obj).doubleValue(), 
                            ((Number) lon1Obj).doubleValue());
                        double distance2 = calculateDistance(latitude, longitude, 
                            ((Number) lat2Obj).doubleValue(), 
                            ((Number) lon2Obj).doubleValue());
                        return Double.compare(distance1, distance2);
                    }
                    return 0;
                });
            }
            
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            // Return mock data if there's an error
            List<Map<String, Object>> mockVehicles = List.of(
                Map.of("id", "mock-vehicle-1", "make", "Tesla", "model", "Model 3", "licensePlate", "MOCK-001", "status", "available", "latitude", 28.6139, "longitude", 77.2090, "speed", 35, "batteryLevel", 85),
                Map.of("id", "mock-vehicle-2", "make", "BMW", "model", "i3", "licensePlate", "MOCK-002", "status", "on-trip", "latitude", 28.6239, "longitude", 77.2190, "speed", 45, "batteryLevel", 65),
                Map.of("id", "mock-vehicle-3", "make", "Nissan", "model", "Leaf", "licensePlate", "MOCK-003", "status", "available", "latitude", 28.6339, "longitude", 77.2290, "speed", 25, "batteryLevel", 45),
                Map.of("id", "mock-vehicle-4", "make", "Hyundai", "model", "Kona", "licensePlate", "MOCK-004", "status", "charging", "latitude", 28.6439, "longitude", 77.2390, "speed", 0, "batteryLevel", 30),
                Map.of("id", "mock-vehicle-5", "make", "Tata", "model", "Nexon", "licensePlate", "MOCK-005", "status", "available", "latitude", 28.6539, "longitude", 77.2490, "speed", 0, "batteryLevel", 90)
            );
            return ResponseEntity.ok(mockVehicles);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getVehicle(@PathVariable String id) throws Exception {
        if (db == null) {
            // Return mock data for development
            return ResponseEntity.ok(Map.of(
                "id", id,
                "make", "Tesla",
                "model", "Model 3",
                "licensePlate", "DEV-001",
                "status", "available",
                "latitude", 28.4595,
                "longitude", 77.0266,
                "speed", 35
            ));
        }
        
        DocumentSnapshot doc = db.collection("vehicles").document(id).get().get();
        if (!doc.exists()) return ResponseEntity.notFound().build();
        Map<String, Object> m = doc.getData();
        m.put("id", doc.getId());
        return ResponseEntity.ok(m);
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<Map<String, Object>> getVehicleHistory(@PathVariable String id) throws Exception {
        if (db == null) {
            // Return mock data for development
            List<Map<String, Object>> mockEvents = List.of(
                Map.of("eventType", "created", "details", Map.of(), "timestamp", new Date()),
                Map.of("eventType", "status_update", "details", Map.of("status", "on-trip"), "timestamp", new Date())
            );
            return ResponseEntity.ok(Map.of("vehicleId", id, "events", mockEvents));
        }
        
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

    // Remove role-based access restrictions - allow all users to create vehicles
    @PostMapping
    public ResponseEntity<Map<String, Object>> createVehicle(@RequestBody Map<String, Object> body) throws Exception {
        if (db == null) {
            // Return mock data for development
            String mockId = "mock-" + System.currentTimeMillis();
            Map<String, Object> response = new HashMap<>(body);
            response.put("id", mockId);
            response.put("createdAt", new Date());
            return ResponseEntity.status(201).body(response);
        }
        
        DocumentReference ref = db.collection("vehicles").document();
        body.put("createdAt", new Date());
        ref.set(body).get();
        if (telemetry != null) telemetry.addOrInitVehicle(ref.getId(), body);
        appendHistory(ref.getId(), "created", body);
        return ResponseEntity.status(201).body(withId(ref.getId(), body));
    }

    // Remove role-based access restrictions - allow all users to update vehicles
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateVehicle(@PathVariable String id, @RequestBody Map<String, Object> update) throws Exception {
        if (db == null) {
            // Return mock data for development
            Map<String, Object> response = new HashMap<>(update);
            response.put("id", id);
            return ResponseEntity.ok(response);
        }
        
        db.collection("vehicles").document(id).set(update, SetOptions.merge()).get();
        appendHistory(id, "updated", update);
        return ResponseEntity.ok(withId(id, update));
    }

    // Remove role-based access restrictions - allow all users to delete vehicles
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteVehicle(@PathVariable String id) throws Exception {
        if (db == null) {
            // Return mock data for development
            return ResponseEntity.ok(Map.of("message", "Vehicle deleted successfully (mock)"));
        }
        
        db.collection("vehicles").document(id).delete().get();
        if (telemetry != null) telemetry.removeVehicle(id);
        appendHistory(id, "deleted", Map.of());
        return ResponseEntity.ok(Map.of("message", "Vehicle deleted successfully"));
    }

    @GetMapping("/{id}/telemetry")
    public ResponseEntity<Map<String, Object>> getVehicleTelemetry(@PathVariable String id) {
        Map<String, Object> t = telemetry != null ? telemetry.getTelemetry(id) : null;
        if (t == null) {
            // Return mock data if telemetry not found
            return ResponseEntity.ok(Map.of(
                "id", id,
                "batteryLevel", 85,
                "range", 320,
                "temperature", 22,
                "lastUpdate", new Date()
            ));
        }
        return ResponseEntity.ok(t);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(@PathVariable String id, @RequestBody Map<String, Object> body) {
        String status = Objects.toString(body.get("status"), "available");
        if (telemetry != null) telemetry.updateStatus(id, status);
        return ResponseEntity.ok(Map.of("id", id, "status", status));
    }

    @PostMapping("/{id}/driver")
    public ResponseEntity<Map<String, Object>> assignDriver(@PathVariable String id, @RequestBody Map<String, Object> body, Authentication authentication) throws Exception {
        if (db == null) {
            return ResponseEntity.status(503).body(Map.of(
                    "message", "Driver assignment not available in development mode"
            ));
        }

        String currentUid = authentication != null ? authentication.getName() : null;
        String driverUid = Objects.toString(body.get("driverUid"), currentUid);
        String driverName = Objects.toString(body.get("driverName"), null);
        String driverEmail = Objects.toString(body.get("driverEmail"), null);

        Map<String, Object> payload = new HashMap<>();
        payload.put("currentDriver", driverUid);
        if (driverName != null) {
            payload.put("currentDriverName", driverName);
        }
        if (driverEmail != null) {
            payload.put("currentDriverEmail", driverEmail);
        }

        db.collection("vehicles").document(id).set(payload, SetOptions.merge()).get();
        appendHistory(id, "driver_assigned", Map.of(
                "driverUid", driverUid,
                "driverName", driverName,
                "driverEmail", driverEmail
        ));

        Map<String, Object> response = new HashMap<>();
        response.put("id", id);
        response.putAll(payload);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}/driver")
    public ResponseEntity<Map<String, Object>> removeDriver(@PathVariable String id) throws Exception {
        if (db == null) {
            return ResponseEntity.status(503).body(Map.of(
                    "message", "Driver removal not available in development mode"
            ));
        }

        db.collection("vehicles").document(id).set(Map.of(
                "currentDriver", null,
                "currentDriverName", null,
                "currentDriverEmail", null
        ), SetOptions.merge()).get();
        appendHistory(id, "driver_removed", Map.of());
        return ResponseEntity.ok(Map.of("id", id, "message", "Driver removed successfully"));
    }

    private void appendHistory(String id, String type, Map<String, Object> details) throws Exception {
        if (db != null) {
            db.collection("vehicles").document(id).collection("history").add(Map.of(
                    "eventType", type,
                    "details", details,
                    "timestamp", new Date()
            )).get();
        }
    }

    private Map<String, Object> withId(String id, Map<String, Object> body) {
        Map<String, Object> m = new HashMap<>(body);
        m.put("id", id);
        return m;
    }
}
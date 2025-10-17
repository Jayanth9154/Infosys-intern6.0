package com.neurofleet.util;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.CollectionReference;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.WriteResult;
import com.google.cloud.firestore.QuerySnapshot;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ExecutionException;

@Component
public class VehicleSeeder implements CommandLineRunner {

    private final Firestore db;

    public VehicleSeeder(Firestore db) {
        this.db = db;
    }

    @Override
    public void run(String... args) throws Exception {
        // Check if we're in development mode and database is available
        if (db != null) {
            seedVehicles();
        }
    }

    private void seedVehicles() throws ExecutionException, InterruptedException {
        CollectionReference vehiclesRef = db.collection("vehicles");
        
        // Check if vehicles already exist
        ApiFuture<QuerySnapshot> future = vehiclesRef.limit(1).get();
        try {
            if (!future.get().isEmpty()) {
                System.out.println("Vehicles already exist in database. Skipping seed.");
                return;
            }
        } catch (Exception e) {
            System.out.println("Error checking for existing vehicles: " + e.getMessage());
            return;
        }
        
        System.out.println("Seeding database with sample vehicles...");
        
        // Sample vehicles data
        List<Map<String, Object>> sampleVehicles = Arrays.asList(
            createVehicle("Tesla", "Model 3", "EV-001", "ev", "available", 28.6139, 77.2090, 75.0, 400.0),
            createVehicle("BMW", "i3", "EV-002", "ev", "available", 28.6239, 77.2190, 60.0, 300.0),
            createVehicle("Nissan", "Leaf", "EV-003", "ev", "charging", 28.6339, 77.2290, 40.0, 240.0),
            createVehicle("Hyundai", "Kona", "EV-004", "ev", "on-trip", 28.6439, 77.2390, 64.0, 415.0),
            createVehicle("Chevrolet", "Bolt", "EV-005", "ev", "available", 28.6539, 77.2490, 66.0, 420.0),
            createVehicle("Toyota", "Prius", "HY-001", "hybrid", "available", 28.6639, 77.2590, 50.0, 350.0),
            createVehicle("Ford", "Mustang Mach-E", "EV-006", "ev", "available", 28.6739, 77.2690, 88.0, 480.0)
        );
        
        // Add vehicles to database
        for (Map<String, Object> vehicle : sampleVehicles) {
            try {
                ApiFuture<WriteResult> result = vehiclesRef.document().set(vehicle);
                result.get(); // Wait for operation to complete
            } catch (Exception e) {
                System.out.println("Error adding vehicle: " + e.getMessage());
            }
        }
        
        System.out.println("Successfully seeded " + sampleVehicles.size() + " vehicles into the database.");
    }
    
    private Map<String, Object> createVehicle(String make, String model, String licensePlate, String type, String status, 
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
        vehicle.put("range", range);
        vehicle.put("createdAt", new Date());
        return vehicle;
    }
}
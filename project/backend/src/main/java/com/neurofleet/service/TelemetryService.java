package com.neurofleet.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neurofleet.websocket.RawWebSocketHandler;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@EnableScheduling
public class TelemetryService {

    private final Map<String, Map<String, Object>> vehicles = new ConcurrentHashMap<>();
    private final RawWebSocketHandler broadcaster;
    private final ObjectMapper mapper = new ObjectMapper();

    public TelemetryService(RawWebSocketHandler broadcaster) {
        this.broadcaster = broadcaster;
        // Lazy init; load from Firestore via VehicleService if needed.
    }

    public void addOrInitVehicle(String id, Map<String, Object> base) {
        Map<String, Object> v = new HashMap<>(base);
        v.putIfAbsent("id", id);
        v.putIfAbsent("status", "available");
        v.putIfAbsent("batteryLevel", new Random().nextInt(100));
        v.putIfAbsent("range", 100 + new Random().nextInt(200));
        v.putIfAbsent("batteryHealth", 70 + new Random().nextInt(30));
        
        // Use Gurugram coordinates as default instead of Delhi
        // Also ensure any existing vehicles with Delhi coordinates are updated to Gurugram
        Object latObj = v.get("latitude");
        Object lngObj = v.get("longitude");
        
        // If coordinates are Delhi coordinates, update them to Gurugram
        if (latObj instanceof Number && lngObj instanceof Number) {
            double lat = ((Number) latObj).doubleValue();
            double lng = ((Number) lngObj).doubleValue();
            
            // Check if coordinates are close to Delhi (28.6139, 77.2090)
            if (Math.abs(lat - 28.6139) < 0.01 && Math.abs(lng - 77.2090) < 0.01) {
                v.put("latitude", 28.4595 + (Math.random() * 0.1 - 0.05));
                v.put("longitude", 77.0266 + (Math.random() * 0.1 - 0.05));
            }
        } else {
            // If no valid coordinates, set Gurugram coordinates
            v.putIfAbsent("latitude", 28.4595 + (Math.random() * 0.1 - 0.05));
            v.putIfAbsent("longitude", 77.0266 + (Math.random() * 0.1 - 0.05));
        }
        
        // Ensure we always have valid coordinates
        if (!(v.get("latitude") instanceof Number)) {
            v.put("latitude", 28.4595 + (Math.random() * 0.1 - 0.05));
        }
        if (!(v.get("longitude") instanceof Number)) {
            v.put("longitude", 77.0266 + (Math.random() * 0.1 - 0.05));
        }
        
        // Add some default values for route optimization
        v.putIfAbsent("speed", 30 + new Random().nextInt(40)); // km/h
        
        vehicles.put(id, v);
        System.out.println("Added vehicle with ID: " + id + " and data: " + v);
    }

    public void removeVehicle(String id) {
        vehicles.remove(id);
    }

    public Map<String, Object> getTelemetry(String id) {
        return vehicles.get(id);
    }

    public List<Map<String, Object>> getAllTelemetry() {
        return new ArrayList<>(vehicles.values());
    }

    public void updateStatus(String id, String status) {
        Map<String, Object> v = vehicles.get(id);
        if (v != null) v.put("status", status);
    }

    @Scheduled(fixedDelay = 5000)
    public void tick() throws JsonProcessingException {
        for (Map.Entry<String, Map<String, Object>> e : vehicles.entrySet()) {
            Map<String, Object> v = e.getValue();
            String status = (String) v.getOrDefault("status", "available");
            double battery = ((Number) v.getOrDefault("batteryLevel", 50)).doubleValue();
            double range = ((Number) v.getOrDefault("range", 200)).doubleValue();
            double latitude = ((Number) v.getOrDefault("latitude", 28.4595)).doubleValue();
            double longitude = ((Number) v.getOrDefault("longitude", 77.0266)).doubleValue();
            double speed = ((Number) v.getOrDefault("speed", 30)).doubleValue();

            if ("on-trip".equals(status)) {
                battery = Math.max(0, battery - 0.5);
                range = Math.max(0, range - 1.5);
                
                // Move vehicle in a random direction when on trip
                double latChange = (Math.random() - 0.5) * 0.001;
                double lngChange = (Math.random() - 0.5) * 0.001;
                latitude += latChange;
                longitude += lngChange;
                
                // Update speed randomly
                speed = 20 + Math.random() * 50;
            } else if ("charging".equals(status)) {
                battery = Math.min(100, battery + 0.7);
                range = Math.min(500, battery * 3);
                if (battery >= 99) v.put("status", "available");
                
                // Slightly move vehicle while charging
                double latChange = (Math.random() - 0.5) * 0.0001;
                double lngChange = (Math.random() - 0.5) * 0.0001;
                latitude += latChange;
                longitude += lngChange;
                
                speed = 0;
            } else {
                battery = Math.max(0, battery - 0.05);
                
                // Slightly move vehicle when available
                double latChange = (Math.random() - 0.5) * 0.0005;
                double lngChange = (Math.random() - 0.5) * 0.0005;
                latitude += latChange;
                longitude += lngChange;
                
                speed = 5 + Math.random() * 15;
            }

            v.put("batteryLevel", battery);
            v.put("range", (int) range);
            v.put("latitude", latitude);
            v.put("longitude", longitude);
            v.put("speed", speed);
            v.put("lastUpdate", Instant.now().toString());

            Map<String, Object> payload = new HashMap<>(v);
            payload.put("type", "vehicle_update");
            broadcaster.broadcast(mapper.writeValueAsString(payload));
        }
    }
}
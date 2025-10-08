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
        v.putIfAbsent("latitude", 28.6139 + (Math.random() * 0.2 - 0.1));
        v.putIfAbsent("longitude", 77.2090 + (Math.random() * 0.2 - 0.1));
        vehicles.put(id, v);
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

            if ("on-trip".equals(status)) {
                battery = Math.max(0, battery - 0.5);
                range = Math.max(0, range - 1.5);
            } else if ("charging".equals(status)) {
                battery = Math.min(100, battery + 0.7);
                range = Math.min(500, battery * 3);
                if (battery >= 99) v.put("status", "available");
            } else {
                battery = Math.max(0, battery - 0.05);
            }

            v.put("batteryLevel", battery);
            v.put("range", (int) range);
            v.put("lastUpdate", Instant.now().toString());

            Map<String, Object> payload = new HashMap<>(v);
            payload.put("type", "vehicle_update");
            broadcaster.broadcast(mapper.writeValueAsString(payload));
        }
    }
}
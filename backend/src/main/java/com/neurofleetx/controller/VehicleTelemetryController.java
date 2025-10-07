package com.neurofleetx.controller;

import com.neurofleetx.model.VehicleTelemetry;
import com.neurofleetx.service.VehicleTelemetryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/telemetry")
public class VehicleTelemetryController {
    
    @Autowired
    private VehicleTelemetryService telemetryService;

    @GetMapping("/latest")
    public ResponseEntity<List<VehicleTelemetry>> getLatestTelemetryForAllVehicles() {
        List<VehicleTelemetry> telemetryData = telemetryService.getLatestTelemetryForAllVehicles();
        return ResponseEntity.ok(telemetryData);
    }

    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<List<VehicleTelemetry>> getTelemetryByVehicleId(@PathVariable String vehicleId) {
        List<VehicleTelemetry> telemetryData = telemetryService.getTelemetryByVehicleId(vehicleId);
        return ResponseEntity.ok(telemetryData);
    }

    @GetMapping("/vehicle/{vehicleId}/latest")
    public ResponseEntity<VehicleTelemetry> getLatestTelemetryByVehicleId(@PathVariable String vehicleId) {
        return telemetryService.getLatestTelemetryByVehicleId(vehicleId)
                .map(telemetry -> ResponseEntity.ok(telemetry))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/recent")
    public ResponseEntity<List<VehicleTelemetry>> getRecentTelemetry(
            @RequestParam(defaultValue = "1") int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        List<VehicleTelemetry> telemetryData = telemetryService.getRecentTelemetry(since);
        return ResponseEntity.ok(telemetryData);
    }

    @GetMapping("/maintenance/stats")
    public ResponseEntity<Map<String, Long>> getMaintenanceStats() {
        Map<String, Long> stats = telemetryService.getMaintenanceStatusCounts();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getTelemetryDashboardStats() {
        List<VehicleTelemetry> latestTelemetry = telemetryService.getLatestTelemetryForAllVehicles();
        Map<String, Long> maintenanceStats = telemetryService.getMaintenanceStatusCounts();
        
        double avgSpeed = latestTelemetry.stream()
                .mapToDouble(VehicleTelemetry::getSpeed)
                .average()
                .orElse(0.0);
        
        double avgFuelLevel = latestTelemetry.stream()
                .mapToDouble(VehicleTelemetry::getFuelLevel)
                .average()
                .orElse(0.0);
        
        long activeVehicles = latestTelemetry.stream()
                .filter(t -> t.getSpeed() > 5)
                .count();
        
        Map<String, Object> stats = Map.of(
            "totalVehicles", latestTelemetry.size(),
            "activeVehicles", activeVehicles,
            "averageSpeed", Math.round(avgSpeed * 10.0) / 10.0,
            "averageFuelLevel", Math.round(avgFuelLevel * 10.0) / 10.0,
            "maintenanceStats", maintenanceStats
        );
        
        return ResponseEntity.ok(stats);
    }
}
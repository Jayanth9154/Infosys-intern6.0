package com.neurofleetx.service;

import com.neurofleetx.model.Vehicle;
import com.neurofleetx.model.VehicleTelemetry;
import com.neurofleetx.repository.VehicleRepository;
import com.neurofleetx.repository.VehicleTelemetryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class VehicleTelemetryService {
    
    @Autowired
    private VehicleTelemetryRepository telemetryRepository;
    
    @Autowired
    private VehicleRepository vehicleRepository;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    private final Random random = new Random();

    public List<VehicleTelemetry> getLatestTelemetryForAllVehicles() {
        return telemetryRepository.findLatestTelemetryForAllVehicles();
    }

    public List<VehicleTelemetry> getTelemetryByVehicleId(String vehicleId) {
        return telemetryRepository.findByVehicleIdOrderByTimestampDesc(vehicleId);
    }

    public Optional<VehicleTelemetry> getLatestTelemetryByVehicleId(String vehicleId) {
        return telemetryRepository.findLatestByVehicleId(vehicleId);
    }

    public List<VehicleTelemetry> getRecentTelemetry(LocalDateTime since) {
        return telemetryRepository.findRecentTelemetry(since);
    }

    public Map<String, Long> getMaintenanceStatusCounts() {
        return Map.of(
            "HEALTHY", telemetryRepository.countByMaintenanceStatus(VehicleTelemetry.MaintenanceStatus.HEALTHY),
            "DUE", telemetryRepository.countByMaintenanceStatus(VehicleTelemetry.MaintenanceStatus.DUE),
            "CRITICAL", telemetryRepository.countByMaintenanceStatus(VehicleTelemetry.MaintenanceStatus.CRITICAL)
        );
    }

    public VehicleTelemetry saveTelemetry(VehicleTelemetry telemetry) {
        VehicleTelemetry saved = telemetryRepository.save(telemetry);
        
        // Send real-time update via WebSocket
        messagingTemplate.convertAndSend("/topic/telemetry", saved);
        messagingTemplate.convertAndSend("/topic/telemetry/" + saved.getVehicleId(), saved);
        
        return saved;
    }

    @Scheduled(fixedRate = 5000) // Every 5 seconds
    public void simulateTelemetryData() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        
        for (Vehicle vehicle : vehicles) {
            VehicleTelemetry telemetry = generateSimulatedTelemetry(vehicle);
            saveTelemetry(telemetry);
            
            // Update vehicle location in the main vehicle entity
            vehicle.setLatitude(telemetry.getLatitude());
            vehicle.setLongitude(telemetry.getLongitude());
            vehicle.setSpeed(telemetry.getSpeed());
            vehicle.setBatteryLevel(telemetry.getBatteryLevel().intValue());
            vehicle.setFuelLevel(telemetry.getFuelLevel());
            vehicle.setLastUpdated(LocalDateTime.now());
            vehicleRepository.save(vehicle);
        }
    }

    private VehicleTelemetry generateSimulatedTelemetry(Vehicle vehicle) {
        // Get previous telemetry for realistic progression
        Optional<VehicleTelemetry> previousTelemetry = getLatestTelemetryByVehicleId(vehicle.getVehicleId());
        
        double baseLatitude = previousTelemetry.map(VehicleTelemetry::getLatitude).orElse(vehicle.getLatitude());
        double baseLongitude = previousTelemetry.map(VehicleTelemetry::getLongitude).orElse(vehicle.getLongitude());
        double baseMileage = previousTelemetry.map(VehicleTelemetry::getMileage).orElse(0.0);
        double baseFuelLevel = previousTelemetry.map(VehicleTelemetry::getFuelLevel).orElse(100.0);
        double baseBatteryLevel = previousTelemetry.map(VehicleTelemetry::getBatteryLevel).orElse(100.0);

        // Simulate movement (small random changes in position)
        double latitudeChange = (random.nextDouble() - 0.5) * 0.01; // ±0.005 degrees
        double longitudeChange = (random.nextDouble() - 0.5) * 0.01;
        double newLatitude = baseLatitude + latitudeChange;
        double newLongitude = baseLongitude + longitudeChange;

        // Simulate speed based on vehicle status
        double speed = 0.0;
        if (vehicle.getStatus() == Vehicle.VehicleStatus.EN_ROUTE) {
            speed = 20 + random.nextDouble() * 60; // 20-80 km/h
        } else if (vehicle.getStatus() == Vehicle.VehicleStatus.LOADING) {
            speed = random.nextDouble() * 5; // 0-5 km/h
        }

        // Simulate fuel consumption (decrease over time)
        double fuelLevel = Math.max(10.0, baseFuelLevel - (random.nextDouble() * 2));
        
        // Simulate battery level
        double batteryLevel;
        if (vehicle.getIsElectric()) {
            batteryLevel = Math.max(15.0, baseBatteryLevel - (random.nextDouble() * 3));
        } else {
            batteryLevel = 100.0; // Non-electric vehicles don't have battery tracking
        }

        // Simulate mileage increase
        double mileageIncrease = speed * (5.0 / 3600.0); // 5 seconds worth of distance
        double newMileage = baseMileage + mileageIncrease;

        // Determine maintenance status based on various factors
        VehicleTelemetry.MaintenanceStatus maintenanceStatus = determineMaintenanceStatus(
            fuelLevel, batteryLevel, newMileage, speed
        );

        VehicleTelemetry telemetry = new VehicleTelemetry(
            vehicle.getVehicleId(),
            speed,
            fuelLevel,
            batteryLevel,
            newMileage,
            newLatitude,
            newLongitude,
            maintenanceStatus
        );

        // Add additional sensor data
        telemetry.setEngineTemperature(80 + random.nextDouble() * 40); // 80-120°C
        telemetry.setTirePressure(30 + random.nextDouble() * 10); // 30-40 PSI

        // Generate alert messages for critical conditions
        if (maintenanceStatus == VehicleTelemetry.MaintenanceStatus.CRITICAL) {
            telemetry.setAlertMessage(generateCriticalAlert(fuelLevel, batteryLevel));
        } else if (maintenanceStatus == VehicleTelemetry.MaintenanceStatus.DUE) {
            telemetry.setAlertMessage("Scheduled maintenance due soon");
        }

        return telemetry;
    }

    private VehicleTelemetry.MaintenanceStatus determineMaintenanceStatus(
            double fuelLevel, double batteryLevel, double mileage, double speed) {
        
        // Critical conditions
        if (fuelLevel < 15 || batteryLevel < 20 || mileage > 50000) {
            return VehicleTelemetry.MaintenanceStatus.CRITICAL;
        }
        
        // Due for maintenance
        if (fuelLevel < 30 || batteryLevel < 40 || mileage > 30000 || random.nextDouble() < 0.1) {
            return VehicleTelemetry.MaintenanceStatus.DUE;
        }
        
        return VehicleTelemetry.MaintenanceStatus.HEALTHY;
    }

    private String generateCriticalAlert(double fuelLevel, double batteryLevel) {
        if (fuelLevel < 15) {
            return "Critical: Low fuel level - " + String.format("%.1f", fuelLevel) + "%";
        }
        if (batteryLevel < 20) {
            return "Critical: Low battery level - " + String.format("%.1f", batteryLevel) + "%";
        }
        return "Critical: Immediate maintenance required";
    }
}
package com.neurofleetx.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "vehicle_telemetry")
public class VehicleTelemetry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name = "vehicle_id")
    private String vehicleId;

    @NotNull
    private Double speed;

    @NotNull
    private Double fuelLevel;

    @NotNull
    private Double batteryLevel;

    @NotNull
    private Double mileage;

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;

    @NotNull
    private LocalDateTime timestamp;

    @Enumerated(EnumType.STRING)
    @Column(name = "maintenance_status")
    private MaintenanceStatus maintenanceStatus;

    private Double engineTemperature;
    private Double tirePressure;
    private String alertMessage;

    // Constructors
    public VehicleTelemetry() {
        this.timestamp = LocalDateTime.now();
    }

    public VehicleTelemetry(String vehicleId, Double speed, Double fuelLevel, Double batteryLevel,
                           Double mileage, Double latitude, Double longitude, MaintenanceStatus maintenanceStatus) {
        this.vehicleId = vehicleId;
        this.speed = speed;
        this.fuelLevel = fuelLevel;
        this.batteryLevel = batteryLevel;
        this.mileage = mileage;
        this.latitude = latitude;
        this.longitude = longitude;
        this.maintenanceStatus = maintenanceStatus;
        this.timestamp = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getVehicleId() { return vehicleId; }
    public void setVehicleId(String vehicleId) { this.vehicleId = vehicleId; }

    public Double getSpeed() { return speed; }
    public void setSpeed(Double speed) { this.speed = speed; }

    public Double getFuelLevel() { return fuelLevel; }
    public void setFuelLevel(Double fuelLevel) { this.fuelLevel = fuelLevel; }

    public Double getBatteryLevel() { return batteryLevel; }
    public void setBatteryLevel(Double batteryLevel) { this.batteryLevel = batteryLevel; }

    public Double getMileage() { return mileage; }
    public void setMileage(Double mileage) { this.mileage = mileage; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public MaintenanceStatus getMaintenanceStatus() { return maintenanceStatus; }
    public void setMaintenanceStatus(MaintenanceStatus maintenanceStatus) { this.maintenanceStatus = maintenanceStatus; }

    public Double getEngineTemperature() { return engineTemperature; }
    public void setEngineTemperature(Double engineTemperature) { this.engineTemperature = engineTemperature; }

    public Double getTirePressure() { return tirePressure; }
    public void setTirePressure(Double tirePressure) { this.tirePressure = tirePressure; }

    public String getAlertMessage() { return alertMessage; }
    public void setAlertMessage(String alertMessage) { this.alertMessage = alertMessage; }

    public enum MaintenanceStatus {
        HEALTHY, DUE, CRITICAL
    }
}
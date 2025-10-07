package com.neurofleetx.dto;

import com.neurofleetx.model.Vehicle;
import java.time.LocalDateTime;

public class VehicleResponse {
    private Long id;
    private String vehicleId;
    private String type;
    private String model;
    private Integer capacity;
    private String fuelType;
    private String licensePlate;
    private Integer year;
    private String manufacturer;
    private Double mileage;
    private String status;
    private Double latitude;
    private Double longitude;
    private String currentLocation;
    private String destination;
    private Integer batteryLevel;
    private Double speed;
    private String driverName;
    private Double fuelLevel;
    private Boolean isElectric;
    private String assignedDriverName;
    private Long assignedDriverId;
    private LocalDateTime lastServiceDate;
    private LocalDateTime nextServiceDate;
    private LocalDateTime lastUpdated;
    private LocalDateTime createdAt;

    // Constructor from Vehicle entity
    public VehicleResponse(Vehicle vehicle) {
        this.id = vehicle.getId();
        this.vehicleId = vehicle.getVehicleId();
        this.type = vehicle.getType();
        this.model = vehicle.getModel();
        this.capacity = vehicle.getCapacity();
        this.fuelType = vehicle.getFuelType();
        this.licensePlate = vehicle.getLicensePlate();
        this.year = vehicle.getYear();
        this.manufacturer = vehicle.getManufacturer();
        this.mileage = vehicle.getMileage();
        this.status = vehicle.getStatus().name();
        this.latitude = vehicle.getLatitude();
        this.longitude = vehicle.getLongitude();
        this.currentLocation = vehicle.getCurrentLocation();
        this.destination = vehicle.getDestination();
        this.batteryLevel = vehicle.getBatteryLevel();
        this.speed = vehicle.getSpeed();
        this.driverName = vehicle.getDriverName();
        this.fuelLevel = vehicle.getFuelLevel();
        this.isElectric = vehicle.getIsElectric();
        this.lastServiceDate = vehicle.getLastServiceDate();
        this.nextServiceDate = vehicle.getNextServiceDate();
        this.lastUpdated = vehicle.getLastUpdated();
        this.createdAt = vehicle.getCreatedAt();
        
        if (vehicle.getAssignedDriver() != null) {
            this.assignedDriverName = vehicle.getAssignedDriver().getFirstName() + " " + 
                                    vehicle.getAssignedDriver().getLastName();
            this.assignedDriverId = vehicle.getAssignedDriver().getId();
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getVehicleId() { return vehicleId; }
    public void setVehicleId(String vehicleId) { this.vehicleId = vehicleId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }

    public String getFuelType() { return fuelType; }
    public void setFuelType(String fuelType) { this.fuelType = fuelType; }

    public String getLicensePlate() { return licensePlate; }
    public void setLicensePlate(String licensePlate) { this.licensePlate = licensePlate; }

    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }

    public String getManufacturer() { return manufacturer; }
    public void setManufacturer(String manufacturer) { this.manufacturer = manufacturer; }

    public Double getMileage() { return mileage; }
    public void setMileage(Double mileage) { this.mileage = mileage; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getCurrentLocation() { return currentLocation; }
    public void setCurrentLocation(String currentLocation) { this.currentLocation = currentLocation; }

    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }

    public Integer getBatteryLevel() { return batteryLevel; }
    public void setBatteryLevel(Integer batteryLevel) { this.batteryLevel = batteryLevel; }

    public Double getSpeed() { return speed; }
    public void setSpeed(Double speed) { this.speed = speed; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    public Double getFuelLevel() { return fuelLevel; }
    public void setFuelLevel(Double fuelLevel) { this.fuelLevel = fuelLevel; }

    public Boolean getIsElectric() { return isElectric; }
    public void setIsElectric(Boolean isElectric) { this.isElectric = isElectric; }

    public String getAssignedDriverName() { return assignedDriverName; }
    public void setAssignedDriverName(String assignedDriverName) { this.assignedDriverName = assignedDriverName; }

    public Long getAssignedDriverId() { return assignedDriverId; }
    public void setAssignedDriverId(Long assignedDriverId) { this.assignedDriverId = assignedDriverId; }

    public LocalDateTime getLastServiceDate() { return lastServiceDate; }
    public void setLastServiceDate(LocalDateTime lastServiceDate) { this.lastServiceDate = lastServiceDate; }

    public LocalDateTime getNextServiceDate() { return nextServiceDate; }
    public void setNextServiceDate(LocalDateTime nextServiceDate) { this.nextServiceDate = nextServiceDate; }

    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
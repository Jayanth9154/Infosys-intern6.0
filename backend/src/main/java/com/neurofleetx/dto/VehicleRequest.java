package com.neurofleetx.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;

public class VehicleRequest {
    @NotBlank
    private String vehicleId;

    @NotBlank
    private String type;

    @NotBlank
    private String model;

    @NotNull
    @Min(1)
    private Integer capacity;

    @NotBlank
    private String fuelType;

    private String licensePlate;
    private Integer year;
    private String manufacturer;
    private Double mileage;

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;

    private String currentLocation;
    private String status;
    private Long assignedDriverId;

    // Constructors
    public VehicleRequest() {}

    public VehicleRequest(String vehicleId, String type, String model, Integer capacity, 
                         String fuelType, Double latitude, Double longitude) {
        this.vehicleId = vehicleId;
        this.type = type;
        this.model = model;
        this.capacity = capacity;
        this.fuelType = fuelType;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    // Getters and Setters
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

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getCurrentLocation() { return currentLocation; }
    public void setCurrentLocation(String currentLocation) { this.currentLocation = currentLocation; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getAssignedDriverId() { return assignedDriverId; }
    public void setAssignedDriverId(Long assignedDriverId) { this.assignedDriverId = assignedDriverId; }
}
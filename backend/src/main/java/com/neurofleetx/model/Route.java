package com.neurofleetx.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "routes")
public class Route {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String routeId;

    @NotBlank
    private String origin;

    @NotBlank
    private String destination;

    @NotNull
    private Double distance;

    @NotNull
    private Integer estimatedTime;

    @NotNull
    private Double fuelConsumption;

    private Double aiOptimizationSavings;
    private Integer timeSaved;
    private Double fuelSaved;

    @Enumerated(EnumType.STRING)
    private RouteStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    // Constructors
    public Route() {}

    public Route(String routeId, String origin, String destination, Double distance, 
                 Integer estimatedTime, Double fuelConsumption) {
        this.routeId = routeId;
        this.origin = origin;
        this.destination = destination;
        this.distance = distance;
        this.estimatedTime = estimatedTime;
        this.fuelConsumption = fuelConsumption;
        this.status = RouteStatus.PLANNED;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRouteId() { return routeId; }
    public void setRouteId(String routeId) { this.routeId = routeId; }

    public String getOrigin() { return origin; }
    public void setOrigin(String origin) { this.origin = origin; }

    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }

    public Double getDistance() { return distance; }
    public void setDistance(Double distance) { this.distance = distance; }

    public Integer getEstimatedTime() { return estimatedTime; }
    public void setEstimatedTime(Integer estimatedTime) { this.estimatedTime = estimatedTime; }

    public Double getFuelConsumption() { return fuelConsumption; }
    public void setFuelConsumption(Double fuelConsumption) { this.fuelConsumption = fuelConsumption; }

    public Double getAiOptimizationSavings() { return aiOptimizationSavings; }
    public void setAiOptimizationSavings(Double aiOptimizationSavings) { this.aiOptimizationSavings = aiOptimizationSavings; }

    public Integer getTimeSaved() { return timeSaved; }
    public void setTimeSaved(Integer timeSaved) { this.timeSaved = timeSaved; }

    public Double getFuelSaved() { return fuelSaved; }
    public void setFuelSaved(Double fuelSaved) { this.fuelSaved = fuelSaved; }

    public RouteStatus getStatus() { return status; }
    public void setStatus(RouteStatus status) { this.status = status; }

    public Vehicle getVehicle() { return vehicle; }
    public void setVehicle(Vehicle vehicle) { this.vehicle = vehicle; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public enum RouteStatus {
        PLANNED, ACTIVE, COMPLETED, CANCELLED
    }
}
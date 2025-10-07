package com.neurofleetx.repository;

import com.neurofleetx.model.VehicleTelemetry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleTelemetryRepository extends JpaRepository<VehicleTelemetry, Long> {
    
    @Query("SELECT t FROM VehicleTelemetry t WHERE t.vehicleId = ?1 ORDER BY t.timestamp DESC")
    List<VehicleTelemetry> findByVehicleIdOrderByTimestampDesc(String vehicleId);
    
    @Query("SELECT t FROM VehicleTelemetry t WHERE t.vehicleId = ?1 ORDER BY t.timestamp DESC LIMIT 1")
    Optional<VehicleTelemetry> findLatestByVehicleId(String vehicleId);
    
    @Query("SELECT DISTINCT t1 FROM VehicleTelemetry t1 WHERE t1.timestamp = " +
           "(SELECT MAX(t2.timestamp) FROM VehicleTelemetry t2 WHERE t2.vehicleId = t1.vehicleId)")
    List<VehicleTelemetry> findLatestTelemetryForAllVehicles();
    
    @Query("SELECT t FROM VehicleTelemetry t WHERE t.timestamp >= ?1 ORDER BY t.timestamp DESC")
    List<VehicleTelemetry> findRecentTelemetry(LocalDateTime since);
    
    @Query("SELECT COUNT(t) FROM VehicleTelemetry t WHERE t.maintenanceStatus = ?1")
    Long countByMaintenanceStatus(VehicleTelemetry.MaintenanceStatus status);
    
    @Query("SELECT t FROM VehicleTelemetry t WHERE t.vehicleId = ?1 AND t.timestamp >= ?2 ORDER BY t.timestamp ASC")
    List<VehicleTelemetry> findByVehicleIdAndTimestampAfter(String vehicleId, LocalDateTime timestamp);
}
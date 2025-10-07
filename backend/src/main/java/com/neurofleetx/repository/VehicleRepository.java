package com.neurofleetx.repository;

import com.neurofleetx.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    Optional<Vehicle> findByVehicleId(String vehicleId);
    List<Vehicle> findByStatus(Vehicle.VehicleStatus status);
    List<Vehicle> findByAssignedDriverId(Long driverId);
    
    @Query("SELECT v FROM Vehicle v WHERE v.status = 'EN_ROUTE' OR v.status = 'LOADING'")
    List<Vehicle> findActiveVehicles();
    
    @Query("SELECT COUNT(v) FROM Vehicle v WHERE v.status = ?1")
    Long countByStatus(Vehicle.VehicleStatus status);
    
    @Query("SELECT v FROM Vehicle v WHERE v.status = 'AVAILABLE' ORDER BY v.createdAt DESC")
    List<Vehicle> findAvailableVehicles();
}
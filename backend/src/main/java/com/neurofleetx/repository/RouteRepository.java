package com.neurofleetx.repository;

import com.neurofleetx.model.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RouteRepository extends JpaRepository<Route, Long> {
    Optional<Route> findByRouteId(String routeId);
    List<Route> findByStatus(Route.RouteStatus status);
    List<Route> findByVehicleId(Long vehicleId);
    
    @Query("SELECT r FROM Route r WHERE r.status = 'ACTIVE' ORDER BY r.createdAt DESC")
    List<Route> findActiveRoutes();
    
    @Query("SELECT AVG(r.aiOptimizationSavings) FROM Route r WHERE r.aiOptimizationSavings IS NOT NULL")
    Double getAverageOptimizationSavings();
}
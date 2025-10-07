package com.neurofleetx.controller;

import com.neurofleetx.service.VehicleService;
import com.neurofleetx.service.RouteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    
    @Autowired
    private VehicleService vehicleService;
    
    @Autowired
    private RouteService routeService;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // Vehicle statistics
        stats.put("totalVehicles", vehicleService.getAllVehicles().size());
        stats.put("activeVehicles", vehicleService.getActiveVehicles().size());
        stats.put("availableVehicles", vehicleService.getVehicleCountByStatus(com.neurofleetx.model.Vehicle.VehicleStatus.AVAILABLE));
        stats.put("maintenanceVehicles", vehicleService.getVehicleCountByStatus(com.neurofleetx.model.Vehicle.VehicleStatus.MAINTENANCE));
        
        // Route statistics
        stats.put("totalRoutes", routeService.getAllRoutes().size());
        stats.put("activeRoutes", routeService.getActiveRoutes().size());
        stats.put("averageOptimization", routeService.getAverageOptimizationSavings());
        
        // Fleet efficiency metrics
        stats.put("fleetUtilization", 87.3);
        stats.put("fuelEfficiency", 92.0);
        stats.put("monthlyRevenue", 23785000.0);
        stats.put("monthlyCosts", 13800000.0);
        
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/insights")
    public ResponseEntity<Map<String, Object>> getAIInsights() {
        Map<String, Object> insights = new HashMap<>();
        
        insights.put("routeOptimization", Map.of(
            "title", "Route Optimization",
            "description", "AI suggests 15% shorter routes for Delhi NCR deliveries",
            "impact", "Potential revenue increase: +₹10,50,000/month"
        ));
        
        insights.put("maintenanceAlert", Map.of(
            "title", "Maintenance Alert", 
            "description", "3 vehicles due for scheduled maintenance this week",
            "impact", "Prevent potential downtime of 48 hours"
        ));
        
        insights.put("fuelEfficiency", Map.of(
            "title", "Fuel Efficiency",
            "description", "Switch 8 more vehicles to electric. Estimated annual savings of ₹15,40,000",
            "impact", "ROI payback period: 2.3 years"
        ));
        
        return ResponseEntity.ok(insights);
    }
}
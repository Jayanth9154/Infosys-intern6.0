package com.neurofleetx.controller;

import com.neurofleetx.model.Route;
import com.neurofleetx.service.RouteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/routes")
public class RouteController {
    
    @Autowired
    private RouteService routeService;

    @GetMapping
    public ResponseEntity<List<Route>> getAllRoutes() {
        return ResponseEntity.ok(routeService.getAllRoutes());
    }

    @GetMapping("/active")
    public ResponseEntity<List<Route>> getActiveRoutes() {
        return ResponseEntity.ok(routeService.getActiveRoutes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Route> getRouteById(@PathVariable Long id) {
        return routeService.getRouteById(id)
                .map(route -> ResponseEntity.ok().body(route))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Route> createRoute(@RequestBody Route route) {
        Route savedRoute = routeService.createRoute(route);
        return ResponseEntity.ok(savedRoute);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Route> updateRoute(@PathVariable Long id, @RequestBody Route routeDetails) {
        return routeService.getRouteById(id)
                .map(route -> {
                    route.setOrigin(routeDetails.getOrigin());
                    route.setDestination(routeDetails.getDestination());
                    route.setDistance(routeDetails.getDistance());
                    route.setEstimatedTime(routeDetails.getEstimatedTime());
                    route.setStatus(routeDetails.getStatus());
                    return ResponseEntity.ok(routeService.updateRoute(route));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{routeId}/optimize")
    public ResponseEntity<Route> optimizeRoute(@PathVariable String routeId) {
        try {
            Route optimizedRoute = routeService.optimizeRoute(routeId);
            return ResponseEntity.ok(optimizedRoute);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getRouteAnalytics() {
        Map<String, Object> analytics = Map.of(
            "totalRoutes", routeService.getAllRoutes().size(),
            "activeRoutes", routeService.getActiveRoutes().size(),
            "averageOptimization", routeService.getAverageOptimizationSavings()
        );
        return ResponseEntity.ok(analytics);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRoute(@PathVariable Long id) {
        return routeService.getRouteById(id)
                .map(route -> {
                    routeService.deleteRoute(id);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
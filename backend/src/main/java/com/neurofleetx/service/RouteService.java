package com.neurofleetx.service;

import com.neurofleetx.model.Route;
import com.neurofleetx.repository.RouteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class RouteService {
    
    @Autowired
    private RouteRepository routeRepository;

    private final Random random = new Random();

    public List<Route> getAllRoutes() {
        return routeRepository.findAll();
    }

    public List<Route> getActiveRoutes() {
        return routeRepository.findActiveRoutes();
    }

    public Optional<Route> getRouteById(Long id) {
        return routeRepository.findById(id);
    }

    public Route createRoute(Route route) {
        // Simulate AI optimization
        route.setAiOptimizationSavings(15.0 + random.nextDouble() * 20.0); // 15-35% savings
        route.setTimeSaved(5 + random.nextInt(20)); // 5-25 minutes saved
        route.setFuelSaved(1.0 + random.nextDouble() * 4.0); // 1-5 liters saved
        
        return routeRepository.save(route);
    }

    public Route updateRoute(Route route) {
        return routeRepository.save(route);
    }

    public Route optimizeRoute(String routeId) {
        Optional<Route> routeOpt = routeRepository.findByRouteId(routeId);
        if (routeOpt.isPresent()) {
            Route route = routeOpt.get();
            
            // Simulate AI optimization improvements
            double currentSavings = route.getAiOptimizationSavings() != null ? route.getAiOptimizationSavings() : 0.0;
            route.setAiOptimizationSavings(Math.min(currentSavings + 5.0, 40.0));
            route.setTimeSaved((route.getTimeSaved() != null ? route.getTimeSaved() : 0) + 3);
            route.setFuelSaved((route.getFuelSaved() != null ? route.getFuelSaved() : 0.0) + 0.5);
            
            return routeRepository.save(route);
        }
        throw new RuntimeException("Route not found: " + routeId);
    }

    public Double getAverageOptimizationSavings() {
        Double avg = routeRepository.getAverageOptimizationSavings();
        return avg != null ? avg : 0.0;
    }

    public void deleteRoute(Long id) {
        routeRepository.deleteById(id);
    }
}
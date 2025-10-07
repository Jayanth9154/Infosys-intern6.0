package com.neurofleetx.controller;

import com.neurofleetx.model.Trip;
import com.neurofleetx.model.User;
import com.neurofleetx.service.TripService;
import com.neurofleetx.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/driver")
public class DriverController {
    
    @Autowired
    private TripService tripService;
    
    @Autowired
    private UserService userService;

    @GetMapping("/trips")
    public ResponseEntity<List<Trip>> getMyTrips(Authentication authentication) {
        User driver = userService.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(tripService.getTripsByDriver(driver));
    }

    @GetMapping("/trips/current")
    public ResponseEntity<Trip> getCurrentTrip(Authentication authentication) {
        User driver = userService.findByEmail(authentication.getName()).orElseThrow();
        Optional<Trip> currentTrip = tripService.getCurrentTripByDriver(driver);
        return currentTrip.map(trip -> ResponseEntity.ok().body(trip))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/trips/upcoming")
    public ResponseEntity<List<Trip>> getUpcomingTrips(Authentication authentication) {
        User driver = userService.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(tripService.getUpcomingTripsByDriver(driver));
    }

    @GetMapping("/trips/{tripId}")
    public ResponseEntity<Trip> getTripDetails(@PathVariable String tripId) {
        return tripService.getTripByTripId(tripId)
                .map(trip -> ResponseEntity.ok().body(trip))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/trips/{tripId}/progress")
    public ResponseEntity<Trip> updateTripProgress(
            @PathVariable String tripId,
            @RequestBody Map<String, Integer> progressData) {
        try {
            Integer progress = progressData.get("progress");
            Trip updatedTrip = tripService.updateTripProgress(tripId, progress);
            return ResponseEntity.ok(updatedTrip);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/trips/{tripId}/complete")
    public ResponseEntity<Trip> completeTrip(@PathVariable String tripId) {
        return tripService.getTripByTripId(tripId)
                .map(trip -> {
                    trip.setStatus(Trip.TripStatus.COMPLETED);
                    trip.setProgress(100);
                    return ResponseEntity.ok(tripService.updateTrip(trip));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getDriverStats(Authentication authentication) {
        User driver = userService.findByEmail(authentication.getName()).orElseThrow();
        List<Trip> trips = tripService.getTripsByDriver(driver);
        Double monthlyEarnings = tripService.getMonthlyEarningsByDriver(driver);
        
        long completedTrips = trips.stream()
                .filter(t -> t.getStatus() == Trip.TripStatus.COMPLETED)
                .count();
        
        long activeTrips = trips.stream()
                .filter(t -> t.getStatus() == Trip.TripStatus.IN_PROGRESS)
                .count();
        
        double totalDistance = trips.stream()
                .filter(t -> t.getStatus() == Trip.TripStatus.COMPLETED)
                .mapToDouble(Trip::getDistance)
                .sum();
        
        Map<String, Object> stats = Map.of(
            "totalTrips", trips.size(),
            "completedTrips", completedTrips,
            "activeTrips", activeTrips,
            "monthlyEarnings", monthlyEarnings,
            "totalDistance", totalDistance,
            "averageRating", 4.8,
            "onTimeRate", 98.5
        );
        
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/earnings/monthly")
    public ResponseEntity<Double> getMonthlyEarnings(Authentication authentication) {
        User driver = userService.findByEmail(authentication.getName()).orElseThrow();
        Double earnings = tripService.getMonthlyEarningsByDriver(driver);
        return ResponseEntity.ok(earnings);
    }
}
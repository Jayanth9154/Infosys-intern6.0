package com.neurofleetx.service;

import com.neurofleetx.model.Trip;
import com.neurofleetx.model.User;
import com.neurofleetx.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class TripService {
    
    @Autowired
    private TripRepository tripRepository;

    private final Random random = new Random();

    public List<Trip> getAllTrips() {
        return tripRepository.findAll();
    }

    public List<Trip> getTripsByDriver(User driver) {
        return tripRepository.findByDriverIdOrderByCreatedAtDesc(driver.getId());
    }

    public Optional<Trip> getCurrentTripByDriver(User driver) {
        return tripRepository.findCurrentTripByDriverId(driver.getId());
    }

    public List<Trip> getUpcomingTripsByDriver(User driver) {
        return tripRepository.findUpcomingTripsByDriverId(driver.getId());
    }

    public Optional<Trip> getTripById(Long id) {
        return tripRepository.findById(id);
    }

    public Optional<Trip> getTripByTripId(String tripId) {
        return tripRepository.findByTripId(tripId);
    }

    public Trip createTrip(Trip trip) {
        // Generate trip ID
        trip.setTripId("TR-" + String.format("%03d", random.nextInt(1000)));
        
        // Set estimated completion time
        trip.setEstimatedCompletion(LocalDateTime.now().plusHours(2 + random.nextInt(4)));
        
        return tripRepository.save(trip);
    }

    public Trip updateTrip(Trip trip) {
        return tripRepository.save(trip);
    }

    public Trip updateTripProgress(String tripId, Integer progress) {
        Optional<Trip> tripOpt = tripRepository.findByTripId(tripId);
        if (tripOpt.isPresent()) {
            Trip trip = tripOpt.get();
            trip.setProgress(progress);
            
            // Update status based on progress
            if (progress >= 100) {
                trip.setStatus(Trip.TripStatus.COMPLETED);
                trip.setEndTime(LocalDateTime.now());
            } else if (progress > 0) {
                trip.setStatus(Trip.TripStatus.IN_PROGRESS);
                if (trip.getStartTime() == null) {
                    trip.setStartTime(LocalDateTime.now());
                }
            }
            
            return tripRepository.save(trip);
        }
        throw new RuntimeException("Trip not found: " + tripId);
    }

    public Double getMonthlyEarningsByDriver(User driver) {
        Double earnings = tripRepository.getMonthlyEarningsByDriverId(driver.getId());
        return earnings != null ? earnings : 0.0;
    }

    public void deleteTrip(Long id) {
        tripRepository.deleteById(id);
    }
}
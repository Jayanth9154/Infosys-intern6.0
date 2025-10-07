package com.neurofleetx.repository;

import com.neurofleetx.model.Trip;
import com.neurofleetx.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {
    Optional<Trip> findByTripId(String tripId);
    List<Trip> findByDriver(User driver);
    List<Trip> findByStatus(Trip.TripStatus status);
    
    @Query("SELECT t FROM Trip t WHERE t.driver.id = ?1 ORDER BY t.createdAt DESC")
    List<Trip> findByDriverIdOrderByCreatedAtDesc(Long driverId);
    
    @Query("SELECT t FROM Trip t WHERE t.driver.id = ?1 AND t.status = 'IN_PROGRESS'")
    Optional<Trip> findCurrentTripByDriverId(Long driverId);
    
    @Query("SELECT t FROM Trip t WHERE t.driver.id = ?1 AND t.status = 'SCHEDULED' ORDER BY t.estimatedCompletion ASC")
    List<Trip> findUpcomingTripsByDriverId(Long driverId);
    
    @Query("SELECT SUM(t.earnings) FROM Trip t WHERE t.driver.id = ?1 AND MONTH(t.createdAt) = MONTH(CURRENT_DATE) AND YEAR(t.createdAt) = YEAR(CURRENT_DATE)")
    Double getMonthlyEarningsByDriverId(Long driverId);
}
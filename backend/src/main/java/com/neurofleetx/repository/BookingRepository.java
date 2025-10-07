package com.neurofleetx.repository;

import com.neurofleetx.model.Booking;
import com.neurofleetx.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    Optional<Booking> findByBookingId(String bookingId);
    List<Booking> findByCustomer(User customer);
    List<Booking> findByDriver(User driver);
    List<Booking> findByStatus(Booking.BookingStatus status);
    
    @Query("SELECT b FROM Booking b WHERE b.customer.id = ?1 ORDER BY b.createdAt DESC")
    List<Booking> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    
    @Query("SELECT b FROM Booking b WHERE b.driver.id = ?1 ORDER BY b.createdAt DESC")
    List<Booking> findByDriverIdOrderByCreatedAtDesc(Long driverId);
    
    @Query("SELECT b FROM Booking b WHERE b.status = 'IN_TRANSIT' ORDER BY b.createdAt DESC")
    List<Booking> findActiveBookings();
}
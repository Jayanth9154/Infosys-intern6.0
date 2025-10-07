package com.neurofleetx.service;

import com.neurofleetx.model.Booking;
import com.neurofleetx.model.User;
import com.neurofleetx.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class BookingService {
    
    @Autowired
    private BookingRepository bookingRepository;

    private final Random random = new Random();

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public List<Booking> getBookingsByCustomer(User customer) {
        return bookingRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId());
    }

    public List<Booking> getBookingsByDriver(User driver) {
        return bookingRepository.findByDriverIdOrderByCreatedAtDesc(driver.getId());
    }

    public List<Booking> getActiveBookings() {
        return bookingRepository.findActiveBookings();
    }

    public Optional<Booking> getBookingById(Long id) {
        return bookingRepository.findById(id);
    }

    public Optional<Booking> getBookingByBookingId(String bookingId) {
        return bookingRepository.findByBookingId(bookingId);
    }

    public Booking createBooking(Booking booking) {
        // Generate booking ID
        booking.setBookingId("BK-" + String.format("%03d", random.nextInt(1000)));
        
        // Set estimated delivery time (1-3 hours from now)
        booking.setEstimatedDelivery(LocalDateTime.now().plusHours(1 + random.nextInt(3)));
        
        return bookingRepository.save(booking);
    }

    public Booking updateBooking(Booking booking) {
        return bookingRepository.save(booking);
    }

    public Booking updateBookingProgress(String bookingId, Integer progress) {
        Optional<Booking> bookingOpt = bookingRepository.findByBookingId(bookingId);
        if (bookingOpt.isPresent()) {
            Booking booking = bookingOpt.get();
            booking.setProgress(progress);
            
            // Update status based on progress
            if (progress >= 100) {
                booking.setStatus(Booking.BookingStatus.DELIVERED);
                booking.setDeliveryTime(LocalDateTime.now());
            } else if (progress > 0) {
                booking.setStatus(Booking.BookingStatus.IN_TRANSIT);
                if (booking.getPickupTime() == null) {
                    booking.setPickupTime(LocalDateTime.now());
                }
            }
            
            return bookingRepository.save(booking);
        }
        throw new RuntimeException("Booking not found: " + bookingId);
    }

    public void deleteBooking(Long id) {
        bookingRepository.deleteById(id);
    }
}
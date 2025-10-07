package com.neurofleetx.controller;

import com.neurofleetx.model.Booking;
import com.neurofleetx.model.User;
import com.neurofleetx.service.BookingService;
import com.neurofleetx.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/customer")
public class CustomerController {
    
    @Autowired
    private BookingService bookingService;
    
    @Autowired
    private UserService userService;

    @GetMapping("/bookings")
    public ResponseEntity<List<Booking>> getMyBookings(Authentication authentication) {
        User customer = userService.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(bookingService.getBookingsByCustomer(customer));
    }

    @GetMapping("/bookings/{bookingId}")
    public ResponseEntity<Booking> getBookingDetails(@PathVariable String bookingId) {
        return bookingService.getBookingByBookingId(bookingId)
                .map(booking -> ResponseEntity.ok().body(booking))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/bookings")
    public ResponseEntity<Booking> createBooking(@RequestBody Booking booking, Authentication authentication) {
        User customer = userService.findByEmail(authentication.getName()).orElseThrow();
        booking.setCustomer(customer);
        Booking savedBooking = bookingService.createBooking(booking);
        return ResponseEntity.ok(savedBooking);
    }

    @PutMapping("/bookings/{bookingId}/progress")
    public ResponseEntity<Booking> updateBookingProgress(
            @PathVariable String bookingId,
            @RequestBody Map<String, Integer> progressData) {
        try {
            Integer progress = progressData.get("progress");
            Booking updatedBooking = bookingService.updateBookingProgress(bookingId, progress);
            return ResponseEntity.ok(updatedBooking);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/bookings/{bookingId}/rate")
    public ResponseEntity<Booking> rateBooking(
            @PathVariable String bookingId,
            @RequestBody Map<String, Integer> ratingData) {
        return bookingService.getBookingByBookingId(bookingId)
                .map(booking -> {
                    booking.setRating(ratingData.get("rating"));
                    return ResponseEntity.ok(bookingService.updateBooking(booking));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getCustomerStats(Authentication authentication) {
        User customer = userService.findByEmail(authentication.getName()).orElseThrow();
        List<Booking> bookings = bookingService.getBookingsByCustomer(customer);
        
        long activeBookings = bookings.stream()
                .filter(b -> b.getStatus() == Booking.BookingStatus.IN_TRANSIT)
                .count();
        
        long completedBookings = bookings.stream()
                .filter(b -> b.getStatus() == Booking.BookingStatus.DELIVERED)
                .count();
        
        double totalSpent = bookings.stream()
                .filter(b -> b.getStatus() == Booking.BookingStatus.DELIVERED)
                .mapToDouble(Booking::getEstimatedCost)
                .sum();
        
        Map<String, Object> stats = Map.of(
            "totalBookings", bookings.size(),
            "activeBookings", activeBookings,
            "completedBookings", completedBookings,
            "totalSpent", totalSpent,
            "averageRating", 4.6
        );
        
        return ResponseEntity.ok(stats);
    }
}
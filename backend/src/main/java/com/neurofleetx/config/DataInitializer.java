package com.neurofleetx.config;

import com.neurofleetx.model.Route;
import com.neurofleetx.model.Vehicle;
import com.neurofleetx.model.User;
import com.neurofleetx.model.Booking;
import com.neurofleetx.model.Trip;
import com.neurofleetx.repository.RouteRepository;
import com.neurofleetx.repository.VehicleRepository;
import com.neurofleetx.repository.UserRepository;
import com.neurofleetx.repository.BookingRepository;
import com.neurofleetx.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private RouteRepository routeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Initialize sample users if database is empty
        if (userRepository.count() == 0) {
            initializeUsers();
        }

        // Initialize sample vehicles if database is empty
        if (vehicleRepository.count() == 0) {
            initializeVehicles();
        }

        // Initialize sample routes if database is empty
        if (routeRepository.count() == 0) {
            initializeRoutes();
        }

        // Initialize sample bookings and trips
        if (bookingRepository.count() == 0) {
            initializeBookingsAndTrips();
        }
    }

    private void initializeUsers() {
        // Fleet Manager
        User fleetManager = new User("Admin", "Manager", "admin@neurofleetx.com", 
                                   "NeuroFleetX Corp", passwordEncoder.encode("password123"), "fleet_manager");
        fleetManager.setRole(User.Role.ADMIN);
        userRepository.save(fleetManager);

        // Customer
        User customer = new User("John", "Doe", "customer@techsolutions.com", 
                               "Tech Solutions Ltd", passwordEncoder.encode("password123"), "customer");
        userRepository.save(customer);

        // Driver
        User driver = new User("Rajesh", "Kumar", "driver@neurofleetx.com", 
                             "NeuroFleetX Corp", passwordEncoder.encode("password123"), "driver");
        userRepository.save(driver);
    }

    private void initializeVehicles() {
        User driver = userRepository.findByEmail("driver@neurofleetx.com").orElse(null);
        
        Vehicle van1 = new Vehicle("FL-001", "Delivery Van", "Tata Ace", 1500, "Diesel",
                                  Vehicle.VehicleStatus.EN_ROUTE, 28.6139, 77.2090);
        van1.setCurrentLocation("Connaught Place");
        van1.setDestination("Khan Market");
        van1.setBatteryLevel(85);
        van1.setSpeed(45.0);
        van1.setDriverName("Rajesh Kumar");
        van1.setLicensePlate("DL-01-AB-1234");
        van1.setYear(2022);
        van1.setManufacturer("Tata Motors");
        van1.setMileage(15.5);
        van1.setIsElectric(false);
        van1.setFuelLevel(78.0);
        van1.setAssignedDriver(driver);

        Vehicle truck1 = new Vehicle("FL-002", "Cargo Truck", "Ashok Leyland", 3000, "Diesel",
                                    Vehicle.VehicleStatus.LOADING, 28.4595, 77.0266);
        truck1.setCurrentLocation("Gurgaon Warehouse");
        truck1.setDestination("Cyber City");
        truck1.setBatteryLevel(92);
        truck1.setSpeed(0.0);
        truck1.setDriverName("Priya Sharma");
        truck1.setLicensePlate("HR-26-CD-5678");
        truck1.setYear(2021);
        truck1.setManufacturer("Ashok Leyland");
        truck1.setMileage(8.2);
        truck1.setIsElectric(false);
        truck1.setFuelLevel(85.0);

        Vehicle van2 = new Vehicle("FL-003", "Pickup Truck", "Mahindra Bolero", 1000, "Diesel",
                                  Vehicle.VehicleStatus.AVAILABLE, 28.5355, 77.3910);
        van2.setCurrentLocation("Noida Base Station");
        van2.setDestination("Greater Noida");
        van2.setBatteryLevel(100);
        van2.setSpeed(0.0);
        van2.setDriverName("Amit Singh");
        van2.setLicensePlate("UP-16-EF-9012");
        van2.setYear(2023);
        van2.setManufacturer("Mahindra");
        van2.setMileage(12.8);
        van2.setIsElectric(false);
        van2.setFuelLevel(95.0);

        Vehicle electric1 = new Vehicle("FL-004", "Electric Van", "Tata Nexon EV", 1200, "Electric",
                                       Vehicle.VehicleStatus.EN_ROUTE, 12.9716, 77.5946);
        electric1.setCurrentLocation("Bangalore Electronic City");
        electric1.setDestination("Whitefield Tech Park");
        electric1.setBatteryLevel(67);
        electric1.setSpeed(32.0);
        electric1.setDriverName("Sneha Patel");
        electric1.setLicensePlate("KA-03-GH-3456");
        electric1.setYear(2023);
        electric1.setManufacturer("Tata Motors");
        electric1.setMileage(0.0); // Electric vehicles don't have traditional mileage
        electric1.setIsElectric(true);
        electric1.setFuelLevel(0.0); // Electric vehicles don't have fuel

        // Add more vehicles for better inventory
        Vehicle van3 = new Vehicle("FL-005", "Delivery Van", "Maruti Suzuki Super Carry", 750, "CNG",
                                  Vehicle.VehicleStatus.AVAILABLE, 19.0760, 72.8777);
        van3.setCurrentLocation("Mumbai Central");
        van3.setLicensePlate("MH-01-IJ-7890");
        van3.setYear(2022);
        van3.setManufacturer("Maruti Suzuki");
        van3.setMileage(18.5);
        van3.setIsElectric(false);
        van3.setFuelLevel(90.0);
        van3.setBatteryLevel(100);
        van3.setSpeed(0.0);

        Vehicle truck2 = new Vehicle("FL-006", "Heavy Truck", "Bharat Benz", 5000, "Diesel",
                                    Vehicle.VehicleStatus.MAINTENANCE, 22.5726, 88.3639);
        truck2.setCurrentLocation("Kolkata Service Center");
        truck2.setLicensePlate("WB-02-KL-2468");
        truck2.setYear(2020);
        truck2.setManufacturer("Daimler");
        truck2.setMileage(6.5);
        truck2.setIsElectric(false);
        truck2.setFuelLevel(45.0);
        truck2.setBatteryLevel(88);
        truck2.setSpeed(0.0);

        vehicleRepository.save(van1);
        vehicleRepository.save(truck1);
        vehicleRepository.save(van2);
        vehicleRepository.save(electric1);
        vehicleRepository.save(van3);
        vehicleRepository.save(truck2);
    }

    private void initializeRoutes() {
        Route route1 = new Route("RT-001", "Delhi Central Warehouse", "Connaught Place Hub", 18.5, 35, 8.5);
        route1.setStatus(Route.RouteStatus.ACTIVE);
        route1.setAiOptimizationSavings(23.0);
        route1.setTimeSaved(15);
        route1.setFuelSaved(3.2);

        Route route2 = new Route("RT-002", "Gurgaon Distribution Center", "DLF Mall", 25.2, 42, 12.8);
        route2.setStatus(Route.RouteStatus.PLANNED);
        route2.setAiOptimizationSavings(18.0);
        route2.setTimeSaved(12);
        route2.setFuelSaved(2.8);

        Route route3 = new Route("RT-003", "Noida Terminal", "Greater Noida Industrial Zone", 32.8, 58, 15.9);
        route3.setStatus(Route.RouteStatus.COMPLETED);
        route3.setAiOptimizationSavings(31.0);
        route3.setTimeSaved(22);
        route3.setFuelSaved(4.1);

        routeRepository.save(route1);
        routeRepository.save(route2);
        routeRepository.save(route3);
    }

    private void initializeBookingsAndTrips() {
        User customer = userRepository.findByEmail("customer@techsolutions.com").orElse(null);
        User driver = userRepository.findByEmail("driver@neurofleetx.com").orElse(null);
        Vehicle vehicle = vehicleRepository.findByVehicleId("FL-001").orElse(null);

        if (customer != null && driver != null && vehicle != null) {
            // Sample Booking
            Booking booking1 = new Booking("BK-001", customer, "Delhi Central Warehouse", 
                                         "Connaught Place Hub", 18.5, 1500.0);
            booking1.setDriver(driver);
            booking1.setVehicle(vehicle);
            booking1.setStatus(Booking.BookingStatus.IN_TRANSIT);
            booking1.setProgress(65);
            booking1.setPickupTime(LocalDateTime.now().minusHours(1));
            booking1.setEstimatedDelivery(LocalDateTime.now().plusMinutes(25));
            bookingRepository.save(booking1);

            // Sample Trip
            Trip trip1 = new Trip("TR-001", driver, vehicle, "Delhi Central Warehouse", 
                                "Connaught Place Hub", 18.5, 850.0);
            trip1.setBooking(booking1);
            trip1.setStatus(Trip.TripStatus.IN_PROGRESS);
            trip1.setProgress(65);
            trip1.setStartTime(LocalDateTime.now().minusHours(1));
            trip1.setEstimatedCompletion(LocalDateTime.now().plusMinutes(25));
            trip1.setCustomerName("John Doe");
            trip1.setCustomerPhone("+91 98765 43210");
            tripRepository.save(trip1);
        }
    }
}
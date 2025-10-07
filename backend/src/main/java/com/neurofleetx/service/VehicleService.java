package com.neurofleetx.service;

import com.neurofleetx.model.Vehicle;
import com.neurofleetx.model.User;
import com.neurofleetx.dto.VehicleRequest;
import com.neurofleetx.dto.VehicleResponse;
import com.neurofleetx.dto.DriverDto;
import com.neurofleetx.repository.VehicleRepository;
import com.neurofleetx.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class VehicleService {
    
    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private UserRepository userRepository;

    public List<VehicleResponse> getAllVehicles() {
        return vehicleRepository.findAll().stream()
                .map(VehicleResponse::new)
                .collect(Collectors.toList());
    }

    public List<VehicleResponse> getAvailableVehicles() {
        return vehicleRepository.findByStatus(Vehicle.VehicleStatus.AVAILABLE).stream()
                .map(VehicleResponse::new)
                .collect(Collectors.toList());
    }

    public List<VehicleResponse> getVehiclesByDriver(Long driverId) {
        return vehicleRepository.findByAssignedDriverId(driverId).stream()
                .map(VehicleResponse::new)
                .collect(Collectors.toList());
    }

    public Optional<VehicleResponse> getVehicleById(Long id) {
        return vehicleRepository.findById(id)
                .map(VehicleResponse::new);
    }

    public Optional<VehicleResponse> getVehicleByVehicleId(String vehicleId) {
        return vehicleRepository.findByVehicleId(vehicleId)
                .map(VehicleResponse::new);
    }

    public VehicleResponse createVehicle(VehicleRequest request) {
        // Check if vehicle ID already exists
        if (vehicleRepository.findByVehicleId(request.getVehicleId()).isPresent()) {
            throw new RuntimeException("Vehicle ID already exists: " + request.getVehicleId());
        }

        Vehicle vehicle = new Vehicle();
        vehicle.setVehicleId(request.getVehicleId());
        vehicle.setType(request.getType());
        vehicle.setModel(request.getModel());
        vehicle.setCapacity(request.getCapacity());
        vehicle.setFuelType(request.getFuelType());
        vehicle.setLicensePlate(request.getLicensePlate());
        vehicle.setYear(request.getYear());
        vehicle.setManufacturer(request.getManufacturer());
        vehicle.setMileage(request.getMileage());
        vehicle.setLatitude(request.getLatitude());
        vehicle.setLongitude(request.getLongitude());
        vehicle.setCurrentLocation(request.getCurrentLocation());
        vehicle.setStatus(request.getStatus() != null ? 
                Vehicle.VehicleStatus.valueOf(request.getStatus()) : 
                Vehicle.VehicleStatus.AVAILABLE);
        vehicle.setIsElectric(request.getFuelType().equalsIgnoreCase("electric"));

        // Assign driver if provided
        if (request.getAssignedDriverId() != null) {
            Optional<User> driver = userRepository.findById(request.getAssignedDriverId());
            if (driver.isPresent() && "driver".equals(driver.get().getUserType())) {
                vehicle.setAssignedDriver(driver.get());
                vehicle.setDriverName(driver.get().getFirstName() + " " + driver.get().getLastName());
            }
        }

        Vehicle savedVehicle = vehicleRepository.save(vehicle);
        return new VehicleResponse(savedVehicle);
    }

    public VehicleResponse updateVehicle(Long id, VehicleRequest request) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found: " + id));

        // Update vehicle details
        vehicle.setType(request.getType());
        vehicle.setModel(request.getModel());
        vehicle.setCapacity(request.getCapacity());
        vehicle.setFuelType(request.getFuelType());
        vehicle.setLicensePlate(request.getLicensePlate());
        vehicle.setYear(request.getYear());
        vehicle.setManufacturer(request.getManufacturer());
        vehicle.setMileage(request.getMileage());
        vehicle.setLatitude(request.getLatitude());
        vehicle.setLongitude(request.getLongitude());
        vehicle.setCurrentLocation(request.getCurrentLocation());
        
        if (request.getStatus() != null) {
            vehicle.setStatus(Vehicle.VehicleStatus.valueOf(request.getStatus()));
        }
        
        vehicle.setIsElectric(request.getFuelType().equalsIgnoreCase("electric"));

        // Update assigned driver
        if (request.getAssignedDriverId() != null) {
            Optional<User> driver = userRepository.findById(request.getAssignedDriverId());
            if (driver.isPresent() && "driver".equals(driver.get().getUserType())) {
                vehicle.setAssignedDriver(driver.get());
                vehicle.setDriverName(driver.get().getFirstName() + " " + driver.get().getLastName());
            }
        } else {
            vehicle.setAssignedDriver(null);
            vehicle.setDriverName(null);
        }

        vehicle.setLastUpdated(LocalDateTime.now());
        Vehicle updatedVehicle = vehicleRepository.save(vehicle);
        return new VehicleResponse(updatedVehicle);
    }

    public VehicleResponse updateVehicleLocation(String vehicleId, Double latitude, Double longitude, String location) {
        Optional<Vehicle> vehicleOpt = vehicleRepository.findByVehicleId(vehicleId);
        if (vehicleOpt.isPresent()) {
            Vehicle vehicle = vehicleOpt.get();
            vehicle.setLatitude(latitude);
            vehicle.setLongitude(longitude);
            vehicle.setCurrentLocation(location);
            vehicle.setLastUpdated(LocalDateTime.now());
            Vehicle updatedVehicle = vehicleRepository.save(vehicle);
            return new VehicleResponse(updatedVehicle);
        }
        throw new RuntimeException("Vehicle not found: " + vehicleId);
    }

    public Long getVehicleCountByStatus(Vehicle.VehicleStatus status) {
        return vehicleRepository.countByStatus(status);
    }

    public Long getTotalVehicleCount() {
        return vehicleRepository.count();
    }

    public List<DriverDto> getAvailableDrivers() {
        try {
            List<User> drivers = userRepository.findByUserType("driver");
            return drivers.stream()
                    .map(DriverDto::new)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Error fetching available drivers: " + e.getMessage());
        }
    }

    public void deleteVehicle(Long id) {
        if (!vehicleRepository.existsById(id)) {
            throw new RuntimeException("Vehicle not found: " + id);
        }
        vehicleRepository.deleteById(id);
    }
}
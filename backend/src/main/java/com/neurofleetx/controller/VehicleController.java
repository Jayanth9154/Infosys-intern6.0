package com.neurofleetx.controller;

import com.neurofleetx.model.Vehicle;
import com.neurofleetx.dto.VehicleRequest;
import com.neurofleetx.dto.VehicleResponse;
import com.neurofleetx.dto.DriverDto;
import com.neurofleetx.service.VehicleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {
    
    @Autowired
    private VehicleService vehicleService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('FLEET_MANAGER')")
    public ResponseEntity<List<VehicleResponse>> getAllVehicles() {
        return ResponseEntity.ok(vehicleService.getAllVehicles());
    }

    @GetMapping("/available")
    public ResponseEntity<List<VehicleResponse>> getAvailableVehicles() {
        return ResponseEntity.ok(vehicleService.getAvailableVehicles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleResponse> getVehicleById(@PathVariable Long id) {
        return vehicleService.getVehicleById(id)
                .map(vehicle -> ResponseEntity.ok(vehicle))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<VehicleResponse> getVehicleByVehicleId(@PathVariable String vehicleId) {
        return vehicleService.getVehicleByVehicleId(vehicleId)
                .map(vehicle -> ResponseEntity.ok(vehicle))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/driver/{driverId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FLEET_MANAGER') or (hasRole('USER') and @userService.findById(#driverId).get().email == authentication.name)")
    public ResponseEntity<List<VehicleResponse>> getVehiclesByDriver(@PathVariable Long driverId) {
        return ResponseEntity.ok(vehicleService.getVehiclesByDriver(driverId));
    }

    @GetMapping("/drivers/available")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FLEET_MANAGER')")
    public ResponseEntity<?> getAvailableDrivers() {
        try {
            List<DriverDto> drivers = vehicleService.getAvailableDrivers();
            return ResponseEntity.ok(drivers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching available drivers: " + e.getMessage());
        }
    }
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('FLEET_MANAGER')")
    public ResponseEntity<VehicleResponse> createVehicle(@Valid @RequestBody VehicleRequest vehicleRequest) {
        try {
            VehicleResponse savedVehicle = vehicleService.createVehicle(vehicleRequest);
            return ResponseEntity.ok(savedVehicle);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FLEET_MANAGER')")
    public ResponseEntity<VehicleResponse> updateVehicle(@PathVariable Long id, @Valid @RequestBody VehicleRequest vehicleRequest) {
        try {
            VehicleResponse updatedVehicle = vehicleService.updateVehicle(id, vehicleRequest);
            return ResponseEntity.ok(updatedVehicle);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{vehicleId}/location")
    public ResponseEntity<VehicleResponse> updateVehicleLocation(
            @PathVariable String vehicleId,
            @RequestBody Map<String, Object> locationData) {
        try {
            Double latitude = Double.valueOf(locationData.get("latitude").toString());
            Double longitude = Double.valueOf(locationData.get("longitude").toString());
            String location = locationData.get("location").toString();
            
            VehicleResponse updatedVehicle = vehicleService.updateVehicleLocation(vehicleId, latitude, longitude, location);
            return ResponseEntity.ok(updatedVehicle);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FLEET_MANAGER')")
    public ResponseEntity<Map<String, Object>> getVehicleStats() {
        Map<String, Object> stats = Map.of(
            "total", vehicleService.getTotalVehicleCount(),
            "active", vehicleService.getVehicleCountByStatus(Vehicle.VehicleStatus.EN_ROUTE),
            "available", vehicleService.getVehicleCountByStatus(Vehicle.VehicleStatus.AVAILABLE),
            "maintenance", vehicleService.getVehicleCountByStatus(Vehicle.VehicleStatus.MAINTENANCE)
        );
        return ResponseEntity.ok(stats);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FLEET_MANAGER')")
    public ResponseEntity<?> deleteVehicle(@PathVariable Long id) {
        try {
            vehicleService.deleteVehicle(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
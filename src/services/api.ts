import { localStore, Vehicle, VehicleTelemetry } from './localStore';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const vehicleAPI = {
  getAllVehicles: async () => {
    await delay(100);
    return { data: localStore.getVehicles() };
  },

  getVehicleById: async (id: number | string) => {
    await delay(100);
    return { data: localStore.getVehicleById(id.toString()) };
  },

  createVehicle: async (vehicleData: any) => {
    await delay(100);
    const vehicle = localStore.createVehicle({
      registrationNumber: vehicleData.registrationNumber,
      type: vehicleData.type,
      model: vehicleData.model,
      status: vehicleData.status || 'ACTIVE',
      assignedDriverId: vehicleData.assignedDriverId,
      currentLocationLat: vehicleData.currentLocationLat || 40.7128,
      currentLocationLng: vehicleData.currentLocationLng || -74.0060,
      fuelLevel: vehicleData.fuelLevel || 100,
      mileage: vehicleData.mileage || 0,
      lastMaintenanceDate: vehicleData.lastMaintenanceDate,
      nextMaintenanceDate: vehicleData.nextMaintenanceDate,
      capacity: vehicleData.capacity,
    });
    return { data: vehicle };
  },

  updateVehicle: async (id: number | string, vehicleData: any) => {
    await delay(100);
    const vehicle = localStore.updateVehicle(id.toString(), vehicleData);
    return { data: vehicle };
  },

  deleteVehicle: async (id: number | string) => {
    await delay(100);
    const success = localStore.deleteVehicle(id.toString());
    return { data: { success } };
  },

  getVehicleStats: async () => {
    await delay(100);
    return { data: localStore.getVehicleStats() };
  },

  getAvailableDrivers: async () => {
    await delay(100);
    return { data: [] };
  },

  getVehiclesByDriver: async (driverId: number) => {
    await delay(100);
    return { data: localStore.getVehicles().filter((v) => v.assignedDriverId === driverId.toString()) };
  },

  getAvailableVehicles: async () => {
    await delay(100);
    return { data: localStore.getVehicles().filter((v) => v.status === 'ACTIVE') };
  },

  updateVehicleLocation: async (vehicleId: string, locationData: any) => {
    await delay(100);
    const vehicle = localStore.updateVehicle(vehicleId, {
      currentLocationLat: locationData.lat,
      currentLocationLng: locationData.lng,
    });
    return { data: vehicle };
  },
};

export const authAPI = {
  login: async (credentials: any) => {
    await delay(200);
    const user = {
      id: '1',
      email: credentials.email,
      fullName: 'Fleet Manager',
      role: 'FLEET_MANAGER' as const,
    };
    localStore.setCurrentUser(user);
    return {
      data: {
        token: 'mock-jwt-token-' + Date.now(),
        user,
      },
    };
  },

  register: async (userData: any) => {
    await delay(200);
    const user = {
      id: Date.now().toString(),
      email: userData.email,
      fullName: userData.fullName || userData.email,
      role: userData.role || 'CUSTOMER',
    };
    localStore.setCurrentUser(user);
    return {
      data: {
        token: 'mock-jwt-token-' + Date.now(),
        user,
      },
    };
  },
};

export const customerAPI = {
  getBookings: async () => {
    await delay(100);
    return { data: localStore.getBookings() };
  },

  createBooking: async (bookingData: any) => {
    await delay(100);
    const booking = {
      id: Date.now().toString(),
      customerId: localStore.getCurrentUser()?.id || '1',
      vehicleId: bookingData.vehicleId,
      pickupLocation: bookingData.pickupLocation,
      deliveryLocation: bookingData.deliveryLocation,
      pickupLat: bookingData.pickupLat,
      pickupLng: bookingData.pickupLng,
      deliveryLat: bookingData.deliveryLat,
      deliveryLng: bookingData.deliveryLng,
      status: 'PENDING' as const,
      scheduledPickupTime: bookingData.scheduledPickupTime,
      estimatedDeliveryTime: bookingData.estimatedDeliveryTime,
      cargoWeight: bookingData.cargoWeight,
      cargoDescription: bookingData.cargoDescription,
      price: bookingData.price,
      notes: bookingData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const bookings = localStore.getBookings();
    bookings.push(booking);
    localStorage.setItem('neurofleetx_bookings', JSON.stringify(bookings));
    return { data: booking };
  },

  getBookingDetails: async (bookingId: string) => {
    await delay(100);
    return { data: localStore.getBookings().find((b) => b.id === bookingId) };
  },

  updateBookingProgress: async (bookingId: string, progress: number) => {
    await delay(100);
    return { data: { success: true } };
  },

  rateBooking: async (bookingId: string, rating: number) => {
    await delay(100);
    return { data: { success: true } };
  },

  getDashboardStats: async () => {
    await delay(100);
    return {
      data: {
        activeBookings: 3,
        completedBookings: 15,
        totalSpent: 12500,
      },
    };
  },
};

export const driverAPI = {
  getTrips: async () => {
    await delay(100);
    return { data: [] };
  },

  getCurrentTrip: async () => {
    await delay(100);
    return { data: null };
  },

  getUpcomingTrips: async () => {
    await delay(100);
    return { data: [] };
  },

  getTripDetails: async (tripId: string) => {
    await delay(100);
    return { data: null };
  },

  updateTripProgress: async (tripId: string, progress: number) => {
    await delay(100);
    return { data: { success: true } };
  },

  completeTrip: async (tripId: string) => {
    await delay(100);
    return { data: { success: true } };
  },

  getDashboardStats: async () => {
    await delay(100);
    return {
      data: {
        activeTrips: 2,
        completedTrips: 28,
        monthlyEarnings: 4500,
      },
    };
  },

  getMonthlyEarnings: async () => {
    await delay(100);
    return { data: Array.from({ length: 12 }, (_, i) => 3000 + Math.random() * 2000) };
  },
};

export const dashboardAPI = {
  getStats: async () => {
    await delay(100);
    const stats = localStore.getVehicleStats();
    return {
      data: {
        totalVehicles: stats.total,
        activeVehicles: stats.active,
        maintenanceVehicles: stats.maintenance,
        totalRevenue: 125000,
        activeBookings: 12,
        completedTrips: 156,
        avgFuelLevel: stats.avgFuelLevel,
        totalMileage: stats.totalMileage,
      },
    };
  },

  getInsights: async () => {
    await delay(100);
    return {
      data: {
        fuelEfficiency: 85,
        onTimeDelivery: 92,
        customerSatisfaction: 4.6,
      },
    };
  },
};

export const telemetryAPI = {
  getLatestTelemetry: async () => {
    await delay(100);
    return { data: localStore.getTelemetry() };
  },

  getTelemetryByVehicleId: async (vehicleId: string) => {
    await delay(100);
    return { data: [localStore.getTelemetryByVehicleId(vehicleId)] };
  },

  getLatestTelemetryByVehicleId: async (vehicleId: string) => {
    await delay(100);
    return { data: localStore.getTelemetryByVehicleId(vehicleId) };
  },

  getRecentTelemetry: async (hours: number = 1) => {
    await delay(100);
    return { data: localStore.getTelemetry() };
  },

  getMaintenanceStats: async () => {
    await delay(100);
    return { data: localStore.getMaintenanceStats() };
  },

  getDashboardStats: async () => {
    await delay(100);
    const stats = localStore.getMaintenanceStats();
    return {
      data: {
        criticalAlerts: stats.overdue,
        warningAlerts: stats.upcoming,
        healthyVehicles: localStore.getVehicles().filter((v) => v.status === 'ACTIVE').length - stats.upcoming - stats.overdue,
        avgTemperature: 88,
        avgFuelLevel: localStore.getVehicleStats().avgFuelLevel,
      },
    };
  },
};

export default {
  vehicleAPI,
  authAPI,
  customerAPI,
  driverAPI,
  dashboardAPI,
  telemetryAPI,
};

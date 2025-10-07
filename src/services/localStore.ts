interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'FLEET_MANAGER' | 'DRIVER' | 'CUSTOMER';
  phone?: string;
}

interface Vehicle {
  id: string;
  registrationNumber: string;
  type: string;
  model: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  assignedDriverId?: string;
  currentLocationLat?: number;
  currentLocationLng?: number;
  fuelLevel: number;
  mileage: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  capacity: number;
  createdAt: string;
  updatedAt: string;
}

interface VehicleTelemetry {
  id: string;
  vehicleId: string;
  speed: number;
  fuelLevel: number;
  engineTemperature: number;
  tirePressure: number;
  locationLat: number;
  locationLng: number;
  odometer: number;
  batteryVoltage: number;
  coolantTemperature: number;
  oilPressure: number;
  timestamp: string;
}

interface Booking {
  id: string;
  customerId: string;
  vehicleId?: string;
  pickupLocation: string;
  deliveryLocation: string;
  pickupLat?: number;
  pickupLng?: number;
  deliveryLat?: number;
  deliveryLng?: number;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduledPickupTime?: string;
  actualPickupTime?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  cargoWeight?: number;
  cargoDescription?: string;
  price?: number;
  rating?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEYS = {
  VEHICLES: 'neurofleetx_vehicles',
  TELEMETRY: 'neurofleetx_telemetry',
  BOOKINGS: 'neurofleetx_bookings',
  CURRENT_USER: 'neurofleetx_current_user',
};

class LocalStore {
  private telemetrySimulation: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeData();
    this.startTelemetrySimulation();
  }

  private initializeData() {
    if (!localStorage.getItem(STORAGE_KEYS.VEHICLES)) {
      const initialVehicles: Vehicle[] = [
        {
          id: '1',
          registrationNumber: 'TRK-001',
          type: 'TRUCK',
          model: 'Volvo FH16',
          status: 'ACTIVE',
          currentLocationLat: 40.7128,
          currentLocationLng: -74.0060,
          fuelLevel: 85,
          mileage: 125000,
          lastMaintenanceDate: '2024-09-15',
          nextMaintenanceDate: '2024-11-15',
          capacity: 25,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          registrationNumber: 'VAN-002',
          type: 'VAN',
          model: 'Mercedes Sprinter',
          status: 'ACTIVE',
          currentLocationLat: 40.7589,
          currentLocationLng: -73.9851,
          fuelLevel: 65,
          mileage: 85000,
          lastMaintenanceDate: '2024-09-20',
          nextMaintenanceDate: '2024-11-20',
          capacity: 3.5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          registrationNumber: 'TRK-003',
          type: 'TRUCK',
          model: 'Scania R500',
          status: 'MAINTENANCE',
          currentLocationLat: 40.7282,
          currentLocationLng: -73.7949,
          fuelLevel: 45,
          mileage: 150000,
          lastMaintenanceDate: '2024-10-01',
          nextMaintenanceDate: '2024-10-15',
          capacity: 28,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(initialVehicles));
    }

    if (!localStorage.getItem(STORAGE_KEYS.TELEMETRY)) {
      const vehicles = this.getVehicles();
      const initialTelemetry: VehicleTelemetry[] = vehicles.map((v) => ({
        id: `tel-${v.id}`,
        vehicleId: v.id,
        speed: Math.random() * 80,
        fuelLevel: v.fuelLevel,
        engineTemperature: 85 + Math.random() * 10,
        tirePressure: 30 + Math.random() * 5,
        locationLat: v.currentLocationLat || 40.7128,
        locationLng: v.currentLocationLng || -74.0060,
        odometer: v.mileage,
        batteryVoltage: 12.5 + Math.random() * 0.5,
        coolantTemperature: 80 + Math.random() * 10,
        oilPressure: 28 + Math.random() * 4,
        timestamp: new Date().toISOString(),
      }));
      localStorage.setItem(STORAGE_KEYS.TELEMETRY, JSON.stringify(initialTelemetry));
    }
  }

  private startTelemetrySimulation() {
    this.telemetrySimulation = setInterval(() => {
      const vehicles = this.getVehicles();
      const telemetry = vehicles
        .filter((v) => v.status === 'ACTIVE')
        .map((v) => {
          const prevTelemetry = this.getTelemetryByVehicleId(v.id);
          return {
            id: `tel-${v.id}-${Date.now()}`,
            vehicleId: v.id,
            speed: Math.max(0, (prevTelemetry?.speed || 50) + (Math.random() - 0.5) * 10),
            fuelLevel: Math.max(0, (prevTelemetry?.fuelLevel || v.fuelLevel) - Math.random() * 0.1),
            engineTemperature: 85 + Math.random() * 10,
            tirePressure: 30 + Math.random() * 5,
            locationLat: (prevTelemetry?.locationLat || v.currentLocationLat || 40.7128) + (Math.random() - 0.5) * 0.001,
            locationLng: (prevTelemetry?.locationLng || v.currentLocationLng || -74.0060) + (Math.random() - 0.5) * 0.001,
            odometer: (prevTelemetry?.odometer || v.mileage) + Math.random() * 0.5,
            batteryVoltage: 12.5 + Math.random() * 0.5,
            coolantTemperature: 80 + Math.random() * 10,
            oilPressure: 28 + Math.random() * 4,
            timestamp: new Date().toISOString(),
          };
        });

      localStorage.setItem(STORAGE_KEYS.TELEMETRY, JSON.stringify(telemetry));

      vehicles.forEach((v) => {
        const tel = telemetry.find((t) => t.vehicleId === v.id);
        if (tel) {
          v.currentLocationLat = tel.locationLat;
          v.currentLocationLng = tel.locationLng;
          v.fuelLevel = tel.fuelLevel;
          v.updatedAt = new Date().toISOString();
        }
      });
      localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));

      window.dispatchEvent(new CustomEvent('telemetry-update', { detail: telemetry }));
    }, 3000);
  }

  stopTelemetrySimulation() {
    if (this.telemetrySimulation) {
      clearInterval(this.telemetrySimulation);
      this.telemetrySimulation = null;
    }
  }

  getVehicles(): Vehicle[] {
    const data = localStorage.getItem(STORAGE_KEYS.VEHICLES);
    return data ? JSON.parse(data) : [];
  }

  getVehicleById(id: string): Vehicle | undefined {
    return this.getVehicles().find((v) => v.id === id);
  }

  createVehicle(vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Vehicle {
    const vehicles = this.getVehicles();
    const newVehicle: Vehicle = {
      ...vehicle,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    vehicles.push(newVehicle);
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
    return newVehicle;
  }

  updateVehicle(id: string, updates: Partial<Vehicle>): Vehicle | null {
    const vehicles = this.getVehicles();
    const index = vehicles.findIndex((v) => v.id === id);
    if (index === -1) return null;

    vehicles[index] = {
      ...vehicles[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
    return vehicles[index];
  }

  deleteVehicle(id: string): boolean {
    const vehicles = this.getVehicles();
    const filtered = vehicles.filter((v) => v.id !== id);
    if (filtered.length === vehicles.length) return false;
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(filtered));
    return true;
  }

  getTelemetry(): VehicleTelemetry[] {
    const data = localStorage.getItem(STORAGE_KEYS.TELEMETRY);
    return data ? JSON.parse(data) : [];
  }

  getTelemetryByVehicleId(vehicleId: string): VehicleTelemetry | undefined {
    return this.getTelemetry().find((t) => t.vehicleId === vehicleId);
  }

  getVehicleStats() {
    const vehicles = this.getVehicles();
    const telemetry = this.getTelemetry();

    const active = vehicles.filter((v) => v.status === 'ACTIVE').length;
    const maintenance = vehicles.filter((v) => v.status === 'MAINTENANCE').length;
    const inactive = vehicles.filter((v) => v.status === 'INACTIVE').length;

    const avgFuelLevel = vehicles.reduce((sum, v) => sum + v.fuelLevel, 0) / vehicles.length;
    const totalMileage = vehicles.reduce((sum, v) => sum + v.mileage, 0);

    return {
      total: vehicles.length,
      active,
      maintenance,
      inactive,
      avgFuelLevel: Math.round(avgFuelLevel),
      totalMileage: Math.round(totalMileage),
    };
  }

  getMaintenanceStats() {
    const vehicles = this.getVehicles();
    const now = new Date();

    const upcoming = vehicles.filter((v) => {
      if (!v.nextMaintenanceDate) return false;
      const nextDate = new Date(v.nextMaintenanceDate);
      const daysUntil = (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysUntil <= 30 && daysUntil > 0;
    }).length;

    const overdue = vehicles.filter((v) => {
      if (!v.nextMaintenanceDate) return false;
      const nextDate = new Date(v.nextMaintenanceDate);
      return nextDate < now;
    }).length;

    return {
      inMaintenance: vehicles.filter((v) => v.status === 'MAINTENANCE').length,
      upcoming,
      overdue,
    };
  }

  getBookings(): Booking[] {
    const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    return data ? JSON.parse(data) : [];
  }

  getCurrentUser(): User | null {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  }

  setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }
}

export const localStore = new LocalStore();
export type { Vehicle, VehicleTelemetry, Booking, User };

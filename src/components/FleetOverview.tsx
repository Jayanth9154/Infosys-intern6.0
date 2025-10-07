import React, { useState, useEffect } from 'react';
import { Car, Truck, Clock, Zap, TrendingUp, MapPin, Fuel, Users, Wrench, AlertTriangle } from 'lucide-react';
import { vehicleAPI, telemetryAPI } from '../services/api';

interface Vehicle {
  id: string;
  registrationNumber: string;
  type: string;
  model: string;
  status: string;
  fuelLevel: number;
  mileage: number;
  nextMaintenanceDate?: string;
  currentLocationLat?: number;
  currentLocationLng?: number;
}

interface VehicleStats {
  total: number;
  active: number;
  maintenance: number;
  inactive: number;
  avgFuelLevel: number;
  totalMileage: number;
}

interface MaintenanceStats {
  inMaintenance: number;
  upcoming: number;
  overdue: number;
}

const FleetOverview: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stats, setStats] = useState<VehicleStats | null>(null);
  const [maintenanceStats, setMaintenanceStats] = useState<MaintenanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();

    const telemetryListener = () => {
      fetchData();
    };

    window.addEventListener('telemetry-update', telemetryListener);

    const intervalId = setInterval(fetchData, 10000);

    return () => {
      window.removeEventListener('telemetry-update', telemetryListener);
      clearInterval(intervalId);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [vehiclesResponse, statsResponse, maintenanceResponse] = await Promise.all([
        vehicleAPI.getAllVehicles(),
        vehicleAPI.getVehicleStats(),
        telemetryAPI.getMaintenanceStats(),
      ]);

      setVehicles(vehiclesResponse.data);
      setStats(statsResponse.data);
      setMaintenanceStats(maintenanceResponse.data);
    } catch (error) {
      console.error('Error fetching fleet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'MAINTENANCE':
        return 'bg-orange-100 text-orange-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMaintenanceStatus = (vehicle: Vehicle) => {
    if (!vehicle.nextMaintenanceDate) return 'unknown';

    const nextDate = new Date(vehicle.nextMaintenanceDate);
    const now = new Date();
    const daysUntil = (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 7) return 'due-soon';
    return 'good';
  };

  const getMaintenanceColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'text-red-600';
      case 'due-soon':
        return 'text-orange-600';
      case 'good':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const activeVehicles = vehicles.filter((v) => v.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-teal-100 p-3 rounded-xl">
                <Car className="w-6 h-6 text-teal-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.active}</div>
            <div className="text-sm text-gray-600">Active Vehicles</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.totalMileage.toLocaleString()} km</div>
            <div className="text-sm text-gray-600">Total Distance</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-xl">
                <Fuel className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.avgFuelLevel}%</div>
            <div className="text-sm text-gray-600">Avg Fuel Level</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-xl">
                <Wrench className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.maintenance}</div>
            <div className="text-sm text-gray-600">In Maintenance</div>
          </div>
        </div>
      )}

      {maintenanceStats && (
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-6 border border-teal-100">
          <div className="flex items-center mb-4">
            <div className="bg-gradient-to-r from-teal-500 to-blue-500 p-2 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">Fleet Insights</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/70 rounded-xl p-4">
              <div className="flex items-center mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <h4 className="font-medium text-gray-900">Maintenance Overdue</h4>
              </div>
              <p className="text-2xl font-bold text-red-600">{maintenanceStats.overdue}</p>
              <p className="text-sm text-gray-600">vehicles need immediate attention</p>
            </div>
            <div className="bg-white/70 rounded-xl p-4">
              <div className="flex items-center mb-2">
                <Clock className="w-5 h-5 text-orange-600 mr-2" />
                <h4 className="font-medium text-gray-900">Upcoming Maintenance</h4>
              </div>
              <p className="text-2xl font-bold text-orange-600">{maintenanceStats.upcoming}</p>
              <p className="text-sm text-gray-600">vehicles due within 30 days</p>
            </div>
            <div className="bg-white/70 rounded-xl p-4">
              <div className="flex items-center mb-2">
                <Fuel className="w-5 h-5 text-green-600 mr-2" />
                <h4 className="font-medium text-gray-900">Avg Fuel Efficiency</h4>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats?.avgFuelLevel}%</p>
              <p className="text-sm text-gray-600">across all active vehicles</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Active Fleet Status</h3>
          <p className="text-sm text-gray-600">
            {activeVehicles.length} active vehicles out of {vehicles.length} total
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {activeVehicles.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No active vehicles</h3>
              <p className="text-gray-600">Add vehicles to your fleet to see them here</p>
            </div>
          ) : (
            activeVehicles.map((vehicle) => {
              const maintenanceStatus = getMaintenanceStatus(vehicle);
              return (
                <div key={vehicle.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-teal-100 p-3 rounded-xl">
                        {vehicle.type.includes('TRUCK') ? (
                          <Truck className="w-5 h-5 text-teal-600" />
                        ) : (
                          <Car className="w-5 h-5 text-teal-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{vehicle.registrationNumber}</div>
                        <div className="text-sm text-gray-600">{vehicle.model}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{vehicle.type}</div>
                        <div className="text-xs text-gray-600">Type</div>
                      </div>

                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{vehicle.mileage.toFixed(0)} km</div>
                        <div className="text-xs text-gray-600">Mileage</div>
                      </div>

                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{vehicle.fuelLevel.toFixed(0)}%</div>
                        <div className="text-xs text-gray-600">Fuel</div>
                      </div>

                      <div className="text-center">
                        <div className={`text-sm font-medium flex items-center ${getMaintenanceColor(maintenanceStatus)}`}>
                          <Wrench className="w-4 h-4 mr-1" />
                          {maintenanceStatus === 'overdue' && 'Overdue'}
                          {maintenanceStatus === 'due-soon' && 'Due Soon'}
                          {maintenanceStatus === 'good' && 'Good'}
                          {maintenanceStatus === 'unknown' && 'N/A'}
                        </div>
                        <div className="text-xs text-gray-600">Maintenance</div>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                        {vehicle.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default FleetOverview;

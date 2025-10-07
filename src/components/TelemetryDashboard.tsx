import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  Activity,
  Fuel,
  Battery,
  Gauge,
  AlertTriangle,
  CheckCircle,
  Clock,
  Car,
  Truck,
  Thermometer,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { telemetryAPI, vehicleAPI } from '../services/api';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface TelemetryData {
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

interface DashboardStats {
  criticalAlerts: number;
  warningAlerts: number;
  healthyVehicles: number;
  avgTemperature: number;
  avgFuelLevel: number;
}

const TelemetryDashboard: React.FC = () => {
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchInitialData();

    const telemetryListener = (e: Event) => {
      const customEvent = e as CustomEvent;
      setTelemetryData(customEvent.detail);
      setLastUpdate(new Date());
    };

    window.addEventListener('telemetry-update', telemetryListener);

    const intervalId = setInterval(fetchInitialData, 10000);

    return () => {
      window.removeEventListener('telemetry-update', telemetryListener);
      clearInterval(intervalId);
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      const [telemetryResponse, statsResponse] = await Promise.all([
        telemetryAPI.getLatestTelemetry(),
        telemetryAPI.getDashboardStats()
      ]);

      setTelemetryData(telemetryResponse.data);
      setDashboardStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching telemetry data:', error);
      toast.error('Failed to load telemetry data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await fetchInitialData();
  };

  const getHealthStatus = (telemetry: TelemetryData) => {
    if (
      telemetry.fuelLevel < 20 ||
      telemetry.engineTemperature > 100 ||
      telemetry.batteryVoltage < 12.0 ||
      telemetry.oilPressure < 25
    ) {
      return 'CRITICAL';
    }
    if (
      telemetry.fuelLevel < 40 ||
      telemetry.engineTemperature > 95 ||
      telemetry.batteryVoltage < 12.3
    ) {
      return 'WARNING';
    }
    return 'HEALTHY';
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'text-green-600 bg-green-100';
      case 'WARNING':
        return 'text-orange-600 bg-orange-100';
      case 'CRITICAL':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return <CheckCircle className="w-4 h-4" />;
      case 'WARNING':
        return <Clock className="w-4 h-4" />;
      case 'CRITICAL':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const createVehicleIcon = (status: string, speed: number) => {
    const color = speed > 5 ? '#14b8a6' : status === 'CRITICAL' ? '#ef4444' : '#6b7280';
    const iconHtml = `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
      ">
        🚛
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: 'custom-vehicle-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  const filteredTelemetry = telemetryData.filter((telemetry) => {
    const status = getHealthStatus(telemetry);
    const matchesSearch = telemetry.vehicleId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vehicle Telemetry Dashboard</h2>
          <p className="text-gray-600">Real-time vehicle monitoring and analytics</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm text-gray-600">Live Updates</span>
          </div>
          <button
            onClick={refreshData}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <span className="text-2xl font-bold text-gray-900">{dashboardStats.criticalAlerts}</span>
            </div>
            <p className="text-sm text-gray-600">Critical Alerts</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold text-gray-900">{dashboardStats.warningAlerts}</span>
            </div>
            <p className="text-sm text-gray-600">Warning Alerts</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <span className="text-2xl font-bold text-gray-900">{dashboardStats.healthyVehicles}</span>
            </div>
            <p className="text-sm text-gray-600">Healthy Vehicles</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <Thermometer className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900">{dashboardStats.avgTemperature}°C</span>
            </div>
            <p className="text-sm text-gray-600">Avg Temperature</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <Fuel className="w-8 h-8 text-teal-500" />
              <span className="text-2xl font-bold text-gray-900">{dashboardStats.avgFuelLevel}%</span>
            </div>
            <p className="text-sm text-gray-600">Avg Fuel Level</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="ALL">All Status</option>
            <option value="HEALTHY">Healthy</option>
            <option value="WARNING">Warning</option>
            <option value="CRITICAL">Critical</option>
          </select>

          <div className="flex items-center text-sm text-gray-600">
            <Filter className="w-4 h-4 mr-2" />
            {filteredTelemetry.length} of {telemetryData.length} vehicles
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Vehicle Map</h3>
        <div className="h-96 rounded-lg overflow-hidden">
          <MapContainer center={[28.6139, 77.2090]} zoom={6} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {filteredTelemetry.map((telemetry) => (
              <Marker
                key={telemetry.vehicleId}
                position={[telemetry.locationLat, telemetry.locationLng]}
                icon={createVehicleIcon(getHealthStatus(telemetry), telemetry.speed)}
              >
                <Popup>
                  <div className="p-2">
                    <h4 className="font-semibold mb-2">{telemetry.vehicleId}</h4>
                    <div className="space-y-1 text-sm">
                      <p>Speed: {telemetry.speed.toFixed(1)} km/h</p>
                      <p>Fuel: {telemetry.fuelLevel.toFixed(1)}%</p>
                      <p>Engine Temp: {telemetry.engineTemperature.toFixed(1)}°C</p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTelemetry.map((telemetry) => {
          const status = getHealthStatus(telemetry);
          return (
            <div
              key={telemetry.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Truck className="w-6 h-6 text-teal-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{telemetry.vehicleId}</h3>
                    <p className="text-sm text-gray-500">
                      Updated {new Date(telemetry.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getHealthStatusColor(status)}`}>
                  {getHealthIcon(status)}
                  <span>{status}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-gray-600">
                    <Gauge className="w-4 h-4 mr-2" />
                    Speed
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{telemetry.speed.toFixed(1)} km/h</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center text-sm text-gray-600">
                    <Fuel className="w-4 h-4 mr-2" />
                    Fuel
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{telemetry.fuelLevel.toFixed(1)}%</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center text-sm text-gray-600">
                    <Thermometer className="w-4 h-4 mr-2" />
                    Engine Temp
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{telemetry.engineTemperature.toFixed(1)}°C</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center text-sm text-gray-600">
                    <Battery className="w-4 h-4 mr-2" />
                    Battery
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{telemetry.batteryVoltage.toFixed(1)}V</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center text-sm text-gray-600">
                    <Activity className="w-4 h-4 mr-2" />
                    Tire Pressure
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{telemetry.tirePressure.toFixed(1)} PSI</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center text-sm text-gray-600">
                    <Gauge className="w-4 h-4 mr-2" />
                    Oil Pressure
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{telemetry.oilPressure.toFixed(1)} PSI</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTelemetry.length === 0 && (
        <div className="text-center py-12">
          <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No telemetry data found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default TelemetryDashboard;

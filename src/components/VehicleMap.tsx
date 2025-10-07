import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Clock, Car, Truck, AlertCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const VehicleMap: React.FC = () => {
  const [vehicles, setVehicles] = useState([
    { 
      id: 'FL-001', 
      type: 'van', 
      lat: 28.6139, 
      lng: 77.2090, 
      status: 'moving', 
      speed: '45 km/h', 
      destination: 'Connaught Place',
      driver: 'Rajesh Kumar'
    },
    { 
      id: 'FL-002', 
      type: 'truck', 
      lat: 28.4595, 
      lng: 77.0266, 
      status: 'stopped', 
      speed: '0 km/h', 
      destination: 'Gurgaon Cyber City',
      driver: 'Priya Sharma'
    },
    { 
      id: 'FL-003', 
      type: 'van', 
      lat: 28.5355, 
      lng: 77.3910, 
      status: 'moving', 
      speed: '32 km/h', 
      destination: 'Noida Sector 62',
      driver: 'Amit Singh'
    },
    { 
      id: 'FL-004', 
      type: 'truck', 
      lat: 12.9716, 
      lng: 77.5946, 
      status: 'loading', 
      speed: '0 km/h', 
      destination: 'Bangalore Whitefield',
      driver: 'Sneha Patel'
    },
  ]);

  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const alerts = [
    { id: 1, type: 'traffic', message: 'Heavy traffic on Delhi-Gurgaon Expressway', severity: 'warning' },
    { id: 2, type: 'weather', message: 'Monsoon expected in Mumbai region', severity: 'info' },
    { id: 3, type: 'maintenance', message: 'FL-005 requires immediate service', severity: 'error' },
  ];

  // Custom vehicle icons
  const createVehicleIcon = (status: string, type: string) => {
    const color = status === 'moving' ? '#10b981' : status === 'stopped' ? '#ef4444' : '#f59e0b';
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
        ${type === 'truck' ? '🚛' : '🚐'}
      </div>
    `;
    
    return L.divIcon({
      html: iconHtml,
      className: 'custom-vehicle-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  // Route polylines for demonstration
  const routeCoordinates = [
    [
      [28.6139, 77.2090], // Delhi
      [28.5355, 77.3910], // Noida
    ],
    [
      [28.4595, 77.0266], // Gurgaon
      [28.6139, 77.2090], // Delhi
    ],
  ];

  // Function to simulate real-time vehicle updates
  const refreshMapData = async () => {
    setIsRefreshing(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update vehicle positions with small random movements
    setVehicles(prevVehicles => 
      prevVehicles.map(vehicle => {
        const latOffset = (Math.random() - 0.5) * 0.01; // Small random movement
        const lngOffset = (Math.random() - 0.5) * 0.01;
        const speedVariation = Math.random() * 10 - 5; // ±5 km/h variation
        
        let newSpeed = vehicle.speed;
        if (vehicle.status === 'moving') {
          const currentSpeed = parseInt(vehicle.speed);
          const newSpeedValue = Math.max(0, currentSpeed + speedVariation);
          newSpeed = `${Math.round(newSpeedValue)} km/h`;
        }
        
        // Randomly change status for some vehicles
        let newStatus = vehicle.status;
        if (Math.random() < 0.1) { // 10% chance to change status
          const statuses = ['moving', 'stopped', 'loading'];
          newStatus = statuses[Math.floor(Math.random() * statuses.length)];
          if (newStatus === 'stopped' || newStatus === 'loading') {
            newSpeed = '0 km/h';
          }
        }
        
        return {
          ...vehicle,
          lat: vehicle.lat + latOffset,
          lng: vehicle.lng + lngOffset,
          speed: newSpeed,
          status: newStatus
        };
      })
    );
    
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshMapData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Map Container */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-teal-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Live Fleet Tracking</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">
                    Last updated: {lastRefresh.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Real Map */}
            <div className="h-96">
              <MapContainer
                center={[28.6139, 77.2090]} // Delhi center
                zoom={6}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Vehicle Markers */}
                {vehicles.map((vehicle) => (
                  <Marker
                    key={vehicle.id}
                    position={[vehicle.lat, vehicle.lng]}
                    icon={createVehicleIcon(vehicle.status, vehicle.type)}
                  >
                    <Popup>
                      <div className="p-2">
                        <div className="font-semibold text-gray-900 mb-1">{vehicle.id}</div>
                        <div className="text-sm text-gray-600 mb-1">Driver: {vehicle.driver}</div>
                        <div className="text-sm text-gray-600 mb-1">Speed: {vehicle.speed}</div>
                        <div className="text-sm text-gray-600 mb-1">Destination: {vehicle.destination}</div>
                        <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          vehicle.status === 'moving' ? 'bg-green-100 text-green-800' :
                          vehicle.status === 'stopped' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Route Lines */}
                {routeCoordinates.map((route, index) => (
                  <Polyline
                    key={index}
                    positions={route}
                    pathOptions={{
                      color: index % 2 === 0 ? '#8b5cf6' : '#14b8a6',
                      weight: 3,
                      opacity: 0.7,
                      dashArray: '10, 10'
                    }}
                  />
                ))}
              </MapContainer>
            </div>

            {/* Map Controls */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Moving</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Stopped</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Loading</span>
                  </div>
                </div>
                <button 
                  onClick={refreshMapData}
                  disabled={isRefreshing}
                  className="bg-gradient-to-r from-purple-600 to-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isRefreshing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Refreshing...</span>
                    </>
                  ) : (
                    <span>Refresh Map</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Vehicle List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Active Vehicles</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        vehicle.status === 'moving' ? 'bg-green-500' :
                        vehicle.status === 'stopped' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className="font-medium text-gray-900">{vehicle.id}</span>
                    </div>
                    <span className="text-sm text-gray-600">{vehicle.speed}</span>
                  </div>
                  <div className="text-sm text-gray-600 flex items-center mb-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {vehicle.destination}
                  </div>
                  <div className="text-xs text-gray-500">
                    Driver: {vehicle.driver}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Traffic & Weather */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Live Conditions</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Heavy Traffic</div>
                    <div className="text-xs text-gray-500">NH-8 Delhi-Gurgaon</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Navigation className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Clear Roads</div>
                    <div className="text-xs text-gray-500">Noida Expressway</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Peak Hours</div>
                    <div className="text-xs text-gray-500">Expected 6-8 PM</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Live Alerts</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {alerts.map((alert) => (
                <div key={alert.id} className="px-6 py-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className={`w-5 h-5 mt-0.5 ${
                      alert.severity === 'error' ? 'text-red-500' :
                      alert.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                    }`} />
                    <div>
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {alert.message}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        2 min ago
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleMap;
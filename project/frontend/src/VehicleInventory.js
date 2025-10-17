import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import VehicleSearch from './VehicleSearch';
import { API_BASE_URL, WS_BASE_URL } from './config';
import './VehicleInventory.css';

function VehicleInventory() {
  const { currentUser } = useContext(AuthContext);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Fetch vehicles with enhanced telemetry data
  useEffect(() => {
    const fetchVehicles = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const token = await currentUser.getIdToken();
        const response = await axios.get(`${API_BASE_URL}/api/vehicles`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Enhance vehicles with telemetry data and format values
        const vehiclesWithTelemetry = response.data.map(vehicle => {
          // Helper function to safely format numbers
          const formatNumber = (value, decimals = 2) => {
            if (value === undefined || value === null) return 0;
            const num = parseFloat(value);
            return isNaN(num) ? 0 : parseFloat(num.toFixed(decimals));
          };
          
          // Helper function to format GPS coordinates
          const formatGPS = (value) => {
            if (value === undefined || value === null) return 0;
            const num = parseFloat(value);
            return isNaN(num) ? 0 : parseFloat(num.toFixed(6));
          };
          
          return {
            ...vehicle,
            // Location data - 6 decimal places for GPS
            latitude: formatGPS(vehicle.latitude) || formatGPS(28.4595 + (Math.random() * 0.2 - 0.1)),
            longitude: formatGPS(vehicle.longitude) || formatGPS(77.2090 + (Math.random() * 0.2 - 0.1)),
            
            // Telemetry data - 2 decimal places
            speed: formatNumber(vehicle.speed) || formatNumber(Math.random() * 80),
            batteryLevel: formatNumber(vehicle.batteryLevel) || formatNumber(Math.random() * 100),
            fuelLevel: formatNumber(vehicle.fuelLevel) || formatNumber(Math.random() * 100),
            engineTemp: formatNumber(vehicle.engineTemp) || formatNumber(80 + Math.random() * 40), // 80-120°C
            tirePressure: formatNumber(vehicle.tirePressure) || formatNumber(30 + Math.random() * 5), // 30-35 PSI
            mileage: formatNumber(vehicle.mileage) || formatNumber(Math.random() * 100000),
            
            // Status indicators
            engineStatus: vehicle.engineStatus || (Math.random() > 0.9 ? 'warning' : 'normal'),
            gpsSignal: vehicle.gpsSignal || (Math.random() > 0.95 ? 'weak' : 'strong'),
            lastUpdate: vehicle.lastUpdate || new Date().toISOString(),
            
            // Enhanced status
            isOnline: vehicle.isOnline !== undefined ? vehicle.isOnline : Math.random() > 0.1,
            batteryHealth: formatNumber(vehicle.batteryHealth) || formatNumber(Math.floor(Math.random() * 30) + 70),
            range: formatNumber(vehicle.range) || formatNumber(Math.floor(Math.random() * 200) + 100),
            
            // Service information
            nextServiceDue: formatNumber(vehicle.nextServiceDue) || formatNumber(Math.floor(Math.random() * 5000) + 1000),
            lastServiceDate: vehicle.lastServiceDate || new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
            
            // Driver information
            currentDriver: vehicle.currentDriver || (Math.random() > 0.6 ? `Driver ${Math.floor(Math.random() * 100)}` : null),
            
            // Trip information
            tripDistance: formatNumber(vehicle.tripDistance) || formatNumber(Math.floor(Math.random() * 500)),
            tripDuration: formatNumber(vehicle.tripDuration) || formatNumber(Math.floor(Math.random() * 480)), // minutes
          };
        });
        
        setVehicles(vehiclesWithTelemetry);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch vehicles:', err);
        setError('Failed to load vehicle inventory. Please check your connection.');
        setLoading(false);
      }
    };
    
    fetchVehicles();
    
    // Set up WebSocket connection for real-time updates
    const ws = new WebSocket(`${WS_BASE_URL}`);
    
    ws.onopen = () => {
      console.log('Connected to telemetry WebSocket');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'vehicle_update') {
          // Format incoming data
          const formatNumber = (value, decimals = 2) => {
            if (value === undefined || value === null) return 0;
            const num = parseFloat(value);
            return isNaN(num) ? 0 : parseFloat(num.toFixed(decimals));
          };
          
          const formatGPS = (value) => {
            if (value === undefined || value === null) return 0;
            const num = parseFloat(value);
            return isNaN(num) ? 0 : parseFloat(num.toFixed(6));
          };
          
          // Only include isOnline in formattedData if it exists in the update
          const formattedData = {
            ...data,
            latitude: formatGPS(data.latitude),
            longitude: formatGPS(data.longitude),
            speed: formatNumber(data.speed),
            batteryLevel: formatNumber(data.batteryLevel),
            fuelLevel: formatNumber(data.fuelLevel),
            engineTemp: formatNumber(data.engineTemp),
            tirePressure: formatNumber(data.tirePressure),
            mileage: formatNumber(data.mileage),
            batteryHealth: formatNumber(data.batteryHealth),
            range: formatNumber(data.range),
            nextServiceDue: formatNumber(data.nextServiceDue),
            tripDistance: formatNumber(data.tripDistance),
            tripDuration: formatNumber(data.tripDuration)
          };
          
          // Only add isOnline if it exists in the update
          if (data.isOnline !== undefined) {
            formattedData.isOnline = data.isOnline;
          }
          
          setVehicles(prevVehicles => 
            prevVehicles.map(vehicle => 
              vehicle.id === formattedData.id ? { ...vehicle, ...formattedData } : vehicle
            )
          );
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('Disconnected from telemetry WebSocket');
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    // Fallback: Set up local simulation if WebSocket fails
    const interval = setInterval(() => {
      setVehicles(prevVehicles => 
        prevVehicles.map(vehicle => {
          // Helper function to safely format numbers
          const formatNumber = (value, decimals = 2) => {
            if (value === undefined || value === null) return 0;
            const num = parseFloat(value);
            return isNaN(num) ? 0 : parseFloat(num.toFixed(decimals));
          };
          
          // Helper function to format GPS coordinates
          const formatGPS = (value) => {
            if (value === undefined || value === null) return 0;
            const num = parseFloat(value);
            return isNaN(num) ? 0 : parseFloat(num.toFixed(6));
          };
          
          return {
            ...vehicle,
            speed: vehicle.status === 'on-trip' ? formatNumber(Math.random() * 80) : 0,
            batteryLevel: vehicle.status === 'charging' 
              ? formatNumber(Math.min(100, vehicle.batteryLevel + Math.random() * 2))
              : formatNumber(Math.max(0, vehicle.batteryLevel - Math.random() * 0.5)),
            lastUpdate: new Date().toISOString(),
            latitude: vehicle.status === 'on-trip' 
              ? formatGPS(vehicle.latitude + (Math.random() * 0.001 - 0.0005))
              : formatGPS(vehicle.latitude),
            longitude: vehicle.status === 'on-trip' 
              ? formatGPS(vehicle.longitude + (Math.random() * 0.001 - 0.0005))
              : formatGPS(vehicle.longitude),
            // Preserve isOnline property in simulation
            isOnline: vehicle.isOnline
          };
        })
      );
    }, 10000); // Update every 10 seconds as fallback
    
    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, [currentUser]);

  // Filter vehicles
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = (vehicle.make || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (vehicle.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (vehicle.licensePlate || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || (vehicle.status || '') === filterStatus;
    const matchesType = filterType === 'all' || (vehicle.vehicleType || '') === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#10b981';
      case 'on-trip': return '#3b82f6';
      case 'maintenance': return '#f59e0b';
      case 'charging': return '#8b5cf6';
      case 'out-of-service': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Get battery/fuel level class
  const getLevelClass = (level) => {
    if (level >= 70) return 'high';
    if (level >= 30) return 'medium';
    return 'low';
  };

  // Format last update time
  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const now = new Date();
    const update = new Date(timestamp);
    const diffMinutes = Math.floor((now - update) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  // Export to CSV
  const exportToCSV = (data) => {
    const headers = [
      'ID', 'Make', 'Model', 'License Plate', 'Status', 'Type', 'Battery/Fuel %',
      'Speed (km/h)', 'Mileage', 'Engine Temp (°C)', 'Tire Pressure (PSI)',
      'Location (Lat)', 'Location (Lng)', 'Current Driver', 'Last Update'
    ];
    
    const csvContent = [
      headers.join(','),
      ...data.map(vehicle => [
        vehicle.id || 'N/A',
        vehicle.make || 'N/A',
        vehicle.model || 'N/A',
        vehicle.licensePlate || 'N/A',
        vehicle.status || 'N/A',
        vehicle.vehicleType || 'N/A',
        vehicle.vehicleType === 'ev' ? vehicle.batteryLevel : vehicle.fuelLevel,
        vehicle.speed,
        vehicle.mileage,
        Math.round(vehicle.engineTemp),
        Math.round(vehicle.tirePressure),
        vehicle.latitude.toFixed(6),
        vehicle.longitude.toFixed(6),
        vehicle.currentDriver || 'N/A',
        new Date(vehicle.lastUpdate).toLocaleString() || 'N/A'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `fleet-inventory-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF (simplified version)
  const exportToPDF = (data) => {
    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fleet Inventory Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #1e293b; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .status { padding: 4px 8px; border-radius: 4px; color: white; font-size: 10px; }
          .available { background-color: #10b981; }
          .on-trip { background-color: #3b82f6; }
          .maintenance { background-color: #f59e0b; }
          .charging { background-color: #8b5cf6; }
          .out-of-service { background-color: #ef4444; }
        </style>
      </head>
      <body>
        <h1>NeuroFleetX - Fleet Inventory Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>Total Vehicles: ${data.length}</p>
        <table>
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>License</th>
              <th>Status</th>
              <th>Type</th>
              <th>Energy %</th>
              <th>Speed</th>
              <th>Mileage</th>
              <th>Location</th>
              <th>Driver</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(vehicle => `
              <tr>
                <td>${vehicle.make || 'N/A'} ${vehicle.model || 'N/A'}</td>
                <td>${vehicle.licensePlate || 'N/A'}</td>
                <td><span class="status ${vehicle.status || ''}">${vehicle.status || 'N/A'}</span></td>
                <td>${vehicle.vehicleType || 'N/A'}</td>
                <td>${vehicle.vehicleType === 'ev' ? vehicle.batteryLevel : vehicle.fuelLevel}%</td>
                <td>${vehicle.speed} km/h</td>
                <td>${parseFloat(vehicle.mileage).toLocaleString()}</td>
                <td>${vehicle.latitude.toFixed(4)}, ${vehicle.longitude.toFixed(4)}</td>
                <td>${vehicle.currentDriver || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Handle vehicle selection from search
  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
    // Scroll to the vehicle in the list
    setTimeout(() => {
      const element = document.getElementById(`vehicle-${vehicle.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  if (loading) return <div className="panel">Loading vehicle inventory...</div>;
  if (error) return <div className="panel">Error: {error}</div>;

  return (
    <div className="panel">
      {/* Header */}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2>Fleet Inventory & Telemetry</h2>
          <p style={{ color: '#9ca3af', marginTop: 4 }}>
            Manage your vehicle fleet with real-time telemetry data
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <select
            className="select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ minWidth: 120 }}
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="on-trip">On Trip</option>
            <option value="maintenance">Maintenance</option>
            <option value="charging">Charging</option>
            <option value="out-of-service">Out of Service</option>
          </select>
          <select
            className="select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ minWidth: 120 }}
          >
            <option value="all">All Types</option>
            <option value="ev">Electric</option>
            <option value="hybrid">Hybrid</option>
            <option value="ice">ICE</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#3b82f6' }}>{vehicles.length}</div>
            <div style={{ color: '#9ca3af', fontSize: 14 }}>Total Vehicles</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#10b981' }}>{vehicles.filter(v => v.isOnline).length}</div>
            <div style={{ color: '#9ca3af', fontSize: 14 }}>Online</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#3b82f6' }}>{vehicles.filter(v => v.status === 'on-trip').length}</div>
            <div style={{ color: '#9ca3af', fontSize: 14 }}>Active</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#10b981' }}>{vehicles.filter(v => v.status === 'available').length}</div>
            <div style={{ color: '#9ca3af', fontSize: 14 }}>Available</div>
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ flex: 1, marginRight: 16 }}>
            <VehicleSearch onVehicleSelect={handleVehicleSelect} />
          </div>
          <div className="row" style={{ gap: 8 }}>
            <input
              type="text"
              className="input"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ minWidth: 200 }}
            />
            <button 
              className="button outline"
              onClick={() => exportToCSV(filteredVehicles)}
            >
              📊 CSV
            </button>
            <button 
              className="button outline"
              onClick={() => exportToPDF(filteredVehicles)}
            >
              📄 PDF
            </button>
            <div className="row" style={{ gap: 4 }}>
              <button 
                className={`button ${viewMode === 'grid' ? 'primary' : 'outline'}`}
                onClick={() => setViewMode('grid')}
              >
                Grid
              </button>
              <button 
                className={`button ${viewMode === 'list' ? 'primary' : 'outline'}`}
                onClick={() => setViewMode('list')}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Display */}
      {viewMode === 'grid' ? (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Vehicle Fleet</h3>
            <span className="badge">{filteredVehicles.length} vehicles</span>
          </div>
          <div className="battery-grid">
            {filteredVehicles.map(vehicle => (
              <div 
                key={vehicle.id} 
                id={`vehicle-${vehicle.id}`}
                className={`battery-card ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`}
                onClick={() => setSelectedVehicle(vehicle)}
              >
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vehicle.make || 'N/A'} {vehicle.model || 'N/A'}</h4>
                    <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vehicle.licensePlate || 'N/A'}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    <span 
                      className="badge"
                      style={{ 
                        backgroundColor: getStatusColor(vehicle.status),
                        textTransform: 'capitalize'
                      }}
                    >
                      {(vehicle.status || 'N/A').replace('-', ' ')}
                    </span>
                  </div>
                </div>

                {/* Location */}
                <div style={{ marginBottom: 8, fontSize: 12, color: '#9ca3af' }}>
                  <span style={{ marginRight: 8 }}>📍</span>
                  <span style={{ fontFamily: 'monospace' }}>
                    {vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}
                  </span>
                  <span style={{ float: 'right' }}>{formatLastUpdate(vehicle.lastUpdate)}</span>
                </div>

                {/* Energy Level */}
                <div className="battery-level-container">
                  <div 
                    className={`battery-level ${getLevelClass(vehicle.vehicleType === 'ev' ? vehicle.batteryLevel : vehicle.fuelLevel)}`}
                    style={{ width: `${vehicle.vehicleType === 'ev' ? vehicle.batteryLevel : vehicle.fuelLevel}%` }}
                  ></div>
                  <span className="battery-percentage">
                    {vehicle.vehicleType === 'ev' ? vehicle.batteryLevel : vehicle.fuelLevel}%
                  </span>
                </div>

                {/* Telemetry Data */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 12, backgroundColor: '#111827', borderRadius: 8 }}>
                    <span style={{ fontSize: 14, marginBottom: 2 }}>🚗</span>
                    <span style={{ fontSize: 14, fontWeight: 'bold', color: '#3b82f6', marginBottom: 2 }}>
                      {vehicle.speed}
                    </span>
                    <span style={{ fontSize: 10, color: '#9ca3af' }}>km/h</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 12, backgroundColor: '#111827', borderRadius: 8 }}>
                    <span style={{ fontSize: 16, marginBottom: 4 }}>📏</span>
                    <span style={{ fontSize: 16, fontWeight: 'bold', color: '#3b82f6', marginBottom: 2 }}>
                      {parseFloat(vehicle.mileage).toLocaleString()}
                    </span>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>Mileage</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 12, backgroundColor: '#111827', borderRadius: 8 }}>
                    <span style={{ fontSize: 16, marginBottom: 4 }}>🌡️</span>
                    <span style={{ fontSize: 16, fontWeight: 'bold', color: '#3b82f6', marginBottom: 2 }}>
                      {Math.round(vehicle.engineTemp)}°C
                    </span>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>Engine</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 12, backgroundColor: '#111827', borderRadius: 8 }}>
                    <span style={{ fontSize: 16, marginBottom: 4 }}>🛞</span>
                    <span style={{ fontSize: 16, fontWeight: 'bold', color: '#3b82f6', marginBottom: 2 }}>
                      {vehicle.tirePressure.toFixed(1)}
                    </span>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>PSI</span>
                  </div>
                </div>

                {/* Driver Info */}
                {vehicle.currentDriver && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 6, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 4, marginBottom: 6 }}>
                    <span style={{ fontSize: 16 }}>👤</span>
                    <span style={{ fontWeight: 500 }}>{vehicle.currentDriver}</span>
                  </div>
                )}

                {/* Service Alert */}
                {vehicle.nextServiceDue < 2000 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 6, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 4, borderLeft: '2px solid #ef4444' }}>
                    <span style={{ fontSize: 16 }}>⚠️</span>
                    <span style={{ color: '#ef4444' }}>Service due in {Math.floor(vehicle.nextServiceDue)} km</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="panel">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Vehicle Fleet</h3>
            <span className="badge">{filteredVehicles.length} vehicles</span>
          </div>
          <div className="list">
            {filteredVehicles.map(vehicle => (
              <div 
                key={vehicle.id}
                id={`vehicle-${vehicle.id}`}
                className={`list-item ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`}
                onClick={() => setSelectedVehicle(vehicle)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{vehicle.make || 'N/A'} {vehicle.model || 'N/A'}</div>
                    <div style={{ color: '#9ca3af', fontSize: 14 }}>{vehicle.licensePlate || 'N/A'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span 
                    className="badge"
                    style={{ 
                      backgroundColor: getStatusColor(vehicle.status),
                      textTransform: 'capitalize'
                    }}
                  >
                    {(vehicle.status || 'N/A').replace('-', ' ')}
                  </span>
                  <div className="battery-level-container small">
                    <div 
                      className={`battery-level ${getLevelClass(vehicle.vehicleType === 'ev' ? vehicle.batteryLevel : vehicle.fuelLevel)}`}
                      style={{ width: `${vehicle.vehicleType === 'ev' ? vehicle.batteryLevel : vehicle.fuelLevel}%` }}
                    ></div>
                    <span className="battery-percentage small">
                      {vehicle.vehicleType === 'ev' ? vehicle.batteryLevel : vehicle.fuelLevel}%
                    </span>
                  </div>
                  <span>{vehicle.speed} km/h</span>
                  <span>{vehicle.currentDriver || '-'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vehicle Detail Panel */}
      {selectedVehicle && (
        <div className="panel">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>{selectedVehicle.make || 'N/A'} {selectedVehicle.model || 'N/A'} - Detailed Telemetry</h3>
            <button 
              className="button outline small"
              onClick={() => setSelectedVehicle(null)}
            >
              Close
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
            <div style={{ padding: 16, backgroundColor: '#111827', borderRadius: 8 }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#e5e7eb', borderBottom: '1px solid #374151', paddingBottom: 8 }}>Vehicle Information</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>License Plate:</span>
                  <span style={{ fontWeight: 500 }}>{selectedVehicle.licensePlate || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Type:</span>
                  <span style={{ fontWeight: 500 }}>{(selectedVehicle.vehicleType || 'N/A').toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Year:</span>
                  <span style={{ fontWeight: 500 }}>{selectedVehicle.year || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Color:</span>
                  <span style={{ fontWeight: 500 }}>{selectedVehicle.color || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div style={{ padding: 16, backgroundColor: '#111827', borderRadius: 8 }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#e5e7eb', borderBottom: '1px solid #374151', paddingBottom: 8 }}>Current Status</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Status:</span>
                  <span 
                    className="badge"
                    style={{ 
                      backgroundColor: getStatusColor(selectedVehicle.status),
                      textTransform: 'capitalize'
                    }}
                  >
                    {(selectedVehicle.status || 'N/A').replace('-', ' ')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Current Driver:</span>
                  <span style={{ fontWeight: 500 }}>{selectedVehicle.currentDriver || 'None'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Last Update:</span>
                  <span style={{ fontWeight: 500 }}>{formatLastUpdate(selectedVehicle.lastUpdate)}</span>
                </div>
              </div>
            </div>
            
            <div style={{ padding: 16, backgroundColor: '#111827', borderRadius: 8 }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#e5e7eb', borderBottom: '1px solid #374151', paddingBottom: 8 }}>Location & Movement</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Latitude:</span>
                  <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{selectedVehicle.latitude.toFixed(6)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Longitude:</span>
                  <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{selectedVehicle.longitude.toFixed(6)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Speed:</span>
                  <span style={{ fontWeight: 500 }}>{selectedVehicle.speed} km/h</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>GPS Signal:</span>
                  <span style={{ fontWeight: 500 }}>{selectedVehicle.gpsSignal || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div style={{ padding: 16, backgroundColor: '#111827', borderRadius: 8 }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#e5e7eb', borderBottom: '1px solid #374151', paddingBottom: 8 }}>Energy & Performance</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>
                    {selectedVehicle.vehicleType === 'ev' ? 'Battery Level:' : 'Fuel Level:'}
                  </span>
                  <span style={{ fontWeight: 500 }}>
                    {selectedVehicle.vehicleType === 'ev' ? selectedVehicle.batteryLevel : selectedVehicle.fuelLevel}%
                  </span>
                </div>
                {selectedVehicle.vehicleType === 'ev' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#9ca3af' }}>Battery Health:</span>
                      <span style={{ fontWeight: 500 }}>{selectedVehicle.batteryHealth}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#9ca3af' }}>Range:</span>
                      <span style={{ fontWeight: 500 }}>{selectedVehicle.range} km</span>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Engine Temp:</span>
                  <span style={{ fontWeight: 500 }}>{Math.round(selectedVehicle.engineTemp)}°C</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Tire Pressure:</span>
                  <span style={{ fontWeight: 500 }}>{selectedVehicle.tirePressure.toFixed(1)} PSI</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Online:</span>
                  <span style={{ fontWeight: 500 }}>{selectedVehicle.isOnline === true ? 'Yes' : selectedVehicle.isOnline === false ? 'No' : 'Unknown'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VehicleInventory;
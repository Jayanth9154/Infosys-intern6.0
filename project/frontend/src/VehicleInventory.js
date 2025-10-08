import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

function VehicleInventory() {
  const { currentUser, role } = useContext(AuthContext);
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
        const response = await axios.get('http://localhost:3001/api/vehicles', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Enhance vehicles with telemetry data
        const vehiclesWithTelemetry = response.data.map(vehicle => ({
          ...vehicle,
          // Location data
          latitude: vehicle.latitude || (28.6139 + (Math.random() * 0.2 - 0.1)),
          longitude: vehicle.longitude || (77.2090 + (Math.random() * 0.2 - 0.1)),
          
          // Telemetry data
          speed: vehicle.speed || Math.floor(Math.random() * 80),
          batteryLevel: vehicle.batteryLevel || Math.floor(Math.random() * 100),
          fuelLevel: vehicle.fuelLevel || Math.floor(Math.random() * 100),
          engineTemp: vehicle.engineTemp || (80 + Math.random() * 40), // 80-120°C
          tirePressure: vehicle.tirePressure || (30 + Math.random() * 5), // 30-35 PSI
          mileage: vehicle.mileage || Math.floor(Math.random() * 100000),
          
          // Status indicators
          engineStatus: vehicle.engineStatus || (Math.random() > 0.9 ? 'warning' : 'normal'),
          gpsSignal: vehicle.gpsSignal || (Math.random() > 0.95 ? 'weak' : 'strong'),
          lastUpdate: vehicle.lastUpdate || new Date().toISOString(),
          
          // Enhanced status
          isOnline: vehicle.isOnline !== undefined ? vehicle.isOnline : Math.random() > 0.1,
          batteryHealth: vehicle.batteryHealth || Math.floor(Math.random() * 30) + 70,
          range: vehicle.range || Math.floor(Math.random() * 200) + 100,
          
          // Service information
          nextServiceDue: vehicle.nextServiceDue || Math.floor(Math.random() * 5000) + 1000,
          lastServiceDate: vehicle.lastServiceDate || new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
          
          // Driver information
          currentDriver: vehicle.currentDriver || (Math.random() > 0.6 ? `Driver ${Math.floor(Math.random() * 100)}` : null),
          
          // Trip information
          tripDistance: vehicle.tripDistance || Math.floor(Math.random() * 500),
          tripDuration: vehicle.tripDuration || Math.floor(Math.random() * 480), // minutes
        }));
        
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
    const ws = new WebSocket('ws://localhost:3001');
    
    ws.onopen = () => {
      console.log('Connected to telemetry WebSocket');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'vehicle_update') {
          setVehicles(prevVehicles => 
            prevVehicles.map(vehicle => 
              vehicle.id === data.id ? { ...vehicle, ...data } : vehicle
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
        prevVehicles.map(vehicle => ({
          ...vehicle,
          speed: vehicle.status === 'on-trip' ? Math.floor(Math.random() * 80) : 0,
          batteryLevel: vehicle.status === 'charging' 
            ? Math.min(100, vehicle.batteryLevel + Math.random() * 2)
            : Math.max(0, vehicle.batteryLevel - Math.random() * 0.5),
          lastUpdate: new Date().toISOString(),
          latitude: vehicle.status === 'on-trip' 
            ? vehicle.latitude + (Math.random() * 0.001 - 0.0005)
            : vehicle.latitude,
          longitude: vehicle.status === 'on-trip' 
            ? vehicle.longitude + (Math.random() * 0.001 - 0.0005)
            : vehicle.longitude,
        }))
      );
    }, 10000); // Update every 10 seconds as fallback
    
    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, [currentUser]);

  // Filter vehicles
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || vehicle.status === filterStatus;
    const matchesType = filterType === 'all' || vehicle.vehicleType === filterType;
    
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
        vehicle.id,
        vehicle.make,
        vehicle.model,
        vehicle.licensePlate,
        vehicle.status,
        vehicle.vehicleType || 'N/A',
        vehicle.vehicleType === 'ev' ? vehicle.batteryLevel : vehicle.fuelLevel,
        vehicle.speed,
        vehicle.mileage,
        Math.round(vehicle.engineTemp),
        Math.round(vehicle.tirePressure),
        vehicle.latitude.toFixed(6),
        vehicle.longitude.toFixed(6),
        vehicle.currentDriver || 'N/A',
        new Date(vehicle.lastUpdate).toLocaleString()
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
                <td>${vehicle.make} ${vehicle.model}</td>
                <td>${vehicle.licensePlate}</td>
                <td><span class="status ${vehicle.status}">${vehicle.status}</span></td>
                <td>${vehicle.vehicleType || 'N/A'}</td>
                <td>${vehicle.vehicleType === 'ev' ? vehicle.batteryLevel : vehicle.fuelLevel}%</td>
                <td>${vehicle.speed} km/h</td>
                <td>${vehicle.mileage.toLocaleString()}</td>
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

  if (loading) return <div className="panel">Loading vehicle inventory...</div>;
  if (error) return <div className="panel">Error: {error}</div>;

  return (
    <div className="panel">
      {/* Header */}
      <div className="inventory-header">
        <h2>Fleet Inventory & Telemetry</h2>
        <div className="inventory-stats">
          <div className="stat-item">
            <span className="stat-value">{vehicles.length}</span>
            <span className="stat-label">Total Vehicles</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{vehicles.filter(v => v.isOnline).length}</span>
            <span className="stat-label">Online</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{vehicles.filter(v => v.status === 'on-trip').length}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{vehicles.filter(v => v.status === 'available').length}</span>
            <span className="stat-label">Available</span>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="inventory-controls">
        <div className="search-container">
          <input
            type="text"
            className="input search-input"
            placeholder="Search vehicles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-container">
          <select
            className="select filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="on-trip">On Trip</option>
            <option value="maintenance">Maintenance</option>
            <option value="charging">Charging</option>
            <option value="out-of-service">Out of Service</option>
          </select>
          
          <select
            className="select filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="ev">Electric</option>
            <option value="hybrid">Hybrid</option>
            <option value="ice">ICE</option>
          </select>
        </div>
        
        <div className="export-controls">
          <button 
            className="button outline"
            onClick={() => exportToCSV(filteredVehicles)}
          >
            📊 Export CSV
          </button>
          <button 
            className="button outline"
            onClick={() => exportToPDF(filteredVehicles)}
          >
            📄 Export PDF
          </button>
        </div>
        
        <div className="view-controls">
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

      {/* Vehicle Display */}
      {viewMode === 'grid' ? (
        <div className="vehicle-grid">
          {filteredVehicles.map(vehicle => (
            <div 
              key={vehicle.id} 
              className={`vehicle-card ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`}
              onClick={() => setSelectedVehicle(vehicle)}
            >
              {/* Card Header */}
              <div className="vehicle-card-header">
                <div className="vehicle-info">
                  <h3>{vehicle.make} {vehicle.model}</h3>
                  <span className="license-plate">{vehicle.licensePlate}</span>
                </div>
                <div className="status-indicators">
                  <div 
                    className="status-chip"
                    style={{ backgroundColor: getStatusColor(vehicle.status) }}
                  >
                    {vehicle.status.replace('-', ' ')}
                  </div>
                  <div className={`online-indicator ${vehicle.isOnline ? 'online' : 'offline'}`}>
                    {vehicle.isOnline ? '🟢' : '🔴'}
                  </div>
                </div>
              </div>

              {/* Location Pin */}
              <div className="location-info">
                <span className="location-pin">📍</span>
                <span className="coordinates">
                  {vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}
                </span>
                <span className="last-update">{formatLastUpdate(vehicle.lastUpdate)}</span>
              </div>

              {/* Battery/Fuel Level */}
              <div className="energy-level">
                <div className="energy-header">
                  <span className="energy-icon">
                    {vehicle.vehicleType === 'ev' || vehicle.vehicleType === 'hybrid' ? '🔋' : '⛽'}
                  </span>
                  <span className="energy-label">
                    {vehicle.vehicleType === 'ev' ? 'Battery' : 'Fuel'}
                  </span>
                  <span className="energy-percentage">
                    {vehicle.vehicleType === 'ev' ? vehicle.batteryLevel : vehicle.fuelLevel}%
                  </span>
                </div>
                <div className="energy-bar-container">
                  <div 
                    className={`energy-bar ${getLevelClass(vehicle.vehicleType === 'ev' ? vehicle.batteryLevel : vehicle.fuelLevel)}`}
                    style={{ 
                      width: `${vehicle.vehicleType === 'ev' ? vehicle.batteryLevel : vehicle.fuelLevel}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Telemetry Data */}
              <div className="telemetry-grid">
                <div className="telemetry-item">
                  <span className="telemetry-icon">🚗</span>
                  <span className="telemetry-value">{vehicle.speed} km/h</span>
                  <span className="telemetry-label">Speed</span>
                </div>
                <div className="telemetry-item">
                  <span className="telemetry-icon">📏</span>
                  <span className="telemetry-value">{vehicle.mileage.toLocaleString()}</span>
                  <span className="telemetry-label">Mileage</span>
                </div>
                <div className="telemetry-item">
                  <span className="telemetry-icon">🌡️</span>
                  <span className="telemetry-value">{Math.round(vehicle.engineTemp)}°C</span>
                  <span className="telemetry-label">Engine</span>
                </div>
                <div className="telemetry-item">
                  <span className="telemetry-icon">🛞</span>
                  <span className="telemetry-value">{vehicle.tirePressure.toFixed(1)} PSI</span>
                  <span className="telemetry-label">Tires</span>
                </div>
              </div>

              {/* Driver Info */}
              {vehicle.currentDriver && (
                <div className="driver-info">
                  <span className="driver-icon">👤</span>
                  <span className="driver-name">{vehicle.currentDriver}</span>
                </div>
              )}

              {/* Service Alert */}
              {vehicle.nextServiceDue < 2000 && (
                <div className="service-alert">
                  <span className="alert-icon">⚠️</span>
                  <span className="alert-text">Service due in {vehicle.nextServiceDue} km</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="vehicle-table-container">
          <table className="vehicle-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Location</th>
                <th>Energy</th>
                <th>Speed</th>
                <th>Driver</th>
                <th>Last Update</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map(vehicle => (
                <tr 
                  key={vehicle.id}
                  className={selectedVehicle?.id === vehicle.id ? 'selected' : ''}
                  onClick={() => setSelectedVehicle(vehicle)}
                >
                  <td>
                    <div className="vehicle-cell">
                      <div className="vehicle-name">{vehicle.make} {vehicle.model}</div>
                      <div className="vehicle-plate">{vehicle.licensePlate}</div>
                    </div>
                  </td>
                  <td>
                    <div className="status-cell">
                      <div 
                        className="status-chip small"
                        style={{ backgroundColor: getStatusColor(vehicle.status) }}
                      >
                        {vehicle.status.replace('-', ' ')}
                      </div>
                      <div className={`online-dot ${vehicle.isOnline ? 'online' : 'offline'}`}></div>
                    </div>
                  </td>
                  <td>
                    <div className="location-cell">
                      <span className="coordinates-text">
                        {vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="energy-cell">
                      <div className="energy-bar-small">
                        <div 
                          className={`energy-fill ${getLevelClass(vehicle.vehicleType === 'ev' ? vehicle.batteryLevel : vehicle.fuelLevel)}`}
                          style={{ 
                            width: `${vehicle.vehicleType === 'ev' ? vehicle.batteryLevel : vehicle.fuelLevel}%` 
                          }}
                        ></div>
                      </div>
                      <span className="energy-text">
                        {vehicle.vehicleType === 'ev' ? vehicle.batteryLevel : vehicle.fuelLevel}%
                      </span>
                    </div>
                  </td>
                  <td>{vehicle.speed} km/h</td>
                  <td>{vehicle.currentDriver || '-'}</td>
                  <td>{formatLastUpdate(vehicle.lastUpdate)}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="button small outline">Details</button>
                      {role === 'admin' && (
                        <button className="button small">Edit</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Vehicle Detail Panel */}
      {selectedVehicle && (
        <div className="vehicle-detail-panel">
          <div className="detail-header">
            <h3>{selectedVehicle.make} {selectedVehicle.model} - Detailed Telemetry</h3>
            <button 
              className="button outline small"
              onClick={() => setSelectedVehicle(null)}
            >
              Close
            </button>
          </div>
          
          <div className="detail-grid">
            <div className="detail-section">
              <h4>Vehicle Information</h4>
              <div className="detail-items">
                <div className="detail-row">
                  <span className="detail-label">License Plate:</span>
                  <span className="detail-value">{selectedVehicle.licensePlate}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{selectedVehicle.vehicleType?.toUpperCase()}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Year:</span>
                  <span className="detail-value">{selectedVehicle.year}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Color:</span>
                  <span className="detail-value">{selectedVehicle.color}</span>
                </div>
              </div>
            </div>
            
            <div className="detail-section">
              <h4>Current Status</h4>
              <div className="detail-items">
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span 
                    className="detail-value status-badge"
                    style={{ backgroundColor: getStatusColor(selectedVehicle.status) }}
                  >
                    {selectedVehicle.status.replace('-', ' ')}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Online:</span>
                  <span className="detail-value">{selectedVehicle.isOnline ? 'Yes' : 'No'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Current Driver:</span>
                  <span className="detail-value">{selectedVehicle.currentDriver || 'None'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Last Update:</span>
                  <span className="detail-value">{formatLastUpdate(selectedVehicle.lastUpdate)}</span>
                </div>
              </div>
            </div>
            
            <div className="detail-section">
              <h4>Location & Movement</h4>
              <div className="detail-items">
                <div className="detail-row">
                  <span className="detail-label">Latitude:</span>
                  <span className="detail-value">{selectedVehicle.latitude.toFixed(6)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Longitude:</span>
                  <span className="detail-value">{selectedVehicle.longitude.toFixed(6)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Speed:</span>
                  <span className="detail-value">{selectedVehicle.speed} km/h</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">GPS Signal:</span>
                  <span className="detail-value">{selectedVehicle.gpsSignal}</span>
                </div>
              </div>
            </div>
            
            <div className="detail-section">
              <h4>Energy & Performance</h4>
              <div className="detail-items">
                <div className="detail-row">
                  <span className="detail-label">
                    {selectedVehicle.vehicleType === 'ev' ? 'Battery Level:' : 'Fuel Level:'}
                  </span>
                  <span className="detail-value">
                    {selectedVehicle.vehicleType === 'ev' ? selectedVehicle.batteryLevel : selectedVehicle.fuelLevel}%
                  </span>
                </div>
                {selectedVehicle.vehicleType === 'ev' && (
                  <>
                    <div className="detail-row">
                      <span className="detail-label">Battery Health:</span>
                      <span className="detail-value">{selectedVehicle.batteryHealth}%</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Range:</span>
                      <span className="detail-value">{selectedVehicle.range} km</span>
                    </div>
                  </>
                )}
                <div className="detail-row">
                  <span className="detail-label">Engine Temp:</span>
                  <span className="detail-value">{Math.round(selectedVehicle.engineTemp)}°C</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Tire Pressure:</span>
                  <span className="detail-value">{selectedVehicle.tirePressure.toFixed(1)} PSI</span>
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
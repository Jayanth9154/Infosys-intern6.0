import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { API_BASE_URL } from './config';

// Safe number formatting function
const formatNumber = (value, decimals = 2) => {
  if (value === undefined || value === null) return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : parseFloat(num.toFixed(decimals));
};

function BatteryMonitoring() {
  const { currentUser } = useContext(AuthContext);
  const [vehicles, setVehicles] = useState([]);
  const [chargingStations, setChargingStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [batteryHistory, setBatteryHistory] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); 
  const [userLocation, setUserLocation] = useState(null);

  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: formatNumber(position.coords.latitude, 6),
          longitude: formatNumber(position.coords.longitude, 6)
        });
      },
      (error) => {
        console.error('Error getting user location:', error);
      }
    );
  }, []);

  // Fetch vehicles with battery information
  useEffect(() => {
    const fetchVehicles = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const token = await currentUser.getIdToken();
        const response = await axios.get(`${API_BASE_URL}/api/vehicles`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Add mock battery data if not present and format values
        const vehiclesWithBattery = response.data.map(vehicle => ({
          ...vehicle,
          batteryLevel: vehicle.batteryLevel !== undefined ? formatNumber(vehicle.batteryLevel) : formatNumber(Math.random() * 100),
          batteryHealth: vehicle.batteryHealth !== undefined ? formatNumber(vehicle.batteryHealth) : formatNumber(Math.floor(Math.random() * 30) + 70), // 70-100%
          range: vehicle.range !== undefined ? formatNumber(vehicle.range) : formatNumber(Math.floor(Math.random() * 200) + 100), // 100-300 km
          chargingStatus: vehicle.chargingStatus || (Math.random() > 0.8 ? 'charging' : 'idle'),
          estimatedChargeTime: vehicle.estimatedChargeTime !== undefined ? formatNumber(vehicle.estimatedChargeTime) : formatNumber(Math.floor(Math.random() * 120) + 30), // 30-150 minutes
          lastCharged: vehicle.lastCharged || new Date(Date.now() - Math.random() * 86400000 * 3).toISOString() // 0-3 days ago
        }));
        
        setVehicles(vehiclesWithBattery);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch vehicles:', err);
        setError('Failed to load vehicle battery data. Please check your connection.');
        setLoading(false);
      }
    };
    
    // Mock charging stations data with real-time updates and formatted values
    const fetchChargingStations = () => {
      // In a real implementation, this would be an API call
      const mockStations = [
        {
          id: 'cs-001',
          name: 'Central Hub Station',
          location: { 
            latitude: formatNumber(28.6139, 6), 
            longitude: formatNumber(77.2090, 6) 
          },
          totalPorts: 8,
          availablePorts: Math.floor(Math.random() * 9), // 0-8
          chargingType: ['level2', 'dcFast'],
          status: Math.random() > 0.1 ? 'operational' : 'maintenance',
          currentlyCharging: Array.from({length: Math.floor(Math.random() * 9)}, (_, i) => `vehicle-${Math.floor(Math.random() * 100)}`),
          waitTime: formatNumber(Math.floor(Math.random() * 60)), // 0-60 minutes
          pricePerKwh: formatNumber(8.5) // Rupees per kWh
        },
        {
          id: 'cs-002',
          name: 'North District Station',
          location: { 
            latitude: formatNumber(28.7041, 6), 
            longitude: formatNumber(77.1025, 6) 
          },
          totalPorts: 4,
          availablePorts: Math.floor(Math.random() * 5), // 0-4
          chargingType: ['level2'],
          status: Math.random() > 0.1 ? 'operational' : 'maintenance',
          currentlyCharging: Array.from({length: Math.floor(Math.random() * 5)}, (_, i) => `vehicle-${Math.floor(Math.random() * 100)}`),
          waitTime: formatNumber(Math.floor(Math.random() * 30)), // 0-30 minutes
          pricePerKwh: formatNumber(7.2) // Rupees per kWh
        },
        {
          id: 'cs-003',
          name: 'South Express Station',
          location: { 
            latitude: formatNumber(28.5355, 6), 
            longitude: formatNumber(77.2410, 6) 
          },
          totalPorts: 6,
          availablePorts: Math.floor(Math.random() * 7), // 0-6
          chargingType: ['level2', 'dcFast', 'supercharger'],
          status: Math.random() > 0.2 ? 'operational' : (Math.random() > 0.5 ? 'full' : 'maintenance'),
          currentlyCharging: Array.from({length: Math.floor(Math.random() * 7)}, (_, i) => `vehicle-${Math.floor(Math.random() * 100)}`),
          waitTime: formatNumber(Math.floor(Math.random() * 45)), // 0-45 minutes
          pricePerKwh: formatNumber(10.0) // Rupees per kWh
        },
        {
          id: 'cs-004',
          name: 'East Side Station',
          location: { 
            latitude: formatNumber(28.6129, 6), 
            longitude: formatNumber(77.2295, 6) 
          },
          totalPorts: 4,
          availablePorts: Math.floor(Math.random() * 5), // 0-4
          chargingType: ['level2'],
          status: Math.random() > 0.1 ? 'operational' : 'maintenance',
          currentlyCharging: Array.from({length: Math.floor(Math.random() * 5)}, (_, i) => `vehicle-${Math.floor(Math.random() * 100)}`),
          waitTime: formatNumber(Math.floor(Math.random() * 20)), // 0-20 minutes
          pricePerKwh: formatNumber(6.8) // Rupees per kWh
        },
        {
          id: 'cs-005',
          name: 'West End Station',
          location: { 
            latitude: formatNumber(28.4595, 6), 
            longitude: formatNumber(77.0266, 6) 
          },
          totalPorts: 2,
          availablePorts: Math.floor(Math.random() * 3), // 0-2
          chargingType: ['level1', 'level2'],
          status: Math.random() > 0.1 ? 'operational' : 'maintenance',
          currentlyCharging: Array.from({length: Math.floor(Math.random() * 3)}, (_, i) => `vehicle-${Math.floor(Math.random() * 100)}`),
          waitTime: formatNumber(Math.floor(Math.random() * 15)), // 0-15 minutes
          pricePerKwh: formatNumber(7.5) // Rupees per kWh
        }
      ];
      
      setChargingStations(mockStations);
    };
    
    fetchVehicles();
    fetchChargingStations();
    
    // Set up interval to update charging station data
    const interval = setInterval(fetchChargingStations, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [currentUser]);

  // Generate mock battery history when a vehicle is selected
  useEffect(() => {
    if (!selectedVehicle) {
      setBatteryHistory([]);
      return;
    }
    
    // Generate 30 days of battery history
    const generateBatteryHistory = () => {
      const history = [];
      const now = new Date();
      
      for (let i = 30; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // Generate 3-5 data points per day
        const dataPointsCount = Math.floor(Math.random() * 3) + 3;
        
        for (let j = 0; j < dataPointsCount; j++) {
          const hour = Math.floor(Math.random() * 24);
          date.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
          
          // Battery level tends to decrease during the day and increase when charging
          const isCharging = Math.random() > 0.7;
          const batteryLevel = isCharging 
            ? formatNumber(Math.min(100, Math.floor(Math.random() * 30) + 70)) // 70-100% when charging
            : formatNumber(Math.max(10, Math.floor(Math.random() * 60) + 10));  // 10-70% when not charging
          
          history.push({
            timestamp: new Date(date).toISOString(),
            batteryLevel: batteryLevel,
            isCharging,
            range: formatNumber(batteryLevel * 3), // Simple calculation: 1% = 3km
            location: {
              latitude: formatNumber(28.4595 + (Math.random() * 0.1 - 0.05), 6),
              longitude: formatNumber(77.0266 + (Math.random() * 0.1 - 0.05), 6)
            }
          });
        }
      }
      
      // Sort by timestamp
      history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      setBatteryHistory(history);
    };
    
    generateBatteryHistory();
  }, [selectedVehicle]);

  // Function to get battery level class
  const getBatteryLevelClass = (level) => {
    if (level >= 70) return 'high';
    if (level >= 30) return 'medium';
    return 'low';
  };

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to recommend charging
  const shouldRecommendCharging = (vehicle) => {
    return (vehicle.batteryLevel || 0) < 30 && (vehicle.chargingStatus || '') !== 'charging';
  };

  // Function to find nearest available charging station
  const findNearestChargingStation = (vehicle) => {
    if (!userLocation || !vehicle.latitude || !vehicle.longitude) return null;
    
    const availableStations = chargingStations.filter(station => 
      (station.availablePorts || 0) > 0 && (station.status || '') === 'operational'
    );
    
    if (availableStations.length === 0) return null;
    
    // Calculate distances and find the nearest
    let nearestStation = null;
    let minDistance = Infinity;
    
    availableStations.forEach(station => {
      // Simple distance calculation (in a real app, use proper geospatial distance)
      const distance = Math.sqrt(
        Math.pow((station.location.latitude || 0) - (vehicle.latitude || 0), 2) +
        Math.pow((station.location.longitude || 0) - (vehicle.longitude || 0), 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestStation = station;
      }
    });
    
    return nearestStation;
  };

  // Function to navigate to charging station
  const navigateToStation = (station) => {
    if (!station || !userLocation) return;
    
    // In a real implementation, this would open a navigation app or show directions
    const url = `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${station.location.latitude},${station.location.longitude}`;
    window.open(url, '_blank');
  };

  if (loading) return <div className="panel">Loading battery data...</div>;
  if (error) return <div className="panel">Error: {error}</div>;

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Battery Monitoring</h2>
        <div className="row" style={{ gap: 8 }}>
          <button 
            className={`button ${viewMode === 'grid' ? 'primary' : 'outline'}`}
            onClick={() => setViewMode('grid')}
          >
            Grid View
          </button>
          <button 
            className={`button ${viewMode === 'list' ? 'primary' : 'outline'}`}
            onClick={() => setViewMode('list')}
          >
            List View
          </button>
        </div>
      </div>
      
      {viewMode === 'grid' ? (
        <div className="battery-grid">
          {vehicles.map(vehicle => (
            <div 
              key={vehicle.id} 
              className={`battery-card ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`}
              onClick={() => setSelectedVehicle(vehicle)}
            >
              <div className="battery-card-header">
                <h3>{vehicle.make || 'N/A'} {vehicle.model || 'N/A'}</h3>
                <span className="badge">{vehicle.licensePlate || 'N/A'}</span>
              </div>
              
              <div className="battery-level-container">
                <div 
                  className={`battery-level ${getBatteryLevelClass(vehicle.batteryLevel)}`}
                  style={{ width: `${vehicle.batteryLevel}%` }}
                ></div>
                <span className="battery-percentage">{vehicle.batteryLevel}%</span>
              </div>
              
              <div className="battery-details">
                <div className="detail-item">
                  <span className="detail-label">Range:</span>
                  <span className="detail-value">{vehicle.range || 0} km</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Health:</span>
                  <span className="detail-value">{vehicle.batteryHealth || 0}%</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status:</span>
                  <span className={`detail-value ${vehicle.chargingStatus === 'charging' ? 'charging' : ''}`}>
                    {vehicle.chargingStatus === 'charging' ? 'Charging' : 'Not Charging'}
                  </span>
                </div>
                {vehicle.chargingStatus === 'charging' && (
                  <div className="detail-item">
                    <span className="detail-label">Est. Time:</span>
                    <span className="detail-value">{vehicle.estimatedChargeTime || 0} min</span>
                  </div>
                )}
              </div>
              
              {shouldRecommendCharging(vehicle) && (
                <div className="charging-recommendation">
                  <p>Battery low! Charging recommended.</p>
                  {findNearestChargingStation(vehicle) && (
                    <button 
                      className="button small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToStation(findNearestChargingStation(vehicle));
                      }}
                    >
                      Navigate to {findNearestChargingStation(vehicle).name}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <table className="battery-table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>License</th>
              <th>Battery</th>
              <th>Range</th>
              <th>Health</th>
              <th>Status</th>
              <th>Last Charged</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map(vehicle => (
              <tr 
                key={vehicle.id}
                className={selectedVehicle?.id === vehicle.id ? 'selected' : ''}
                onClick={() => setSelectedVehicle(vehicle)}
              >
                <td>{vehicle.make || 'N/A'} {vehicle.model || 'N/A'}</td>
                <td>{vehicle.licensePlate || 'N/A'}</td>
                <td>
                  <div className="battery-level-container small">
                    <div 
                      className={`battery-level ${getBatteryLevelClass(vehicle.batteryLevel)}`}
                      style={{ width: `${vehicle.batteryLevel}%` }}
                    ></div>
                    <span className="battery-percentage small">{vehicle.batteryLevel}%</span>
                  </div>
                </td>
                <td>{vehicle.range || 0} km</td>
                <td>{vehicle.batteryHealth || 0}%</td>
                <td>
                  <span className={vehicle.chargingStatus === 'charging' ? 'charging-status' : ''}>
                    {vehicle.chargingStatus === 'charging' ? 'Charging' : 'Not Charging'}
                  </span>
                </td>
                <td>{formatDate(vehicle.lastCharged)}</td>
                <td>
                  {shouldRecommendCharging(vehicle) ? (
                    <button 
                      className="button small"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (findNearestChargingStation(vehicle)) {
                          navigateToStation(findNearestChargingStation(vehicle));
                        }
                      }}
                    >
                      Charge Now
                    </button>
                  ) : (
                    <button className="button small outline">Details</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      {selectedVehicle && (
        <div className="battery-detail-panel">
          <h3>Battery History: {selectedVehicle.make || 'N/A'} {selectedVehicle.model || 'N/A'}</h3>
          
          <div className="battery-chart">
            {/* In a real implementation, this would be a chart component */}
            <div className="chart-placeholder">
              <p>Battery level over time chart would be displayed here.</p>
              <p>Using a library like Chart.js or Recharts to visualize the battery history.</p>
            </div>
          </div>
          
          <div className="battery-history-table">
            <h4>Recent Battery Events</h4>
            <table>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Battery Level</th>
                  <th>Range</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {batteryHistory.slice(-5).map((entry, index) => (
                  <tr key={index}>
                    <td>{formatDate(entry.timestamp)}</td>
                    <td>{entry.batteryLevel}%</td>
                    <td>{entry.range || 0} km</td>
                    <td>{entry.isCharging ? 'Charging' : 'Discharging'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="charging-stations-section">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3>Charging Stations</h3>
          <div className="row" style={{ gap: 8 }}>
            <span className="badge" style={{ backgroundColor: '#10b981' }}>Operational</span>
            <span className="badge" style={{ backgroundColor: '#f59e0b' }}>Maintenance</span>
            <span className="badge" style={{ backgroundColor: '#ef4444' }}>Full</span>
          </div>
        </div>
        <div className="charging-stations-grid">
          {chargingStations.map(station => (
            <div key={station.id} className={`charging-station-card ${station.status || ''}`}>
              <div className="station-header">
                <h4>{station.name || 'N/A'}</h4>
                <span className={`status-badge ${station.status || ''}`}>
                  {station.status === 'operational' ? 'Operational' : 
                   station.status === 'full' ? 'Full' : 
                   station.status === 'maintenance' ? 'Maintenance' : 'Offline'}
                </span>
              </div>
              
              <div className="station-details">
                <div className="detail-item">
                  <span className="detail-label">Available:</span>
                  <span className="detail-value">{station.availablePorts || 0}/{station.totalPorts || 0} ports</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Types:</span>
                  <span className="detail-value">
                    {(station.chargingType || []).map(type => (
                      <span key={type} className="charging-type-badge">
                        {type === 'level1' ? 'L1' : 
                         type === 'level2' ? 'L2' : 
                         type === 'dcFast' ? 'DC Fast' : 'Super'}
                      </span>
                    ))}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Price:</span>
                  <span className="detail-value">₹{formatNumber(station.pricePerKwh || 0, 2)}/kWh</span>
                </div>
                {(station.waitTime || 0) > 0 && (
                  <div className="detail-item">
                    <span className="detail-label">Wait Time:</span>
                    <span className="detail-value">{station.waitTime || 0} min</span>
                  </div>
                )}
                {userLocation && (
                  <div className="detail-item">
                    <span className="detail-label">Distance:</span>
                    <span className="detail-value">
                      {formatNumber(Math.sqrt(
                        Math.pow((station.location.latitude || 0) - (userLocation.latitude || 0), 2) +
                        Math.pow((station.location.longitude || 0) - (userLocation.longitude || 0), 2)
                      ) * 111, 2)} km
                    </span>
                  </div>
                )}
              </div>
              
              <div className="station-actions">
                <button 
                  className="button small"
                  onClick={() => navigateToStation(station)}
                  disabled={(station.status || '') !== 'operational' || (station.availablePorts || 0) === 0}
                >
                  Navigate
                </button>
                <button className="button small outline">Details</button>
              </div>
              
              {(station.currentlyCharging || []).length > 0 && (
                <div className="currently-charging">
                  <h5>Currently Charging ({(station.currentlyCharging || []).length})</h5>
                  <div className="charging-list">
                    {(station.currentlyCharging || []).slice(0, 3).map((vehicleId, index) => (
                      <span key={index} className="charging-vehicle-badge">
                        {vehicleId || 'N/A'}
                      </span>
                    ))}
                    {(station.currentlyCharging || []).length > 3 && (
                      <span className="charging-vehicle-badge">
                        +{(station.currentlyCharging || []).length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <style>{`
        .battery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .battery-card {
          background-color: #1f2937;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .battery-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .battery-card.selected {
          border: 2px solid #3b82f6;
        }
        
        .battery-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .battery-card-header h3 {
          margin: 0;
          font-size: 16px;
        }
        
        .battery-level-container {
          height: 24px;
          background-color: #374151;
          border-radius: 12px;
          position: relative;
          overflow: hidden;
          margin-bottom: 12px;
        }
        
        .battery-level-container.small {
          height: 16px;
          width: 100px;
        }
        
        .battery-level {
          height: 100%;
          transition: width 0.5s ease;
        }
        
        .battery-level.high {
          background-color: #10b981;
        }
        
        .battery-level.medium {
          background-color: #f59e0b;
        }
        
        .battery-level.low {
          background-color: #ef4444;
        }
        
        .battery-percentage {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-weight: bold;
        }
        
        .battery-percentage.small {
          font-size: 12px;
        }
        
        .battery-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .detail-item {
          display: flex;
          justify-content: space-between;
        }
        
        .detail-label {
          color: #9ca3af;
        }
        
        .detail-value {
          font-weight: bold;
        }
        
        .detail-value.charging {
          color: #3b82f6;
        }
        
        .charging-recommendation {
          margin-top: 12px;
          padding: 8px;
          background-color: #991b1b;
          border-radius: 4px;
          text-align: center;
        }
        
        .charging-recommendation p {
          margin: 0 0 8px 0;
          font-weight: bold;
          color: white;
        }
        
        .battery-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }
        
        .battery-table th, .battery-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #374151;
        }
        
        .battery-table tr.selected {
          background-color: rgba(59, 130, 246, 0.1);
        }
        
        .battery-table tr:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
        
        .charging-status {
          color: #3b82f6;
          font-weight: bold;
        }
        
        .battery-detail-panel {
          margin-top: 24px;
          padding: 16px;
          background-color: #1f2937;
          border-radius: 8px;
        }
        
        .battery-chart {
          margin: 16px 0;
        }
        
        .chart-placeholder {
          height: 200px;
          background-color: #374151;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 16px;
          text-align: center;
        }
        
        .battery-history-table {
          margin-top: 16px;
        }
        
        .battery-history-table table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .battery-history-table th, .battery-history-table td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #374151;
        }
        
        .charging-stations-section {
          margin-top: 24px;
        }
        
        .charging-stations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }
        
        .charging-station-card {
          background-color: #1f2937;
          border-radius: 8px;
          padding: 16px;
        }
        
        .charging-station-card.full {
          border-left: 4px solid #ef4444;
        }
        
        .charging-station-card.operational {
          border-left: 4px solid #10b981;
        }
        
        .charging-station-card.maintenance {
          border-left: 4px solid #f59e0b;
        }
        
        .station-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .station-header h4 {
          margin: 0;
        }
        
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .status-badge.operational {
          background-color: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }
        
        .status-badge.full {
          background-color: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        
        .status-badge.maintenance {
          background-color: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }
        
        .station-details {
          margin-bottom: 16px;
        }
        
        .charging-type-badge {
          display: inline-block;
          padding: 2px 6px;
          margin-right: 4px;
          background-color: #374151;
          border-radius: 4px;
          font-size: 12px;
        }
        
        .station-actions {
          display: flex;
          gap: 8px;
        }
        
        .button.small {
          padding: 4px 8px;
          font-size: 12px;
        }
        
        .currently-charging {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #374151;
        }
        
        .currently-charging h5 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #9ca3af;
        }
        
        .charging-list {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        
        .charging-vehicle-badge {
          padding: 2px 6px;
          background-color: #374151;
          border-radius: 4px;
          font-size: 11px;
        }
        
        @media (max-width: 768px) {
          .battery-grid {
            grid-template-columns: 1fr;
          }
          
          .charging-stations-grid {
            grid-template-columns: 1fr;
          }
          
          .battery-table {
            font-size: 14px;
          }
          
          .battery-table th, 
          .battery-table td {
            padding: 8px;
          }
          
          .battery-card-header h3 {
            font-size: 14px;
          }
          
          .detail-item {
            flex-direction: column;
            gap: 2px;
          }
          
          .station-actions {
            flex-direction: column;
            gap: 4px;
          }
          
          .button.small {
            width: 100%;
          }
        }
        
        @media (max-width: 480px) {
          .battery-details {
            gap: 4px;
          }
          
          .detail-label, 
          .detail-value {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}

export default BatteryMonitoring;
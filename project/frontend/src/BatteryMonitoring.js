import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

function BatteryMonitoring() {
  const { currentUser } = useContext(AuthContext);
  const [vehicles, setVehicles] = useState([]);
  const [chargingStations, setChargingStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [batteryHistory, setBatteryHistory] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); 

  // Fetch vehicles with battery information
  useEffect(() => {
    const fetchVehicles = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const token = await currentUser.getIdToken();
        const response = await axios.get('http://localhost:3001/api/vehicles', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Add mock battery data if not present
        const vehiclesWithBattery = response.data.map(vehicle => ({
          ...vehicle,
          batteryLevel: vehicle.batteryLevel || Math.floor(Math.random() * 100),
          batteryHealth: vehicle.batteryHealth || Math.floor(Math.random() * 30) + 70, // 70-100%
          range: vehicle.range || Math.floor(Math.random() * 200) + 100, // 100-300 km
          chargingStatus: vehicle.chargingStatus || (Math.random() > 0.8 ? 'charging' : 'idle'),
          estimatedChargeTime: vehicle.estimatedChargeTime || Math.floor(Math.random() * 120) + 30, // 30-150 minutes
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
    
    // Mock charging stations data
    const fetchChargingStations = () => {
      // In a real implementation, this would be an API call
      const mockStations = [
        {
          id: 'cs-001',
          name: 'Central Hub Station',
          location: { latitude: 28.6139, longitude: 77.2090 },
          totalPorts: 8,
          availablePorts: 3,
          chargingType: ['level2', 'dcFast'],
          status: 'operational',
          currentlyCharging: ['vehicle-003', 'vehicle-007', 'vehicle-012', 'vehicle-015', 'vehicle-018'],
          waitTime: 15 // minutes
        },
        {
          id: 'cs-002',
          name: 'North District Station',
          location: { latitude: 28.7041, longitude: 77.1025 },
          totalPorts: 4,
          availablePorts: 2,
          chargingType: ['level2'],
          status: 'operational',
          currentlyCharging: ['vehicle-005', 'vehicle-009'],
          waitTime: 0 // minutes
        },
        {
          id: 'cs-003',
          name: 'South Express Station',
          location: { latitude: 28.5355, longitude: 77.2410 },
          totalPorts: 6,
          availablePorts: 0,
          chargingType: ['level2', 'dcFast', 'supercharger'],
          status: 'full',
          currentlyCharging: ['vehicle-002', 'vehicle-004', 'vehicle-008', 'vehicle-010', 'vehicle-014', 'vehicle-019'],
          waitTime: 45 // minutes
        },
        {
          id: 'cs-004',
          name: 'East Side Station',
          location: { latitude: 28.6129, longitude: 77.2295 },
          totalPorts: 4,
          availablePorts: 4,
          chargingType: ['level2'],
          status: 'operational',
          currentlyCharging: [],
          waitTime: 0 // minutes
        },
        {
          id: 'cs-005',
          name: 'West End Station',
          location: { latitude: 28.6405, longitude: 77.1112 },
          totalPorts: 2,
          availablePorts: 1,
          chargingType: ['level1', 'level2'],
          status: 'operational',
          currentlyCharging: ['vehicle-016'],
          waitTime: 0 // minutes
        }
      ];
      
      setChargingStations(mockStations);
    };
    
    fetchVehicles();
    fetchChargingStations();
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
            ? Math.min(100, Math.floor(Math.random() * 30) + 70) // 70-100% when charging
            : Math.max(10, Math.floor(Math.random() * 60) + 10);  // 10-70% when not charging
          
          history.push({
            timestamp: new Date(date).toISOString(),
            batteryLevel,
            isCharging,
            range: Math.floor(batteryLevel * 3), // Simple calculation: 1% = 3km
            location: {
              latitude: 28.6139 + (Math.random() * 0.1 - 0.05),
              longitude: 77.2090 + (Math.random() * 0.1 - 0.05)
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
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to recommend charging
  const shouldRecommendCharging = (vehicle) => {
    return vehicle.batteryLevel < 30 && vehicle.chargingStatus !== 'charging';
  };

  // Function to find nearest available charging station
  const findNearestChargingStation = (vehicle) => {
    const availableStations = chargingStations.filter(station => 
      station.availablePorts > 0 && station.status === 'operational'
    );
    
    if (availableStations.length === 0) return null;
    
    // In a real implementation, we would calculate actual distances
    // For now, just return the first available station
    return availableStations[0];
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
                <h3>{vehicle.make} {vehicle.model}</h3>
                <span className="badge">{vehicle.licensePlate}</span>
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
                  <span className="detail-value">{vehicle.range} km</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Health:</span>
                  <span className="detail-value">{vehicle.batteryHealth}%</span>
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
                    <span className="detail-value">{vehicle.estimatedChargeTime} min</span>
                  </div>
                )}
              </div>
              
              {shouldRecommendCharging(vehicle) && (
                <div className="charging-recommendation">
                  <p>Battery low! Charging recommended.</p>
                  {findNearestChargingStation(vehicle) && (
                    <button className="button small">
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
                <td>{vehicle.make} {vehicle.model}</td>
                <td>{vehicle.licensePlate}</td>
                <td>
                  <div className="battery-level-container small">
                    <div 
                      className={`battery-level ${getBatteryLevelClass(vehicle.batteryLevel)}`}
                      style={{ width: `${vehicle.batteryLevel}%` }}
                    ></div>
                    <span className="battery-percentage small">{vehicle.batteryLevel}%</span>
                  </div>
                </td>
                <td>{vehicle.range} km</td>
                <td>{vehicle.batteryHealth}%</td>
                <td>
                  <span className={vehicle.chargingStatus === 'charging' ? 'charging-status' : ''}>
                    {vehicle.chargingStatus === 'charging' ? 'Charging' : 'Not Charging'}
                  </span>
                </td>
                <td>{formatDate(vehicle.lastCharged)}</td>
                <td>
                  {shouldRecommendCharging(vehicle) ? (
                    <button className="button small">Charge Now</button>
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
          <h3>Battery History: {selectedVehicle.make} {selectedVehicle.model}</h3>
          
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
                    <td>{entry.range} km</td>
                    <td>{entry.isCharging ? 'Charging' : 'Discharging'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="charging-stations-section">
        <h3>Charging Stations</h3>
        <div className="charging-stations-grid">
          {chargingStations.map(station => (
            <div key={station.id} className={`charging-station-card ${station.status}`}>
              <div className="station-header">
                <h4>{station.name}</h4>
                <span className={`status-badge ${station.status}`}>
                  {station.status === 'operational' ? 'Operational' : 
                   station.status === 'full' ? 'Full' : 
                   station.status === 'maintenance' ? 'Maintenance' : 'Offline'}
                </span>
              </div>
              
              <div className="station-details">
                <div className="detail-item">
                  <span className="detail-label">Available:</span>
                  <span className="detail-value">{station.availablePorts}/{station.totalPorts} ports</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Types:</span>
                  <span className="detail-value">
                    {station.chargingType.map(type => (
                      <span key={type} className="charging-type-badge">
                        {type === 'level1' ? 'L1' : 
                         type === 'level2' ? 'L2' : 
                         type === 'dcFast' ? 'DC Fast' : 'Super'}
                      </span>
                    ))}
                  </span>
                </div>
                {station.waitTime > 0 && (
                  <div className="detail-item">
                    <span className="detail-label">Wait Time:</span>
                    <span className="detail-value">{station.waitTime} min</span>
                  </div>
                )}
              </div>
              
              <div className="station-actions">
                <button className="button small">Navigate</button>
                <button className="button small outline">Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style jsx>{`
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
      `}</style>
    </div>
  );
}

export default BatteryMonitoring;
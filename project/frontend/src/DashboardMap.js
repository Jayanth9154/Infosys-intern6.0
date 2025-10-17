import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { API_BASE_URL } from './config';

const DashboardMap = () => {
  const { currentUser } = useContext(AuthContext);
  const [fleetMetrics, setFleetMetrics] = useState({ total: 0, active: 0, available: 0, charging: 0 });
  const [recentVehicles, setRecentVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const token = await currentUser.getIdToken();
        
        // Fetch fleet metrics
        const metricsResponse = await axios.get(`${API_BASE_URL}/api/vehicles/status-distribution`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setFleetMetrics({
          total: metricsResponse.data.totalVehicles || 0,
          active: metricsResponse.data.activeTrips || 0,
          available: metricsResponse.data.availableVehicles || 0,
          charging: metricsResponse.data.chargingVehicles || 0
        });
        
        // Fetch recent vehicles (last 5 vehicles)
        const vehiclesResponse = await axios.get(`${API_BASE_URL}/api/vehicles`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Get last 5 vehicles
        const recent = vehiclesResponse.data.slice(0, 5).map(vehicle => ({
          ...vehicle,
          // Add mock telemetry data if not present and format values properly
          batteryLevel: vehicle.batteryLevel !== undefined ? parseFloat(vehicle.batteryLevel.toFixed(2)) : parseFloat((Math.random() * 100).toFixed(2)),
          isOnline: vehicle.isOnline !== undefined ? vehicle.isOnline : (Math.random() > 0.2),
          speed: vehicle.speed !== undefined ? parseFloat(vehicle.speed.toFixed(2)) : parseFloat((Math.random() * 80).toFixed(2)),
          // Ensure charging level is properly handled
          chargingLevel: vehicle.chargingLevel !== undefined ? parseFloat(vehicle.chargingLevel.toFixed(2)) : (vehicle.status === 'charging' ? parseFloat((Math.random() * 100).toFixed(2)) : 0)
        }));
        
        setRecentVehicles(recent);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setLoading(false);
      }
    };
    
    fetchDashboardData();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchDashboardData, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [currentUser]);

  // Function to get battery level class
  const getBatteryLevelClass = (level) => {
    if (level >= 70) return 'high';
    if (level >= 30) return 'medium';
    return 'low';
  };

  // Function to get status color
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

  if (loading) {
    return (
      <div className="dashboard-map-container">
        <div className="loading">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-map-container">
      <div className="dashboard-header">
        <h2>Fleet Overview</h2>
      </div>
      
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">🚛</div>
          <div className="metric-content">
            <div className="metric-value">{fleetMetrics.total}</div>
            <div className="metric-label">Total Vehicles</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">🚗</div>
          <div className="metric-content">
            <div className="metric-value">{fleetMetrics.active}</div>
            <div className="metric-label">Active Trips</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <div className="metric-value">{fleetMetrics.available}</div>
            <div className="metric-label">Available</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">⚡</div>
          <div className="metric-content">
            <div className="metric-value">{fleetMetrics.charging}</div>
            <div className="metric-label">Charging</div>
          </div>
        </div>
      </div>
      
      <div className="section-header">
        <h3>Recent Vehicles</h3>
      </div>
      
      <div className="battery-grid">
        {recentVehicles.map(vehicle => (
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
                <span className="detail-label">Status:</span>
                <span 
                  className="detail-value"
                  style={{ color: getStatusColor(vehicle.status) }}
                >
                  {vehicle.status || 'N/A'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Speed:</span>
                <span className="detail-value">{vehicle.speed} km/h</span>
              </div>
              {vehicle.status === 'charging' && (
                <div className="detail-item">
                  <span className="detail-label">Charging:</span>
                  <span className="detail-value">{vehicle.chargingLevel || vehicle.batteryLevel || 0}%</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="map-placeholder">
        <div className="map-placeholder-content">
          <div className="map-icon">🗺️</div>
          <p>Fleet Summary Dashboard</p>
          <p className="map-subtext">Switch to Live Map for real-time vehicle tracking</p>
        </div>
      </div>
      
      <style>{`
        .dashboard-map-container {
          background-color: #1e293b;
          border-radius: 8px;
          padding: 20px;
          height: 100%;
        }
        
        .dashboard-header h2 {
          margin: 0 0 20px 0;
          color: #f8fafc;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .metric-card {
          background-color: #0f172a;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .metric-icon {
          font-size: 24px;
        }
        
        .metric-content {
          flex: 1;
        }
        
        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #3b82f6;
          margin-bottom: 4px;
        }
        
        .metric-label {
          color: #94a3b8;
          font-size: 14px;
        }
        
        .section-header h3 {
          color: #f8fafc;
          margin: 0 0 16px 0;
        }
        
        .map-placeholder {
          background-color: #0f172a;
          border-radius: 8px;
          height: 250px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 20px;
        }
        
        .map-placeholder-content {
          text-align: center;
          color: #94a3b8;
        }
        
        .map-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .map-subtext {
          font-size: 14px;
          margin-top: 8px;
        }
        
        .loading {
          text-align: center;
          padding: 40px;
          color: #94a3b8;
        }
        
        /* Battery Card Styles */
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
          border: 1px solid #374151;
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
        
        @media (max-width: 768px) {
          .battery-grid {
            grid-template-columns: 1fr;
          }
          
          .metrics-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardMap;
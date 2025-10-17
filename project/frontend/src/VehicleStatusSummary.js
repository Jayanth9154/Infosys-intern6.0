import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { API_BASE_URL } from './config';

function VehicleStatusSummary() {
  const { currentUser } = useContext(AuthContext);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const token = await currentUser.getIdToken();
        const response = await axios.get(`${API_BASE_URL}/api/vehicles`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVehicles(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch vehicles:', err);
        setError('Failed to load vehicle data');
        setLoading(false);
      }
    };
    
    fetchVehicles();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchVehicles, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [currentUser]);

  // Group vehicles by status
  const groupVehiclesByStatus = () => {
    if (vehicles.length === 0) return {};
    
    return vehicles.reduce((groups, vehicle) => {
      const status = vehicle.status || 'unknown';
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(vehicle);
      return groups;
    }, {});
  };

  const statusGroups = groupVehiclesByStatus();
  const totalVehicles = vehicles.length;

  if (loading) {
    return (
      <div className="vehicle-status-summary">
        <div className="summary-loading">Loading vehicle status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vehicle-status-summary">
        <div className="summary-error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="vehicle-status-summary">
      <h3>Fleet Status Overview</h3>
      
      <div className="status-summary-grid">
        {Object.entries(statusGroups).map(([status, vehicles]) => {
          const percentage = Math.round((vehicles.length / totalVehicles) * 100);
          
          // Status colors
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
          
          // Status icons
          const getStatusIcon = (status) => {
            switch (status) {
              case 'available': return '✅';
              case 'on-trip': return '🚗';
              case 'maintenance': return '🔧';
              case 'charging': return '⚡';
              case 'out-of-service': return '❌';
              default: return '❓';
            }
          };
          
          return (
            <div key={status} className="status-card">
              <div className="status-header">
                <span className="status-icon">{getStatusIcon(status)}</span>
                <span className="status-title">{status.replace('-', ' ')}</span>
              </div>
              <div className="status-count">{vehicles.length}</div>
              <div className="status-percentage">{percentage}%</div>
              <div 
                className="status-bar" 
                style={{ 
                  backgroundColor: getStatusColor(status),
                  width: `${percentage}%`
                }}
              ></div>
            </div>
          );
        })}
      </div>
      
      <div className="total-vehicles">
        <span>Total Vehicles: {totalVehicles}</span>
      </div>
      
      <style>{`
        .vehicle-status-summary {
          background-color: #1e293b;
          border-radius: 8px;
          padding: 16px;
          margin-top: 20px;
        }
        
        .vehicle-status-summary h3 {
          margin: 0 0 16px 0;
          color: #f8fafc;
        }
        
        .status-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .status-card {
          background-color: #0f172a;
          border-radius: 6px;
          padding: 12px;
          position: relative;
          overflow: hidden;
        }
        
        .status-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        }
        
        .status-icon {
          font-size: 16px;
        }
        
        .status-title {
          font-size: 14px;
          color: #94a3b8;
          text-transform: capitalize;
        }
        
        .status-count {
          font-size: 20px;
          font-weight: bold;
          color: #f8fafc;
          margin-bottom: 4px;
        }
        
        .status-percentage {
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 8px;
        }
        
        .status-bar {
          height: 4px;
          border-radius: 2px;
        }
        
        .total-vehicles {
          text-align: center;
          padding-top: 12px;
          border-top: 1px solid #334155;
          color: #94a3b8;
          font-size: 14px;
        }
        
        .summary-loading, .summary-error {
          text-align: center;
          padding: 20px;
          color: #94a3b8;
        }
        
        .summary-error {
          color: #ef4444;
        }
      `}</style>
    </div>
  );
}

export default VehicleStatusSummary;

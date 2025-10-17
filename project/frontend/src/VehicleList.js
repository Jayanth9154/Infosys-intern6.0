import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { API_BASE_URL, WS_BASE_URL } from './config';

function VehicleList({ refreshTrigger, onEdit }) {
  const { currentUser, role } = useContext(AuthContext);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openHistoryFor, setOpenHistoryFor] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [telemetryData, setTelemetryData] = useState({});
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        if (!currentUser) return;
        const token = await currentUser.getIdToken();
        const response = await axios.get(`${API_BASE_URL}/api/vehicles`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVehicles(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch vehicles. Please check the backend server and ensure you are authorized.');
        setLoading(false);
        console.error(err);
      }
    };
    fetchVehicles();
  }, [refreshTrigger, currentUser]);

  // Fetch real-time telemetry data
  useEffect(() => {
    if (!vehicles.length) return;

    const fetchTelemetry = async () => {
      try {
        const token = await currentUser.getIdToken();
        const response = await axios.get(`${API_BASE_URL}/api/vehicles/telemetry/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Convert array to object for easier lookup
        const telemetryObj = {};
        response.data.forEach(vehicle => {
          telemetryObj[vehicle.id] = {
            ...vehicle,
            batteryLevel: vehicle.batteryLevel !== undefined ? parseFloat(vehicle.batteryLevel.toFixed(2)) : 0,
            fuelLevel: vehicle.fuelLevel !== undefined ? parseFloat(vehicle.fuelLevel.toFixed(2)) : 0,
            speed: vehicle.speed !== undefined ? parseFloat(vehicle.speed.toFixed(2)) : 0,
            engineTemp: vehicle.engineTemp !== undefined ? parseFloat(vehicle.engineTemp.toFixed(2)) : 0,
            tirePressure: vehicle.tirePressure !== undefined ? parseFloat(vehicle.tirePressure.toFixed(2)) : 0,
            mileage: vehicle.mileage !== undefined ? parseFloat(vehicle.mileage.toFixed(2)) : 0,
            latitude: vehicle.latitude !== undefined ? parseFloat(vehicle.latitude.toFixed(6)) : 0,
            longitude: vehicle.longitude !== undefined ? parseFloat(vehicle.longitude.toFixed(6)) : 0
          };
        });
        setTelemetryData(telemetryObj);
      } catch (err) {
        console.error('Failed to fetch telemetry data:', err);
      }
    };

    fetchTelemetry();
    
    // Set up WebSocket for real-time updates
    const ws = new WebSocket(`${WS_BASE_URL}`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'vehicle_update') {
          setTelemetryData(prev => ({
            ...prev,
            [data.id]: { 
              ...prev[data.id], 
              ...data,
              batteryLevel: data.batteryLevel !== undefined ? parseFloat(data.batteryLevel.toFixed(2)) : (prev[data.id]?.batteryLevel || 0),
              fuelLevel: data.fuelLevel !== undefined ? parseFloat(data.fuelLevel.toFixed(2)) : (prev[data.id]?.fuelLevel || 0),
              speed: data.speed !== undefined ? parseFloat(data.speed.toFixed(2)) : (prev[data.id]?.speed || 0),
              engineTemp: data.engineTemp !== undefined ? parseFloat(data.engineTemp.toFixed(2)) : (prev[data.id]?.engineTemp || 0),
              tirePressure: data.tirePressure !== undefined ? parseFloat(data.tirePressure.toFixed(2)) : (prev[data.id]?.tirePressure || 0),
              mileage: data.mileage !== undefined ? parseFloat(data.mileage.toFixed(2)) : (prev[data.id]?.mileage || 0),
              latitude: data.latitude !== undefined ? parseFloat(data.latitude.toFixed(6)) : (prev[data.id]?.latitude || 0),
              longitude: data.longitude !== undefined ? parseFloat(data.longitude.toFixed(6)) : (prev[data.id]?.longitude || 0)
            }
          }));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    // Set up polling as fallback
    const interval = setInterval(fetchTelemetry, 10000); // Every 10 seconds

    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, [vehicles, currentUser]);

  if (loading) return <div className="panel">Loading vehicles...</div>;
  if (error) return <div className="panel">Error: {error}</div>;

  const toggleHistory = async (id) => {
    if (openHistoryFor === id) {
      setOpenHistoryFor(null);
      setHistory([]);
      return;
    }
    try {
      setHistoryLoading(true);
      const token = await currentUser.getIdToken();
      const res = await axios.get(`${API_BASE_URL}/api/vehicles/${id}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data.events || []);
      setOpenHistoryFor(id);
    } catch (e) {
      console.error('Failed to load history', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Handle add vehicle - only for admin users
  const handleAddVehicle = () => {
    if (role !== 'admin') {
      // We can't show an alert here because we don't have access to the alert state
      // This will be handled in the parent component
      return;
    }
    // Navigate to the vehicles tab where the add form is located
    window.location.hash = '#vehicles';
  };

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

  // Function to get battery level class
  const getBatteryLevelClass = (level) => {
    if (level >= 70) return 'high';
    if (level >= 30) return 'medium';
    return 'low';
  };

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Vehicle List</h2>
        <div className="row" style={{ gap: 8 }}>
          {role === 'admin' && (
            <button className="button primary" onClick={handleAddVehicle}>
              ➕ Add Vehicle
            </button>
          )}
        </div>
      </div>
      
      <div className="battery-grid">
        {vehicles.map(vehicle => {
          const telemetry = telemetryData[vehicle.id] || {};
          return (
            <div 
              key={vehicle.id} 
              className={`battery-card ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`}
              onClick={() => setSelectedVehicle(vehicle)}
            >
              <div className="battery-card-header">
                <h3>{vehicle.make} {vehicle.model}</h3>
                <span className="badge">{vehicle.licensePlate || 'N/A'}</span>
              </div>
              
              {/* Battery/Fuel Level */}
              <div className="battery-level-container">
                <div 
                  className={`battery-level ${getBatteryLevelClass(
                    vehicle.vehicleType === 'ev' || vehicle.vehicleType === 'hybrid' 
                      ? telemetry.batteryLevel || vehicle.batteryLevel || 0 
                      : telemetry.fuelLevel || vehicle.fuelLevel || 0
                  )}`}
                  style={{ 
                    width: `${parseFloat(
                      vehicle.vehicleType === 'ev' || vehicle.vehicleType === 'hybrid' 
                        ? telemetry.batteryLevel || vehicle.batteryLevel || 0 
                        : telemetry.fuelLevel || vehicle.fuelLevel || 0
                    )}%` 
                  }}
                ></div>
                <span className="battery-percentage">
                  {parseFloat(
                    vehicle.vehicleType === 'ev' || vehicle.vehicleType === 'hybrid' 
                      ? telemetry.batteryLevel || vehicle.batteryLevel || 0 
                      : telemetry.fuelLevel || vehicle.fuelLevel || 0
                  )}%
                </span>
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
                  <span className="detail-value">
                    {telemetry.speed !== undefined ? `${telemetry.speed} km/h` : 'N/A'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">
                    {vehicle.vehicleType === 'ev' || vehicle.vehicleType === 'hybrid' ? 'Battery' : 'Fuel'}:
                  </span>
                  <span className="detail-value">
                    {vehicle.vehicleType === 'ev' || vehicle.vehicleType === 'hybrid' 
                      ? `${telemetry.batteryLevel !== undefined ? telemetry.batteryLevel : 'N/A'}%`
                      : `${telemetry.fuelLevel !== undefined ? telemetry.fuelLevel : 'N/A'}%`}
                  </span>
                </div>
              </div>
              
              <div className="row" style={{ gap: 8, marginTop: 12 }}>
                <button 
                  className="button outline small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleHistory(vehicle.id);
                  }}
                >
                  {openHistoryFor === vehicle.id ? 'Hide History' : 'Show History'}
                </button>
                {role === 'admin' && (
                  <>
                    <button 
                      className="button outline small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(vehicle);
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      className="button danger small"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Are you sure you want to delete ${vehicle.make} ${vehicle.model}?`)) {
                          const deleteVehicle = async (id) => {
                            try {
                              const token = await currentUser.getIdToken();
                              await axios.delete(`${API_BASE_URL}/api/vehicles/${id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              setVehicles(vehicles.filter(v => v.id !== id));
                            } catch (error) {
                              console.error('Error deleting vehicle:', error);
                              setError('Failed to delete vehicle. Check permissions.');
                            }
                          };
                          deleteVehicle(vehicle.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
              
              {openHistoryFor === vehicle.id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #374151' }}>
                  <h4 style={{ margin: '0 0 12px 0' }}>History</h4>
                  {historyLoading ? (
                    <div style={{ textAlign: 'center', padding: '12px', color: '#9ca3af' }}>Loading history...</div>
                  ) : history.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '12px', color: '#9ca3af' }}>No history yet.</div>
                  ) : (
                    <ul style={{ marginLeft: 0, paddingLeft: 0, maxHeight: '150px', overflowY: 'auto' }}>
                      {history.slice(0, 3).map(evt => (
                        <li key={evt.id} style={{ 
                          marginBottom: 8, 
                          paddingBottom: 8, 
                          borderBottom: '1px solid #374151',
                          listStyle: 'none'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span className="badge">{evt.eventType || 'N/A'}</span>
                            <span style={{ color: '#9ca3af' }}>
                              {evt.timestamp ? new Date(evt.timestamp._seconds ? evt.timestamp._seconds * 1000 : new Date(evt.timestamp).getTime() || evt.timestamp).toLocaleString() : 'N/A'}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
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
        
        .button.small {
          padding: 4px 8px;
          font-size: 12px;
        }
        
        @media (max-width: 768px) {
          .battery-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default VehicleList;
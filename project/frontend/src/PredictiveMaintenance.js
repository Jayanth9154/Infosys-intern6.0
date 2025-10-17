import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { API_BASE_URL } from './config';

function PredictiveMaintenance() {
  const { currentUser } = useContext(AuthContext);
  const [vehicles, setVehicles] = useState([]);
  const [maintenanceData, setMaintenanceData] = useState({
    healthy: 0,
    due: 0,
    critical: 0
  });
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);

  // Fetch vehicles and generate maintenance data
  useEffect(() => {
    const fetchMaintenanceData = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const token = await currentUser.getIdToken();
        const response = await axios.get(`${API_BASE_URL}/api/vehicles`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Generate maintenance data for each vehicle
        const vehiclesWithMaintenance = response.data.map(vehicle => {
          const mileage = vehicle.mileage || Math.floor(Math.random() * 100000);
          const lastServiceMileage = mileage - Math.floor(Math.random() * 10000);
          const mileageSinceService = mileage - lastServiceMileage;
          
          // Generate component health scores (0-100)
          const engineHealth = Math.max(0, 100 - (mileageSinceService / 100) - Math.random() * 20);
          const brakeHealth = Math.max(0, 100 - (mileageSinceService / 120) - Math.random() * 15);
          const tireHealth = Math.max(0, 100 - (mileageSinceService / 80) - Math.random() * 25);
          const batteryHealth = Math.max(0, 100 - (mileageSinceService / 150) - Math.random() * 10);
          const transmissionHealth = Math.max(0, 100 - (mileageSinceService / 200) - Math.random() * 15);

          // Calculate overall health
          const overallHealth = (engineHealth + brakeHealth + tireHealth + batteryHealth + transmissionHealth) / 5;

          // Determine maintenance status
          let maintenanceStatus = 'healthy';
          if (overallHealth < 30) maintenanceStatus = 'critical';
          else if (overallHealth < 70) maintenanceStatus = 'due';

          // Generate predictions
          const predictions = [];
          if (engineHealth < 40) predictions.push({ component: 'Engine', daysUntilService: Math.floor((40 - engineHealth) * 10), severity: 'high' });
          if (brakeHealth < 50) predictions.push({ component: 'Brakes', daysUntilService: Math.floor((50 - brakeHealth) * 8), severity: 'medium' });
          if (tireHealth < 30) predictions.push({ component: 'Tires', daysUntilService: Math.floor((30 - tireHealth) * 5), severity: 'high' });
          if (batteryHealth < 60) predictions.push({ component: 'Battery', daysUntilService: Math.floor((60 - batteryHealth) * 12), severity: 'low' });

          return {
            ...vehicle,
            mileage,
            lastServiceMileage,
            mileageSinceService,
            maintenanceStatus,
            overallHealth: Math.round(overallHealth),
            componentHealth: {
              engine: Math.round(engineHealth),
              brakes: Math.round(brakeHealth),
              tires: Math.round(tireHealth),
              battery: Math.round(batteryHealth),
              transmission: Math.round(transmissionHealth)
            },
            predictions,
            nextServiceDue: Math.max(0, 10000 - mileageSinceService),
            estimatedServiceCost: Math.floor(Math.random() * 2000) + 500,
            lastServiceDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
          };
        });

        setVehicles(vehiclesWithMaintenance);

        // Calculate maintenance statistics
        const stats = vehiclesWithMaintenance.reduce((acc, vehicle) => {
          acc[vehicle.maintenanceStatus]++;
          return acc;
        }, { healthy: 0, due: 0, critical: 0 });

        setMaintenanceData(stats);

        // Generate alerts for critical vehicles
        const criticalAlerts = vehiclesWithMaintenance
          .filter(v => v.maintenanceStatus === 'critical')
          .map(vehicle => ({
            id: vehicle.id,
            type: 'critical',
            message: `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate}) requires immediate attention`,
            timestamp: new Date().toISOString()
          }));

        setAlerts(criticalAlerts);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch maintenance data:', error);
        setLoading(false);
      }
    };

    fetchMaintenanceData();
  }, [currentUser]);

  // Pie chart component
  const PieChart = ({ data, size = 200 }) => {
    const total = data.healthy + data.due + data.critical;
    if (total === 0) return <div>No data available</div>;

    const healthyPercentage = (data.healthy / total) * 100;
    const duePercentage = (data.due / total) * 100;
    const criticalPercentage = (data.critical / total) * 100;

    // Calculate angles for pie slices
    const healthyAngle = (healthyPercentage / 100) * 360;
    const dueAngle = (duePercentage / 100) * 360;
    const criticalAngle = (criticalPercentage / 100) * 360;

    const radius = size / 2 - 10;
    const centerX = size / 2;
    const centerY = size / 2;

    // Create SVG paths for pie slices
    const createPath = (startAngle, endAngle, color) => {
      const start = polarToCartesian(centerX, centerY, radius, endAngle);
      const end = polarToCartesian(centerX, centerY, radius, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
      
      return {
        d: `M ${centerX} ${centerY} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`,
        fill: color
      };
    };

    const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
      return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
      };
    };

    let currentAngle = 0;
    const slices = [];

    if (healthyPercentage > 0) {
      slices.push(createPath(currentAngle, currentAngle + healthyAngle, '#10b981'));
      currentAngle += healthyAngle;
    }

    if (duePercentage > 0) {
      slices.push(createPath(currentAngle, currentAngle + dueAngle, '#f59e0b'));
      currentAngle += dueAngle;
    }

    if (criticalPercentage > 0) {
      slices.push(createPath(currentAngle, currentAngle + criticalAngle, '#ef4444'));
    }

    return (
      <div className="pie-chart-container">
        <svg width={size} height={size} className="pie-chart">
          {slices.map((slice, index) => (
            <path key={index} d={slice.d} fill={slice.fill} />
          ))}
        </svg>
        <div className="pie-chart-legend">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#10b981' }}></div>
            <span>Healthy ({data.healthy})</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#f59e0b' }}></div>
            <span>Due ({data.due})</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ef4444' }}></div>
            <span>Critical ({data.critical})</span>
          </div>
        </div>
      </div>
    );
  };

  // Component health bar
  const HealthBar = ({ label, value, icon }) => {
    const getHealthColor = (health) => {
      if (health >= 80) return '#10b981';
      if (health >= 60) return '#f59e0b';
      if (health >= 40) return '#f97316';
      return '#ef4444';
    };

    return (
      <div className="health-bar-container">
        <div className="health-bar-header">
          <span className="health-icon">{icon}</span>
          <span className="health-label">{label}</span>
          <span className="health-value">{value}%</span>
        </div>
        <div className="health-bar-track">
          <div 
            className="health-bar-fill"
            style={{ 
              width: `${value}%`,
              backgroundColor: getHealthColor(value)
            }}
          />
        </div>
      </div>
    );
  };

  if (loading) return <div className="panel">Loading maintenance data...</div>;

  return (
    <div className="panel">
      <div className="maintenance-header">
        <h2>Predictive Maintenance & Health Analytics</h2>
        <div className="maintenance-summary">
          <div className="summary-stat">
            <span className="stat-value">{vehicles.length}</span>
            <span className="stat-label">Total Vehicles</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value">{maintenanceData.healthy}</span>
            <span className="stat-label">Healthy</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value">{maintenanceData.due}</span>
            <span className="stat-label">Due for Service</span>
          </div>
          <div className="summary-stat critical">
            <span className="stat-value">{maintenanceData.critical}</span>
            <span className="stat-label">Critical</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="maintenance-alerts">
          <h3>🚨 Critical Alerts</h3>
          {alerts.map(alert => (
            <div key={alert.id} className="alert critical">
              <span className="alert-icon">⚠️</span>
              <span className="alert-message">{alert.message}</span>
              <span className="alert-time">{new Date(alert.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      )}

      <div className="maintenance-dashboard">
        {/* Pie Chart */}
        <div className="dashboard-section">
          <h3>Fleet Health Overview</h3>
          <PieChart data={maintenanceData} size={250} />
        </div>

        {/* Vehicle List */}
        <div className="dashboard-section">
          <h3>Vehicle Health Status</h3>
          <div className="vehicle-health-list">
            {vehicles.map(vehicle => (
              <div 
                key={vehicle.id} 
                className={`vehicle-health-item ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`}
                onClick={() => setSelectedVehicle(vehicle)}
              >
                <div className="vehicle-basic-info">
                  <h4>{vehicle.make} {vehicle.model}</h4>
                  <span className="license-plate">{vehicle.licensePlate}</span>
                  <div className={`status-badge ${vehicle.maintenanceStatus}`}>
                    {vehicle.maintenanceStatus.toUpperCase()}
                  </div>
                </div>
                <div className="vehicle-health-summary">
                  <div className="overall-health">
                    <span className="health-percentage">{vehicle.overallHealth}%</span>
                    <span className="health-label">Overall Health</span>
                  </div>
                  <div className="next-service">
                    <span className="service-mileage">{vehicle.nextServiceDue} km</span>
                    <span className="service-label">Until Service</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Vehicle View */}
      {selectedVehicle && (
        <div className="vehicle-detail-panel">
          <div className="detail-header">
            <h3>{selectedVehicle.make} {selectedVehicle.model} - Detailed Health Report</h3>
            <button className="button outline" onClick={() => setSelectedVehicle(null)}>
              Close
            </button>
          </div>

          <div className="detail-content">
            {/* Component Health */}
            <div className="detail-section">
              <h4>Component Health</h4>
              <div className="component-health-grid">
                <HealthBar 
                  label="Engine" 
                  value={selectedVehicle.componentHealth.engine} 
                  icon="🔧" 
                />
                <HealthBar 
                  label="Brakes" 
                  value={selectedVehicle.componentHealth.brakes} 
                  icon="🛑" 
                />
                <HealthBar 
                  label="Tires" 
                  value={selectedVehicle.componentHealth.tires} 
                  icon="🛞" 
                />
                <HealthBar 
                  label="Battery" 
                  value={selectedVehicle.componentHealth.battery} 
                  icon="🔋" 
                />
                <HealthBar 
                  label="Transmission" 
                  value={selectedVehicle.componentHealth.transmission} 
                  icon="⚙️" 
                />
              </div>
            </div>

            {/* Predictions */}
            <div className="detail-section">
              <h4>Maintenance Predictions</h4>
              {selectedVehicle.predictions.length > 0 ? (
                <div className="predictions-list">
                  {selectedVehicle.predictions.map((prediction, index) => (
                    <div key={index} className={`prediction-item ${prediction.severity}`}>
                      <div className="prediction-component">{prediction.component}</div>
                      <div className="prediction-timeline">
                        Service needed in {prediction.daysUntilService} days
                      </div>
                      <div className={`prediction-severity ${prediction.severity}`}>
                        {prediction.severity.toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-predictions">No immediate maintenance required</p>
              )}
            </div>

            {/* Service Information */}
            <div className="detail-section">
              <h4>Service Information</h4>
              <div className="service-info-grid">
                <div className="service-info-item">
                  <span className="info-label">Current Mileage</span>
                  <span className="info-value">{selectedVehicle.mileage.toLocaleString()} km</span>
                </div>
                <div className="service-info-item">
                  <span className="info-label">Miles Since Service</span>
                  <span className="info-value">{selectedVehicle.mileageSinceService.toLocaleString()} km</span>
                </div>
                <div className="service-info-item">
                  <span className="info-label">Last Service Date</span>
                  <span className="info-value">{new Date(selectedVehicle.lastServiceDate).toLocaleDateString()}</span>
                </div>
                <div className="service-info-item">
                  <span className="info-label">Estimated Service Cost</span>
                  <span className="info-value">${selectedVehicle.estimatedServiceCost}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .maintenance-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .maintenance-summary {
          display: flex;
          gap: 24px;
        }

        .summary-stat {
          text-align: center;
        }

        .summary-stat.critical .stat-value {
          color: #ef4444;
        }

        .stat-value {
          display: block;
          font-size: 24px;
          font-weight: bold;
          color: #3b82f6;
        }

        .stat-label {
          display: block;
          font-size: 12px;
          color: #94a3b8;
          margin-top: 4px;
        }

        .maintenance-alerts {
          background-color: #1e293b;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background-color: #0f172a;
          border-radius: 6px;
          margin-bottom: 8px;
        }

        .alert.critical {
          border-left: 4px solid #ef4444;
        }

        .alert-icon {
          font-size: 20px;
        }

        .alert-message {
          flex: 1;
          color: #f8fafc;
        }

        .alert-time {
          font-size: 12px;
          color: #94a3b8;
        }

        .maintenance-dashboard {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        .dashboard-section {
          background-color: #1e293b;
          border-radius: 8px;
          padding: 20px;
        }

        .pie-chart-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .pie-chart-legend {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 2px;
        }

        .vehicle-health-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 400px;
          overflow-y: auto;
        }

        .vehicle-health-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background-color: #0f172a;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .vehicle-health-item:hover {
          background-color: #1e293b;
        }

        .vehicle-health-item.selected {
          background-color: #1e40af;
        }

        .vehicle-basic-info h4 {
          margin: 0 0 4px 0;
          color: #f8fafc;
        }

        .license-plate {
          font-size: 12px;
          color: #94a3b8;
        }

        .status-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          margin-top: 4px;
        }

        .status-badge.healthy {
          background-color: #10b981;
          color: white;
        }

        .status-badge.due {
          background-color: #f59e0b;
          color: white;
        }

        .status-badge.critical {
          background-color: #ef4444;
          color: white;
        }

        .vehicle-health-summary {
          display: flex;
          gap: 16px;
          text-align: center;
        }

        .overall-health, .next-service {
          display: flex;
          flex-direction: column;
        }

        .health-percentage, .service-mileage {
          font-size: 18px;
          font-weight: bold;
          color: #3b82f6;
        }

        .health-label, .service-label {
          font-size: 12px;
          color: #94a3b8;
        }

        .vehicle-detail-panel {
          background-color: #1e293b;
          border-radius: 8px;
          padding: 20px;
        }

        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .detail-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .detail-section h4 {
          margin: 0 0 16px 0;
          color: #f8fafc;
        }

        .component-health-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .health-bar-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .health-bar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .health-icon {
          font-size: 16px;
        }

        .health-label {
          flex: 1;
          margin-left: 8px;
          color: #e2e8f0;
        }

        .health-value {
          font-weight: bold;
          color: #3b82f6;
        }

        .health-bar-track {
          height: 8px;
          background-color: #334155;
          border-radius: 4px;
          overflow: hidden;
        }

        .health-bar-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .predictions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .prediction-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background-color: #0f172a;
          border-radius: 6px;
        }

        .prediction-component {
          font-weight: bold;
          color: #f8fafc;
        }

        .prediction-timeline {
          color: #94a3b8;
        }

        .prediction-severity {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }

        .prediction-severity.high {
          background-color: #ef4444;
          color: white;
        }

        .prediction-severity.medium {
          background-color: #f59e0b;
          color: white;
        }

        .prediction-severity.low {
          background-color: #10b981;
          color: white;
        }

        .no-predictions {
          color: #94a3b8;
          font-style: italic;
        }

        .service-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .service-info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .info-label {
          font-size: 12px;
          color: #94a3b8;
        }

        .info-value {
          font-weight: bold;
          color: #f8fafc;
        }
        
        @media (max-width: 768px) {
          .maintenance-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          
          .maintenance-summary {
            width: 100%;
            justify-content: space-between;
          }
          
          .maintenance-dashboard {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .component-health-grid {
            grid-template-columns: 1fr 1fr;
          }
          
          .service-info-grid {
            grid-template-columns: 1fr;
          }
          
          .vehicle-health-list {
            max-height: 300px;
          }
        }
        
        @media (max-width: 480px) {
          .component-health-grid {
            grid-template-columns: 1fr;
          }
          
          .vehicle-health-summary {
            flex-direction: column;
            gap: 8px;
          }
          
          .alert {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          
          .alert-time {
            align-self: flex-end;
          }
        }
      `}</style>
    </div>
  );
}

export default PredictiveMaintenance;

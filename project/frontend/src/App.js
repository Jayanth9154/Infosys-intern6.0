import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext, AuthProvider } from './AuthContext';
import LogoutButton from './LogoutButton';
import AuthComponent from './AuthComponent';
import Alert from './Alert';
import Notifications from './Notifications';
import DashboardMap from './DashboardMap';
import VehicleList from './VehicleList';
import VehicleInventory from './VehicleInventory';
import VehicleMap from './VehicleMap';
import VehicleForm from './VehicleForm';
import UpdateForm from './UpdateForm';
import BatteryMonitoring from './BatteryMonitoring';
import CustomerBooking from './CustomerBooking';
import PredictiveMaintenance from './PredictiveMaintenance';
import RouteOptimization from './RouteOptimization';
import AdminPanel from './AdminPanel';
import Profile from './Profile';
import { API_BASE_URL } from './config';

function AppContent() {
  const [refreshList, setRefreshList] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [fleetMetrics, setFleetMetrics] = useState({ loading: false, error: null, data: null });
  const { currentUser, role } = useContext(AuthContext);
  const [alert, setAlert] = useState(null);

  // Add event listener for navigation events
  useEffect(() => {
    const handleNavigation = (event) => {
      if (event.detail) {
        setActiveTab(event.detail);
      }
    };

    window.addEventListener('navigateToTab', handleNavigation);
    
    return () => {
      window.removeEventListener('navigateToTab', handleNavigation);
    };
  }, []);

  useEffect(() => {
    let cancel = false;
    const fetchMetrics = async () => {
      if (!currentUser) {
        setFleetMetrics({ loading: false, error: null, data: null });
        return;
      }

      setFleetMetrics(prev => ({ ...prev, loading: true, error: null }));

      try {
        const token = await currentUser.getIdToken();
        const response = await axios.get(`${API_BASE_URL}/api/vehicles/status-distribution`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!cancel) {
          setFleetMetrics({ loading: false, error: null, data: response.data });
        }
      } catch (error) {
        console.error('Failed to load fleet metrics:', error);
        if (!cancel) {
          setFleetMetrics({ loading: false, error: 'Unable to load fleet metrics', data: null });
        }
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000);

    return () => {
      cancel = true;
      clearInterval(interval);
    };
  }, [currentUser]);

  const handleVehicleAdded = () => {
    setRefreshList(prev => !prev);
    setAlert({
      message: 'Vehicle added successfully!',
      type: 'success'
    });
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
  };

  const handleUpdateComplete = () => {
    setEditingVehicle(null);
    setRefreshList(prev => !prev);
    setAlert({
      message: 'Vehicle updated successfully!',
      type: 'success'
    });
  };

  // Navigation items - make all features available to all users
  const getNavigationItems = () => {
    const items = [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'inventory', label: 'Fleet Inventory', icon: '🚛' },
      { id: 'map', label: 'Live Map', icon: '🗺️' },
      { id: 'vehicles', label: 'Vehicles', icon: '🚗' },
      { id: 'battery', label: 'Battery', icon: '🔋' },
      { id: 'booking', label: 'Customer Booking', icon: '📅' },
      { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
      { id: 'routes', label: 'Route Optimization', icon: '🛣️' },
      { id: 'admin', label: 'Admin', icon: '⚙️' } // Make admin panel available to all users
    ];

    items.push({ id: 'profile', label: 'Profile', icon: '👤' });

    return items;
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="dashboard-layout">
            <div className="dashboard-main">
              <DashboardMap />
              <div className="dashboard-stats">
                <div className="stat-card">
                  <h3>Total Vehicles</h3>
                  <div className="stat-value">
                    {fleetMetrics.loading ? '—' : fleetMetrics.data?.totalVehicles ?? '0'}
                  </div>
                  <div className="stat-label">Active Fleet</div>
                </div>
                <div className="stat-card">
                  <h3>On Trip</h3>
                  <div className="stat-value">
                    {fleetMetrics.loading ? '—' : fleetMetrics.data?.activeTrips ?? '0'}
                  </div>
                  <div className="stat-label">Currently in use</div>
                </div>
                <div className="stat-card">
                  <h3>Available</h3>
                  <div className="stat-value">
                    {fleetMetrics.loading ? '—' : fleetMetrics.data?.availableVehicles ?? '0'}
                  </div>
                  <div className="stat-label">Ready for service</div>
                </div>
                <div className="stat-card">
                  <h3>Charging</h3>
                  <div className="stat-value">
                    {fleetMetrics.loading ? '—' : fleetMetrics.data?.chargingVehicles ?? '0'}
                  </div>
                  <div className="stat-label">At charging stations</div>
                </div>
              </div>
              {fleetMetrics.error && (
                <div className="panel" style={{ marginTop: 16 }}>
                  <strong>Warning:</strong> {fleetMetrics.error}
                </div>
              )}
            </div>
            <div className="dashboard-sidebar">
              <VehicleList refreshTrigger={refreshList} onEdit={handleEdit} />
            </div>
          </div>
        );
      
      case 'inventory':
        return <VehicleInventory />;
      
      case 'map':
        return <VehicleMap />;
      
      case 'vehicles':
        return (
          <div className="two-column-layout">
            <div>
              {/* Make vehicle form available to all users, not just admins */}
              {!editingVehicle && (
                <VehicleForm onVehicleAdded={handleVehicleAdded} />
              )}
              {editingVehicle && (
                <UpdateForm vehicle={editingVehicle} onUpdateComplete={handleUpdateComplete} />
              )}
            </div>
            <div>
              <VehicleList refreshTrigger={refreshList} onEdit={handleEdit} />
            </div>
          </div>
        );
      
      case 'battery':
        return <BatteryMonitoring />;
      
      case 'booking':
        return <CustomerBooking />;
      
      case 'maintenance':
        return <PredictiveMaintenance />;
      
      case 'routes':
        return <RouteOptimization />;
      
      case 'admin':
        return (
          <div>
            <AdminPanel />
            {!editingVehicle && (
              <VehicleForm onVehicleAdded={handleVehicleAdded} />
            )}
          </div>
        );
      
      case 'profile':
        return <Profile />;
      
      default:
        return <div className="panel">Page not found</div>;
    }
  };

  return (
    <div className="app-container">
      {alert && (
        <Alert 
          message={alert.message} 
          type={alert.type} 
          onClose={() => setAlert(null)} 
        />
      )}
      <Notifications />
      
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">NeuroFleetX</h1>
          <span className="app-subtitle">AI-Powered Fleet Management</span>
        </div>
        <div className="header-right">
          {currentUser && (
            <div className="user-info">
              <span className="user-email">{currentUser.email}</span>
              <span className="user-role">{role || 'User'}</span>
              <LogoutButton />
            </div>
          )}
        </div>
      </header>

      <AuthComponent />

      {currentUser ? (
        <div className="app-content">
          <nav className="app-nav">
            <ul className="nav-list">
              {getNavigationItems().map(item => (
                <li 
                  key={item.id}
                  className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {item.id === 'vehicles' && (
                    <span className="nav-badge">+</span>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          
          <main className="main-content">
            {renderContent()}
          </main>
        </div>
      ) : (
        <div className="panel login-prompt">
          <h2>Welcome to NeuroFleetX</h2>
          <p>Please log in to access the AI-powered fleet management platform.</p>
          <ul className="feature-list">
            <li>Real-time vehicle tracking and monitoring</li>
            <li>Advanced battery management for electric vehicles</li>
            <li>Predictive maintenance and diagnostics</li>
            <li>Comprehensive fleet analytics and reporting</li>
          </ul>
        </div>
      )}
      
      <style>{`
        .app-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background-color: #0f172a;
          color: #e2e8f0;
        }
        
        .app-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background-color: #1e293b;
          border-bottom: 1px solid #334155;
        }
        
        .header-left {
          display: flex;
          flex-direction: column;
        }
        
        .app-title {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
          color: #f8fafc;
        }
        
        .app-subtitle {
          font-size: 14px;
          color: #94a3b8;
        }
        
        .header-right {
          display: flex;
          align-items: center;
        }
        
        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .user-email {
          font-weight: bold;
        }
        
        .user-role {
          background-color: #334155;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          text-transform: uppercase;
        }
        
        .app-content {
          display: flex;
          flex: 1;
        }
        
        .app-nav {
          width: 220px;
          background-color: #1e293b;
          border-right: 1px solid #334155;
          padding: 16px 0;
        }
        
        .nav-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .nav-item {
          display: flex;
          align-items: center;
          padding: 12px 24px;
          cursor: pointer;
          transition: background-color 0.2s;
          position: relative;
        }
        
        .nav-item:hover {
          background-color: #334155;
        }
        
        .nav-item.active {
          background-color: #3b82f6;
          color: white;
        }
        
        .nav-icon {
          margin-right: 12px;
          font-size: 18px;
        }
        
        .nav-badge {
          position: absolute;
          right: 12px;
          background-color: #10b981;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
        }
        
        .main-content {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
        }
        
        .dashboard-layout {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 24px;
        }
        
        .dashboard-main {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        
        .stat-card {
          background-color: #1e293b;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #3b82f6;
          margin: 8px 0;
        }
        
        .stat-label {
          font-size: 12px;
          color: #94a3b8;
          text-transform: uppercase;
        }
        
        .login-prompt {
          max-width: 600px;
          margin: 40px auto;
          text-align: center;
        }
        
        .feature-list {
          text-align: left;
          margin-top: 32px;
        }
        
        .feature-list li {
          margin-bottom: 12px;
          padding-left: 24px;
          position: relative;
        }
        
        .feature-list li:before {
          content: "✓";
          color: #10b981;
          position: absolute;
          left: 0;
          font-weight: bold;
        }
        
        .two-column-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        
        /* Button Styles */
        .button {
          padding: 10px 16px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          font-size: 14px;
        }
        
        .button.primary {
          background-color: #3b82f6;
          color: white;
        }
        
        .button.primary:hover:not(:disabled) {
          background-color: #2563eb;
        }
        
        .button.outline {
          background-color: transparent;
          border: 1px solid #3b82f6;
          color: #3b82f6;
        }
        
        .button.outline:hover:not(:disabled) {
          background-color: rgba(59, 130, 246, 0.1);
        }
        
        .button.danger {
          background-color: #dc2626;
          color: white;
        }
        
        .button.danger:hover:not(:disabled) {
          background-color: #b91c1c;
        }
        
        .button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        /* Input Styles */
        .input, .select, .textarea {
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid #334155;
          background-color: #1e293b;
          color: #e2e8f0;
          font-size: 14px;
        }
        
        .input:focus, .select:focus, .textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }
        
        .panel {
          background-color: #1e293b;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border: 1px solid #334155;
          margin-bottom: 24px;
        }
        
        .panel h2 {
          margin-top: 0;
          color: #f8fafc;
        }
        
        .row {
          display: flex;
          gap: 12px;
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
        
        @media (max-width: 768px) {
          .app-nav {
            width: 80px;
          }
          
          .nav-label {
            display: none;
          }
          
          .nav-icon {
            margin-right: 0;
            font-size: 20px;
          }
          
          .dashboard-layout {
            grid-template-columns: 1fr;
          }
          
          .dashboard-sidebar {
            order: -1;
          }
          
          .dashboard-stats {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .two-column-layout {
            grid-template-columns: 1fr;
          }
          
          .row {
            flex-direction: column;
          }
        }
        
        @media (max-width: 768px) {
          .battery-grid {
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
        }
        
        @media (max-width: 480px) {
          .app-header {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }
          
          .header-right {
            justify-content: center;
          }
          
          .dashboard-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

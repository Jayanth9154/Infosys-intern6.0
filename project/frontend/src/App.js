import React, { useState, useContext } from 'react';
import { AuthProvider, AuthContext } from './AuthContext';
import VehicleList from './VehicleList';
import VehicleForm from './VehicleForm';
import UpdateForm from './UpdateForm';
import VehicleMap from './VehicleMap';
import AuthComponent from './AuthComponent';
import AdminPanel from './AdminPanel';
import Profile from './Profile';
import Notifications from './Notifications';
import BatteryMonitoring from './BatteryMonitoring';
import VehicleInventory from './VehicleInventory';
import CustomerBooking from './CustomerBooking';
import PredictiveMaintenance from './PredictiveMaintenance';
import RouteOptimization from './RouteOptimization';
import LogoutButton from './LogoutButton';

function AppContent() {
  const [refreshList, setRefreshList] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const { currentUser, role } = useContext(AuthContext);

  const handleVehicleAdded = () => {
    setRefreshList(prev => !prev);
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
  };

  const handleUpdateComplete = () => {
    setEditingVehicle(null);
    setRefreshList(prev => !prev);
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    const items = [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'inventory', label: 'Fleet Inventory', icon: '🚛' },
      { id: 'map', label: 'Live Map', icon: '🗺️' },
      { id: 'vehicles', label: 'Vehicles', icon: '🚗' },
      { id: 'battery', label: 'Battery', icon: '🔋' },
      { id: 'booking', label: 'Customer Booking', icon: '📅' },
      { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
      { id: 'routes', label: 'Route Optimization', icon: '🛣️' }
    ];

    if (role === 'admin') {
      items.push({ id: 'admin', label: 'Admin', icon: '⚙️' });
    }

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
              <VehicleMap />
              <div className="dashboard-stats">
                <div className="stat-card">
                  <h3>Total Vehicles</h3>
                  <div className="stat-value">{Math.floor(Math.random() * 50) + 20}</div>
                  <div className="stat-label">Active Fleet</div>
                </div>
                <div className="stat-card">
                  <h3>On Trip</h3>
                  <div className="stat-value">{Math.floor(Math.random() * 15) + 5}</div>
                  <div className="stat-label">Currently in use</div>
                </div>
                <div className="stat-card">
                  <h3>Available</h3>
                  <div className="stat-value">{Math.floor(Math.random() * 20) + 10}</div>
                  <div className="stat-label">Ready for service</div>
                </div>
                <div className="stat-card">
                  <h3>Charging</h3>
                  <div className="stat-value">{Math.floor(Math.random() * 8) + 2}</div>
                  <div className="stat-label">At charging stations</div>
                </div>
              </div>
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
              {role === 'admin' && !editingVehicle && (
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
              <span className="user-role">{role}</span>
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
        
        .stat-card h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          color: #94a3b8;
        }
        
        .stat-value {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .stat-label {
          font-size: 14px;
          color: #94a3b8;
        }
        
        .dashboard-sidebar {
          width: 100%;
        }
        
        .two-column-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        
        .login-prompt {
          max-width: 600px;
          margin: 48px auto;
          text-align: center;
        }
        
        .feature-list {
          text-align: left;
          margin-top: 24px;
          padding-left: 24px;
        }
        
        .feature-list li {
          margin-bottom: 8px;
        }
        
        .step-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #334155;
        }
        
        .step-indicator.active {
          background-color: #3b82f6;
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
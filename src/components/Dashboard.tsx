import React, { useState } from 'react';
import Header from './Header';
import FleetOverview from './FleetOverview';
import VehicleMap from './VehicleMap';
import RouteOptimization from './RouteOptimization';
import Analytics from './Analytics';
import FleetInventory from './FleetInventory';
import TelemetryDashboard from './TelemetryDashboard';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <FleetOverview />;
      case 'map':
        return <VehicleMap />;
      case 'telemetry':
        return <TelemetryDashboard />;
      case 'routes':
        return <RouteOptimization />;
      case 'analytics':
        return <Analytics />;
      case 'inventory':
        return <FleetInventory />;
      default:
        return <FleetOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header onLogout={onLogout} activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="pt-20">
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;
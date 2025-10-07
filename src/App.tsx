import React, { useState } from 'react';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Dashboard from './components/Dashboard';
import CustomerDashboard from './components/CustomerDashboard';
import DriverDashboard from './components/DriverDashboard';

type Page = 'login' | 'register' | 'dashboard';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState<'fleet_manager' | 'customer' | 'driver'>('fleet_manager');

  const handleLogin = (type: 'fleet_manager' | 'customer' | 'driver' = 'fleet_manager') => {
    setIsAuthenticated(true);
    setUserType(type);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserType('fleet_manager');
    setCurrentPage('login');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return (
          <LoginPage 
            onLogin={handleLogin}
            onSwitchToRegister={() => setCurrentPage('register')}
          />
        );
      case 'register':
        return (
          <RegisterPage 
            onRegister={handleLogin}
            onSwitchToLogin={() => setCurrentPage('login')}
          />
        );
      case 'dashboard':
        if (userType === 'customer') {
          return <CustomerDashboard onLogout={handleLogout} />;
        } else if (userType === 'driver') {
          return <DriverDashboard onLogout={handleLogout} />;
        } else {
          return <Dashboard onLogout={handleLogout} />;
        }
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {renderPage()}
    </div>
  );
}

export default App;
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';

function Notifications() {
  const { currentUser } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Generate sample notifications based on vehicle data
  useEffect(() => {
    if (!currentUser) return;

    const sampleNotifications = [
      {
        id: 1,
        type: 'warning',
        title: 'Low Battery Alert',
        message: 'Vehicle #EV-2024-001 battery level is below 20%',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false
      },
      {
        id: 2,
        type: 'info',
        title: 'Maintenance Due',
        message: 'Scheduled maintenance for Vehicle #EV-2024-003 is due in 2 days',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        read: false
      },
      {
        id: 3,
        type: 'success',
        title: 'Charging Complete',
        message: 'Vehicle #EV-2024-002 has completed charging',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        read: true
      },
      {
        id: 4,
        type: 'error',
        title: 'Geofence Breach',
        message: 'Vehicle #EV-2024-004 has exited operational zone',
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        read: false
      }
    ];

    setNotifications(sampleNotifications);
    setUnreadCount(sampleNotifications.filter(n => !n.read).length);
  }, [currentUser]);

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
    setUnreadCount(notifications.filter(n => n.id !== id && !n.read).length);
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    setShowNotifications(false);
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      case 'success': return '#10b981';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <div className="notifications-container">
      <button 
        className="notifications-button"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {showNotifications && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Notifications</h3>
            <div className="header-actions">
              {unreadCount > 0 && (
                <button 
                  className="mark-all-button"
                  onClick={markAllAsRead}
                >
                  Mark all as read
                </button>
              )}
              <button 
                className="close-button"
                onClick={() => setShowNotifications(false)}
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-icon" style={{ color: getNotificationColor(notification.type) }}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-time">
                      {formatTime(notification.timestamp)}
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="unread-indicator"></div>
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className="notifications-footer">
            {notifications.length > 0 && (
              <button className="clear-all-button" onClick={clearAllNotifications}>
                Clear All Notifications
              </button>
            )}
          </div>
        </div>
      )}
      
      <style>{`
        .notifications-container {
          position: relative;
        }
        
        .notifications-button {
          background: none;
          border: none;
          cursor: pointer;
          position: relative;
          padding: 8px;
          color: #e2e8f0;
          font-size: 20px;
        }
        
        .notification-badge {
          position: absolute;
          top: 0;
          right: 0;
          background-color: #ef4444;
          color: white;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .notifications-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          width: 380px;
          background-color: #1e293b;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          z-index: 1000;
          margin-top: 8px;
          border: 1px solid #334155;
          max-height: 500px;
          display: flex;
          flex-direction: column;
        }
        
        .notifications-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #334155;
        }
        
        .notifications-header h3 {
          margin: 0;
          color: #f8fafc;
          font-size: 18px;
          font-weight: 600;
        }
        
        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        
        .mark-all-button {
          background: none;
          border: none;
          color: #3b82f6;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }
        
        .close-button {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 18px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        
        .close-button:hover {
          background-color: #334155;
          color: #f8fafc;
        }
        
        .notifications-list {
          flex: 1;
          overflow-y: auto;
          max-height: 350px;
        }
        
        .notification-item {
          display: flex;
          padding: 16px;
          border-bottom: 1px solid #334155;
          cursor: pointer;
          position: relative;
          transition: background-color 0.2s ease;
        }
        
        .notification-item:hover {
          background-color: #334155;
        }
        
        .notification-item.unread {
          background-color: rgba(59, 130, 246, 0.1);
        }
        
        .notification-icon {
          font-size: 20px;
          margin-right: 12px;
          align-self: flex-start;
        }
        
        .notification-content {
          flex: 1;
        }
        
        .notification-title {
          font-weight: 600;
          color: #f8fafc;
          margin-bottom: 6px;
          font-size: 15px;
        }
        
        .notification-message {
          color: #cbd5e1;
          font-size: 14px;
          margin-bottom: 8px;
          line-height: 1.4;
        }
        
        .notification-time {
          color: #94a3b8;
          font-size: 12px;
        }
        
        .unread-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #3b82f6;
          align-self: center;
        }
        
        .no-notifications {
          text-align: center;
          padding: 48px 24px;
          color: #94a3b8;
        }
        
        .notifications-footer {
          padding: 16px;
          border-top: 1px solid #334155;
          text-align: center;
        }
        
        .clear-all-button {
          background: none;
          border: 1px solid #ef4444;
          color: #ef4444;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        
        .clear-all-button:hover {
          background-color: #ef4444;
          color: white;
        }
      `}</style>
    </div>
  );
}

export default Notifications;

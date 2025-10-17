import React from 'react';

const Alert = ({ message, type = 'info', onClose, autoClose = true }) => {
  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  const getAlertStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#10b981',
          color: 'white',
          border: '1px solid #047857',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
        };
      case 'error':
        return {
          backgroundColor: '#dc2626',
          color: 'white',
          border: '1px solid #991b1b',
          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
        };
      case 'warning':
        return {
          backgroundColor: '#f59e0b',
          color: 'white',
          border: '1px solid #b45309',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
        };
      default:
        return {
          backgroundColor: '#3b82f6',
          color: 'white',
          border: '1px solid #1d4ed8',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
        };
    }
  };

  const alertStyle = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '20px 24px',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    zIndex: 1000,
    maxWidth: '400px',
    width: 'auto',
    minHeight: '60px',
    display: 'flex',
    alignItems: 'center',
    ...getAlertStyle()
  };

  const contentStyle = {
    flex: 1,
    fontSize: '16px',
    fontWeight: 500,
    lineHeight: 1.4
  };

  const closeStyle = {
    background: 'none',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '0',
    lineHeight: '1',
    marginLeft: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    transition: 'background-color 0.2s ease'
  };

  const closeHoverStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  };

  return (
    <div style={alertStyle}>
      <div style={contentStyle}>{message}</div>
      <button 
        style={closeStyle} 
        onClick={onClose}
        onMouseEnter={(e) => e.target.style.backgroundColor = closeHoverStyle.backgroundColor}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
      >
        &times;
      </button>
    </div>
  );
};

export default Alert;

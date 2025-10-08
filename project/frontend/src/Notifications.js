// frontend/src/Notifications.js
import React, { useEffect, useState } from 'react';

// Simple toast-style notifications via WebSocket
function Notifications() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.type === 'notification') {
          const id = Date.now() + Math.random();
          const toast = { id, level: data.level || 'info', message: data.message || '' };
          setToasts((prev) => [...prev, toast]);
          // Auto-dismiss after 4s
          setTimeout(() => {
            setToasts((prev) => prev.filter(t => t.id !== id));
          }, 4000);
        }
      } catch (e) {
        // ignore
      }
    };

    return () => ws.close();
  }, []);

  if (!toasts.length) return null;

  return (
    <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '8px 12px',
          borderRadius: 8,
          color: '#0b1220',
          background: t.level === 'success' ? '#86efac' : t.level === 'warning' ? '#facc15' : '#93c5fd',
          boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
        }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

export default Notifications;
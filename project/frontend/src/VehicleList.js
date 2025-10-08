import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

function VehicleList({ refreshTrigger, onEdit }) {
  const { currentUser, role } = useContext(AuthContext);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openHistoryFor, setOpenHistoryFor] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        if (!currentUser) return;
        const token = await currentUser.getIdToken();
        const response = await axios.get('http://localhost:3001/api/vehicles', {
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
      const res = await axios.get(`http://localhost:3001/api/vehicles/${id}/history`, {
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

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2>Vehicle List</h2>
        <span className="badge">Total: {vehicles.length}</span>
      </div>
      <ul className="list" style={{ marginTop: 12 }}>
        {vehicles.map(vehicle => (
          <li key={vehicle.id}>
            <div>
              <strong>{vehicle.make} {vehicle.model}</strong> - {vehicle.licensePlate} <span className="badge">{vehicle.status}</span>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button className="button outline" onClick={() => toggleHistory(vehicle.id)}>
                {openHistoryFor === vehicle.id ? 'Hide History' : 'Show History'}
              </button>
              {role === 'admin' && (
                <button className="button outline" onClick={() => onEdit(vehicle)}>Edit</button>
              )}
              {role === 'admin' && (
                <button className="button danger" onClick={() => {
                  if (window.confirm(`Are you sure you want to delete ${vehicle.make} ${vehicle.model}?`)) {
                    const deleteVehicle = async (id) => {
                      try {
                        const token = await currentUser.getIdToken();
                        await axios.delete(`http://localhost:3001/api/vehicles/${id}`, {
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
                }}>Delete</button>
              )}
            </div>
            {openHistoryFor === vehicle.id && (
              <div style={{ marginTop: 8, padding: 8, border: '1px dashed #334155', borderRadius: 8 }}>
                {historyLoading ? (
                  <div>Loading history...</div>
                ) : history.length === 0 ? (
                  <div>No history yet.</div>
                ) : (
                  <ul style={{ marginLeft: 16 }}>
                    {history.map(evt => (
                      <li key={evt.id}>
                        <span className="badge" style={{ marginRight: 8 }}>{evt.eventType}</span>
                        {new Date(evt.timestamp._seconds ? evt.timestamp._seconds * 1000 : evt.timestamp).toLocaleString()}
                        {evt.actorUid ? ` by ${evt.actorUid}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default VehicleList;
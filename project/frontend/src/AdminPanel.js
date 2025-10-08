import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

// Simple admin panel to set roles by uid or email
function AdminPanel() {
  const { currentUser, role } = useContext(AuthContext);
  const [identifier, setIdentifier] = useState(''); // uid or email
  const [isEmail, setIsEmail] = useState(true);
  const [targetRole, setTargetRole] = useState('user');
  const [message, setMessage] = useState('');

  if (!currentUser || role !== 'admin') {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const token = await currentUser.getIdToken();
      const body = isEmail ? { email: identifier, role: targetRole } : { uid: identifier, role: targetRole };
      const res = await axios.post('http://localhost:3001/api/auth/users/role', body, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.message || 'Role updated');
    } catch (err) {
      console.error(err);
      setMessage('Failed to update role. Check permissions and identifier.');
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: 12, marginTop: 12 }}>
      <h3>Admin: Set User Role</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            <input type="radio" checked={isEmail} onChange={() => setIsEmail(true)} /> Identify by Email
          </label>
          <label style={{ marginLeft: 12 }}>
            <input type="radio" checked={!isEmail} onChange={() => setIsEmail(false)} /> Identify by UID
          </label>
        </div>
        <input
          type="text"
          placeholder={isEmail ? 'user@example.com' : 'Firebase UID'}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          style={{ width: '100%', marginTop: 8 }}
          required
        />
        <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)} style={{ marginTop: 8 }}>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        <button type="submit" style={{ marginLeft: 8 }}>Apply</button>
      </form>
      {message && <p style={{ marginTop: 8 }}>{message}</p>}
    </div>
  );
}

export default AdminPanel;
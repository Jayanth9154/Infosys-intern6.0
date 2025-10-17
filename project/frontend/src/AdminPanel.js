import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { API_BASE_URL } from './config';

// Simple admin panel to set roles by uid or email
function AdminPanel() {
  const { currentUser, role } = useContext(AuthContext);
  const [identifier, setIdentifier] = useState(''); // uid or email
  const [isEmail, setIsEmail] = useState(true);
  const [targetRole, setTargetRole] = useState('user');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});

  if (!currentUser || role !== 'admin') {
    return null;
  }

  // Validation function
  const validateForm = (data) => {
    const errors = {};
    
    if (!data.identifier.trim()) {
      errors.identifier = isEmail ? 'Email is required' : 'UID is required';
    } else if (isEmail && !/\S+@\S+\.\S+/.test(data.identifier)) {
      errors.identifier = 'Email address is invalid';
    } else if (!isEmail && data.identifier.trim().length < 5) {
      errors.identifier = 'UID must be at least 5 characters';
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    // Validate form
    const formErrors = validateForm({ identifier });
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    // Clear errors if validation passes
    setErrors({});
    
    try {
      const token = await currentUser.getIdToken();
      const body = isEmail ? { email: identifier, role: targetRole } : { uid: identifier, role: targetRole };
      const res = await axios.post(`${API_BASE_URL}/api/auth/users/role`, body, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.message || 'Role updated');
      // Clear form after successful submission
      setIdentifier('');
    } catch (err) {
      console.error(err);
      setMessage('Failed to update role. Check permissions and identifier.');
    }
  };

  const handleInputChange = (e) => {
    setIdentifier(e.target.value);
    // Clear error when user starts typing
    if (errors.identifier) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.identifier;
        return newErrors;
      });
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
          onChange={handleInputChange}
          style={{ width: '100%', marginTop: 8, borderColor: errors.identifier ? '#ef4444' : '' }}
          required
        />
        {errors.identifier && (
          <div style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
            {errors.identifier}
          </div>
        )}
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

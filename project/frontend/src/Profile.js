// frontend/src/Profile.js
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

function Profile() {
  const { currentUser } = useContext(AuthContext);
  const [profile, setProfile] = useState({ name: '', phone: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      try {
        const token = await currentUser.getIdToken();
        const res = await axios.get('http://localhost:3001/api/profile/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const p = res.data.profile || { name: '', phone: '', address: '' };
        setProfile(p);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const onSave = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const token = await currentUser.getIdToken();
      const res = await axios.put('http://localhost:3001/api/profile/me', profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data.profile || profile);
      setMessage('Profile saved');
    } catch (e) {
      console.error(e);
      setMessage('Failed to save profile');
    }
  };

  if (!currentUser) return null;
  if (loading) return <div className="panel">Loading profile...</div>;

  return (
    <div className="panel">
      <h2>My Profile</h2>
      <form onSubmit={onSave} className="row" style={{ flexDirection: 'column', gap: 12 }}>
        <input className="input" name="name" placeholder="Full Name" value={profile.name || ''} onChange={onChange} />
        <input className="input" name="phone" placeholder="Phone" value={profile.phone || ''} onChange={onChange} />
        <input className="input" name="address" placeholder="Address" value={profile.address || ''} onChange={onChange} />
        <div className="row">
          <button className="button" type="submit">Save</button>
          {message && <span style={{ marginLeft: 8 }}>{message}</span>}
        </div>
      </form>
    </div>
  );
}

export default Profile;
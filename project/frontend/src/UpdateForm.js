import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

function UpdateForm({ vehicle, onUpdateComplete }) {
  const { currentUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    make: vehicle.make,
    model: vehicle.model,
    licensePlate: vehicle.licensePlate,
    status: vehicle.status
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await currentUser.getIdToken();
      await axios.put(`http://localhost:3001/api/vehicles/${vehicle.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onUpdateComplete();
    } catch (error) {
      console.error('There was an error updating the vehicle!', error);
      alert('Failed to update vehicle. Check your permissions.');
    }
  };

  return (
    <div className="panel">
      <h3>Update Vehicle: {vehicle.licensePlate}</h3>
      <form onSubmit={handleSubmit} className="row" style={{ flexDirection: 'column', gap: 12 }}>
        <input
          className="input"
          type="text"
          name="make"
          placeholder="Make"
          value={formData.make}
          onChange={handleChange}
        />
        <input
          className="input"
          type="text"
          name="model"
          placeholder="Model"
          value={formData.model}
          onChange={handleChange}
        />
        <input
          className="input"
          type="text"
          name="licensePlate"
          placeholder="License Plate"
          value={formData.licensePlate}
          onChange={handleChange}
        />
        <select className="select" name="status" value={formData.status} onChange={handleChange}>
          <option value="available">Available</option>
          <option value="on-trip">On Trip</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <div className="row">
          <button className="button" type="submit">Update Vehicle</button>
          <button className="button outline" type="button" onClick={() => onUpdateComplete()}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default UpdateForm;
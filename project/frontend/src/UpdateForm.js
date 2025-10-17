import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { API_BASE_URL } from './config';

function UpdateForm({ vehicle, onUpdateComplete }) {
  const { currentUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    make: vehicle.make,
    model: vehicle.model,
    licensePlate: vehicle.licensePlate,
    status: vehicle.status
  });
  
  // Validation errors state
  const [errors, setErrors] = useState({});

  // Validation function
  const validateForm = (data) => {
    const errors = {};
    
    if (!data.make || data.make.trim().length < 2) {
      errors.make = 'Make is required and must be at least 2 characters';
    }
    
    if (!data.model || data.model.trim().length < 1) {
      errors.model = 'Model is required';
    }
    
    if (!data.licensePlate || data.licensePlate.trim().length < 3) {
      errors.licensePlate = 'License plate is required and must be at least 3 characters';
    }
    
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const formErrors = validateForm(formData);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    // Clear errors if validation passes
    setErrors({});
    
    try {
      const token = await currentUser.getIdToken();
      await axios.put(`${API_BASE_URL}/api/vehicles/${vehicle.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onUpdateComplete();
    } catch (error) {
      console.error('There was an error updating the vehicle!', error);
      setErrors({ general: 'Failed to update vehicle. Check your permissions.' });
    }
  };

  return (
    <div className="panel">
      <h3>Update Vehicle: {vehicle.licensePlate}</h3>
      
      {/* General Error Message */}
      {errors.general && (
        <div className="error-message">
          <p>{errors.general}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="row" style={{ flexDirection: 'column', gap: 12 }}>
        <div>
          <input
            className={`input ${errors.make ? 'error' : ''}`}
            type="text"
            name="make"
            placeholder="Make"
            value={formData.make}
            onChange={handleChange}
          />
          {errors.make && <div className="error-text">{errors.make}</div>}
        </div>
        <div>
          <input
            className={`input ${errors.model ? 'error' : ''}`}
            type="text"
            name="model"
            placeholder="Model"
            value={formData.model}
            onChange={handleChange}
          />
          {errors.model && <div className="error-text">{errors.model}</div>}
        </div>
        <div>
          <input
            className={`input ${errors.licensePlate ? 'error' : ''}`}
            type="text"
            name="licensePlate"
            placeholder="License Plate"
            value={formData.licensePlate}
            onChange={handleChange}
          />
          {errors.licensePlate && <div className="error-text">{errors.licensePlate}</div>}
        </div>
        <div>
          <select className="select" name="status" value={formData.status} onChange={handleChange}>
            <option value="available">Available</option>
            <option value="on-trip">On Trip</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
        <div className="row">
          <button className="button" type="submit">Update Vehicle</button>
          <button className="button outline" type="button" onClick={() => onUpdateComplete()}>Cancel</button>
        </div>
      </form>
      
      <style>{`
        .error-message {
          background-color: #dc2626;
          color: white;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          font-size: 14px;
        }
        
        .input.error, .select.error {
          border: 2px solid #dc2626;
          background-color: #fef2f2;
        }
        
        .error-text {
          color: #dc2626;
          font-size: 12px;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}

export default UpdateForm;

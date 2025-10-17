import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { API_BASE_URL } from './config';

function VehicleForm({ onAddVehicle }) {
  const { currentUser } = useContext(AuthContext);
  const [formStep, setFormStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    licensePlate: '',
    year: new Date().getFullYear(),
    vin: '',
    color: '',
    vehicleType: 'ev',
    status: 'available',
    batteryCapacity: '',
    range: '',
    assignedDriver: '',
    maintenanceSchedule: 'monthly',
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
    insuranceExpiry: '',
    registrationExpiry: ''
  });
  
  // Validation errors state
  const [errors, setErrors] = useState({});

  // Validation function
  const validateForm = (data, step) => {
    const errors = {};
    
    if (step === 1) {
      // Basic information validation
      if (!data.make || data.make.trim().length < 2) {
        errors.make = 'Make is required and must be at least 2 characters';
      }
      
      if (!data.model || data.model.trim().length < 1) {
        errors.model = 'Model is required';
      }
      
      if (!data.licensePlate || data.licensePlate.trim().length < 3) {
        errors.licensePlate = 'License plate is required and must be at least 3 characters';
      }
      
      if (!data.year || data.year < 1900 || data.year > new Date().getFullYear() + 1) {
        errors.year = 'Year must be between 1900 and next year';
      }
      
      if (data.vin && data.vin.length < 5) {
        errors.vin = 'VIN must be at least 5 characters';
      }
    }
    
    if (step === 2 && data.vehicleType === 'ev') {
      // EV specific validation
      if (data.batteryCapacity && (isNaN(data.batteryCapacity) || data.batteryCapacity <= 0)) {
        errors.batteryCapacity = 'Battery capacity must be a positive number';
      }
      
      if (data.range && (isNaN(data.range) || data.range <= 0)) {
        errors.range = 'Range must be a positive number';
      }
    }
    
    if (step === 3) {
      // Additional details validation
      if (data.assignedDriver && data.assignedDriver.length < 2) {
        errors.assignedDriver = 'Driver name must be at least 2 characters';
      }
      
      // Date validations
      if (data.nextMaintenanceDate && data.lastMaintenanceDate && 
          new Date(data.nextMaintenanceDate) < new Date(data.lastMaintenanceDate)) {
        errors.nextMaintenanceDate = 'Next maintenance date must be after last maintenance date';
      }
      
      if (data.insuranceExpiry && new Date(data.insuranceExpiry) < new Date()) {
        errors.insuranceExpiry = 'Insurance expiry date must be in the future';
      }
      
      if (data.registrationExpiry && new Date(data.registrationExpiry) < new Date()) {
        errors.registrationExpiry = 'Registration expiry date must be in the future';
      }
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

  const nextStep = () => {
    // Validate current step before proceeding
    const formErrors = validateForm(formData, formStep);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    // Clear errors if validation passes
    setErrors({});
    setFormStep(prevStep => prevStep + 1);
  };

  const prevStep = () => {
    setFormStep(prevStep => prevStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate final step
    const formErrors = validateForm(formData, 3);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setIsSubmitting(false);
      return;
    }
    
    // Clear errors if validation passes
    setErrors({});
    
    try {
      const token = await currentUser.getIdToken();
      const response = await axios.post(`${API_BASE_URL}/api/vehicles`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Reset form
      setFormData({
        make: '',
        model: '',
        licensePlate: '',
        year: new Date().getFullYear(),
        vin: '',
        color: '',
        vehicleType: 'ev',
        status: 'available',
        batteryCapacity: '',
        range: '',
        assignedDriver: '',
        maintenanceSchedule: 'monthly',
        lastMaintenanceDate: '',
        nextMaintenanceDate: '',
        insuranceExpiry: '',
        registrationExpiry: ''
      });
      setFormStep(1);
      
      // Notify parent component
      onAddVehicle(response.data);
    } catch (error) {
      console.error('There was an error adding the vehicle!', error);
      setErrors({ general: 'Failed to add vehicle. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="panel">
      <h2>Add New Vehicle</h2>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <div>Step {formStep} of 3</div>
        <div className="row" style={{ gap: 4 }}>
          <div className={`step-indicator ${formStep >= 1 ? 'active' : ''}`}></div>
          <div className={`step-indicator ${formStep >= 2 ? 'active' : ''}`}></div>
          <div className={`step-indicator ${formStep >= 3 ? 'active' : ''}`}></div>
        </div>
      </div>
      
      {/* General Error Message */}
      {errors.general && (
        <div className="error-message">
          <p>{errors.general}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="row" style={{ flexDirection: 'column', gap: 12 }}>
        {formStep === 1 && (
          <>
            <h3>Basic Information</h3>
            <div className="row" style={{ gap: 8 }}>
              <div style={{ flex: 1 }}>
                <input
                  className={`input ${errors.make ? 'error' : ''}`}
                  type="text"
                  name="make"
                  placeholder="Make"
                  value={formData.make}
                  onChange={handleChange}
                  required
                  style={{ width: '100%' }}
                />
                {errors.make && <div className="error-text">{errors.make}</div>}
              </div>
              <div style={{ flex: 1 }}>
                <input
                  className={`input ${errors.model ? 'error' : ''}`}
                  type="text"
                  name="model"
                  placeholder="Model"
                  value={formData.model}
                  onChange={handleChange}
                  required
                  style={{ width: '100%' }}
                />
                {errors.model && <div className="error-text">{errors.model}</div>}
              </div>
            </div>
            
            <div className="row" style={{ gap: 8 }}>
              <div style={{ flex: 1 }}>
                <input
                  className={`input ${errors.licensePlate ? 'error' : ''}`}
                  type="text"
                  name="licensePlate"
                  placeholder="License Plate"
                  value={formData.licensePlate}
                  onChange={handleChange}
                  required
                  style={{ width: '100%' }}
                />
                {errors.licensePlate && <div className="error-text">{errors.licensePlate}</div>}
              </div>
              <div style={{ flex: 1 }}>
                <input
                  className={`input ${errors.year ? 'error' : ''}`}
                  type="number"
                  name="year"
                  placeholder="Year"
                  value={formData.year}
                  onChange={handleChange}
                  required
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  style={{ width: '100%' }}
                />
                {errors.year && <div className="error-text">{errors.year}</div>}
              </div>
            </div>
            
            <div className="row" style={{ gap: 8 }}>
              <div style={{ flex: 1 }}>
                <input
                  className={`input ${errors.vin ? 'error' : ''}`}
                  type="text"
                  name="vin"
                  placeholder="VIN Number"
                  value={formData.vin}
                  onChange={handleChange}
                  style={{ width: '100%' }}
                />
                {errors.vin && <div className="error-text">{errors.vin}</div>}
              </div>
              <div style={{ flex: 1 }}>
                <input
                  className="input"
                  type="text"
                  name="color"
                  placeholder="Color"
                  value={formData.color}
                  onChange={handleChange}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            
            <div className="row" style={{ gap: 8 }}>
              <div style={{ flex: 1 }}>
                <select 
                  className="select" 
                  name="vehicleType" 
                  value={formData.vehicleType} 
                  onChange={handleChange}
                  style={{ width: '100%' }}
                >
                  <option value="ev">Electric Vehicle</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="ice">Internal Combustion Engine</option>
                </select>
              </div>
              
              <div style={{ flex: 1 }}>
                <select 
                  className="select" 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange}
                  style={{ width: '100%' }}
                >
                  <option value="available">Available</option>
                  <option value="on-trip">On Trip</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="charging">Charging</option>
                  <option value="out-of-service">Out of Service</option>
                </select>
              </div>
            </div>
            
            <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
              <button 
                className="button primary" 
                type="button" 
                onClick={nextStep}
                disabled={isSubmitting}
              >
                Next
              </button>
            </div>
          </>
        )}
        
        {formStep === 2 && (
          <>
            <h3>Technical Specifications</h3>
            {formData.vehicleType === 'ev' && (
              <>
                <div className="row" style={{ gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <input
                      className={`input ${errors.batteryCapacity ? 'error' : ''}`}
                      type="number"
                      name="batteryCapacity"
                      placeholder="Battery Capacity (kWh)"
                      value={formData.batteryCapacity}
                      onChange={handleChange}
                      min="0"
                      step="0.1"
                      style={{ width: '100%' }}
                    />
                    {errors.batteryCapacity && <div className="error-text">{errors.batteryCapacity}</div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      className={`input ${errors.range ? 'error' : ''}`}
                      type="number"
                      name="range"
                      placeholder="Range (km)"
                      value={formData.range}
                      onChange={handleChange}
                      min="0"
                      style={{ width: '100%' }}
                    />
                    {errors.range && <div className="error-text">{errors.range}</div>}
                  </div>
                </div>
              </>
            )}
            
            <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
              <button 
                className="button outline" 
                type="button" 
                onClick={prevStep}
                disabled={isSubmitting}
              >
                Previous
              </button>
              <button 
                className="button primary" 
                type="button" 
                onClick={nextStep}
                disabled={isSubmitting}
              >
                Next
              </button>
            </div>
          </>
        )}
        
        {formStep === 3 && (
          <>
            <h3>Additional Details</h3>
            <div className="row" style={{ gap: 8 }}>
              <div style={{ flex: 1 }}>
                <input
                  className={`input ${errors.assignedDriver ? 'error' : ''}`}
                  type="text"
                  name="assignedDriver"
                  placeholder="Assigned Driver"
                  value={formData.assignedDriver}
                  onChange={handleChange}
                  style={{ width: '100%' }}
                />
                {errors.assignedDriver && <div className="error-text">{errors.assignedDriver}</div>}
              </div>
            </div>
            
            <div className="row" style={{ gap: 8 }}>
              <div style={{ flex: 1 }}>
                <select 
                  className="select" 
                  name="maintenanceSchedule" 
                  value={formData.maintenanceSchedule} 
                  onChange={handleChange}
                  style={{ width: '100%' }}
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="semiannually">Semi-annually</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
            </div>
            
            <div className="row" style={{ gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label>Last Maintenance Date</label>
                <input
                  className="input"
                  type="date"
                  name="lastMaintenanceDate"
                  value={formData.lastMaintenanceDate}
                  onChange={handleChange}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>Next Maintenance Date</label>
                <input
                  className={`input ${errors.nextMaintenanceDate ? 'error' : ''}`}
                  type="date"
                  name="nextMaintenanceDate"
                  value={formData.nextMaintenanceDate}
                  onChange={handleChange}
                  style={{ width: '100%' }}
                />
                {errors.nextMaintenanceDate && <div className="error-text">{errors.nextMaintenanceDate}</div>}
              </div>
            </div>
            
            <div className="row" style={{ gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label>Insurance Expiry</label>
                <input
                  className={`input ${errors.insuranceExpiry ? 'error' : ''}`}
                  type="date"
                  name="insuranceExpiry"
                  value={formData.insuranceExpiry}
                  onChange={handleChange}
                  style={{ width: '100%' }}
                />
                {errors.insuranceExpiry && <div className="error-text">{errors.insuranceExpiry}</div>}
              </div>
              <div style={{ flex: 1 }}>
                <label>Registration Expiry</label>
                <input
                  className={`input ${errors.registrationExpiry ? 'error' : ''}`}
                  type="date"
                  name="registrationExpiry"
                  value={formData.registrationExpiry}
                  onChange={handleChange}
                  style={{ width: '100%' }}
                />
                {errors.registrationExpiry && <div className="error-text">{errors.registrationExpiry}</div>}
              </div>
            </div>
            
            <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
              <button 
                className="button outline" 
                type="button" 
                onClick={prevStep}
                disabled={isSubmitting}
              >
                Previous
              </button>
              <button 
                className="button primary" 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Vehicle'}
              </button>
            </div>
          </>
        )}
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
        
        .step-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #334155;
        }
        
        .step-indicator.active {
          background-color: #3b82f6;
        }
      `}</style>
    </div>
  );
}

export default VehicleForm;

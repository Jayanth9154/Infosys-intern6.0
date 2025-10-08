import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

function VehicleForm({ onVehicleAdded }) {
  const { currentUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    licensePlate: '',
    status: 'available',
    vehicleType: 'ev', // Default to EV
    batteryCapacity: '',
    range: '',
    year: new Date().getFullYear(),
    vin: '',
    color: '',
    assignedDriver: '',
    maintenanceSchedule: 'quarterly',
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
    insuranceExpiry: '',
    registrationExpiry: ''
  });

  const [formStep, setFormStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert("Please log in to add a new vehicle.");
      return;
    }

    try {
      setIsSubmitting(true);
      const token = await currentUser.getIdToken();
      await axios.post('http://localhost:3001/api/vehicles', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Reset form
      setFormData({
        make: '',
        model: '',
        licensePlate: '',
        status: 'available',
        vehicleType: 'ev',
        batteryCapacity: '',
        range: '',
        year: new Date().getFullYear(),
        vin: '',
        color: '',
        assignedDriver: '',
        maintenanceSchedule: 'quarterly',
        lastMaintenanceDate: '',
        nextMaintenanceDate: '',
        insuranceExpiry: '',
        registrationExpiry: ''
      });
      
      setFormStep(1);
      if (onVehicleAdded) onVehicleAdded();
    } catch (error) {
      console.error('There was an error creating the vehicle!', error);
      alert('Failed to add vehicle. Check your permissions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    setFormStep(formStep + 1);
  };

  const prevStep = () => {
    setFormStep(formStep - 1);
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
      
      <form onSubmit={handleSubmit} className="row" style={{ flexDirection: 'column', gap: 12 }}>
        {formStep === 1 && (
          <>
            <h3>Basic Information</h3>
            <div className="row" style={{ gap: 8 }}>
              <input
                className="input"
                type="text"
                name="make"
                placeholder="Make"
                value={formData.make}
                onChange={handleChange}
                required
                style={{ flex: 1 }}
              />
              <input
                className="input"
                type="text"
                name="model"
                placeholder="Model"
                value={formData.model}
                onChange={handleChange}
                required
                style={{ flex: 1 }}
              />
            </div>
            
            <div className="row" style={{ gap: 8 }}>
              <input
                className="input"
                type="text"
                name="licensePlate"
                placeholder="License Plate"
                value={formData.licensePlate}
                onChange={handleChange}
                required
                style={{ flex: 1 }}
              />
              <input
                className="input"
                type="number"
                name="year"
                placeholder="Year"
                value={formData.year}
                onChange={handleChange}
                required
                min="2000"
                max={new Date().getFullYear() + 1}
                style={{ flex: 1 }}
              />
            </div>
            
            <div className="row" style={{ gap: 8 }}>
              <input
                className="input"
                type="text"
                name="vin"
                placeholder="VIN Number"
                value={formData.vin}
                onChange={handleChange}
                style={{ flex: 1 }}
              />
              <input
                className="input"
                type="text"
                name="color"
                placeholder="Color"
                value={formData.color}
                onChange={handleChange}
                style={{ flex: 1 }}
              />
            </div>
            
            <div className="row" style={{ gap: 8 }}>
              <select 
                className="select" 
                name="vehicleType" 
                value={formData.vehicleType} 
                onChange={handleChange}
                style={{ flex: 1 }}
              >
                <option value="ev">Electric Vehicle</option>
                <option value="hybrid">Hybrid</option>
                <option value="ice">Internal Combustion Engine</option>
              </select>
              
              <select 
                className="select" 
                name="status" 
                value={formData.status} 
                onChange={handleChange}
                style={{ flex: 1 }}
              >
                <option value="available">Available</option>
                <option value="on-trip">On Trip</option>
                <option value="maintenance">Maintenance</option>
                <option value="charging">Charging</option>
                <option value="out-of-service">Out of Service</option>
              </select>
            </div>
            
            <div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="button" type="button" onClick={nextStep}>Next</button>
            </div>
          </>
        )}
        
        {formStep === 2 && (
          <>
            <h3>EV Specifications</h3>
            
            {formData.vehicleType === 'ev' || formData.vehicleType === 'hybrid' ? (
              <>
                <div className="row" style={{ gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="batteryCapacity" className="label">Battery Capacity (kWh)</label>
                    <input
                      className="input"
                      type="number"
                      id="batteryCapacity"
                      name="batteryCapacity"
                      placeholder="Battery Capacity"
                      value={formData.batteryCapacity}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <label htmlFor="range" className="label">Range (km)</label>
                    <input
                      className="input"
                      type="number"
                      id="range"
                      name="range"
                      placeholder="Range"
                      value={formData.range}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                </div>
                
                <div className="row" style={{ gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="chargingTime" className="label">Full Charging Time (hours)</label>
                    <input
                      className="input"
                      type="number"
                      id="chargingTime"
                      name="chargingTime"
                      placeholder="Charging Time"
                      value={formData.chargingTime}
                      onChange={handleChange}
                      min="0"
                      step="0.5"
                    />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <label htmlFor="chargingType" className="label">Charging Type</label>
                    <select 
                      className="select" 
                      id="chargingType"
                      name="chargingType" 
                      value={formData.chargingType} 
                      onChange={handleChange}
                    >
                      <option value="">Select Type</option>
                      <option value="level1">Level 1 (AC)</option>
                      <option value="level2">Level 2 (AC)</option>
                      <option value="dcFast">DC Fast Charging</option>
                      <option value="supercharger">Supercharger</option>
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <div className="alert">
                <p>Non-EV vehicle selected. Skip to next section or change vehicle type.</p>
              </div>
            )}
            
            <h3 style={{ marginTop: 16 }}>Assignment</h3>
            <div className="row" style={{ gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="assignedDriver" className="label">Assigned Driver (optional)</label>
                <input
                  className="input"
                  type="text"
                  id="assignedDriver"
                  name="assignedDriver"
                  placeholder="Driver Name"
                  value={formData.assignedDriver}
                  onChange={handleChange}
                />
              </div>
              
              <div style={{ flex: 1 }}>
                <label htmlFor="assignedRegion" className="label">Assigned Region</label>
                <select 
                  className="select" 
                  id="assignedRegion"
                  name="assignedRegion" 
                  value={formData.assignedRegion} 
                  onChange={handleChange}
                >
                  <option value="">Select Region</option>
                  <option value="north">North Zone</option>
                  <option value="south">South Zone</option>
                  <option value="east">East Zone</option>
                  <option value="west">West Zone</option>
                  <option value="central">Central Zone</option>
                </select>
              </div>
            </div>
            
            <div className="row" style={{ justifyContent: 'space-between', marginTop: 8 }}>
              <button className="button outline" type="button" onClick={prevStep}>Back</button>
              <button className="button" type="button" onClick={nextStep}>Next</button>
            </div>
          </>
        )}
        
        {formStep === 3 && (
          <>
            <h3>Maintenance & Compliance</h3>
            
            <div className="row" style={{ gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="maintenanceSchedule" className="label">Maintenance Schedule</label>
                <select 
                  className="select" 
                  id="maintenanceSchedule"
                  name="maintenanceSchedule" 
                  value={formData.maintenanceSchedule} 
                  onChange={handleChange}
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="biannual">Bi-Annual</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              
              <div style={{ flex: 1 }}>
                <label htmlFor="lastMaintenanceDate" className="label">Last Maintenance Date</label>
                <input
                  className="input"
                  type="date"
                  id="lastMaintenanceDate"
                  name="lastMaintenanceDate"
                  value={formData.lastMaintenanceDate}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="row" style={{ gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="insuranceExpiry" className="label">Insurance Expiry Date</label>
                <input
                  className="input"
                  type="date"
                  id="insuranceExpiry"
                  name="insuranceExpiry"
                  value={formData.insuranceExpiry}
                  onChange={handleChange}
                />
              </div>
              
              <div style={{ flex: 1 }}>
                <label htmlFor="registrationExpiry" className="label">Registration Expiry Date</label>
                <input
                  className="input"
                  type="date"
                  id="registrationExpiry"
                  name="registrationExpiry"
                  value={formData.registrationExpiry}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="row" style={{ marginTop: 16 }}>
              <label htmlFor="notes" className="label">Additional Notes</label>
              <textarea
                className="input"
                id="notes"
                name="notes"
                placeholder="Additional information about this vehicle..."
                value={formData.notes}
                onChange={handleChange}
                rows="3"
              />
            </div>
            
            <div className="row" style={{ justifyContent: 'space-between', marginTop: 16 }}>
              <button className="button outline" type="button" onClick={prevStep}>Back</button>
              <button className="button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding Vehicle...' : 'Add Vehicle'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

export default VehicleForm;
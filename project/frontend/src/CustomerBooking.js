import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

function CustomerBooking() {
  const { currentUser } = useContext(AuthContext);
  const [bookingData, setBookingData] = useState({
    vehicleType: '',
    pickupLocation: '',
    dropoffLocation: '',
    pickupDate: '',
    pickupTime: '',
    duration: '',
    passengers: 1,
    specialRequirements: ''
  });
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [estimatedDistance, setEstimatedDistance] = useState(0);
  const [estimatedDuration, setEstimatedDuration] = useState(0);

  // Vehicle types with pricing
  const vehicleTypes = [
    { id: 'economy', name: 'Economy Car', baseRate: 15, capacity: 4, icon: '🚗' },
    { id: 'premium', name: 'Premium Car', baseRate: 25, capacity: 4, icon: '🚙' },
    { id: 'suv', name: 'SUV', baseRate: 35, capacity: 7, icon: '🚐' },
    { id: 'electric', name: 'Electric Vehicle', baseRate: 20, capacity: 4, icon: '⚡' },
    { id: 'van', name: 'Van', baseRate: 45, capacity: 12, icon: '🚌' },
    { id: 'luxury', name: 'Luxury Car', baseRate: 60, capacity: 4, icon: '🏎️' }
  ];

  // Popular locations
  const popularLocations = [
    'Airport Terminal 1', 'Airport Terminal 2', 'Central Railway Station',
    'Business District', 'Shopping Mall', 'University Campus',
    'Hospital Complex', 'Convention Center', 'Hotel District',
    'Tech Park', 'Industrial Area', 'Residential Complex'
  ];

  // Handle input changes
  const handleInputChange = (field, value) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-calculate estimates when key fields change
    if (['vehicleType', 'pickupLocation', 'dropoffLocation', 'duration'].includes(field)) {
      calculateEstimates({ ...bookingData, [field]: value });
    }
  };

  // Calculate estimates (mock implementation)
  const calculateEstimates = (data) => {
    if (!data.vehicleType || !data.pickupLocation || !data.dropoffLocation) return;

    const vehicleType = vehicleTypes.find(v => v.id === data.vehicleType);
    if (!vehicleType) return;

    // Mock distance calculation (in real app, use Google Maps API)
    const mockDistance = Math.floor(Math.random() * 50) + 5; // 5-55 km
    const mockDuration = Math.floor(mockDistance * 2.5); // minutes
    const duration = parseInt(data.duration) || 60; // minutes

    setEstimatedDistance(mockDistance);
    setEstimatedDuration(mockDuration);
    
    // Calculate cost: base rate + distance rate + time rate
    const baseCost = vehicleType.baseRate;
    const distanceCost = mockDistance * 2; // $2 per km
    const timeCost = duration * 0.5; // $0.5 per minute
    const totalCost = baseCost + distanceCost + timeCost;
    
    setEstimatedCost(totalCost);
  };

  // Generate smart recommendations
  const generateRecommendations = () => {
    const recs = [];
    
    // Time-based recommendations
    const hour = new Date().getHours();
    if (hour >= 7 && hour <= 9) {
      recs.push({
        type: 'time',
        title: 'Rush Hour Alert',
        message: 'Consider booking 30 minutes earlier to avoid traffic delays.',
        icon: '⏰'
      });
    }

    // Vehicle type recommendations
    if (bookingData.passengers > 4) {
      recs.push({
        type: 'vehicle',
        title: 'Vehicle Suggestion',
        message: 'SUV or Van recommended for your group size.',
        icon: '🚐'
      });
    }

    // Route optimization
    if (bookingData.pickupLocation && bookingData.dropoffLocation) {
      recs.push({
        type: 'route',
        title: 'Route Optimization',
        message: 'Alternative route available - saves 15 minutes and $5.',
        icon: '🗺️'
      });
    }

    // Eco-friendly option
    if (estimatedDistance > 20) {
      recs.push({
        type: 'eco',
        title: 'Eco-Friendly Option',
        message: 'Electric vehicle available - reduce carbon footprint by 40%.',
        icon: '🌱'
      });
    }

    // Cost optimization
    if (estimatedCost > 50) {
      recs.push({
        type: 'cost',
        title: 'Cost Saving',
        message: 'Book for off-peak hours to save up to 20%.',
        icon: '💰'
      });
    }

    setRecommendations(recs);
  };

  // Fetch available vehicles
  const fetchAvailableVehicles = async () => {
    if (!currentUser || !bookingData.vehicleType) return;

    try {
      setLoading(true);
      const token = await currentUser.getIdToken();
      const response = await axios.get('http://localhost:3001/api/vehicles', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status: 'available',
          type: bookingData.vehicleType
        }
      });

      // Filter and enhance vehicles for booking
      const vehicles = response.data
        .filter(v => v.status === 'available')
        .map(vehicle => ({
          ...vehicle,
          rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
          features: ['GPS Navigation', 'Air Conditioning', 'Bluetooth', 'USB Charging'],
          estimatedArrival: Math.floor(Math.random() * 15) + 5 // 5-20 minutes
        }));

      setAvailableVehicles(vehicles);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
      setLoading(false);
    }
  };

  // Submit booking
  const submitBooking = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const token = await currentUser.getIdToken();
      
      const bookingPayload = {
        ...bookingData,
        customerId: currentUser.uid,
        customerEmail: currentUser.email,
        estimatedCost,
        estimatedDistance,
        estimatedDuration,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await axios.post('http://localhost:3001/api/bookings', bookingPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Booking submitted successfully! You will receive a confirmation shortly.');
      
      // Reset form
      setBookingData({
        vehicleType: '',
        pickupLocation: '',
        dropoffLocation: '',
        pickupDate: '',
        pickupTime: '',
        duration: '',
        passengers: 1,
        specialRequirements: ''
      });
      setBookingStep(1);
      setLoading(false);
    } catch (error) {
      console.error('Failed to submit booking:', error);
      alert('Failed to submit booking. Please try again.');
      setLoading(false);
    }
  };

  // Generate recommendations when data changes
  useEffect(() => {
    generateRecommendations();
  }, [bookingData, estimatedCost, estimatedDistance]);

  // Fetch vehicles when vehicle type changes
  useEffect(() => {
    if (bookingData.vehicleType) {
      fetchAvailableVehicles();
    }
  }, [bookingData.vehicleType, currentUser]);

  const renderStep1 = () => (
    <div className="booking-step">
      <h3>Trip Details</h3>
      
      <div className="form-grid">
        <div className="form-group">
          <label>Vehicle Type</label>
          <select
            className="select"
            value={bookingData.vehicleType}
            onChange={(e) => handleInputChange('vehicleType', e.target.value)}
          >
            <option value="">Select vehicle type</option>
            {vehicleTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.icon} {type.name} - ${type.baseRate}/hour
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Passengers</label>
          <input
            type="number"
            className="input"
            min="1"
            max="12"
            value={bookingData.passengers}
            onChange={(e) => handleInputChange('passengers', parseInt(e.target.value))}
          />
        </div>

        <div className="form-group">
          <label>Pickup Location</label>
          <input
            type="text"
            className="input"
            list="pickup-locations"
            value={bookingData.pickupLocation}
            onChange={(e) => handleInputChange('pickupLocation', e.target.value)}
            placeholder="Enter pickup location"
          />
          <datalist id="pickup-locations">
            {popularLocations.map(location => (
              <option key={location} value={location} />
            ))}
          </datalist>
        </div>

        <div className="form-group">
          <label>Drop-off Location</label>
          <input
            type="text"
            className="input"
            list="dropoff-locations"
            value={bookingData.dropoffLocation}
            onChange={(e) => handleInputChange('dropoffLocation', e.target.value)}
            placeholder="Enter drop-off location"
          />
          <datalist id="dropoff-locations">
            {popularLocations.map(location => (
              <option key={location} value={location} />
            ))}
          </datalist>
        </div>

        <div className="form-group">
          <label>Pickup Date</label>
          <input
            type="date"
            className="input"
            value={bookingData.pickupDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => handleInputChange('pickupDate', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Pickup Time</label>
          <input
            type="time"
            className="input"
            value={bookingData.pickupTime}
            onChange={(e) => handleInputChange('pickupTime', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Duration (minutes)</label>
          <input
            type="number"
            className="input"
            min="30"
            step="30"
            value={bookingData.duration}
            onChange={(e) => handleInputChange('duration', e.target.value)}
            placeholder="Estimated trip duration"
          />
        </div>

        <div className="form-group full-width">
          <label>Special Requirements</label>
          <textarea
            className="textarea"
            value={bookingData.specialRequirements}
            onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
            placeholder="Child seat, wheelchair access, etc."
            rows="3"
          />
        </div>
      </div>

      {/* Trip Estimates */}
      {estimatedCost > 0 && (
        <div className="trip-estimates">
          <h4>Trip Estimates</h4>
          <div className="estimates-grid">
            <div className="estimate-item">
              <span className="estimate-icon">💰</span>
              <span className="estimate-value">${estimatedCost.toFixed(2)}</span>
              <span className="estimate-label">Estimated Cost</span>
            </div>
            <div className="estimate-item">
              <span className="estimate-icon">📏</span>
              <span className="estimate-value">{estimatedDistance} km</span>
              <span className="estimate-label">Distance</span>
            </div>
            <div className="estimate-item">
              <span className="estimate-icon">⏱️</span>
              <span className="estimate-value">{estimatedDuration} min</span>
              <span className="estimate-label">Duration</span>
            </div>
          </div>
        </div>
      )}

      <div className="step-actions">
        <button
          className="button primary"
          onClick={() => setBookingStep(2)}
          disabled={!bookingData.vehicleType || !bookingData.pickupLocation || !bookingData.dropoffLocation}
        >
          Continue to Vehicle Selection
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="booking-step">
      <h3>Select Vehicle & Review</h3>
      
      {loading ? (
        <div className="loading">Loading available vehicles...</div>
      ) : (
        <>
          {availableVehicles.length > 0 ? (
            <div className="vehicle-selection">
              {availableVehicles.slice(0, 3).map(vehicle => (
                <div key={vehicle.id} className="vehicle-option">
                  <div className="vehicle-info">
                    <h4>{vehicle.make} {vehicle.model}</h4>
                    <div className="vehicle-details">
                      <span className="rating">⭐ {vehicle.rating}/5</span>
                      <span className="arrival">🕐 {vehicle.estimatedArrival} min away</span>
                      <span className="license">{vehicle.licensePlate}</span>
                    </div>
                    <div className="vehicle-features">
                      {vehicle.features.map(feature => (
                        <span key={feature} className="feature-tag">{feature}</span>
                      ))}
                    </div>
                  </div>
                  <button className="button primary">Select This Vehicle</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-vehicles">
              <p>No vehicles available for the selected criteria.</p>
              <button className="button outline" onClick={() => setBookingStep(1)}>
                Modify Search
              </button>
            </div>
          )}
        </>
      )}

      <div className="step-actions">
        <button className="button outline" onClick={() => setBookingStep(1)}>
          Back
        </button>
        <button
          className="button primary"
          onClick={submitBooking}
          disabled={loading || availableVehicles.length === 0}
        >
          Confirm Booking
        </button>
      </div>
    </div>
  );

  return (
    <div className="panel">
      <div className="booking-header">
        <h2>Book Your Ride</h2>
        <div className="step-indicator">
          <div className={`step ${bookingStep >= 1 ? 'active' : ''}`}>1</div>
          <div className={`step ${bookingStep >= 2 ? 'active' : ''}`}>2</div>
        </div>
      </div>

      {/* Smart Recommendations */}
      {recommendations.length > 0 && (
        <div className="recommendations">
          <h3>Smart Recommendations</h3>
          <div className="recommendation-list">
            {recommendations.map((rec, index) => (
              <div key={index} className={`recommendation ${rec.type}`}>
                <span className="rec-icon">{rec.icon}</span>
                <div className="rec-content">
                  <h4>{rec.title}</h4>
                  <p>{rec.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Steps */}
      {bookingStep === 1 && renderStep1()}
      {bookingStep === 2 && renderStep2()}

      <style>{`
        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .step-indicator {
          display: flex;
          gap: 12px;
        }

        .step {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #334155;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .step.active {
          background-color: #3b82f6;
        }

        .recommendations {
          background-color: #1e293b;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .recommendation-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .recommendation {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 6px;
          background-color: #0f172a;
        }

        .rec-icon {
          font-size: 24px;
        }

        .rec-content h4 {
          margin: 0 0 4px 0;
          color: #f8fafc;
        }

        .rec-content p {
          margin: 0;
          color: #94a3b8;
          font-size: 14px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .trip-estimates {
          background-color: #1e293b;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .estimates-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .estimate-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .estimate-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .estimate-value {
          font-size: 20px;
          font-weight: bold;
          color: #3b82f6;
          margin-bottom: 4px;
        }

        .estimate-label {
          font-size: 12px;
          color: #94a3b8;
        }

        .vehicle-selection {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }

        .vehicle-option {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background-color: #1e293b;
          border-radius: 8px;
        }

        .vehicle-info h4 {
          margin: 0 0 8px 0;
          color: #f8fafc;
        }

        .vehicle-details {
          display: flex;
          gap: 16px;
          margin-bottom: 8px;
          font-size: 14px;
          color: #94a3b8;
        }

        .vehicle-features {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .feature-tag {
          background-color: #334155;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          color: #e2e8f0;
        }

        .step-actions {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .no-vehicles {
          text-align: center;
          padding: 32px;
          color: #94a3b8;
        }

        .loading {
          text-align: center;
          padding: 32px;
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
}

export default CustomerBooking;
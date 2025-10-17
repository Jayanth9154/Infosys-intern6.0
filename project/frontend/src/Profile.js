// frontend/src/Profile.js
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { API_BASE_URL } from './config';

function Profile() {
  const { currentUser } = useContext(AuthContext);
  const [isVerified, setIsVerified] = useState(false);
  const [profile, setProfile] = useState({ 
    name: '', 
    phone: '', 
    address: '',
    // Additional details
    dateOfBirth: '',
    licenseNumber: '',
    emergencyContact: '',
    emergencyPhone: '',
    preferredVehicleType: '',
    experienceYears: ''
  });
  
  // Validation errors state
  const [errors, setErrors] = useState({});
  
  const [assignedVehicles, setAssignedVehicles] = useState([]);
  const [recentTrips, setRecentTrips] = useState({ items: [], page: 0, totalPages: null });
  const [bookings, setBookings] = useState([]); // Add bookings state
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState({});
  const [message, setMessage] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');

  // Helper function to safely format dates
  const formatDate = (dateString) => {
    // Handle null or undefined values
    if (!dateString) {
      return 'Unknown';
    }
    
    try {
      let date;
      
      // Handle different data types that might be passed
      if (typeof dateString === 'object') {
        // If it's a Firebase Timestamp object (has _seconds and _nanoseconds)
        if (dateString._seconds !== undefined) {
          // Convert Firebase Timestamp to JavaScript Date
          // _seconds is seconds since Unix epoch, _nanoseconds is additional nanoseconds
          date = new Date(dateString._seconds * 1000 + Math.floor(dateString._nanoseconds / 1000000));
        } 
        // If it's a Firestore Timestamp object (has seconds and nanoseconds)
        else if (dateString.seconds !== undefined) {
          // Convert Firestore Timestamp to JavaScript Date
          // Handle case where nanoseconds might be undefined
          const nanoseconds = dateString.nanoseconds || 0;
          date = new Date(dateString.seconds * 1000 + Math.floor(nanoseconds / 1000000));
        }
        // If it's a generic object with toDate method (Firestore Timestamp)
        else if (typeof dateString.toDate === 'function') {
          date = dateString.toDate();
        }
        // If it's a Date object
        else if (dateString instanceof Date) {
          date = dateString;
        }
        // If it's a generic object we can't handle
        else {
          return 'Unknown';
        }
      } 
      // Handle string values
      else if (typeof dateString === 'string') {
        // Check if it's a time string (e.g., "03:41") rather than a full date
        if (dateString.match(/^\d{1,2}:\d{2}$/)) {
          // For time strings, we can't create a meaningful date, so return as is
          return dateString;
        }
        // Try to parse as a date string
        date = new Date(dateString);
      } 
      // Handle number values (timestamps)
      else if (typeof dateString === 'number') {
        // Assume it's a Unix timestamp in seconds if it's a reasonable size
        if (dateString < 10000000000) { // Less than 10 digits, likely seconds
          date = new Date(dateString * 1000);
        } else { // Likely milliseconds
          date = new Date(dateString);
        }
      } 
      // Handle other types
      else {
        return 'Unknown';
      }
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Unknown';
      }
      
      return date.toString() !== 'Invalid Date' ? date.toLocaleString() : 'Unknown';
    } catch (error) {
      return 'Unknown';
    }
  };

  // Validation function - making experienceYears optional
  const validateProfile = (data) => {
    const errors = {};
    
    // Name validation - required field
    if (!data.name || data.name.trim().length < 2) {
      errors.name = 'Name is required and must be at least 2 characters';
    }
    
    // Phone validation - required field
    if (!data.phone) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-()]{10,15}$/.test(data.phone)) {
      errors.phone = 'Phone number format is invalid';
    }
    
    // Address validation
    if (data.address && data.address.length > 200) {
      errors.address = 'Address must be less than 200 characters';
    }
    
    // Date of birth validation - required field
    if (!data.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    } else {
      const dob = new Date(data.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (isNaN(dob.getTime())) {
        errors.dateOfBirth = 'Invalid date format';
      } else if (age < 16 || age > 100) {
        errors.dateOfBirth = 'Age must be between 16 and 100 years';
      }
    }
    
    // License number validation
    if (data.licenseNumber && data.licenseNumber.length < 5) {
      errors.licenseNumber = 'License number must be at least 5 characters';
    }
    
    // Emergency contact validation
    if (data.emergencyContact && data.emergencyContact.length < 2) {
      errors.emergencyContact = 'Emergency contact name must be at least 2 characters';
    }
    
    // Emergency phone validation - required if emergency contact is provided
    if (data.emergencyContact && !data.emergencyPhone) {
      errors.emergencyPhone = 'Emergency phone number is required when emergency contact is provided';
    } else if (data.emergencyPhone && !/^\+?[\d\s\-()]{10,15}$/.test(data.emergencyPhone)) {
      errors.emergencyPhone = 'Emergency phone number format is invalid';
    }
    
    // Experience years validation - optional field
    if (data.experienceYears && (isNaN(data.experienceYears) || data.experienceYears < 0 || data.experienceYears > 40)) {
      errors.experienceYears = 'Experience years must be between 0 and 40';
    }
    
    // Preferred vehicle type validation
    const validVehicleTypes = ['', 'economy', 'premium', 'suv', 'electric', 'van', 'luxury'];
    if (data.preferredVehicleType && !validVehicleTypes.includes(data.preferredVehicleType)) {
      errors.preferredVehicleType = 'Please select a valid vehicle type';
    }
    
    return errors;
  };

  useEffect(() => {
    if (!currentUser) {
      setIsVerified(false);
      return;
    }
    setIsVerified(!!currentUser.emailVerified);
  }, [currentUser]);

  const fetchProfile = useCallback(async () => {
    if (!currentUser) return;
    try {
      const token = await currentUser.getIdToken();
      
      // Log the token for debugging (remove in production)
      console.log('Fetching profile with token:', token ? 'Token present' : 'No token');
      
      // Fetch profile data
      const profileRes = await axios.get(`${API_BASE_URL}/api/profile/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const p = profileRes.data.profile || {};
      const vehicles = Array.isArray(profileRes.data.assignedVehicles) ? profileRes.data.assignedVehicles : [];
      const tripsPayload = profileRes.data.recentTrips || {};
      const trips = Array.isArray(tripsPayload.items) ? tripsPayload.items : Array.isArray(tripsPayload) ? tripsPayload : [];
      const page = Number.isFinite(tripsPayload.page) ? tripsPayload.page : 0;
      const totalPages = Number.isFinite(tripsPayload.totalPages) ? tripsPayload.totalPages : (trips.length > 0 ? 1 : 0);

      setProfile({
        name: p.name || '',
        phone: p.phone || '',
        address: p.address || '',
        dateOfBirth: p.dateOfBirth || '',
        licenseNumber: p.licenseNumber || '',
        emergencyContact: p.emergencyContact || '',
        emergencyPhone: p.emergencyPhone || '',
        preferredVehicleType: p.preferredVehicleType || '',
        experienceYears: p.experienceYears || ''
      });
      setAssignedVehicles(vehicles);
      setRecentTrips({ items: trips, page, totalPages });
      
      // Fetch bookings for the user
      try {
        const bookingsRes = await axios.get(`${API_BASE_URL}/api/bookings/user`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Ensure we're getting an array of bookings
        const bookingsData = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
        
        setBookings(bookingsData);
        
        // Log successful fetch for debugging
        console.log('Successfully fetched bookings:', bookingsData);
      } catch (bookingError) {
        console.error('Failed to fetch bookings:', bookingError);
        
        // Try to get more detailed error information
        if (bookingError.response) {
          console.error('Booking API Error Response:', bookingError.response.status, bookingError.response.data);
          // Check if it's a Firebase index error
          if (bookingError.response.status === 500 && bookingError.response.data && 
              ((typeof bookingError.response.data === 'string' && bookingError.response.data.includes('index')) ||
               (typeof bookingError.response.data === 'object' && bookingError.response.data.error && bookingError.response.data.error.includes('index')))) {
            setMessage('Booking data temporarily unavailable. Firebase requires a composite index for this query. ' +
                      'Please create a composite index in the Firebase Console with these fields: customerId (equality) and createdAt (descending). ' +
                      'Visit: https://console.firebase.google.com/project/neurofleetx-project/firestore/indexes');
          } else {
            setMessage(`Failed to load bookings: ${bookingError.response.status} - ${JSON.stringify(bookingError.response.data)}`);
          }
        } else if (bookingError.request) {
          console.error('Booking API No Response:', bookingError.request);
          setMessage('Failed to load bookings: No response from server. Check if backend is running.');
        } else {
          console.error('Booking API Error Message:', bookingError.message);
          setMessage('Failed to load bookings: ' + bookingError.message);
        }
        
        // Set empty array as fallback
        setBookings([]);
      }
      
      if (profileRes.data.message) {
        setMessage(profileRes.data.message);
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
      
      // Try to get more detailed error information
      if (e.response) {
        console.error('Profile API Error Response:', e.response.status, e.response.data);
        console.error('Response headers:', e.response.headers);
        
        // Handle specific error cases
        if (e.response.status === 403) {
          // Check if we have more details in the response
          const errorMessage = e.response.data?.message || e.response.data?.error || 'Access denied';
          setMessage(`Access denied (403): ${errorMessage}. You do not have permission to view this profile. Please contact an administrator.`);
        } else if (e.response.status === 401) {
          setMessage('Authentication required (401): Please log in again to access your profile.');
        } else if (e.response.status === 500) {
          const serverMessage = e.response.data?.message || 'Server error occurred';
          setMessage(`Server error occurred while loading profile (500): ${serverMessage}`);
        } else {
          const errorMessage = e.response.data?.message || e.response.data?.error || JSON.stringify(e.response.data);
          setMessage(`Failed to load profile (${e.response.status}): ${errorMessage}`);
        }
      } else if (e.request) {
        console.error('Profile API No Response:', e.request);
        setMessage('Failed to load profile: No response from server. Check if backend is running.');
      } else {
        console.error('Profile API Error Message:', e.message);
        setMessage('Failed to load profile: ' + e.message);
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const cancelBooking = async (bookingId) => {
    if (!currentUser || !window.confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      setCancelling(prev => ({ ...prev, [bookingId]: true }));
      const token = await currentUser.getIdToken();
      
      await axios.delete(`${API_BASE_URL}/api/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update the bookings list
      setBookings(prev => prev.filter(booking => booking.id !== bookingId));
      setMessage('Booking cancelled successfully!');
      
      // Refresh profile data
      fetchProfile();
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      setMessage('Failed to cancel booking. Please try again.');
    } finally {
      setCancelling(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Add event listener to refresh profile data when a booking is created
  useEffect(() => {
    const handleBookingCreated = () => {
      // Refresh profile data after a short delay to allow backend to process the booking
      setTimeout(() => {
        fetchProfile();
      }, 2000);
    };

    window.addEventListener('bookingCreated', handleBookingCreated);
    
    return () => {
      window.removeEventListener('bookingCreated', handleBookingCreated);
    };
  }, [fetchProfile]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const onSave = async (e) => {
    e.preventDefault();
    setMessage('');
    
    // Validate profile
    const formErrors = validateProfile(profile);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    // Clear errors if validation passes
    setErrors({});
    
    try {
      const token = await currentUser.getIdToken();
      const res = await axios.put(`${API_BASE_URL}/api/profile/me`, profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data.profile || profile);
      setMessage('Profile saved successfully!');
      
      // Show the updated profile information
      setTimeout(() => {
        setMessage('Profile updated successfully! Changes are now visible below.');
      }, 3000);
    } catch (e) {
      console.error(e);
      setErrors({ general: 'Failed to save profile' });
    }
  };

  // Enhanced email verification with better feedback
  const handleEmailVerification = async () => {
    if (!currentUser) return;
    
    try {
      // Send verification email
      await sendEmailVerification(currentUser);
      setVerificationMessage('Verification email sent! Please check your inbox and spam folder.');
      
      // Poll for email verification status
      let attempts = 0;
      const maxAttempts = 24; // Check for 2 minutes (24 * 5 seconds)
      
      const checkVerification = async () => {
        attempts++;
        try {
          // Reload user data to get updated email verification status
          await currentUser.reload();
          
          if (currentUser.emailVerified) {
            setIsVerified(true);
            setVerificationMessage('Email verified successfully!');
            return;
          }
          
          // If not verified and we haven't exceeded max attempts, check again
          if (attempts < maxAttempts) {
            setTimeout(checkVerification, 5000); // Check every 5 seconds
          } else {
            setVerificationMessage('Verification not detected. Please refresh the page after verifying your email.');
          }
        } catch (reloadError) {
          console.error('Error reloading user:', reloadError);
          if (attempts < maxAttempts) {
            setTimeout(checkVerification, 5000);
          } else {
            setVerificationMessage('Unable to verify status. Please refresh the page after verifying your email.');
          }
        }
      };
      
      // Start checking after a short delay to allow email sending
      setTimeout(checkVerification, 3000);
    } catch (err) {
      console.error('Failed to send verification email', err);
      // Handle specific error cases
      if (err.code === 'auth/too-many-requests') {
        setErrors({ general: 'Too many requests. Please wait before requesting another verification email.' });
      } else {
        setErrors({ general: 'Failed to send verification email. Please try again later.' });
      }
    }
  };

  // Refresh email verification status
  const refreshVerificationStatus = async () => {
    if (!currentUser) return;
    
    try {
      setMessage(''); // Clear any previous messages
      setVerificationMessage('Checking verification status...');
      
      // Reload user data to get updated email verification status
      await currentUser.reload();
      const verified = !!currentUser.emailVerified;
      setIsVerified(verified);
      
      if (verified) {
        setVerificationMessage('Email verified successfully!');
      } else {
        setVerificationMessage('Email not yet verified. Please check your inbox and spam folder.');
      }
    } catch (err) {
      console.error('Failed to refresh verification status', err);
      setErrors({ general: 'Failed to refresh verification status. Please try again.' });
      setVerificationMessage(''); // Clear verification message on error
    }
  };

  if (!currentUser) return null;
  if (loading) return <div className="panel">Loading profile...</div>;

  return (
    <div className="profile-container">
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* General Error Message */}
      {(errors.general || message) && (
        <div className={`error-message ${!errors.general ? 'success' : ''}`}>
          <p>{errors.general || message}</p>
        </div>
      )}
      
      {!isVerified && (
        <div className="card" style={{
          background: 'rgba(255, 99, 71, 0.12)',
          border: '1px solid rgba(255, 99, 71, 0.4)',
          padding: 16,
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#fca5a5' }}>Email verification required</h3>
            <span style={{ color: '#f87171', fontWeight: 600 }}>✗ Unverified</span>
          </div>
          <p style={{ margin: 0, color: '#f8d7da', fontSize: '0.95em' }}>
            Verify your email address to access the full feature set, including vehicle assignments and trip history.
          </p>
          <div className="row" style={{ justifyContent: 'flex-start', gap: 12 }}>
            <button
              type="button"
              className="button"
              onClick={handleEmailVerification}
              disabled={verificationMessage.includes('sent') || verificationMessage.includes('Checking')}
            >
              Send verification email
            </button>
            <button
              type="button"
              className="button outline"
              onClick={refreshVerificationStatus}
              disabled={verificationMessage.includes('Checking')}
            >
              Refresh status
            </button>
          </div>
          {verificationMessage && (
            <div className="verification-message">
              <p>{verificationMessage}</p>
            </div>
          )}
          <div style={{ marginTop: 8, fontSize: '0.85em', color: '#f8d7da' }}>
            <p><strong>Tip:</strong> Check your spam/junk folder if you don't see the email in your inbox.</p>
          </div>
        </div>
      )}
      
      <div className="card">
        <div className="card-header">
          <h2>Profile Information</h2>
          <button
            type="button"
            className="button small"
            onClick={fetchProfile}
          >
            Refresh Data
          </button>
        </div>
        <form onSubmit={onSave} className="profile-form">
          <div className="form-section">
            <h3>Personal Details</h3>
            <div className="row" style={{ gap: 16 }}>
              <div className="form-group">
                <label>Name <span className="required">*</span></label>
                <input
                  className={`input ${errors.name ? 'error' : ''}`}
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={profile.name}
                  onChange={onChange}
                  required
                />
                {errors.name && <div className="error-text">{errors.name}</div>}
              </div>
              <div className="form-group">
                <label>Phone <span className="required">*</span></label>
                <input
                  className={`input ${errors.phone ? 'error' : ''}`}
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={profile.phone}
                  onChange={onChange}
                  required
                />
                {errors.phone && <div className="error-text">{errors.phone}</div>}
              </div>
            </div>
            
            <div className="form-group">
              <label>Address</label>
              <textarea
                className={`textarea ${errors.address ? 'error' : ''}`}
                name="address"
                placeholder="Address"
                value={profile.address}
                onChange={onChange}
                rows={3}
              />
              {errors.address && <div className="error-text">{errors.address}</div>}
            </div>
          </div>
          
          <div className="form-section">
            <h3>Additional Information</h3>
            <div className="row" style={{ gap: 16 }}>
              <div className="form-group">
                <label>Date of Birth <span className="required">*</span></label>
                <input
                  className={`input ${errors.dateOfBirth ? 'error' : ''}`}
                  type="date"
                  name="dateOfBirth"
                  value={profile.dateOfBirth}
                  onChange={onChange}
                  required
                />
                {errors.dateOfBirth && <div className="error-text">{errors.dateOfBirth}</div>}
              </div>
              <div className="form-group">
                <label>License Number</label>
                <input
                  className={`input ${errors.licenseNumber ? 'error' : ''}`}
                  type="text"
                  name="licenseNumber"
                  placeholder="License Number"
                  value={profile.licenseNumber}
                  onChange={onChange}
                />
                {errors.licenseNumber && <div className="error-text">{errors.licenseNumber}</div>}
              </div>
            </div>
            
            <div className="row" style={{ gap: 16 }}>
              <div className="form-group">
                <label>Emergency Contact</label>
                <input
                  className={`input ${errors.emergencyContact ? 'error' : ''}`}
                  type="text"
                  name="emergencyContact"
                  placeholder="Emergency Contact Name"
                  value={profile.emergencyContact}
                  onChange={onChange}
                />
                {errors.emergencyContact && <div className="error-text">{errors.emergencyContact}</div>}
              </div>
              <div className="form-group">
                <label>Emergency Phone</label>
                <input
                  className={`input ${errors.emergencyPhone ? 'error' : ''}`}
                  type="tel"
                  name="emergencyPhone"
                  placeholder="Emergency Phone"
                  value={profile.emergencyPhone}
                  onChange={onChange}
                />
                {errors.emergencyPhone && <div className="error-text">{errors.emergencyPhone}</div>}
              </div>
            </div>
          </div>
          
          <div className="form-section">
            <h3>Preferences</h3>
            <div className="row" style={{ gap: 16 }}>
              <div className="form-group">
                <label>Preferred Vehicle Type</label>
                <select 
                  className={`select ${errors.preferredVehicleType ? 'error' : ''}`}
                  name="preferredVehicleType" 
                  value={profile.preferredVehicleType} 
                  onChange={onChange}
                >
                  <option value="">Select Vehicle Type</option>
                  <option value="economy">Economy</option>
                  <option value="premium">Premium</option>
                  <option value="suv">SUV</option>
                  <option value="electric">Electric</option>
                  <option value="van">Van</option>
                  <option value="luxury">Luxury</option>
                </select>
                {errors.preferredVehicleType && <div className="error-text">{errors.preferredVehicleType}</div>}
              </div>
              <div className="form-group">
                <label>Years of Experience</label>
                <input
                  className={`input ${errors.experienceYears ? 'error' : ''}`}
                  type="number"
                  name="experienceYears"
                  placeholder="Years of Experience"
                  value={profile.experienceYears}
                  onChange={onChange}
                  min="0"
                  max="40"
                />
                {errors.experienceYears && <div className="error-text">{errors.experienceYears}</div>}
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button className="button primary" type="submit">Save Profile</button>
          </div>
        </form>
      </div>
      
      {/* Personal Info Card - Display after saving */}
      <div className="card">
        <div className="card-header">
          <h2>Your Profile Information</h2>
        </div>
        <div className="profile-info-card">
          <div className="info-section">
            <h3>Personal Details</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Name</span>
                <span className="info-value">{profile.name || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone</span>
                <span className="info-value">{profile.phone || 'Not provided'}</span>
              </div>
              <div className="info-item full-width">
                <span className="info-label">Address</span>
                <span className="info-value">{profile.address || 'Not provided'}</span>
              </div>
            </div>
          </div>
          
          <div className="info-section">
            <h3>Additional Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Date of Birth</span>
                <span className="info-value">
                  {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not provided'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">License Number</span>
                <span className="info-value">{profile.licenseNumber || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Emergency Contact</span>
                <span className="info-value">{profile.emergencyContact || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Emergency Phone</span>
                <span className="info-value">{profile.emergencyPhone || 'Not provided'}</span>
              </div>
            </div>
          </div>
          
          <div className="info-section">
            <h3>Preferences</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Preferred Vehicle Type</span>
                <span className="info-value">
                  {profile.preferredVehicleType 
                    ? profile.preferredVehicleType.charAt(0).toUpperCase() + profile.preferredVehicleType.slice(1)
                    : 'Not specified'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Years of Experience</span>
                <span className="info-value">
                  {profile.experienceYears ? `${profile.experienceYears} years` : 'Not specified'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Show assigned vehicles, recent trips, and bookings regardless of email verification */}
      {assignedVehicles.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>Assigned Vehicles</h2>
            <button
              type="button"
              className="button small"
              onClick={fetchProfile}
            >
              Refresh
            </button>
          </div>
          <div className="vehicles-grid">
            {assignedVehicles.map(vehicle => (
              <div key={vehicle.id} className="vehicle-card">
                <div className="vehicle-header">
                  <h3>{vehicle.make} {vehicle.model}</h3>
                  <span className={`status-badge ${vehicle.status?.toLowerCase() || 'available'}`}>
                    {vehicle.status || 'Available'}
                  </span>
                </div>
                <div className="vehicle-details">
                  <p>
                    <span className="detail-label">License Plate:</span>
                    <span className="detail-value">{vehicle.licensePlate}</span>
                  </p>
                  {vehicle.currentBattery && (
                    <p>
                      <span className="detail-label">Battery:</span>
                      <span className="detail-value">{parseFloat(vehicle.currentBattery).toFixed(2)}%</span>
                    </p>
                  )}
                  {vehicle.lastKnownLocation && (
                    <p>
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">{vehicle.lastKnownLocation}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {recentTrips.items.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>Recent Trips</h2>
            <button
              type="button"
              className="button small"
              onClick={fetchProfile}
            >
              Refresh
            </button>
          </div>
          <div className="trips-list">
            {recentTrips.items.map(trip => (
              <div key={trip.id} className="trip-card">
                <div className="trip-header">
                  <h3>{trip.startLocation} → {trip.endLocation}</h3>
                  <span className={`status-badge ${trip.status?.toLowerCase() || 'completed'}`}>
                    {trip.status || 'Completed'}
                  </span>
                </div>
                <div className="trip-details">
                  <p>
                    <span className="detail-label">Distance:</span>
                    <span className="detail-value">{parseFloat(trip.distanceKm || 0).toFixed(2)} km</span>
                  </p>
                  <p>
                    <span className="detail-label">Start Time:</span>
                    <span className="detail-value">{new Date(trip.startTime).toLocaleString()}</span>
                  </p>
                  {trip.endTime && (
                    <p>
                      <span className="detail-label">End Time:</span>
                      <span className="detail-value">{new Date(trip.endTime).toLocaleString()}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {bookings.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>Bookings</h2>
            <button
              type="button"
              className="button small"
              onClick={fetchProfile}
            >
              Refresh
            </button>
          </div>
          <div className="bookings-list">
            {bookings.map(booking => (
              <div key={booking.id} className="booking-card">
                <div className="booking-header">
                  <h3>{booking.pickupLocation} → {booking.dropoffLocation}</h3>
                  <span className={`status-badge ${booking.status?.toLowerCase() || 'pending'}`}>
                    {booking.status || 'Pending'}
                  </span>
                </div>
                <div className="booking-details">
                  {booking.vehicleType && (
                    <p>
                      <span className="detail-label">Vehicle Type:</span>
                      <span className="detail-value">{booking.vehicleType}</span>
                    </p>
                  )}
                  {booking.estimatedCost && (
                    <p>
                      <span className="detail-label">Estimated Cost:</span>
                      <span className="detail-value">₹{parseFloat(booking.estimatedCost).toFixed(2)}</span>
                    </p>
                  )}
                  {booking.createdAt && (
                    <p>
                      <span className="detail-label">Booked On:</span>
                      <span className="detail-value">{formatDate(booking.createdAt)}</span>
                    </p>
                  )}
                  {booking.pickupTime && (
                    <p>
                      <span className="detail-label">Pickup Time:</span>
                      <span className="detail-value">{formatDate(booking.pickupTime)}</span>
                    </p>
                  )}
                  {booking.dropoffTime && (
                    <p>
                      <span className="detail-label">Dropoff Time:</span>
                      <span className="detail-value">{formatDate(booking.dropoffTime)}</span>
                    </p>
                  )}
                  {booking.distance && (
                    <p>
                      <span className="detail-label">Distance:</span>
                      <span className="detail-value">{parseFloat(booking.distance).toFixed(2) || '0.00'} km</span>
                    </p>
                  )}
                  {booking.bookingId && (
                    <p>
                      <span className="detail-label">Booking ID:</span>
                      <span className="detail-value">{booking.bookingId}</span>
                    </p>
                  )}
                </div>
                <div className="action-buttons">
                  <button
                    className="cancel-button"
                    onClick={() => cancelBooking(booking.id)}
                    disabled={cancelling[booking.id] || booking.status === 'cancelled'}
                  >
                    {cancelling[booking.id] ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <style>{`
        .error-message {
          background-color: #dc2626;
          color: white;
          padding: 16px 20px;
          border-radius: 12px;
          margin-bottom: 20px;
          font-size: 15px;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }
        
        .error-message.success {
          background-color: #10b981;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        .verification-message {
          background-color: #3b82f6;
          color: white;
          padding: 16px 20px;
          border-radius: 12px;
          margin-top: 16px;
          font-size: 15px;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        
        .input.error, .select.error, .textarea.error {
          border: 2px solid #dc2626;
          background-color: #fef2f2;
        }
        
        .error-text {
          color: #dc2626;
          font-size: 13px;
          margin-top: 6px;
          font-weight: 500;
        }
        
        .profile-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .card {
          background-color: #1e293b;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin-bottom: 24px;
          border: 1px solid #334155;
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #334155;
        }
        
        .card-header h2 {
          margin: 0;
          color: #f8fafc;
          font-size: 24px;
        }
        
        .card-header h3 {
          margin: 0;
          color: #f8fafc;
          font-size: 20px;
        }
        
        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .form-section {
          background-color: #334155;
          border-radius: 8px;
          padding: 20px;
          border: 1px solid #475569;
        }
        
        .form-section h3 {
          margin: 0 0 16px 0;
          color: #f8fafc;
          font-size: 18px;
          padding-bottom: 8px;
          border-bottom: 1px solid #475569;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #e2e8f0;
          font-size: 14px;
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          padding-top: 16px;
          border-top: 1px solid #334155;
        }
        
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .required {
          color: #dc2626;
        }
        
        /* Profile Info Card Styles */
        .profile-info-card {
          background: linear-gradient(135deg, #1e293b, #334155);
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          border: 1px solid #475569;
          margin-top: 24px;
        }

        .info-section {
          margin-bottom: 32px;
        }

        .info-section:last-child {
          margin-bottom: 0;
        }

        .info-section h3 {
          color: #f8fafc;
          font-size: 20px;
          margin: 0 0 20px 0;
          padding-bottom: 12px;
          border-bottom: 1px solid #475569;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          background-color: #0f172a;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #334155;
        }

        .info-item.full-width {
          grid-column: 1 / -1;
        }

        .info-label {
          font-size: 13px;
          color: #94a3b8;
          text-transform: uppercase;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }

        .info-value {
          font-weight: 600;
          color: #e2e8f0;
          font-size: 16px;
        }
        
        .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .status-badge.available,
        .status-badge.completed {
          background-color: #10b981;
          color: white;
        }
        
        .status-badge.on-trip,
        .status-badge.confirmed {
          background-color: #3b82f6;
          color: white;
        }
        
        .status-badge.maintenance {
          background-color: #f59e0b;
          color: white;
        }
        
        .status-badge.charging {
          background-color: #8b5cf6;
          color: white;
        }
        
        .status-badge.pending {
          background-color: #f97316;
          color: white;
        }
        
        .status-badge.out-of-service {
          background-color: #ef4444;
          color: white;
        }
        
        .vehicles-grid,
        .trips-list,
        .bookings-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        
        .vehicle-card,
        .trip-card,
        .booking-card {
          background-color: #334155;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border: 1px solid #475569;
        }
        
        .vehicle-card:hover,
        .trip-card:hover,
        .booking-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .vehicle-card {
          border-top: 4px solid #10b981;
        }
        
        .trip-card {
          border-top: 4px solid #3b82f6;
        }
        
        .booking-card {
          border-top: 4px solid #f97316;
        }
        
        .vehicle-header,
        .trip-header,
        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .vehicle-header h3,
        .trip-header h3,
        .booking-header h3 {
          margin: 0;
          font-size: 18px;
          color: #f8fafc;
          font-weight: 600;
        }
        
        .vehicle-details,
        .trip-details,
        .booking-details {
          font-size: 14px;
          color: #cbd5e1;
        }
        
        .vehicle-details p,
        .trip-details p,
        .booking-details p {
          margin: 6px 0;
          display: flex;
          justify-content: space-between;
        }
        
        .detail-label {
          font-weight: 500;
          color: #94a3b8;
        }
        
        .detail-value {
          font-weight: 400;
          color: #e2e8f0;
          text-align: right;
        }
        
        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }
        
        .cancel-button {
          background-color: #dc2626;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s ease;
        }
        
        .cancel-button:hover:not(:disabled) {
          background-color: #b91c1c;
        }
        
        .cancel-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
      </div>
    </div>
  );
}

export default Profile;

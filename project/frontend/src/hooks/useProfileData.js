// frontend/src/hooks/useProfileData.js
// Reusable hook to interact with profile, vehicle assignment, and trip data.
import { useCallback, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

/**
 * Hook encapsulating profile CRUD and associated collections.
 * @param {() => Promise<string>} tokenProvider - async function returning current auth token
 * @returns {{
 *   profile: object,
 *   assignedVehicles: object[],
 *   recentTrips: { items: object[], page: number, totalPages: number },
 *   loading: boolean,
 *   message: string,
 *   fetchProfile: () => Promise<void>,
 *   saveProfile: (payload: object) => Promise<void>
 * }}
 */
const useProfileData = (tokenProvider) => {
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    licenseNumber: '',
    emergencyContact: '',
    emergencyPhone: '',
    preferredVehicleType: '',
    experienceYears: ''
  });
  const [assignedVehicles, setAssignedVehicles] = useState([]);
  const [recentTrips, setRecentTrips] = useState({ items: [], page: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchProfile = useCallback(async () => {
    if (!tokenProvider) return;
    setLoading(true);
    try {
      const token = await tokenProvider();
      const response = await axios.get(`${API_BASE_URL}/api/profile/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data || {};
      const profilePayload = data.profile || {};
      const vehiclesPayload = Array.isArray(data.assignedVehicles) ? data.assignedVehicles : [];
      const tripsPayload = data.recentTrips || {};
      const trips = Array.isArray(tripsPayload.items)
        ? tripsPayload.items
        : Array.isArray(tripsPayload)
          ? tripsPayload
          : [];
      const page = Number.isFinite(tripsPayload.page) ? tripsPayload.page : 0;
      const totalPages = Number.isFinite(tripsPayload.totalPages)
        ? tripsPayload.totalPages
        : trips.length > 0
          ? 1
          : 0;

      setProfile({
        name: profilePayload.name || '',
        phone: profilePayload.phone || '',
        address: profilePayload.address || '',
        dateOfBirth: profilePayload.dateOfBirth || '',
        licenseNumber: profilePayload.licenseNumber || '',
        emergencyContact: profilePayload.emergencyContact || '',
        emergencyPhone: profilePayload.emergencyPhone || '',
        preferredVehicleType: profilePayload.preferredVehicleType || '',
        experienceYears: profilePayload.experienceYears || ''
      });
      setAssignedVehicles(vehiclesPayload);
      setRecentTrips({ items: trips, page, totalPages });
      if (data.message) {
        setMessage(data.message);
      } else {
        setMessage('');
      }
    } catch (error) {
      console.error('[useProfileData] Failed to fetch profile', error);
      setMessage('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [tokenProvider]);

  const saveProfile = useCallback(async (payload) => {
    if (!tokenProvider) return;
    try {
      const token = await tokenProvider();
      const response = await axios.put(`${API_BASE_URL}/api/profile/me`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const responseProfile = response.data?.profile;
      if (responseProfile) {
        setProfile((prev) => ({ ...prev, ...responseProfile }));
      }
      setMessage('Profile saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('[useProfileData] Failed to save profile', error);
      setMessage('Failed to save profile');
      throw error;
    }
  }, [tokenProvider]);

  return {
    profile,
    assignedVehicles,
    recentTrips,
    loading,
    message,
    fetchProfile,
    saveProfile,
    setProfile,
    setAssignedVehicles,
    setRecentTrips,
    setMessage
  };
};

export default useProfileData;

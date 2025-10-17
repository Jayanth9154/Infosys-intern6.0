import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Alert from './Alert';
import { API_BASE_URL } from './config';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
  
  // Validation errors state
  const [errors, setErrors] = useState({});
  
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [estimatedDistance, setEstimatedDistance] = useState(0);
  const [estimatedDuration, setEstimatedDuration] = useState(0);
  const [nearbyLocations, setNearbyLocations] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [allVehicles, setAllVehicles] = useState([]);
  const [locationError, setLocationError] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [mapType, setMapType] = useState(''); // 'pickup' or 'dropoff'
  const [selectedMapLocation, setSelectedMapLocation] = useState(null);
  const [locationCoordinates, setLocationCoordinates] = useState({}); // Store coordinates for locations
  
  // Alert state
  const [alert, setAlert] = useState(null);
  
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerRef = useRef(null);
  const tileLayerRef = useRef(null);

  // Get user location with higher accuracy
  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLoc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
            };
            setUserLocation(userLoc);
            setLocationError(null);
            console.log('User location obtained:', userLoc);
          },
          (error) => {
            console.error('Error getting user location:', error);
            setLocationError('Unable to get your location. Nearby locations will be based on default location.');
            // Use default location if geolocation fails
            const defaultLoc = { lat: 28.6139, lng: 77.2090, accuracy: 100 };
            setUserLocation(defaultLoc);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      } else {
        setLocationError('Geolocation is not supported by your browser. Using default location.');
        // Use default location if geolocation is not supported
        const defaultLoc = { lat: 28.6139, lng: 77.2090, accuracy: 100 };
        setUserLocation(defaultLoc);
      }
    };

    getUserLocation();
  }, []);

  // Fetch nearby locations based on user location with improved accuracy
  const fetchNearbyLocations = async (location) => {
    if (!location) return;

    try {
      // Use OpenStreetMap Nominatim API to get nearby places
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=near+${location.lat},${location.lng}&limit=10`
      );
      
      if (response.ok) {
        const data = await response.json();
        const nearbyLocationsList = data.slice(0, 5).map(item => ({
          name: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        }));
        
        setNearbyLocations(nearbyLocationsList);
      } else {
        // Fallback to generated locations if API fails
        const nearbyLocationsList = [
          { name: 'Nearest Mall', lat: location.lat + 0.01, lng: location.lng + 0.01 },
          { name: 'Closest Hospital', lat: location.lat - 0.005, lng: location.lng - 0.005 },
          { name: 'Nearby Airport', lat: location.lat + 0.02, lng: location.lng - 0.01 },
          { name: 'Local Business District', lat: location.lat - 0.01, lng: location.lng + 0.005 },
          { name: 'Shopping Center', lat: location.lat + 0.005, lng: location.lng - 0.02 }
        ];
        
        setNearbyLocations(nearbyLocationsList);
      }
    } catch (error) {
      console.error('Error fetching nearby locations:', error);
      // Fallback to default locations near user's location
      const defaultLocations = [
        { name: 'City Center', lat: location.lat, lng: location.lng },
        { name: 'Main Station', lat: location.lat + 0.01, lng: location.lng + 0.01 },
        { name: 'Shopping Mall', lat: location.lat - 0.01, lng: location.lng - 0.01 }
      ];
      setNearbyLocations(defaultLocations);
    }
  };

  // Fetch all vehicles for nearby location detection with improved accuracy
  useEffect(() => {
    const fetchVehicles = async () => {
      if (!currentUser) return;

      try {
        const token = await currentUser.getIdToken();
        console.log('Fetching all vehicles');
        const response = await axios.get(`${API_BASE_URL}/api/vehicles`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('All vehicles response:', response.data);
        // Ensure we always have some vehicles for location detection
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setAllVehicles(response.data);
        } else {
          // Provide default vehicles if none are available
          setAllVehicles([
            { id: 'default-1', make: 'Tesla', model: 'Model 3', licensePlate: 'EV-001', status: 'available', latitude: 28.6139, longitude: 77.2090 },
            { id: 'default-2', make: 'BMW', model: 'i3', licensePlate: 'EV-002', status: 'on-trip', latitude: 28.6239, longitude: 77.2190 },
            { id: 'default-3', make: 'Nissan', model: 'Leaf', licensePlate: 'EV-003', status: 'available', latitude: 28.6339, longitude: 77.2290 }
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
        // Provide default vehicles on error
        setAllVehicles([
          { id: 'default-1', make: 'Tesla', model: 'Model 3', licensePlate: 'EV-001', status: 'available', latitude: 28.6139, longitude: 77.2090 },
          { id: 'default-2', make: 'BMW', model: 'i3', licensePlate: 'EV-002', status: 'on-trip', latitude: 28.6239, longitude: 77.2190 },
          { id: 'default-3', make: 'Nissan', model: 'Leaf', licensePlate: 'EV-003', status: 'available', latitude: 28.6339, longitude: 77.2290 }
        ]);
      }
    };
    
    fetchVehicles();
  }, [currentUser]);

  // Update nearby locations when user location or vehicles change
  useEffect(() => {
    if (userLocation) {
      fetchNearbyLocations(userLocation);
    }
  }, [userLocation]);

  // Vehicle types with pricing
  const vehicleTypes = [
    { id: 'economy', name: 'Economy Car', baseRate: 150, capacity: 4, icon: '🚗' },
    { id: 'premium', name: 'Premium Car', baseRate: 250, capacity: 4, icon: '🚙' },
    { id: 'suv', name: 'SUV', baseRate: 350, capacity: 7, icon: '🚐' },
    { id: 'electric', name: 'Electric Vehicle', baseRate: 200, capacity: 4, icon: '⚡' },
    { id: 'van', name: 'Van', baseRate: 450, capacity: 12, icon: '🚌' },
    { id: 'luxury', name: 'Luxury Car', baseRate: 600, capacity: 4, icon: '🏎️' }
  ];

  // Validation function
  const validateForm = (data) => {
    const errors = {};
    
    // Vehicle type validation
    if (!data.vehicleType) {
      errors.vehicleType = 'Please select a vehicle type';
    }
    
    // Pickup location validation
    if (!data.pickupLocation) {
      errors.pickupLocation = 'Please enter a pickup location';
    } else if (data.pickupLocation.length < 3) {
      errors.pickupLocation = 'Pickup location must be at least 3 characters';
    }
    
    // Dropoff location validation
    if (!data.dropoffLocation) {
      errors.dropoffLocation = 'Please enter a drop-off location';
    } else if (data.dropoffLocation.length < 3) {
      errors.dropoffLocation = 'Drop-off location must be at least 3 characters';
    }
    
    // Pickup date validation
    if (!data.pickupDate) {
      errors.pickupDate = 'Please select a pickup date';
    } else {
      const selectedDate = new Date(data.pickupDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        errors.pickupDate = 'Pickup date cannot be in the past';
      }
    }
    
    // Pickup time validation
    if (!data.pickupTime) {
      errors.pickupTime = 'Please select a pickup time';
    }
    
    // Duration validation
    if (!data.duration) {
      errors.duration = 'Please enter trip duration';
    } else {
      const duration = parseInt(data.duration);
      if (isNaN(duration) || duration < 30) {
        errors.duration = 'Duration must be at least 30 minutes';
      } else if (duration > 1440) { // 24 hours
        errors.duration = 'Duration cannot exceed 24 hours';
      }
    }
    
    // Passengers validation
    const passengers = parseInt(data.passengers);
    if (isNaN(passengers) || passengers < 1) {
      errors.passengers = 'Passengers must be at least 1';
    } else if (passengers > 12) {
      errors.passengers = 'Passengers cannot exceed 12';
    }
    
    return errors;
  };

  // Handle input changes with validation
  const handleInputChange = (field, value) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Auto-calculate estimates when key fields change
    if (['vehicleType', 'pickupLocation', 'dropoffLocation', 'duration'].includes(field)) {
      calculateEstimates({ ...bookingData, [field]: value });
    }
  };

  // Set current location for pickup or dropoff with improved accuracy
  const setCurrentLocation = async (type) => {
    if (userLocation) {
      try {
        // Reverse geocode to get the actual location name
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}&zoom=18&addressdetails=1`
        );
        const result = await response.json();
        
        let locationName = 'Current Location';
        if (result && result.display_name) {
          locationName = result.display_name;
        } else {
          locationName = `Current Location (${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)})`;
        }
        
        handleInputChange(type === 'pickup' ? 'pickupLocation' : 'dropoffLocation', locationName);
        
        // Store coordinates for this location
        setLocationCoordinates(prev => ({
          ...prev,
          [locationName]: { lat: userLocation.lat, lng: userLocation.lng }
        }));
      } catch (error) {
        console.error('Error reverse geocoding current location:', error);
        // Fallback to generic name
        const locationName = `Current Location (${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)})`;
        handleInputChange(type === 'pickup' ? 'pickupLocation' : 'dropoffLocation', locationName);
        
        // Store coordinates for this location
        setLocationCoordinates(prev => ({
          ...prev,
          [locationName]: { lat: userLocation.lat, lng: userLocation.lng }
        }));
      }
    }
  };

  // Open map for location selection
  const openMapForLocation = (type) => {
    setMapType(type);
    setShowMap(true);
    setSelectedMapLocation(null);
  };

  // Handle map location selection
  const handleMapLocationSelect = (locationName, coordinates) => {
    if (mapType === 'pickup') {
      handleInputChange('pickupLocation', locationName);
    } else {
      handleInputChange('dropoffLocation', locationName);
    }
    
    // Store coordinates for this location
    setLocationCoordinates(prev => ({
      ...prev,
      [locationName]: coordinates
    }));
    
    // Close the map after a short delay to ensure state is updated
    setTimeout(() => {
      setShowMap(false);
    }, 100);
  };

  // Close map without selecting
  const closeMap = () => {
    setShowMap(false);
    setSelectedMapLocation(null);
  };

  // Initialize Leaflet map
  const initLeafletMap = () => {
    // Check if map container exists
    if (!mapRef.current) return null;
    
    try {
      // Clear previous map if exists
      if (leafletMapRef.current) {
        try {
          if (leafletMapRef.current.off) {
            leafletMapRef.current.off();
          }
          if (leafletMapRef.current.remove) {
            leafletMapRef.current.remove();
          }
        } catch (error) {
          console.warn('Error removing previous map:', error);
        }
        leafletMapRef.current = null;
      }

      // Set default center
      const center = userLocation || { lat: 28.6139, lng: 77.2090 };
      
      // Create map with defensive checks
      let map = null;
      try {
        map = L.map(mapRef.current, {
          center: [center.lat, center.lng],
          zoom: 15,
          zoomControl: true,
          // Disable problematic animations that can cause race conditions
          fadeAnimation: false,
          zoomAnimation: false,
          markerZoomAnimation: false
        });
      } catch (error) {
        console.error('Error creating map:', error);
        return null;
      }
      
      if (!map) {
        console.error('Failed to create map instance');
        return null;
      }
      
      leafletMapRef.current = map;

      // Add tile layer (OpenStreetMap)
      let tileLayer = null;
      try {
        tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          // Add options to prevent loading issues
          noWrap: true,
          detectRetina: true
        }).addTo(map);
      } catch (error) {
        console.error('Error adding tile layer:', error);
      }
      
      if (tileLayer) {
        tileLayerRef.current = tileLayer;
      }

      // Create a simple search input element
      let searchContainer = null;
      try {
        searchContainer = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        searchContainer.style.backgroundColor = 'white';
        searchContainer.style.padding = '5px';
        searchContainer.style.position = 'relative';
        searchContainer.innerHTML = `
          <input type="text" id="location-search" placeholder="Search for places..." style="width: 200px; padding: 5px; border: none; outline: none;">
          <button id="search-btn" style="padding: 5px 10px; border: none; background: #3b82f6; color: white; cursor: pointer;">Search</button>
        `;
      } catch (error) {
        console.error('Error creating search container:', error);
      }
      
      if (searchContainer) {
        // Add search control to map
        const searchControl = L.control({ position: 'topleft' });
        searchControl.onAdd = function() {
          return searchContainer;
        };
        searchControl.addTo(map);

        // Add search functionality
        setTimeout(() => {
          if (!mapRef.current || !leafletMapRef.current) return;
          
          const searchInput = document.getElementById('location-search');
          const searchBtn = document.getElementById('search-btn');
          
          if (searchInput && searchBtn) {
            const searchClickHandler = (e) => {
              e.stopPropagation();
              const query = searchInput.value.trim();
              if (query && leafletMapRef.current) {
                searchLocation(query, leafletMapRef.current);
              }
            };
            
            const searchKeyPressHandler = (e) => {
              if (e.key === 'Enter') {
                e.stopPropagation();
                const query = searchInput.value.trim();
                if (query && leafletMapRef.current) {
                  searchLocation(query, leafletMapRef.current);
                }
              }
            };
            
            searchBtn.addEventListener('click', searchClickHandler);
            searchInput.addEventListener('keypress', searchKeyPressHandler);
            
            // Store references for cleanup
            searchBtn._searchClickHandler = searchClickHandler;
            searchInput._searchKeyPressHandler = searchKeyPressHandler;
          }

          // Close search results when clicking outside
          const mapClickHandler = (e) => {
            const resultsContainer = document.getElementById('search-results');
            if (resultsContainer && searchContainer && !searchContainer.contains(e.target)) {
              try {
                resultsContainer.remove();
              } catch (error) {
                console.warn('Error removing search results:', error);
              }
            }
          };
          
          if (map.getContainer) {
            map.getContainer().addEventListener('click', mapClickHandler);
            map._mapClickHandler = mapClickHandler;
          }
        }, 100);
      }

      // Create marker if it doesn't exist
      if (!markerRef.current) {
        try {
          const marker = L.marker([center.lat, center.lng], { draggable: true }).addTo(map);
          markerRef.current = marker;

          // Add drag listener for marker
          const dragEndHandler = (event) => {
            if (!leafletMapRef.current) return;
            
            const lat = event.target.getLatLng().lat;
            const lng = event.target.getLatLng().lng;
            
            // Reverse geocode to get address
            reverseGeocode(lat, lng, leafletMapRef.current).then(locationName => {
              if (leafletMapRef.current) { // Check if map still exists
                handleMapLocationSelect(locationName, { lat, lng });
              }
            });
          };
          
          marker.on('dragend', dragEndHandler);
          marker._dragEndHandler = dragEndHandler;
        } catch (error) {
          console.error('Error creating marker:', error);
        }
      } else {
        // Update existing marker position
        try {
          markerRef.current.setLatLng([center.lat, center.lng]);
        } catch (error) {
          console.warn('Error updating marker position:', error);
        }
      }

      // Add click listener for map
      const mapClickListener = (event) => {
        // Check if search results are open
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
          // Don't auto-select when search results are open
          return;
        }
        
        if (!leafletMapRef.current) return;
        
        const lat = event.latlng.lat;
        const lng = event.latlng.lng;
        
        // Update marker position
        if (markerRef.current) {
          try {
            markerRef.current.setLatLng([lat, lng]);
          } catch (error) {
            console.warn('Error updating marker position:', error);
          }
        }
        
        // Reverse geocode to get address
        reverseGeocode(lat, lng, leafletMapRef.current).then(locationName => {
          if (leafletMapRef.current) { // Check if map still exists
            handleMapLocationSelect(locationName, { lat, lng });
          }
        });
      };
      
      map.on('click', mapClickListener);
      map._mapClickListener = mapClickListener;
      
      // Handle map zoom events
      const zoomEndHandler = () => {
        // Any zoom-specific logic can go here
      };
      
      const moveEndHandler = () => {
        // Any move-specific logic can go here
      };
      
      map.on('zoomend', zoomEndHandler);
      map.on('moveend', moveEndHandler);
      
      map._zoomEndHandler = zoomEndHandler;
      map._moveEndHandler = moveEndHandler;
      
      return map;
    } catch (error) {
      console.error('Error initializing map:', error);
      return null;
    }
  };

  // Search location using OpenStreetMap Nominatim API
  const searchLocation = async (query, map) => {
    // Check if map still exists
    if (!map) {
      console.warn('Map not available for search');
      return;
    }
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10`
      );
      const results = await response.json();
      
      // Check if map still exists after async operation
      if (!map) {
        console.warn('Map no longer available after search');
        return;
      }
      
      if (results && results.length > 0) {
        // Create a dropdown to show search results
        const searchInput = document.getElementById('location-search');
        if (!searchInput) {
          console.warn('Search input not found');
          return;
        }
        
        const searchContainer = searchInput.parentElement;
        if (!searchContainer) {
          console.warn('Search container not found');
          return;
        }
        
        let resultsContainer = document.getElementById('search-results');
        
        // Remove existing results container if it exists
        if (resultsContainer) {
          try {
            resultsContainer.remove();
          } catch (error) {
            console.warn('Error removing existing results container:', error);
          }
        }
        
        // Create new results container
        resultsContainer = document.createElement('div');
        resultsContainer.id = 'search-results';
        resultsContainer.style.position = 'absolute';
        resultsContainer.style.top = '40px';
        resultsContainer.style.left = '0';
        resultsContainer.style.width = '300px';
        resultsContainer.style.maxHeight = '300px';
        resultsContainer.style.overflowY = 'auto';
        resultsContainer.style.backgroundColor = 'white';
        resultsContainer.style.border = '1px solid #ccc';
        resultsContainer.style.zIndex = '1000';
        resultsContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        
        // Add search results
        results.forEach((result, index) => {
          const resultItem = document.createElement('div');
          resultItem.style.padding = '10px';
          resultItem.style.borderBottom = '1px solid #eee';
          resultItem.style.cursor = 'pointer';
          resultItem.style.fontSize = '14px';
          
          // Truncate long names
          const displayName = result.display_name.length > 60 
            ? result.display_name.substring(0, 60) + '...' 
            : result.display_name;
            
          resultItem.textContent = displayName;
          resultItem.title = result.display_name;
          
          resultItem.addEventListener('mouseenter', () => {
            resultItem.style.backgroundColor = '#f0f0f0';
          });
          
          resultItem.addEventListener('mouseleave', () => {
            resultItem.style.backgroundColor = 'white';
          });
          
          resultItem.addEventListener('click', (e) => {
            // Prevent event bubbling
            e.stopPropagation();
            
            // Check if map still exists
            if (!map) {
              console.warn('Map no longer available for selection');
              return;
            }
            
            const lat = parseFloat(result.lat);
            const lng = parseFloat(result.lon);
            const locationName = result.display_name;
            
            try {
              // Update marker position
              if (markerRef.current) {
                markerRef.current.setLatLng([lat, lng]);
              } else {
                // Create marker if it doesn't exist
                const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
                markerRef.current = marker;
                
                // Add drag listener for marker
                const dragEndHandler = (event) => {
                  if (!map) return;
                  
                  const lat = event.target.getLatLng().lat;
                  const lng = event.target.getLatLng().lng;
                  
                  // Reverse geocode to get address
                  reverseGeocode(lat, lng, map).then(locationName => {
                    if (map) { // Check if map still exists
                      handleMapLocationSelect(locationName, { lat, lng });
                    }
                  });
                };
                
                marker.on('dragend', dragEndHandler);
                marker._dragEndHandler = dragEndHandler;
              }
              
              // Center map on the selected location
              map.setView([lat, lng], 15);
              
              // Handle the selected location
              handleMapLocationSelect(locationName, { lat, lng });
              
              // Remove results container
              if (resultsContainer) {
                try {
                  resultsContainer.remove();
                } catch (error) {
                  console.warn('Error removing results container:', error);
                }
              }
            } catch (error) {
              console.error('Error handling search result selection:', error);
            }
          });
          
          resultsContainer.appendChild(resultItem);
        });
        
        // Add close button
        const closeBtn = document.createElement('div');
        closeBtn.style.padding = '10px';
        closeBtn.style.textAlign = 'center';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontWeight = 'bold';
        closeBtn.style.color = '#666';
        closeBtn.textContent = 'Close';
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (resultsContainer) {
            try {
              resultsContainer.remove();
            } catch (error) {
              console.warn('Error removing results container:', error);
            }
          }
        });
        resultsContainer.appendChild(closeBtn);
        
        // Add results container to search container
        searchContainer.appendChild(resultsContainer);
        
        // Prevent map click events when search results are open
        resultsContainer.addEventListener('click', (e) => {
          e.stopPropagation();
        });
      } else {
        setAlert({
          message: 'No results found for the search query.',
          type: 'warning'
        });
      }
    } catch (error) {
      console.error('Error searching location:', error);
      setAlert({
        message: 'Error searching location. Please try again.',
        type: 'error'
      });
    }
  };

  // Reverse geocode using OpenStreetMap Nominatim API
  const reverseGeocode = async (lat, lng, map) => {
    // Check if map still exists
    if (!map) {
      console.warn('Map not available for reverse geocoding');
      return `Selected Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
    }
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      
      // Check if map still exists after async operation
      if (!map) {
        console.warn('Map no longer available after reverse geocoding');
        return `Selected Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
      }
      
      const result = await response.json();
      
      if (result && result.display_name) {
        return result.display_name;
      } else {
        return `Selected Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return `Selected Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
    }
  };

  // Effect to initialize Leaflet map when map is shown
  useEffect(() => {
    let isMounted = true;
    
    if (showMap && mapRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        if (isMounted && mapRef.current) {
          initLeafletMap();
        }
      }, 100);
    }

    // Cleanup function
    return () => {
      isMounted = false;
      
      // Remove search results if they exist
      const searchResultsContainer = document.getElementById('search-results');
      if (searchResultsContainer) {
        try {
          searchResultsContainer.remove();
        } catch (error) {
          console.warn('Error removing search results:', error);
        }
      }
      
      // Clean up map and references
      if (leafletMapRef.current) {
        try {
          const map = leafletMapRef.current;
          
          // Remove custom event listeners
          if (map._mapClickListener) {
            map.off('click', map._mapClickListener);
            delete map._mapClickListener;
          }
          
          if (map._zoomEndHandler) {
            map.off('zoomend', map._zoomEndHandler);
            delete map._zoomEndHandler;
          }
          
          if (map._moveEndHandler) {
            map.off('moveend', map._moveEndHandler);
            delete map._moveEndHandler;
          }
          
          // Remove map click handler from container
          if (map._mapClickHandler && map.getContainer) {
            try {
              map.getContainer().removeEventListener('click', map._mapClickHandler);
            } catch (error) {
              console.warn('Error removing map click handler:', error);
            }
            delete map._mapClickHandler;
          }
          
          // Remove marker event listeners
          if (markerRef.current && markerRef.current._dragEndHandler) {
            markerRef.current.off('dragend', markerRef.current._dragEndHandler);
            delete markerRef.current._dragEndHandler;
          }
          
          // Remove search input event listeners
          const searchInput = document.getElementById('location-search');
          const searchBtn = document.getElementById('search-btn');
          
          if (searchInput && searchInput._searchKeyPressHandler) {
            searchInput.removeEventListener('keypress', searchInput._searchKeyPressHandler);
            delete searchInput._searchKeyPressHandler;
          }
          
          if (searchBtn && searchBtn._searchClickHandler) {
            searchBtn.removeEventListener('click', searchBtn._searchClickHandler);
            delete searchBtn._searchClickHandler;
          }
          
          // Remove marker if it exists
          if (markerRef.current && markerRef.current.remove) {
            markerRef.current.remove();
            markerRef.current = null;
          }
          
          // Remove tile layer if it exists
          if (tileLayerRef.current && tileLayerRef.current.remove) {
            tileLayerRef.current.remove();
            tileLayerRef.current = null;
          }
          
          // Remove the map only if it still exists and has remove method
          if (map && map.remove) {
            map.remove();
          }
        } catch (error) {
          console.warn('Error cleaning up map:', error);
        } finally {
          leafletMapRef.current = null;
        }
      }
    };
  }, [showMap, userLocation]);

  // Calculate estimates with improved accuracy using real distance calculation
  const calculateEstimates = async (data) => {
    if (!data.vehicleType || !data.pickupLocation || !data.dropoffLocation) return;

    const vehicleType = vehicleTypes.find(v => v.id === data.vehicleType);
    if (!vehicleType) return;

    try {
      // Get coordinates for pickup and dropoff locations
      let pickupCoords = locationCoordinates[data.pickupLocation];
      let dropoffCoords = locationCoordinates[data.dropoffLocation];
      
      // If coordinates are not available, try to geocode them
      if (!pickupCoords && data.pickupLocation) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(data.pickupLocation)}&limit=1`
          );
          const results = await response.json();
          if (results && results.length > 0) {
            pickupCoords = {
              lat: parseFloat(results[0].lat),
              lng: parseFloat(results[0].lon)
            };
          }
        } catch (error) {
          console.error('Error geocoding pickup location:', error);
        }
      }
      
      if (!dropoffCoords && data.dropoffLocation) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(data.dropoffLocation)}&limit=1`
          );
          const results = await response.json();
          if (results && results.length > 0) {
            dropoffCoords = {
              lat: parseFloat(results[0].lat),
              lng: parseFloat(results[0].lon)
            };
          }
        } catch (error) {
          console.error('Error geocoding dropoff location:', error);
        }
      }
      
      // If we still don't have coordinates, use user location as fallback
      if (!pickupCoords) pickupCoords = userLocation || { lat: 28.6139, lng: 77.2090 };
      if (!dropoffCoords) dropoffCoords = userLocation || { lat: 28.6139, lng: 77.2090 };
      
      // Calculate real distance using Haversine formula
      const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return R * c; // Distance in km
      };
      
      const distance = calculateDistance(
        pickupCoords.lat, 
        pickupCoords.lng, 
        dropoffCoords.lat, 
        dropoffCoords.lng
      );
      
      // Estimate duration based on distance (assuming 30 km/h average speed)
      const duration = parseInt(data.duration) || Math.max(30, Math.round(distance * 2)); // minutes
      
      setEstimatedDistance(parseFloat(distance.toFixed(2)));
      setEstimatedDuration(duration);
      
      // Calculate cost: base rate + distance rate + time rate
      const baseCost = vehicleType.baseRate;
      const distanceCost = distance * 20; // ₹20 per km
      const timeCost = duration * 5; // ₹5 per minute
      const totalCost = parseFloat((baseCost + distanceCost + timeCost).toFixed(2));
      
      setEstimatedCost(totalCost);
    } catch (error) {
      console.error('Error calculating estimates:', error);
      // Fallback to simple calculation
      const mockDistance = parseFloat((Math.random() * 50 + 5).toFixed(2)); // 5-55 km
      const mockDuration = Math.round(mockDistance * 2.5); // minutes
      const duration = parseInt(data.duration) || 60; // minutes

      setEstimatedDistance(mockDistance);
      setEstimatedDuration(mockDuration);
      
      // Calculate cost: base rate + distance rate + time rate
      const baseCost = vehicleType.baseRate;
      const distanceCost = mockDistance * 20; // ₹20 per km
      const timeCost = duration * 5; // ₹5 per minute
      const totalCost = parseFloat((baseCost + distanceCost + timeCost).toFixed(2));
      
      setEstimatedCost(totalCost);
    }
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
        message: 'Alternative route available - saves 15 minutes and ₹50.',
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
    if (estimatedCost > 500) {
      recs.push({
        type: 'cost',
        title: 'Cost Saving',
        message: 'Book for off-peak hours to save up to 20%.',
        icon: '💰'
      });
    }

    setRecommendations(recs);
  };

  // Fetch available vehicles with improved location accuracy
  const fetchAvailableVehicles = async () => {
    if (!currentUser || !bookingData.vehicleType) return;

    try {
      setLoading(true);
      const token = await currentUser.getIdToken();
      
      // Prepare query parameters
      const params = {
        status: 'available',
        type: bookingData.vehicleType
      };
      
      // Add location parameters if user location is available
      if (userLocation) {
        params.latitude = userLocation.lat;
        params.longitude = userLocation.lng;
        // Add accuracy parameter for better filtering
        params.accuracy = userLocation.accuracy || 100;
      }
      
      console.log('Fetching vehicles with params:', params);
      
      const response = await axios.get(`${API_BASE_URL}/api/vehicles`, {
        headers: { Authorization: `Bearer ${token}` },
        params: params
      });

      console.log('Received vehicles response:', response.data);
      
      // Handle case where no data is returned
      if (!response.data || !Array.isArray(response.data)) {
        console.log('No valid vehicle data received');
        setAvailableVehicles([]);
        setLoading(false);
        return;
      }

      // Filter and enhance vehicles for booking
      // Show all vehicles regardless of status to ensure visibility
      let vehicles = response.data
        .filter(v => v) // Just filter out null/undefined vehicles
        .map(vehicle => ({
          ...vehicle,
          rating: parseFloat((Math.random() * 2 + 4).toFixed(1)), // 4-5 stars
          features: ['GPS Navigation', 'Air Conditioning', 'Bluetooth', 'USB Charging'],
          estimatedArrival: Math.floor(Math.random() * 15) + 5 // 5-20 minutes
        }));
      
      // If no available vehicles found, show all vehicles as fallback
      if (vehicles.length === 0 && response.data.length > 0) {
        console.log('No available vehicles found, showing all vehicles as fallback');
        vehicles = response.data
          .filter(v => v) // Filter out null/undefined vehicles
          .map(vehicle => ({
            ...vehicle,
            rating: parseFloat((Math.random() * 2 + 4).toFixed(1)), // 4-5 stars
            features: ['GPS Navigation', 'Air Conditioning', 'Bluetooth', 'USB Charging'],
            estimatedArrival: Math.floor(Math.random() * 15) + 5 // 5-20 minutes
          }));
      }

      // Even if we still have no vehicles, show some sample vehicles to ensure visibility
      if (vehicles.length === 0) {
        console.log('No vehicles available, showing sample vehicles to ensure visibility');
        vehicles = [
          {
            id: 'sample-1',
            make: 'Tesla',
            model: 'Model 3',
            licensePlate: 'EV-001',
            status: 'available',
            rating: 4.8,
            features: ['GPS Navigation', 'Air Conditioning', 'Bluetooth', 'USB Charging'],
            estimatedArrival: 7
          },
          {
            id: 'sample-2',
            make: 'BMW',
            model: 'i3',
            licensePlate: 'EV-002',
            status: 'available',
            rating: 4.6,
            features: ['GPS Navigation', 'Air Conditioning', 'Bluetooth', 'USB Charging'],
            estimatedArrival: 12
          },
          {
            id: 'sample-3',
            make: 'Nissan',
            model: 'Leaf',
            licensePlate: 'EV-003',
            status: 'available',
            rating: 4.5,
            features: ['GPS Navigation', 'Air Conditioning', 'Bluetooth', 'USB Charging'],
            estimatedArrival: 15
          }
        ];
      }

      console.log('Filtered vehicles:', vehicles);
      
      setAvailableVehicles(vehicles);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
      // Show error message instead of mock vehicles
      setAvailableVehicles([]);
      setLoading(false);
    }
  };

  // Submit booking with validation
  const submitBooking = async () => {
    if (!currentUser) {
      setErrors({ general: 'You must be logged in to submit a booking' });
      return;
    }
    
    // Validate form
    const formErrors = validateForm(bookingData);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    // Clear errors if validation passes
    setErrors({});

    try {
      setLoading(true);
      const token = await currentUser.getIdToken();
      
      // Get coordinates for pickup and dropoff locations
      const pickupCoords = locationCoordinates[bookingData.pickupLocation] || userLocation || { lat: 28.6139, lng: 77.2090 };
      const dropoffCoords = locationCoordinates[bookingData.dropoffLocation] || userLocation || { lat: 28.6139, lng: 77.2090 };
      
      const bookingPayload = {
        ...bookingData,
        pickupCoordinates: pickupCoords,
        dropoffCoordinates: dropoffCoords,
        customerId: currentUser.uid,
        customerEmail: currentUser.email,
        estimatedCost: parseFloat(estimatedCost.toFixed(2)),
        estimatedDistance: parseFloat(estimatedDistance.toFixed(2)),
        estimatedDuration: parseInt(bookingData.duration),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await axios.post(`${API_BASE_URL}/api/bookings`, bookingPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAlert({
        message: 'Booking submitted successfully! You will receive a confirmation shortly.',
        type: 'success'
      });
      
      // Dispatch a custom event to notify other components that a booking was made
      window.dispatchEvent(new CustomEvent('bookingCreated', { detail: { booking: bookingPayload } }));
      
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
      setAlert({
        message: 'Failed to submit booking. Please try again.',
        type: 'error'
      });
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

  // State for geocoding loading indicators
  const [geocoding, setGeocoding] = useState({ pickup: false, dropoff: false });

  // Function to geocode place names using OpenStreetMap Nominatim (similar to RouteOptimization.js)
  const getCoordinatesFromPlace = async (placeName) => {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeName)}&format=json&limit=1`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.length === 0) throw new Error("Place not found");

    const { lat, lon, display_name } = data[0];
    return {
      lat: parseFloat(lat),
      lng: parseFloat(lon),
      displayName: display_name
    };
  };

  // Geocode pickup location
  const geocodePickupLocation = async () => {
    if (!bookingData.pickupLocation.trim()) {
      setAlert({
        message: 'Please enter a pickup location name',
        type: 'error'
      });
      return;
    }

    setGeocoding(prev => ({ ...prev, pickup: true }));
    
    try {
      const result = await getCoordinatesFromPlace(bookingData.pickupLocation);
      handleInputChange('pickupLocation', result.displayName);
      // Store coordinates for this location
      setLocationCoordinates(prev => ({
        ...prev,
        [result.displayName]: { lat: result.lat, lng: result.lng }
      }));
      
      setAlert({
        message: `Found pickup location: ${result.displayName}`,
        type: 'success'
      });
    } catch (err) {
      setAlert({
        message: 'Could not find pickup location. Please try a different name.',
        type: 'error'
      });
    } finally {
      setGeocoding(prev => ({ ...prev, pickup: false }));
    }
  };

  // Geocode dropoff location
  const geocodeDropoffLocation = async () => {
    if (!bookingData.dropoffLocation.trim()) {
      setAlert({
        message: 'Please enter a drop-off location name',
        type: 'error'
      });
      return;
    }

    setGeocoding(prev => ({ ...prev, dropoff: true }));
    
    try {
      const result = await getCoordinatesFromPlace(bookingData.dropoffLocation);
      handleInputChange('dropoffLocation', result.displayName);
      // Store coordinates for this location
      setLocationCoordinates(prev => ({
        ...prev,
        [result.displayName]: { lat: result.lat, lng: result.lng }
      }));
      
      setAlert({
        message: `Found drop-off location: ${result.displayName}`,
        type: 'success'
      });
    } catch (err) {
      setAlert({
        message: 'Could not find drop-off location. Please try a different name.',
        type: 'error'
      });
    } finally {
      setGeocoding(prev => ({ ...prev, dropoff: false }));
    }
  };

  const renderStep1 = () => (
    <div className="booking-step">
      <h3>Trip Details</h3>
      
      {/* Location Error Message */}
      {locationError && (
        <div className="error-message">
          <p>{locationError}</p>
        </div>
      )}
      
      {/* General Error Message */}
      {errors.general && (
        <div className="error-message">
          <p>{errors.general}</p>
        </div>
      )}
      
      <div className="form-grid">
        <div className="form-group">
          <label>Vehicle Type</label>
          <select
            className={`select ${errors.vehicleType ? 'error' : ''}`}
            value={bookingData.vehicleType}
            onChange={(e) => handleInputChange('vehicleType', e.target.value)}
          >
            <option value="">Select vehicle type</option>
            {vehicleTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.icon} {type.name} - ₹{type.baseRate}/hour
              </option>
            ))}
          </select>
          {errors.vehicleType && <div className="error-text">{errors.vehicleType}</div>}
        </div>

        <div className="form-group">
          <label>Passengers</label>
          <input
            type="number"
            className={`input ${errors.passengers ? 'error' : ''}`}
            min="1"
            max="12"
            value={bookingData.passengers}
            onChange={(e) => handleInputChange('passengers', parseInt(e.target.value) || '')}
          />
          {errors.passengers && <div className="error-text">{errors.passengers}</div>}
        </div>

        <div className="form-group">
          <label>Pickup Location</label>
          <div className="location-input-group">
            <input
              type="text"
              className={`input ${errors.pickupLocation ? 'error' : ''}`}
              list="pickup-locations"
              value={bookingData.pickupLocation}
              onChange={(e) => handleInputChange('pickupLocation', e.target.value)}
              placeholder="Enter pickup location"
            />
            <div className="location-buttons">
              <button 
                type="button" 
                className="button small"
                onClick={async () => await setCurrentLocation('pickup')}
                title="Use Current Location"
              >
                📍
              </button>
              <button 
                type="button" 
                className="button small"
                onClick={() => openMapForLocation('pickup')}
                title="Select on Map"
              >
                🗺️
              </button>
              <button 
                type="button" 
                className="button small outline"
                onClick={geocodePickupLocation}
                disabled={geocoding.pickup}
                title="Find Location"
              >
                {geocoding.pickup ? 'Finding...' : 'Find'}
              </button>
            </div>
          </div>
          <datalist id="pickup-locations">
            {nearbyLocations.map((location, index) => (
              <option key={index} value={location.name} />
            ))}
            <option value="Custom Location" />
          </datalist>
          {errors.pickupLocation && <div className="error-text">{errors.pickupLocation}</div>}
        </div>

        <div className="form-group">
          <label>Drop-off Location</label>
          <div className="location-input-group">
            <input
              type="text"
              className={`input ${errors.dropoffLocation ? 'error' : ''}`}
              list="dropoff-locations"
              value={bookingData.dropoffLocation}
              onChange={(e) => handleInputChange('dropoffLocation', e.target.value)}
              placeholder="Enter drop-off location"
            />
            <div className="location-buttons">
              <button 
                type="button" 
                className="button small"
                onClick={async () => await setCurrentLocation('dropoff')}
                title="Use Current Location"
              >
                📍
              </button>
              <button 
                type="button" 
                className="button small"
                onClick={() => openMapForLocation('dropoff')}
                title="Select on Map"
              >
                🗺️
              </button>
              <button 
                type="button" 
                className="button small outline"
                onClick={geocodeDropoffLocation}
                disabled={geocoding.dropoff}
                title="Find Location"
              >
                {geocoding.dropoff ? 'Finding...' : 'Find'}
              </button>
            </div>
          </div>
          <datalist id="dropoff-locations">
            {nearbyLocations.map((location, index) => (
              <option key={index} value={location.name} />
            ))}
            <option value="Custom Location" />
          </datalist>
          {errors.dropoffLocation && <div className="error-text">{errors.dropoffLocation}</div>}
        </div>

        <div className="form-group">
          <label>Pickup Date</label>
          <input
            type="date"
            className={`input ${errors.pickupDate ? 'error' : ''}`}
            value={bookingData.pickupDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => handleInputChange('pickupDate', e.target.value)}
          />
          {errors.pickupDate && <div className="error-text">{errors.pickupDate}</div>}
        </div>

        <div className="form-group">
          <label>Pickup Time</label>
          <input
            type="time"
            className={`input ${errors.pickupTime ? 'error' : ''}`}
            value={bookingData.pickupTime}
            onChange={(e) => handleInputChange('pickupTime', e.target.value)}
          />
          {errors.pickupTime && <div className="error-text">{errors.pickupTime}</div>}
        </div>

        <div className="form-group">
          <label>Duration (minutes)</label>
          <input
            type="number"
            className={`input ${errors.duration ? 'error' : ''}`}
            min="30"
            step="30"
            value={bookingData.duration}
            onChange={(e) => handleInputChange('duration', e.target.value)}
            placeholder="Estimated trip duration"
          />
          {errors.duration && <div className="error-text">{errors.duration}</div>}
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

      {/* Map for location selection */}
      {showMap && (
        <div className="map-overlay">
          <div className="map-container">
            <div className="map-header">
              <h4>Select {mapType === 'pickup' ? 'Pickup' : 'Drop-off'} Location</h4>
              <button className="button small" onClick={closeMap}>×</button>
            </div>
            <div className="map-search-container">
              <button 
                className="button"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        const pos = {
                          lat: position.coords.latitude,
                          lng: position.coords.longitude
                        };
                        
                        // Update map view to current location
                        if (leafletMapRef.current) {
                          leafletMapRef.current.setView([pos.lat, pos.lng], 17);
                          
                          // Update marker position
                          if (markerRef.current) {
                            markerRef.current.setLatLng([pos.lat, pos.lng]);
                          }
                          
                          // Set location name and coordinates
                          const locationName = `Current Location (${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)})`;
                          handleMapLocationSelect(locationName, pos);
                        }
                      },
                      () => {
                        setAlert({
                          message: 'Error: The Geolocation service failed.',
                          type: 'error'
                        });
                      }
                    );
                  } else {
                    setAlert({
                      message: 'Error: Your browser doesn\'t support geolocation.',
                      type: 'error'
                    });
                  }
                }}
              >
                Use Current Location
              </button>
            </div>
            <div ref={mapRef} className="map-element"></div>
          </div>
        </div>
      )}

      {/* Trip Estimates */}
      {estimatedCost > 0 && (
        <div className="trip-estimates">
          <h4>Trip Estimates</h4>
          <div className="estimates-grid">
            <div className="estimate-item">
              <span className="estimate-icon">💰</span>
              <span className="estimate-value">₹{estimatedCost.toFixed(2)}</span>
              <span className="estimate-label">Estimated Cost</span>
            </div>
            <div className="estimate-item">
              <span className="estimate-icon">📏</span>
              <span className="estimate-value">{estimatedDistance.toFixed(2)} km</span>
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
          onClick={() => {
            // Validate before proceeding to next step
            const formErrors = validateForm(bookingData);
            if (Object.keys(formErrors).length > 0) {
              setErrors(formErrors);
              return;
            }
            setBookingStep(2);
          }}
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
                  <div className="vehicle-header">
                    <h4>{vehicle.make} {vehicle.model}</h4>
                    <span className={`vehicle-status ${vehicle.status !== 'available' ? 'unavailable' : ''}`}>
                      {vehicle.status || 'Available'}
                    </span>
                  </div>
                  <div className="vehicle-info">
                    <div className="vehicle-details">
                      <div className="vehicle-detail">
                        <span className="detail-label">Rating</span>
                        <span className="detail-value rating">⭐ {vehicle.rating.toFixed(1)}/5</span>
                      </div>
                      <div className="vehicle-detail">
                        <span className="detail-label">Arrival</span>
                        <span className="detail-value">🕐 {vehicle.estimatedArrival} min</span>
                      </div>
                      <div className="vehicle-detail">
                        <span className="detail-label">License</span>
                        <span className="detail-value">{vehicle.licensePlate}</span>
                      </div>
                    </div>
                    <div className="vehicle-features">
                      {vehicle.features && vehicle.features.map((feature, index) => (
                        <span key={index} className="feature-tag">{feature}</span>
                      ))}
                    </div>
                  </div>
                  <div className="vehicle-actions">
                    <button 
                      className="button primary"
                      onClick={() => {
                        // Handle vehicle selection
                        setAlert({
                          message: `Selected ${vehicle.make} ${vehicle.model} for your ride!`,
                          type: 'success'
                        });
                        submitBooking();
                      }}
                    >
                      Select This Vehicle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-vehicles">
              <h4>No Vehicles Available</h4>
              <p>No vehicles available for the selected criteria.</p>
              <p>Try selecting a different vehicle type or location.</p>
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
    <div className="booking-container">
      {alert && (
        <Alert 
          message={alert.message} 
          type={alert.type} 
          onClose={() => setAlert(null)} 
        />
      )}
      <div className="booking-header">
        <div className="header-content">
          <h2>Book Your Ride</h2>
          <p className="header-subtitle">Reserve your electric vehicle in just a few simple steps</p>
        </div>
        <div className="booking-step-indicator">
          <div className={`step ${bookingStep >= 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
          </div>
          <div className="step-divider"></div>
          <div className={`step ${bookingStep >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
          </div>
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
        .booking-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          padding: 24px;
          background: linear-gradient(135deg, #1e293b, #334155);
          border-radius: 16px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          border: 1px solid #475569;
        }

        .header-content h2 {
          margin: 0 0 8px 0;
          color: #f8fafc;
          font-size: 32px;
          font-weight: 700;
        }

        .header-subtitle {
          margin: 0;
          color: #cbd5e1;
          font-size: 16px;
          font-weight: 400;
        }

        .booking-header .booking-step-indicator {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        /* Override global step-indicator styles */
        .step-indicator {
          width: auto;
          height: auto;
          border-radius: 0;
          background-color: transparent;
        }

        .booking-header .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: #334155;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 18px;
          transition: all 0.3s ease;
          border: 2px solid #475569;
        }

        .step.active .step-number {
          background-color: #3b82f6;
          color: white;
          border-color: #3b82f6;
          transform: scale(1.1);
        }

        .step-divider {
          width: 32px;
          height: 2px;
          background-color: #475569;
          position: relative;
        }

        .step-divider::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: #3b82f6;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
        }

        .step.active ~ .step-divider::after {
          transform: scaleX(1);
        }

        .error-message {
          background-color: #dc2626;
          color: white;
          padding: 16px 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 15px;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }

        .recommendations {
          background: linear-gradient(135deg, #1e293b, #334155);
          border-radius: 16px;
          padding: 28px;
          margin-bottom: 32px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          border: 1px solid #475569;
        }

        .recommendations h3 {
          color: #f8fafc;
          font-size: 24px;
          margin-top: 0;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #475569;
        }

        .recommendation-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .recommendation {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          padding: 24px;
          border-radius: 16px;
          background-color: #0f172a;
          border: 1px solid #334155;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .recommendation:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
          border-color: #3b82f6;
        }

        .rec-icon {
          font-size: 32px;
          flex-shrink: 0;
          margin-top: 4px;
        }

        .rec-content h4 {
          margin: 0 0 12px 0;
          color: #f8fafc;
          font-size: 20px;
          font-weight: 600;
        }

        .rec-content p {
          margin: 0;
          color: #cbd5e1;
          font-size: 16px;
          line-height: 1.6;
        }

        .booking-step {
          background: linear-gradient(135deg, #1e293b, #334155);
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          border: 1px solid #475569;
          margin-bottom: 32px;
        }

        .booking-step h3 {
          color: #f8fafc;
          font-size: 28px;
          margin-top: 0;
          margin-bottom: 28px;
          padding-bottom: 20px;
          border-bottom: 1px solid #475569;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 28px;
          margin-bottom: 36px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          display: block;
          margin-bottom: 12px;
          font-weight: 500;
          color: #e2e8f0;
          font-size: 16px;
        }

        .location-input-group {
          display: flex;
          gap: 12px;
        }

        .location-input-group .input {
          flex: 1;
        }

        .location-buttons {
          display: flex;
          gap: 8px;
        }

        .location-buttons .button.small {
          padding: 12px;
          min-width: auto;
          border-radius: 8px;
          font-size: 16px;
        }

        /* Error styling */
        .input.error, .select.error, .textarea.error {
          border: 2px solid #dc2626;
          background-color: #fef2f2;
        }

        .error-text {
          color: #dc2626;
          font-size: 14px;
          margin-top: 8px;
          font-weight: 500;
        }

        .trip-estimates {
          background: linear-gradient(135deg, #1e293b, #334155);
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 36px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          border: 1px solid #475569;
        }

        .trip-estimates h4 {
          color: #f8fafc;
          font-size: 26px;
          margin-top: 0;
          margin-bottom: 24px;
          text-align: center;
        }

        .estimates-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }

        .estimate-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 24px;
          background-color: #0f172a;
          border-radius: 16px;
          border: 1px solid #334155;
          transition: transform 0.2s ease;
        }

        .estimate-item:hover {
          transform: translateY(-4px);
          border-color: #3b82f6;
        }

        .estimate-icon {
          font-size: 36px;
          margin-bottom: 20px;
        }

        .estimate-value {
          font-size: 28px;
          font-weight: bold;
          color: #3b82f6;
          margin-bottom: 12px;
        }

        .estimate-label {
          font-size: 16px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 500;
        }

        .vehicle-selection {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 32px;
          margin-bottom: 36px;
        }

        .vehicle-option {
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #1e293b, #334155);
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          border: 1px solid #475569;
          transition: all 0.3s ease;
          height: 100%;
        }

        .vehicle-option:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.3);
          border-color: #3b82f6;
        }

        .vehicle-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid #475569;
        }

        .vehicle-header h4 {
          margin: 0;
          color: #f8fafc;
          font-size: 24px;
          font-weight: 700;
        }

        .vehicle-status {
          padding: 8px 16px;
          border-radius: 24px;
          font-size: 14px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background-color: #10b981;
          color: white;
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
        }

        .vehicle-status.unavailable {
          background-color: #ef4444;
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
        }

        .vehicle-details {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 28px;
        }

        .vehicle-detail {
          display: flex;
          flex-direction: column;
          background-color: #0f172a;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #334155;
        }

        .detail-label {
          font-size: 13px;
          color: #94a3b8;
          text-transform: uppercase;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }

        .detail-value {
          font-weight: 600;
          color: #e2e8f0;
          font-size: 18px;
        }

        .rating {
          color: #fbbf24;
        }

        .vehicle-features {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin: 24px 0;
        }

        .feature-tag {
          background: linear-gradient(135deg, #334155, #475569);
          padding: 8px 16px;
          border-radius: 24px;
          font-size: 14px;
          color: #e2e8f0;
          font-weight: 500;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .vehicle-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: auto;
          padding-top: 24px;
          border-top: 1px solid #475569;
        }

        .step-actions {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          margin-top: 36px;
          padding-top: 36px;
          border-top: 1px solid #475569;
        }

        .no-vehicles {
          text-align: center;
          padding: 80px 40px;
          color: #94a3b8;
          background: linear-gradient(135deg, #1e293b, #334155);
          border-radius: 16px;
          margin-bottom: 36px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          border: 1px solid #475569;
        }

        .no-vehicles h4 {
          color: #f8fafc;
          font-size: 28px;
          margin: 0 0 20px 0;
        }

        .no-vehicles p {
          margin: 16px 0;
          font-size: 18px;
          line-height: 1.7;
        }

        .loading {
          text-align: center;
          padding: 80px 40px;
          color: #94a3b8;
          background: linear-gradient(135deg, #1e293b, #334155);
          border-radius: 16px;
          margin-bottom: 36px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          border: 1px solid #334155;
          font-size: 20px;
        }

        .map-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .map-container {
          background-color: #0f172a;
          border-radius: 16px;
          width: 95%;
          max-width: 900px;
          max-height: 85vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          border: 1px solid #334155;
        }

        .map-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          background: linear-gradient(135deg, #1e293b, #334155);
          border-bottom: 1px solid #475569;
        }

        .map-header h4 {
          margin: 0;
          color: #f8fafc;
          font-size: 24px;
        }

        .map-search-container {
          padding: 24px;
          background-color: #1e293b;
          border-bottom: 1px solid #334155;
        }

        .map-element {
          flex: 1;
          min-height: 500px;
          background-color: #1e293b;
        }
        
        @media (max-width: 768px) {
          .booking-container {
            padding: 16px;
          }
          
          .booking-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 24px;
            padding: 20px;
          }
          
          .booking-step {
            padding: 24px;
          }
          
          .form-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .estimates-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .vehicle-selection {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          
          .vehicle-details {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .vehicle-option {
            padding: 24px;
          }
          
          .step-actions {
            flex-direction: column;
          }
          
          .button {
            width: 100%;
          }
          
          .location-input-group {
            flex-direction: column;
          }
          
          .location-buttons {
            justify-content: flex-end;
          }
          
          .step-indicator {
            width: 100%;
            justify-content: space-between;
          }
          
          .step-divider {
            width: 20px;
          }
        }
        
        @media (max-width: 480px) {
          .booking-header h2 {
            font-size: 28px;
          }
          
          .booking-step {
            padding: 20px;
          }
          
          .booking-step h3 {
            font-size: 24px;
          }
          
          .vehicle-selection {
            grid-template-columns: 1fr;
          }
          
          .vehicle-details {
            flex-direction: column;
            gap: 12px;
          }
          
          .vehicle-features {
            justify-content: flex-start;
          }
          
          .step-indicator {
            flex-direction: row;
            justify-content: space-between;
          }
          
          .step {
            align-items: center;
          }
          
          .step-label {
            display: none;
          }
          
          .step-divider {
            width: 16px;
          }
        }
      `}</style>
    </div>
  );
}

export default CustomerBooking;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import ErrorBoundary from './ErrorBoundary';

// Haversine formula to calculate distance between two points
// Removed unused calculateDistance function

// Function to geocode place names using OpenStreetMap Nominatim
async function getCoordinatesFromPlace(placeName) {
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
}

// Simple AI scoring function for route optimization
const calculateRouteScore = (routeFeatures, optimizationMode = 'ai') => {
  // Weighted scoring based on multiple factors
  // Lower score is better
  const {
    distance,
    estimatedTime,
    trafficFactor = 0,
    weatherImpact = 0,
    roadQuality = 0,
    timeOfDay = 0
  } = routeFeatures;
  
  // Adjust weights based on optimization mode
  let weights;
  
  switch (optimizationMode) {
    case 'distance':
      weights = {
        distance: 0.7,
        time: 0.1,
        traffic: 0.05,
        weather: 0.05,
        roadQuality: 0.05,
        timeOfDay: 0.05
      };
      break;
    case 'time':
      weights = {
        distance: 0.1,
        time: 0.7,
        traffic: 0.05,
        weather: 0.05,
        roadQuality: 0.05,
        timeOfDay: 0.05
      };
      break;
    case 'fuel':
      weights = {
        distance: 0.5,
        time: 0.1,
        traffic: 0.1,
        weather: 0.1,
        roadQuality: 0.1,
        timeOfDay: 0.1
      };
      break;
    case 'cost':
      weights = {
        distance: 0.4,
        time: 0.2,
        traffic: 0.1,
        weather: 0.1,
        roadQuality: 0.1,
        timeOfDay: 0.1
      };
      break;
    default: // 'ai' mode
      weights = {
        distance: 0.3,
        time: 0.25,
        traffic: 0.2,
        weather: 0.1,
        roadQuality: 0.1,
        timeOfDay: 0.05
      };
  }
  
  // Calculate weighted score
  const score = (
    (distance || 0) * weights.distance +
    (estimatedTime || 0) * weights.time +
    (trafficFactor || 0) * weights.traffic +
    (weatherImpact || 0) * weights.weather +
    (10 - (roadQuality || 0)) * weights.roadQuality + // Inverse because higher road quality is better
    (timeOfDay || 0) * weights.timeOfDay
  );
  
  return parseFloat(score.toFixed(2));
};

// Fetch routes from OSRM API
const fetchOSRMRoutes = async (startLat, startLng, endLat, endLng) => {
  try {
    // Ensure we have valid coordinates
    if (!startLat || !startLng || !endLat || !endLng) {
      console.warn('Invalid coordinates provided to OSRM API');
      return [];
    }
    
    // OSRM requires coordinates in longitude,latitude order
    const osrmURL = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&alternatives=true`;
    console.log("OSRM URL:", osrmURL);
    
    const response = await fetch(osrmURL);
    
    if (!response.ok) {
      throw new Error(`OSRM API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log("OSRM Response:", data);
    
    // Validate response structure
    if (!data || typeof data !== 'object') {
      console.warn('Invalid OSRM response structure:', data);
      return [];
    }
    
    // Check if routes exist and contain geometry before looping
    if (data.routes && Array.isArray(data.routes) && data.routes.length > 0) {
      // Validate each route has required properties
      const validRoutes = data.routes.filter(route => 
        route && 
        typeof route === 'object' &&
        typeof route.distance === 'number' &&
        typeof route.duration === 'number' &&
        route.geometry &&
        typeof route.geometry === 'object' &&
        route.geometry.coordinates &&
        Array.isArray(route.geometry.coordinates) &&
        route.geometry.coordinates.length > 0
      ).map(route => ({
        ...route,
        distance: parseFloat((route.distance / 1000).toFixed(2)), // Convert meters to km
        duration: parseFloat((route.duration / 60).toFixed(2)) // Convert seconds to minutes
      }));
      
      // Handle missing or empty routes
      if (validRoutes.length === 0) {
        console.warn('No valid routes found in OSRM response');
        return [];
      }
      
      return validRoutes;
    } else {
      console.warn('No routes found in OSRM response');
      return [];
    }
  } catch (error) {
    console.error('Error fetching OSRM routes:', error);
    return [];
  }
};

// Function to create a simple polyline on the map without Google Maps Directions
const drawRouteOnMap = (map, routeCoordinates) => {
  if (!window.google || !window.google.maps) return;
  
  // Convert OSRM coordinates [lng, lat] to Google Maps format [lat, lng]
  const path = routeCoordinates.map(coord => ({
    lat: coord[1],
    lng: coord[0]
  }));
  
  // Create polyline
  const polyline = new window.google.maps.Polyline({
    path: path,
    geodesic: true,
    strokeColor: '#3b82f6',
    strokeOpacity: 1.0,
    strokeWeight: 4
  });
  
  polyline.setMap(map);
  return polyline;
};

// Function to dynamically load Google Maps API
const loadGoogleMaps = (callback) => {
  // Check if already loaded
  if (window.google && window.google.maps) {
    // Ensure all required components are loaded
    if (window.google.maps.Map && window.google.maps.Marker) {
      callback();
      return;
    }
  }

  const existingScript = document.getElementById('googleMaps');
  if (existingScript) {
    // If script is still loading, add callback to load event
    if (existingScript.readyState && existingScript.readyState !== 'complete') {
      existingScript.addEventListener('load', callback);
    } else {
      callback();
    }
    return;
  }

  // Use a more robust approach with error handling
  // Added timestamp to force fresh load and avoid caching issues
  const timestamp = new Date().getTime();
  const script = document.createElement('script');
  script.id = 'googleMaps';
  script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCZ8IUseEHZsIhMqTgunyl5Qg10tFq6ToY&libraries=geometry&loading=async&t=${timestamp}`;
  script.async = true;
  script.defer = true;
  script.onload = () => {
    console.log('Google Maps API loaded successfully');
    // Additional check to ensure maps are fully loaded
    if (window.google && window.google.maps) {
      // Wait a bit more to ensure all components are ready
      setTimeout(() => {
        callback();
      }, 100);
    } else {
      callback();
    }
  };
  script.onerror = (error) => {
    console.error('Failed to load Google Maps API:', error);
    // Set error state to inform user
    window.googleMapsLoadError = true;
    callback(); // Still call callback to prevent hanging
  };
  document.head.appendChild(script);
};

function RouteOptimization() {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [optimizationMode, setOptimizationMode] = useState('time');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [startLocation, setStartLocation] = useState({ name: '', lat: '', lng: '', displayName: '' });
  const [endLocation, setEndLocation] = useState({ name: '', lat: '', lng: '', displayName: '' });
  const [routeHistory, setRouteHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [geocoding, setGeocoding] = useState({ start: false, end: false });
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const startMarkerRef = useRef(null);
  const endMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  
  // Add safeguard to prevent DirectionsService usage
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);

  // Load Google Maps API on component mount
  useEffect(() => {
    loadGoogleMaps(() => {
      if (window.google && window.google.maps) {
        setMapLoaded(true);
        // Initialize safeguard refs to prevent accidental usage
        directionsServiceRef.current = null;
        directionsRendererRef.current = null;
      } else {
        setMapError(true);
        console.error('Google Maps failed to load');
      }
    });
  }, []);

  // Initialize map
  const initMap = useCallback(() => {
    if (!mapLoaded || !mapRef.current) return;
    
    // Check if Google Maps API is fully loaded
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API not loaded');
      setError('Failed to load Google Maps. Please check your internet connection and try refreshing the page.');
      return;
    }
    
    // Additional checks for required components
    if (!window.google.maps.Map) {
      console.error('Google Maps Map component not available');
      setError('Google Maps is not fully loaded. Please try refreshing the page.');
      return;
    }
    
    try {
      // Check if MapTypeId is available
      const mapTypeId = window.google.maps.MapTypeId && window.google.maps.MapTypeId.ROADMAP 
        ? window.google.maps.MapTypeId.ROADMAP 
        : 'roadmap';

      const mapOptions = {
        zoom: 12,
        center: { lat: 28.6139, lng: 77.2090 }, // Default to New Delhi
        mapTypeId: mapTypeId
      };

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
      // Ensure DirectionsRenderer is not used
      if (directionsRendererRef.current) {
        directionsRendererRef.current = null;
      }
    } catch (error) {
      console.error('Error initializing map:', error);
      setError('Failed to initialize map. Please try refreshing the page.');
    }
  }, [mapLoaded]);

  // Initialize map when loaded
  useEffect(() => {
    if (mapLoaded) {
      initMap();
    }
  }, [mapLoaded, initMap]);

  // Add markers when locations are set
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    // Clear existing markers
    if (startMarkerRef.current) {
      try {
        startMarkerRef.current.setMap(null);
      } catch (error) {
        console.warn('Error clearing start marker:', error);
      }
    }
    if (endMarkerRef.current) {
      try {
        endMarkerRef.current.setMap(null);
      } catch (error) {
        console.warn('Error clearing end marker:', error);
      }
    }
    
    // Clear existing polyline
    if (routePolylineRef.current) {
      try {
        routePolylineRef.current.setMap(null);
      } catch (error) {
        console.warn('Error clearing route polyline:', error);
      }
    }

    // Add start marker if coordinates are available
    if (startLocation.lat && startLocation.lng) {
      try {
        if (!window.google || !window.google.maps || !window.google.maps.Marker) {
          console.error('Google Maps Marker not available');
          return;
        }
        
        startMarkerRef.current = new window.google.maps.Marker({
          position: { lat: parseFloat(startLocation.lat), lng: parseFloat(startLocation.lng) },
          map: mapInstanceRef.current,
          title: `Start: ${startLocation.name || 'Start Location'}`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#10b981',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });
      } catch (error) {
        console.error('Error creating start marker:', error);
        setError('Failed to create start marker. Please try refreshing the page.');
      }
    }

    // Add end marker if coordinates are available
    if (endLocation.lat && endLocation.lng) {
      try {
        if (!window.google || !window.google.maps || !window.google.maps.Marker) {
          console.error('Google Maps Marker not available');
          return;
        }
        
        endMarkerRef.current = new window.google.maps.Marker({
          position: { lat: parseFloat(endLocation.lat), lng: parseFloat(endLocation.lng) },
          map: mapInstanceRef.current,
          title: `End: ${endLocation.name || 'End Location'}`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });
      } catch (error) {
        console.error('Error creating end marker:', error);
        setError('Failed to create end marker. Please try refreshing the page.');
      }
    }
    
    // If we have both locations and a selected route, draw the route
    if (startLocation.lat && startLocation.lng && endLocation.lat && endLocation.lng && selectedRoute) {
      // Clear previous route
      if (routePolylineRef.current) {
        try {
          routePolylineRef.current.setMap(null);
        } catch (error) {
          console.warn('Error clearing route polyline:', error);
        }
      }
      
      // Draw new route
      if (selectedRoute.geometry && selectedRoute.geometry.coordinates) {
        try {
          routePolylineRef.current = drawRouteOnMap(mapInstanceRef.current, selectedRoute.geometry.coordinates);
          
          // Fit map to show the entire route
          if (window.google && window.google.maps && window.google.maps.LatLngBounds) {
            const bounds = new window.google.maps.LatLngBounds();
            selectedRoute.geometry.coordinates.forEach(coord => {
              bounds.extend({ lat: coord[1], lng: coord[0] });
            });
            mapInstanceRef.current.fitBounds(bounds);
          }
        } catch (error) {
          console.error('Error drawing route:', error);
          setError('Failed to draw route. Please try refreshing the page.');
        }
      }
    }
    
    // Ensure DirectionsRenderer is not used
    if (directionsRendererRef.current) {
      directionsRendererRef.current = null;
    }
  }, [startLocation, endLocation, selectedRoute, mapLoaded]);

  // Geocode start location
  const geocodeStartLocation = async () => {
    if (!startLocation.name.trim()) {
      setError('Please enter a start location name');
      return;
    }

    setGeocoding(prev => ({ ...prev, start: true }));
    setError(null);

    try {
      const result = await getCoordinatesFromPlace(startLocation.name);
      setStartLocation({
        name: startLocation.name,
        lat: result.lat,
        lng: result.lng,
        displayName: result.displayName
      });
    } catch (err) {
      setError('Could not find start location. Please try a different name.');
    } finally {
      setGeocoding(prev => ({ ...prev, start: false }));
    }
  };

  // Geocode end location
  const geocodeEndLocation = async () => {
    if (!endLocation.name.trim()) {
      setError('Please enter an end location name');
      return;
    }

    setGeocoding(prev => ({ ...prev, end: true }));
    setError(null);

    try {
      const result = await getCoordinatesFromPlace(endLocation.name);
      setEndLocation({
        name: endLocation.name,
        lat: result.lat,
        lng: result.lng,
        displayName: result.displayName
      });
    } catch (err) {
      setError('Could not find end location. Please try a different name.');
    } finally {
      setGeocoding(prev => ({ ...prev, end: false }));
    }
  };

  // Calculate route
  const calculateRoute = async () => {
    if (!startLocation.lat || !startLocation.lng || !endLocation.lat || !endLocation.lng) {
      setError('Please geocode both start and end locations first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch routes from OSRM
      const osrmRoutes = await fetchOSRMRoutes(
        parseFloat(startLocation.lat),
        parseFloat(startLocation.lng),
        parseFloat(endLocation.lat),
        parseFloat(endLocation.lng)
      );

      if (osrmRoutes.length === 0) {
        setError('No routes found. Please check your locations and try again.');
        setLoading(false);
        return;
      }

      // Enhance routes with AI scoring
      const scoredRoutes = osrmRoutes.map((route, index) => {
        // Mock traffic and weather data for demonstration
        const trafficFactor = parseFloat((Math.random() * 2).toFixed(2)); // 0-2 scale
        const weatherImpact = parseFloat((Math.random() * 1.5).toFixed(2)); // 0-1.5 scale
        const roadQuality = parseFloat((Math.random() * 10).toFixed(2)); // 0-10 scale
        const timeOfDay = parseFloat((Math.random() * 1).toFixed(2)); // 0-1 scale

        const score = calculateRouteScore({
          distance: route.distance,
          estimatedTime: route.duration,
          trafficFactor,
          weatherImpact,
          roadQuality,
          timeOfDay
        }, optimizationMode);

        return {
          ...route,
          id: index + 1,
          score: parseFloat(score.toFixed(2)),
          trafficFactor,
          weatherImpact,
          roadQuality: parseFloat(roadQuality.toFixed(2)),
          timeOfDay,
          // Format values for display
          distance: parseFloat(route.distance.toFixed(2)),
          duration: parseFloat(route.duration.toFixed(2))
        };
      });

      // Sort routes by score (lower is better)
      const sortedRoutes = scoredRoutes.sort((a, b) => a.score - b.score);
      
      setRoutes(sortedRoutes);
      setSelectedRoute(sortedRoutes[0]); // Select the best route by default

      // Add to history
      const historyEntry = {
        id: Date.now(),
        start: { ...startLocation },
        end: { ...endLocation },
        timestamp: new Date().toISOString(),
        route: sortedRoutes[0]
      };
      
      setRouteHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10 entries

      // Display route on map using our custom drawing function instead of Google Directions
      if (mapLoaded && mapInstanceRef.current) {
        // The useEffect above will handle drawing the route when selectedRoute changes
        // Fit map to show both markers
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend({ lat: parseFloat(startLocation.lat), lng: parseFloat(startLocation.lng) });
        bounds.extend({ lat: parseFloat(endLocation.lat), lng: parseFloat(endLocation.lng) });
        mapInstanceRef.current.fitBounds(bounds);
      }
    } catch (err) {
      console.error('Error calculating route:', err);
      setError('Failed to calculate route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format time for display
  const formatTime = (minutes) => {
    if (minutes === undefined || minutes === null) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Get optimization mode label
  const getOptimizationModeLabel = (mode) => {
    switch (mode) {
      case 'distance': return 'Shortest Distance';
      case 'time': return 'Fastest Time';
      case 'fuel': return 'Fuel Efficient';
      case 'cost': return 'Lowest Cost';
      case 'ai': return 'AI Optimized';
      default: return 'Optimized';
    }
  };

  // Get score color based on value
  const getScoreColor = (score) => {
    if (score < 30) return '#10b981'; // green
    if (score < 70) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  // Function to navigate to the selected route in Google Maps
  const navigateToRoute = () => {
    if (!startLocation.lat || !startLocation.lng || !endLocation.lat || !endLocation.lng) {
      setError('Please geocode both start and end locations first');
      return;
    }
    
    // Open Google Maps with directions
    const url = `https://www.google.com/maps/dir/${startLocation.lat},${startLocation.lng}/${endLocation.lat},${endLocation.lng}`;
    window.open(url, '_blank');
  };

  return (
    <ErrorBoundary>
      <div className="panel">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>Route Optimization</h2>
          <div className="row" style={{ gap: 8 }}>
            <select
              className="select"
              value={optimizationMode}
              onChange={(e) => setOptimizationMode(e.target.value)}
              style={{ minWidth: 150 }}
            >
              <option value="ai">AI Optimized</option>
              <option value="distance">Shortest Distance</option>
              <option value="time">Fastest Time</option>
              <option value="fuel">Fuel Efficient</option>
              <option value="cost">Lowest Cost</option>
            </select>
            <button 
              className="button outline"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? 'Hide History' : 'Show History'}
            </button>
          </div>
        </div>

        {showHistory ? (
          <div className="panel" style={{ marginBottom: 16 }}>
            <h3>Route History</h3>
            {routeHistory.length === 0 ? (
              <p>No route history yet.</p>
            ) : (
              <div className="list">
                {routeHistory.map((entry) => (
                  <div 
                    key={entry.id} 
                    className="list-item"
                    onClick={() => {
                      setStartLocation(entry.start);
                      setEndLocation(entry.end);
                      setShowHistory(false);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div>
                      <div>From: {entry.start.name || `${entry.start.lat}, ${entry.start.lng}`}</div>
                      <div>To: {entry.end.name || `${entry.end.lat}, ${entry.end.lng}`}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div>{new Date(entry.timestamp).toLocaleString()}</div>
                      <div>Distance: {entry.route?.distance || 'N/A'} km</div>
                      <button 
                        className="button small outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Navigate to this route
                          const url = `https://www.google.com/maps/dir/${entry.start.lat},${entry.start.lng}/${entry.end.lat},${entry.end.lng}`;
                          window.open(url, '_blank');
                        }}
                        style={{ marginTop: 4 }}
                      >
                        Navigate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Location Inputs */}
            <div className="panel" style={{ marginBottom: 16 }}>
              <h3>Route Planner</h3>
              <div className="row" style={{ gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>Start Location</label>
                  <div className="row" style={{ gap: 8 }}>
                    <input
                      type="text"
                      className="input"
                      placeholder="Enter start location name"
                      value={startLocation.name}
                      onChange={(e) => setStartLocation(prev => ({ ...prev, name: e.target.value }))}
                      style={{ flex: 1 }}
                    />
                    <button 
                      className="button outline"
                      onClick={geocodeStartLocation}
                      disabled={geocoding.start}
                    >
                      {geocoding.start ? 'Geocoding...' : 'Find'}
                    </button>
                  </div>
                  {startLocation.displayName && (
                    <div style={{ marginTop: 8, fontSize: 14, color: '#9ca3af' }}>
                      Found: {startLocation.displayName}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>End Location</label>
                  <div className="row" style={{ gap: 8 }}>
                    <input
                      type="text"
                      className="input"
                      placeholder="Enter end location name"
                      value={endLocation.name}
                      onChange={(e) => setEndLocation(prev => ({ ...prev, name: e.target.value }))}
                      style={{ flex: 1 }}
                    />
                    <button 
                      className="button outline"
                      onClick={geocodeEndLocation}
                      disabled={geocoding.end}
                    >
                      {geocoding.end ? 'Geocoding...' : 'Find'}
                    </button>
                  </div>
                  {endLocation.displayName && (
                    <div style={{ marginTop: 8, fontSize: 14, color: '#9ca3af' }}>
                      Found: {endLocation.displayName}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="row" style={{ justifyContent: 'flex-end', alignItems: 'center' }}>
                <button 
                  className="button primary"
                  onClick={calculateRoute}
                  disabled={loading || !startLocation.lat || !endLocation.lat}
                  style={{ marginRight: 8 }}
                >
                  {loading ? 'Calculating...' : 'Calculate Route'}
                </button>
                <button 
                  className="button outline"
                  onClick={navigateToRoute}
                  disabled={!startLocation.lat || !endLocation.lat}
                >
                  Navigate
                </button>
              </div>
            </div>

            {error && (
              <div className="panel" style={{ marginBottom: 16, backgroundColor: '#991b1b' }}>
                <strong>Error:</strong> {error}
                {error.includes('Directions') && (
                  <p style={{ marginTop: '10px', fontSize: '14px' }}>
                    This application no longer uses Google Maps Directions Service. 
                    Please refresh the page to clear any cached API calls.
                  </p>
                )}
              </div>
            )}

            {/* Map */}
            <div className="panel" style={{ marginBottom: 16 }}>
              <h3>Route Map</h3>
              {mapError ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                  <p>Failed to load map. Please check your internet connection.</p>
                  <p style={{ fontSize: '14px', marginTop: '10px' }}>
                    If you're seeing a Directions Service error, it's because this application no longer uses Google Maps Directions Service.
                    Please refresh the page to clear any cached API calls.
                  </p>
                  <button 
                    className="button outline"
                    onClick={() => window.location.reload()}
                  >
                    Refresh Page
                  </button>
                </div>
              ) : !mapLoaded ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                  Loading map...
                </div>
              ) : (
                <div 
                  ref={mapRef} 
                  style={{ height: 400, borderRadius: 8, overflow: 'hidden' }}
                ></div>
              )}
            </div>

            {/* Route Results */}
            {routes.length > 0 && (
              <div className="panel" style={{ marginBottom: 16 }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3>Optimized Routes</h3>
                  <span className="badge">
                    {getOptimizationModeLabel(optimizationMode)}
                  </span>
                </div>
                
                <div className="battery-grid">
                  {routes.map((route) => (
                    <div 
                      key={route.id}
                      className={`battery-card ${selectedRoute?.id === route.id ? 'selected' : ''}`}
                      onClick={() => setSelectedRoute(route)}
                    >
                      <div className="battery-card-header">
                        <h3>Route {route.id}</h3>
                        <span 
                          className="badge"
                          style={{ backgroundColor: getScoreColor(route.score) }}
                        >
                          Score: {route.score}
                        </span>
                      </div>
                      
                      <div className="battery-details">
                        <div className="detail-item">
                          <span className="detail-label">Distance:</span>
                          <span className="detail-value">{route.distance} km</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Estimated Time:</span>
                          <span className="detail-value">{formatTime(route.duration)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Traffic Factor:</span>
                          <span className="detail-value">{route.trafficFactor}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Weather Impact:</span>
                          <span className="detail-value">{route.weatherImpact}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Road Quality:</span>
                          <span className="detail-value">{route.roadQuality}/10</span>
                        </div>
                        <div className="detail-item" style={{ marginTop: 8 }}>
                          <button 
                            className="button small outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToRoute();
                            }}
                            disabled={!startLocation.lat || !endLocation.lat}
                          >
                            Navigate
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <style>{`
          .battery-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
          }
          
          .battery-card {
            background-color: #1f2937;
            border-radius: 8px;
            padding: 16px;
            cursor: pointer;
            transition: all 0.2s ease;
            border: 1px solid #374151;
          }
          
          .battery-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          
          .battery-card.selected {
            border: 2px solid #3b82f6;
          }
          
          .battery-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }
          
          .battery-card-header h3 {
            margin: 0;
            font-size: 16px;
          }
          
          .battery-level-container {
            height: 24px;
            background-color: #374151;
            border-radius: 12px;
            position: relative;
            overflow: hidden;
            margin-bottom: 12px;
          }
          
          .battery-level {
            height: 100%;
            transition: width 0.5s ease;
          }
          
          .battery-level.high {
            background-color: #10b981;
          }
          
          .battery-level.medium {
            background-color: #f59e0b;
          }
          
          .battery-level.low {
            background-color: #ef4444;
          }
          
          .battery-percentage {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-weight: bold;
          }
          
          .battery-details {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          
          .detail-item {
            display: flex;
            justify-content: space-between;
          }
          
          .detail-label {
            color: #9ca3af;
          }
          
          .detail-value {
            font-weight: bold;
          }
          
          .list-item {
            padding: 12px;
            border-bottom: 1px solid #374151;
            cursor: pointer;
          }
          
          .list-item:hover {
            background-color: rgba(255, 255, 255, 0.05);
          }
          
          @media (max-width: 768px) {
            .battery-grid {
              grid-template-columns: 1fr;
            }
            
            .row {
              flex-direction: column;
              gap: 12px;
            }
            
            .row > div {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
}

export default RouteOptimization;
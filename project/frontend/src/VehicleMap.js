import React, { useState, useEffect, useRef, useContext } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import VehicleSearch from './VehicleSearch';
import { API_BASE_URL, WS_BASE_URL } from './config';

const render = (status) => {
  return <div className="panel"><h2>{status}</h2></div>;
};

// Function to calculate distance between two points (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

function MapComponent({ vehicles, center, zoom, geofences, selectedVehicle, onVehicleSelect, showHeatmap, heatmapData, userLocation }) {
  const ref = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState({});
  const [geofencePolygons, setGeofencePolygons] = useState({});
  const [infoWindows, setInfoWindows] = useState({});
  const [paths, setVehiclePaths] = useState({});
  const [heatmapLayer, setHeatmapLayer] = useState(null);
  const [userMarker, setUserMarker] = useState(null);

  // Initialize map
  useEffect(() => {
    if (ref.current && !map && window.google?.maps) {
      try {
        const newMap = new window.google.maps.Map(ref.current, {
          center,
          zoom,
          styles: [
            { elementType: 'geometry', stylers: [{ color: '#0b1220' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#0b1220' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
            { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
          ],
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: true,
        });
        setMap(newMap);
      } catch (error) {
        console.error('Error initializing Google Maps:', error);
      }
    }
  }, [ref, map, center, zoom]);

  // Handle vehicle markers
  useEffect(() => {
    if (!map || !vehicles.length || !window.google?.maps) return;

    try {
      const updatedMarkers = { ...markers };
      const updatedInfoWindows = { ...infoWindows };
      const updatedPaths = { ...paths };

      vehicles.forEach(vehicle => {
        const { id, latitude, longitude, speed, status, make, model, batteryLevel } = vehicle;
        
        // Validate coordinates
        if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
          console.warn(`Invalid coordinates for vehicle ${id}:`, { latitude, longitude });
          return;
        }
        
        const position = { lat: latitude, lng: longitude };

        // Handle vehicle path
        if (!updatedPaths[id]) {
          updatedPaths[id] = new window.google.maps.Polyline({
            path: [position],
            geodesic: true,
            strokeColor: '#22d3ee',
            strokeOpacity: 0.6,
            strokeWeight: 2,
            map: map
          });
        } else {
          // Safely update existing path
          try {
            const pathObj = updatedPaths[id].getPath();
            if (pathObj && typeof pathObj.push === 'function') {
              pathObj.push(new window.google.maps.LatLng(latitude, longitude));
              // Limit path length to prevent performance issues
              if (pathObj.getLength() > 100) {
                pathObj.removeAt(0);
              }
            }
          } catch (pathError) {
            console.warn(`Error updating path for vehicle ${id}:`, pathError);
            // Recreate the path if there's an error
            updatedPaths[id].setMap(null);
            updatedPaths[id] = new window.google.maps.Polyline({
              path: [position],
              geodesic: true,
              strokeColor: '#22d3ee',
              strokeOpacity: 0.6,
              strokeWeight: 2,
              map: map
            });
          }
        }
        
        // Handle marker creation/update
        if (!updatedMarkers[id]) {
          // Create info window content
          const contentString = `
            <div style="padding: 8px; max-width: 200px;">
              <h3 style="margin: 0 0 8px 0; color: #0b1220;">${make} ${model}</h3>
              <p style="margin: 4px 0; color: #1f2937;">Status: <span style="font-weight: bold;">${status}</span></p>
              <p style="margin: 4px 0; color: #1f2937;">Speed: ${parseFloat(speed || 0).toFixed(2)} km/h</p>
              <p style="margin: 4px 0; color: #1f2937;">Battery: ${parseFloat(batteryLevel || 0).toFixed(2)}%</p>
              <p style="margin: 4px 0; color: #1f2937;">Location: ${parseFloat(latitude).toFixed(4)}, ${parseFloat(longitude).toFixed(4)}</p>
            </div>
          `;
          
          // Create info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: contentString,
            maxWidth: 250
          });
          updatedInfoWindows[id] = infoWindow;
          
          // Create marker
          const marker = new window.google.maps.Marker({
            position,
            map,
            title: `${make} ${model}`,
            icon: {
              path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 5,
              fillColor: status === 'on-trip' ? '#22d3ee' : status === 'maintenance' ? '#f59e0b' : status === 'charging' ? '#3b82f6' : '#ef4444',
              fillOpacity: 1,
              strokeWeight: 1,
              strokeColor: '#06b6d4',
              rotation: Math.random() * 360 // Random initial rotation
            },
            zIndex: status === 'on-trip' ? 3 : 1
          });
          
          // Add click listener
          marker.addListener('click', () => {
            Object.values(updatedInfoWindows).forEach(window => window.close());
            infoWindow.open({ anchor: marker, map });
            if (onVehicleSelect) {
              onVehicleSelect(vehicle);
            }
          });
          
          updatedMarkers[id] = marker;
        } else {
          // Update existing marker
          const marker = updatedMarkers[id];
          
          // Safely calculate heading from path
          try {
            if (updatedPaths[id] && updatedPaths[id].getPath && 
                typeof updatedPaths[id].getPath === 'function') {
              const pathObj = updatedPaths[id].getPath();
              if (pathObj && pathObj.getLength && pathObj.getLength() >= 2) {
                const prevPos = pathObj.getAt(pathObj.getLength() - 2);
                if (prevPos && window.google.maps.geometry?.spherical) {
                  const heading = window.google.maps.geometry.spherical.computeHeading(
                    prevPos,
                    new window.google.maps.LatLng(latitude, longitude)
                  );
                  const currentIcon = marker.getIcon();
                  if (currentIcon && typeof currentIcon === 'object') {
                    const icon = { ...currentIcon };
                    icon.rotation = heading;
                    marker.setIcon(icon);
                  }
                }
              }
            }
          } catch (headingError) {
            console.warn(`Error calculating heading for vehicle ${id}:`, headingError);
          }
          
          // Update marker position
          marker.setPosition(position);
          
          // Update marker icon color based on status
          const currentIcon = marker.getIcon();
          if (currentIcon && typeof currentIcon === 'object') {
            const icon = { ...currentIcon };
            icon.fillColor = status === 'on-trip' ? '#22d3ee' : status === 'maintenance' ? '#f59e0b' : status === 'charging' ? '#3b82f6' : '#ef4444';
            marker.setIcon(icon);
          }
          
          // Update info window content
          if (updatedInfoWindows[id]) {
            const contentString = `
              <div style="padding: 8px; max-width: 200px;">
                <h3 style="margin: 0 0 8px 0; color: #0b1220;">${make || 'Unknown'} ${model || 'Vehicle'}</h3>
                <p style="margin: 4px 0; color: #1f2937;">Status: <span style="font-weight: bold;">${status || 'Unknown'}</span></p>
                <p style="margin: 4px 0; color: #1f2937;">Speed: ${parseFloat(speed || 0).toFixed(2)} km/h</p>
                <p style="margin: 4px 0; color: #1f2937;">Battery: ${parseFloat(batteryLevel || 0).toFixed(2)}%</p>
                <p style="margin: 4px 0; color: #1f2937;">Location: ${parseFloat(latitude).toFixed(4)}, ${parseFloat(longitude).toFixed(4)}</p>
              </div>
            `;
            updatedInfoWindows[id].setContent(contentString);
          }
        }
      });
      
      // Remove markers for vehicles no longer in the list
      Object.keys(updatedMarkers).forEach(id => {
        if (!vehicles.find(v => v.id === id)) {
          updatedMarkers[id].setMap(null);
          delete updatedMarkers[id];
          
          if (updatedInfoWindows[id]) {
            updatedInfoWindows[id].close();
            delete updatedInfoWindows[id];
          }
          
          if (updatedPaths[id]) {
            updatedPaths[id].setMap(null);
            delete updatedPaths[id];
          }
        }
      });
      
      setMarkers(updatedMarkers);
      setInfoWindows(updatedInfoWindows);
      setVehiclePaths(updatedPaths);
      
      if (selectedVehicle) {
        const vehicle = vehicles.find(v => v.id === selectedVehicle.id);
        if (vehicle) {
          map.panTo({ lat: vehicle.latitude, lng: vehicle.longitude });
          
          if (updatedMarkers[vehicle.id] && updatedInfoWindows[vehicle.id]) {
            updatedInfoWindows[vehicle.id].open({
              anchor: updatedMarkers[vehicle.id],
              map
            });
          }
        }
      }
    } catch (error) {
      console.error('Error updating vehicle markers:', error);
    }
  }, [map, vehicles, selectedVehicle, onVehicleSelect]);

  // Handle geofences
  useEffect(() => {
    if (!map || !geofences) return;
    
    // Clear existing geofences
    Object.values(geofencePolygons).forEach(polygon => {
      polygon.setMap(null);
    });
    
    const updatedGeofences = {};
    
    // Create new geofences
    geofences.forEach(geofence => {
      const { id, name, coordinates, type } = geofence;
      
      // Convert coordinates to LatLng objects
      const path = coordinates.map(coord => ({
        lat: coord.latitude,
        lng: coord.longitude
      }));
      
      // Set polygon options based on geofence type
      let fillColor, strokeColor;
      switch (type) {
        case 'restricted':
          fillColor = '#ef4444';
          strokeColor = '#b91c1c';
          break;
        case 'operational':
          fillColor = '#22c55e';
          strokeColor = '#15803d';
          break;
        case 'charging':
          fillColor = '#3b82f6';
          strokeColor = '#1d4ed8';
          break;
        default:
          fillColor = '#a855f7';
          strokeColor = '#7e22ce';
      }
      
      // Create polygon
      const polygon = new window.google.maps.Polygon({
        paths: path,
        strokeColor,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor,
        fillOpacity: 0.35,
        map,
        zIndex: 1
      });
      
      // Add info window for geofence
      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="padding: 8px;"><h3 style="margin: 0;">${name}</h3><p>${type} zone</p></div>`,
        position: path[0]
      });
      
      // Add click listener
      polygon.addListener('click', (e) => {
        infoWindow.setPosition(e.latLng);
        infoWindow.open(map);
      });
      
      updatedGeofences[id] = polygon;
    });
    
    setGeofencePolygons(updatedGeofences);
  }, [map, geofences]);

  // Handle heatmap layer - Using alternative approach due to deprecation
  useEffect(() => {
    if (!map) return;

    if (showHeatmap && heatmapData.length > 0) {
      // Create alternative heatmap using circles instead of deprecated HeatmapLayer
      if (!heatmapLayer) {
        const circles = [];
        heatmapData.forEach((point, index) => {
          if (point.location && point.weight) {
            const circle = new window.google.maps.Circle({
              strokeColor: '#FF0000',
              strokeOpacity: 0.2,
              strokeWeight: 1,
              fillColor: '#FF0000',
              fillOpacity: Math.min(0.6, point.weight * 0.8),
              map: map,
              center: point.location,
              radius: 200 * (point.weight || 0.5), // Radius based on weight
              zIndex: 0
            });
            circles.push(circle);
          }
        });
        setHeatmapLayer({ circles, type: 'alternative' });
      }
    } else if (heatmapLayer && heatmapLayer.circles) {
      // Hide alternative heatmap circles
      heatmapLayer.circles.forEach(circle => circle.setMap(null));
      setHeatmapLayer(null);
    }
  }, [map, showHeatmap, heatmapData]);

  // Handle user location marker
  useEffect(() => {
    if (!map || !userLocation || !window.google?.maps) return;

    // Remove existing user marker
    if (userMarker) {
      userMarker.setMap(null);
    }

    // Create new user marker
    const marker = new window.google.maps.Marker({
      position: { lat: userLocation.lat, lng: userLocation.lng },
      map,
      title: 'Your Location',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      },
      zIndex: 1000
    });

    setUserMarker(marker);

    // Center map on user location
    map.panTo({ lat: userLocation.lat, lng: userLocation.lng });

  }, [map, userLocation]);

  return <div ref={ref} style={{ width: '100%', height: 420, borderRadius: 14 }} />;
}

function VehicleMap() {
  const { currentUser, role } = useContext(AuthContext);
  const [vehicles, setVehicles] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [mapMode, setMapMode] = useState('live'); // 'live' or 'history'
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapData, setHeatmapData] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNearbyOnly, setShowNearbyOnly] = useState(false);
  const [nearbyRadius, setNearbyRadius] = useState(5); // km

  // Fetch initial vehicle data
  useEffect(() => {
    const fetchVehicles = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const token = await currentUser.getIdToken();
        const response = await axios.get(`${API_BASE_URL}/api/vehicles`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Add default location data if not present
        const vehiclesWithLocation = response.data.map(vehicle => ({
          ...vehicle,
          latitude: vehicle.latitude || 28.4595 + (Math.random() * 0.1),
          longitude: vehicle.longitude || 77.2090 + (Math.random() * 0.1),
          speed: vehicle.speed || Math.floor(Math.random() * 60),
          batteryLevel: vehicle.batteryLevel || Math.floor(Math.random() * 100)
        }));
        
        setVehicles(vehiclesWithLocation);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch vehicles:', err);
        setError('Failed to load vehicles. Please check your connection.');
        setLoading(false);
      }
    };
    
    // Fetch geofences (mock data for now)
    const fetchGeofences = async () => {
      // In a real implementation, this would be an API call
      // For now, we'll use mock data
      const mockGeofences = [
        {
          id: 'geo-1',
          name: 'Downtown Operational Zone',
          type: 'operational',
          coordinates: [
            { latitude: 28.6339, longitude: 77.2190 },
            { latitude: 28.6339, longitude: 77.2290 },
            { latitude: 28.6239, longitude: 77.2290 },
            { latitude: 28.6239, longitude: 77.2190 }
          ]
        },
        {
          id: 'geo-2',
          name: 'Airport Restricted Area',
          type: 'restricted',
          coordinates: [
            { latitude: 28.5539, longitude: 77.1090 },
            { latitude: 28.5639, longitude: 77.1090 },
            { latitude: 28.5639, longitude: 77.1190 },
            { latitude: 28.5539, longitude: 77.1190 }
          ]
        },
        {
          id: 'geo-3',
          name: 'Central Charging Hub',
          type: 'charging',
          coordinates: [
            { latitude: 28.6039, longitude: 77.2390 },
            { latitude: 28.6039, longitude: 77.2410 },
            { latitude: 28.6019, longitude: 77.2410 },
            { latitude: 28.6019, longitude: 77.2390 }
          ]
        }
      ];
      
      setGeofences(mockGeofences);
    };
    
    fetchVehicles();
    fetchGeofences();
  }, [currentUser]);

  // Filter vehicles based on status, search term, and proximity
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesStatus = filterStatus === 'all' || vehicle.status === filterStatus;
    const matchesSearch = !searchTerm || 
      vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // If showNearbyOnly is enabled and we have user location, filter by proximity
    if (showNearbyOnly && userLocation) {
      const distance = calculateDistance(
        userLocation.lat, 
        userLocation.lng, 
        vehicle.latitude, 
        vehicle.longitude
      );
      return matchesStatus && matchesSearch && distance <= nearbyRadius;
    }
    
    return matchesStatus && matchesSearch;
  });

  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser.');
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.error('Error getting user location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    setWatchId(id);

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (mapMode !== 'live') return;
    
    const ws = new WebSocket(`${WS_BASE_URL}`);

    ws.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'vehicle_update') {
        setVehicles(prevVehicles => {
          // Find if vehicle already exists
          const existingIndex = prevVehicles.findIndex(v => v.id === data.id);
          
          if (existingIndex >= 0) {
            // Update existing vehicle
            const updatedVehicles = [...prevVehicles];
            updatedVehicles[existingIndex] = {
              ...updatedVehicles[existingIndex],
              latitude: data.latitude,
              longitude: data.longitude,
              speed: data.speed,
              batteryLevel: data.batteryLevel,
              range: data.range,
              status: data.status,
              lastUpdated: new Date().toISOString()
            };
            return updatedVehicles;
          } else {
            // Add new vehicle
            return [...prevVehicles, {
              id: data.id,
              make: data.make || 'Unknown',
              model: data.model || 'Vehicle',
              licensePlate: data.licensePlate || 'TBD',
              status: data.status || 'available',
              latitude: data.latitude,
              longitude: data.longitude,
              speed: data.speed,
              batteryLevel: data.batteryLevel,
              range: data.range,
              lastUpdated: new Date().toISOString()
            }];
          }
        });
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [mapMode]);

  // Function to fetch historical data
  const fetchHistoricalData = async () => {
    if (!currentUser || !historyDate) return;
    
    try {
      setLoading(true);
      const token = await currentUser.getIdToken();
      
      setTimeout(() => {
        const mockHistoricalData = vehicles.map(vehicle => ({
          ...vehicle,
          latitude: vehicle.latitude + (Math.random() * 0.05 - 0.025),
          longitude: vehicle.longitude + (Math.random() * 0.05 - 0.025),
          speed: Math.floor(Math.random() * 40),
          batteryLevel: Math.floor(Math.random() * 80) + 20,
          timestamp: new Date(historyDate).toISOString()
        }));
        
        setVehicles(mockHistoricalData);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Failed to fetch historical data:', err);
      setError('Failed to load historical data.');
      setLoading(false);
    }
  };

  const center = userLocation || (filteredVehicles.length > 0 ?
    { 
      lat: filteredVehicles.reduce((sum, v) => sum + v.latitude, 0) / filteredVehicles.length,
      lng: filteredVehicles.reduce((sum, v) => sum + v.longitude, 0) / filteredVehicles.length
    } :
    { lat: 28.6139, lng: 77.2090 });
  
  const zoom = 12;

  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const toggleMapMode = () => {
    if (mapMode === 'live') {
      setMapMode('history');
      fetchHistoricalData();
    } else {
      setMapMode('live');
    }
  };

  const generateHeatmapData = () => {
    if (!filteredVehicles.length || !window.google?.maps?.LatLng) return;

    const heatmapPoints = [];
    
    filteredVehicles.forEach(vehicle => {
      const baseIntensity = Math.max(0.3, Math.min(1.0, 
        (vehicle.speed || 0) / 60 + 
        (100 - (vehicle.batteryLevel || 50)) / 200
      ));
      
      heatmapPoints.push({
        location: new window.google.maps.LatLng(vehicle.latitude, vehicle.longitude),
        weight: baseIntensity
      });
      
      for (let i = 0; i < 3; i++) {
        const offsetLat = vehicle.latitude + (Math.random() * 0.01 - 0.005);
        const offsetLng = vehicle.longitude + (Math.random() * 0.01 - 0.005);
        heatmapPoints.push({
          location: new window.google.maps.LatLng(offsetLat, offsetLng),
          weight: Math.random() * 0.5 + 0.2
        });
      }
    });

    const hotspots = [
      { lat: 28.6139, lng: 77.2090, weight: 0.8 },
      { lat: 28.6304, lng: 77.2177, weight: 0.7 },
      { lat: 28.5355, lng: 77.3910, weight: 0.6 },
      { lat: 28.4595, lng: 77.0266, weight: 0.9 },
    ];

    hotspots.forEach(spot => {
      heatmapPoints.push({
        location: new window.google.maps.LatLng(spot.lat, spot.lng),
        weight: spot.weight
      });
    });

    setHeatmapData(heatmapPoints);
  };

  // Handle vehicle selection from search
  const handleSearchVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
    // Center map on selected vehicle
    if (vehicle.latitude && vehicle.longitude) {
      setUserLocation({ lat: vehicle.latitude, lng: vehicle.longitude });
    }
  };

  // Handle add vehicle - make available to all users (remove role restriction)
  const handleAddVehicle = () => {
    // Remove role check - allow all users to add vehicles
    // Navigate to vehicles tab using React state instead of hash navigation
    const event = new CustomEvent('navigateToTab', { detail: 'vehicles' });
    window.dispatchEvent(event);
  };

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2>Vehicle Map</h2>
        <div className="row" style={{ gap: 8 }}>
          {mapMode === 'history' && (
            <input 
              type="date" 
              value={historyDate} 
              onChange={(e) => setHistoryDate(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #374151' }}
            />
          )}
          <button 
            className={`button ${showHeatmap ? 'primary' : 'outline'}`}
            onClick={() => {
              try {
                setShowHeatmap(!showHeatmap);
                if (!showHeatmap) {
                  generateHeatmapData();
                }
              } catch (error) {
                console.error('Error toggling heatmap:', error);
              }
            }}
          >
            🔥 Heatmap
          </button>
          <button 
            className="button outline" 
            onClick={toggleMapMode}
          >
            {mapMode === 'live' ? 'View History' : 'Live View'}
          </button>
        </div>
      </div>
      
      {/* Map Controls */}
      <div className="map-controls">
        <div className="control-group">
          <select
            className="select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Vehicles</option>
            <option value="available">Available</option>
            <option value="on-trip">On Trip</option>
            <option value="maintenance">Maintenance</option>
            <option value="charging">Charging</option>
            <option value="out-of-service">Out of Service</option>
          </select>
        </div>
        
        <div className="control-group">
          <VehicleSearch onVehicleSelect={handleSearchVehicleSelect} />
        </div>
        
        <div className="control-group row" style={{ gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            id="nearby-toggle"
            checked={showNearbyOnly}
            onChange={(e) => setShowNearbyOnly(e.target.checked)}
          />
          <label htmlFor="nearby-toggle" style={{ color: '#e2e8f0', marginBottom: 0 }}>Nearby Only</label>
          
          {showNearbyOnly && (
            <div className="row" style={{ gap: 4, alignItems: 'center' }}>
              <label htmlFor="radius-input" style={{ color: '#e2e8f0', marginBottom: 0 }}>Within</label>
              <input
                type="number"
                id="radius-input"
                value={nearbyRadius}
                onChange={(e) => setNearbyRadius(Number(e.target.value))}
                min="1"
                max="50"
                style={{ width: 60, padding: '4px', borderRadius: 4, border: '1px solid #374151', background: '#0f172a', color: '#e2e8f0' }}
              />
              <span style={{ color: '#e2e8f0' }}>km</span>
            </div>
          )}
        </div>
        
        {/* Remove role restriction - make add vehicle available to all users */}
        <div className="control-group">
          <button className="button primary" onClick={handleAddVehicle}>
            ➕ Add Vehicle
          </button>
        </div>
      </div>
      
      {loading ? (
        <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Loading map data...</p>
        </div>
      ) : error ? (
        <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Error: {error}</p>
        </div>
      ) : (
        <>
          <Wrapper 
            apiKey={"AIzaSyCZ8IUseEHZsIhMqTgunyl5Qg10tFq6ToY"} 
            render={render} 
            libraries={['geometry']}
            onLoad={() => console.log('Google Maps API loaded')}
            onError={(error) => {
              console.error('Google Maps API error:', error);
              setError('Failed to load Google Maps. Please check your internet connection.');
            }}
          >
            <MapComponent 
              vehicles={filteredVehicles} 
              center={center} 
              zoom={zoom} 
              geofences={geofences}
              selectedVehicle={selectedVehicle}
              onVehicleSelect={handleVehicleSelect}
              showHeatmap={showHeatmap}
              heatmapData={heatmapData}
              userLocation={userLocation}
            />
          </Wrapper>
          
          <div style={{ marginTop: 12 }}>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              {filteredVehicles.map(vehicle => (
                <button 
                  key={vehicle.id}
                  className={`button ${selectedVehicle?.id === vehicle.id ? 'primary' : 'outline'}`}
                  onClick={() => handleVehicleSelect(vehicle)}
                  style={{ margin: '4px 0' }}
                >
                  {vehicle.make} {vehicle.model}
                  {vehicle.batteryLevel && (
                    <span className="badge" style={{ marginLeft: 8 }}>
                      {parseFloat(vehicle.batteryLevel).toFixed(2)}%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      
      <style>{`
        .map-controls {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
          flex-wrap: wrap;
          align-items: center;
        }
        
        .control-group {
          flex: 1;
          min-width: 200px;
        }
        
        .select {
          width: 100%;
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #374151;
          background-color: #0f172a;
          color: #e2e8f0;
        }
      `}</style>
    </div>
  );
}

export default VehicleMap;

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RealMap = ({ userLocation, vehicles, selectedRoute, onVehicleSelect }) => {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const center = userLocation || { latitude: 28.6139, longitude: 77.2090 };
    leafletMapRef.current = L.map(mapRef.current).setView([center.latitude, center.longitude], 13);

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(leafletMapRef.current);

    // Add user location marker
    if (userLocation) {
      const userIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
        .addTo(leafletMapRef.current)
        .bindPopup('Your Location')
        .openPopup();
    }

    // Clean up
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
      }
    };
  }, [userLocation]);

  useEffect(() => {
    if (!leafletMapRef.current || !vehicles) return;

    // Clear existing markers
    markersRef.current.forEach(marker => leafletMapRef.current.removeLayer(marker));
    markersRef.current = [];

    // Add vehicle markers
    vehicles.forEach(vehicle => {
      if (vehicle.latitude && vehicle.longitude) {
        let iconUrl;
        switch (vehicle.status) {
          case 'available':
            iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png';
            break;
          case 'on-trip':
            iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png';
            break;
          case 'charging':
            iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png';
            break;
          default:
            iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png';
        }

        const vehicleIcon = L.icon({
          iconUrl: iconUrl,
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        const marker = L.marker([vehicle.latitude, vehicle.longitude], { icon: vehicleIcon })
          .addTo(leafletMapRef.current)
          .bindPopup(`
            <div>
              <strong>${vehicle.make || 'Vehicle'} ${vehicle.model || ''}</strong><br/>
              License: ${vehicle.licensePlate || 'N/A'}<br/>
              Status: ${vehicle.status || 'Unknown'}<br/>
              Battery: ${vehicle.batteryLevel ? vehicle.batteryLevel + '%' : 'N/A'}
            </div>
          `);

        marker.on('click', () => {
          if (onVehicleSelect) {
            onVehicleSelect(vehicle);
          }
        });

        markersRef.current.push(marker);
      }
    });

    // Fit map to show all markers
    if (markersRef.current.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      leafletMapRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [vehicles, onVehicleSelect]);

  useEffect(() => {
    if (!leafletMapRef.current || !selectedRoute) return;

    // Draw route if available
    if (selectedRoute.path && selectedRoute.path.length > 1) {
      const latLngs = selectedRoute.path.map(coord => {
        const [lat, lng] = coord.split(',').map(Number);
        return [lat, lng];
      });

      const polyline = L.polyline(latLngs, {
        color: '#3b82f6',
        weight: 5,
        opacity: 0.7,
        dashArray: '10, 10'
      }).addTo(leafletMapRef.current);

      // Clean up
      return () => {
        leafletMapRef.current.removeLayer(polyline);
      };
    }
  }, [selectedRoute]);

  return (
    <div ref={mapRef} style={{ height: '400px', width: '100%', borderRadius: '8px', overflow: 'hidden' }} />
  );
};

export default RealMap;

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Robust fix for default marker icon using CDN
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle smooth animations and clicks
function MapController({ onLocationSelect }) {
  const [position, setPosition] = useState(null);
  
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition(e.latlng);
      onLocationSelect(lat, lng);
      
      // Smoothly fly to the selected location
      map.flyTo(e.latlng, Math.max(map.getZoom(), 6), {
        duration: 1.5,
        easeLinearity: 0.25
      });
    },
  });

  return position ? <Marker position={position} /> : null;
}

const WeatherMap = ({ onLocationSelect, className }) => {
  useEffect(() => {
    window.dispatchEvent(new Event('resize'));
  }, []);

  return (
    <div className={`map-wrapper ${className || ''}`}>
      <MapContainer 
        center={[20, 0]} 
        zoom={2} 
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        minZoom={2}
        maxBounds={[[-90, -180], [90, 180]]}
        maxBoundsViscosity={1.0}
        // Smooth interaction settings
        zoomSnap={0.25}       // Allows fractional zoom levels
        zoomDelta={0.25}      // Smaller zoom steps for smoother feel
        wheelPxPerZoomLevel={120} // Slower, more controlled wheel zooming
        scrollWheelZoom={true}
        doubleClickZoom={false} // Disable default double click to prevent conflict with selection
        animate={true}
        duration={0.8}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          opacity={0.9} // Slight transparency for better blend with theme
        />
        <MapController onLocationSelect={onLocationSelect} />
      </MapContainer>
    </div>
  );
};

export default WeatherMap;

'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';

// Define the interface for the asset matching our mock data
interface FieldAsset {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'pending' | 'repaired' | 'urgent' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  latitude: number;
  longitude: number;
  neighborhood: string;
  technician: string;
  lastServiced: string;
  description: string;
  history: Array<{
    date: string;
    action: string;
    technician: string;
  }>;
}

interface MapProps {
  assets: FieldAsset[];
  selectedAsset: FieldAsset | null;
  onSelectAsset: (asset: FieldAsset) => void;
  theme: 'light' | 'dark';
}

export default function OperationsMap({ assets, selectedAsset, onSelectAsset, theme }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize Leaflet map
    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: true
    }).setView([47.615, -122.335], 12); // Center in Seattle WA

    // Determine initial tile URL
    const tileUrl = theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    // Add CartoDB tile layer dynamically
    const tiles = L.tileLayer(tileUrl, {
      maxZoom: 20,
      minZoom: 10,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    tileLayerRef.current = tiles;

    // Position Zoom control at top-left
    L.control.zoom({ position: 'topleft' }).addTo(map);

    mapInstanceRef.current = map;

    // Fix map loading sizes in some flex layouts
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync tile layer dynamically when theme shifts
  useEffect(() => {
    if (!tileLayerRef.current) return;
    const tileUrl = theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    tileLayerRef.current.setUrl(tileUrl);
  }, [theme]);

  // Sync markers when assets or selectedAsset changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing markers
    Object.values(markersRef.current).forEach(marker => {
      marker.remove();
    });
    markersRef.current = {};

    // Add markers for all visible filtered assets
    assets.forEach(asset => {
      const isSelected = selectedAsset && selectedAsset.id === asset.id;
      const ringHtml = isSelected ? '<div class="marker-selected-ring"></div>' : '';
      
      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          ${ringHtml}
          <div class="marker-halo ${asset.status}"></div>
          <div class="marker-dot ${asset.status}"></div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -10]
      });

      // Status color resolver for the popup header
      const getStatusColor = (status: string) => {
        switch (status) {
          case 'urgent': return '#ef4444';
          case 'pending': return '#f59e0b';
          case 'repaired': return '#06b6d4';
          case 'closed': return '#6b7280';
          default: return '#10b981';
        }
      };

      const marker = L.marker([asset.latitude, asset.longitude], {
        icon: customIcon,
        title: asset.name
      }).addTo(map);

      // Create high-design HTML popup matching the dark operations theme
      marker.bindPopup(`
        <div style="
          color: #f8fafc; 
          background: #0f172a; 
          font-family: inherit; 
          font-size: 13px; 
          line-height: 1.5; 
          padding: 4px;
          border-radius: 8px;
          width: 220px;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px; margin-bottom: 8px;">
            <strong style="color: #ffffff; font-size: 13px;">${asset.id}</strong>
            <span style="
              font-size: 10px; 
              font-weight: 700; 
              text-transform: uppercase; 
              color: ${getStatusColor(asset.status)}; 
              background: ${getStatusColor(asset.status)}22; 
              padding: 2px 6px; 
              border-radius: 10px;
            ">${asset.status}</span>
          </div>
          <div style="font-weight: 600; color: #ffffff; font-size: 14px; margin-bottom: 4px;">${asset.name}</div>
          <div style="color: #94a3b8; font-size: 11px; margin-bottom: 8px;">Category: ${asset.category} | Area: ${asset.neighborhood}</div>
          <div style="color: #cbd5e1; font-size: 12px; margin-bottom: 4px;"><strong>Priority:</strong> <span style="text-transform: uppercase; font-weight: 600;">${asset.priority}</span></div>
          <div style="color: #cbd5e1; font-size: 12px;"><strong>Technician:</strong> ${asset.technician || 'Unassigned'}</div>
        </div>
      `, {
        closeButton: false,
        className: 'custom-leaflet-popup'
      });

      marker.on('click', () => {
        onSelectAsset(asset);
      });

      markersRef.current[asset.id] = marker;
    });
  }, [assets, selectedAsset, onSelectAsset]);

  // Center/Pan when selectedAsset changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedAsset) return;

    const { latitude, longitude } = selectedAsset;
    
    // Zoom slightly closer when selected
    map.setView([latitude, longitude], 14, {
      animate: true,
      duration: 0.8
    });

    // Open popup for the active asset
    const marker = markersRef.current[selectedAsset.id];
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 100);
    }
  }, [selectedAsset]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {/* Map Accent Details */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '4px',
        padding: '6px 10px',
        fontSize: '11px',
        color: '#94a3b8',
        pointerEvents: 'none',
        zIndex: 1000,
        fontFamily: 'var(--font-mono)'
      }}>
        SEATTLE METRO | EPSG:4326
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

// Fix for default marker icons in Next.js
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

interface Pin {
  id: number;
  position: [number, number];
  label: string;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Client-only wrapper to ensure map only renders on client
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  if (!ready) {
    return <div className="w-full h-[500px] md:h-[600px] bg-neutral-900 rounded-2xl flex items-center justify-center">
      <div className="text-neutral-400">Loading map...</div>
    </div>;
  }
  return <>{children}</>;
}

// Component to handle map initialization and invalidateSize
function MapInitializer({ visibleToken }: { visibleToken?: number }) {
  const map = useMap();

  useEffect(() => {
    // Run after render+paint
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 0);
    
    // Also invalidate on map move to ensure tiles load properly
    const handleMoveEnd = () => {
      map.invalidateSize();
    };
    
    map.on('moveend', handleMoveEnd);
    
    return () => {
      clearTimeout(timeout);
      map.off('moveend', handleMoveEnd);
    };
  }, [map, visibleToken]); // invalidate when step changes to map

  return null;
}

export default function MapPanel({ visibleToken }: { visibleToken?: number }) {
  const [pins, setPins] = useState<Pin[]>([]);

  const handleMapClick = (lat: number, lng: number) => {
    const labels = ["Home", "Work/School", "Favorite Spot"];
    const label = labels[pins.length] || `Pin ${pins.length + 1}`;
    if (pins.length < 3) {
      const newPin: Pin = { id: Date.now(), position: [lat, lng], label };
      setPins([...pins, newPin]);
      // Visual feedback - you could add a toast notification here if needed
      console.log(`Pin added: ${label} at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } else {
      // Show feedback that max pins reached
      console.log("Maximum 3 pins allowed");
    }
  };

  // Default center (Toronto, Canada)
  const defaultCenter: [number, number] = [43.6532, -79.3832];

  return (
    <div className="relative w-full h-[500px] md:h-[600px]">
      <ClientOnly>
        <MapContainer
          center={defaultCenter}
          zoom={13}
          minZoom={2}
          maxZoom={23}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          dragging={true}
          touchZoom={true}
          zoomControl={true}
          style={{ height: "100%", width: "100%" }}
          className="rounded-2xl"
        >
          <MapInitializer visibleToken={visibleToken} />
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
            detectRetina={true}
            crossOrigin=""
            maxZoom={23}
            minZoom={2}
            updateWhenIdle={false}
            updateWhenZooming={false}
            keepBuffer={5}
          />
          <MapClickHandler onMapClick={handleMapClick} />
          {pins.map((pin) => (
            <Marker key={pin.id} position={pin.position}>
              <Popup>
                <div className="text-sm font-semibold">{pin.label}</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </ClientOnly>
      {pins.length > 0 && (
        <div className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-lg text-xs" style={{ zIndex: 1000 }}>
          {pins.length} pin{pins.length !== 1 ? 's' : ''} placed
        </div>
      )}
    </div>
  );
}


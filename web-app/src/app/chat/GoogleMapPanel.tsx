"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline } from "@react-google-maps/api";

interface Pin {
  id: number;
  position: { lat: number; lng: number };
  label: string;
  type: "home" | "work" | "favorite";
  color: string;
}

interface ChargingStation {
  id: string;
  position: { lat: number; lng: number };
  name: string;
  placeId?: string;
}

const PIN_CONFIG = {
  home: { label: "Home", color: "#3b82f6", icon: "🏠" },
  work: { label: "Work/School", color: "#ef4444", icon: "🏢" },
  favorite: { label: "Favorite Spot", color: "#10b981", icon: "⭐" },
};

const containerStyle = {
  width: "100%",
  height: "100%",
};

// Default center (Toronto, Canada)
const defaultCenter = {
  lat: 43.6532,
  lng: -79.3832,
};

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

export default function GoogleMapPanel({ visibleToken }: { visibleToken?: number }) {
  const [pins, setPins] = useState<Pin[]>([]);
  const [selectedPinType, setSelectedPinType] = useState<"home" | "work" | "favorite" | null>(null);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [selectedPins, setSelectedPins] = useState<number[]>([]); // For route drawing
  const [showRoute, setShowRoute] = useState(false);
  const [autoRoute, setAutoRoute] = useState(true); // Auto-show route for Home-Work
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [routePath, setRoutePath] = useState<google.maps.LatLngLiteral[]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const [chargingStations, setChargingStations] = useState<ChargingStation[]>([]);
  const [isLoadingChargers, setIsLoadingChargers] = useState(false);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  // Get API key from environment variable
  // For development, you can set this in .env.local: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries: libraries,
  });

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMap(map);
    // Initialize DirectionsService when map is loaded
    directionsServiceRef.current = new google.maps.DirectionsService();
    // Initialize PlacesService when map is loaded (requires a div or the map)
    if (window.google && window.google.maps && window.google.maps.places) {
      placesServiceRef.current = new google.maps.places.PlacesService(map);
      console.log('PlacesService initialized');
    } else {
      console.error('Places library not loaded');
    }
  }, []);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng && selectedPinType) {
      const config = PIN_CONFIG[selectedPinType];
      const newPin: Pin = {
        id: Date.now(),
        position: {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        },
        label: config.label,
        type: selectedPinType,
        color: config.color,
      };
      
      setPins((currentPins) => {
        const updatedPins = [...currentPins, newPin];
        
        // Auto-show route when auto-route is enabled and we have at least 2 pins
        if (autoRoute && currentPins.length > 0) {
          // Automatically connect the new pin to the last placed pin
          // This works for any pin type combination: Home-Work, Home-Favorite, Work-Favorite, etc.
          const previousPin = currentPins[currentPins.length - 1];
          setSelectedPins([previousPin.id, newPin.id]);
          setShowRoute(true);
        }
        
        return updatedPins;
      });
      
      console.log(`Pin added: ${config.label} at ${e.latLng.lat()}, ${e.latLng.lng()}`);
    }
  }, [selectedPinType, autoRoute]);

  const togglePinSelection = (pinId: number) => {
    setSelectedPins((prev) => {
      let newSelected: number[];
      if (prev.includes(pinId)) {
        newSelected = prev.filter((id) => id !== pinId);
      } else if (prev.length < 2) {
        newSelected = [...prev, pinId];
      } else {
        // Replace the first selected pin
        newSelected = [prev[1], pinId];
      }
      return newSelected;
    });
    
    // Check if we need to hide route (will be handled by useEffect)
    setShowRoute((currentShowRoute) => {
      // Route recalculation will be handled by useEffect when selectedPins changes
      return currentShowRoute;
    });
  };

  // Generate fake charging stations along the route
  const generateFakeChargingStations = useCallback((routePath: google.maps.LatLngLiteral[], pin1: Pin, pin2: Pin) => {
    console.log('Generating fake charging stations along route...');
    setIsLoadingChargers(true);
    
    const stations: ChargingStation[] = [];
    const stationNames = [
      'EV Charging Station',
      'Fast Charge Point',
      'Electric Vehicle Charger',
      'EV Power Station',
      'ChargePoint',
      'FLO Charging',
      'Tesla Supercharger',
      'EV Go Station',
      'Green Charge',
      'Power Up EV',
    ];

    // Generate stations along the route path
    if (routePath.length > 0) {
      // Sample points along the route (every 5-8 points, with some randomness)
      const step = Math.max(3, Math.floor(routePath.length / 8)); // 8 stations along route
      
      for (let i = step; i < routePath.length - step; i += step) {
        // Add some randomness to position (offset by up to 200m)
        const offsetLat = (Math.random() - 0.5) * 0.002; // ~200m
        const offsetLng = (Math.random() - 0.5) * 0.002;
        
        stations.push({
          id: `fake-charger-${i}-${Date.now()}`,
          position: {
            lat: routePath[i].lat + offsetLat,
            lng: routePath[i].lng + offsetLng,
          },
          name: stationNames[Math.floor(Math.random() * stationNames.length)],
        });
      }
    } else {
      // If no route path, generate stations between the two pins
      const numStations = 6;
      for (let i = 1; i < numStations; i++) {
        const ratio = i / numStations;
        const offsetLat = (Math.random() - 0.5) * 0.003;
        const offsetLng = (Math.random() - 0.5) * 0.003;
        
        stations.push({
          id: `fake-charger-${i}-${Date.now()}`,
          position: {
            lat: pin1.position.lat + (pin2.position.lat - pin1.position.lat) * ratio + offsetLat,
            lng: pin1.position.lng + (pin2.position.lng - pin1.position.lng) * ratio + offsetLng,
          },
          name: stationNames[Math.floor(Math.random() * stationNames.length)],
        });
      }
    }

    // Also add a few stations near the start and end points
    stations.push({
      id: `fake-charger-start-${Date.now()}`,
      position: {
        lat: pin1.position.lat + (Math.random() - 0.5) * 0.002,
        lng: pin1.position.lng + (Math.random() - 0.5) * 0.002,
      },
      name: stationNames[Math.floor(Math.random() * stationNames.length)],
    });

    stations.push({
      id: `fake-charger-end-${Date.now()}`,
      position: {
        lat: pin2.position.lat + (Math.random() - 0.5) * 0.002,
        lng: pin2.position.lng + (Math.random() - 0.5) * 0.002,
      },
      name: stationNames[Math.floor(Math.random() * stationNames.length)],
    });

    // Simulate loading delay for better UX
    setTimeout(() => {
      setIsLoadingChargers(false);
      console.log(`✅ Generated ${stations.length} fake charging stations`);
      setChargingStations(stations);
    }, 800);
  }, []);

  // Calculate route using DirectionsService
  const calculateRoute = useCallback(() => {
    console.log('calculateRoute called', { 
      hasDirectionsService: !!directionsServiceRef.current, 
      selectedPinsLength: selectedPins.length,
      pinsCount: pins.length 
    });
    
    if (selectedPins.length !== 2) {
      console.log('Not enough pins selected');
      setRoutePath([]);
      return;
    }

    const pin1 = pins.find((p) => p.id === selectedPins[0]);
    const pin2 = pins.find((p) => p.id === selectedPins[1]);

    if (!pin1 || !pin2) {
      console.log('Pins not found', { pin1: !!pin1, pin2: !!pin2 });
      setRoutePath([]);
      return;
    }

    // Initialize DirectionsService if not already done
    if (!directionsServiceRef.current && isLoaded && window.google) {
      console.log('Initializing DirectionsService in calculateRoute');
      directionsServiceRef.current = new google.maps.DirectionsService();
    }

    if (!directionsServiceRef.current) {
      console.error('DirectionsService not available');
      // Fallback to straight line
      setRoutePath([
        { lat: pin1.position.lat, lng: pin1.position.lng },
        { lat: pin2.position.lat, lng: pin2.position.lng },
      ]);
      return;
    }

    console.log('Calling DirectionsService.route', {
      origin: pin1.position,
      destination: pin2.position
    });
    setIsLoadingRoute(true);

    try {
      directionsServiceRef.current.route(
        {
          origin: pin1.position,
          destination: pin2.position,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          setIsLoadingRoute(false);
          console.log('DirectionsService callback', { 
            status, 
            statusText: status,
            hasResult: !!result,
            statusOK: status === google.maps.DirectionsStatus.OK
          });
          
          if (status === google.maps.DirectionsStatus.OK && result) {
            try {
              // Extract the route path from the directions result
              const path: google.maps.LatLngLiteral[] = [];
              
              if (result.routes && result.routes.length > 0) {
                const route = result.routes[0];
                console.log('Route found:', { 
                  hasOverviewPath: !!route.overview_path,
                  overviewPathLength: route.overview_path?.length || 0,
                  hasLegs: !!route.legs,
                  legsLength: route.legs?.length || 0
                });
                
                // Try overview_path first (most efficient)
                if (route.overview_path && route.overview_path.length > 0) {
                  route.overview_path.forEach((point: google.maps.LatLng) => {
                    path.push({ lat: point.lat(), lng: point.lng() });
                  });
                  console.log('✓ Route calculated using overview_path, path length:', path.length);
                } 
                // Try legs[0].steps if overview_path not available
                else if (route.legs && route.legs.length > 0 && route.legs[0].steps) {
                  route.legs[0].steps.forEach((step: google.maps.DirectionsStep) => {
                    if (step.path) {
                      step.path.forEach((point: google.maps.LatLng) => {
                        path.push({ lat: point.lat(), lng: point.lng() });
                      });
                    }
                  });
                  console.log('✓ Route calculated using steps, path length:', path.length);
                }
                // Try legs[0].path as another fallback
                else if (route.legs && route.legs.length > 0 && route.legs[0].path) {
                  route.legs[0].path.forEach((point: google.maps.LatLng) => {
                    path.push({ lat: point.lat(), lng: point.lng() });
                  });
                  console.log('✓ Route calculated using leg path, path length:', path.length);
                }
              }
              
              if (path.length > 0) {
                console.log('✓ Setting route path with', path.length, 'points');
                setRoutePath(path);
                setRouteError(null); // Clear any previous errors
                
                // Generate fake charging stations along the route
                console.log('Route calculated successfully, generating fake charging stations...');
                setTimeout(() => {
                  generateFakeChargingStations(path, pin1, pin2);
                }, 500);
              } else {
                console.warn('⚠ Route path is empty after extraction');
                console.warn('Result structure:', JSON.stringify(result, null, 2).substring(0, 500));
                // Even if route path is empty, generate stations between pins
                setRoutePath([]);
                setRouteError('Route path is empty');
                // Still generate fake stations between the pins
                generateFakeChargingStations([], pin1, pin2);
              }
            } catch (error) {
              console.error('Error processing route result:', error);
              setRoutePath([]);
            }
          } else {
            // Handle different error statuses
            let errorMessage = 'Unknown error';
            switch (status) {
              case google.maps.DirectionsStatus.ZERO_RESULTS:
                errorMessage = 'No route found between these points';
                break;
              case google.maps.DirectionsStatus.REQUEST_DENIED:
                errorMessage = 'Directions API request denied. Check API key permissions.';
                break;
              case google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
                errorMessage = 'Directions API quota exceeded';
                break;
              case google.maps.DirectionsStatus.INVALID_REQUEST:
                errorMessage = 'Invalid request to Directions API';
                break;
              default:
                errorMessage = `Directions API error: ${status}`;
            }
            console.error('❌ Directions request failed:', errorMessage, status);
            // Don't show fallback - let user know there's an issue
            setRoutePath([]);
            setRouteError(errorMessage);
            setChargingStations([]); // Clear charging stations if route fails
          }
        }
      );
    } catch (error) {
      console.error('Error calculating route:', error);
      setIsLoadingRoute(false);
      setRoutePath([]);
      setRouteError(`Error: ${error}`);
      setChargingStations([]); // Clear charging stations on error
    }
  }, [selectedPins, pins, isLoaded, generateFakeChargingStations]);

  // Auto-update route when pins change (only if auto-route is enabled and we have 2+ pins)
  useEffect(() => {
    if (autoRoute && pins.length >= 2) {
      // If we have 2 or more pins and auto-route is on, ensure the last two pins are connected
      // This ensures that when pins are added/removed, the route updates to show the last two pins
      const lastTwoPins = pins.slice(-2);
      if (lastTwoPins.length === 2) {
        const pin1Id = lastTwoPins[0].id;
        const pin2Id = lastTwoPins[1].id;
        
        // Update selected pins to the last two pins (this works for any pin type combination)
        setSelectedPins([pin1Id, pin2Id]);
        setShowRoute(true);
      }
    } else if (!autoRoute) {
      // If auto-route is turned off, don't automatically change selected pins
      // User can still manually select pins
    } else if (pins.length < 2) {
      // If we have less than 2 pins, clear the route
      setShowRoute(false);
      setRoutePath([]);
      setSelectedPins([]);
      setChargingStations([]); // Clear charging stations when route is cleared
    }
  }, [pins, autoRoute]);

  // Debug: Log when charging stations change
  useEffect(() => {
    if (chargingStations.length > 0) {
      console.log(`✅ Charging stations state updated: ${chargingStations.length} stations`, chargingStations);
    }
  }, [chargingStations]);

  // Calculate route when selected pins change and route should be shown
  useEffect(() => {
    console.log('Route effect triggered:', { showRoute, selectedPinsLength: selectedPins.length, isLoaded, hasMap: !!map });
    
    if (showRoute && selectedPins.length === 2 && isLoaded && map) {
      // Ensure DirectionsService is initialized
      if (!directionsServiceRef.current) {
        console.log('Initializing DirectionsService');
        directionsServiceRef.current = new google.maps.DirectionsService();
      }
      
      // Small delay to ensure everything is ready
      const timer = setTimeout(() => {
        console.log('Calling calculateRoute');
        calculateRoute();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      if (!showRoute || selectedPins.length !== 2) {
        console.log('Clearing route path');
        setRoutePath([]);
        setChargingStations([]); // Clear charging stations when route is hidden
      }
    }
  }, [showRoute, selectedPins, isLoaded, map, calculateRoute]);

  // If no API key, show a message
  if (!apiKey) {
    return (
      <div className="w-full h-[500px] md:h-[600px] bg-gray-100 rounded-2xl flex items-center justify-center border border-gray-200">
        <div className="text-center p-6">
          <div className="text-gray-900 text-lg mb-2">Google Maps API Key Required</div>
          <div className="text-gray-600 text-sm mb-4">
            To use Google Maps, add your API key to <code className="bg-gray-200 px-2 py-1 rounded">.env.local</code>
          </div>
          <div className="text-gray-600 text-xs">
            Set: <code className="bg-gray-200 px-2 py-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here</code>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full h-[500px] md:h-[600px] bg-gray-100 rounded-2xl flex items-center justify-center border border-gray-200">
        <div className="text-red-600">Error loading Google Maps. Check your API key.</div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[500px] md:h-[600px] bg-gray-100 rounded-2xl flex items-center justify-center border border-gray-200">
        <div className="text-gray-600">Loading Google Maps...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Pin Type Selector */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-lg flex gap-2 z-[1000] shadow-lg border border-gray-200">
        <span className="text-xs text-gray-600 mr-2">Select pin type:</span>
        {Object.entries(PIN_CONFIG).map(([type, config]) => {
          const pinType = type as "home" | "work" | "favorite";
          const isSelected = selectedPinType === pinType;
          return (
            <button
              key={type}
              onClick={() => setSelectedPinType(pinType)}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                isSelected
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {config.icon} {config.label}
            </button>
          );
        })}
        {selectedPinType && (
          <button
            onClick={() => setSelectedPinType(null)}
            className="px-2 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200 text-gray-700"
            title="Cancel pin placement"
          >
            ✕
          </button>
        )}
      </div>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={13}
        onLoad={onMapLoad}
        onClick={onMapClick}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          minZoom: 2,
          maxZoom: 23,
          // No styles property = default Google Maps light theme
        }}
      >
        {pins.map((pin) => {
          const isSelected = selectedPins.includes(pin.id);
          const config = PIN_CONFIG[pin.type];
          // Create custom marker icon
          const markerColor = isSelected ? "#fbbf24" : pin.color;
          const markerIcon = {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: markerColor,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          };
          
          return (
            <Marker
              key={pin.id}
              position={pin.position}
              onClick={() => {
                setSelectedPin(pin);
                togglePinSelection(pin.id);
              }}
              icon={markerIcon}
              label={{
                text: config.icon,
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "bold",
              }}
              title={pin.label}
            >
              {selectedPin?.id === pin.id && (
                <InfoWindow
                  onCloseClick={() => setSelectedPin(null)}
                  position={pin.position}
                >
                  <div className="text-sm font-semibold text-black">
                    {config.icon} {pin.label}
                  </div>
                </InfoWindow>
              )}
            </Marker>
          );
        })}
        {/* EV Charging Station Markers - Red with lightning bolt */}
        {showRoute && chargingStations.length > 0 && chargingStations.map((station) => (
          <Marker
            key={station.id}
            position={station.position}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 16,
              fillColor: "#ef4444", // Red color for charging stations
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 4,
            }}
            label={{
              text: "⚡",
              color: "#ffffff",
              fontSize: "20px",
              fontWeight: "bold",
            }}
            title={station.name}
            zIndex={1001}
            animation={google.maps.Animation.DROP}
          />
        ))}
        {isLoadingChargers && showRoute && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white/95 px-4 py-2 rounded-lg shadow-lg border-2 border-blue-400 z-[1000]">
            <div className="text-sm text-gray-700 font-semibold">🔍 Loading charging stations...</div>
          </div>
        )}
        {showRoute && !isLoadingChargers && chargingStations.length > 0 && (
          <div className="absolute top-20 right-2 bg-green-500/95 text-white px-3 py-2 rounded-lg shadow-lg border border-green-600 z-[1000]">
            <div className="text-xs font-semibold">⚡ {chargingStations.length} charging stations</div>
          </div>
        )}
        {showRoute && routePath.length > 0 && (
          <Polyline
            key={`route-${selectedPins.join('-')}`}
            path={routePath}
            options={{
              strokeColor: "#3b82f6",
              strokeOpacity: 0.8,
              strokeWeight: 5,
              geodesic: false,
              zIndex: 1000,
            }}
          />
        )}
        {showRoute && routePath.length === 0 && !isLoadingRoute && selectedPins.length === 2 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-50 px-6 py-4 rounded-lg shadow-xl border-2 border-yellow-400 z-[1000] max-w-lg">
            <div className="text-base text-yellow-900 font-bold mb-3">⚠️ Route Calculation Failed</div>
            {routeError && (
              <div className="text-sm text-yellow-800 mb-3 bg-yellow-100 p-2 rounded">
                <strong>Error:</strong> {routeError}
              </div>
            )}
            <div className="text-sm text-yellow-900 mb-3">
              <strong>Solution:</strong> Enable the Directions API for your Google Maps API key.
            </div>
            <div className="text-xs text-yellow-700 space-y-2">
              <div><strong>Steps to fix:</strong></div>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a></li>
                <li>Navigate to <strong>APIs & Services</strong> → <strong>Library</strong></li>
                <li>Search for <strong>"Directions API"</strong></li>
                <li>Click <strong>"Enable"</strong></li>
                <li>Wait a few minutes, then refresh this page</li>
              </ol>
            </div>
            <button
              onClick={() => {
                setShowRoute(false);
                setRouteError(null);
              }}
              className="mt-4 w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded text-sm font-semibold"
            >
              Close
            </button>
          </div>
        )}
        {isLoadingRoute && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 px-4 py-2 rounded-lg shadow-lg border border-gray-200 z-[1000]">
            <div className="text-sm text-gray-700">Calculating route...</div>
          </div>
        )}
      </GoogleMap>
      
      {/* Pin Legend */}
      {pins.length > 0 && (
        <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm text-gray-900 p-3 rounded-lg text-xs max-h-[200px] overflow-y-auto shadow-lg border border-gray-200" style={{ zIndex: 1000 }}>
          <div className="font-semibold mb-2 flex items-center justify-between">
            <span className="text-gray-900">Pins ({pins.length}):</span>
            <label className="flex items-center gap-1 text-xs cursor-pointer text-gray-700">
              <input
                type="checkbox"
                checked={autoRoute}
                onChange={(e) => setAutoRoute(e.target.checked)}
                className="w-3 h-3"
              />
              <span>Auto-route</span>
            </label>
          </div>
          {pins.map((pin) => {
            const config = PIN_CONFIG[pin.type];
            const isSelected = selectedPins.includes(pin.id);
            return (
              <div
                key={pin.id}
                className={`flex items-center gap-2 mb-1 cursor-pointer px-2 py-1 rounded ${
                  isSelected ? "bg-yellow-100 border border-yellow-300" : "hover:bg-gray-100"
                }`}
                onClick={() => togglePinSelection(pin.id)}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: pin.color }}
                />
                <span className="flex-1 text-gray-700">{config.icon} {pin.label}</span>
                {isSelected && <span className="text-yellow-600">✓</span>}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const wasSelected = selectedPins.includes(pin.id);
                    const newPins = pins.filter(p => p.id !== pin.id);
                    const newSelectedPins = selectedPins.filter(id => id !== pin.id);
                    
                    // Remove the pin
                    setPins(newPins);
                    setSelectedPins(newSelectedPins);
                    
                    // Hide route if:
                    // 1. The deleted pin was part of the selected pins (route), OR
                    // 2. We no longer have 2 selected pins after deletion
                    if (wasSelected || newSelectedPins.length < 2) {
                      setShowRoute(false);
                      setRoutePath([]);
                    }
                    
                    // Close info window if it was open for this pin
                    if (selectedPin?.id === pin.id) {
                      setSelectedPin(null);
                    }
                  }}
                  className="text-red-500 hover:text-red-600 text-xs"
                  title="Delete pin"
                >
                  ×
                </button>
              </div>
            );
          })}
          {selectedPins.length === 2 && (
            <button
              onClick={async () => {
                if (!showRoute) {
                  // Show route
                  setShowRoute(true);
                  setRouteError(null); // Clear any previous errors
                  // Ensure DirectionsService is ready
                  if (!directionsServiceRef.current && isLoaded) {
                    directionsServiceRef.current = new google.maps.DirectionsService();
                  }
                  // Give state time to update, then calculate route
                  setTimeout(() => {
                    if (selectedPins.length === 2) {
                      console.log('Button clicked - calculating route for pins:', selectedPins);
                      calculateRoute();
                    }
                  }, 100);
                } else {
                  // Hide route
                  setShowRoute(false);
                  setRoutePath([]);
                  setRouteError(null);
                }
              }}
              className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs disabled:opacity-50"
              disabled={isLoadingRoute}
            >
              {isLoadingRoute ? "Calculating..." : showRoute ? "Hide Route" : "Show Route"}
            </button>
          )}
        </div>
      )}
      
      {/* Instruction when no pin type selected */}
      {!selectedPinType && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-lg text-xs shadow-lg border border-gray-200" style={{ zIndex: 1000 }}>
          👆 Select a pin type above, then click on the map to place it
        </div>
      )}
    </div>
  );
}


'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

// Dynamically import your Globe component (to avoid SSR issues)
const Globe = dynamic(() => import('@/components/Globe'), { ssr: false });

export default function GlobePage() {
  const [countriesData, setCountriesData] = useState<any>(null);
  const globeRef = useRef<any>(null);
  const router = useRouter();

  // Load GeoJSON data once
  useEffect(() => {
    const loadCountries = async () => {
        const res = await fetch('/ne_110m_admin_0_countries.geojson');
        const data = await res.json();
        setCountriesData(data);
    };
    loadCountries();
  }, []);

  // Animate the globe once countries are loaded
  useEffect(() => {
    if (!countriesData || !globeRef.current) return;

    const canada = countriesData.features.find(
      (f: any) => f.properties.ISO_A2 === 'CA'
    );
    if (!canada) {
      console.warn('Canada not found in dataset');
      return;
    }

    // 1️⃣ Start rotation immediately
    globeRef.current.resumeRotation?.();

    // 2️⃣ After 3s, zoom to Canada
    const zoomTimer = setTimeout(() => {
      globeRef.current.enhancedZoomToCountry?.(canada);
    }, 3000);

    // 3️⃣ After 4s, go to next page
    const routeTimer = setTimeout(() => {
      router.push('/chat');
    }, 4000);

    return () => {
      clearTimeout(zoomTimer);
      clearTimeout(routeTimer);
    };
  }, [countriesData, router]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      <Globe ref={globeRef} countriesData={countriesData} />
    </div>
  );
}

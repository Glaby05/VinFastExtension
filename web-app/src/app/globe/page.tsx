'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import GlobeComponent, { GlobeRef } from './GlobeComponent'; // adjust path

const Globe = dynamic(() => import('@/components/Globe'), { ssr: false });

export default function AutoGlobePage({ countriesData }: { countriesData: any }) {
  const globeRef = useRef<GlobeRef>(null);
  const router = useRouter();

  useEffect(() => {
    if (!countriesData || !globeRef.current) return;

    // Wait for the globe to fully initialize
    const timeout = setTimeout(() => {
      // Find Canada from your GeoJSON
      const canada = countriesData.features.find(
        (country: any) => country.properties.ISO_A2 === 'CA'
      );

      if (canada) {
        // Stop rotation and zoom into Canada
        globeRef.current.enhancedZoomToCountry(canada);

        // Optional: wait a few seconds before redirecting
        setTimeout(() => {
          router.push('/next-page'); // replace with your target route
        }, 2500); // wait for zoom animation to finish
      }
    }, 1500); // give globe some time to spin initially

    return () => clearTimeout(timeout);
  }, [countriesData, router]);

  return (
    <div className="w-full h-screen">
      <GlobeComponent ref={globeRef} countriesData={countriesData} />
    </div>
  );
}


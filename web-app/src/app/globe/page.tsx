// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import dynamic from 'next/dynamic';
// import { useRouter } from 'next/navigation';
// import GlobeComponent from '@/components/Globe'; 
// import type { GlobeRef } from '@/components/Globe';

// const Globe = dynamic(() => import('@/components/Globe'), { ssr: false });

// export default function AutoGlobePage({ countriesData }: { countriesData: any }) {
//   const globeRef = useRef<GlobeRef>(null);
//   const router = useRouter();

//   useEffect(() => {
//     if (!countriesData || !globeRef.current) return;

//     // Wait for the globe to fully initialize
//     const timeout = setTimeout(() => {
//       // Find Canada from your GeoJSON
//       const canada = countriesData.features.find(
//         (country: any) => country.properties.ISO_A2 === 'CA'
//       );

//       if (canada) {
//         // Stop rotation and zoom into Canada
//         globeRef.current.enhancedZoomToCountry(canada);

//         // Optional: wait a few seconds before redirecting
//         setTimeout(() => {
//           router.push('/next-page'); // replace with your target route
//         }, 2500); // wait for zoom animation to finish
//       }
//     }, 1500); // give globe some time to spin initially

//     return () => clearTimeout(timeout);
//   }, [countriesData, router]);

//   return (
//     <div className="w-full h-screen">
//       <GlobeComponent ref={globeRef} countriesData={countriesData} />
//     </div>
//   );
// }


'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Globe, { GlobeRef } from '@/components/Globe';

export default function HomePage() {
  const router = useRouter();
  const globeRef = useRef<GlobeRef>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Start rotating
      globeRef.current?.resumeRotation();

      // After 2s, zoom to Canada
      setTimeout(() => {
        const canada = { properties: { ISO_A2: 'CA' } };
        globeRef.current?.zoomToCountry(canada);

        // After 4.5s, navigate to next page
        setTimeout(() => {
          router.push('../chat');
        }, 4500);
      }, 4000);
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="w-screen h-screen">
      <Globe ref={globeRef} />
    </div>
  );
}


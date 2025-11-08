// Globe rendering component

'use client';

import React, { forwardRef, useImperativeHandle, useEffect, useRef } from 'react';

const Globe = forwardRef((props, ref) => {
  const globeRef = useRef();

  useImperativeHandle(ref, () => ({
    getGlobe: () => globeRef.current,
  }));

  useEffect(() => {
    // Initialize globe
    const globe = globeRef.current;
    if (globe) {
      globe.init();
    }
  }, []);

  return <div ref={globeRef} className="globe" />;
});

export default Globe;

"use client"

import React, { useEffect, useRef } from 'react';

interface NaverMapProps {
  width: string;
  height: string;
  lat: number;
  lng: number;
  zoom: number;
}

const NaverMap: React.FC<NaverMapProps> = ({ width, height, lat, lng, zoom }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initMap = () => {
      if (mapRef.current && (window as any).naver && (window as any).naver.maps) {
        const location = new (window as any).naver.maps.LatLng(lat, lng);
        const mapOptions = {
          center: location,
          zoom: zoom,
        };
        new (window as any).naver.maps.Map(mapRef.current, mapOptions);
      }
    };

    if ((window as any).naver && (window as any).naver.maps) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID}`;
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    }
  }, [lat, lng, zoom]);

  return (
    <>
      <div ref={mapRef} style={{ width, height }} />
    </>
  );
};

export default NaverMap;

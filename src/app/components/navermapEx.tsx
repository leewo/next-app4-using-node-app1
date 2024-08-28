"use client"

import React, { useEffect, useState, useCallback } from 'react';
import { NaverMap, Marker, useNavermaps, Container as MapDiv, NavermapsProvider } from 'react-naver-maps';

interface Apartment {
  complexNo: number;
  name: string;
  Address2: string;
  latitude: number;
  longitude: number;
  Area: number;
}

const NaverMapContent: React.FC = () => {
  const navermaps = useNavermaps();
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [map, setMap] = useState<any>(null);

  const fetchApartments = useCallback(async (bounds: any) => {
    if (!bounds) return;

    const { _min, _max } = bounds;
    try {
      const response = await fetch(`http://localhost:3001/api/v1/apartments?minLat=${_min.y}&maxLat=${_max.y}&minLng=${_min.x}&maxLng=${_max.x}`);
      const data = await response.json();
      setApartments(data);
    } catch (error) {
      console.error('Error fetching apartments:', error);
    }
  }, []);

  useEffect(() => {
    if (map) {
      const updateApartments = () => {
        const bounds = map.getBounds();
        fetchApartments(bounds);
      };

      navermaps.Event.addListener(map, 'idle', updateApartments);
      updateApartments(); // 초기 로드시 실행

      return () => {
        navermaps.Event.removeListener(map, 'idle', updateApartments);
      };
    }
  }, [map, fetchApartments, navermaps]);

  if (!navermaps) return null;

  return (
    <MapDiv style={{ width: '100%', height: '100%' }}>
      <NaverMap 
        defaultCenter={new navermaps.LatLng(37.5666805, 126.9784147)}
        defaultZoom={10}
        ref={setMap}
      >
        {apartments.map((apt) => (
          <Marker
            key={apt.complexNo}
            position={new navermaps.LatLng(apt.latitude, apt.longitude)}
            title={apt.name}
          />
        ))}
      </NaverMap>
    </MapDiv>
  );
};

const NaverMapComponent: React.FC = () => {
  return (
    <NavermapsProvider ncpClientId={process.env.NEXT_PUBLIC_NAVER_CLIENT_ID!}>
      <div style={{ height: '100vh' }}>
        <NaverMapContent />
      </div>
    </NavermapsProvider>
  );
};

export default NaverMapComponent;

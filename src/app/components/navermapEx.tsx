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

interface FilterState {
  minPrice: number;
  maxPrice: number;
  area: string;
  type: string;
}

const NaverMapContent: React.FC = () => {
  const navermaps = useNavermaps();
  const [apartments, setApartments] = useState<Apartment[]>([]);

  const fetchApartments = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/v1/apartments');
      const data = await response.json();
      setApartments(data);
    } catch (error) {
      console.error('Error fetching apartments:', error);
    }
  }, []);

  useEffect(() => {
    fetchApartments();
  }, [fetchApartments]);

  if (!navermaps) return null;

  return (
    <MapDiv style={{ width: '100%', height: '100%' }}>
      <NaverMap 
        defaultCenter={new navermaps.LatLng(37.5666805, 126.9784147)}
        defaultZoom={10}
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
  const [filter, setFilter] = useState<FilterState>({
    minPrice: 0,
    maxPrice: Infinity,
    area: 'all',
    type: 'all'
  });

  const handleFilterChange = (key: keyof FilterState, value: string | number) => {
    setFilter(prev => ({ ...prev, [key]: value }));
  };

  return (
    <NavermapsProvider ncpClientId={process.env.NEXT_PUBLIC_NAVER_CLIENT_ID!}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ padding: '10px', backgroundColor: '#f0f0f0' }}>
          <input 
            type="number" 
            placeholder="최소 가격" 
            onChange={(e) => handleFilterChange('minPrice', Number(e.target.value))}
          />
          <input 
            type="number" 
            placeholder="최대 가격" 
            onChange={(e) => handleFilterChange('maxPrice', Number(e.target.value))}
          />
          <select onChange={(e) => handleFilterChange('area', e.target.value)}>
            <option value="all">모든 면적</option>
            <option value="60">60m² 이하</option>
            <option value="85">60m² ~ 85m²</option>
            <option value="135">85m² ~ 135m²</option>
            <option value="136">135m² 초과</option>
          </select>
          <select onChange={(e) => handleFilterChange('type', e.target.value)}>
            <option value="all">전체</option>
            <option value="매매">매매</option>
            <option value="전세">전세</option>
          </select>
        </div>
        <NaverMapContent />
      </div>
    </NavermapsProvider>
  );
};

export default NaverMapComponent;

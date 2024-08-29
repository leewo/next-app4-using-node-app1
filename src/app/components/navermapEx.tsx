"use client"

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { NaverMap, Marker, useNavermaps, Container as MapDiv, NavermapsProvider } from 'react-naver-maps';

interface Apartment {
  complexNo: number;
  name: string;
  Address2: string;
  latitude: number;
  longitude: number;
  Area: number;
}

interface Cluster {
  latitude: number;
  longitude: number;
  count: number;
}

interface FilterState {
  minPrice: number;
  maxPrice: number;
  area: string;
  type: string;
}

const NaverMapContent: React.FC<{ filter: FilterState }> = ({ filter }) => {
  const navermaps = useNavermaps();
  const [clusters, setClusters] = useState<Cluster[]>([]); // 초기값을 빈 배열로 설정
  const [map, setMap] = useState<any>(null);
  const listenerRef = useRef<any>(null);

  const fetchClusters = useCallback(async (bounds: any) => {
    if (!bounds) return;

    const { _min, _max } = bounds;
    try {
      const response = await fetch(`http://localhost:3001/api/v1/apartment-clusters?minLat=${_min.y}&maxLat=${_max.y}&minLng=${_min.x}&maxLng=${_max.x}&minPrice=${filter.minPrice}&maxPrice=${filter.maxPrice}&area=${filter.area}&type=${filter.type}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setClusters(data);
      } else {
        console.error('Received non-array data:', data);
        setClusters([]); // 데이터가 배열이 아닌 경우 빈 배열로 설정
      }
    } catch (error) {
      console.error('Error fetching clusters:', error);
      setClusters([]); // 에러 발생 시 빈 배열로 설정
    }
  }, [filter]);

  useEffect(() => {
    if (map && navermaps) {
      const updateClusters = () => {
        const bounds = map.getBounds();
        fetchClusters(bounds);
      };

      // 이전 리스너 제거
      if (listenerRef.current) {
        navermaps.Event.removeListener(listenerRef.current);
      }

      // 새 리스너 추가 및 저장
      listenerRef.current = navermaps.Event.addListener(map, 'idle', updateClusters);
      
      updateClusters(); // 초기 로드시 실행

      return () => {
        if (listenerRef.current) {
          navermaps.Event.removeListener(listenerRef.current);
        }
      };
    }
  }, [map, fetchClusters, navermaps]);

  if (!navermaps) {
    return <div>Loading maps...</div>;
  }

  return (
    <MapDiv style={{ width: '100%', height: '100%' }}>
      <NaverMap 
        defaultCenter={new navermaps.LatLng(37.5666805, 126.9784147)}
        defaultZoom={10}
        ref={setMap}
      >
        {Array.isArray(clusters) && clusters.map((cluster, index) => (
          <Marker
            key={index}
            position={new navermaps.LatLng(cluster.latitude, cluster.longitude)}
            icon={{
              content: `<div style="background-color: #1E40AF; color: white; padding: 5px; border-radius: 50%; font-size: 10px;">${cluster.count}</div>`,
              anchor: new navermaps.Point(15, 15)
            }}
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
            onChange={(e) => handleFilterChange('maxPrice', Number(e.target.value) || Infinity)}
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
        <NaverMapContent filter={filter} />
      </div>
    </NavermapsProvider>
  );
};

export default NaverMapComponent;

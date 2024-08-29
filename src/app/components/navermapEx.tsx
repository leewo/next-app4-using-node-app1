"use client"

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { NaverMap, Marker, useNavermaps, Container as MapDiv, NavermapsProvider } from 'react-naver-maps';

interface Apartment {
  complexNo: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface Cluster {
  latGrid: number;
  lngGrid: number;
  latitude: number;
  longitude: number;
  count: number;
  apartments: Apartment[];
}

interface FilterState {
  minPrice: number;
  maxPrice: number;
  area: string;
  type: string;
}

const ApartmentList: React.FC<{ apartments: Apartment[], onClose: () => void }> = ({ apartments, onClose }) => (
  <div style={{
    position: 'absolute',
    top: '10px',
    left: '10px',
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    maxHeight: '80vh',
    width: '300px',
    overflowY: 'auto'
  }}>
    <h3 style={{ marginTop: 0 }}>Apartments in this area:</h3>
    <button 
      onClick={onClose} 
      style={{ 
        position: 'absolute', 
        top: '10px', 
        right: '10px',
        background: 'none',
        border: 'none',
        fontSize: '18px',
        cursor: 'pointer'
      }}
    >
      ×
    </button>
    <ul style={{ listStyleType: 'none', padding: 0 }}>
      {apartments.map((apt, index) => (
        <li key={index} style={{ marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          <strong>{apt.name}</strong><br />
          <small>{apt.address}</small>
        </li>
      ))}
    </ul>
  </div>
);

const NaverMapContent: React.FC<{ filter: FilterState }> = ({ filter }) => {
  const navermaps = useNavermaps();
  const [clusters, setClusters] = useState<Cluster[]>([]); // 초기값을 빈 배열로 설정
  const [map, setMap] = useState<any>(null);
  const [hoveredCluster, setHoveredCluster] = useState<Cluster | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const listenerRef = useRef<any>(null);

  const fetchClusters = useCallback(async (bounds: any) => {
    if (!bounds) return;

    const { _min, _max } = bounds;
    try {
      const response = await fetch(`http://localhost:3001/api/v1/apartment-clusters?minLat=${_min.y}&maxLat=${_max.y}&minLng=${_min.x}&maxLng=${_max.x}&area=${filter.area}`);
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
    <MapDiv style={{ width: '100%', height: '100%', position: 'relative' }}>
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
              content: `
                <div style="
                  background-color: #1E40AF;
                  color: white;
                  padding: 5px 10px;
                  border-radius: 20px;
                  font-size: 12px;
                  font-weight: bold;
                  cursor: pointer;
                  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                ">
                  ${cluster.count}
                </div>
              `,
              anchor: new navermaps.Point(20, 20)
            }}
            onClick={() => setSelectedCluster(cluster)}
            onMouseover={() => setHoveredCluster(cluster)}
            onMouseout={() => setHoveredCluster(null)}
          />
        ))}
      </NaverMap>
      {hoveredCluster && !selectedCluster && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: 'white',
          padding: '10px',
          borderRadius: '5px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          maxWidth: '200px'
        }}>
          <strong>{hoveredCluster.count} apartments</strong>
        </div>
      )}
      {selectedCluster && (
        <ApartmentList 
          apartments={selectedCluster.apartments} 
          onClose={() => setSelectedCluster(null)} 
        />
      )}
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
        <div style={{ padding: '10px', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'space-around' }}>
          <input 
            type="number" 
            placeholder="최소 가격" 
            onChange={(e) => handleFilterChange('minPrice', Number(e.target.value))}
            style={{ padding: '5px', marginRight: '5px' }}
          />
          <input 
            type="number" 
            placeholder="최대 가격" 
            onChange={(e) => handleFilterChange('maxPrice', Number(e.target.value) || Infinity)}
            style={{ padding: '5px', marginRight: '5px' }}
          />
          <select 
            onChange={(e) => handleFilterChange('area', e.target.value)}
            style={{ padding: '5px', marginRight: '5px' }}
          >
            <option value="all">모든 면적</option>
            <option value="60">60m² 이하</option>
            <option value="85">60m² ~ 85m²</option>
            <option value="135">85m² ~ 135m²</option>
            <option value="136">135m² 초과</option>
          </select>
          <select 
            onChange={(e) => handleFilterChange('type', e.target.value)}
            style={{ padding: '5px' }}
          >
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

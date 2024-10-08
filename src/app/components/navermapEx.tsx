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

const ApartmentList: React.FC<{ apartments: Apartment[], onClose: () => void, onApartmentClick: (apt: Apartment) => void }> = ({ apartments, onClose, onApartmentClick }) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [apartments]);

  return (
    <div ref={listRef} className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg max-h-[80vh] w-80 overflow-y-auto z-10">
      <h3 className="text-lg font-semibold mb-2">Apartments in this area:</h3>
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <ul className="divide-y divide-gray-200">
        {apartments.map((apt, index) => (
          <li
            key={index}
            className="py-2 cursor-pointer hover:bg-gray-100"
            onClick={() => onApartmentClick(apt)}
          >
            <p className="font-medium">{apt.name}</p>
            <p className="text-sm text-gray-600">{apt.address}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

const NaverMapContent: React.FC<{ filter: FilterState }> = ({ filter }) => {
  const navermaps = useNavermaps();
  const [clusters, setClusters] = useState<Cluster[]>([]); // 초기값을 빈 배열로 설정
  const [map, setMap] = useState<any>(null);
  const [hoveredCluster, setHoveredCluster] = useState<Cluster | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mapRef = useRef<any>(null); // mapRef를 추가하여 맵 DOM 요소에 대한 참조를 저장

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

  // setTimeout을 사용하여 0.5초 동안 추가 호출이 없으면 fetchClusters를 실행
  const debouncedFetchClusters = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (map) {
        const bounds = map.getBounds();
        fetchClusters(bounds);
      }
    }, 500);
  }, [map, fetchClusters]);

  useEffect(() => {
    if (map && navermaps) {
      const idleListener = navermaps.Event.addListener(map, 'idle', debouncedFetchClusters);  // idle 이벤트 리스너를 debouncedFetchClusters로 변경
      const clickListener = navermaps.Event.addListener(map, 'click', () => {
        setSelectedCluster(null);
        setHoveredCluster(null);
      });

      // 초기 로딩 시 데이터 조회
      const initialBounds = map.getBounds();
      fetchClusters(initialBounds);

      // 컴포넌트가 언마운트되거나 의존성이 변경될 때 타이머를 정리하도록 useEffect 정리 함수에 추가
      return () => {
        navermaps.Event.removeListener(idleListener);
        navermaps.Event.removeListener(clickListener);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [map, debouncedFetchClusters, navermaps, fetchClusters]);

  const handleApartmentClick = useCallback((apt: Apartment) => {
    if (map && navermaps) {
      const latLng = new navermaps.LatLng(apt.latitude, apt.longitude);
      map.setCenter(latLng);
      map.setZoom(17);  // 적절한 줌 레벨로 조정
      setSelectedCluster(null);
      setHoveredCluster(null);
      // 줌인 후 마커 조회를 위해 debouncedFetchClusters 호출
      debouncedFetchClusters();
    }
  }, [map, navermaps, debouncedFetchClusters]);

  if (!navermaps) {
    return <div className="flex items-center justify-center h-full">Loading maps...</div>;
  }

  return (
    <MapDiv className="w-full h-full relative">
      <NaverMap
        defaultCenter={new navermaps.LatLng(37.5666805, 126.9784147)}
        defaultZoom={10}
        ref={(ref) => {
          setMap(ref);
          mapRef.current = ref;
        }}
      >
        {Array.isArray(clusters) && clusters.map((cluster, index) => (
          <Marker
            key={index}
            position={new navermaps.LatLng(cluster.latitude, cluster.longitude)}
            icon={{
              content: `
                <div class="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold cursor-pointer shadow-md">
                  ${cluster.count}
                </div>
              `,
              anchor: new navermaps.Point(20, 20)
            }}
            onClick={(e) => {
              e.domEvent.stopPropagation(); // 마커 클릭 이벤트가 맵 클릭 이벤트로 전파되는 것을 방지
              setSelectedCluster(cluster);
            }}
            onMouseover={() => setHoveredCluster(cluster)}
            onMouseout={() => !selectedCluster && setHoveredCluster(null)}
          />
        ))}
      </NaverMap>
      {(hoveredCluster || selectedCluster) && (
        <ApartmentList
          apartments={(selectedCluster || hoveredCluster)!.apartments}
          onClose={() => {
            setSelectedCluster(null);
            setHoveredCluster(null);
          }}
          onApartmentClick={handleApartmentClick}
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
      <div className="flex flex-col h-screen">
        <div className="bg-gray-100 p-4 flex justify-around items-center">
          <input
            type="number"
            placeholder="최소 가격"
            onChange={(e) => handleFilterChange('minPrice', Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="number"
            placeholder="최대 가격"
            onChange={(e) => handleFilterChange('maxPrice', Number(e.target.value) || Infinity)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            onChange={(e) => handleFilterChange('area', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">모든 면적</option>
            <option value="60">60m² 이하</option>
            <option value="85">60m² ~ 85m²</option>
            <option value="135">85m² ~ 135m²</option>
            <option value="136">135m² 초과</option>
          </select>
          <select
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

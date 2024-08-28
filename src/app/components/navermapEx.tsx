"use client"

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Script from 'next/script';
import { createRoot } from 'react-dom/client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// 네이버 맵 타입 선언
declare global {
  interface Window {
    naver: any;
    MarkerClustering: any;
  }
}

// MapOptions 인터페이스 정의
interface MapOptions {
  center: any;
  zoom: number;
  minZoom: number;
  zoomControl: boolean;
  zoomControlOptions: {
    position: any;
  };
}

const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;

interface Apartment {
  complexNo: number;
  name: string;
  Address2: string;
  latitude: number;
  longitude: number;
  Area: number;
}

interface PriceData {
  Date: number;
  dealPriceMin: number;
  dealPriceMax: number;
  leasePriceMin: number;
  leasePriceMax: number;
}

interface PriceHistory {
  [complexNo: number]: PriceData[];
}

interface FilterState {
  minPrice: number;
  maxPrice: number;
  area: string;
  type: string;
}

const NaverMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const [map, setMap] = useState<any>(null);
  const [priceData, setPriceData] = useState<PriceHistory>({});
  const [filter, setFilter] = useState<FilterState>({ 
    minPrice: 0, 
    maxPrice: Infinity, 
    area: 'all', 
    type: 'all' 
  });
  const listenerRef = useRef<any>(null);

  const fetchApartmentsInView = useCallback(async (map: any) => {
    const bounds = map.getBounds();
    const sw = bounds.getSW();
    const ne = bounds.getNE();

    try {
      const response = await fetch(`http://localhost:3001/api/v1/apartments?minLat=${sw.lat()}&maxLat=${ne.lat()}&minLng=${sw.lng()}&maxLng=${ne.lng()}`);
      const apartments: Apartment[] = await response.json();
      return apartments;
    } catch (error) {
      console.error('Error fetching apartments:', error);
      return [];
    }
  }, []);

  const fetchPriceHistory = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/v1/price-history');
      const priceHistory: PriceHistory = await response.json();
      return priceHistory;
    } catch (error) {
      console.error('Error fetching price history:', error);
      return {};
    }
  }, []);

  const createMarkers = useCallback((apartments: Apartment[], priceHistory: PriceHistory) => {
    if (!map || !window.naver) return [];

    const { naver } = window;
    return apartments.map(apt => {
      const latestPrice = priceHistory[apt.complexNo]?.sort((a, b) => b.Date - a.Date)[0];
      if (!latestPrice) return null;

      if (latestPrice.dealPriceMin < filter.minPrice || latestPrice.dealPriceMax > filter.maxPrice) return null;
      if (filter.area !== 'all' && apt.Area !== parseInt(filter.area)) return null;
      if (filter.type === '매매' && !latestPrice.dealPriceMin) return null;
      if (filter.type === '전세' && !latestPrice.leasePriceMin) return null;

      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(apt.latitude, apt.longitude),
        map: map,
        title: apt.name,
        icon: {
          content: `<div style="background-color: #1E40AF; color: white; padding: 5px; border-radius: 50%; font-size: 10px;">${apt.name.substring(0, 2)}</div>`,
          anchor: new naver.maps.Point(15, 15)
        }
      });

      const infowindow = new naver.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 300px;">
            <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">${apt.name}</h3>
            <p style="font-size: 14px; margin-bottom: 5px;">${apt.Address2}</p>
            <p style="font-size: 12px; color: #666;">복합단지번호: ${apt.complexNo}</p>
            <p style="font-size: 14px; margin-top: 10px;">매매가: ${latestPrice.dealPriceMin}만원 ~ ${latestPrice.dealPriceMax}만원</p>
            <p style="font-size: 14px;">전세가: ${latestPrice.leasePriceMin}만원 ~ ${latestPrice.leasePriceMax}만원</p>
            <div id="priceChart-${apt.complexNo}" style="width: 100%; height: 200px;"></div>
          </div>
        `,
        maxWidth: 300,
        backgroundColor: "#fff",
        borderColor: "#1E40AF",
        borderWidth: 2,
        anchorSize: new naver.maps.Size(0, 0),
        pixelOffset: new naver.maps.Point(0, -20)
      });

      naver.maps.Event.addListener(marker, 'click', () => {
        if (infowindow.getMap()) {
          infowindow.close();
        } else {
          infowindow.open(map, marker);
          setTimeout(() => {
            const chartContainer = document.getElementById(`priceChart-${apt.complexNo}`);
            if (chartContainer && priceHistory[apt.complexNo]) {
              const root = createRoot(chartContainer);
              root.render(
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceHistory[apt.complexNo]}>
                    <XAxis dataKey="Date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="dealPriceMin" stroke="#8884d8" />
                    <Line type="monotone" dataKey="leasePriceMin" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              );
            }
          }, 0);
        }
      });

      return marker;
    }).filter(Boolean);
  }, [filter, map]);

  const updateMarkers = useCallback(async () => {
    if (!map) return;

    const clearMarkers = () => {
      markersRef.current.forEach(marker => {
        marker.setMap(null);
      });
      markersRef.current = [];
    };

    clearMarkers();

    const apartments = await fetchApartmentsInView(map);
    const newMarkers = createMarkers(apartments, priceData);
    markersRef.current = newMarkers;

    // 마커 클러스터링
    if (window.MarkerClustering) {
      new window.MarkerClustering({
        minClusterSize: 2,
        maxZoom: 13,
        map: map,
        markers: newMarkers,
        disableClickZoom: false,
        gridSize: 120,
        icons: [
          { content: '<div style="cursor:pointer;width:40px;height:40px;line-height:42px;font-size:10px;color:white;text-align:center;font-weight:bold;background:rgba(30, 64, 175, 0.8);border-radius:50%;">$[count]</div>', size: new window.naver.maps.Size(40, 40) },
          { content: '<div style="cursor:pointer;width:50px;height:50px;line-height:54px;font-size:12px;color:white;text-align:center;font-weight:bold;background:rgba(30, 64, 175, 0.8);border-radius:50%;">$[count]</div>', size: new window.naver.maps.Size(50, 50) },
          { content: '<div style="cursor:pointer;width:60px;height:60px;line-height:64px;font-size:14px;color:white;text-align:center;font-weight:bold;background:rgba(30, 64, 175, 0.8);border-radius:50%;">$[count]</div>', size: new window.naver.maps.Size(60, 60) }
        ]
      });
    }
  }, [map, fetchApartmentsInView, createMarkers]);

  useEffect(() => {
    if (!map) return;

    const fetchInitialData = async () => {
      const priceHistory = await fetchPriceHistory();
      setPriceData(priceHistory);
    };

    fetchInitialData();

    const handleIdle = () => {
      updateMarkers();
    };

    if (window.naver && window.naver.maps) {
      listenerRef.current = window.naver.maps.Event.addListener(map, 'idle', handleIdle);
    }

    return () => {
      if (listenerRef.current && window.naver && window.naver.maps) {
        window.naver.maps.Event.removeListener(listenerRef.current);
      }
    };
  }, [map, updateMarkers, fetchPriceHistory]);

  useEffect(() => {
    if (map) {
      updateMarkers();
    }
  }, [filter, updateMarkers, map]);

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.naver) return;

    const { naver } = window;
    const location = new naver.maps.LatLng(37.5666805, 126.9784147);
    const mapOptions: MapOptions = {
      center: location,
      zoom: 10,
      minZoom: 6,
      zoomControl: true,
      zoomControlOptions: {
        position: naver.maps.Position.TOP_RIGHT
      }
    };
    const newMap = new naver.maps.Map(mapRef.current, mapOptions);
    setMap(newMap);
  }, []);

  return (
    <>
      <Script 
        strategy="afterInteractive"
        type="text/javascript"
        src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${NAVER_CLIENT_ID}&submodules=geocoder`}
        onLoad={initializeMap}
      />
      <Script 
        strategy="afterInteractive"
        type="text/javascript"
        src="/MarkerClustering.js"
      />
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ padding: '10px', backgroundColor: '#f0f0f0' }}>
          <input 
            type="number" 
            placeholder="최소 가격" 
            onChange={(e) => setFilter(prev => ({ ...prev, minPrice: Number(e.target.value) }))}
          />
          <input 
            type="number" 
            placeholder="최대 가격" 
            onChange={(e) => setFilter(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
          />
          <select onChange={(e) => setFilter(prev => ({ ...prev, area: e.target.value }))}>
            <option value="all">모든 면적</option>
            <option value="60">60m² 이하</option>
            <option value="85">60m² ~ 85m²</option>
            <option value="135">85m² ~ 135m²</option>
            <option value="136">135m² 초과</option>
          </select>
          <select onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}>
            <option value="all">전체</option>
            <option value="매매">매매</option>
            <option value="전세">전세</option>
          </select>
        </div>
        <div ref={mapRef} style={{ flex: 1 }} />
      </div>
    </>
  );
};

export default NaverMap;
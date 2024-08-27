"use client"

import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom'; // Add this line
import Script from 'next/script';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;

const NaverMapEx = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [priceData, setPriceData] = useState({});
  const [filter, setFilter] = useState({ minPrice: 0, maxPrice: Infinity, area: 'all', type: 'all' });

  useEffect(() => {
    if (!map) return;

    const fetchData = async () => {
      try {
        const [apartmentsResponse, priceHistoryResponse] = await Promise.all([
          fetch('/api/apartments'),
          fetch('/api/price-history')
        ]);
        const apartments = await apartmentsResponse.json();
        const priceHistory = await priceHistoryResponse.json();
        return { apartments, priceHistory };
      } catch (error) {
        console.error('Error fetching data:', error);
        return { apartments: [], priceHistory: {} };
      }
    };

    const createMarkers = (apartments: any[], priceHistory: any) => {
      const { naver } = window as any;
      return apartments.map(apt => {
        const latestPrice = priceHistory[apt.complexNo]?.sort((a: any, b: any) => b.Date - a.Date)[0];
        if (!latestPrice) return null;

        if (latestPrice.dealPriceMin < filter.minPrice || latestPrice.dealPriceMax > filter.maxPrice) return null;
        if (filter.area !== 'all' && apt.Area !== filter.area) return null;
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
                ReactDOM.render(
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={priceHistory[apt.complexNo]}>
                      <XAxis dataKey="Date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="dealPriceMin" stroke="#8884d8" />
                      <Line type="monotone" dataKey="leasePriceMin" stroke="#82ca9d" />
                    </LineChart>
                  </ResponsiveContainer>,
                  chartContainer
                );
              }
            }, 0);
          }
        });

        return marker;
      }).filter(Boolean);
    };

    fetchData().then(({ apartments, priceHistory }) => {
      setPriceData(priceHistory);
      const newMarkers = createMarkers(apartments, priceHistory);
      setMarkers(newMarkers);

      // 마커 클러스터링
      const clusterer = new (window as any).MarkerClustering({
        minClusterSize: 2,
        maxZoom: 13,
        map: map,
        markers: newMarkers,
        disableClickZoom: false,
        gridSize: 120,
        icons: [
          { content: '<div style="cursor:pointer;width:40px;height:40px;line-height:42px;font-size:10px;color:white;text-align:center;font-weight:bold;background:rgba(30, 64, 175, 0.8);border-radius:50%;">$[count]</div>', size: new naver.maps.Size(40, 40) },
          { content: '<div style="cursor:pointer;width:50px;height:50px;line-height:54px;font-size:12px;color:white;text-align:center;font-weight:bold;background:rgba(30, 64, 175, 0.8);border-radius:50%;">$[count]</div>', size: new naver.maps.Size(50, 50) },
          { content: '<div style="cursor:pointer;width:60px;height:60px;line-height:64px;font-size:14px;color:white;text-align:center;font-weight:bold;background:rgba(30, 64, 175, 0.8);border-radius:50%;">$[count]</div>', size: new naver.maps.Size(60, 60) }
        ]
      });
    });

    return () => {
      markers.forEach(marker => {
        marker.setMap(null);
      });
    };
  }, [map, filter]);

  const initializeMap = () => {
    const { naver } = window as any;
    if (!mapRef.current || !naver) return;

    const location = new naver.maps.LatLng(37.5666805, 126.9784147);
    const mapOptions = {
      center: location,
      zoom: 10,
      minZoom: 6,
      zoomControl: true,
      zoomControlOptions: {
        position: naver.maps.Position.TOP_RIGHT
      }
    };
    const map = new naver.maps.Map(mapRef.current, mapOptions);
    setMap(map);
  };
  
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

export default NaverMapEx;

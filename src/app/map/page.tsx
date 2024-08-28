import dynamic from 'next/dynamic';

const NaverMapComponent = dynamic(() => import('../components/navermapEx'), { ssr: false });

export default function MapPage() {
  return (
    <div style={{ height: '100vh' }}>
      <NaverMapComponent />
    </div>
  );
}
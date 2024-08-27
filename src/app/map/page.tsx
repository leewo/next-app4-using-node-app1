import NaverMap from "../components/navermap";
import NaverMapEx from "../components/navermapEx";

export default function MapPage() {
  return (
    <div>
      {/* <NaverMap width="100%" height="500px" lat={37.5666805} lng={126.9784147} zoom={10} /> */}
      <NaverMapEx />
    </div>
  );
}
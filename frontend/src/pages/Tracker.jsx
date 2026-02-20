import { useParams } from "react-router-dom";
import { useRef } from "react";

import VideoCanvas from "../components/VideoCanvas";
import ControlPanel from "../components/ControlPanel";
import FPSCounter from "../components/FPSCounter";

export default function Tracker() {
  const { source } = useParams();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  return (
    <div className="tracker fade-in">
      <div className="navbar">AI Dynamic Tracker</div>

      <ControlPanel source={source} videoRef={videoRef} />
      <VideoCanvas videoRef={videoRef} canvasRef={canvasRef} />
      <FPSCounter />
    </div>
  );
} 
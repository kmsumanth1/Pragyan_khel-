import { useParams } from "react-router-dom";
import { useRef, useState, useEffect } from "react";

import ControlPanel from "../components/ControlPanel";
import VideoCanvas from "../components/VideoCanvas";

export default function Tracker() {
  const { source } = useParams();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [showAuth, setShowAuth] = useState(false);

  /* ================= CLEANUP CAMERA ON PAGE EXIT ================= */
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  /* =============================================================== */

  return (
    <div className="tracker fade-in">

      {/* ================= NAVBAR ================= */}
      <div className="navbar">
        <div className="nav-left">
          AI Dynamic Tracker
        </div>

        <div className="nav-right">
          <div
            className="profile-icon"
            onClick={() => setShowAuth(!showAuth)}
          >
            👤
          </div>

          {showAuth && (
            <div className="auth-dropdown">
              <button className="auth-btn">Login</button>
              <button className="auth-btn signup">Sign Up</button>
            </div>
          )}
        </div>
      </div>

      {/* ================= SOURCE LABEL ================= */}
      <div className="source-label">
        Source: <span>{source?.toUpperCase()}</span>
      </div>

      {/* ================= VIDEO AREA ================= */}
      <div className="video-section">
        <VideoCanvas
          videoRef={videoRef}
          canvasRef={canvasRef}
        />
      </div>

      {/* ================= CONTROLS ================= */}
      <ControlPanel
        source={source}
        videoRef={videoRef}
      />

    </div>
  );
} 
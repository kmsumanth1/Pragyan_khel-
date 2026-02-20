import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="hero fade-in">
      <h1>Simple Video Portal</h1>
      <div className="subtitle">AI SUBJECT TRACKING SYSTEM</div>

      <div className="cards">
        <div className="card" onClick={() => navigate("/tracker/webcam")}>
          <h3>Webcam</h3>
          <p>Use your device camera</p>
        </div>

        <div className="card" onClick={() => navigate("/tracker/upload")}>
          <h3>Upload</h3>
          <p>Select a video file</p>
        </div>

        <div className="card" onClick={() => navigate("/tracker/live")}>
          <h3>Live Stream</h3>
          <p>Enter stream URL</p>
        </div>
      </div>
    </div>
  );
} 
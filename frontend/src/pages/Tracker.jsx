import { useParams } from "react-router-dom";
import { useRef, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ControlPanel from "../components/ControlPanel";
import { AuthContext } from "../context/AuthContext";
import "../styles/theme.css"; // make sure this exists

export default function Tracker() {
  const { source } = useParams();
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  /* ================= AUTH ================= */
  const { user, login, logout } = useContext(AuthContext);
  const [showAuth, setShowAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5000/login", {
        email,
        password,
      });

      login(res.data.token);
      setShowAuth(false);
    } catch {
      alert("Login failed");
    }
  };

  /* ================= CLEANUP CAMERA ================= */
  useEffect(() => {
    return () => {
      const video = videoRef.current;
      if (!video) return;

      if (video.srcObject) {
        video.srcObject.getTracks().forEach((track) => track.stop());
        video.srcObject = null;
      }

      video.pause();
    };
  }, []);

  /* ================= WEBCAM AUTO START ================= */
  useEffect(() => {
    if (source === "webcam") {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          videoRef.current.srcObject = stream;
        })
        .catch(() => {
          alert("Unable to access webcam");
        });
    }
  }, [source]);

  return (
    <div className="tracker-page">

      {/* Top Right Profile */}
      <div className="nav-right">
        <div
          className="profile-icon"
          onClick={() => setShowAuth(!showAuth)}
        >
          👤
        </div>

        {showAuth && (
          <div className="auth-modal">
            {!user ? (
              <>
                <h3>Login</h3>
                <input
                  placeholder="Gmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button onClick={handleLogin}>Login</button>
              </>
            ) : (
              <>
                <p>Logged in</p>
                <button onClick={logout}>Logout</button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Main Purple Card */}
      <div className="tracker-card">

        {/* Video Display */}
        <div className="video-container">
          <video
            ref={videoRef}
            className="video-player"
            controls
            autoPlay
          />
          <canvas ref={canvasRef} className="video-canvas" />
        </div>

        {/* Upload Section */}
        {source === "upload" && (
          <div className="upload-section">
            <input
              type="file"
              accept="video/mp4"
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (file.type !== "video/mp4") {
                  alert("Video must be in .mp4 format");
                  return;
                }

                const videoURL = URL.createObjectURL(file);
                videoRef.current.srcObject = null;
                videoRef.current.src = videoURL;
              }}
            />
          </div>
        )}

        {/* Livestream Section */}
        {source === "livestream" && (
          <div className="livestream-section">
            <input
              type="text"
              placeholder="Paste livestream URL and press Enter"
              className="stream-input"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  videoRef.current.srcObject = null;
                  videoRef.current.src = e.target.value;
                }
              }}
            />
          </div>
        )}

        {/* Controls */}
        <ControlPanel source={source} videoRef={videoRef} />

      </div>
    </div>
  );
} 
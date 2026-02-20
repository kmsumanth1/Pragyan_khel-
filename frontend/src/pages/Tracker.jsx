import { useParams } from "react-router-dom";
import { useRef, useState, useEffect, useContext } from "react";
import axios from "axios";

import ControlPanel from "../components/ControlPanel";
import VideoCanvas from "../components/VideoCanvas";
import { AuthContext } from "../context/AuthContext";

export default function Tracker() {
  const { source } = useParams();

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

  /* ================= CLEANUP CAMERA ON PAGE EXIT ================= */
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        if (videoRef.current.srcObject) {
          const tracks = videoRef.current.srcObject.getTracks();
          tracks.forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
        videoRef.current.pause();
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
            <div className="auth-modal">

              {!user ? (
                <>
                  <h3>Login</h3>

                  <input
                    placeholder="Email"
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <input
                    type="password"
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <button onClick={handleLogin}>
                    Login
                  </button>
                </>
              ) : (
                <>
                  <p>Logged in</p>
                  <button onClick={logout}>
                    Logout
                  </button>
                </>
              )}

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
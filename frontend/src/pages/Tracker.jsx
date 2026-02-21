import { useParams } from "react-router-dom";
import { useRef, useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ControlPanel from "../components/ControlPanel";
import VideoCanvas from "../components/VideoCanvas";
import { AuthContext } from "../context/AuthContext";

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

  /* ================= CLEANUP CAMERA ON PAGE EXIT ================= */
 useEffect(() => {
  return () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }

    video.pause();
  };
}, []); 
  /* =============================================================== */
  /* =============================================================== */
return (
  <div className="tracker-container">

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

              <p
                className="forgot-link"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot Password?
              </p>
            </>
          ) : (
            <>
              <p>Logged in as {user}</p>
              <button onClick={logout}>Logout</button>
            </>
          )}
        </div>
      )}
    </div>

    {/* Video + Canvas */}
    <VideoCanvas videoRef={videoRef} canvasRef={canvasRef} />

    {/* Controls */}
    <ControlPanel source={source} videoRef={videoRef} />

  </div> 

); 
} 
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import "../styles/theme.css";

export default function Landing() {
  const navigate = useNavigate();
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

  return (
    <div className="landing">

      {/* Profile Icon */}
      <div className="profile-wrapper">
        <div
          className="profile-icon"
          onClick={() => setShowAuth(!showAuth)}
        >
          👤
        </div>

        {showAuth && (
          <div className="login-dropdown">
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

      {/* Hero Section */}
      <div className="hero">
        <h1>Simple Video Portal</h1>
        <p className="subtitle">AI SUBJECT TRACKING SYSTEM</p>

        <div className="card-container">

          <div
            className="source-card"
            onClick={() => navigate("/tracker/webcam")}
          >
            <div className="icon-box purple">📷</div>
            <h2>Webcam</h2>
            <p>Use your device camera</p>
          </div>

          <div
            className="source-card"
            onClick={() => navigate("/tracker/upload")}
          >
            <div className="icon-box gradient">⬆</div>
            <h2>Upload</h2>
            <p>Select a video file</p>
          </div>

          <div
            className="source-card"
            onClick={() => navigate("/tracker/livestream")}
          >
            <div className="icon-box pink">📡</div>
            <h2>Live Stream</h2>
            <p>Enter stream URL</p>
          </div>

        </div>

        <p className="footer-text">
          Select a source to begin AI-powered subject tracking
        </p>
      </div>

    </div>
  );
} 
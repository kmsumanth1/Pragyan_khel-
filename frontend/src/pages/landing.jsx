import { useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Landing() {
  
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate(); 
  const [showAuth, setShowAuth] = useState(false);

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
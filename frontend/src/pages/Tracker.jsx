import { useParams, useNavigate } from "react-router-dom";
import { useRef, useState, useEffect, useContext } from "react";
import axios from "axios";
import ControlPanel from "../components/ControlPanel";
import { AuthContext } from "../context/AuthContext";
import "../styles/theme.css";

export default function Tracker() {
  const { source } = useParams();
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const { user, login, logout } = useContext(AuthContext);

  const [showAuth, setShowAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [youtubeEmbed, setYoutubeEmbed] = useState(null);

  /* ================= AUTH ================= */

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

  /* ================= CLEANUP ================= */

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

  /* ================= WEBCAM ================= */

  useEffect(() => {
    if (source === "webcam") {
      setYoutubeEmbed(null);

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

  /* ================= STREAM HANDLER ================= */

  const handleStreamInput = (url) => {
    let videoId = null;

    try {
      // Standard YouTube link
      if (url.includes("youtube.com/watch")) {
        videoId = new URL(url).searchParams.get("v");
      }

      // Short YouTube link
      if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1].split("?")[0];
      }

      // Embed link
      if (url.includes("youtube.com/embed/")) {
        videoId = url.split("embed/")[1].split("?")[0];
      }

      if (videoId) {
        setYoutubeEmbed(`https://www.youtube.com/embed/${videoId}`);
        return;
      }

      // Otherwise treat as direct video link
      setYoutubeEmbed(null);
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
    } catch {
      alert("Invalid URL");
    }
  };

  /* ================= RENDER ================= */

  return (
    <div className="tracker-page">

      {/* PROFILE ICON */}
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

      {/* MAIN CARD */}
      <div className="tracker-card">

        {/* VIDEO AREA */}
        <div className="video-container">
          {youtubeEmbed ? (
            <iframe
              src={youtubeEmbed}
              width="700"
              height="400"
              className="video-player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="YouTube Video"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                className="video-player"
                controls
                autoPlay
              />
              <canvas
                ref={canvasRef}
                className="video-canvas"
              />
            </>
          )}
        </div>

        {/* UPLOAD SECTION */}
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

                setYoutubeEmbed(null);
                const videoURL = URL.createObjectURL(file);
                videoRef.current.srcObject = null;
                videoRef.current.src = videoURL;
              }}
            />
          </div>
        )}

        {/* LIVESTREAM SECTION */}
        {source === "livestream" && (
          <div className="livestream-section">
            <input
              type="text"
              placeholder="Paste MP4 or YouTube URL and press Enter"
              className="stream-input"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleStreamInput(e.target.value.trim());
                }
              }}
            />
          </div>
        )}

        {/* CONTROLS */}
        <ControlPanel source={source} videoRef={videoRef} />

      </div>
    </div>
  );
} 
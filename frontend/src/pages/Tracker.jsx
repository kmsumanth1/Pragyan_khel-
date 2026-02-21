import { useParams } from "react-router-dom";
import { useRef, useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import ControlPanel from "../components/ControlPanel";
import { AuthContext } from "../context/AuthContext";
import { initDetector, detectFrame } from "../ai/detector";
import "../styles/theme.css";

// ─── Helpers ────────────────────────────────────────────────
function boxDistance(box, point) {
  const bx = box.originX + box.width / 2;
  const by = box.originY + box.height / 2;
  return Math.hypot(bx - point.x, by - point.y);
}

function getNearestBox(boxes, point) {
  if (!boxes || boxes.length === 0) return null;
  return boxes.reduce((best, box) =>
    boxDistance(box, point) < boxDistance(best, point) ? box : best
  );
}

function iou(a, b) {
  const x1 = Math.max(a.originX, b.originX);
  const y1 = Math.max(a.originY, b.originY);
  const x2 = Math.min(a.originX + a.width,  b.originX + b.width);
  const y2 = Math.min(a.originY + a.height, b.originY + b.height);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  if (inter === 0) return 0;
  return inter / (a.width * a.height + b.width * b.height - inter);
}

function lerpBox(cur, tgt, t = 0.28) {
  return {
    originX: cur.originX + (tgt.originX - cur.originX) * t,
    originY: cur.originY + (tgt.originY - cur.originY) * t,
    width:   cur.width   + (tgt.width   - cur.width)   * t,
    height:  cur.height  + (tgt.height  - cur.height)  * t,
    label:   tgt.label,
  };
}

// ─── Spotlight Render ────────────────────────────────────────
function renderSpotlight(video, canvas, trackedBox, allBoxes = []) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  ctx.save();
  ctx.filter = "blur(14px)";
  ctx.drawImage(video, 0, 0, W, H);
  ctx.filter = "none";
  ctx.restore();

  ctx.fillStyle = "rgba(0,0,0,0.38)";
  ctx.fillRect(0, 0, W, H);

  if (trackedBox) {
    const { originX: x, originY: y, width: bw, height: bh } = trackedBox;
    const cx = x + bw / 2;
    const cy = y + bh / 2;
    const rx = bw / 2 + 30;
    const ry = bh / 2 + 30;

    const mask = new OffscreenCanvas(W, H);
    const mCtx = mask.getContext("2d");
    mCtx.save();
    mCtx.translate(cx, cy);
    mCtx.scale(rx, ry);
    const grad = mCtx.createRadialGradient(0, 0, 0, 0, 0, 1);
    grad.addColorStop(0,    "rgba(0,0,0,1)");
    grad.addColorStop(0.65, "rgba(0,0,0,1)");
    grad.addColorStop(1.0,  "rgba(0,0,0,0)");
    mCtx.fillStyle = grad;
    mCtx.beginPath();
    mCtx.arc(0, 0, 1, 0, Math.PI * 2);
    mCtx.fill();
    mCtx.restore();

    const sharp = new OffscreenCanvas(W, H);
    const sCtx  = sharp.getContext("2d");
    sCtx.drawImage(video, 0, 0, W, H);
    sCtx.globalCompositeOperation = "destination-in";
    sCtx.drawImage(mask, 0, 0);
    ctx.drawImage(sharp, 0, 0);

    const pad = 8;
    ctx.save();
    ctx.strokeStyle = "rgba(0,210,255,0.92)";
    ctx.lineWidth   = 3;
    ctx.shadowColor = "rgba(0,210,255,0.92)";
    ctx.shadowBlur  = 14;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - pad, y - pad, bw + pad * 2, bh + pad * 2, 8);
    else ctx.rect(x - pad, y - pad, bw + pad * 2, bh + pad * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.font        = "bold 13px monospace";
    ctx.fillStyle   = "rgba(0,210,255,0.92)";
    ctx.shadowColor = "rgba(0,210,255,0.92)";
    ctx.shadowBlur  = 8;
    ctx.fillText(
      `● TRACKING${trackedBox.label ? " · " + trackedBox.label : ""}`,
      x - pad, Math.max(y - pad - 6, 14)
    );
    ctx.restore();
  }

  allBoxes.forEach((box) => {
    if (trackedBox &&
      Math.abs(box.originX - trackedBox.originX) < 4 &&
      Math.abs(box.originY - trackedBox.originY) < 4) return;
    ctx.save();
    ctx.strokeStyle = "rgba(255,80,80,0.65)";
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(box.originX, box.originY, box.width, box.height);
    ctx.font      = "11px monospace";
    ctx.fillStyle = "rgba(255,80,80,0.85)";
    ctx.fillText(box.label || "", box.originX + 3, box.originY + 13);
    ctx.restore();
  });
}

// ─── Component ───────────────────────────────────────────────
export default function Tracker() {
  const { source } = useParams();

  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const animRef     = useRef(null);
  const clickRef    = useRef(null);
  const trackedRef  = useRef(null);
  const allBoxesRef = useRef([]);
  const loopRunning = useRef(false);

  const { user, login, logout } = useContext(AuthContext);
  const [showAuth, setShowAuth]         = useState(false);
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [youtubeEmbed, setYoutubeEmbed] = useState(null);
  const [isTracking, setIsTracking]     = useState(false);

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5000/login", { email, password });
      login(res.data.token);
      setShowAuth(false);
    } catch {
      alert("Login failed");
    }
  };

  // ── Render loop ──────────────────────────────────────────────
  const startLoop = useCallback(() => {
    if (loopRunning.current) return;
    loopRunning.current = true;

    const loop = async () => {
      const video  = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) {
        animRef.current = requestAnimationFrame(loop);
        return;
      }

      // Not ready — show waiting message on canvas
      if (video.readyState < 2 || video.videoWidth === 0) {
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#0d0d0d";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(0,210,255,0.5)";
        ctx.font = "15px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Waiting for video…", canvas.width / 2, canvas.height / 2);
        ctx.textAlign = "start";
        animRef.current = requestAnimationFrame(loop);
        return;
      }

      // Sync canvas to video resolution
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const boxes = await detectFrame(video);
      allBoxesRef.current = boxes;

      if (clickRef.current) {
        const nearest = getNearestBox(boxes, clickRef.current);
        trackedRef.current = nearest || null;
        setIsTracking(!!nearest);
        clickRef.current = null;
      }

      if (trackedRef.current && boxes.length > 0) {
        let best = null, bestScore = 0;
        boxes.forEach((b) => {
          const s = iou(trackedRef.current, b);
          if (s > bestScore) { bestScore = s; best = b; }
        });
        if (best && bestScore > 0.15) {
          trackedRef.current = lerpBox(trackedRef.current, best, 0.28);
        }
      }

      renderSpotlight(video, canvas, trackedRef.current, allBoxesRef.current);
      animRef.current = requestAnimationFrame(loop);
    };

    loop();
  }, []);

  useEffect(() => {
    initDetector().then(startLoop);
    return () => {
      cancelAnimationFrame(animRef.current);
      loopRunning.current = false;
    };
  }, [source, startLoop]);

  // ── Webcam — Tracker owns the stream ────────────────────────
  useEffect(() => {
    if (source !== "webcam") return;
    setYoutubeEmbed(null);
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        const video = videoRef.current;
        if (!video) return;
        if (video.srcObject) video.srcObject.getTracks().forEach((t) => t.stop());
        video.srcObject = stream;
        video.play().catch(() => {});
      })
      .catch(() => alert("Unable to access webcam"));
  }, [source]);

  useEffect(() => {
    return () => {
      const v = videoRef.current;
      if (!v) return;
      if (v.srcObject) { v.srcObject.getTracks().forEach((t) => t.stop()); v.srcObject = null; }
      v.pause();
    };
  }, []);

  const handleCanvasClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    clickRef.current = {
      x: (e.clientX - rect.left) * (canvas.width  / rect.width),
      y: (e.clientY - rect.top)  * (canvas.height / rect.height),
    };
  }, []);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    trackedRef.current = null;
    clickRef.current   = null;
    setIsTracking(false);
  }, []);

  const handleStreamInput = (url) => {
    let videoId = null;
    try {
      if (url.includes("youtube.com/watch"))  videoId = new URL(url).searchParams.get("v");
      if (url.includes("youtu.be/"))          videoId = url.split("youtu.be/")[1].split("?")[0];
      if (url.includes("youtube.com/embed/")) videoId = url.split("embed/")[1].split("?")[0];
      if (videoId) { setYoutubeEmbed(`https://www.youtube.com/embed/${videoId}`); return; }
      setYoutubeEmbed(null);
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
      videoRef.current.play().catch(() => {});
    } catch { alert("Invalid URL"); }
  };

  return (
    <div className="tracker-page">

      <div className="nav-right">
        <div className="profile-icon" onClick={() => setShowAuth(!showAuth)}>👤</div>
        {showAuth && (
          <div className="auth-modal">
            {!user ? (
              <>
                <h3>Login</h3>
                <input placeholder="Gmail" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button onClick={handleLogin}>Login</button>
              </>
            ) : (
              <><p>Logged in</p><button onClick={logout}>Logout</button></>
            )}
          </div>
        )}
      </div>

      <div className="tracker-card">
        <div className="video-container">
          {youtubeEmbed ? (
            <iframe
              src={youtubeEmbed}
              width="700" height="480"
              className="video-player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen title="YouTube Video"
            />
          ) : (
            // ── FIX: explicit px size on wrapper so canvas is visible ──
            <div style={{
              position: "relative",
              width: "700px",
              height: "480px",
              background: "#0d0d0d",
              borderRadius: "8px",
              overflow: "hidden",
              cursor: "crosshair",
            }}>
              {/* Video is hidden — only feeds pixel data to canvas */}
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{ display: "none" }}
              />

              {/* Canvas always 700×480, fills wrapper, receives clicks */}
              <canvas
                ref={canvasRef}
                width={700}
                height={480}
                style={{
                  position: "absolute",
                  top: 0, left: 0,
                  width: "100%",
                  height: "100%",
                  display: "block",
                }}
                onClick={handleCanvasClick}
                onContextMenu={handleContextMenu}
              />

              <div style={{
                position: "absolute", bottom: 10, left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(0,0,0,0.6)",
                color: "rgba(0,210,255,0.9)",
                fontSize: 12, fontFamily: "monospace",
                padding: "4px 12px", borderRadius: 6,
                pointerEvents: "none", whiteSpace: "nowrap", zIndex: 10,
              }}>
                {isTracking ? "● Tracking · Right-click to clear" : "Click any object to track it"}
              </div>
            </div>
          )}
        </div>

        {source === "upload" && (
          <div className="upload-section">
            <input type="file" accept="video/mp4" onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              if (file.type !== "video/mp4") { alert("Video must be in .mp4 format"); return; }
              setYoutubeEmbed(null);
              videoRef.current.srcObject = null;
              videoRef.current.src = URL.createObjectURL(file);
              videoRef.current.play().catch(() => {});
            }} />
          </div>
        )}

        {source === "livestream" && (
          <div className="livestream-section">
            <input type="text" placeholder="Paste MP4 or YouTube URL and press Enter"
              className="stream-input"
              onKeyDown={(e) => { if (e.key === "Enter") handleStreamInput(e.target.value.trim()); }}
            />
          </div>
        )}

        <ControlPanel source={source} videoRef={videoRef} />
      </div>
    </div>
  );
} 
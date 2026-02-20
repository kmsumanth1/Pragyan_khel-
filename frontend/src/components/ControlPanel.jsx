import Hls from "hls.js";
import { useEffect, useState } from "react";

export default function ControlPanel({ source, videoRef }) {

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= START WEBCAM ================= */
  const startWebcam = async () => {
    if (!videoRef?.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    } catch (err) {
      setError("Camera access denied.");
    }
  };

  /* ================= STOP WEBCAM ================= */
  const stopWebcam = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.srcObject) {
      const tracks = video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;
    }
  };

  /* ================= UPLOAD VIDEO ================= */
  const uploadVideo = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    stopWebcam(); // stop camera if running

    videoRef.current.src = URL.createObjectURL(file);
    videoRef.current.play();
  };

  /* ================= START LIVE ================= */
  const startLive = async (url) => {
    if (!url.includes(".m3u8")) {
      setError("Only .m3u8 streams supported.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const video = videoRef.current;
      if (!video) return;

      stopWebcam(); // stop webcam if active

      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play();
          setLoading(false);
        });
      } else {
        video.src = url;
        video.play();
        setLoading(false);
      }
    } catch (err) {
      setError("Failed to load stream.");
      setLoading(false);
    }
  };

  /* ================= PLAY / PAUSE ================= */
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    // If webcam stream is active → stop camera fully
    if (video.srcObject) {
      stopWebcam();
      return;
    }

    // For upload/live
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  /* ================= AUTO START WEBCAM ================= */
  useEffect(() => {
    if (source === "webcam") {
      startWebcam();
    }
  }, [source]);

  return (
    <div className="controls">

      {/* Webcam */}
      {source === "webcam" && (
        <button className="control-btn" onClick={startWebcam}>
          🎥 Start Webcam
        </button>
      )}

      {/* Upload */}
      {source === "upload" && (
        <label className="upload-btn">
          ⬆ Choose Video File
          <input type="file" hidden onChange={uploadVideo} />
        </label>
      )}

      {/* Live Stream */}
      {source === "live" && (
        <div className="live-wrapper">
          <input
            className="live-input"
            type="text"
            placeholder="Paste .m3u8 URL and press Enter"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                startLive(e.target.value);
              }
            }}
          />

          {loading && <div className="spinner"></div>}
          {error && <div className="error">{error}</div>}
        </div>
      )}

      {/* Play / Pause / Stop Camera */}
      <button className="control-btn" onClick={togglePlay}>
        ⏯ Play / Pause
      </button>

    </div>
  );
} 
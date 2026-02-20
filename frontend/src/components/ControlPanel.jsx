import Hls from "hls.js";
import { useEffect, useState } from "react";

export default function ControlPanel({ source, videoRef }) {

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const startWebcam = async () => {
    if (!videoRef?.current) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });

    videoRef.current.srcObject = stream;
    await videoRef.current.play();
  };

  const uploadVideo = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    videoRef.current.srcObject = null;
    videoRef.current.src = URL.createObjectURL(file);
    videoRef.current.play();
  };

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

      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play();
          setLoading(false);
        });
      }
    } catch (err) {
      setError("Failed to load stream.");
      setLoading(false);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  useEffect(() => {
    if (source === "webcam") {
      startWebcam();
    }
  }, [source]);

  return (
    <div className="controls">

      {source === "webcam" && (
        <button className="control-btn" onClick={startWebcam}>
          🎥 Start Webcam
        </button>
      )}

      {source === "upload" && (
        <label className="upload-btn">
          ⬆ Choose Video File
          <input type="file" hidden onChange={uploadVideo} />
        </label>
      )}

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

      {/* Play / Pause for ALL modes */}
      <button className="control-btn" onClick={togglePlay}>
        ⏯ Play / Pause
      </button>

    </div>
  );
} 
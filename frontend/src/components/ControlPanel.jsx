import Hls from "hls.js";

export default function ControlPanel({ source, videoRef }) {
  const startWebcam = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
    videoRef.current.play();
  };

  const uploadVideo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    videoRef.current.srcObject = null;
    videoRef.current.src = URL.createObjectURL(file);
    videoRef.current.play();
  };

  const startLive = (url) => {
    const video = videoRef.current;
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
    } else {
      video.src = url;
      video.play();
    }
  };

  return (
    <div className="controls">
      <button onClick={startWebcam}>Webcam</button>
      <input type="file" accept="video/mp4" onChange={uploadVideo} />
      <input
        type="text"
        placeholder="Paste .m3u8 URL"
        onKeyDown={(e) => {
          if (e.key === "Enter") startLive(e.target.value);
        }}
      />
    </div>
  );
} 
import { useEffect } from "react";
import useObjectDetection from "../hooks/useObjectDetection";
import useTracking from "../hooks/useTracking";
import { initSegmenter, runSegmentation } from "../services/segmentationService";

export default function VideoCanvas({ videoRef, canvasRef }) {
 const { detect } = useObjectDetection(videoRef);
  const { selected, smoothBox } = useTracking();

  useEffect(() => {
    initSegmenter(() => {});
  }, []);

  useEffect(() => {
    const loop = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || video.readyState !== 4) {
        requestAnimationFrame(loop);
        return;
      }

      const ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      await detect();
      await runSegmentation(video);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0);

      if (selected) {
        const box = smoothBox(selected);
        ctx.strokeStyle = "#00ff88";
        ctx.lineWidth = 3;
        ctx.strokeRect(...box);
      }

      requestAnimationFrame(loop);
    };

    loop();
  }, [selected, detect, smoothBox, videoRef, canvasRef]);

  return (
    <div className="video-container">
      {/* Hidden video used as source */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ display: "none" }}
      />

      <canvas ref={canvasRef} className="canvas" />
    </div>
  );
} 

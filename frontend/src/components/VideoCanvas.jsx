import { useEffect, useState } from "react";
import useObjectDetection from "../hooks/useObjectDetection";
import useTracking from "../hooks/useTracking";
import { initSegmenter, runSegmentation } from "../services/segmentationService";

export default function VideoCanvas({ videoRef, canvasRef }) {
  const { predictions, detect } = useObjectDetection(videoRef);
  const { selected, smoothBox } = useTracking();
  const [mask, setMask] = useState(null);

  useEffect(() => {
    initSegmenter((results) => {
      setMask(results.segmentationMask);
    });
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

      if (mask) {
        // Step 1: draw blurred background
        ctx.filter = "blur(15px)";
        ctx.drawImage(video, 0, 0);

        // Step 2: remove blur from subject
        ctx.filter = "none";
        ctx.globalCompositeOperation = "destination-atop";
        ctx.drawImage(mask, 0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "source-over";

        // Step 3: draw sharp subject
        ctx.drawImage(video, 0, 0);
      } else {
        ctx.drawImage(video, 0, 0);
      }

      if (selected) {
        const box = smoothBox(selected);
        ctx.strokeStyle = "#00ff88";
        ctx.lineWidth = 3;
        ctx.strokeRect(...box);
      }

      requestAnimationFrame(loop);
    };

    loop();
  }, [mask, selected]);

  return (
    <div className="video-container">
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
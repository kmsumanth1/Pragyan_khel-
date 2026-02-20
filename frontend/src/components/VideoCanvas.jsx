import { useEffect } from "react";
import useObjectDetection from "../hooks/useObjectDetection";
import useTracking from "../hooks/useTracking";
import { initSegmenter, runSegmentation } from "../services/segmentationService";

export default function VideoCanvas({ videoRef, canvasRef }) {
  const { predictions, detect } = useObjectDetection(videoRef);
  const { selected, setSelected, smoothBox } = useTracking();

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
  }, [selected]);

  return <canvas ref={canvasRef} className="canvas" />;
} 
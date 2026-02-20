import { useEffect } from "react";
import useObjectDetection from "../hooks/useObjectDetection";
import useTracking from "../hooks/useTracking";
import { initSegmenter, runSegmentation } from "../services/segmentationService";

export default function VideoCanvas({ videoRef, canvasRef }) {
  const { predictions, detect } = useObjectDetection(videoRef);
  const { selected, setSelected, smoothBox } = useTracking();

  useEffect(() => {
    initSegmenter();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const clicked = predictions?.find((pred) => {
        const [bx, by, bw, bh] = pred.bbox;
        return x > bx && x < bx + bw && y > by && y < by + bh;
      });

      if (clicked) {
        setSelected(clicked);
      }
    };

    canvas.addEventListener("click", handleClick);

    const loop = async () => {
      if (video.readyState !== 4) {
        requestAnimationFrame(loop);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      await detect();
      const maskCanvas = null; 

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (maskCanvas) {
        ctx.filter = "blur(18px)";
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        ctx.filter = "none";
        ctx.globalCompositeOperation = "destination-in";
        ctx.drawImage(maskCanvas, 0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "source-over";

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
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

    return () => {
      canvas.removeEventListener("click", handleClick);
    };
  }, [selected, predictions]);

  // ✅ THIS RETURN MUST BE OUTSIDE useEffect
  return (
    <>
      <video
        ref={videoRef}
        style={{ display: "none" }}
        playsInline
        autoPlay
      />
      <canvas ref={canvasRef} className="canvas" />
    </>
  );
} 
import { useRef, useEffect } from "react";
import { getModel } from "../../services/tfService";

function VideoContainer() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const setupCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    };
    setupCamera();
  }, []);

  useEffect(() => {
    const detectFrame = async () => {
      const model = getModel();
      if (!model || !videoRef.current) return;

      const predictions = await model.detect(videoRef.current);

      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, 640, 480);

      predictions.forEach((prediction) => {
        const [x, y, width, height] = prediction.bbox;

        ctx.strokeStyle = "lime";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        ctx.fillStyle = "lime";
        ctx.fillText(
          prediction.class + " " + Math.round(prediction.score * 100) + "%",
          x,
          y > 10 ? y - 5 : 10
        );
      });

      requestAnimationFrame(detectFrame);
    };

    videoRef.current?.addEventListener("loadeddata", detectFrame);
  }, []);

  return (
    <div style={{ position: "relative", textAlign: "center" }}>
      <video
        ref={videoRef}
        width="640"
        height="480"
        style={{ position: "absolute" }}
      />
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        style={{ position: "absolute" }}
      />
    </div>
  );
}

export default VideoContainer;
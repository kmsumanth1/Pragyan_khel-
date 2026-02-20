import { useRef, useEffect, useState } from "react";
import { getModel } from "../../services/tfService";

function VideoContainer() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [predictions, setPredictions] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);

  useEffect(() => {
    const setupCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    };
    setupCamera();
  }, []);

  useEffect(() => {
    let animationId;

    const detectFrame = async () => {
      const model = getModel();
      if (!model || !videoRef.current || videoRef.current.readyState !== 4) {
        animationId = requestAnimationFrame(detectFrame);
        return;
      }

      const results = await model.detect(videoRef.current);
      setPredictions(results);

      drawBoxes(results);

      animationId = requestAnimationFrame(detectFrame);
    };

    const drawBoxes = (results) => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, 640, 480);

      results.forEach((prediction, index) => {
        const [x, y, width, height] = prediction.bbox;

        // Highlight selected object
        if (selectedObject === index) {
          ctx.strokeStyle = "red";
          ctx.lineWidth = 4;
        } else {
          ctx.strokeStyle = "lime";
          ctx.lineWidth = 2;
        }

        ctx.strokeRect(x, y, width, height);

        ctx.fillStyle = "yellow";
        ctx.font = "16px Arial";
        ctx.fillText(
          `${prediction.class} ${Math.round(prediction.score * 100)}%`,
          x,
          y > 20 ? y - 5 : 20
        );
      });
    };

    detectFrame();

    return () => cancelAnimationFrame(animationId);
  }, [selectedObject]);

  // 🔥 Click handler
  const handleClick = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    predictions.forEach((prediction, index) => {
      const [x, y, width, height] = prediction.bbox;

      if (
        clickX >= x &&
        clickX <= x + width &&
        clickY >= y &&
        clickY <= y + height
      ) {
        setSelectedObject(index);
      }
    });
  };

  return (
    <div style={{ position: "relative", textAlign: "center" }}>
      <video
        ref={videoRef}
        width="640"
        height="480"
        style={{ position: "absolute", left: 0, top: 0 }}
      />
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        onClick={handleClick}
        style={{ position: "absolute", left: 0, top: 0 }}
      />
    </div>
  );
}

export default VideoContainer;
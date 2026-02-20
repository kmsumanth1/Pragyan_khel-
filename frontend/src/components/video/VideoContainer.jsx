import { useRef, useEffect, useState } from "react";
import { getModel } from "../../services/tfService";

function VideoContainer() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [predictions, setPredictions] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);

  // 🎥 Setup Camera
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

  // 🤖 Detection Loop
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

      drawFrame(results);

      animationId = requestAnimationFrame(detectFrame);
    };

    const drawFrame = (results) => {
      const ctx = canvasRef.current.getContext("2d");

      ctx.clearRect(0, 0, 640, 480);

      // 1️⃣ Draw blurred full frame
      ctx.filter = "blur(10px)";
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);
      ctx.filter = "none";

      // 2️⃣ If object selected → redraw sharp with soft edge
      if (selectedObject !== null && results[selectedObject]) {
        const [x, y, width, height] = results[selectedObject].bbox;

        // Create soft clipping region
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();

        ctx.drawImage(videoRef.current, 0, 0, 640, 480);
        ctx.restore();
      }
    };

    detectFrame();

    return () => cancelAnimationFrame(animationId);
  }, [selectedObject]);

  // 🖱 Click to select
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
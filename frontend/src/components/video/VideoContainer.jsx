import { useRef, useEffect, useState } from "react";
import { getModel } from "../../services/tfService";

function VideoContainer() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const personsRef = useRef([]);
  const selectedBoxRef = useRef(null);

  useEffect(() => {
    const setup = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      startLoop();
    };

    setup();
  }, []);

  const startLoop = () => {
    const ctx = canvasRef.current.getContext("2d");

    const loop = async () => {
      const model = getModel();

      if (!model || !videoRef.current || videoRef.current.readyState !== 4) {
        requestAnimationFrame(loop);
        return;
      }

      const detections = await model.detect(videoRef.current);
      const detectedPersons = detections.filter(
        (d) => d.class === "person"
      );

      personsRef.current = detectedPersons;

      ctx.clearRect(0, 0, 640, 480);

      ctx.drawImage(videoRef.current, 0, 0, 640, 480);

      // Draw selected region sharp
      if (selectedBoxRef.current) {
        const [x, y, w, h] = selectedBoxRef.current;

        ctx.drawImage(
          videoRef.current,
          x, y, w, h,
          x, y, w, h
        );
      }

      requestAnimationFrame(loop);
    };

    loop();
  };

  const handleClick = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    personsRef.current.forEach((person) => {
      const [x, y, w, h] = person.bbox;

      if (
        clickX >= x &&
        clickX <= x + w &&
        clickY >= y &&
        clickY <= y + h
      ) {
        selectedBoxRef.current = person.bbox;
      }
    });
  };

  return (
    <div style={{ textAlign: "center" }}>
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        onClick={handleClick}
      />
      <video
        ref={videoRef}
        width="640"
        height="480"
        style={{ display: "none" }}
      />
    </div>
  );
}

export default VideoContainer;
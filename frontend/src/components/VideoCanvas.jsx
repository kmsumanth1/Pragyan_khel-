import { useRef, useEffect } from "react";
import { initDetector, detectFrame } from "../ai/detector";

export default function VideoCanvas() {
  console.log("VideoCanvas mounted"); // ✅ ADD HERE

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
const spotlightRef = useRef(null); 
  useEffect(() => {
    async function setup() {
      console.log("Starting setup..."); // ✅ DEBUG

      const video = videoRef.current;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      video.srcObject = stream;
      await video.play();

      console.log("Camera started"); // ✅ DEBUG

      await initDetector();

      console.log("Camera + Detector Ready"); // ✅ DEBUG

      startLoop();
    }

    setup();

    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  const startLoop = () => {
  const loop = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || video.readyState !== 4) {
      animationRef.current = requestAnimationFrame(loop);
      return;
    }

    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0);

    const boxes = await detectFrame(video);

    boxes.forEach((box) => {
      ctx.strokeStyle = "red";
      ctx.lineWidth = 3;
      ctx.strokeRect(
        box.originX,
        box.originY,
        box.width,
        box.height
      );
    });

    animationRef.current = requestAnimationFrame(loop);
  };

  loop();

 
}; 
  rreturn (
  <div
    style={{ display: "inline-block" }}
    onClick={(e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      spotlightRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }}
  >
    <canvas ref={canvasRef} />
    <video
      ref={videoRef}
      muted
      playsInline
      style={{ display: "none" }}
    />
  </div> 
);
}  
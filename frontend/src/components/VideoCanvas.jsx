import { useRef, useEffect } from "react";
import { initDetector, detectFrame } from "../ai/detector";

export default function VideoCanvas() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const spotlightRef = useRef(null);

  useEffect(() => {
    let stream;

    async function setup() {
      try {
        const video = videoRef.current;

        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        video.srcObject = stream;
        await video.play();

        await initDetector();

        startLoop();
      } catch (err) {
        console.error("Setup error:", err);
      }
    }

    setup();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      cancelAnimationFrame(animationRef.current);
    };
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

      // 1️⃣ Draw blurred full frame
      ctx.save();
      ctx.filter = "blur(20px)";
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // 2️⃣ Clear spotlight region
      if (spotlightRef.current) {
        const { x, y } = spotlightRef.current;

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 150, 0, Math.PI * 2);
        ctx.clip();
        ctx.filter = "none";
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      // 3️⃣ Draw detection boxes on top
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

  return (
    <div
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        spotlightRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }}
      style={{ display: "inline-block" }}
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
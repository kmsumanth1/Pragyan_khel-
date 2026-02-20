import { useEffect, useState } from "react";

export default function FPSCounter() {
  const [fps, setFps] = useState(0);
  let frame = 0;
  let lastTime = performance.now();

  useEffect(() => {
    const loop = () => {
      frame++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frame);
        frame = 0;
        lastTime = now;
      }
      requestAnimationFrame(loop);
    };
    loop();
  }, []);

  return (
    <div style={{ marginTop: "10px" }}>
      FPS: {fps}
    </div>
  );
} 
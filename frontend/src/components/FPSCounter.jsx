import { useEffect, useRef, useState } from "react";

export default function FPSCounter() {
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const animationId = useRef(null);

  useEffect(() => {
    const loop = () => {
      frameCount.current++;
      const now = performance.now();

      if (now - lastTime.current >= 1000) {
        setFps(frameCount.current);
        frameCount.current = 0;
        lastTime.current = now;
      }

      animationId.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationId.current);
    };
  }, []);

  return (
    <div style={{ position: "fixed", bottom: 10, left: 10 }}>
      FPS: {fps}
    </div>
  );
} 
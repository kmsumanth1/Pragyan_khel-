import { useEffect, useRef, useState } from "react";

export default function FPSCounter() {
  const [fps, setFps] = useState(0);
 const frameRef = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const loop = () => {
       frameRef.current += 1;
      const now = performance.now();
       if (now - lastTimeRef.current >= 1000) {
        setFps(frameRef.current);
        frameRef.current = 0;
       animationId = requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
    };
     animationId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return <div style={{ marginTop: "10px" }}>FPS: {fps}</div>;
} 

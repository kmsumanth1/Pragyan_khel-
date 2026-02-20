import { useState, useRef } from "react";

export default function useTracking() {
  const [selected, setSelected] = useState(null);
  const smoothRef = useRef(null);

  const smoothBox = (box) => {
    if (!box) return;
    if (!smoothRef.current) {
      smoothRef.current = box.bbox;
      return box.bbox;
    }

    const alpha = 0.7;
    const prev = smoothRef.current;

    const smoothed = [
      alpha * prev[0] + (1 - alpha) * box.bbox[0],
      alpha * prev[1] + (1 - alpha) * box.bbox[1],
      alpha * prev[2] + (1 - alpha) * box.bbox[2],
      alpha * prev[3] + (1 - alpha) * box.bbox[3],
    ];

    smoothRef.current = smoothed;
    return smoothed;
  };

  return { selected, setSelected, smoothBox };
} 
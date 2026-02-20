import { useState, useEffect } from "react";
import { loadModel } from "../services/modelLoader";

export default function useObjectDetection(videoRef) {
  const [model, setModel] = useState(null);
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    loadModel().then(setModel);
  }, []);

  const detect = async () => {
    if (!model || !videoRef.current) return;
    const preds = await model.detect(videoRef.current);
    setPredictions(preds);
  };

  return { predictions, detect };
}
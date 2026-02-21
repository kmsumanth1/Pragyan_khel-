import { ObjectDetector, FilesetResolver } from "@mediapipe/tasks-vision";

let detector = null;
let timestamp = 0;

export async function initDetector() {
  console.log("Initializing MediaPipe Detector...");

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm"
  );

  detector = await ObjectDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite2/float16/1/efficientdet_lite2.tflite",
    },
    scoreThreshold: 0.5,
    runningMode: "VIDEO",
  });

  console.log("Detector ready");
}

export async function detectFrame(video) {
  if (!detector) {
    console.log("Detector not ready yet");
    return [];
  }

  const results = await detector.detectForVideo(video, performance.now());

  console.log("Detections:", results);

  return results?.detections
    ?.filter(d => d.categories[0].categoryName === "person")
    ?.map(d => d.boundingBox) || [];
}
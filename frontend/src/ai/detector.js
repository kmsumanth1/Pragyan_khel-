import { ObjectDetector, FilesetResolver } from "@mediapipe/tasks-vision";

let detector = null;

export async function initDetector() {
  if (detector) return;
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );
    detector = await ObjectDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
        delegate: "GPU",
      },
      scoreThreshold: 0.4,
      runningMode: "VIDEO",
    });
    console.log("✅ Detector ready");
  } catch (err) {
    console.error("❌ Detector init failed:", err);
  }
}

let lastTimestamp = -1;

export async function detectFrame(video) {
  if (!detector || video.readyState < 2) return [];
  const now = performance.now();
  if (now === lastTimestamp) return [];
  lastTimestamp = now;
  try {
    const result = detector.detectForVideo(video, now);
    return (result.detections || []).map((d) => ({
      originX: d.boundingBox.originX,
      originY: d.boundingBox.originY,
      width:   d.boundingBox.width,
      height:  d.boundingBox.height,
      label:   d.categories[0]?.categoryName ?? "object",
      score:   d.categories[0]?.score ?? 0,
    }));
  } catch {
    return [];
  }
} 
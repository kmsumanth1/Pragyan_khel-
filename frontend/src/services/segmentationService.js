import { SelfieSegmentation } from "@mediapipe/selfie_segmentation";

let segmenter;

export function initSegmenter(callback) {
  segmenter = new SelfieSegmentation({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
  });

  segmenter.setOptions({ modelSelection: 1 });
  segmenter.onResults(callback);
}

export async function runSegmentation(video) {
  if (!segmenter) return;
  await segmenter.send({ image: video });
} 
import { SelfieSegmentation } from "@mediapipe/selfie_segmentation";

let segmentation;

export function initSegmentation(onResults) {
  segmentation = new SelfieSegmentation({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
  });

  segmentation.setOptions({ modelSelection: 1 });
  segmentation.onResults(onResults);

  window.segmentation = segmentation; // IMPORTANT
}
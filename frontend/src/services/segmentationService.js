import { SelfieSegmentation } from "@mediapipe/selfie_segmentation";

let segmenter;

export function initSegmenter() {
  segmenter = new SelfieSegmentation({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
  });

  segmenter.setOptions({
    modelSelection: 1,
  });
}

export async function runSegmentation(video) {
  return new Promise((resolve) => {
    segmenter.onResults((results) => {
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = video.videoWidth;
      maskCanvas.height = video.videoHeight;

      const ctx = maskCanvas.getContext("2d");
      ctx.drawImage(results.segmentationMask, 0, 0);

      resolve(maskCanvas);
    });

    segmenter.send({ image: video });
  });
} 
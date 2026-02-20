import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

let model = null;

export const initializeTensorFlow = async () => {
  await tf.setBackend("webgl");
  await tf.ready();
  console.log("TensorFlow backend:", tf.getBackend());

  model = await cocoSsd.load();
  console.log("COCO-SSD model loaded");

  return model;
};

export const getModel = () => model;
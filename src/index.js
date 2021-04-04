import { Scene } from "three";
import { PerspectiveCamera } from "three";
import { WebGLRenderer } from "three";

const scene = new Scene();
const camera = new PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
console.log("hello")
document.body.appendChild(renderer.domElement);

import { Scene } from "three";
import { PerspectiveCamera } from "three";
import { WebGLRenderer } from "three";
import { BoxGeometry, MeshBasicMaterial, Mesh } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import Model from "./assets/cube.glb";

const scene = new Scene();
const camera = new PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new WebGLRenderer({alpha: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const loader = new GLTFLoader();

loader.load(
  Model,
  (gltf) => {
    scene.add(gltf.scene);
  },
  undefined,
  (error) => {
    console.error(error);
  }
);

camera.position.z = 5;

const animate = () => {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
};

animate();

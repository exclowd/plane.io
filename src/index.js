import { Scene } from "three";
import { PerspectiveCamera } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { WebGLRenderer } from "three";
import { AmbientLight, DirectionalLight } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Water } from "three/examples/jsm/objects/Water.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import GroundModel from "./assets/models/ground.glb";
import WaterNormal from "./assets/textures/water_normal.jpg";
import * as THREE from "three";

const scene = new Scene();
const camera = new PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);
const renderer = new WebGLRenderer();
renderer.setClearColor("#bffffd", 1);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new AmbientLight(0x404040, 3); // soft white light
const light2 = new DirectionalLight(0x404040, 1); // soft white light
light2.position.set(100, 100, -100);
scene.add(light);
scene.add(light2);

const loader = new GLTFLoader();

loader.load(
  GroundModel,
  (gltf) => {
    scene.add(gltf.scene);
    gltf.scene.scale.multiplyScalar(4);
    gltf.position.set(0, 0, 0);
  },
  undefined,
  (error) => {
    console.error(error);
  }
);

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(3, 4, 5);
controls.maxDistance = 1000;
controls.update();

const animate = () => {
  requestAnimationFrame(animate);

  controls.update();
  renderer.render(scene, camera);
};

animate();

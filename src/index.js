import { Clock, Scene, sRGBEncoding } from "three";
import { PerspectiveCamera } from "three";
import { AnimationMixer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { WebGLRenderer } from "three";
import { AmbientLight, DirectionalLight } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Water } from "three/examples/jsm/objects/Water.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import GroundModel from "./assets/models/ground.glb";
import CabinModel from "./assets/models/airplane/PUSHLIN_Enemy_Plane.glb";
import WaterNormal from "./assets/textures/water_normal.jpg";
import * as THREE from "three";

const scene = new Scene();
const camera = new PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);

const renderer = new WebGLRenderer({ antialias: true });
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = sRGBEncoding;
renderer.setClearColor("#bffffd", 1);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const clock = new Clock();

document.body.appendChild(renderer.domElement);

let mixer = null;

const light = new AmbientLight(0xffffff, 1); // soft white light
const light2 = new DirectionalLight(0xffffff, 2.5);
light2.position.set(20, 20, 0);
scene.add(light);
scene.add(light2);
const loader = new GLTFLoader();
// console.log(CabinBin)

loader.load(
  CabinModel,
  (gltf) => {
    const gltf_scene = gltf.scene || gltf.scenes[0];
    const clips = gltf.animations || [];
    mixer = new AnimationMixer(gltf_scene);
    clips.forEach((clip) => {
      mixer.clipAction(clip).reset().play();
    });

    scene.add(gltf_scene);

    // gltf.scene.scale.multiplyScalar(1);

    gltf.scene.position.set(0, 0, 0);
  },
  undefined,
  (error) => {
    console.error(error);
  }
);

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 2, -2);
controls.maxDistance = 1000;
controls.update();

const animate = () => {
  requestAnimationFrame(animate);

  mixer && mixer.update(clock.getDelta());
  controls.update();
  renderer.render(scene, camera);
};

animate();

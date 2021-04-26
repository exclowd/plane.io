import {
  Clock,
  Quaternion,
  Scene,
  sRGBEncoding,
  WebGLRenderer,
  PerspectiveCamera,
  AmbientLight,
  DirectionalLight,
  Vector3,
  PointLight,
  FogExp2
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ConvexObjectBreaker } from "three/examples/jsm/misc/ConvexObjectBreaker";
import { Plane } from "./plane.js";
import { Level } from "./level.js";

import "./styles/main.css";

const scene = new Scene();
const camera = new PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);

// Declare the rendrer
const renderer = new WebGLRenderer({ antialias: true });
renderer.outputEncoding = sRGBEncoding;
renderer.setClearColor(0xffffff, 1);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// clock for timing events
const clock = new Clock();
// attach the render to the dom
document.body.appendChild(renderer.domElement);

// Fog effect so that farther things are not seen
// const fog = new FogExp2(0x1a1a1a, 0.3);
// scene.add(fog)
// Lighting for the scene
const light = new AmbientLight(0xffffff, 1); // soft white light
const light2 = new PointLight(0xffffff, 1, 100);
// light2.position.set(5, 10, 7.5);
scene.add(light);
scene.add(light2);

// Initalize camera controls
// const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 2, 6);
camera.lookAt(0, 0, -1000);
// controls.maxDistance = 1000;
// controls.update();

// Plane
const plane = new Plane(
  scene,
  new Vector3(0, 0, 0),
  new Vector3(12, 12, 24),
  new Quaternion()
);

// level
const level = new Level(scene, new Vector3());

const render = () => {
  const dt = clock.getDelta();
  plane.update(dt);
  if (plane.state.active) {
    camera.position.addVectors(plane.obj.position, new Vector3(0, 2, 6));
    light2.position.addVectors(plane.obj.position, new Vector3(0,1,0));
  }
  renderer.render(scene, camera);
};

const animate = () => {
  requestAnimationFrame(animate);
  // controls.update();
  render();
};

animate();

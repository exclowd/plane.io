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
renderer.setSize(window.innerWidth - 16, window.innerHeight - 16);
document.body.appendChild(renderer.domElement);

// const light = new AmbientLight(0x404040, 3); // soft white light
// const light2 = new DirectionalLight(0x404040, 1); // soft white light
// light2.position.set(100, 100, -100);
// scene.add(light);
// scene.add(light2);

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

let sun = new THREE.Vector3();

const waterGeometry = new THREE.PlaneGeometry(1000, 1000);

let water = new Water(waterGeometry, {
  textureWidth: 512,
  textureHeight: 512,
  waterNormals: new THREE.TextureLoader().load(WaterNormal, (texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  }),
  sunDirection: new THREE.Vector3(),
  sunColor: 0xffffff,
  waterColor: 0x001e0f,
  distortionScale: 3.7,
  position: (0, -100, 0),
  fog: scene.fog !== undefined,
});

water.rotation.x = -Math.PI / 2;

scene.add(water);

const sky = new Sky();
sky.scale.setScalar(1000000);
scene.add(sky);

const skyUniforms = sky.material.uniforms;

skyUniforms["turbidity"].value = 0;
skyUniforms["rayleigh"].value = 0.208;
skyUniforms["mieCoefficient"].value = 0.005;
skyUniforms["mieDirectionalG"].value = 0.8;
skyUniforms["exposure"].value = 0.1929;

const pmremGenerator = new THREE.PMREMGenerator(renderer);

function updateSun() {
  const theta = Math.PI * (0.3661 - 0.5);
  const phi = 2 * Math.PI * (0.2691 - 0.5);

  sun.x = Math.cos(phi);
  sun.y = Math.sin(phi) * Math.sin(theta);
  sun.z = Math.sin(phi) * Math.cos(theta);

  sky.material.uniforms["sunPosition"].value.copy(sun);
  water.material.uniforms["sunDirection"].value.copy(sun).normalize();

  scene.environment = pmremGenerator.fromScene(sky).texture;
}

updateSun();


const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(3, 4, 5);
controls.maxDistance = 100;
controls.update();

const animate = () => {
  requestAnimationFrame(animate);
  water.material.uniforms["time"].value += 1.0 / 60.0;

  controls.update();
  renderer.render(scene, camera);
};

animate();

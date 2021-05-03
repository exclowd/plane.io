import {
  Clock,
  Quaternion,
  Scene,
  sRGBEncoding,
  WebGLRenderer,
  PerspectiveCamera,
  DirectionalLight,
  AnimationMixer,
  PointLight,
  PCFSoftShadowMap,
  ClampToEdgeWrapping,
  Vector3,
  FogExp2,
  AmbientLight,
  PlaneBufferGeometry,
  Geometry,
  Raycaster,
  ArrowHelper,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ConvexObjectBreaker } from "three/examples/jsm/misc/ConvexObjectBreaker";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GlitchPass } from "three/examples/jsm/postprocessing/GlitchPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";

import { keys } from "./input.js";

const loader = new GLTFLoader();

// Declare the rendrer
const renderer = new WebGLRenderer({ antialias: true });
renderer.outputEncoding = sRGBEncoding;
renderer.setClearColor(0xffffff, 1);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

let FRAME = 0;
// clock for timing events
const clock = new Clock();
// attach the render to the dom
let canvas = renderer.domElement;
document.body.appendChild(canvas);

const camera = new PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// effect composer
const composer = new EffectComposer(renderer);

// Initialize Camera
camera.position.set(0, 0, 0);
camera.lookAt(0, 0, -1000);

import PlaneModel from "./assets/models/airplane/Enemy_Plane_box.glb";
import BulletModel from "./assets/models/bullet/bullet.glb";

/**
 * Plane class for managing the plane model
 *
 */
class Plane {
  constructor(scene, pos = new Vector3(), vel = new Vector3()) {
    this.parent = scene;
    // states ['unloaded', 'normal', 'shoot']
    this.state = {
      active: false,
    };
    this.animations = [];
    this.position = pos;
    this.speed = vel;
    this.aR = new Quaternion();
    this.load();
  }

  load() {
    loader.load(
      PlaneModel,
      (gltf) => {
        const object = gltf.scene || gltf.scenes[0];
        this.animations = gltf.animations;
        this.obj = object.clone();
        this.obj.position.copy(this.position);
        console.log(`this.obj`, this.obj);
        // this.obj.rotateY(Math.PI);
        this.aR.copy(this.obj.quaternion);
        // this.obj.children[0].visible = false;
        this.box = this.obj.children[0];
        console.log(`this.obj`, this.obj);
        this.start();
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (error) => {
        console.error("Error Importing Plane Model", error);
      }
    );

    loader.load(
      BulletModel,
      (gltf) => {
        const object = gltf.scene || gltf.scenes[0];
        this.bullet = object.clone();
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (error) => {
        console.error("Error Importing Bullet Model", error);
      }
    );
  }

  start() {
    this.mixer = new AnimationMixer(this.obj);
    const clips = this.animations || [];
    clips.forEach((clip) => {
      if (clip.name != "roll") {
        this.mixer.clipAction(clip).reset().play();
      }
    });
    this.state.active = true;
    this.parent.add(this.obj);
  }

  shoot_bullet() {}
  // keep movement and rotation different
  // * movement would be strafing and forward speed is constant
  // * rotation would only be when we are moving
  // * when one is done moving the plane would rotate towards the base forward axis

  update_position(dt) {
    if (!this.state.active) return;
    this.mixer && this.mixer.update(dt);
    const dx = this.speed.x * dt;
    const dy = this.speed.y * dt;
    const dz = this.speed.z * dt;
    let suc = 0;
    if (keys["ArrowLeft"]) {
      suc = 1;
      this.obj.translateX(-dx);
      this.obj.rotateZ(0.03);
    }
    if (keys["ArrowUp"]) {
      suc = 1;
      this.obj.translateY(dy);
      this.obj.rotateX(0.03);
    }
    if (keys["ArrowRight"]) {
      suc = 1;
      this.obj.translateX(dx);
      this.obj.rotateZ(-0.03);
    }
    if (keys["ArrowDown"]) {
      suc = 1;
      this.obj.translateY(-dy);
      this.obj.rotateX(-0.03);
    }
    if (!suc) {
      this.obj.quaternion.slerp(this.aR, 0.05);
    }
    this.obj.translateZ(-dz);
  }

  update(dt) {
    this.update_position(dt);
  }
}

import Level1Model from "./assets/models/level/rainbow_road4.glb";

/**
 * Level class for handling level wide details
 * The rainbow road model
 */
class LevelOne {
  constructor() {
    this.scene = new Scene();
    // states ['unloaded', 'normal', 'shoot']
    this.state = {
      active: false,
      done: false,
    };

    // Renderer settings
    renderer.shadowMap.enabled = false;

    // Fog effect so that farther things are not seen
    const fog = new FogExp2(0xffffff, 0.003);
    this.scene.fog = fog;

    // Lighting for the scene
    this.light = new AmbientLight(0xffffff, 1); // soft white light
    // this.light2 = new PointLight(0xffffff, 0.7, 400);
    this.light3 = new DirectionalLight(0xffffff, 40);
    this.light3.position.set(0, 0, -2000);
    // this.light2.position.set(5, 10, 7.5);
    this.scene.add(this.light);
    // this.scene.add(this.light2);
    this.collidableMeshList = [];
    // composer settings
    this.renderPass = new RenderPass(this.scene, camera);
    composer.addPass(this.renderPass);
    this.glitchPass = new GlitchPass();
    this.glitchPass.curF = 10;
    composer.addPass(this.glitchPass);

    // Load the the model
    this.load();

    // Load the plane
    this.plane = new Plane(
      this.scene,
      new Vector3(0, 0, 0),
      new Vector3(12, 12, 24)
    );

    this.update.bind(this);
    this.check_collision.bind(this);
  }

  load() {
    // Load Level Model
    loader.load(
      Level1Model,
      (gltf) => {
        const group = gltf.scene || gltf.scenes[0];
        this.obj = group.clone();
        this.start();
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (error) => {
        console.error("Error Importing Level Model", error);
      }
    );
  }

  start() {
    this.state.active = true;
    this.collidableMeshList = this.obj.children.filter((mesh, index, arr) => {
      return mesh.name !== "tunnel" || mesh.name != "Plane";
    });
    console.log(`this.collidableMeshList`, this.collidableMeshList);
    // I would want to defer this so as to save memory
    this.scene.add(this.obj);
  }

  check_collision() {
    if (this.plane.box == undefined) {
      return;
    }

    let temp = this.plane.box.geometry.attributes.position.array;
    let vertices = [];
    for (let i = 0; i < temp.length; i += 3) {
      vertices.push({ x: temp[i], y: temp[i + 1], z: temp[i + 2] });
    }
    temp = this.plane.box.geometry.attributes.normal.array;
    for (let i = 0; i < temp.length; i += 3) {
      vertices.push({ x: temp[i], y: temp[i + 1], z: temp[i + 2] });
    }
    const raycaster = new Raycaster();
    raycaster.near = 0;
    raycaster.far = 10;
    let obj = [];
    for (let x of vertices) {
      let local = new Vector3(x.x, x.y, x.z);
      let global = local.clone();
      global.applyMatrix4(this.plane.obj.matrix);
      let dir = global.sub(this.plane.obj.position).clone().normalize();
      raycaster.set(this.plane.obj.position, dir);
      let collisionResults = raycaster.intersectObjects(
        this.collidableMeshList,
        true
      );
      if (collisionResults.length > 0) {
        collisionResults.forEach((result) => {
          if (result.distance < 0.4) {
            obj.push(result.object);
          }
        });
      }
    }
    let unique = [...new Set(obj)];
    unique.forEach((object) => {
      console.log(`object`, object)
    })
  }

  update(dt) {
    if (!this.state.active) {
      return;
    }

    // Update plane postion and rotation
    this.plane.update(dt);

    if (this.plane.state.active) {
      // if (this.plane.obj.position.z >= -50) {
      //   this.glitchPass.goWild = true;
      // } else
      if (this.plane.obj.position.z <= -2000) {
        this.end();
        return;
      }
      //  else if (this.plane.obj.position.z <= -1900) {
      //   this.glitchPass.goWild = true;
      // } else {
      //   this.glitchPass.goWild = false;
      // }
    }
    // Update the objects position
    let ufoSpeed = 12;
    let objSpeed = 1;
    this.obj.children.forEach((mesh) => {
      if (!mesh.name.startsWith("battery") && mesh.name !== "tunnel") {
        if (mesh.name.startsWith("ufo")) {
          if (mesh.position.distanceTo(this.plane.obj.position) < 200) {
            mesh.position.lerp(this.plane.obj.position, dt / 5);
          }
        } else if (mesh.name !== "Plane") {
          mesh.position.add(new Vector3(0, 0, dt * objSpeed));
        }
      } else if (mesh.name === "tunnel") {
        mesh.rotateZ(dt / 4);
      }
    });

    // Do collision logic
    this.check_collision();

    // Update Camera position
    if (this.plane.state.active) {
      camera.position.addVectors(
        this.plane.obj.position,
        new Vector3(0, 0, 12)
      );
    }
  }

  end() {
    this.state.active = false;
    this.state.done = true;
    this.scene.remove(this.plane.obj);
    this.scene.remove(this.obj);
    composer.removePass(this.glitchPass);
    composer.removePass(this.renderPass);
  }
}

import Level2Model from "./assets/models/level/rocky-alien-level-3.glb";
/**
 * Level class for handling level wide details
 * The cave level
 */
class LevelTwo {
  constructor() {
    this.scene = new Scene();
    // states ['unloaded', 'normal', 'shoot']
    this.state = {
      active: false,
      done: false,
    };

    // Renderer settings
    renderer.setClearColor(0x000000, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;

    // // Fog effect so that farther things are not seen
    const fog = new FogExp2(0x0a0a0a, 0.003); // dark shadow
    this.scene.fog = fog;

    // Lighting for the scene
    this.light = new AmbientLight(0xffffff, 0.03); // soft white light
    this.light2 = new PointLight(0xffffaa, 0.7, 400);
    this.light2.position.set(5, 10, 7.5);
    this.light2.castShadow = true;
    this.scene.add(this.light);
    this.scene.add(this.light2);

    // composer settings
    this.renderPass = new RenderPass(this.scene, camera);
    composer.addPass(this.renderPass);
    // this.outlinePass = new OutlinePass();
    // composer.addPass(this.outlinePass);

    // Load the the model
    this.load();

    // Load the plane
    this.plane = new Plane(
      this.scene,
      new Vector3(0, 0, 0),
      new Vector3(12, 12, 24)
    );
  }

  load() {
    // Load Level Model
    loader.load(
      Level2Model,
      (gltf) => {
        const group = gltf.scene || gltf.scenes[0];
        this.obj = group.clone();
        this.obj.children.forEach((mesh) => {
          if (mesh.name === "mineshaft") {
            mesh.receiveShadow = true;
          } else {
            mesh.castShadow = true;
          }
          console.log(`mesh.layers`, mesh.layers);
        });
        this.obj.position.add(new Vector3(0, 0, 0));
        this.start();
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (error) => {
        console.error("Error Importing Level Model", error);
      }
    );
  }

  start() {
    this.state.active = true;
    // I would want to defer this so as to save memory
    this.scene.add(this.obj);
  }

  update(dt) {
    if (!this.state.active) {
      return;
    }
    // Update plane postion and rotation
    this.plane.update(dt);
    this.light2.position.addVectors(
      this.plane.obj.position,
      new Vector3(0, 1, 0)
    );
    if (this.plane.state.active && this.plane.obj.position.z <= -2000) {
      this.end();
      return;
    }
    let ufoSpeed = 12;
    let objSpeed = 6;
    this.obj.children.forEach((mesh) => {
      if (
        mesh.name.startsWith("ufo") &&
        mesh.position.distanceTo(this.plane.obj.position) < 200
      ) {
        mesh.position.lerp(this.plane.obj.position, dt / 5);
      }
    });

    // Do collision logic

    // Update Camera position
    if (this.plane.state.active) {
      camera.position.addVectors(this.plane.obj.position, new Vector3(0, 2, 6));
    }
  }

  end() {
    this.state.active = false;
    this.state.done = true;
    this.scene.remove(this.plane.obj);
    this.scene.remove(this.obj);
    // composer.removePass(this.outlinePass);
    composer.removePass(this.renderPass);
  }
}

import "./styles/main.css";

class Hud {
  constructor(canvas, player) {
    console.log("player :>> ", player);
    this.hud = document.createElement("canvas");
    this.hud.style.zIndex = 10;
    this.hud.style.position = "absolute";
    this.hud.style.left = 0;
    this.hud.style.top = 0;
    this.hud.width = canvas.width;
    this.hud.height = canvas.height;
    this.ctx = this.hud.getContext("2d");
    this.player = player;
    // this.ctx.font = "30px Comic Sans MS";
    // this.ctx.fillStyle = "red";
    // this.ctx.textAlign = "center";
    // this.ctx.fillText("Hello World", canvas.width / 2, canvas.height / 2);
    // this.ctx.textAlign = "left";
    // this.ctx.fillText("Hello World", 1, 30);
    this.clear();
    document.body.appendChild(this.hud);
    setInterval(this.update.bind(this), 100);
  }

  clear() {
    this.ctx.clearRect(0, 0, this.hud.width, this.hud.height);
  }

  show_health_bar() {
    let thickness = 20;
    let width = 300;
    let x = this.hud.width / 2,
      y = this.hud.height - 30;
    let per = this.player.state.health;
    this.ctx.beginPath();
    this.ctx.rect(x - width / 2, y, width * (per / 100), thickness);
    if (per > 63) {
      this.ctx.fillStyle = "green";
    } else if (per > 37) {
      this.ctx.fillStyle = "gold";
    } else if (per > 13) {
      this.ctx.fillStyle = "orange";
    } else {
      this.ctx.fillStyle = "red";
    }
    this.ctx.closePath();
    this.ctx.fill();
  }

  show_bullet_count() {}

  show_distance() {}

  show_tooltips(pos) {}

  update() {
    this.clear();
    this.show_health_bar();
  }
}

export class Player {
  constructor() {
    this.state = {
      level: 1,
      active: false,
      health: 100,
      bullets: 0,
      distance: 0,
    };
  }

  start() {
    this.state.active = true;
    this.level = new LevelOne();
  }

  next_level() {
    this.state.health = 100;
    this.state.level = 2;
    this.level = new LevelTwo();
  }

  update() {
    this.state.health -= 0.05;
    this.state.health = Math.max(this.state.health, 0);
    if (this.level.state.done) {
      if (this.state.level === 1) {
        this.next_level();
      } else {
        cancelAnimationFrame(FRAME);
      }
    }
  }
}

const player = new Player();
player.start();
const hud = new Hud(renderer.domElement, player);

const render = () => {
  const dt = clock.getDelta();
  if (player.state.active) {
    player.level.update(dt);
  }
  player.update();
  composer.render(player.level.scene, camera);
};

const animate = () => {
  FRAME = requestAnimationFrame(animate);  
  // controls.update();
  render();
};

animate();

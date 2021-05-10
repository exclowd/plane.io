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
import BulletModel from "./assets/models/bullet/untitled.glb";

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
        this.box = this.obj.children[0];
        this.box.visible = false;
        console.log(`this.box`, this.box);
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
  constructor(player) {
    this.scene = new Scene();
    // states ['unloaded', 'normal', 'shoot']
    this.state = {
      active: false,
      done: false,
    };

    // Renderer settings
    renderer.shadowMap.enabled = false;
    this.player = player;
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
      new Vector3(0, 0, -10),
      new Vector3(12, 12, 24)
    );

    this.bullets = [];

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
        console.log(`level this.obj`, this.obj)
        this.start();
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (error) => {
        console.error("Error Importing Level Model", error);
      }
    );

    loader.load(
      BulletModel,
      (gltf) => {
        const object = gltf.scene || gltf.scenes[0];
        this.bullet = object.clone();
        console.log(`this.bullet`, this.bullet);
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
    this.state.active = true;
    this.collidableMeshList = this.obj.children.filter((mesh, index, arr) => {
      return mesh.name != "tunnel" && mesh.name != "Plane";
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
    for (let object of unique) {
      if (object.name.startsWith("Cylinder")) {
        this.player.state.health = Math.min(this.player.state.health + 5, 100);
        object.visible = false;
      } else {
        this.player.gameover()
      }
    }
    obj = []
    this.bullets.forEach((bull) => {
      let dir = new Vector3(0, 0, -1)
      dir.applyQuaternion(bull.quaternion)
      raycaster.set(bull.position, dir);
      let collisionResults = raycaster.intersectObjects(
        this.collidableMeshList,
        true
      );
      if (collisionResults.length > 0) {
        collisionResults.forEach((result) => {
          if (result.distance < 1) {
            obj.push(result.object);
          }
        });
        // bull.visible = false
      }
    })

    unique = [...new Set(obj)];
    // console.log(`object`, object)
    for (let object of unique) {
      if (object.name.startsWith("buffer-0-mesh")) {
        console.log(`object`, object)
        object.parent.visible = false;
        this.scene.remove(object.parent)
      }
    }
  }

  update(dt) {
    if (!this.state.active) {
      return;
    }

    // Update plane postion and rotation
    this.plane.update(dt);

    if (this.plane.state.active) {
      if (this.plane.obj.position.z >= -50) {
        this.glitchPass.goWild = true;
      } else if (this.plane.obj.position.z <= -2000) {
        this.end();
        return;
      } else if (this.plane.obj.position.z <= -1900) {
        this.glitchPass.goWild = true;
      } else {
        this.glitchPass.goWild = false;
      }
    }

    // Release the bullet
    if (keys[" "] && this.player.state.bullets) {
      let bull = this.bullet.clone();
      bull.position.addVectors(
        this.plane.obj.position,
        new Vector3(0, 0, -1).applyQuaternion(this.plane.obj.quaternion)
      );
      bull.quaternion.copy(this.plane.obj.quaternion);
      this.bullets.push(bull);
      this.player.state.bullets -= 1
      this.scene.add(bull);
      keys[" "] = false;
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
        mesh.rotateZ(dt / 2);
      }
    });
    this.bullets.forEach((bullet) => {
      bullet.translateZ(-30 * dt);
      if (bullet.position.distanceTo(this.plane.obj.position) >= 100) {
        this.scene.remove(bullet);
      }
    });

    // Do collision logic
    this.check_collision();
    this.bullets = this.bullets.filter((bull) => {
      return bull.visible && bull.position.distanceTo(this.plane.obj.position) < 100;
    });

    this.collidableMeshList = this.collidableMeshList.filter((obj) => {
      return obj.visible
    })

    this.player.state.distance = -1 * Math.round(this.plane.obj.position.z);

    // Update Camera position
    if (this.plane.state.active) {
      camera.position.addVectors(this.plane.obj.position, new Vector3(0, 2, 8));
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

    this.font = new FontFace('gamery', 'url("https://fonts.gstatic.com/s/pressstart2p/v9/e3t4euO8T-267oIAQAu6jDQyK3nVivM.woff2")')

    this.font.load().then((font) => {
      document.fonts.add(font);
      this.ctx.font = "bold 18px gamery"
    });

    this.overlay = document.createElement("div");
    this.overlay.style.zIndex =11;
    this.overlay.style.position = "absolute";
    this.overlay.style.right = "10px";
    this.overlay.style.top = "10px";
    this.overlay.style.padding = "10px";
    this.overlay.style.backgroundColor = "white";
    this.overlay.style.borderRadius = "10px";
    this.overlay.style.maxWidth = "500px";
    this.overlay.style.lineHeight = 1.2;

    this.clear();
    document.body.appendChild(this.overlay);
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

  show_bullet_count() {
    this.ctx.fillStyle = "white";
    this.ctx.fillText("Bullets:" + this.player.state.bullets.toString(), 10, 54)
  }

  show_distance() {
    this.ctx.fillStyle = "white";
    this.ctx.fillText("Distance:" + this.player.state.distance.toString() + "/1000", 10, 28)
  }

  show_tooltips() {
    if (this.player.state.level == 1) {
      if (this.player.state.distance < 200) {
        this.overlay.innerHTML =
          "What just happened?!?! You seem to be lost in the quantum realm, there is only only way - forward. Better not get in contact with things here. Let's keep moving.";
      } else if (this.player.state.distance < 400) {
        this.overlay.innerHTML =
          "Pick up the energy tokens to replenish your energy, if your energy get's to zero you'll be stuck here forever.";
      } else if (this.player.state.distance < 800) {
        this.overlay.innerHTML =
          "These aliens seem to coming after you. Use your bullets to destroy them.";
      } else if (this.player.state.distance < 1200) {
        this.overlay.innerHTML =
          "Don't mind me, I am just a voice in your head... Look out!! that eight ball is coming right at you ";
      } else if (this.player.state.distance < 1900) {
        this.overlay.innerHTML = "Fight the aliens and reach the portal.";
      } else {
        this.overlay.innerHTML = "Pzzt Pzzt I seem to be loosing connection";
      }
    } else {
      if (this.player.state.distance < 200) {
        this.overlay.innerHTML =
          "You seem to have reached the alien hive, there is only only way - forward. The crystals seem dangerous better not get in contact with them.";
      } else if (this.player.state.distance < 600) {
        this.overlay.innerHTML =
          "These aliens seem to be coming from the end of the hive. Maybe there is a way out?";
      } else {
        this.overlay.innerHTML = "Fight the aliens and reach the portal.";
      }
    }
  }

  update() {
    this.clear();
    if (!this.player.state.gameover) {
      this.show_bullet_count()
      this.show_health_bar();
      this.show_tooltips();
      this.show_distance();
    } else {
      this.ctx.fillStyle = "black";
      this.ctx.fillRect(0, 0, this.hud.width, this.hud.height);
      this.overlay.innerHTML = "Game Over you lost";
    }
  }
}

export class Player {
  constructor() {
    this.state = {
      level: 1,
      active: false,
      health: 100,
      bullets: 10,
      distance: 0,
      gameover: false
    };
  }

  gameover() {
    this.state.gameover = true
    cancelAnimationFrame(FRAME);
  }

  start() {
    this.state.active = true;
    this.level = new LevelOne(this);
  }

  next_level() {
    this.state.health = 100;
    this.state.bullets = 10;
    this.state.level = 2;
    this.state.distance = 0;
    this.level = new LevelTwo(this);
  }

  update() {
    this.state.health -= 0.05;
    this.state.health = Math.max(this.state.health, 0);
    if (this.level.state.done) {
      if (this.state.level === 1) {
        this.next_level();
      } else {
        this.gameover()
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

import { Quaternion, Vector3 } from "three";
import { AnimationMixer } from "three";
import { keys } from "./input.js";
import {Ray} from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import PlaneModel from "./assets/models/airplane/Enemy_Plane.glb";
import { readSync } from "fs";

const loader = new GLTFLoader();

let planeObject = null;

/**
 * Plane class for managing the plane model
 *
 */
export class Plane {
  constructor(
    scene,
    pos = new Vector3(),
    vel = new Vector3(),
    aR = new Quaternion() // ambientRotation
  ) {
    this.parent = scene;
    // states ['unloaded', 'normal', 'shoot']
    this.state = {
      active: false,
    };
    this.animations = [];
    this.position = pos;
    this.speed = vel;
    this.aR = aR;
    this.load();
  }

  load() {
    if (planeObject) {
      this.obj = planeObject.clone();
      this.obj.position.copy(this.position);
      this.obj.rotateY(Math.PI);
      this.aR = this.obj.quaternion;
      this.start();
    } else {
      loader.load(
        PlaneModel,
        (gltf) => {
          const object = gltf.scene || gltf.scenes[0];
          planeObject = object;
          this.animations = gltf.animations;
          this.obj = planeObject.clone();
          this.obj.position.copy(this.position);
          this.obj.rotateY(Math.PI);
          this.aR.copy(this.obj.quaternion);
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
  }

  start() {
    console.log(this.animations);
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

  check_collision() {
    
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
      this.obj.translateX(dx);
      this.obj.rotateZ(-0.01);
    }
    if (keys["ArrowUp"]) {
      suc = 1;
      this.obj.translateY(dy);
      this.obj.rotateX(0.03);
    }
    if (keys["ArrowRight"]) {
      suc = 1;
      this.obj.translateX(-dx);
      this.obj.rotateZ(0.01);
    }
    if (keys["ArrowDown"]) {
      suc = 1;
      this.obj.translateY(-dy);
      this.obj.rotateX(-0.03);
    }
    if (!suc) {
      this.obj.quaternion.slerp(this.aR, 0.05);
    }
    this.obj.translateZ(dz);
  }
  
  
  update(dt) {
    
  }
}

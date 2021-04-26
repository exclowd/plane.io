import { Quaternion, Vector3 } from "three";
import { AnimationMixer } from "three";
import { keys } from "./input.js";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import PlaneModel from "./assets/models/airplane/Enemy_Plane.glb";

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
      this.start();
    } else {
      loader.load(
        PlaneModel,
        (gltf) => {
          const object = gltf.scene || gltf.scenes[0];
          planeObject = object;
          this.animations = gltf.animations;
          this.obj = planeObject.clone();
          this.obj.position.copy(this.position)
          this.obj.rotateY(Math.PI);
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
      this.mixer.clipAction(clip).reset().play();
    });
    this.state.active = true;
    this.parent.add(this.obj);
  }

  // keep movement and rotation different
  // * movement would be strafing and forward speed is constant
  // * rotation would only be when we are moving
  // * when one is done moving the plane would rotate towards the base forward axis
  update(dt) {
    if (!this.state.active) return;
    this.mixer && this.mixer.update(dt);
    const dx = this.speed.x * dt;
    const dy = this.speed.y * dt;
    const dz = this.speed.z * dt;
    if (keys["ArrowLeft"]) {
      // console.log('hi')
      this.obj.translateX(dx);
      // this.obj.rotateY();
    }
    if (keys["ArrowUp"]) {
      this.obj.translateY(dy);
      // plane.rotation.x +=.
    }
    if (keys["ArrowRight"]) {
      this.obj.translateX(-dx);
      // plane.rotation.y += 0.05;
      // plane.rotation.z += 0.05;
    }
    if (keys["ArrowDown"]) {
      this.obj.translateY(-dy);
      // plane.rotation.x -= 0.05;
    }
    this.obj.translateZ(dz);
  }
}

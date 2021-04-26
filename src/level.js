import { Quaternion, Vector3 } from "three";
import { AnimationMixer } from "three";
import { keys } from "./input.js";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
const loader = new GLTFLoader();
import LevelModel from "./assets/models/level/rainbow_road.glb";

let levelObject = null;

// Load Plane Model

/**
 * Level class for handling level wide details
 */
export class Level {
  constructor(scene, pos = new Vector3()) {
    this.parent = scene;
    // states ['unloaded', 'normal', 'shoot']
    this.state = {
      active: false,
    };
    this.startPos = pos;
    this.load();
  }

  load() {
    if (levelObject) {
      this.obj = levelObject.clone();
      this.start();
    } else {
      // Load Level Model
      loader.load(
        LevelModel,
        (gltf) => {
          const group = gltf.scene || gltf.scenes[0];
          levelObject = group;
          this.obj = levelObject.clone();
          this.start()
        },
        (xhr) => {
          console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
        },
        (error) => {
          console.error("Error Importing Level Model", error);
        }
      );
    }
  }

  start() {
    this.state.active = true;
    // I would want to defer this so as to save memory
    this.parent.add(this.obj);
  }
}

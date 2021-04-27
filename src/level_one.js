import { Quaternion, Vector3, FogExp2, AmbientLight, PointLight } from "three";
import { GlitchPass } from "three/examples/jsm/postprocessing/GlitchPass.js";

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
export class LevelOne {
  constructor(scene, composer) {
    this.parent = scene;
    // states ['unloaded', 'normal', 'shoot']
    this.state = {
      active: false,
    };
    // Fog effect so that farther things are not seen
    const fog = new FogExp2(0xffffff, 0.3);
    scene.add(fog);
    // Lighting for the scene
    this.light = new AmbientLight(0x4f4f4f, 1); // soft white light
    this.light2 = new PointLight(0xffffff, 0.7, 400);
    this.light2.position.set(5, 10, 7.5);
    scene.add(this.light);
    scene.add(this.light2);
    this.glitchPass = new GlitchPass();
    this.glitchPass.curF = 10;
    composer.addPass(glitchPass);
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
          this.obj.position.add(new Vector3(0, 0, -1000));
          console.log(this.obj);
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
  }

  start() {
    this.state.active = true;
    // I would want to defer this so as to save memory
    this.parent.add(this.obj);
  }

  end() {

  }
}

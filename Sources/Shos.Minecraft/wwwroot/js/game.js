import { Engine } from "https://cdn.jsdelivr.net/npm/@babylonjs/core@9.21.2/Engines/engine.js";
import { Scene } from "https://cdn.jsdelivr.net/npm/@babylonjs/core@9.21.2/scene.js";
import { Color4 } from "https://cdn.jsdelivr.net/npm/@babylonjs/core@9.21.2/Maths/math.color.js";

const canvas = document.getElementById("renderCanvas");
if (!canvas) {
    throw new Error("renderCanvas element was not found.");
}

const engine = new Engine(canvas, true);
const scene = new Scene(engine);
scene.clearColor = new Color4(0.53, 0.81, 0.92, 1);

engine.runRenderLoop(() => {
    engine.clear(scene.clearColor, true, true);
});

window.addEventListener("resize", () => {
    engine.resize();
});

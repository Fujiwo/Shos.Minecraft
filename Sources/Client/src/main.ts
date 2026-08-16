import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Color4 } from "@babylonjs/core/Maths/math.color";

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new Engine(canvas, true);
const scene = new Scene(engine);

// ステップ0の完了条件: ビルド後、ブラウザで背景色のみの空のBabylon.jsシーンが表示されること。
// カメラの実装はステップ9で扱うため、ここではシーンの背景色を描画するだけの最小限のレンダーループとする。
scene.clearColor = new Color4(0.53, 0.81, 0.92, 1);

engine.runRenderLoop(() => {
    engine.clear(scene.clearColor, true, true);
});

window.addEventListener("resize", () => {
    engine.resize();
});

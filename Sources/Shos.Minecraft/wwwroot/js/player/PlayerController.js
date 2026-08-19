"use strict";
// プレイヤー操作の統合: Babylon.js の UniversalCamera によるFPS視点、WASD入力、PlayerPhysics.ts による
// 重力・ジャンプ・AABB衝突判定の適用(詳細システム設計書.Ver1.md 第2章 2.3 準拠、ステップ5)。
// 仕様書にカメラの具体的な実装方式が UniversalCamera/FreeCamera のいずれかまでは選択されていないため、
// マウスによる視点操作(ゲーム仕様書.Ver1.md 第2章)にそのまま対応できる UniversalCamera を採用する。
// Babylon.js/DOM に依存するため、Node実行・自動テストの対象外(衝突ロジック本体はPlayerPhysics.tsで検証)。
(function (root, factory) {
    "use strict";
    if (typeof module === "object" && module && module.exports) {
        module.exports = factory(require("./PlayerPhysics.js"));
    }
    else {
        root.ShosMinecraft = root.ShosMinecraft || {};
        root.ShosMinecraft.PlayerController = factory(root.ShosMinecraft.PlayerPhysics);
    }
})(globalThis, function (PlayerPhysics) {
    "use strict";
    function createPlayerController(scene, canvas, chunk, spawnX, spawnZ) {
        const babylon = window.BABYLON;
        // 仕様書に初期スポーン位置の決定方法が未定義のため、読み込み済みチャンクの地表高さの直上に
        // 配置するローカルの暫定措置とする(ワールド作成・初期スポーン地点の永続化はステップ8の対象)。
        const groundY = PlayerPhysics.findGroundHeight(chunk, spawnX, spawnZ, 255);
        const state = {
            position: { x: spawnX, y: groundY, z: spawnZ },
            velocityY: 0,
            onGround: false
        };
        const input = {
            moveForward: false,
            moveBackward: false,
            moveLeft: false,
            moveRight: false,
            jump: false,
            yaw: 0
        };
        const camera = new babylon.UniversalCamera("playerCamera", new babylon.Vector3(state.position.x, state.position.y + PlayerPhysics.EYE_HEIGHT, state.position.z), scene);
        camera.minZ = 0.05;
        // 初期視点の向きも仕様書に決定方法が未定義のため、周辺地形が見渡せるよう、わずかに見下ろす向きを
        // ローカルの暫定初期値として採用する(マウス操作により即座に変更可能)。
        camera.rotation.x = 0.3;
        camera.attachControl(canvas, true);
        // WASDは自前の物理更新(PlayerPhysics)で扱うため、Babylon既定の矢印キー移動は無効化する
        camera.keysUp = [];
        camera.keysDown = [];
        camera.keysLeft = [];
        camera.keysRight = [];
        function onKeyDown(event) {
            switch (event.code) {
                case "KeyW":
                    input.moveForward = true;
                    break;
                case "KeyS":
                    input.moveBackward = true;
                    break;
                case "KeyA":
                    input.moveLeft = true;
                    break;
                case "KeyD":
                    input.moveRight = true;
                    break;
                case "Space":
                    input.jump = true;
                    break;
            }
        }
        function onKeyUp(event) {
            switch (event.code) {
                case "KeyW":
                    input.moveForward = false;
                    break;
                case "KeyS":
                    input.moveBackward = false;
                    break;
                case "KeyA":
                    input.moveLeft = false;
                    break;
                case "KeyD":
                    input.moveRight = false;
                    break;
                case "Space":
                    input.jump = false;
                    break;
            }
        }
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        const observer = scene.onBeforeRenderObservable.add(() => {
            const deltaSeconds = scene.getEngine().getDeltaTime() / 1000;
            if (deltaSeconds <= 0) {
                return;
            }
            input.yaw = camera.rotation.y;
            const nextState = PlayerPhysics.stepPlayer(chunk, state, input, deltaSeconds);
            state.position = nextState.position;
            state.velocityY = nextState.velocityY;
            state.onGround = nextState.onGround;
            camera.position.x = state.position.x;
            camera.position.y = state.position.y + PlayerPhysics.EYE_HEIGHT;
            camera.position.z = state.position.z;
        });
        function dispose() {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
            scene.onBeforeRenderObservable.remove(observer);
        }
        return { camera, dispose };
    }
    return { createPlayerController: createPlayerController };
});
//# sourceMappingURL=PlayerController.js.map
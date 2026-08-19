"use strict";
// ゲーム画面(#game-canvas)の起動処理。Babylon.jsによる実描画とチャンク取得・メッシュ生成の統合(ステップ4)。
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// 暫定措置: ワールド作成・選択画面が未実装のため、開発確認用の固定WorldIdでチャンクを取得する。
// ワールド作成・選択・永続化(ステップ8)が実装され次第、実際に選択されたWorldIdへ置き換える。
const DEV_PLACEHOLDER_WORLD_ID = "00000000-0000-0000-0000-000000000001";
function main() {
    "use strict";
    function resizeCanvas(canvas) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }
    // Web Worker上でメッシュを生成する(詳細システム設計書.Ver1.md 第2章 2.2 準拠。ChunkMeshWorkerの公開契約は変更しない)
    function requestChunkMesh(blocks) {
        return new Promise((resolve, reject) => {
            const worker = new Worker("/js/world/ChunkMeshWorker.js");
            worker.onmessage = (event) => {
                worker.terminate();
                resolve({
                    positions: new Float32Array(event.data.positions),
                    normals: new Float32Array(event.data.normals),
                    uvs: new Float32Array(event.data.uvs),
                    indices: new Uint32Array(event.data.indices)
                });
            };
            worker.onerror = (event) => {
                var _a;
                worker.terminate();
                reject((_a = event.error) !== null && _a !== void 0 ? _a : new Error(event.message));
            };
            worker.postMessage({ blocks: blocks }, [blocks.buffer]);
        });
    }
    // テクスチャアトラスは未導入(ステップ3対象外)のため、暫定の単色マテリアルを割り当てる
    function createChunkMesh(scene, meshData, chunkX, chunkZ) {
        const babylon = window.BABYLON;
        const mesh = new babylon.Mesh("chunk_" + chunkX + "_" + chunkZ, scene);
        const vertexData = new babylon.VertexData();
        vertexData.positions = meshData.positions;
        vertexData.normals = meshData.normals;
        vertexData.uvs = meshData.uvs;
        vertexData.indices = meshData.indices;
        vertexData.applyToMesh(mesh);
        const material = new babylon.StandardMaterial("chunkMaterial", scene);
        material.diffuseColor = new babylon.Color3(0.4, 0.7, 0.3);
        mesh.material = material;
        mesh.position.x = chunkX * 16;
        mesh.position.z = chunkZ * 16;
        return mesh;
    }
    function loadAndRenderChunk(scene, worldId, x, y, z) {
        return __awaiter(this, void 0, void 0, function* () {
            const worldClient = window.ShosMinecraft.WorldClient;
            const fetched = yield worldClient.fetchChunk(worldId, x, y, z);
            // requestChunkMeshはTransferableとしてblocksのバッファをWorkerへ譲渡し呼び出し元の配列を空にするため、
            // 衝突判定(ステップ5)で再利用するfetched.chunk.blocksとは別のコピーを渡す。
            const meshData = yield requestChunkMesh(fetched.chunk.blocks.slice());
            createChunkMesh(scene, meshData, fetched.chunkX, fetched.chunkZ);
            return fetched.chunk;
        });
    }
    function initializeGame() {
        const canvas = document.getElementById("game-canvas");
        if (!canvas) {
            console.error("game.js: #game-canvas が見つかりません。");
            return;
        }
        resizeCanvas(canvas);
        const babylon = window.BABYLON;
        if (!babylon) {
            console.error("game.js: Babylon.js が読み込まれていません。");
            return;
        }
        const engine = new babylon.Engine(canvas, true);
        const scene = new babylon.Scene(engine);
        // チャンク読み込み完了まで画面が真っ黒にならないよう、一時的なカメラを配置する。
        // 読み込み完了後、プレイヤー操作可能なFPSカメラ(PlayerController)へ切り替える。
        const loadingCamera = new babylon.UniversalCamera("loadingCamera", new babylon.Vector3(8, 96, -16), scene);
        loadingCamera.setTarget(new babylon.Vector3(8, 64, 8));
        scene.activeCamera = loadingCamera;
        new babylon.HemisphericLight("light", new babylon.Vector3(0, 1, 0), scene);
        engine.runRenderLoop(() => scene.render());
        window.addEventListener("resize", () => {
            resizeCanvas(canvas);
            engine.resize();
        });
        loadAndRenderChunk(scene, DEV_PLACEHOLDER_WORLD_ID, 0, 0, 0).then((chunk) => {
            // 仕様書にスポーンX/Z座標の決定方法が未定義のため、読み込み済みチャンクの中央付近を
            // ローカルの暫定スポーン位置とする(ワールド作成・初期スポーン地点の永続化はステップ8の対象)。
            const playerController = window.ShosMinecraft.PlayerController;
            const controller = playerController.createPlayerController(scene, canvas, chunk, 8, 8);
            scene.activeCamera = controller.camera;
            loadingCamera.dispose();
        }).catch((error) => {
            console.error("game.js: チャンクの取得・描画に失敗しました。", error);
        });
        canvas.dataset.initialized = "true";
        console.info("game.js: ゲーム画面を初期化しました。");
    }
    document.addEventListener("DOMContentLoaded", initializeGame);
}
main();
//# sourceMappingURL=game.js.map
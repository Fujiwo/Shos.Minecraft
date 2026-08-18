// ゲーム画面(#game-canvas)の起動処理。Babylon.jsによる実描画とチャンク取得・メッシュ生成の統合(ステップ4)。

// 暫定措置: ワールド作成・選択画面が未実装のため、開発確認用の固定WorldIdでチャンクを取得する。
// ワールド作成・選択・永続化(ステップ8)が実装され次第、実際に選択されたWorldIdへ置き換える。
const DEV_PLACEHOLDER_WORLD_ID = "00000000-0000-0000-0000-000000000001";

function main(): void {
    "use strict";

    function resizeCanvas(canvas: HTMLCanvasElement): void {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }

    interface IChunkMeshWorkerResult {
        positions: ArrayBufferLike;
        normals: ArrayBufferLike;
        uvs: ArrayBufferLike;
        indices: ArrayBufferLike;
    }

    // Web Worker上でメッシュを生成する(詳細システム設計書.Ver1.md 第2章 2.2 準拠。ChunkMeshWorkerの公開契約は変更しない)
    function requestChunkMesh(blocks: Uint8Array): Promise<IChunkMeshData> {
        return new Promise((resolve, reject) => {
            const worker = new Worker("/js/world/ChunkMeshWorker.js");
            worker.onmessage = (event: MessageEvent<IChunkMeshWorkerResult>) => {
                worker.terminate();
                resolve({
                    positions: new Float32Array(event.data.positions),
                    normals: new Float32Array(event.data.normals),
                    uvs: new Float32Array(event.data.uvs),
                    indices: new Uint32Array(event.data.indices)
                });
            };
            worker.onerror = (event: ErrorEvent) => {
                worker.terminate();
                reject(event.error ?? new Error(event.message));
            };
            worker.postMessage({ blocks: blocks }, [blocks.buffer]);
        });
    }

    // テクスチャアトラスは未導入(ステップ3対象外)のため、暫定の単色マテリアルを割り当てる
    function createChunkMesh(scene: any, meshData: IChunkMeshData, chunkX: number, chunkZ: number): any {
        const babylon = (window as any).BABYLON;
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

    async function loadAndRenderChunk(scene: any, worldId: string, x: number, y: number, z: number): Promise<void> {
        const worldClient: IWorldClientModule = (window as any).ShosMinecraft.WorldClient;
        const fetched = await worldClient.fetchChunk(worldId, x, y, z);
        const meshData = await requestChunkMesh(fetched.chunk.blocks);
        createChunkMesh(scene, meshData, fetched.chunkX, fetched.chunkZ);
    }

    function initializeGame(): void {
        const canvas = document.getElementById("game-canvas") as HTMLCanvasElement | null;
        if (!canvas) {
            console.error("game.js: #game-canvas が見つかりません。");
            return;
        }

        resizeCanvas(canvas);

        const babylon = (window as any).BABYLON;
        if (!babylon) {
            console.error("game.js: Babylon.js が読み込まれていません。");
            return;
        }

        const engine = new babylon.Engine(canvas, true);
        const scene = new babylon.Scene(engine);

        // FPSカメラ・移動・衝突の本実装はステップ5の対象。ここではチャンク描画確認用の最小限のカメラ・光源のみ配置する。
        const camera = new babylon.UniversalCamera("devCamera", new babylon.Vector3(8, 96, -16), scene);
        camera.setTarget(new babylon.Vector3(8, 64, 8));
        camera.attachControl(canvas, true);
        new babylon.HemisphericLight("light", new babylon.Vector3(0, 1, 0), scene);

        engine.runRenderLoop(() => scene.render());
        window.addEventListener("resize", () => {
            resizeCanvas(canvas);
            engine.resize();
        });

        loadAndRenderChunk(scene, DEV_PLACEHOLDER_WORLD_ID, 0, 0, 0).catch((error) => {
            console.error("game.js: チャンクの取得・描画に失敗しました。", error);
        });

        canvas.dataset.initialized = "true";
        console.info("game.js: ゲーム画面を初期化しました。");
    }

    document.addEventListener("DOMContentLoaded", initializeGame);
}

main();

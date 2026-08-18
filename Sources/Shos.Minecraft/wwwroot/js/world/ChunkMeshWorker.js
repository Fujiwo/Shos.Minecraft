"use strict";
// チャンクメッシュのバックグラウンド生成用 Web Worker(詳細システム設計書.Ver1.md 第2章 2.2 準拠)
// 入力: { blocks: Uint8Array }  出力: positions/normals/uvs/indices を Transferable な ArrayBuffer として返す。
// ブラウザの Dedicated Worker としてのみ動作する(Node実行・自動テストの対象外。手動確認手順は実装進捗を参照)。
importScripts("./BlockTypes.js", "./Chunk.js", "./ChunkMeshBuilder.js");
(function (root) {
    "use strict";
    const shosMinecraft = root.ShosMinecraft;
    const chunkMeshBuilder = shosMinecraft.ChunkMeshBuilder;
    const chunkStatic = shosMinecraft.Chunk;
    const workerScope = root;
    workerScope.onmessage = function (event) {
        const chunk = new chunkStatic();
        chunk.blocks.set(event.data.blocks);
        const mesh = chunkMeshBuilder.buildChunkMesh(chunk);
        const response = {
            positions: mesh.positions.buffer,
            normals: mesh.normals.buffer,
            uvs: mesh.uvs.buffer,
            indices: mesh.indices.buffer
        };
        workerScope.postMessage(response, [response.positions, response.normals, response.uvs, response.indices]);
    };
})(globalThis);
//# sourceMappingURL=ChunkMeshWorker.js.map
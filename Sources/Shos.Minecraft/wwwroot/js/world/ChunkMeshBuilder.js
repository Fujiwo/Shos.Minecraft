"use strict";
// チャンクの不可視面カリングとメッシュデータ生成(詳細システム設計書.Ver1.md 第2章 2.2 準拠)
(function (root, factory) {
    "use strict";
    if (typeof module === "object" && module && module.exports) {
        module.exports = factory(require("./BlockTypes.js"), require("./Chunk.js"));
    }
    else {
        root.ShosMinecraft = root.ShosMinecraft || {};
        root.ShosMinecraft.ChunkMeshBuilder = factory(root.ShosMinecraft.BlockTypes, root.ShosMinecraft.Chunk);
    }
})(globalThis, function (BlockTypes, ChunkStatic) {
    "use strict";
    const FACES = [
        { dx: 1, dy: 0, dz: 0, normal: [1, 0, 0], corners: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] },
        { dx: -1, dy: 0, dz: 0, normal: [-1, 0, 0], corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },
        { dx: 0, dy: 1, dz: 0, normal: [0, 1, 0], corners: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]] },
        { dx: 0, dy: -1, dz: 0, normal: [0, -1, 0], corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
        { dx: 0, dy: 0, dz: 1, normal: [0, 0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
        { dx: 0, dy: 0, dz: -1, normal: [0, 0, -1], corners: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]] }
    ];
    // 単位UV座標(アトラスのグリッド仕様は未定のため、ブロックID別オフセットは付与しない。詳細システム設計書.Ver1.md 第2章 2.2 準拠)
    const UNIT_UVS = [[0, 0], [1, 0], [1, 1], [0, 1]];
    // 現在のブロック定義では非衝突集合(空気・水)がそのまま非不透明集合と一致するため、isCollidableを不透明判定に用いる
    function isOpaque(blockId) {
        return BlockTypes.isCollidable(blockId);
    }
    function buildChunkMesh(chunk) {
        const positions = [];
        const normals = [];
        const uvs = [];
        const indices = [];
        for (let y = 0; y < ChunkStatic.SIZE_Y; y++) {
            for (let z = 0; z < ChunkStatic.SIZE_Z; z++) {
                for (let x = 0; x < ChunkStatic.SIZE_X; x++) {
                    const blockId = chunk.getBlockId(x, y, z);
                    if (!isOpaque(blockId)) {
                        continue;
                    }
                    for (const face of FACES) {
                        const nx = x + face.dx;
                        const ny = y + face.dy;
                        const nz = z + face.dz;
                        const withinChunk = nx >= 0 && nx < ChunkStatic.SIZE_X
                            && ny >= 0 && ny < ChunkStatic.SIZE_Y
                            && nz >= 0 && nz < ChunkStatic.SIZE_Z;
                        // チャンク境界(隣接チャンク未取得)は不透明でないものとして扱い、外周面として含める
                        const neighborIsOpaque = withinChunk && isOpaque(chunk.getBlockId(nx, ny, nz));
                        if (neighborIsOpaque) {
                            continue;
                        }
                        const baseIndex = positions.length / 3;
                        for (let cornerIndex = 0; cornerIndex < 4; cornerIndex++) {
                            const corner = face.corners[cornerIndex];
                            positions.push(x + corner[0], y + corner[1], z + corner[2]);
                            normals.push(face.normal[0], face.normal[1], face.normal[2]);
                            const uv = UNIT_UVS[cornerIndex];
                            uvs.push(uv[0], uv[1]);
                        }
                        indices.push(baseIndex, baseIndex + 1, baseIndex + 2, baseIndex, baseIndex + 2, baseIndex + 3);
                    }
                }
            }
        }
        return {
            positions: Float32Array.from(positions),
            normals: Float32Array.from(normals),
            uvs: Float32Array.from(uvs),
            indices: Uint32Array.from(indices)
        };
    }
    return {
        buildChunkMesh: buildChunkMesh
    };
});
//# sourceMappingURL=ChunkMeshBuilder.js.map
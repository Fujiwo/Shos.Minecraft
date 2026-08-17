"use strict";
// 16×256×16 チャンクのブロックデータ管理(詳細システム設計書.Ver1.md 第2章 2.1 準拠)
(function (root, factory) {
    "use strict";
    if (typeof module === "object" && module && module.exports) {
        module.exports = factory(require("./BlockTypes.js"));
    }
    else {
        root.ShosMinecraft = root.ShosMinecraft || {};
        root.ShosMinecraft.Chunk = factory(root.ShosMinecraft.BlockTypes);
    }
})(globalThis, function (BlockTypes) {
    "use strict";
    class Chunk {
        constructor() {
            this.blocks = new Uint8Array(Chunk.BLOCK_COUNT); // 既定値0(空気)
        }
        static getIndex(x, y, z) {
            if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(z)
                || x < 0 || x >= Chunk.SIZE_X || y < 0 || y >= Chunk.SIZE_Y || z < 0 || z >= Chunk.SIZE_Z) {
                throw new RangeError("チャンク範囲外の座標です: (" + x + ", " + y + ", " + z + ")");
            }
            return x + z * Chunk.SIZE_X + y * Chunk.SIZE_X * Chunk.SIZE_Z;
        }
        getBlockId(x, y, z) {
            return this.blocks[Chunk.getIndex(x, y, z)];
        }
        setBlockId(x, y, z, blockId) {
            BlockTypes.getBlockType(blockId);
            this.blocks[Chunk.getIndex(x, y, z)] = blockId;
        }
        // 空気・水(非衝突ブロック)の判定はBlockTypesの定義に委譲する
        isCollidableAt(x, y, z) {
            return BlockTypes.isCollidable(this.getBlockId(x, y, z));
        }
    }
    Chunk.SIZE_X = 16;
    Chunk.SIZE_Y = 256;
    Chunk.SIZE_Z = 16;
    Chunk.BLOCK_COUNT = Chunk.SIZE_X * Chunk.SIZE_Y * Chunk.SIZE_Z;
    return Chunk;
});
//# sourceMappingURL=Chunk.js.map
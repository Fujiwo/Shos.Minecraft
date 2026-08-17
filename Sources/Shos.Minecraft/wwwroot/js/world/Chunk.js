// 16×256×16 チャンクのブロックデータ管理(詳細システム設計書.Ver1.md 第2章 2.1 準拠)
(function (root, factory) {
    "use strict";
    if (typeof module === "object" && module.exports) {
        module.exports = factory(require("./BlockTypes.js"));
    } else {
        root.ShosMinecraft = root.ShosMinecraft || {};
        root.ShosMinecraft.Chunk = factory(root.ShosMinecraft.BlockTypes);
    }
})(typeof self !== "undefined" ? self : this, function (BlockTypes) {
    "use strict";

    var SIZE_X = 16;
    var SIZE_Y = 256;
    var SIZE_Z = 16;
    var BLOCK_COUNT = SIZE_X * SIZE_Y * SIZE_Z;

    function getIndex(x, y, z) {
        if (x < 0 || x >= SIZE_X || y < 0 || y >= SIZE_Y || z < 0 || z >= SIZE_Z) {
            throw new RangeError("チャンク範囲外の座標です: (" + x + ", " + y + ", " + z + ")");
        }
        return x + z * SIZE_X + y * SIZE_X * SIZE_Z;
    }

    function Chunk() {
        this.blocks = new Uint8Array(BLOCK_COUNT); // 既定値0(空気)
    }

    Chunk.prototype.getBlockId = function (x, y, z) {
        return this.blocks[getIndex(x, y, z)];
    };

    Chunk.prototype.setBlockId = function (x, y, z, blockId) {
        this.blocks[getIndex(x, y, z)] = blockId;
    };

    // 空気・水(非衝突ブロック)の判定はBlockTypesの定義に委譲する
    Chunk.prototype.isCollidableAt = function (x, y, z) {
        return BlockTypes.isCollidable(this.getBlockId(x, y, z));
    };

    Chunk.SIZE_X = SIZE_X;
    Chunk.SIZE_Y = SIZE_Y;
    Chunk.SIZE_Z = SIZE_Z;
    Chunk.BLOCK_COUNT = BLOCK_COUNT;
    Chunk.getIndex = getIndex;

    return Chunk;
});

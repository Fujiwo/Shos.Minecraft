// 16×256×16 チャンクのブロックデータ管理(詳細システム設計書.Ver1.md 第2章 2.1 準拠)

interface IChunk {
    blocks: Uint8Array;
    getBlockId(x: number, y: number, z: number): number;
    setBlockId(x: number, y: number, z: number, blockId: number): void;
    isCollidableAt(x: number, y: number, z: number): boolean;
}

interface IChunkStatic {
    new (): IChunk;
    readonly SIZE_X: number;
    readonly SIZE_Y: number;
    readonly SIZE_Z: number;
    readonly BLOCK_COUNT: number;
    getIndex(x: number, y: number, z: number): number;
}

(function (root: typeof globalThis, factory: (blockTypes: IBlockTypesModule) => IChunkStatic): void {
    "use strict";
    if (typeof module === "object" && module && module.exports) {
        module.exports = factory(require("./BlockTypes.js"));
    } else {
        (root as any).ShosMinecraft = (root as any).ShosMinecraft || {};
        (root as any).ShosMinecraft.Chunk = factory((root as any).ShosMinecraft.BlockTypes);
    }
})(globalThis, function (BlockTypes: IBlockTypesModule): IChunkStatic {
    "use strict";

    class Chunk implements IChunk {
        static readonly SIZE_X = 16;
        static readonly SIZE_Y = 256;
        static readonly SIZE_Z = 16;
        static readonly BLOCK_COUNT = Chunk.SIZE_X * Chunk.SIZE_Y * Chunk.SIZE_Z;

        blocks: Uint8Array;

        constructor() {
            this.blocks = new Uint8Array(Chunk.BLOCK_COUNT); // 既定値0(空気)
        }

        static getIndex(x: number, y: number, z: number): number {
            if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(z)
                || x < 0 || x >= Chunk.SIZE_X || y < 0 || y >= Chunk.SIZE_Y || z < 0 || z >= Chunk.SIZE_Z) {
                throw new RangeError("チャンク範囲外の座標です: (" + x + ", " + y + ", " + z + ")");
            }
            return x + z * Chunk.SIZE_X + y * Chunk.SIZE_X * Chunk.SIZE_Z;
        }

        getBlockId(x: number, y: number, z: number): number {
            return this.blocks[Chunk.getIndex(x, y, z)];
        }

        setBlockId(x: number, y: number, z: number, blockId: number): void {
            BlockTypes.getBlockType(blockId);
            this.blocks[Chunk.getIndex(x, y, z)] = blockId;
        }

        // 空気・水(非衝突ブロック)の判定はBlockTypesの定義に委譲する
        isCollidableAt(x: number, y: number, z: number): boolean {
            return BlockTypes.isCollidable(this.getBlockId(x, y, z));
        }
    }

    return Chunk;
});

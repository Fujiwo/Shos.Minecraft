"use strict";
// APIからチャンクを取得し、Chunkインスタンスへ復元するクライアント(詳細システム設計書.Ver1.md 第3章 3.1/3.2 準拠)
// ブラウザのfetch/DecompressionStreamに依存するため、Node実行・自動テストの対象外(手動確認手順は実装進捗を参照)。
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function (root, factory) {
    "use strict";
    if (typeof module === "object" && module && module.exports) {
        module.exports = factory(require("./Chunk.js"));
    }
    else {
        root.ShosMinecraft = root.ShosMinecraft || {};
        root.ShosMinecraft.WorldClient = factory(root.ShosMinecraft.Chunk);
    }
})(globalThis, function (ChunkStatic) {
    "use strict";
    function base64ToBytes(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }
    function decompressGzip(compressed) {
        return __awaiter(this, void 0, void 0, function* () {
            // Uint8Array<ArrayBufferLike> は BlobPart と型が一致しないため、具体的なArrayBufferへ変換して渡す
            const stream = new Blob([compressed.slice().buffer]).stream().pipeThrough(new DecompressionStream("gzip"));
            const buffer = yield new Response(stream).arrayBuffer();
            return new Uint8Array(buffer);
        });
    }
    function fetchChunk(worldId, x, y, z) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`/api/worlds/${worldId}/chunks?x=${x}&y=${y}&z=${z}`);
            if (!response.ok) {
                throw new Error("チャンク取得APIが失敗しました(status: " + response.status + ")");
            }
            const dto = yield response.json();
            const compressedBlocks = base64ToBytes(dto.blockData);
            const blocks = yield decompressGzip(compressedBlocks);
            const chunk = new ChunkStatic();
            chunk.blocks.set(blocks);
            return { chunkX: dto.chunkX, chunkY: dto.chunkY, chunkZ: dto.chunkZ, chunk: chunk };
        });
    }
    return {
        fetchChunk: fetchChunk
    };
});
//# sourceMappingURL=WorldClient.js.map
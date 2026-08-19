"use strict";
// APIからチャンクを取得し、Chunkインスタンスへ復元するクライアント(詳細システム設計書.Ver1.md 第3章 3.1/3.2 準拠)
// ブラウザのfetch/DecompressionStreamに依存するため、Node実行・自動テストの対象外(手動確認手順は実装進捗を参照)。
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
    async function decompressGzip(compressed) {
        // Uint8Array<ArrayBufferLike> は BlobPart と型が一致しないため、具体的なArrayBufferへ変換して渡す
        const stream = new Blob([compressed.slice().buffer]).stream().pipeThrough(new DecompressionStream("gzip"));
        const buffer = await new Response(stream).arrayBuffer();
        return new Uint8Array(buffer);
    }
    async function fetchChunk(worldId, x, y, z) {
        const response = await fetch(`/api/worlds/${worldId}/chunks?x=${x}&y=${y}&z=${z}`);
        if (!response.ok) {
            throw new Error("チャンク取得APIが失敗しました(status: " + response.status + ")");
        }
        const dto = await response.json();
        const compressedBlocks = base64ToBytes(dto.blockData);
        const blocks = await decompressGzip(compressedBlocks);
        const chunk = new ChunkStatic();
        chunk.blocks.set(blocks);
        return { chunkX: dto.chunkX, chunkY: dto.chunkY, chunkZ: dto.chunkZ, chunk: chunk };
    }
    return {
        fetchChunk: fetchChunk
    };
});
//# sourceMappingURL=WorldClient.js.map
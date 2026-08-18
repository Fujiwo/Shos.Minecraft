// APIからチャンクを取得し、Chunkインスタンスへ復元するクライアント(詳細システム設計書.Ver1.md 第3章 3.1/3.2 準拠)
// ブラウザのfetch/DecompressionStreamに依存するため、Node実行・自動テストの対象外(手動確認手順は実装進捗を参照)。

interface IFetchedChunk {
    chunkX: number;
    chunkY: number;
    chunkZ: number;
    chunk: IChunk;
}

interface IWorldClientModule {
    fetchChunk(worldId: string, x: number, y: number, z: number): Promise<IFetchedChunk>;
}

(function (root: typeof globalThis, factory: (chunkStatic: IChunkStatic) => IWorldClientModule): void {
    "use strict";
    if (typeof module === "object" && module && module.exports) {
        module.exports = factory(require("./Chunk.js"));
    } else {
        (root as any).ShosMinecraft = (root as any).ShosMinecraft || {};
        (root as any).ShosMinecraft.WorldClient = factory((root as any).ShosMinecraft.Chunk);
    }
})(globalThis, function (ChunkStatic: IChunkStatic): IWorldClientModule {
    "use strict";

    // GET /api/worlds/{id}/chunks の応答形状(サーバー側 ChunkSaveRequestDto に対応。ASP.NET CoreはcamelCaseで直列化する)
    interface IChunkResponseDto {
        chunkX: number;
        chunkY: number;
        chunkZ: number;
        blockData: string; // Base64エンコードされたGZip圧縮バイナリ
    }

    function base64ToBytes(base64: string): Uint8Array {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    async function decompressGzip(compressed: Uint8Array): Promise<Uint8Array> {
        // Uint8Array<ArrayBufferLike> は BlobPart と型が一致しないため、具体的なArrayBufferへ変換して渡す
        const stream = new Blob([compressed.slice().buffer as ArrayBuffer]).stream().pipeThrough(new DecompressionStream("gzip"));
        const buffer = await new Response(stream).arrayBuffer();
        return new Uint8Array(buffer);
    }

    async function fetchChunk(worldId: string, x: number, y: number, z: number): Promise<IFetchedChunk> {
        const response = await fetch(`/api/worlds/${worldId}/chunks?x=${x}&y=${y}&z=${z}`);
        if (!response.ok) {
            throw new Error("チャンク取得APIが失敗しました(status: " + response.status + ")");
        }

        const dto: IChunkResponseDto = await response.json();
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

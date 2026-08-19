using System.IO.Compression;

namespace Shos.Minecraft.Terrain;

// チャンクのブロックデータの圧縮JSON転送(詳細システム設計書.Ver1.md 第3章 3.2 準拠)
public static class ChunkDataCompression
{
    public static byte[] Compress(byte[] data)
    {
        using var output = new MemoryStream();
        using (var gzip = new GZipStream(output, CompressionLevel.Optimal, leaveOpen: true)) {
            gzip.Write(data, 0, data.Length);
        }
        return output.ToArray();
    }

    public static byte[] Decompress(byte[] compressed)
    {
        using var input = new MemoryStream(compressed);
        using var gzip = new GZipStream(input, CompressionMode.Decompress);
        using var output = new MemoryStream();
        gzip.CopyTo(output);
        return output.ToArray();
    }
}

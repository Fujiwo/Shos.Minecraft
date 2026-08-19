namespace Shos.Minecraft.Models;

// チャンクデータのDTO(詳細システム設計書.Ver1.md 第5章 5.2 準拠)。
// ステップ4では GET /api/worlds/{id}/chunks の応答に用いる。ステップ8のバッチ保存(POST)でも同一形状を再利用する想定。
public class ChunkSaveRequestDto
{
    public int ChunkX { get; set; }
    public int ChunkY { get; set; }
    public int ChunkZ { get; set; }
    public byte[] BlockData { get; set; } = Array.Empty<byte>();
}

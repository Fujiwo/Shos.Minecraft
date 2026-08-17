namespace Shos.Minecraft.Models
{
    // /api 系ルートの疎通確認に使う最小限のステータス応答
    public class GameApiStatusDto
    {
        public string Status { get; set; } = "ok";
    }
}

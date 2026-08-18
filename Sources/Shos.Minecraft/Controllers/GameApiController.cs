using Microsoft.AspNetCore.Mvc;
using Shos.Minecraft.Models;
using Shos.Minecraft.Terrain;

namespace Shos.Minecraft.Controllers
{
    // ゲーム用APIの雛形。ワールド/チャンクの永続化(Worlds/Chunksテーブル)はステップ8で追加する。
    [ApiController]
    [Route("api/game")]
    public class GameApiController : ControllerBase
    {
        [HttpGet("status")]
        public ActionResult<GameApiStatusDto> GetStatus()
        {
            return Ok(new GameApiStatusDto());
        }

        // 特定チャンクの取得(詳細システム設計書.Ver1.md 第3章 3.1 準拠)。
        // Worlds/Chunksテーブルへの永続化はステップ8の対象のため、本ステップではシード値からの都度生成のみを行う。
        [HttpGet("/api/worlds/{id}/chunks")]
        public ActionResult<ChunkSaveRequestDto> GetChunk(Guid id, [FromQuery] int x, [FromQuery] int y, [FromQuery] int z)
        {
            // Y軸はワールド高さ全体を1チャンクで管理するため(詳細システム設計書 2.1)、y=0以外は無効な座標
            if (y != 0)
            {
                return Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "無効なチャンク座標です。",
                    detail: "y は 0 のみ有効です(1チャンクがワールド高さ全体を管理するため)。");
            }

            // 暫定措置: WorldIdからSeedを決定的に導出する(ステップ8でWorlds永続化に置き換え予定)
            int seed = WorldSeedProvider.DeriveSeedFromWorldId(id);
            byte[] blocks = TerrainGenerator.GenerateChunkBlocks(seed, x, z);
            byte[] compressed = ChunkDataCompression.Compress(blocks);

            return Ok(new ChunkSaveRequestDto
            {
                ChunkX = x,
                ChunkY = y,
                ChunkZ = z,
                BlockData = compressed
            });
        }
    }
}

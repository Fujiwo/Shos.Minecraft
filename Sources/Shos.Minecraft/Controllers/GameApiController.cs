using Microsoft.AspNetCore.Mvc;
using Shos.Minecraft.Models;

namespace Shos.Minecraft.Controllers
{
    // ゲーム用APIの雛形。具体的なワールド/チャンクAPIは後続ステップで追加する。
    [ApiController]
    [Route("api/game")]
    public class GameApiController : ControllerBase
    {
        [HttpGet("status")]
        public ActionResult<GameApiStatusDto> GetStatus()
        {
            return Ok(new GameApiStatusDto());
        }
    }
}

using Microsoft.AspNetCore.Mvc;
using Shos.Minecraft.Models;

namespace Shos.Minecraft.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GameApiController : ControllerBase
{
    [HttpGet("health")]
    public ActionResult<GameApiHealthResponse> Health()
    {
        return Ok(new GameApiHealthResponse
        {
            Status = "ok",
            Service = "Shos.Minecraft"
        });
    }

    [HttpGet("world")]
    public ActionResult<GameWorldResponse> World()
    {
        return Ok(new GameWorldResponse
        {
            WorldId = Guid.Empty,
            Name = "Starter World",
            Seed = 0
        });
    }
}

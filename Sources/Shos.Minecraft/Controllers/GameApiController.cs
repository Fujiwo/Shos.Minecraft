using Microsoft.AspNetCore.Mvc;
using Shos.Minecraft.Server.Models;

namespace Shos.Minecraft.Server.Controllers;

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
            WorldId = "default",
            Name = "Starter World",
            Seed = "shos-minecraft"
        });
    }
}

using Microsoft.AspNetCore.Mvc;
using Shos.Minecraft.Models;

namespace Shos.Minecraft.Controllers;

public class HomeController : Controller
{
    public IActionResult Index()
    {
        var model = new GameHomeViewModel
        {
            Title = "Shos.Minecraft",
            CanvasId = "renderCanvas"
        };

        return View(model);
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View();
    }
}

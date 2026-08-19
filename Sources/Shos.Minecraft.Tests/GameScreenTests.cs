using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Shos.Minecraft.Tests;

// ステップ0/ステップ1の完了条件(ホーム画面取得・/api ルート疎通・canvas 骨格配置)を確認する
public class GameScreenTests : IClassFixture<WebApplicationFactory<Program>>
{
    readonly WebApplicationFactory<Program> _factory;

    public GameScreenTests(WebApplicationFactory<Program> factory)
        => _factory = factory;

    [Fact]
    public async Task GetIndex_ReturnsSuccessAndGameCanvasSkeleton()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/");
        var html = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("id=\"game-canvas\"", html);
        Assert.Contains("id=\"game-ui\"", html);
        Assert.Contains("/js/game.js", html);
    }

    [Fact]
    public async Task GetApiGameStatus_ReturnsOk()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/game/status");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}

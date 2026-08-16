var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

app.UseHttpsRedirection();

// ステップ0の完了条件: サーバー起動後、疎通確認用のエンドポイントにHTTPリクエストを送信し200応答をログで確認できる。
app.MapGet("/api/health", (ILogger<Program> logger) =>
{
    logger.LogInformation("Health check requested.");
    return Results.Ok(new { status = "ok" });
})
.WithName("GetHealth");

app.Run();

public partial class Program;

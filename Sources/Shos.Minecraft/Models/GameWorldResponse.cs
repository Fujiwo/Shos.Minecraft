namespace Shos.Minecraft.Models;

public class GameWorldResponse
{
    public Guid WorldId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Seed { get; set; }
}

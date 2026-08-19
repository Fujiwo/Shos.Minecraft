namespace Shos.Minecraft.Terrain;

// パーリンノイズによるチャンク地形生成(詳細システム設計書.Ver1.md 第2章 2.5 準拠)
//
// 海面高・地表高さの振幅・地中レイヤーの割り当て(草/砂・土4ブロック・石)は仕様書に数値が
// 存在しなかったため、実装前にユーザーへ確認のうえ暫定値として採用した(Plans/実装進捗.Ver1.md ステップ4参照)。
public static class TerrainGenerator
{
    public const int ChunkSizeX = 16;
    public const int ChunkSizeY = 256;
    public const int ChunkSizeZ = 16;

    public const int    Octaves = 4;
    public const double Scale = 1.0 / 64.0;
    public const double Persistence = 0.5;
    public const double Lacunarity = 2.0;

    // 暫定値(ユーザー承認済み): 海面Y、地表高さの振幅、地表直下の土の厚み
    public const int SeaLevel = 64;
    public const int SurfaceAmplitude = 32;
    public const int DirtDepth = 4;

    const byte BlockAir   = 0;
    const byte BlockDirt  = 1;
    const byte BlockGrass = 2;
    const byte BlockStone = 3;
    const byte BlockWater = 8;
    const byte BlockSand  = 9;

    // シード値・チャンク座標が同一であれば常に同一のブロック配列を返す(再現性の要件)
    public static bool IsSafeChunkCoordinate(int chunkCoordinate)
    {
        long minWorldCoordinate = int.MinValue;
        long maxWorldCoordinate = int.MaxValue;
        long minCandidate = (long)chunkCoordinate * ChunkSizeX;
        long maxCandidate = minCandidate + ChunkSizeX - 1;

        return minCandidate >= minWorldCoordinate && maxCandidate <= maxWorldCoordinate;
    }

    public static byte[] GenerateChunkBlocks(int seed, int chunkX, int chunkZ)
    {
        var noise = new PerlinNoise2D(seed);
        var blocks = new byte[ChunkSizeX * ChunkSizeY * ChunkSizeZ];

        for (int lz = 0; lz < ChunkSizeZ; lz++) {
            for (int lx = 0; lx < ChunkSizeX; lx++) {
                int worldX = checked(chunkX * ChunkSizeX + lx);
                int worldZ = checked(chunkZ * ChunkSizeZ + lz);
                int surfaceY = CalculateSurfaceHeight(noise, worldX, worldZ);

                for (int y = 0; y < ChunkSizeY; y++) {
                    byte blockId = DetermineBlockId(y, surfaceY);
                    int index = lx + lz * ChunkSizeX + y * ChunkSizeX * ChunkSizeZ; // x + z*16 + y*16*16
                    blocks[index] = blockId;
                }
            }
        }

        return blocks;
    }

    static int CalculateSurfaceHeight(PerlinNoise2D noise, int worldX, int worldZ)
    {
        double amplitude = 1.0;
        double frequency = Scale;
        double total = 0.0;
        double maxAmplitude = 0.0;

        for (int octave = 0; octave < Octaves; octave++)
        {
            total += noise.Noise(worldX * frequency, worldZ * frequency) * amplitude;
            maxAmplitude += amplitude;
            amplitude *= Persistence;
            frequency *= Lacunarity;
        }

        double normalized = maxAmplitude > 0 ? total / maxAmplitude : 0.0; // 概ね [-1, 1]
        int surfaceY = SeaLevel + (int)Math.Round(normalized * SurfaceAmplitude);
        return Math.Clamp(surfaceY, DirtDepth + 1, ChunkSizeY - 2);
    }

    static byte DetermineBlockId(int y, int surfaceY)
    {
        if (y > surfaceY)
            return y <= SeaLevel ? BlockWater : BlockAir;

        if (y == surfaceY)
            return surfaceY >= SeaLevel ? BlockGrass : BlockSand;

        if (y >= surfaceY - DirtDepth)
            return BlockDirt;

        return BlockStone;
    }
}

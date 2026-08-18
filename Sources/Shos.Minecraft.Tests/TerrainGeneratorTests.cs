using Shos.Minecraft.Terrain;
using Xunit;

namespace Shos.Minecraft.Tests
{
    // ステップ4の完了条件「同一シード値で同一地形が再現できること」を実データで検証する
    public class TerrainGeneratorTests
    {
        [Fact]
        public void GenerateChunkBlocks_SameSeedAndCoordinates_ProducesIdenticalBlocks()
        {
            var first = TerrainGenerator.GenerateChunkBlocks(seed: 12345, chunkX: 2, chunkZ: -3);
            var second = TerrainGenerator.GenerateChunkBlocks(seed: 12345, chunkX: 2, chunkZ: -3);

            Assert.Equal(first, second);
        }

        [Fact]
        public void GenerateChunkBlocks_DifferentSeed_ProducesDifferentTerrain()
        {
            var first = TerrainGenerator.GenerateChunkBlocks(seed: 1, chunkX: 0, chunkZ: 0);
            var second = TerrainGenerator.GenerateChunkBlocks(seed: 2, chunkX: 0, chunkZ: 0);

            Assert.NotEqual(first, second);
        }

        [Fact]
        public void GenerateChunkBlocks_ReturnsExpectedLength()
        {
            var blocks = TerrainGenerator.GenerateChunkBlocks(seed: 42, chunkX: 0, chunkZ: 0);

            Assert.Equal(16 * 256 * 16, blocks.Length);
        }

        [Fact]
        public void GenerateChunkBlocks_ColumnFollowsGrassDirtStoneLayering()
        {
            var blocks = TerrainGenerator.GenerateChunkBlocks(seed: 7, chunkX: 0, chunkZ: 0);

            // 適当な列(x=3, z=5)を index = x + z*16 + y*16*16 で走査し、地表から下へのブロック遷移を確認する
            const int x = 3;
            const int z = 5;

            int surfaceY = -1;
            for (int y = 255; y >= 0; y--)
            {
                int index = x + z * 16 + y * 16 * 16;
                byte blockId = blocks[index];
                if (blockId == 2 /* 草 */ || blockId == 9 /* 砂 */)
                {
                    surfaceY = y;
                    break;
                }
            }

            Assert.True(surfaceY >= 0, "地表ブロック(草または砂)が見つかりませんでした。");

            // 地表から下4ブロックは土、それより下は石であること
            for (int depth = 1; depth <= 4; depth++)
            {
                int index = x + z * 16 + (surfaceY - depth) * 16 * 16;
                Assert.Equal(1 /* 土 */, blocks[index]);
            }

            int stoneIndex = x + z * 16 + (surfaceY - 5) * 16 * 16;
            Assert.Equal(3 /* 石 */, blocks[stoneIndex]);
        }
    }
}

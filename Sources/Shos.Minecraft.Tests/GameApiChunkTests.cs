using System.IO.Compression;
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Shos.Minecraft.Models;
using Shos.Minecraft.Terrain;
using Xunit;

namespace Shos.Minecraft.Tests
{
    // ステップ4の完了条件「APIからチャンクデータを取得し画面に反映できること」を、実際のHTTP応答で検証する
    public class GameApiChunkTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;

        public GameApiChunkTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task GetChunk_ReturnsOkAndBlockDataConsistentWithIndexFormula()
        {
            var client = _factory.CreateClient();
            var worldId = Guid.NewGuid();

            var response = await client.GetAsync($"/api/worlds/{worldId}/chunks?x=1&y=0&z=2");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var dto = await response.Content.ReadFromJsonAsync<ChunkSaveRequestDto>();
            Assert.NotNull(dto);
            Assert.Equal(1, dto!.ChunkX);
            Assert.Equal(0, dto.ChunkY);
            Assert.Equal(2, dto.ChunkZ);

            byte[] decompressed = Decompress(dto.BlockData);
            Assert.Equal(16 * 256 * 16, decompressed.Length);

            // 同一WorldIdから決定的に導出したSeedによる地形生成結果と、API応答が一致すること(座標系 x + z*16 + y*16*16 の整合性を含む)
            int expectedSeed = WorldSeedProvider.DeriveSeedFromWorldId(worldId);
            byte[] expectedBlocks = TerrainGenerator.GenerateChunkBlocks(expectedSeed, chunkX: 1, chunkZ: 2);
            Assert.Equal(expectedBlocks, decompressed);
        }

        [Fact]
        public async Task GetChunk_SameWorldIdRequestedTwice_ReturnsIdenticalTerrain()
        {
            var client = _factory.CreateClient();
            var worldId = Guid.NewGuid();

            var first = await client.GetAsync($"/api/worlds/{worldId}/chunks?x=0&y=0&z=0");
            var second = await client.GetAsync($"/api/worlds/{worldId}/chunks?x=0&y=0&z=0");

            var firstDto = await first.Content.ReadFromJsonAsync<ChunkSaveRequestDto>();
            var secondDto = await second.Content.ReadFromJsonAsync<ChunkSaveRequestDto>();

            Assert.Equal(firstDto!.BlockData, secondDto!.BlockData);
        }

        [Fact]
        public async Task GetChunk_NonZeroY_ReturnsBadRequestProblemDetails()
        {
            var client = _factory.CreateClient();
            var worldId = Guid.NewGuid();

            var response = await client.GetAsync($"/api/worlds/{worldId}/chunks?x=0&y=1&z=0");

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        }

        private static byte[] Decompress(byte[] compressed)
        {
            using var input = new MemoryStream(compressed);
            using var gzip = new GZipStream(input, CompressionMode.Decompress);
            using var output = new MemoryStream();
            gzip.CopyTo(output);
            return output.ToArray();
        }
    }
}

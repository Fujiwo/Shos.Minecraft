// ステップ3の完了条件(1チャンクの外周面だけが描画対象として生成されること / 内側の面がカリングされていること)を
// 検証するNode実行スクリプト。
// 実行方法: node Sources/Shos.Minecraft.Tests/js-verification/ChunkMeshBuilderSmokeTest.js
"use strict";

const assert = require("assert");
const path = require("path");

const worldDir = path.join(__dirname, "..", "..", "Shos.Minecraft", "wwwroot", "js", "world");
const Chunk = require(path.join(worldDir, "Chunk.js"));
const ChunkMeshBuilder = require(path.join(worldDir, "ChunkMeshBuilder.js"));

function countFaces(mesh) {
    assert.strictEqual(mesh.indices.length % 6, 0, "インデックス数は1面(6インデックス)の倍数であること");
    return mesh.indices.length / 6;
}

// 生成結果の型付き配列であること
{
    const chunk = new Chunk();
    chunk.setBlockId(5, 10, 5, 1); // 土(孤立した単一ブロック)
    const mesh = ChunkMeshBuilder.buildChunkMesh(chunk);
    assert.ok(mesh.positions instanceof Float32Array, "positionsはFloat32Arrayであること");
    assert.ok(mesh.normals instanceof Float32Array, "normalsはFloat32Arrayであること");
    assert.ok(mesh.uvs instanceof Float32Array, "uvsはFloat32Arrayであること");
    assert.ok(mesh.indices instanceof Uint32Array, "indicesはUint32Arrayであること");
}

// 孤立した単一ブロックは6面すべてが外周面として生成されること
{
    const chunk = new Chunk();
    chunk.setBlockId(5, 10, 5, 1); // 土
    const mesh = ChunkMeshBuilder.buildChunkMesh(chunk);
    assert.strictEqual(countFaces(mesh), 6, "孤立ブロックは6面生成されること");
    assert.strictEqual(mesh.positions.length, 6 * 4 * 3, "頂点は6面×4頂点×3成分であること");
    assert.strictEqual(mesh.normals.length, mesh.positions.length, "法線は頂点と同数の成分であること");
    assert.strictEqual(mesh.uvs.length, 6 * 4 * 2, "UVは6面×4頂点×2成分であること");
}

// 隣接する不透明ブロック2個は、接触面がカリングされ10面になること
{
    const chunk = new Chunk();
    chunk.setBlockId(5, 10, 5, 1); // 土
    chunk.setBlockId(6, 10, 5, 1); // 土(X方向に隣接)
    const mesh = ChunkMeshBuilder.buildChunkMesh(chunk);
    assert.strictEqual(countFaces(mesh), 10, "隣接する2ブロックは接触面がカリングされ10面になること");
}

// チャンク境界(隣接チャンク未取得)の面はカリングされず、外周面として含まれること
{
    const chunk = new Chunk();
    chunk.setBlockId(0, 10, 5, 1); // X境界(x=0)に接する土ブロック
    const mesh = ChunkMeshBuilder.buildChunkMesh(chunk);
    assert.strictEqual(countFaces(mesh), 6, "チャンク境界に接するブロックも6面すべてが生成されること");
}

// 水(非衝突・非不透明)に隣接する面はカリングされず、かつ水自体は面を生成しないこと
{
    const chunk = new Chunk();
    chunk.setBlockId(5, 10, 5, 1); // 土
    chunk.setBlockId(6, 10, 5, 8); // 水(X方向に隣接)
    const mesh = ChunkMeshBuilder.buildChunkMesh(chunk);
    assert.strictEqual(countFaces(mesh), 6, "水に隣接する面はカリングされず、水自体は面を持たないこと");
}

console.log("ChunkMeshBuilderSmokeTest: すべての検証に成功しました。");

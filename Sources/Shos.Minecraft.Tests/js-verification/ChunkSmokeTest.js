// ステップ2の完了条件(座標往復読み書き / 空気・水の非衝突扱い)を検証するNode実行スクリプト。
// 実行方法: node Sources/Shos.Minecraft.Tests/js-verification/ChunkSmokeTest.js
"use strict";

const assert = require("assert");
const path = require("path");

const worldDir = path.join(__dirname, "..", "..", "Shos.Minecraft", "wwwroot", "js", "world");
const BlockTypes = require(path.join(worldDir, "BlockTypes.js"));
const Chunk = require(path.join(worldDir, "Chunk.js"));

// 座標計算 index = x + z * 16 + y * 16 * 16 を確認
assert.strictEqual(Chunk.getIndex(0, 0, 0), 0);
assert.strictEqual(Chunk.getIndex(1, 0, 0), 1);
assert.strictEqual(Chunk.getIndex(0, 0, 1), 16);
assert.strictEqual(Chunk.getIndex(0, 1, 0), 256);
assert.strictEqual(Chunk.getIndex(15, 255, 15), 15 + 15 * 16 + 255 * 16 * 16);

const chunk = new Chunk();

// Uint8Arrayベース、長さ16*256*16であること
assert.ok(chunk.blocks instanceof Uint8Array);
assert.strictEqual(chunk.blocks.length, 16 * 256 * 16);

// 未設定座標は既定値(空気, ID:0)であること
assert.strictEqual(chunk.getBlockId(0, 0, 0), 0);

// 指定座標に設定した値を同じ値で読み出せること
chunk.setBlockId(3, 10, 7, 1); // 土
assert.strictEqual(chunk.getBlockId(3, 10, 7), 1);

// 空気(ID:0)・水(ID:8)は非衝突、土(ID:1)は衝突として扱われること
chunk.setBlockId(4, 10, 7, 8); // 水
assert.strictEqual(BlockTypes.isCollidable(0), false);
assert.strictEqual(BlockTypes.isCollidable(8), false);
assert.strictEqual(chunk.isCollidableAt(0, 0, 0), false);
assert.strictEqual(chunk.isCollidableAt(4, 10, 7), false);
assert.strictEqual(chunk.isCollidableAt(3, 10, 7), true);

// チャンク範囲外の座標はRangeErrorとなること
assert.throws(function () {
    chunk.setBlockId(16, 0, 0, 1);
}, RangeError);

console.log("ChunkSmokeTest: すべての検証に成功しました。");

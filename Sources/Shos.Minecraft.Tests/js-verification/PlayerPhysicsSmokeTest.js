// ステップ5の完了条件(WASDで移動し、Spaceでジャンプし、地面で静止すること。
// 水ブロックには通常の衝突判定が効かないこと)を、実際のChunkデータとPlayerPhysicsの
// 衝突判定ロジックを用いて検証するNode実行スクリプト。
// 実行方法: node Sources/Shos.Minecraft.Tests/js-verification/PlayerPhysicsSmokeTest.js
"use strict";

const assert = require("assert");
const path = require("path");

const worldDir = path.join(__dirname, "..", "..", "Shos.Minecraft", "wwwroot", "js", "world");
const playerDir = path.join(__dirname, "..", "..", "Shos.Minecraft", "wwwroot", "js", "player");
const Chunk = require(path.join(worldDir, "Chunk.js"));
const PlayerPhysics = require(path.join(playerDir, "PlayerPhysics.js"));

const DIRT = 1;
const WATER = 8;
const STONE = 3;

function noInput(overrides) {
    return Object.assign({
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false,
        jump: false,
        yaw: 0
    }, overrides || {});
}

function buildFlatGroundChunk(groundTopY, blockId) {
    const chunk = new Chunk();
    for (let x = 0; x < 16; x++) {
        for (let z = 0; z < 16; z++) {
            for (let y = 0; y <= groundTopY; y++) {
                chunk.setBlockId(x, y, z, blockId === undefined ? DIRT : blockId);
            }
        }
    }
    return chunk;
}

// 1. 地面での静止: 地面の直上に置いたプレイヤーは、時間が経過しても沈み込まず一定のYで静止すること
{
    const chunk = buildFlatGroundChunk(9); // y=0..9が土、y=10以上が空気
    let state = { position: { x: 8, y: 10, z: 8 }, velocityY: 0, onGround: false };
    const input = noInput();
    for (let i = 0; i < 30; i++) {
        state = PlayerPhysics.stepPlayer(chunk, state, input, 1 / 60);
    }
    assert.strictEqual(state.onGround, true, "地面の直上では接地状態になること");
    assert.strictEqual(state.velocityY, 0, "接地後は垂直速度が0になること");
    const settledY = state.position.y;
    for (let i = 0; i < 30; i++) {
        state = PlayerPhysics.stepPlayer(chunk, state, input, 1 / 60);
    }
    assert.strictEqual(state.position.y, settledY, "地面での静止後、追加のステップでYが変化しない(沈み込まない)こと");
    assert.strictEqual(state.position.y, 10, "地面(y=9が最上段)の直上、y=10で静止すること");
}

// 2. 落下: 空中に置いたプレイヤーは、地面に到達するまで落下し、地面の上面で静止すること
{
    const chunk = buildFlatGroundChunk(9);
    let state = { position: { x: 8, y: 50, z: 8 }, velocityY: 0, onGround: false };
    const input = noInput();
    let landed = false;
    for (let i = 0; i < 600 && !landed; i++) {
        state = PlayerPhysics.stepPlayer(chunk, state, input, 1 / 60);
        if (state.onGround) {
            landed = true;
        }
    }
    assert.strictEqual(landed, true, "十分な時間経過後、落下して着地すること");
    assert.strictEqual(state.position.y, 10, "着地後は地面の直上(y=10)で静止すること");
    assert.ok(state.position.y >= 10, "地面の下へめり込まないこと");
}

// 3. 水ブロックの非衝突: 地面の代わりに水を敷き詰めた場合、通常の衝突判定が効かず沈み続けること
{
    const chunk = buildFlatGroundChunk(9, WATER);
    let state = { position: { x: 8, y: 50, z: 8 }, velocityY: 0, onGround: false };
    const input = noInput();
    for (let i = 0; i < 120; i++) {
        state = PlayerPhysics.stepPlayer(chunk, state, input, 1 / 60);
    }
    assert.strictEqual(state.onGround, false, "水ブロックの上では接地状態にならないこと");
    assert.ok(state.position.y < 10, "水ブロックには通常の衝突判定が効かず、水面下まで沈むこと");
}

// 4. ジャンプ: 接地中にSpaceキー入力を与えると上方向の初速が生じ、その後地面に着地して静止すること
{
    const chunk = buildFlatGroundChunk(9);
    let state = { position: { x: 8, y: 10, z: 8 }, velocityY: 0, onGround: false };
    for (let i = 0; i < 30; i++) {
        state = PlayerPhysics.stepPlayer(chunk, state, noInput(), 1 / 60);
    }
    assert.strictEqual(state.onGround, true, "ジャンプ検証の前提として接地していること");

    state = PlayerPhysics.stepPlayer(chunk, state, noInput({ jump: true }), 1 / 60);
    assert.ok(state.velocityY > 0, "ジャンプ入力直後は上方向の速度を持つこと");
    assert.strictEqual(state.onGround, false, "ジャンプ直後は非接地になること");

    let maxY = state.position.y;
    let landedAgain = false;
    for (let i = 0; i < 300 && !landedAgain; i++) {
        state = PlayerPhysics.stepPlayer(chunk, state, noInput(), 1 / 60);
        maxY = Math.max(maxY, state.position.y);
        if (state.onGround) {
            landedAgain = true;
        }
    }
    assert.ok(maxY > 10, "ジャンプにより一時的に地面より高い位置まで上昇すること");
    assert.strictEqual(landedAgain, true, "ジャンプ後、重力によって再び着地すること");
    assert.strictEqual(state.position.y, 10, "再着地後は元の地面の高さ(y=10)で静止すること");
}

// 5. 水平移動の衝突: 進行方向に壁がある場合は移動がブロックされ、壁がない方向には移動できること
{
    const chunk = buildFlatGroundChunk(9);
    // (9, 10, 8) に壁(石)を設置し、X+方向への移動を塞ぐ
    chunk.setBlockId(9, 10, 8, STONE);

    let blockedState = { position: { x: 8, y: 10, z: 8 }, velocityY: 0, onGround: true };
    // yaw=0はforward=(sin0,cos0)=(0,1) つまりZ+方向。X+方向へ移動させるにはyaw=90度(PI/2)でmoveForward。
    const moveTowardWallInput = noInput({ moveForward: true, yaw: Math.PI / 2 });
    for (let i = 0; i < 60; i++) {
        blockedState = PlayerPhysics.stepPlayer(chunk, blockedState, moveTowardWallInput, 1 / 60);
    }
    assert.ok(blockedState.position.x < 9 - PlayerPhysics.PLAYER_HALF_WIDTH + 1e-6, "壁があるX+方向には壁を通り抜けられないこと");

    let openState = { position: { x: 8, y: 10, z: 8 }, velocityY: 0, onGround: true };
    // yaw=0でZ+方向(壁のないほう)へ移動
    const moveOpenInput = noInput({ moveForward: true, yaw: 0 });
    for (let i = 0; i < 60; i++) {
        openState = PlayerPhysics.stepPlayer(chunk, openState, moveOpenInput, 1 / 60);
    }
    assert.ok(openState.position.z > 8 + 0.5, "壁のない方向へは移動できること");
}

console.log("PlayerPhysicsSmokeTest: すべての検証に成功しました。");

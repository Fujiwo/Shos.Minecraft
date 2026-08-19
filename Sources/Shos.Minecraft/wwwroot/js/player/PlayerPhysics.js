"use strict";
// プレイヤーの移動・重力・ジャンプ・AABB衝突判定(詳細システム設計書.Ver1.md 第2章 2.3 準拠)
// Babylon.js/DOM に依存しない純粋な物理ロジックのため、Node実行での実データ検証が可能。
(function (root, factory) {
    "use strict";
    if (typeof module === "object" && module && module.exports) {
        module.exports = factory(require("../world/Chunk.js"));
    }
    else {
        root.ShosMinecraft = root.ShosMinecraft || {};
        root.ShosMinecraft.PlayerPhysics = factory(root.ShosMinecraft.Chunk);
    }
})(globalThis, function (ChunkStatic) {
    "use strict";
    // プレイヤーの当たり判定(AABB): 幅・奥行き0.6、高さ1.8(徒歩移動する人型キャラクター相当の暫定値)
    const PLAYER_HALF_WIDTH = 0.3;
    const PLAYER_HEIGHT = 1.8;
    const EYE_HEIGHT = 1.6;
    // 徒歩相当の移動速度(ゲーム仕様書.Ver1.md「移動・ジャンプ・重力の体感仕様」に基づく暫定値)
    const MOVE_SPEED = 4.5;
    // 常時下方向に加速度を適用する(詳細システム設計書.Ver1.md 第2章 2.3)。値は概略でよいための暫定値。
    const GRAVITY = 20;
    // Spaceキーで「その場から軽く飛び上がる程度の高さ」(ゲーム仕様書.Ver1.md 第5章)になるよう選定した暫定初速。
    const JUMP_SPEED = 7;
    // チャンク範囲外は判定対象のチャンクデータが存在しないため非衝突(開いた空間)として扱う
    // (本ステップは単一チャンクの読み込みのみを対象とするステップ4の制約を踏襲する暫定的な扱い)。
    function isSolidAt(chunk, x, y, z) {
        if (x < 0 || x >= ChunkStatic.SIZE_X || y < 0 || y >= ChunkStatic.SIZE_Y || z < 0 || z >= ChunkStatic.SIZE_Z) {
            return false;
        }
        return chunk.isCollidableAt(Math.floor(x), Math.floor(y), Math.floor(z));
    }
    // 水平方向のAABB([minX,maxX) x [minY,maxY) x [minZ,maxZ))がいずれかの衝突ブロックと重なるか判定する
    function aabbCollides(chunk, minX, maxX, minY, maxY, minZ, maxZ) {
        const startX = Math.floor(minX), endX = Math.ceil(maxX) - 1;
        const startY = Math.floor(minY), endY = Math.ceil(maxY) - 1;
        const startZ = Math.floor(minZ), endZ = Math.ceil(maxZ) - 1;
        for (let by = startY; by <= endY; by++) {
            for (let bz = startZ; bz <= endZ; bz++) {
                for (let bx = startX; bx <= endX; bx++) {
                    if (isSolidAt(chunk, bx, by, bz)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    // 指定した(x, z)列を上から探索し、最初に見つかった衝突ブロックの直上のYを返す(見つからない場合は0)
    function findGroundHeight(chunk, x, z, searchFromY) {
        for (let y = Math.min(searchFromY, ChunkStatic.SIZE_Y - 1); y >= 0; y--) {
            if (isSolidAt(chunk, x, y, z)) {
                return y + 1;
            }
        }
        return 0;
    }
    // X軸またはZ軸1軸のみを移動させ、移動先のAABBが衝突する場合は元の座標のまま留まらせる
    // (水ブロックはisCollidableAtがfalseのため衝突判定から自然に除外される)。
    // 呼び出し側は、もう一方の軸(isXAxisがtrueならz、falseならx)には直前の判定で確定済みの最新座標を渡すこと
    // (X軸→Z軸の順で1軸ずつ判定するため、Z軸判定にはX軸移動後のxを用いる元の実装の挙動を踏襲している)。
    function tryMoveHorizontalAxis(chunk, halfWidth, y, height, x, z, isXAxis, delta) {
        const newX = isXAxis ? x + delta : x;
        const newZ = isXAxis ? z : z + delta;
        if (aabbCollides(chunk, newX - halfWidth, newX + halfWidth, y, y + height, newZ - halfWidth, newZ + halfWidth)) {
            return isXAxis ? x : z;
        }
        return isXAxis ? newX : newZ;
    }
    function stepPlayer(chunk, state, input, deltaSeconds) {
        const halfWidth = PLAYER_HALF_WIDTH;
        const height = PLAYER_HEIGHT;
        let vy = state.velocityY;
        let onGround = state.onGround;
        // 重力を常時適用する(詳細システム設計書.Ver1.md 第2章 2.3)
        vy -= GRAVITY * deltaSeconds;
        // Spaceキー入力時、接地している場合のみ上方向の初速を与える
        if (input.jump && onGround) {
            vy = JUMP_SPEED;
            onGround = false;
        }
        let x = state.position.x;
        let y = state.position.y;
        let z = state.position.z;
        // WASD入力とカメラyawから水平移動ベクトルを算出する
        const forwardX = Math.sin(input.yaw);
        const forwardZ = Math.cos(input.yaw);
        const rightX = Math.cos(input.yaw);
        const rightZ = -Math.sin(input.yaw);
        let moveX = 0;
        let moveZ = 0;
        if (input.moveForward) {
            moveX += forwardX;
            moveZ += forwardZ;
        }
        if (input.moveBackward) {
            moveX -= forwardX;
            moveZ -= forwardZ;
        }
        if (input.moveRight) {
            moveX += rightX;
            moveZ += rightZ;
        }
        if (input.moveLeft) {
            moveX -= rightX;
            moveZ -= rightZ;
        }
        const moveLength = Math.hypot(moveX, moveZ);
        if (moveLength > 0) {
            moveX = (moveX / moveLength) * MOVE_SPEED * deltaSeconds;
            moveZ = (moveZ / moveLength) * MOVE_SPEED * deltaSeconds;
        }
        // X軸移動・Z軸移動を1軸ずつ判定する(片方の衝突がもう片方の移動を妨げないようにするため)
        x = tryMoveHorizontalAxis(chunk, halfWidth, y, height, x, z, true, moveX);
        z = tryMoveHorizontalAxis(chunk, halfWidth, y, height, x, z, false, moveZ);
        // Y軸移動(重力・ジャンプによる上下移動と着地・天井衝突の解決)
        const deltaY = vy * deltaSeconds;
        const newY = y + deltaY;
        if (deltaY < 0) {
            if (aabbCollides(chunk, x - halfWidth, x + halfWidth, newY, y, z - halfWidth, z + halfWidth)) {
                // 現在の足元より下から探索し、最初に衝突するブロックの直上に着地させる
                let landingY = newY;
                const startCandidate = Math.floor(y) - 1;
                const endCandidate = Math.floor(newY);
                for (let candidate = startCandidate; candidate >= endCandidate; candidate--) {
                    if (aabbCollides(chunk, x - halfWidth, x + halfWidth, candidate, candidate + 1, z - halfWidth, z + halfWidth)) {
                        landingY = candidate + 1;
                        break;
                    }
                }
                y = landingY;
                vy = 0;
                onGround = true;
            }
            else {
                y = newY;
                onGround = false;
            }
        }
        else if (deltaY > 0) {
            if (aabbCollides(chunk, x - halfWidth, x + halfWidth, y + height, newY + height, z - halfWidth, z + halfWidth)) {
                vy = 0;
            }
            else {
                y = newY;
            }
            onGround = false;
        }
        return {
            position: { x, y, z },
            velocityY: vy,
            onGround
        };
    }
    return {
        PLAYER_HALF_WIDTH: PLAYER_HALF_WIDTH,
        PLAYER_HEIGHT: PLAYER_HEIGHT,
        EYE_HEIGHT: EYE_HEIGHT,
        MOVE_SPEED: MOVE_SPEED,
        GRAVITY: GRAVITY,
        JUMP_SPEED: JUMP_SPEED,
        isSolidAt: isSolidAt,
        findGroundHeight: findGroundHeight,
        stepPlayer: stepPlayer
    };
});
//# sourceMappingURL=PlayerPhysics.js.map
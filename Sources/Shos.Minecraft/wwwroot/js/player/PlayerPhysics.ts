// プレイヤーの移動・重力・ジャンプ・AABB衝突判定(詳細システム設計書.Ver1.md 第2章 2.3 準拠)
// Babylon.js/DOM に依存しない純粋な物理ロジックのため、Node実行での実データ検証が可能。

interface IPlayerAabbPosition {
    x: number; // 中心X
    y: number; // 足元(AABB下端)のY
    z: number; // 中心Z
}

interface IPlayerState {
    position: IPlayerAabbPosition;
    velocityY: number;
    onGround: boolean;
}

interface IPlayerInputState {
    moveForward: boolean;
    moveBackward: boolean;
    moveLeft: boolean;
    moveRight: boolean;
    jump: boolean;
    yaw: number; // ラジアン。Babylon.js UniversalCamera の rotation.y に対応
}

interface IPlayerPhysicsModule {
    // 仕様書に具体的な数値がないため、「数値は概略でよい」(ゲーム仕様書.Ver1.md 第5章)の許容範囲内で
    // 選定した暫定値。プレイヤーの当たり判定(AABB)の寸法・移動速度・重力・ジャンプ初速はいずれも
    // サーバー保存や公開APIに影響しないローカル値であるため、実装進捗に暫定値として記録する。
    PLAYER_HALF_WIDTH: number;
    PLAYER_HEIGHT: number;
    EYE_HEIGHT: number;
    MOVE_SPEED: number;
    GRAVITY: number;
    JUMP_SPEED: number;
    isSolidAt(chunk: IChunk, x: number, y: number, z: number): boolean;
    findGroundHeight(chunk: IChunk, x: number, z: number, searchFromY: number): number;
    stepPlayer(chunk: IChunk, state: IPlayerState, input: IPlayerInputState, deltaSeconds: number): IPlayerState;
}

(function (root: typeof globalThis, factory: (chunkStatic: IChunkStatic) => IPlayerPhysicsModule): void {
    "use strict";
    if (typeof module === "object" && module && module.exports) {
        module.exports = factory(require("../world/Chunk.js"));
    } else {
        (root as any).ShosMinecraft = (root as any).ShosMinecraft || {};
        (root as any).ShosMinecraft.PlayerPhysics = factory((root as any).ShosMinecraft.Chunk);
    }
})(globalThis, function (ChunkStatic: IChunkStatic): IPlayerPhysicsModule {
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
    function isSolidAt(chunk: IChunk, x: number, y: number, z: number): boolean {
        if (x < 0 || x >= ChunkStatic.SIZE_X || y < 0 || y >= ChunkStatic.SIZE_Y || z < 0 || z >= ChunkStatic.SIZE_Z) {
            return false;
        }
        return chunk.isCollidableAt(Math.floor(x), Math.floor(y), Math.floor(z));
    }

    // 水平方向のAABB([minX,maxX) x [minY,maxY) x [minZ,maxZ))がいずれかの衝突ブロックと重なるか判定する
    function aabbCollides(chunk: IChunk, minX: number, maxX: number, minY: number, maxY: number, minZ: number, maxZ: number): boolean {
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
    function findGroundHeight(chunk: IChunk, x: number, z: number, searchFromY: number): number {
        for (let y = Math.min(searchFromY, ChunkStatic.SIZE_Y - 1); y >= 0; y--) {
            if (isSolidAt(chunk, x, y, z)) {
                return y + 1;
            }
        }
        return 0;
    }

    function stepPlayer(chunk: IChunk, state: IPlayerState, input: IPlayerInputState, deltaSeconds: number): IPlayerState {
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
        if (input.moveForward) { moveX += forwardX; moveZ += forwardZ; }
        if (input.moveBackward) { moveX -= forwardX; moveZ -= forwardZ; }
        if (input.moveRight) { moveX += rightX; moveZ += rightZ; }
        if (input.moveLeft) { moveX -= rightX; moveZ -= rightZ; }

        const moveLength = Math.hypot(moveX, moveZ);
        if (moveLength > 0) {
            moveX = (moveX / moveLength) * MOVE_SPEED * deltaSeconds;
            moveZ = (moveZ / moveLength) * MOVE_SPEED * deltaSeconds;
        }

        // X軸移動(水ブロックはisCollidableAtがfalseのため衝突判定から自然に除外される)
        const newX = x + moveX;
        if (!aabbCollides(chunk, newX - halfWidth, newX + halfWidth, y, y + height, z - halfWidth, z + halfWidth)) {
            x = newX;
        }

        // Z軸移動
        const newZ = z + moveZ;
        if (!aabbCollides(chunk, x - halfWidth, x + halfWidth, y, y + height, newZ - halfWidth, newZ + halfWidth)) {
            z = newZ;
        }

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
            } else {
                y = newY;
                onGround = false;
            }
        } else if (deltaY > 0) {
            if (aabbCollides(chunk, x - halfWidth, x + halfWidth, y + height, newY + height, z - halfWidth, z + halfWidth)) {
                vy = 0;
            } else {
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

// 出典: Specifications/詳細システム設計書.Ver1.md 第2章 2.1 ボクセルデータ構造 & チャンク管理

export interface IBlockType {
    id: number;
    name: string;
    isCollidable: boolean;      // 衝突判定の有無(水のみ false)
    isBreakable: boolean;       // 破壊可否(空気・水のみ false)
    requiredTool: "none" | "woodenPickaxe";
    breakTimeSeconds: number;   // 0.5 または 1.0(破壊不可の場合は 0)
    dropBlockId: number | null;
}

export const BlockTypes: readonly IBlockType[] = [
    {
        id: 0,
        name: "air",
        isCollidable: false,
        isBreakable: false,
        requiredTool: "none",
        breakTimeSeconds: 0,
        dropBlockId: null,
    },
    {
        id: 1,
        name: "dirt",
        isCollidable: true,
        isBreakable: true,
        requiredTool: "none",
        breakTimeSeconds: 0.5,
        dropBlockId: 1,
    },
    {
        id: 2,
        name: "grass",
        isCollidable: true,
        isBreakable: true,
        requiredTool: "none",
        breakTimeSeconds: 0.5,
        dropBlockId: 1,
    },
    {
        id: 3,
        name: "stone",
        isCollidable: true,
        isBreakable: true,
        requiredTool: "woodenPickaxe",
        breakTimeSeconds: 1.0,
        dropBlockId: 4,
    },
    {
        id: 4,
        name: "cobblestone",
        isCollidable: true,
        isBreakable: true,
        requiredTool: "woodenPickaxe",
        breakTimeSeconds: 1.0,
        dropBlockId: 4,
    },
    {
        id: 5,
        name: "log",
        isCollidable: true,
        isBreakable: true,
        requiredTool: "none",
        breakTimeSeconds: 0.5,
        dropBlockId: 5,
    },
    {
        id: 6,
        name: "wood",
        isCollidable: true,
        isBreakable: true,
        requiredTool: "none",
        breakTimeSeconds: 0.5,
        dropBlockId: 6,
    },
    {
        id: 7,
        name: "leaves",
        isCollidable: true,
        isBreakable: true,
        requiredTool: "none",
        breakTimeSeconds: 0.5,
        dropBlockId: 7, // ドロップ確率の仕様は計画書ステップ7で確認中(未確定のため確率判定は未実装)
    },
    {
        id: 8,
        name: "water",
        isCollidable: false,
        isBreakable: false,
        requiredTool: "none",
        breakTimeSeconds: 0,
        dropBlockId: null,
    },
    {
        id: 9,
        name: "sand",
        isCollidable: true,
        isBreakable: true,
        requiredTool: "none",
        breakTimeSeconds: 0.5,
        dropBlockId: 9,
    },
    {
        id: 10,
        name: "craftingTable",
        isCollidable: true,
        isBreakable: true,
        requiredTool: "none",
        breakTimeSeconds: 0.5,
        dropBlockId: 10,
    },
];

export function getBlockType(id: number): IBlockType {
    const blockType = BlockTypes[id];
    if (!blockType) {
        throw new Error(`Unknown block id: ${id}`);
    }
    return blockType;
}

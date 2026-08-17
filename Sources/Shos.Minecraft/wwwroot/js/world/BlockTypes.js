// ブロックIDと属性の対応表(詳細システム設計書.Ver1.md 第2章 2.1 準拠)
(function (root, factory) {
    "use strict";
    if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.ShosMinecraft = root.ShosMinecraft || {};
        root.ShosMinecraft.BlockTypes = factory();
    }
})(typeof self !== "undefined" ? self : this, function () {
    "use strict";

    var BLOCK_TYPES = Object.freeze({
        0: Object.freeze({ id: 0, name: "空気", isCollidable: false, isBreakable: false, requiredTool: "none", breakTimeSeconds: 0, dropBlockId: null }),
        1: Object.freeze({ id: 1, name: "土", isCollidable: true, isBreakable: true, requiredTool: "none", breakTimeSeconds: 0.5, dropBlockId: 1 }),
        2: Object.freeze({ id: 2, name: "草(草ブロック)", isCollidable: true, isBreakable: true, requiredTool: "none", breakTimeSeconds: 0.5, dropBlockId: 1 }),
        3: Object.freeze({ id: 3, name: "石", isCollidable: true, isBreakable: true, requiredTool: "woodenPickaxe", breakTimeSeconds: 1.0, dropBlockId: 4 }),
        4: Object.freeze({ id: 4, name: "丸石", isCollidable: true, isBreakable: true, requiredTool: "woodenPickaxe", breakTimeSeconds: 1.0, dropBlockId: 4 }),
        5: Object.freeze({ id: 5, name: "原木", isCollidable: true, isBreakable: true, requiredTool: "none", breakTimeSeconds: 0.5, dropBlockId: 5 }),
        6: Object.freeze({ id: 6, name: "木材", isCollidable: true, isBreakable: true, requiredTool: "none", breakTimeSeconds: 0.5, dropBlockId: 6 }),
        7: Object.freeze({ id: 7, name: "葉", isCollidable: true, isBreakable: true, requiredTool: "none", breakTimeSeconds: 0.5, dropBlockId: 7 }),
        8: Object.freeze({ id: 8, name: "水", isCollidable: false, isBreakable: false, requiredTool: "none", breakTimeSeconds: 0, dropBlockId: null }),
        9: Object.freeze({ id: 9, name: "砂", isCollidable: true, isBreakable: true, requiredTool: "none", breakTimeSeconds: 0.5, dropBlockId: 9 }),
        10: Object.freeze({ id: 10, name: "作業台", isCollidable: true, isBreakable: true, requiredTool: "none", breakTimeSeconds: 0.5, dropBlockId: 10 })
    });

    function getBlockType(blockId) {
        var blockType = BLOCK_TYPES[blockId];
        if (!blockType) {
            throw new RangeError("未定義のブロックIDです: " + blockId);
        }
        return blockType;
    }

    function isCollidable(blockId) {
        return getBlockType(blockId).isCollidable;
    }

    function isBreakable(blockId) {
        return getBlockType(blockId).isBreakable;
    }

    return {
        BLOCK_TYPES: BLOCK_TYPES,
        getBlockType: getBlockType,
        isCollidable: isCollidable,
        isBreakable: isBreakable
    };
});

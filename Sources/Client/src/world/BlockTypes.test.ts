import { describe, expect, it } from "vitest";
import { BlockTypes, getBlockType } from "./BlockTypes";

describe("BlockTypes", () => {
    it("defines exactly IDs 0 through 10", () => {
        expect(BlockTypes.map((blockType) => blockType.id)).toEqual(
            Array.from({ length: 11 }, (_, id) => id),
        );
    });

    it("requires a wooden pickaxe to break stone (ID 3)", () => {
        expect(getBlockType(3).requiredTool).toBe("woodenPickaxe");
    });

    it("treats water (ID 8) as non-collidable", () => {
        expect(getBlockType(8).isCollidable).toBe(false);
    });
});

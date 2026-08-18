namespace Shos.Minecraft.Terrain
{
    // 暫定措置: Worlds テーブルへの永続化(ステップ8)が実装されるまでの間、
    // WorldId から決定的に Seed を導出する(ユーザー承認済み。Plans/実装進捗.Ver1.md ステップ4参照)。
    // ステップ8で POST /api/worlds によるシード生成・永続化が実装され次第、この暫定導出は置き換える。
    public static class WorldSeedProvider
    {
        public static int DeriveSeedFromWorldId(Guid worldId)
        {
            // FNV-1a 32bit: Guid.GetHashCode() のランタイム依存を避けるため、決定的なハッシュを独自算出する
            const uint fnvOffsetBasis = 2166136261;
            const uint fnvPrime = 16777619;

            uint hash = fnvOffsetBasis;
            foreach (byte b in worldId.ToByteArray())
            {
                hash ^= b;
                hash *= fnvPrime;
            }

            return unchecked((int)hash);
        }
    }
}

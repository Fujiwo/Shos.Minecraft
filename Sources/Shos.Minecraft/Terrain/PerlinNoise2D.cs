namespace Shos.Minecraft.Terrain;

// シード値から決定的な地形を再現するための2次元パーリンノイズ(詳細システム設計書.Ver1.md 第2章 2.5 準拠)
public sealed class PerlinNoise2D
{
    // パーミュテーションテーブルの長さ(2の累乗である必要がある)
    const int tableLength = 0x100;
    // パーミュテーションテーブル(0～255の整数をランダムに並べた配列)を2倍に拡張して保持
    readonly int[] _permutation;

    // シード値から決定的なパーミュテーションテーブルを生成
    public PerlinNoise2D(int seed)
    {
        var table = new int[tableLength];
        for (int i = 0; i < tableLength; i++)
            table[i] = i;

        // Random(seed) は同一.NETバージョン内で決定的なため、同一シードから同一並びを再現できる
        var random = new Random(seed);
        for (int i = tableLength - 1; i > 0; i--) {
            int j = random.Next(i + 1);
            (table[i], table[j]) = (table[j], table[i]);
        }

        _permutation = new int[tableLength * 2];
        for (int i = 0; i < tableLength * 2; i++)
            _permutation[i] = table[i & (tableLength - 1)];
    }

    // おおよそ [-1, 1] の範囲を返す
    public double Noise(double x, double y)
    {
        int xi = (int)Math.Floor(x) & (tableLength - 1);
        int yi = (int)Math.Floor(y) & (tableLength - 1);
        double xf = x - Math.Floor(x);
        double yf = y - Math.Floor(y);

        double u = Fade(xf);
        double v = Fade(yf);

        int aa = _permutation[_permutation[xi] + yi];
        int ab = _permutation[_permutation[xi] + yi + 1];
        int ba = _permutation[_permutation[xi + 1] + yi];
        int bb = _permutation[_permutation[xi + 1] + yi + 1];

        double x1 = Lerp(Grad(aa, xf, yf), Grad(ba, xf - 1, yf), u);
        double x2 = Lerp(Grad(ab, xf, yf - 1), Grad(bb, xf - 1, yf - 1), u);

        return Lerp(x1, x2, v);
    }

    // Perlinノイズの滑らかさを制御するための補間関数
    static double Fade(double t) => t * t * t * (t * (t * 6 - 15) + 10);

    // 線形補間関数
    static double Lerp(double a, double b, double t) => a + t * (b - a);

    // ハッシュ値に基づいて勾配ベクトルを計算する関数
    static double Grad(int hash, double x, double y)
    {
        int h = hash & 3;
        double u = h < 2 ? x : y;
        double v = h < 2 ? y : x;
        return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
    }
}

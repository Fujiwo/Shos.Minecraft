namespace Shos.Minecraft.Terrain
{
    // シード値から決定的な地形を再現するための2次元パーリンノイズ(詳細システム設計書.Ver1.md 第2章 2.5 準拠)
    public sealed class PerlinNoise2D
    {
        private readonly int[] _permutation;

        public PerlinNoise2D(int seed)
        {
            var table = new int[256];
            for (int i = 0; i < 256; i++)
            {
                table[i] = i;
            }

            // Random(seed) は同一.NETバージョン内で決定的なため、同一シードから同一並びを再現できる
            var random = new Random(seed);
            for (int i = 255; i > 0; i--)
            {
                int j = random.Next(i + 1);
                (table[i], table[j]) = (table[j], table[i]);
            }

            _permutation = new int[512];
            for (int i = 0; i < 512; i++)
            {
                _permutation[i] = table[i & 255];
            }
        }

        // おおよそ [-1, 1] の範囲を返す
        public double Noise(double x, double y)
        {
            int xi = (int)Math.Floor(x) & 255;
            int yi = (int)Math.Floor(y) & 255;
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

        private static double Fade(double t) => t * t * t * (t * (t * 6 - 15) + 10);

        private static double Lerp(double a, double b, double t) => a + t * (b - a);

        private static double Grad(int hash, double x, double y)
        {
            int h = hash & 3;
            double u = h < 2 ? x : y;
            double v = h < 2 ? y : x;
            return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
        }
    }
}

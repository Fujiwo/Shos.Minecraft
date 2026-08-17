// ゲーム画面(#game-canvas)の起動処理。実際の描画エンジン初期化は後続ステップで追加する。
(function () {
    "use strict";

    function resizeCanvas(canvas) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }

    function initializeGame() {
        var canvas = document.getElementById("game-canvas");
        if (!canvas) {
            console.error("game.js: #game-canvas が見つかりません。");
            return;
        }

        resizeCanvas(canvas);
        window.addEventListener("resize", function () {
            resizeCanvas(canvas);
        });

        canvas.dataset.initialized = "true";
        console.info("game.js: ゲーム画面を初期化しました。");
    }

    document.addEventListener("DOMContentLoaded", initializeGame);
})();

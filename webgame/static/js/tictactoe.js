var database = firebase.database();

/**
 * **** **** **** **** **** **** **** ****
 * 定数
 * **** **** **** **** **** **** **** ****
 */
INTERVAL = 32;          // 30FPS（1フレームを32ms間隔で処理）

CELL_SIZE = 96;        // セルサイズ

// ステージの位置
STAGE_WIDTH = 640;
STAGE_LEFT = STAGE_WIDTH / 2 - CELL_SIZE * 1.5
STAGE_HEIGHT = 480;
STAGE_TOP = STAGE_HEIGHT / 2 - CELL_SIZE * 1.5 + 40

// STAGE_WIDTH = document.body.clientWidth;
// if (STAGE_WIDTH > 640){
//     STAGE_LEFT = (STAGE_WIDTH - 640) / 2;
// }
// else{
//     STAGE_LEFT = 0;
// }


/**
 * **** **** **** **** **** **** **** ****
 * クラス
 * **** **** **** **** **** **** **** ****
 */
/**
 * セルクラス
 */
class Cell {
    /**
     * @param left      左端のx座標
     * @param top       上端のy座標
     * @param width     セルの幅
     * @param height    セルの高さ
     */
    constructor(left, top, width, height) {
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }
    /**
     * x, y座標がセルの範囲内か判定
     * @param x x座標
     * @param y y座標
     */
    isWithin(x, y) {
        if (x < this.left || this.left + this.width < x) return false;
        if (y < this.top || this.top + this.height < y) return false;
        return true;
    }
}

/**
 * **** **** **** **** **** **** **** ****
 * グローバル変数
 * **** **** **** **** **** **** **** ****
 */
let canvas = null;              // キャンバス
let context = null;             // 描画用コンテキスト
// フラグ
let phase = -1;                 // ゲームフェーズフラグ {0: タイトルフェーズ, 1: カウントダウンフェーズ, 2: タッチフェーズ, 3: ゲームオーバーフェーズ}
let isTitleGuide = true;        // タイトルガイド点滅用フラグ {true: 表示, false: 非表示}

// 時間制御用の最終取得時刻
let lastTitleTime = -1;         // タイトルガイド表示切替用
let lastCountDownTime = -1;     // カウントダウン表示用
let lastPutTime = -1;           // 配置用
let lastReducedTime = -1;       // 残り時間更新用
let lastTimeUpTime = -1;        // タイムアップ表示用

// ゲームデータ
let map = null;                 // マップデータ
let data = null;
let count = -1;                 // カウントダウン用の残りカウント
let remainingTime = -1;         // 残り時間
let score = 0;                  // スコア
let highScore = 0;              // ハイスコア

let cells = new Array(3);       // セル
for (let y = 0; y < cells.length; y++) {
    cells[y] = new Array(3);
}
for (let y = 0; y < cells.length; y++) {
    for (let x = 0; x < cells[y].length; x++) {
        cells[y][x] = new Cell(STAGE_LEFT + CELL_SIZE * x,
            STAGE_TOP + CELL_SIZE * y, CELL_SIZE, CELL_SIZE);
    }
}

let turn = null;
let winner = null;
let backtitle = new Path2D();


/**
 * **** **** **** **** **** **** **** ****
 * メイン処理
 * **** **** **** **** **** **** **** ****
 */
/**
 * 全体の初期化処理
 */
function init() {
    // キャンバス要素の取得
    canvas = document.getElementById("a_canvas");
    // 描画用コンテキストの取得
    context = canvas.getContext("2d");
    // イベントリスナの追加
    canvas.addEventListener('click', onCanvasLClick, false);

    drawTitle();

    // ゲームデータのリセット
    resetData();

    firebasetest();

}
/**
 * メインループの開始
 */
function runMainLoop() {
    // ゲームフェーズをタイトルフェーズに移行する。
    phase = 0;

	// メインループを開始する。
    setTimeout(mainLoop, 0);
    lastTitleTime = Date.now();
}
/**
 * メインループ
 */
function mainLoop() {
    let mainLoopTimer = setTimeout(mainLoop, INTERVAL);
    let now = -1;

    switch (phase) {
    case 0:
        // タイトルフェーズ
        now = Date.now();
        if (now - lastTitleTime >= 500) {
            // 0.5秒に1回のタイミングでタイトルガイドを点滅させる。
            lastTitleTime = Date.now();
            isTitleGuide = !isTitleGuide;
        }
        drawTitle();
        drawBackTitle(backtitle);
        break;
    case 1:             // 以下を追加
        // カウントダウンフェーズ
        now = Date.now();
        if (now - lastCountDownTime >= 1000) {
            // 1秒に1回カウントダウンする。
            lastCountDownTime = Date.now();
            if (--count < 0) {
                // カウントダウンが終了したらタッチフェーズに移行する。
                phase = 2;
                lastPutTime = Date.now();
                lastReducedTime = Date.now();
            }
        }
        drawBackground();
        drawCount();
        break;
    case 2:                 // 以下を追加
        // タッチフェーズ
        now = Date.now();

        drawBackground();
        drawMap();
        drawTurn();
        break;
    case 3:     // 以下を追加
        // ゲームオーバーフェーズ
        now = Date.now();
        if (now - lastTimeUpTime >= 3000) {
            // タイムアップ表示後3秒後にタイトルフェーズに移行する。
            phase = 0;
        }
        drawBackground();
        drawResult("引き分け")
        drawMap();
        break;
    case 4:     // 以下を追加
        // ゲームオーバーフェーズ
        now = Date.now();
        if (now - lastTimeUpTime >= 3000) {
            // タイムアップ表示後3秒後にタイトルフェーズに移行する。
            phase = 0;
        }
        drawBackground();
        drawResult("〇の勝ち")
        drawMap();
        break;
    case 5:     // 以下を追加
        // ゲームオーバーフェーズ
        now = Date.now();
        if (now - lastTimeUpTime >= 3000) {
            // タイムアップ表示後3秒後にタイトルフェーズに移行する。
            phase = 0;
        }
        drawBackground();
        drawResult("☓の勝ち")
        drawMap();
        break;
    }
}

/**
 * ページ読込み
 */
$(function() {
    // 全体の初期化処理
    init();
    // メインループの開始
    runMainLoop();
});
/**
 * ウィンドウ座標からキャンバス座標に変換する
 * @param wx		ウィンドウ上のx座標
 * @param wy		ウィンドウ上のy座標
 */
function windowToCanvas(wx, wy) {
	let bbox = canvas.getBoundingClientRect();
	return {
		x: (wx - bbox.left) * (canvas.width / bbox.width),
		y: (wy - bbox.top)  * (canvas.height / bbox.height)
	};
}
/**
 * ゲームデータのリセット
 */
function resetData() {
    resetMap();
    count = 3;
    turn = 1;
    winner = null;
}

/**
 * マップデータのリセット
 */
function resetMap() {
    map = new Array(3);       // セル
    for (let y = 0; y < map.length; y++) {
        map[y] = new Array(3);
        for (let x = 0; x < map[0].length; x++) {
            map[y][x] = 0;
        }
    }
}

/**
 * **** **** **** **** **** **** **** ****
 * イベント関連
 * **** **** **** **** **** **** **** ****
 */
function put(x, y){
    map[y][x] = turn;
    if (check_winner(x, y)){
        lastTimeUpTime = Date.now();
        winner = turn;
        phase = turn === 1 ? 4:5;
        return;
    }
    if (check_finish()){
        lastTimeUpTime = Date.now();
        winner = 0;
        phase = 3;
        return;
    }
    turn *= -1;
}

function check_finish(){
    for (let i = 0; i < map.length; i++){
        for (let j = 0; j < map[0].length; j++){
            if (map[i][j] === 0){
                return false;
            }
        }
    }
    return true;
}

function check_winner(x, y){
    if (connected(x, y,1, 0) ||  connected(x, y,0, 1) ||
        connected(x, y,1, 1) || connected(x, y, -1, 1))
        return true;
    return false;
}

function connected(x, y, step_x, step_y){
    let count = 0
    for (let abc = 0; abc < 2; abc++){
        let index_x = step_x;
        let index_y = step_y;
        while (0 <= x + index_x && x + index_x < 3 && 0 <= y + index_y && y + index_y < 3){
            if (map[y + index_y][x + index_x] !== turn){
                break;
            }
            else{
                count += 1;
                index_x += step_x;
                index_y += step_y;
            }
            if (count === 2){
                return true;
            }
        }
        step_x *= -1;
        step_y *= -1;
    }
    return false;
}

/**
 * キャンバスへのマウスクリック
 */
function onCanvasLClick(e) {
    let loc = windowToCanvas(e.clientX, e.clientY);
    switch (phase) {
    case 0:
        if (context.isPointInPath(backtitle, loc.x, loc.y)) {
            window.location.href = document.referrer;
            break;
        }
	    // タイトルフェーズで画面がクリックされた
        lastCountDownTime = Date.now();
	    resetData();
	    // カウントダウンフェーズに移行する。

	    phase = 1;
	    break;
    case 2:     // 以下を追加
        // if (context.isPointInPath(item1, loc.x, loc.y) && item1_n > 0) {
        //     break;
        // }
        // if (context.isPointInPath(item2, loc.x, loc.y) && item2_n > 0) {
        //     break;
        // }
        // タッチフェーズでセルがクリックされた
        for (let y = 0; y < cells.length; y++) {
            for (let x = 0; x < cells[0].length; x++) {
                if (cells[y][x].isWithin(loc.x, loc.y)) {
                    isTouched(x, y);
                    break;
                }
            }
        }
    }
}
/**
 * ターゲットがタッチされたか判定
 * @param x タッチされたx座標
 * @param y タッチされたy座標
 * @return true: 正解, false: ミス
 */
function isTouched(x, y) {
    if (map[y][x] === 0){
        put(x, y);
    }
}


/**
 * **** **** **** **** **** **** **** ****
 * ビュー関連
 * **** **** **** **** **** **** **** ****
 */
/**
 * マップの描画
 */
function drawMap() {
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[0].length; x++) {
            let left = STAGE_LEFT + CELL_SIZE * x;
            let top = STAGE_TOP + CELL_SIZE * y;
            let str = "";
            context.strokeStyle = "black";
            context.fillStyle = "white";
            context.strokeRect(left, top, CELL_SIZE, CELL_SIZE);
            context.fillRect(left, top, CELL_SIZE, CELL_SIZE);
            context.fillStyle = "red";
            context.font = "20px arial";
            context.textAlign = "center";
            context.textBaseline = "middle";
            if (map[y][x] === 1){
                str = "〇";
            }
            else if (map[y][x] === -1){
                str = "☓";
            }
            context.fillText(str, STAGE_LEFT + CELL_SIZE * (x + 0.5), STAGE_TOP + CELL_SIZE * (y + 0.5));
        }
    }
}

/**
 * タイトル画面の描画
 */
function drawTitle() {
    context.fillStyle = '#222222';
    context.fillRect(0, 0, 640, 480);
    context.fillStyle = "white";
    context.font = "50px arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = null;
    context.shadowOffsetX = null;
    context.shadowOffsetY = null;
    context.shadowBlur = null;
    context.fillText("Tictactoe", 320, 100);

    if (isTitleGuide === false) return;

    context.fillStyle = "white";
    context.font = "32px arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = null;
    context.shadowOffsetX = null;
    context.shadowOffsetY = null;
    context.shadowBlur = null;
    context.fillText("Click anywhere to start.", 320, 280);
}
/**
 * スコアの描画
 */
function drawResult(str) {
    context.fillStyle = "white";
    context.font = "40px arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = null;
    context.shadowOffsetX = null;
    context.shadowOffsetY = null;
    context.shadowBlur = null;
    context.fillText(str, 320, 80);
}

function drawTurn() {
    context.fillStyle = "red";
    context.font = "40px arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = null;
    context.shadowOffsetX = null;
    context.shadowOffsetY = null;
    context.shadowBlur = null;
    let str = turn === 1 ? "〇" : "☓";
    context.fillText(String(str) + "のターンです", 320, 80);
}

/**
 * 背景の描画
 */
function drawBackground() {
    context.fillStyle = '#222222';
    context.fillRect(0, 0, 640, 480);
}

/**
 * カウントの描画
 */
function drawCount() {
    let strCount = count <= 0 ? "GO!" : count;

    context.fillStyle = "white";
    context.font = "384px arial";
    context.textAlign = "center";
    context.textBaseline = "top";
    context.shadowColor = "black";
    context.shadowOffsetX = 5;
    context.shadowOffsetY = 5;
    context.shadowBlur = 20;
    context.fillText(strCount, canvas.width / 2, STAGE_TOP - 70, STAGE_WIDTH);
}
function drawBackTitle(contex, y = 5, x = 5, w = 60, h = 40) {
    contex.rect(x, y, w, h);
    context.strokeStyle = "white";
    context.fillStyle = "#00FFFF";
    context.stroke(contex);
    context.fill(contex);
    context.fillStyle = "white";
    context.textAlign = "center";
    context.font = "20px serif";
    context.fillText("back", x + 30, y + 20);
}

function firebasetest() {
    var commentsRef = firebase.database().ref('comments');
    commentsRef.set({ body: "テスト！" });
    console.log("firebasetest");
}


// /**
//  * 残り時間の描画
//  */
// function drawRemainingTime() {
//     context.fillStyle = remainingTime <= 5 ? "red" : "white";
//     context.font = "48px arial";
//     context.textAlign = "center";
//     context.textBaseline = "middle";
//     context.shadowColor = null;
//     context.shadowOffsetX = null;
//     context.shadowOffsetY = null;
//     context.shadowBlur = null;
//     context.fillText(String(remainingTime), 320, 40);
// }
// function drawTimer() {
//     context.fillStyle = "white";
//     context.font = "48px arial";
//     context.textAlign = "center";
//     context.textBaseline = "middle";
//     context.shadowColor = null;
//     context.shadowOffsetX = null;
//     context.shadowOffsetY = null;
//     context.shadowBlur = null;
//     context.fillText(String(timer()), 320, 30);
// }
// /**
//  * タイムアップの描画
//  */
// function drawTimeUp() {
//     context.fillStyle = "white";
//     context.font = "384px arial";
//     context.textAlign = "center";
//     context.textBaseline = "top";
//     context.shadowColor = "black";
//     context.shadowOffsetX = 5;
//     context.shadowOffsetY = 5;
//     context.shadowBlur = 20;
//     context.fillText("TIME UP!", canvas.width / 2, STAGE_TOP, STAGE_WIDTH);
// }
//
// function drawbombnum() {
//     context.fillStyle = "white";
//     context.font = "20px arial";
//     context.textAlign = "left";
//     context.textBaseline = "top";
//     context.shadowColor = null;
//     context.shadowOffsetX = null;
//     context.shadowOffsetY = null;
//     context.shadowBlur = null;
//     context.fillText("Bomb", 516, 16);
//
//     context.fillStyle = "white";
//     context.font = "20px arial";
//     context.textAlign = "right";
//     context.textBaseline = "top";
//     context.shadowColor = null;
//     context.shadowOffsetX = null;
//     context.shadowOffsetY = null;
//     context.shadowBlur = null;
//     context.fillText(String(bomb_n), 608, 16);
// }
//
//
// //時間カウント
// function timer(){
//     countloopTimer = setTimeout(timer, INTERVAL);
//
//     let t = Date.now() - s_time;
//     let h = Math.floor(t / 3600000);
//     let m = Math.floor((t - 3600000 * h) / 60000);
//     let ms = t % 60000;
//     h = ("00" + h).slice(-2);
//     m = ("00" + m).slice(-2);
//     ms = ("00000" + ms).slice(-5);
//
//     return h + ":" + m + ":" + ms.slice(0, 2) + ":" + ms.slice(2, 5);
// }
//
// //タイマースタート
// function countstart(){
//     s_time = Date.now();
//     setTimeout(timer, 0);
// }
//
// //タイマー終了
// function countfinish(){
//     console.log("test2");
//     clearTimeout(countloopTimer);
// }
//
// function drawitem1(contex, y = 100, x = 10 , w = 40, h = 40) {
//     contex.rect(x, y, w, h);
//     context.strokeStyle = "white";
//     context.fillStyle = "#32EEFF";
//     context.stroke(contex);
//     context.fill(contex);
//     context.fillStyle = "white";
//     context.textAlign = "center";
//     context.font = "20px serif";
//     context.fillText(String(item1_n), x + 20, y + 10);
// }
// function drawitem2(contex, y = 200, x = 10 , w = 40, h = 40) {
//     contex.rect(x, y, w, h);
//     context.strokeStyle = "white";
//     context.fillStyle = "#FF1A6F";
//     context.stroke(contex);
//     context.fill(contex);
//     context.fillStyle = "white";
//     context.textAlign = "center";
//     context.font = "20px serif";
//     context.fillText(String(item2_n), x + 20, y + 10);
// }



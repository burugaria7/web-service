/**
 * **** **** **** **** **** **** **** ****
 * 定数
 * **** **** **** **** **** **** **** ****
 */
INTERVAL = 32;          // 30FPS（1フレームを32ms間隔で処理）
CELL_SIZE = 32;        // セルサイズ

// ステージの位置
STAGE_WIDTH = 512;
STAGE_HEIGHT = 384;
STAGE_LEFT = 64;
STAGE_TOP = 80;


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

// let cells = new Array(12);       // セル
// for (let y = 0; y < cells.length; y++) {
//     cells[y] = new Array(16);
// }
// for (let y = 0; y < cells.length; y++) {
//     for (let x = 0; x < cells[y].length; x++) {
//         cells[y][x] = new Cell(STAGE_LEFT + CELL_SIZE * x, STAGE_TOP + CELL_SIZE * y, CELL_SIZE, CELL_SIZE);
//     }
// }
//
// let data = new Array(12);       // セル
// for (let y = 0; y < data.length; y++) {
//     data[y] = new Array(16);
//     for (let x = 0; x < data[y].length; x++) {
//         data[y][x] = 0;
//     }
// }

let mapmake_f = true;

let n = 0;
let bomb_n = null;
let flag_n = 0;
let map_x = null;
let map_y = null;

let s_time = 0;
let countloopTimer = null;
let countstart_f = true;

let item1 = new Path2D();
let item2 = new Path2D();
let backtitle = new Path2D();

let item1_n = null;
let item2_n = null;

let bombplace = [];

let turn = 1;

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

    canvas.addEventListener('contextmenu', onCanvasRClick, false);

    drawTitle();

    // ゲームデータのリセット
    resetData();

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
        if (mapmake_f){
            putbomb();
            allcount();
            firstopen();
            mapmake_f = false;
        }
        break;
    case 2:                 // 以下を追加
        if (countstart_f){
            countstart();
            countstart_f = false;
        }
        // タッチフェーズ
        now = Date.now();
        drawBackground();
        drawMap();
        drawTimer();
        drawflagnum();
        drawbombnum();
        drawitem1(item1);
        drawitem2(item2);
        // drawBackTitle(backtitle);
        break;
    case 3:     // 以下を追加
        // ゲームオーバーフェーズ
        now = Date.now();
        if (now - lastTimeUpTime >= 3000) {
            // タイムアップ表示後3秒後にタイトルフェーズに移行する。
            phase = 0;
        }
        drawBackground();
        drawMap();
        drawRemainingTime();
        drawTimeUp();
        break;
    case 4:     // 以下を追加
        now = Date.now();
        if (now - lastTimeUpTime >= 3000) {
            // タイムアップ表示後3秒後にタイトルフェーズに移行する。
            phase = 0;
        }
        // // ゲームオーバーフェーズ
        drawclear();
        break;
    case 5:     // 以下を追加
        now = Date.now();
        if (now - lastTimeUpTime >= 3000) {
            // タイムアップ表示後3秒後にタイトルフェーズに移行する。
            phase = 0;
        }
        // ゲームオーバーフェーズ
        // drawfaild();
        drawBackground();
        drawMap();
        drawflagnum();
        break;
    }
}

/**
 * **** **** **** **** **** **** **** ****
 * イベント関連
 * **** **** **** **** **** **** **** ****
 */
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
    remainingTime = 300;
    score = 0;
    mapmake_f = true;
    n = 0;
    flag_n = 0;
    countstart_f = true;
    bombplace = [];
}

/**
 * マップデータのリセット
 */
function resetMap() {
    // STAGE_LEFT = (STAGE_WIDTH - CELL_SIZE * map_x) / 2;
    // STAGE_TOP = (STAGE_HEIGHT - CELL_SIZE * map_y) / 2;
    cells = new Array(map_y);       // セル
    for (let y = 0; y < cells.length; y++) {
        cells[y] = new Array(map_x);
    }
    for (let y = 0; y < cells.length; y++) {
        for (let x = 0; x < cells[y].length; x++) {
            cells[y][x] = new Cell(STAGE_LEFT + CELL_SIZE * x, STAGE_TOP + CELL_SIZE * y, CELL_SIZE, CELL_SIZE);
        }
    }

    data = new Array(map_y);       // セル
    for (let y = 0; y < data.length; y++) {
        data[y] = new Array(map_x);
        for (let x = 0; x < data[y].length; x++) {
            data[y][x] = 0;
        }
    }

    map = new Array(map_y);       // セル
    for (let y = 0; y < map.length; y++) {
        map[y] = new Array(map_x);
        for (let x = 0; x < map[0].length; x++) {
            map[y][x] = 0;
        }
    }
    for (let y = 0; y < data.length; y++) {
        for (let x = 0; x < data[0].length; x++) {
            data[y][x] = 0;
        }
    }
}
/**
 * ランダムにターゲットを配置する。
 */
function putbomb() {
    resetMap();
    mine_n = 0;
    while (mine_n !== bomb_n) {
        max_x = map[0].length - 1;
        min = 0;
        max_y = map.length - 1;
        yy = Math.floor(Math.random() * (max_y + 1 - min)) + min;
        xx = Math.floor(Math.random() * (max_x + 1 - min)) + min;
        if (map[yy][xx] !== -1) {
            map[yy][xx] = -1;
            bombplace.push([xx, yy]);
            mine_n += 1;
        }
    }
}

function firstopen() {
    for (let i = 0; i < 100; i++) {
        max_x = map[0].length - 3;
        min_x = 2;
        max_y = map.length - 3;
        min_y = 2;
        yy = Math.floor(Math.random() * (max_y + 1 - min_y)) + min_y;
        xx = Math.floor(Math.random() * (max_x + 1 - min_x)) + min_x;
        console.log(i)
        if (map[yy][xx] !== -1 && data[yy][xx] === 0) {
            console.log(xx, yy)
            open(xx, yy, false);
            aroundopen(xx, yy, true);
            break;
        }
    }
}
function item1open() {
    for (let i = 0; i < 100; i++) {
        max_x = map[0].length - 1;
        min_x = 0;
        max_y = map.length - 1;
        min_y = 0;
        yy = Math.floor(Math.random() * (max_y + 1 - min_y)) + min_y;
        xx = Math.floor(Math.random() * (max_x + 1 - min_x)) + min_x;
        console.log(i)
        if (map[yy][xx] !== -1 && data[yy][xx] === 0) {
            console.log(xx, yy)
            open(xx, yy, false);
            aroundopen(xx, yy, true);
            break;
        }
    }
}

function open(x, y, f = true, t = 1) {
    if (0 <= y && y < map.length && 0 <= x && x < map[0].length){
        if (map[y][x] !== -1 && data[y][x] === 0) {
            console.log(turn);
            data[y][x] = t === 1 ? 1:3;
            // map[y][x] = countbomb(x, y);
            n += 1;
            if (n === map.length * map[0].length - bomb_n){
                lastTimeUpTime = Date.now();
                countfinish();
                phase = 4;
            }
            if (countbomb(x, y) === 0 && f) {
                aroundopen(x, y, true);
            }
        }
    }
}

function allcount() {
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[0].length; x++) {
            if (map[y][x] !== -1){
                map[y][x] = countbomb(x, y)
            }
        }
    }
}

function aroundopen(x, y, f = true) {
    open(x - 1, y - 1, f);
    open(x, y - 1, f);
    open(x + 1, y - 1, f);
    open(x - 1, y, f);
    open(x + 1, y, f);
    open(x - 1, y + 1, f);
    open(x, y + 1, f);
    open(x + 1, y + 1, f);
}

function countbomb(x, y) {
    let ct = 0;
    for (let i = -1; i < 2; i++){
        for (let j = -1; j < 2; j++){
            if (i !== 0 || j !== 0){
                if (0 <= x + j & x + j < map[0].length & 0 <= y + i && y + i < map.length){
                    if (map[y + i][x + j] === -1){
                    ct += 1;
                    }
                }
            }
        }
    }
    return ct;
}

function openbomb() {
    console.log(bombplace)
    for (let i = 0; i < bombplace.length; i++) {
        // max = bombplace.length - 1;
        // min = 0;
        // xx = Math.floor(Math.random() * (max + 1 - min)) + min;
        if (data[bombplace[i][1]][bombplace[i][0]] !== 2) {
            data[bombplace[i][1]][bombplace[i][0]] = 2;
            console.log(xx)
            flag_n += 1
            break;
        }
    }
}

/**
 * キャンバスへのマウスクリック
 */
function onCanvasLClick(e) {
    let loc = windowToCanvas(e.clientX, e.clientY);
    switch (phase) {
    case 0:
        if (context.isPointInPath(backtitle, loc.x, loc.y)) {
            console.log("back")
            window.location.href = document.referrer;
            break;
        }
	    // タイトルフェーズで画面がクリックされた
        lastCountDownTime = Date.now();
	    resetData();
	    // カウントダウンフェーズに移行する。

        map_y = 12;  // hard 12 normal 9 easy 6
        map_x = 16;  // hard 16 normal 13 easy 9
        bomb_n = Math.floor(map_y * map_x / 5);
        STAGE_LEFT = (640 - CELL_SIZE * map_x) / 2;
        STAGE_TOP = 10 + (480 - CELL_SIZE * map_y) / 2;
        item1_n = 5;
        item2_n = 5;

	    phase = 1;
	    break;
    case 2:     // 以下を追加
        // if (context.isPointInPath(backtitle, loc.x, loc.y)) {
        //     console.log("back")
        //     window.location.href = document.referrer;
        //     break;
        // }
        if (context.isPointInPath(item1, loc.x, loc.y) && item1_n > 0) {
            console.log("ok")
            item1open();
            item1_n -= 1;
            break;
        }
        if (context.isPointInPath(item2, loc.x, loc.y) && item2_n > 0) {
            openbomb();
            item2_n -= 1;
            break;
        }
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

function onCanvasRClick(e) {
    e.preventDefault();
    let loc = windowToCanvas(e.clientX, e.clientY);
    canvas.onContextmenu = "return false;"
    switch (phase) {
    case 2:     // 以下を追加
        // タッチフェーズでセルがクリックされた
        for (let y = 0; y < cells.length; y++) {
            for (let x = 0; x < cells[0].length; x++) {
                if (cells[y][x].isWithin(loc.x, loc.y)) {
                    putflag(x, y);
                    break;
                }
            }
        }
        return false;
    }
}
/**
 * ターゲットがタッチされたか判定
 * @param x タッチされたx座標
 * @param y タッチされたy座標
 * @return true: 正解, false: ミス
 */
function isTouched(x, y) {
    if (data[y][x] !== 2){
        if (map[y][x] === -1) {
            lastTimeUpTime = Date.now();
            countfinish();
            phase = 5;
        } else {
            open(x, y,true,turn);
            turn *= -1;
        }
    }
}

function putflag(x, y) {
    if (data[y][x] === 0) {
        data[y][x] = 2;
        flag_n += 1;
    }
    else if (data[y][x] === 2){
        data[y][x] = 0;
        flag_n -= 1;
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
            context.strokeStyle = "white";
            context.fillStyle = "gray";
            context.strokeRect(left, top, CELL_SIZE, CELL_SIZE);
            context.fillRect(left, top, CELL_SIZE, CELL_SIZE);
            if (data[y][x] === 1) {
                if (map[y][x] === 0) context.fillStyle = "#FF773E";
                else if(map[y][x] === 1) context.fillStyle = "blue";
                else if(map[y][x] === 2) context.fillStyle = "lime";
                else if(map[y][x] === 3) context.fillStyle = "red";
                else if(map[y][x] === 4) context.fillStyle = "fuchsia";
                else if(map[y][x] === 5) context.fillStyle = "yellow";
                else{
                    context.fillStyle = "yellow";
                }
                context.font = "20px arial";
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.fillText(map[y][x], STAGE_LEFT + CELL_SIZE * (x + 0.5),
                    STAGE_TOP + CELL_SIZE * (y + 0.5));
            }
            else if (data[y][x] === 3){
                context.fillStyle = "yellow";
                context.font = "20px arial";
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.fillText("?", STAGE_LEFT + CELL_SIZE * (x + 0.5),
                    STAGE_TOP + CELL_SIZE * (y + 0.5));
            }
            else if(data[y][x] === 2){
                context.fillStyle = "white";
                context.font = "20px arial";
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.fillText("F", STAGE_LEFT + CELL_SIZE * (x + 0.5), STAGE_TOP + CELL_SIZE * (y + 0.5));
            }
            if (phase === 5 || phase === 4){
                if (map[y][x] === -1){
                    context.fillStyle = "skyblue";
                    context.strokeRect(left, top, CELL_SIZE, CELL_SIZE);
                    context.fillRect(left, top, CELL_SIZE, CELL_SIZE);
                    if (data[y][x] === 2) {
                        context.fillStyle = "white";
                        context.font = "20px arial";
                        context.textAlign = "center";
                        context.textBaseline = "middle";
                        context.fillText("F", STAGE_LEFT + CELL_SIZE * (x + 0.5), STAGE_TOP + CELL_SIZE * (y + 0.5));
                    }
                }
            }

        }
    }
}

/**
 * タイトル画面の描画
 */
function drawTitle() {
    context.fillStyle = 'black';
    context.fillRect(0, 0, 640, 480);
    context.fillStyle = "white";
    context.font = "50px arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = null;
    context.shadowOffsetX = null;
    context.shadowOffsetY = null;
    context.shadowBlur = null;
    context.fillText("Minesweeper", 320, 100);

    if (isTitleGuide == false) return;

    context.fillStyle = "white";
    context.font = "32px arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = null;
    context.shadowOffsetX = null;
    context.shadowOffsetY = null;
    context.shadowBlur = null;
    context.fillText("Click anywhere to start.", 320, 240);
}
/**
 * スコアの描画
 */
function drawclear() {
    context.fillStyle = 'black';
    context.fillRect(0, 0, 640, 480);
    context.fillStyle = "white";
    context.font = "50px arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = null;
    context.shadowOffsetX = null;
    context.shadowOffsetY = null;
    context.shadowBlur = null;
    context.fillText("clear", 320, 100);
}
/**
 * ハイスコアの描画
 */
function drawfaild() {
    context.fillStyle = 'black';
    context.fillRect(0, 0, 640, 480);
    context.fillStyle = "white";
    context.font = "50px arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = null;
    context.shadowOffsetX = null;
    context.shadowOffsetY = null;
    context.shadowBlur = null;
    context.fillText("faild", 320, 100);
}

/**
 * 背景の描画
 */
function drawBackground() {
    context.fillStyle = 'black';
    context.fillRect(0, 0, 640, 480);
    context.fillStyle = "white";
    context.font = "50px arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = null;
    context.shadowOffsetX = null;
    context.shadowOffsetY = null;
    context.shadowBlur = null;
    context.fillText("", 320, 100);
}
/**
 * カウントの描画
 */
function drawCount() {
    strCount = count <= 0 ? "GO!" : count;

    context.fillStyle = "white";
    context.font = "384px arial";
    context.textAlign = "center";
    context.textBaseline = "top";
    context.shadowColor = "black";
    context.shadowOffsetX = 5;
    context.shadowOffsetY = 5;
    context.shadowBlur = 20;
    context.fillText(strCount, canvas.width / 2, STAGE_TOP - 50, STAGE_WIDTH);
}
/**
 * 残り時間の描画
 */
function drawRemainingTime() {
    context.fillStyle = remainingTime <= 5 ? "red" : "white";
    context.font = "48px arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = null;
    context.shadowOffsetX = null;
    context.shadowOffsetY = null;
    context.shadowBlur = null;
    context.fillText(String(remainingTime), 320, 40);
}
function drawTimer() {
    context.fillStyle = "white";
    context.font = "48px arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = null;
    context.shadowOffsetX = null;
    context.shadowOffsetY = null;
    context.shadowBlur = null;
    context.fillText(String(timer()), 320, 30);
}
/**
 * タイムアップの描画
 */
function drawTimeUp() {
    context.fillStyle = "white";
    context.font = "384px arial";
    context.textAlign = "center";
    context.textBaseline = "top";
    context.shadowColor = "black";
    context.shadowOffsetX = 5;
    context.shadowOffsetY = 5;
    context.shadowBlur = 20;
    context.fillText("TIME UP!", canvas.width / 2, STAGE_TOP, STAGE_WIDTH);
}
function drawflagnum() {
    context.fillStyle = "white";
    context.font = "20px arial";
    context.textAlign = "left";
    context.textBaseline = "top";
    context.shadowColor = null;
    context.shadowOffsetX = null;
    context.shadowOffsetY = null;
    context.shadowBlur = null;
    context.fillText("Flag", 16, 16);

    context.fillStyle = "white";
    context.font = "20px arial";
    context.textAlign = "right";
    context.textBaseline = "top";
    context.shadowColor = null;
    context.shadowOffsetX = null;
    context.shadowOffsetY = null;
    context.shadowBlur = null;
    context.fillText(String(flag_n), 108, 16);
}

function drawbombnum() {
    context.fillStyle = "white";
    context.font = "20px arial";
    context.textAlign = "left";
    context.textBaseline = "top";
    context.shadowColor = null;
    context.shadowOffsetX = null;
    context.shadowOffsetY = null;
    context.shadowBlur = null;
    context.fillText("Bomb", 516, 16);

    context.fillStyle = "white";
    context.font = "20px arial";
    context.textAlign = "right";
    context.textBaseline = "top";
    context.shadowColor = null;
    context.shadowOffsetX = null;
    context.shadowOffsetY = null;
    context.shadowBlur = null;
    context.fillText(String(bomb_n), 608, 16);
}


//時間カウント
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
//タイマースタート
function countstart(){
    s_time = Date.now();
    setTimeout(timer, 0);
}

//タイマー終了
function countfinish(){
    console.log("test2");
    clearTimeout(countloopTimer);
}

function timer(){
    let t = Date.now() - s_time;

    return slice_timer(t);
    // if (phase == 2) {
    //     return slice_timer(t);
    // }
    // else{
    //     return t;
    // }
}

function slice_timer(t){
    let h = Math.floor(t / 3600000);
    let m = Math.floor((t - 3600000 * h) / 60000);
    let ms = t % 60000;
    h = ("00" + h).slice(-2);
    m = ("00" + m).slice(-2);
    ms = ("00000" + ms).slice(-5);

    return h + ":" + m + ":" + ms.slice(0, 2) + ":" + ms.slice(2, 5);
}

function drawitem1(contex, y = 100, x = 10 , w = 40, h = 40) {
    contex.rect(x, y, w, h);
    context.strokeStyle = "white";
    context.fillStyle = "#32EEFF";
    context.stroke(contex);
    context.fill(contex);
    context.fillStyle = "white";
    context.textAlign = "center";
    context.font = "20px serif";
    context.fillText(String(item1_n), x + 20, y + 10);
}

function drawitem2(contex, y = 200, x = 10 , w = 40, h = 40) {
    contex.rect(x, y, w, h);
    context.strokeStyle = "white";
    context.fillStyle = "#FF1A6F";
    context.stroke(contex);
    context.fill(contex);
    context.fillStyle = "white";
    context.textAlign = "center";
    context.font = "20px serif";
    context.fillText(String(item2_n), x + 20, y + 10);
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


// /**
//  * **** **** **** **** **** **** **** ****
//  * 定数
//  * **** **** **** **** **** **** **** ****
//  */
// INTERVAL = 32;          // 30FPS（1フレームを32ms間隔で処理）
//
// CELL_SIZE = 32;        // セルサイズ
//
// // ステージの位置
// STAGE_WIDTH = 512;
// STAGE_HEIGHT = 384;
// STAGE_LEFT = 64;
// STAGE_TOP = 80;
//
//
// /**
//  * **** **** **** **** **** **** **** ****
//  * クラス
//  * **** **** **** **** **** **** **** ****
//  */
// /**
//  * セルクラス
//  */
// class Cell {
//     /**
//      * @param left      左端のx座標
//      * @param top       上端のy座標
//      * @param width     セルの幅
//      * @param height    セルの高さ
//      */
//     constructor(left, top, width, height) {
//         this.left = left;
//         this.top = top;
//         this.width = width;
//         this.height = height;
//     }
//     /**
//      * x, y座標がセルの範囲内か判定
//      * @param x x座標
//      * @param y y座標
//      */
//     isWithin(x, y) {
//         if (x < this.left || this.left + this.width < x) return false;
//         if (y < this.top || this.top + this.height < y) return false;
//         return true;
//     }
// }
//
// /**
//  * **** **** **** **** **** **** **** ****
//  * グローバル変数
//  * **** **** **** **** **** **** **** ****
//  */
// let canvas = null;              // キャンバス
// let context = null;             // 描画用コンテキスト
// // フラグ
// let phase = -1;                 // ゲームフェーズフラグ {0: タイトルフェーズ, 1: カウントダウンフェーズ, 2: タッチフェーズ, 3: ゲームオーバーフェーズ}
// let isTitleGuide = true;        // タイトルガイド点滅用フラグ {true: 表示, false: 非表示}
//
// // 時間制御用の最終取得時刻
// let lastTitleTime = -1;         // タイトルガイド表示切替用
// let lastCountDownTime = -1;     // カウントダウン表示用
// let lastPutTime = -1;           // 配置用
// let lastReducedTime = -1;       // 残り時間更新用
// let lastTimeUpTime = -1;        // タイムアップ表示用
//
// // ゲームデータ
// let map = null;                 // マップデータ
// let data = null;
// let count = -1;                 // カウントダウン用の残りカウント
// let remainingTime = -1;         // 残り時間
// let score = 0;                  // スコア
// let highScore = 0;              // ハイスコア
//
// // let cells = new Array(12);       // セル
// // for (let y = 0; y < cells.length; y++) {
// //     cells[y] = new Array(16);
// // }
// // for (let y = 0; y < cells.length; y++) {
// //     for (let x = 0; x < cells[y].length; x++) {
// //         cells[y][x] = new Cell(STAGE_LEFT + CELL_SIZE * x, STAGE_TOP + CELL_SIZE * y, CELL_SIZE, CELL_SIZE);
// //     }
// // }
// //
// // let data = new Array(12);       // セル
// // for (let y = 0; y < data.length; y++) {
// //     data[y] = new Array(16);
// //     for (let x = 0; x < data[y].length; x++) {
// //         data[y][x] = 0;
// //     }
// // }
//
// let mapmake_f = true;
//
// let n = 0;
// let bomb_n = null;
// let flag_n = 0;
// let map_x = null;
// let map_y = null;
//
// let s_time = 0;
// let countloopTimer = null;
// let countstart_f = true;
//
// let item1 = new Path2D();
// let item2 = new Path2D();
// let backtitle = new Path2D();
//
// let item1_n = null;
// let item2_n = null;
//
// let bombplace = [];
//
// /**
//  * **** **** **** **** **** **** **** ****
//  * メイン処理
//  * **** **** **** **** **** **** **** ****
//  */
// /**
//  * 全体の初期化処理
//  */
// function init() {
//     // キャンバス要素の取得
//     canvas = document.getElementById("a_canvas");
//     // 描画用コンテキストの取得
//     context = canvas.getContext("2d");
//     // イベントリスナの追加
//     canvas.addEventListener('click', onCanvasLClick, false);
//
//     canvas.addEventListener('contextmenu', onCanvasRClick, false);
//
//     drawTitle();
//
//     // ゲームデータのリセット
//     resetData();
//
// }
// /**
//  * メインループの開始
//  */
// function runMainLoop() {
//     // ゲームフェーズをタイトルフェーズに移行する。
//     phase = 0;
//
// 	// メインループを開始する。
//     setTimeout(mainLoop, 0);
//     lastTitleTime = Date.now();
// }
// /**
//  * メインループ
//  */
// function mainLoop() {
//     let mainLoopTimer = setTimeout(mainLoop, INTERVAL);
//     let now = -1;
//
//     switch (phase) {
//     case 0:
//         // タイトルフェーズ
//         now = Date.now();
//         if (now - lastTitleTime >= 500) {
//             // 0.5秒に1回のタイミングでタイトルガイドを点滅させる。
//             lastTitleTime = Date.now();
//             isTitleGuide = !isTitleGuide;
//         }
//         drawTitle();
//         drawBackTitle(backtitle);
//         break;
//     case 1:             // 以下を追加
//         // カウントダウンフェーズ
//         now = Date.now();
//         if (now - lastCountDownTime >= 1000) {
//             // 1秒に1回カウントダウンする。
//             lastCountDownTime = Date.now();
//             if (--count < 0) {
//                 // カウントダウンが終了したらタッチフェーズに移行する。
//                 phase = 2;
//                 lastPutTime = Date.now();
//                 lastReducedTime = Date.now();
//             }
//         }
//         drawBackground();
//         drawCount();
//         if (mapmake_f){
//             putbomb();
//             allcount();
//             firstopen();
//             mapmake_f = false;
//         }
//         break;
//     case 2:                 // 以下を追加
//         if (countstart_f){
//             countstart();
//             countstart_f = false;
//         }
//         // タッチフェーズ
//         now = Date.now();
//         drawBackground();
//         drawMap();
//         drawTimer();
//         drawflagnum();
//         drawbombnum();
//         drawitem1(item1);
//         drawitem2(item2);
//         // drawBackTitle(backtitle);
//         break;
//     case 3:     // 以下を追加
//         // ゲームオーバーフェーズ
//         now = Date.now();
//         if (now - lastTimeUpTime >= 3000) {
//             // タイムアップ表示後3秒後にタイトルフェーズに移行する。
//             phase = 0;
//         }
//         drawBackground();
//         drawMap();
//         drawRemainingTime();
//         drawTimeUp();
//         break;
//     case 4:     // 以下を追加
//         now = Date.now();
//         if (now - lastTimeUpTime >= 3000) {
//             // タイムアップ表示後3秒後にタイトルフェーズに移行する。
//             phase = 0;
//         }
//         // // ゲームオーバーフェーズ
//         drawclear();
//         break;
//     case 5:     // 以下を追加
//         now = Date.now();
//         if (now - lastTimeUpTime >= 3000) {
//             // タイムアップ表示後3秒後にタイトルフェーズに移行する。
//             phase = 0;
//         }
//         // ゲームオーバーフェーズ
//         // drawfaild();
//         drawBackground();
//         drawMap();
//         drawflagnum();
//         break;
//     }
// }
//
// /**
//  * **** **** **** **** **** **** **** ****
//  * イベント関連
//  * **** **** **** **** **** **** **** ****
//  */
// /**
//  * ページ読込み
//  */
// $(function() {
//     // 全体の初期化処理
//     init();
//     // メインループの開始
//     runMainLoop();
// });
// /**
//  * ウィンドウ座標からキャンバス座標に変換する
//  * @param wx		ウィンドウ上のx座標
//  * @param wy		ウィンドウ上のy座標
//  */
// function windowToCanvas(wx, wy) {
// 	let bbox = canvas.getBoundingClientRect();
// 	return {
// 		x: (wx - bbox.left) * (canvas.width / bbox.width),
// 		y: (wy - bbox.top)  * (canvas.height / bbox.height)
// 	};
// }
// /**
//  * ゲームデータのリセット
//  */
// function resetData() {
//     resetMap();
//     count = 3;
//     remainingTime = 300;
//     score = 0;
//     mapmake_f = true;
//     n = 0;
//     flag_n = 0;
//     countstart_f = true;
//     bombplace = [];
// }
//
// /**
//  * マップデータのリセット
//  */
// function resetMap() {
//     // STAGE_LEFT = (STAGE_WIDTH - CELL_SIZE * map_x) / 2;
//     // STAGE_TOP = (STAGE_HEIGHT - CELL_SIZE * map_y) / 2;
//     cells = new Array(map_y);       // セル
//     for (let y = 0; y < cells.length; y++) {
//         cells[y] = new Array(map_x);
//     }
//     for (let y = 0; y < cells.length; y++) {
//         for (let x = 0; x < cells[y].length; x++) {
//             cells[y][x] = new Cell(STAGE_LEFT + CELL_SIZE * x, STAGE_TOP + CELL_SIZE * y, CELL_SIZE, CELL_SIZE);
//         }
//     }
//
//     data = new Array(map_y);       // セル
//     for (let y = 0; y < data.length; y++) {
//         data[y] = new Array(map_x);
//         for (let x = 0; x < data[y].length; x++) {
//             data[y][x] = 0;
//         }
//     }
//
//     map = new Array(map_y);       // セル
//     for (let y = 0; y < map.length; y++) {
//         map[y] = new Array(map_x);
//         for (let x = 0; x < map[0].length; x++) {
//             map[y][x] = 0;
//         }
//     }
//     for (let y = 0; y < data.length; y++) {
//         for (let x = 0; x < data[0].length; x++) {
//             data[y][x] = 0;
//         }
//     }
// }
// /**
//  * ランダムにターゲットを配置する。
//  */
// function putbomb() {
//     resetMap();
//     mine_n = 0;
//     while (mine_n !== bomb_n) {
//         max_x = map[0].length - 1;
//         min = 0;
//         max_y = map.length - 1;
//         yy = Math.floor(Math.random() * (max_y + 1 - min)) + min;
//         xx = Math.floor(Math.random() * (max_x + 1 - min)) + min;
//         if (map[yy][xx] !== -1) {
//             map[yy][xx] = -1;
//             bombplace.push([xx, yy]);
//             mine_n += 1;
//         }
//     }
// }
//
// function firstopen() {
//     for (let i = 0; i < 100; i++) {
//         max_x = map[0].length - 3;
//         min_x = 2;
//         max_y = map.length - 3;
//         min_y = 2;
//         yy = Math.floor(Math.random() * (max_y + 1 - min_y)) + min_y;
//         xx = Math.floor(Math.random() * (max_x + 1 - min_x)) + min_x;
//         console.log(i)
//         if (map[yy][xx] !== -1 && data[yy][xx] === 0) {
//             console.log(xx, yy)
//             open(xx, yy, false);
//             aroundopen(xx, yy, true);
//             break;
//         }
//     }
// }
// function item1open() {
//     for (let i = 0; i < 100; i++) {
//         max_x = map[0].length - 1;
//         min_x = 0;
//         max_y = map.length - 1;
//         min_y = 0;
//         yy = Math.floor(Math.random() * (max_y + 1 - min_y)) + min_y;
//         xx = Math.floor(Math.random() * (max_x + 1 - min_x)) + min_x;
//         console.log(i)
//         if (map[yy][xx] !== -1 && data[yy][xx] === 0) {
//             console.log(xx, yy)
//             open(xx, yy, false);
//             aroundopen(xx, yy, true);
//             break;
//         }
//     }
// }
//
// function open(x, y, f = true) {
//     if (0 <= y && y < map.length && 0 <= x && x < map[0].length){
//         if (map[y][x] !== -1 && data[y][x] === 0) {
//             data[y][x] = 1;
//             // map[y][x] = countbomb(x, y);
//             n += 1;
//             if (n === map.length * map[0].length - bomb_n){
//                 lastTimeUpTime = Date.now();
//                 countfinish();
//                 phase = 4;
//             }
//             if (countbomb(x, y) === 0 && f) {
//                 aroundopen(x, y, true);
//             }
//         }
//     }
// }
//
// function allcount() {
//     for (let y = 0; y < map.length; y++) {
//         for (let x = 0; x < map[0].length; x++) {
//             if (map[y][x] !== -1){
//                 map[y][x] = countbomb(x, y)
//             }
//         }
//     }
// }
//
// function aroundopen(x, y, f = true) {
//     open(x - 1, y - 1, f);
//     open(x, y - 1, f);
//     open(x + 1, y - 1, f);
//     open(x - 1, y, f);
//     open(x + 1, y, f);
//     open(x - 1, y + 1, f);
//     open(x, y + 1, f);
//     open(x + 1, y + 1, f);
// }
//
// function countbomb(x, y) {
//     let ct = 0;
//     for (let i = -1; i < 2; i++){
//         for (let j = -1; j < 2; j++){
//             if (i !== 0 || j !== 0){
//                 if (0 <= x + j & x + j < map[0].length & 0 <= y + i && y + i < map.length){
//                     if (map[y + i][x + j] === -1){
//                     ct += 1;
//                     }
//                 }
//             }
//         }
//     }
//     return ct;
// }
//
// function openbomb() {
//     console.log(bombplace)
//     for (let i = 0; i < bombplace.length; i++) {
//         // max = bombplace.length - 1;
//         // min = 0;
//         // xx = Math.floor(Math.random() * (max + 1 - min)) + min;
//         if (data[bombplace[i][1]][bombplace[i][0]] !== 2) {
//             data[bombplace[i][1]][bombplace[i][0]] = 2;
//             console.log(xx)
//             flag_n += 1
//             break;
//         }
//     }
// }
//
// /**
//  * キャンバスへのマウスクリック
//  */
// function onCanvasLClick(e) {
//     let loc = windowToCanvas(e.clientX, e.clientY);
//     switch (phase) {
//     case 0:
//         if (context.isPointInPath(backtitle, loc.x, loc.y)) {
//             console.log("back")
//             window.location.href = document.referrer;
//             break;
//         }
// 	    // タイトルフェーズで画面がクリックされた
//         lastCountDownTime = Date.now();
// 	    resetData();
// 	    // カウントダウンフェーズに移行する。
//
//         map_y = 6;  // hard 12 normal 9 easy 6
//         map_x = 9;  // hard 16 normal 13 easy 9
//         bomb_n = Math.floor(map_y * map_x / 5);
//         STAGE_LEFT = (640 - CELL_SIZE * map_x) / 2;
//         STAGE_TOP = 10 + (480 - CELL_SIZE * map_y) / 2;
//         item1_n = 5;
//         item2_n = 5;
//
// 	    phase = 1;
// 	    break;
//     case 2:     // 以下を追加
//         // if (context.isPointInPath(backtitle, loc.x, loc.y)) {
//         //     console.log("back")
//         //     window.location.href = document.referrer;
//         //     break;
//         // }
//         if (context.isPointInPath(item1, loc.x, loc.y) && item1_n > 0) {
//             console.log("ok")
//             item1open();
//             item1_n -= 1;
//             break;
//         }
//         if (context.isPointInPath(item2, loc.x, loc.y) && item2_n > 0) {
//             openbomb();
//             item2_n -= 1;
//             break;
//         }
//         // タッチフェーズでセルがクリックされた
//         for (let y = 0; y < cells.length; y++) {
//             for (let x = 0; x < cells[0].length; x++) {
//                 if (cells[y][x].isWithin(loc.x, loc.y)) {
//                     isTouched(x, y);
//                     break;
//                 }
//             }
//         }
//     }
// }
//
// function onCanvasRClick(e) {
//     e.preventDefault();
//     let loc = windowToCanvas(e.clientX, e.clientY);
//     canvas.onContextmenu = "return false;"
//     switch (phase) {
//     case 2:     // 以下を追加
//         // タッチフェーズでセルがクリックされた
//         for (let y = 0; y < cells.length; y++) {
//             for (let x = 0; x < cells[0].length; x++) {
//                 if (cells[y][x].isWithin(loc.x, loc.y)) {
//                     putflag(x, y);
//                     break;
//                 }
//             }
//         }
//         return false;
//     }
// }
// /**
//  * ターゲットがタッチされたか判定
//  * @param x タッチされたx座標
//  * @param y タッチされたy座標
//  * @return true: 正解, false: ミス
//  */
// function isTouched(x, y) {
//     if (data[y][x] !== 2){
//         if (map[y][x] === -1) {
//             lastTimeUpTime = Date.now();
//             countfinish();
//             phase = 5;
//         } else {
//             open(x, y);
//         }
//     }
// }
//
// function putflag(x, y) {
//     if (data[y][x] === 0) {
//         data[y][x] = 2;
//         flag_n += 1;
//     }
//     else if (data[y][x] === 2){
//         data[y][x] = 0;
//         flag_n -= 1;
//     }
// }
//
//
// /**
//  * **** **** **** **** **** **** **** ****
//  * ビュー関連
//  * **** **** **** **** **** **** **** ****
//  */
// /**
//  * マップの描画
//  */
// function drawMap() {
//     for (let y = 0; y < map.length; y++) {
//         for (let x = 0; x < map[0].length; x++) {
//             let left = STAGE_LEFT + CELL_SIZE * x;
//             let top = STAGE_TOP + CELL_SIZE * y;
//             context.strokeStyle = "white";
//             context.fillStyle = "gray";
//             context.strokeRect(left, top, CELL_SIZE, CELL_SIZE);
//             context.fillRect(left, top, CELL_SIZE, CELL_SIZE);
//             if (data[y][x] === 1) {
//                 if (map[y][x] === 0) context.fillStyle = "#FF773E";
//                 else if(map[y][x] === 1) context.fillStyle = "blue";
//                 else if(map[y][x] === 2) context.fillStyle = "lime";
//                 else if(map[y][x] === 3) context.fillStyle = "red";
//                 else if(map[y][x] === 4) context.fillStyle = "fuchsia";
//                 else if(map[y][x] === 5) context.fillStyle = "yellow";
//                 else{
//                     context.fillStyle = "yellow";
//                 }
//                 context.font = "20px arial";
//                 context.textAlign = "center";
//                 context.textBaseline = "middle";
//                 context.fillText(map[y][x], STAGE_LEFT + CELL_SIZE * (x + 0.5), STAGE_TOP + CELL_SIZE * (y + 0.5));
//             }
//             else if(data[y][x] === 2){
//                 context.fillStyle = "white";
//                 context.font = "20px arial";
//                 context.textAlign = "center";
//                 context.textBaseline = "middle";
//                 context.fillText("F", STAGE_LEFT + CELL_SIZE * (x + 0.5), STAGE_TOP + CELL_SIZE * (y + 0.5));
//             }
//             if (phase === 5 || phase === 4){
//                 if (map[y][x] === -1){
//                     context.fillStyle = "skyblue";
//                     context.strokeRect(left, top, CELL_SIZE, CELL_SIZE);
//                     context.fillRect(left, top, CELL_SIZE, CELL_SIZE);
//                     if (data[y][x] === 2) {
//                         context.fillStyle = "white";
//                         context.font = "20px arial";
//                         context.textAlign = "center";
//                         context.textBaseline = "middle";
//                         context.fillText("F", STAGE_LEFT + CELL_SIZE * (x + 0.5), STAGE_TOP + CELL_SIZE * (y + 0.5));
//                     }
//                 }
//             }
//
//         }
//     }
// }
//
// /**
//  * タイトル画面の描画
//  */
// function drawTitle() {
//     context.fillStyle = 'black';
//     context.fillRect(0, 0, 640, 480);
//     context.fillStyle = "white";
//     context.font = "50px arial";
//     context.textAlign = "center";
//     context.textBaseline = "middle";
//     context.shadowColor = null;
//     context.shadowOffsetX = null;
//     context.shadowOffsetY = null;
//     context.shadowBlur = null;
//     context.fillText("Minesweeper", 320, 100);
//
//     if (isTitleGuide == false) return;
//
//     context.fillStyle = "white";
//     context.font = "32px arial";
//     context.textAlign = "center";
//     context.textBaseline = "middle";
//     context.shadowColor = null;
//     context.shadowOffsetX = null;
//     context.shadowOffsetY = null;
//     context.shadowBlur = null;
//     context.fillText("Click anywhere to start.", 320, 240);
// }
// /**
//  * スコアの描画
//  */
// function drawclear() {
//     context.fillStyle = 'black';
//     context.fillRect(0, 0, 640, 480);
//     context.fillStyle = "white";
//     context.font = "50px arial";
//     context.textAlign = "center";
//     context.textBaseline = "middle";
//     context.shadowColor = null;
//     context.shadowOffsetX = null;
//     context.shadowOffsetY = null;
//     context.shadowBlur = null;
//     context.fillText("clear", 320, 100);
// }
// /**
//  * ハイスコアの描画
//  */
// function drawfaild() {
//     context.fillStyle = 'black';
//     context.fillRect(0, 0, 640, 480);
//     context.fillStyle = "white";
//     context.font = "50px arial";
//     context.textAlign = "center";
//     context.textBaseline = "middle";
//     context.shadowColor = null;
//     context.shadowOffsetX = null;
//     context.shadowOffsetY = null;
//     context.shadowBlur = null;
//     context.fillText("faild", 320, 100);
// }
//
// /**
//  * 背景の描画
//  */
// function drawBackground() {
//     context.fillStyle = 'black';
//     context.fillRect(0, 0, 640, 480);
//     context.fillStyle = "white";
//     context.font = "50px arial";
//     context.textAlign = "center";
//     context.textBaseline = "middle";
//     context.shadowColor = null;
//     context.shadowOffsetX = null;
//     context.shadowOffsetY = null;
//     context.shadowBlur = null;
//     context.fillText("", 320, 100);
// }
// /**
//  * カウントの描画
//  */
// function drawCount() {
//     strCount = count <= 0 ? "GO!" : count;
//
//     context.fillStyle = "white";
//     context.font = "384px arial";
//     context.textAlign = "center";
//     context.textBaseline = "top";
//     context.shadowColor = "black";
//     context.shadowOffsetX = 5;
//     context.shadowOffsetY = 5;
//     context.shadowBlur = 20;
//     context.fillText(strCount, canvas.width / 2, STAGE_TOP - 50, STAGE_WIDTH);
// }
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
// function drawflagnum() {
//     context.fillStyle = "white";
//     context.font = "20px arial";
//     context.textAlign = "left";
//     context.textBaseline = "top";
//     context.shadowColor = null;
//     context.shadowOffsetX = null;
//     context.shadowOffsetY = null;
//     context.shadowBlur = null;
//     context.fillText("Flag", 16, 16);
//
//     context.fillStyle = "white";
//     context.font = "20px arial";
//     context.textAlign = "right";
//     context.textBaseline = "top";
//     context.shadowColor = null;
//     context.shadowOffsetX = null;
//     context.shadowOffsetY = null;
//     context.shadowBlur = null;
//     context.fillText(String(flag_n), 108, 16);
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
// // function timer(){
// //     countloopTimer = setTimeout(timer, INTERVAL);
// //
// //     let t = Date.now() - s_time;
// //     let h = Math.floor(t / 3600000);
// //     let m = Math.floor((t - 3600000 * h) / 60000);
// //     let ms = t % 60000;
// //     h = ("00" + h).slice(-2);
// //     m = ("00" + m).slice(-2);
// //     ms = ("00000" + ms).slice(-5);
// //
// //     return h + ":" + m + ":" + ms.slice(0, 2) + ":" + ms.slice(2, 5);
// // }
// //
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
// function timer(){
//     let t = Date.now() - s_time;
//
//     return slice_timer(t);
//     // if (phase == 2) {
//     //     return slice_timer(t);
//     // }
//     // else{
//     //     return t;
//     // }
// }
//
// function slice_timer(t){
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
//
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
//
// function drawBackTitle(contex, y = 5, x = 5, w = 60, h = 40) {
//     contex.rect(x, y, w, h);
//     context.strokeStyle = "white";
//     context.fillStyle = "#00FFFF";
//     context.stroke(contex);
//     context.fill(contex);
//     context.fillStyle = "white";
//     context.textAlign = "center";
//     context.font = "20px serif";
//     context.fillText("back", x + 30, y + 20);
// }


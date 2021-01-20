/**
 * **** **** **** **** **** **** **** ****
 * 定数
 * **** **** **** **** **** **** **** ****
 */
INTERVAL = 16;          // 30FPS（1フレームを32ms間隔で処理）

CELL_SIZE = 48;        // セルサイズ

// ステージの位置
STAGE_LEFT = 104;
STAGE_TOP = 104;
STAGE_WIDTH = 640;
STAGE_HEIGHT = 640;


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
let hairetu = null;
let count = -1;                 // カウントダウン用の残りカウント
let remainingTime = -1;         // 残り時間
let score = 0;                  // スコア
let highScore = 0;              // ハイスコア

let cells = new Array(9);       // セル
for (let y = 0; y < cells.length; y++) {
    cells[y] = new Array(9);
}
for (let y = 0; y < cells.length; y++) {
    for (let x = 0; x < cells[y].length; x++) {
        cells[y][x] = new Cell(STAGE_LEFT + CELL_SIZE * x, STAGE_TOP + CELL_SIZE * y, CELL_SIZE, CELL_SIZE);
    }
}

let data = new Array(9);       // セル
for (let y = 0; y < data.length; y++) {
    data[y] = new Array(9);
    for (let x = 0; x < data[y].length; x++) {
        data[y][x] = 0;
    }
}

let original = null;
let onlyone = false;
let turn = null;
let player = null;
let my_piece_n = null;
let enemy_piece_n = null;
let winner = null;

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
    canvas.addEventListener('click', onCanvasClick, false);

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
        drawScore();
        drawHighScore();
        break;
    case 3:     // 以下を追加
        // ゲームオーバーフェーズ
        now = Date.now();
        if (now - lastTimeUpTime >= 5000) {
            // タイムアップ表示後3秒後にタイトルフェーズに移行する。
            phase = 0;
        }
        drawBackground();
        drawMap();
        drawResult();
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
    remainingTime = 180;
    score = 0;
    original = [-1, -1];
    turn = 1;
    player = 1;
    onlyone = false;
    my_piece_n = 9;
    enemy_piece_n = 9;
    winner = -1;
}
/**
 * マップデータのリセット
 */
function resetMap() {
    map = new Array(9);       // セル
    for (let y = 0; y < map.length; y++) {
        map[y] = new Array(9);
        for (let x = 0; x < map[0].length; x++) {
            if (y === 0){
                map[y][x] = -1;
            }
            else if (y === 8){
                map[y][x] = 1;
            }
            else{
                map[y][x] = 0;
            }
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
function move(x, y, f = true) {
    let num1, num2;
    let index = 1;
    let value = 1;
    if (f){
        num1 = 3;
        num2 = 0;
    }
    else{
        num1 = 0;
        num2 = 3;
    }
    for (let _ = 0; _ < 2; _ ++){
        while (y + index < map.length && y + index >= 0 && map[y + index][x] === num2){
            map[y + index][x] = num1;
            index += value;
        }
        index = value;
        while (x + index < map.length && x + index >= 0 && map[y][x + index] === num2){
            map[y][x + index] = num1;
            index += value;
        }
        value *= -1;
        index = -1;
    }
}

function check_finish() {
    if (my_piece_n <= 4){
        winner = player;
        lastTimeUpTime = Date.now();
        phase = 3;
    }
    else if (enemy_piece_n <= 4){
        winner = player;
        lastTimeUpTime = Date.now();
        phase = 3;
    }
}

function connected(x, y){
    console.log("connected");
    let index_i = 1;
    let index_j = 0;
    let value_i = 1;
    let value_j = 0;
    for (let s = 0; s < 2; s ++){
        for (let t = 0; t < 2; t ++) {
            let connect = 0;
            let info = [];
            console.log(index_j, index_i);
            while (y + index_i < map.length && y + index_i >= 0 &&
            x + index_j < map.length && x + index_j >= 0) {
                if (map[y + index_i][x + index_j] === player && connect > 0) {
                    eliminate1(x, y, value_j, value_i);
                    connect = 0;
                    break;
                } else if (map[y + index_i][x + index_j] === player * -1){
                    info.push([x + index_j, y + index_i])
                    connect += 1;
                    index_i += value_i;
                    index_j += value_j;
                }
                else{
                    connect = 0;
                    break;
                }
            }
            if (connect > 0){
                eliminate2(info[0][0], info[0][1], value_j, value_i);
            }
            console.log("1/4");
            value_i *= -1;
            value_j *= -1;
            index_i = value_i;
            index_j =value_j;
        }
        index_i = 0;
        index_j = 1;
        value_i = 0;
        value_j = 1;
    }
}

function eliminate1(x, y, index_j, index_i){
    console.log("eliminated1");
    let i = index_i;
    let j = index_j;
    while (y + i < map.length && y + i >= 0 &&
    x + j < map.length && x + j >= 0){
        if (map[y + i][x + j] !== player * -1){
            break;
        }
        else {
            map[y + i][x + j] = 0;
            i += index_i;
            j += index_j;
        }
    }
}

function eliminate2(x, y, j, i) {
    console.log(x, y);
    hairetu = new Array(9);       // セル
    for (let i = 0; i < hairetu.length; i++) {
        hairetu[i] = new Array(9);
        for (let j = 0; j < hairetu[0].length; j++) {
            hairetu[i][j] = 0;
        }
    }
    if (saiki1(x, y)){
        console.log("y");
        saiki2(x, y);
    }
    else{
        console.log("n");
    }
}

function saiki1(x, y) {
    if (y >= map.length || y < 0 ||
    x >= map.length || x < 0){
        console.log("soto");
        return true;
    }
    if (hairetu[y][x] !== 0){
        console.log("2kaime");
        return true;
    }
    hairetu[y][x] = 1;
    if(map[y][x] === 0){
        console.log("kuuhaku");
        return false;
    }
    else if (map[y][x] === player){
        console.log("aite");
        return true;
    }
    else{
        console.log("tonari");
        if (saiki1(x + 1, y) && saiki1(x, y - 1) && saiki1(x - 1, y) && saiki1(x, y + 1)){
            return true;
        }
        else{
            return false;
        }
    }
}

function saiki2(x, y) {
    if (y >= map.length || y < 0 ||
    x >= map.length || x < 0){
        console.log("soto");
        return;
    }
    else if(map[y][x] === 0){
        console.log("kuuhaku");
        return;
    }
    else if (map[y][x] === player){
        console.log("aite");
        return;
    }
    map[y][x] = 0;
    if (player === 1){
        enemy_piece_n -= 1;
    }
    else{
        my_piece_n -= 1;
    }
    saiki2(x + 1, y);
    saiki2(x, y - 1);
    saiki2(x - 1, y);
    saiki2(x, y + 1);
}


/**
 * キャンバスへのマウスクリック
 */
function onCanvasClick(e) {
    let loc = windowToCanvas(e.clientX, e.clientY);
    switch (phase) {
    case 0:
	    // タイトルフェーズで画面がクリックされた
        lastCountDownTime = Date.now();
	    resetData();
	    // カウントダウンフェーズに移行する。
	    phase = 1;
	    break;
    case 2:     // 以下を追加
        // タッチフェーズでセルがクリックされた
        for (let y = 0; y < cells.length; y++) {
            for (let x = 0; x < cells[y].length; x++) {
                if (cells[y][x].isWithin(loc.x, loc.y)) {
                    isTouched(x, y);
                }
            }
        }
        break;
    }
}
/**
 * ターゲットがタッチされたか判定
 * @param x タッチされたx座標
 * @param y タッチされたy座標
 * @return true: 正解, false: ミス
 */
function isTouched(x, y) {
    if (map[y][x] === player && !onlyone) {
        move(x, y)
        map[y][x] = 2;
        original = [x, y];
        onlyone = true;
    } else if (map[y][x] === 2 && onlyone) {
        move(x, y, false);
        map[y][x] = player;
        original = [-1, -1];
        onlyone = false;
    }else if (map[y][x] === 3) {
        move(original[0], original[1], false);
        map[y][x] = player;
        map[original[1]][original[0]] = 0;
        onlyone = false;
        connected(x, y);
        check_finish();
        turn += 1;
        player *= -1
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
    context.shadowColor = null;
    context.shadowOffsetX = null;
    context.shadowOffsetY = null;
    context.shadowBlur = null;
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            if (map[y][x] === 0) {
                let left = STAGE_LEFT + CELL_SIZE * x;
                let top = STAGE_TOP + CELL_SIZE * y;
                context.strokeStyle = "white";
                context.fillStyle = "yellow";
                context.strokeRect(left, top, CELL_SIZE, CELL_SIZE);
                context.fillRect(left, top, CELL_SIZE, CELL_SIZE);
            }
            else if (map[y][x] === 1){
                let left = STAGE_LEFT + CELL_SIZE * x;
                let top = STAGE_TOP + CELL_SIZE * y;
                context.strokeStyle = "white";
                context.fillStyle = "skyblue";
                context.strokeRect(left, top, CELL_SIZE, CELL_SIZE);
                context.fillRect(left, top, CELL_SIZE, CELL_SIZE);
            }
            else if (map[y][x] === 2){
                let left = STAGE_LEFT + CELL_SIZE * x;
                let top = STAGE_TOP + CELL_SIZE * y;
                context.strokeStyle = "white";
                context.fillStyle = "gray";
                context.strokeRect(left, top, CELL_SIZE, CELL_SIZE);
                context.fillRect(left, top, CELL_SIZE, CELL_SIZE);
            }
            else if (map[y][x] === 3){
                let left = STAGE_LEFT + CELL_SIZE * x;
                let top = STAGE_TOP + CELL_SIZE * y;
                context.strokeStyle = "white";
                context.fillStyle = "green";
                context.strokeRect(left, top, CELL_SIZE, CELL_SIZE);
                context.fillRect(left, top, CELL_SIZE, CELL_SIZE);
            }
            else {
                let left = STAGE_LEFT + CELL_SIZE * x;
                let top = STAGE_TOP + CELL_SIZE * y;
                context.strokeStyle = "white";
                context.fillStyle = "red";
                context.strokeRect(left, top, CELL_SIZE, CELL_SIZE);
                context.fillRect(left, top, CELL_SIZE, CELL_SIZE);
            }
        }
    }
}
/**
 * タイトル画面の描画
 */
function drawTitle() {
    context.fillStyle = 'black';
    context.fillRect(0, 0, 640, 640);
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
function drawScore() {
    context.fillStyle = "white";
    context.font = "16px arial";
    context.textAlign = "left";
    context.textBaseline = "top";
    context.shadowColor = null;
    context.shadowOffsetX = null;
    context.shadowOffsetY = null;
    context.shadowBlur = null;
    context.fillText("Turn", 16, 16);

    context.fillStyle = "white";
    context.font = "16px arial";
    context.textAlign = "right";
    context.textBaseline = "top";
    context.shadowColor = null;
    context.shadowOffsetX = null;
    context.shadowOffsetY = null;
    context.shadowBlur = null;
    context.fillText(String(turn), 208, 32);
}
/**
 * ハイスコアの描画
 */
function drawHighScore() {
    context.fillStyle = "white";
    context.font = "16px arial";
    context.textAlign = "left";
    context.textBaseline = "top";
    context.shadowColor = null;
    context.shadowOffsetX = null;
    context.shadowOffsetY = null;
    context.shadowBlur = null;
    context.fillText("my piece", 432, 16);
    context.fillText("enemy piece", 432, 40);

    context.fillStyle = "white";
    context.font = "16px arial";
    context.textAlign = "right";
    context.textBaseline = "top";
    context.shadowColor = null;
    context.shadowOffsetX = null;
    context.shadowOffsetY = null;
    context.shadowBlur = null;
    context.fillText(String(my_piece_n), 624, 16);
    context.fillText(String(enemy_piece_n), 624, 40);
}

function drawResult() {
    let str;
    if (winner === 1){
            str = "You Win!";
        }
        else if (winner === 0){
            str = "Draw";
        }
        else{
            str = "You Lose!";
        }
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
/**
 * 背景の描画
 */
function drawBackground() {
    context.fillStyle = 'black';
    context.fillRect(0, 0, 640, 640);
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
    context.fillText(strCount, canvas.width / 2, STAGE_TOP, STAGE_WIDTH);
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


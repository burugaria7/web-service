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
let enemy_moved = null;
let enemy_move = null;


/**
 * **** **** **** **** **** **** **** ****
 * メイン処理
 * **** **** **** **** **** **** **** ****
 */
/**
 * 全体の初期化処理
 */
async function init() {
    // キャンバス要素の取得
    canvas = document.getElementById("a_canvas");
    // 描画用コンテキストの取得
    context = canvas.getContext("2d");
    // イベントリスナの追加
    canvas.addEventListener('click', onCanvasLClick, false);

    drawTitle();

    // ゲームデータのリセット
    resetData();

    get_para();
    roomref = casualref.doc(room_id);
    await get_data();
    await enter_detector();
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
        if (now - lastTitleTime >= 3000) {
            // 0.5秒に1回のタイミングでタイトルガイドを点滅させる。
            lastCountDownTime = Date.now();
            resetData();
            // カウントダウンフェーズに移行する。
	        phase = 1;
        }
        drawTitle();
        // drawBackTitle(backtitle);
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
            }
        }
        drawTitle();
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
        if (now - lastTimeUpTime >= 5000) {
            // タイムアップ表示後3秒後にタイトルフェーズに移行する。
            lastTitleTime = Date.now();

            if (my_num === 1){
                roomref.delete().then(function() {
                    console.log("Document successfully deleted!");
                }).catch(function(error) {
                    console.error("Error removing document: ", error);
                });
            }
            window.location.href = "../../title.html";
            phase = 0;
        }
        drawBackground();
        drawResult()
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
    player = 1;
    winner = null;
    turn = 1;
    enemy_moved = false;
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
    map[y][x] = player;
    if (check_winner(x, y)){
        lastTimeUpTime = Date.now();
        winner = player;
        phase = 3;
        return;
    }
    if (check_finish()){
        lastTimeUpTime = Date.now();
        winner = 0;
        phase = 3;
    }
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
            if (map[y + index_y][x + index_x] !== player){
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
    case 2:     // 以下を追加
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
    if (map[y][x] === 0 && player === my_num){
        put(x, y);
        writeDB(x, y);
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

    context.fillStyle = "white";
    context.font = "45px arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("vs　" + enemy_name, 320, 250);
    //
    // if (isTitleGuide === false) return;
    //
    // context.fillStyle = "white";
    // context.font = "32px arial";
    // context.textAlign = "center";
    // context.textBaseline = "middle";
    // context.shadowColor = null;
    // context.shadowOffsetX = null;
    // context.shadowOffsetY = null;
    // context.shadowBlur = null;
    // context.fillText("Click anywhere to start.", 320, 300);
}
/**
 * スコアの描画
 */
function drawResult() {
    let str;
    if (winner === my_num){
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

function drawTurn() {
    context.fillStyle = "red";
    context.font = "40px arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = null;
    context.shadowOffsetX = null;
    context.shadowOffsetY = null;
    context.shadowBlur = null;
    let str = player === my_num ? "自分" : "相手";
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

async function enter_detector(){
    console.log("enter_detector");
    let unsubscribe = await roomref.collection("mapdata").onSnapshot(function(querySnapshot) {
        // querySnapshot.forEach(function(doc) {
        for (let i = turn - 1; i < querySnapshot.size; i++){
            if (player !== my_num){
                console.log(querySnapshot.docs[i].data());
                put(querySnapshot.docs[i].data().x, querySnapshot.docs[i].data().y)
            }
            else{
                console.log("enemy turn");
            }
        }
        player *= -1;
        turn += 1;
    });
    if (phase === 3){
        unsubscribe();
    }
}

function writeDB(x, y) {
     const subject_num= new Number(turn - 1).toString();
    console.log("set " + subject_num);
    roomref.collection("mapdata").doc(subject_num)
        .set({"x" : x, "y" : y});
}

function get_para(){
    let query = location.search;
    let value = query.split('=');
    room_id = value[1];
}

async function get_data() {
    let querySnapshot = await casualref.doc(room_id).get();
    player = 1;
    if (user.displayName === querySnapshot.data().player_1){
        my_num = 1;
        enemy_name = querySnapshot.data().player_2
    }
    else{
        my_num = -1;
        enemy_name = querySnapshot.data().player_1
    }
    console.log("mynum " + my_num);
}






/**
 * **** **** **** **** **** **** **** ****
 * 定数
 * **** **** **** **** **** **** **** ****
 */
INTERVAL = 32;          // 30FPS（1フレームを32ms間隔で処理）
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

let original = null;
let onlyone = false;
let turn = null;
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
async function init() {
    // キャンバス要素の取得
    canvas = document.getElementById("a_canvas");
    // 描画用コンテキストの取得
    context = canvas.getContext("2d");
    // イベントリスナの追加
    canvas.addEventListener('click', onCanvasClick, false);

    drawTitle();

    // ゲームデータのリセット

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
            phase = 1;
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
        drawPieceNum();
        break;
    case 3:     // 以下を追加
        // ゲームオーバーフェーズ
        now = Date.now();
        if (now - lastTimeUpTime >= 5000) {
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
    original = [-1, -1];
    turn = 1;
    player = 1;
    onlyone = false;
    my_piece_n = 9;
    enemy_piece_n = 9;
    winner = null;
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
                map[y][x] = my_num * -1;
            }
            else if (y === 8){
                map[y][x] = my_num;
            }
            else{
                map[y][x] = 0;
            }
        }
    }
}
/**
 * ランダムにターゲットを配置する。
 */

function move(xx, yy, x, y) {
    map[y][x] = player;
    map[yy][xx] = 0;
    connected(x, y);
    check_finish();
}
function predict(x, y, f = true) {
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
            // console.log(index_j, index_i);
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
            if (player === my_num){
                enemy_piece_n -= 1;
            }
            else{
                my_piece_n -= 1;
            }
            i += index_i;
            j += index_j;
        }
    }
}

function eliminate2(x, y, j, i) {
    // console.log(x, y);
    hairetu = new Array(9);       // セル
    for (let i = 0; i < hairetu.length; i++) {
        hairetu[i] = new Array(9);
        for (let j = 0; j < hairetu[0].length; j++) {
            hairetu[i][j] = 0;
        }
    }
    if (saiki1(x, y)){
        // console.log("y");
        saiki2(x, y);
    }
    else{
        // console.log("n");
    }
}

function saiki1(x, y) {
    if (y >= map.length || y < 0 ||
    x >= map.length || x < 0){
        // console.log("soto");
        return true;
    }
    if (hairetu[y][x] !== 0){
        // console.log("2kaime");
        return true;
    }
    hairetu[y][x] = 1;
    if(map[y][x] === 0){
        // console.log("kuuhaku");
        return false;
    }
    else if (map[y][x] === player){
        // console.log("aite");
        return true;
    }
    else{
        // console.log("tonari");
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
        // console.log("soto");
        return;
    }
    else if(map[y][x] === 0){
        // console.log("kuuhaku");
        return;
    }
    else if (map[y][x] === player){
        // console.log("aite");
        return;
    }
    map[y][x] = 0;
    if (player === my_num){
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
    if (player === my_num){
        if (map[y][x] === player && !onlyone) {
            predict(x, y)
            map[y][x] = 2;
            original = [x, y];
            onlyone = true;
        } else if (map[y][x] === 2 && onlyone) {
            predict(x, y, false);
            map[y][x] = player;
            original = [-1, -1];
            onlyone = false;
        }else if (map[y][x] === 3) {
            predict(original[0], original[1], false);
            onlyone = false;
            move(original[0], original[1], x, y);
            writeDB(original[0], original[1], x, y);
        }
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
    context.fillStyle = '#222222';
    context.fillRect(0, 0, 640, 640);
    context.fillStyle = "white";
    context.font = "50px arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = null;
    context.shadowOffsetX = null;
    context.shadowOffsetY = null;
    context.shadowBlur = null;
    context.fillText("Hasami Shogi", 320, 100);

    context.fillStyle = "white";
    context.font = "45px arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("vs　" + enemy_name, 320, 250);
}
/**
 * スコアの描画
 */
function drawTurn() {
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
function drawPieceNum() {
    context.fillStyle = "white";
    context.font = "16px arial";
    context.textAlign = "left";
    context.textBaseline = "top";
    context.shadowColor = null;
    context.shadowOffsetX = null;
    context.shadowOffsetY = null;
    context.shadowBlur = null;
    context.fillText("my piece", 432, 15);
    context.fillText("enemy piece", 432, 40);

    context.fillStyle = "white";
    context.font = "16px arial";
    context.textAlign = "right";
    context.textBaseline = "top";
    context.shadowColor = null;
    context.shadowOffsetX = null;
    context.shadowOffsetY = null;
    context.shadowBlur = null;
    context.fillText(String(my_piece_n), 624, 15);
    context.fillText(String(enemy_piece_n), 624, 40);
}

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

function writeDB(xx, yy, x, y) {
    const subject_num= new Number(turn).toString();
    console.log("set " + subject_num);
    roomref.collection("mapdata").doc(subject_num)
        .set({"xx" : xx, "yy" : yy, "x" : x, "y" : y});
}

async function enter_detector(){
    console.log("enter_detector");
    let xx, yy, x, y;
    let unsubscribe = await roomref.collection("mapdata").onSnapshot(function(querySnapshot){
        if (player === my_num) console.log("enemy turn");
        else{
            for (let i = 0; i < querySnapshot.size; i++){
                // console.log(querySnapshot.docs[i].id);
                // console.log(turn);
                if (querySnapshot.docs[i].id == turn){
                    if (player !== my_num){
                        console.log(querySnapshot.docs[i].data());
                        // console.log(querySnapshot.docs[i].id);
                        xx = 8 - querySnapshot.docs[i].data().xx;
                        yy = 8 - querySnapshot.docs[i].data().yy;
                        x = 8 - querySnapshot.docs[i].data().x;
                        y = 8 - querySnapshot.docs[i].data().y;
                        move(xx, yy, x, y);
                    }
                    else{
                        console.log("enemy turn");
                    }
                }
            }
        }
        player *= -1;
        turn += 1;
    });
    if (phase === 3){
        console.log("on fin");
        unsubscribe();
    }
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


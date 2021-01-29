/**
 * **** **** **** **** **** **** **** ****
 * 定数
 * **** **** **** **** **** **** **** ****
 */
INTERVAL = 32;          // 30FPS（1フレームを32ms間隔で処理）
CELL_SIZE = 64;        // セルサイズ

// ステージの位置
STAGE_LEFT = 104;
STAGE_TOP = 104;
STAGE_WIDTH = 640;
STAGE_HEIGHT = 640;

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
let count = -1;                 // カウントダウン用の残りカウント
let remainingTime = -1;         // 残り時間
let score = 0;                  // スコア
let highScore = 0;              // ハイスコア

let turn = null;
let winner = [0, 0, 0];
let placed = null;
let round = 0;
let my_hund = ["?", "?", "?"];
let enemy_hund = ["?", "?", "?"];
let my_answer = ["?", "?", "?"];
let enemy_answer = ["?", "?", "?"];
let answer = null;
let select = null;
let selected = null;
let changed = null;
let decision = new Path2D();
let selected_card = null;
let selected_class = null;
let carddata = null;
let classdata = null;

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

    // get_para();
    // roomref = casualref.doc(room_id);
    // await get_data();
    // await enter_detector();
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
        if (now - lastTitleTime >= 1000) {
            // 0.5秒に1回のタイミングでタイトルガイドを点滅させる。
            lastCountDownTime = Date.now();
            resetData();
            phase = 2;
        }
        drawTitle();
        drawround();
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
        drawround();
        drawCount();
        break;
    case 2:                 // 以下を追加
        // タッチフェーズ
        now = Date.now();
        drawBackground();
        drawMap();
        drawTurn();
        drawround();
        break;
    case 3:     // 以下を追加
        // ゲームオーバーフェーズ
        now = Date.now();
        if (round === 3){
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
        }
        else{
            lastTitleTime = Date.now();
            phase = 0;
        }
        drawBackground();
        drawMap();
        drawResult();
        drawround();
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
    count = 3;
    turn = 1;
    player = 1;
    resetMap();
    round += 1;
    my_num = 1;
    createhund();
    select = [false, false, false];
    selected = false;
    changed = false;
    selected_card = [false, false, false];
    selected_class = [false, false, false, false, false];
    carddata = [110, 270, 430];
    classdata = [["★", 65], ["●", 175], ["■", 285], ["▲", 395], ["✖", 505]];

}
/**
 * マップデータのリセット
 */
function resetMap() {
    map = new Array(5);       // セル
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

function createhund() {
    for (let i = 0; i < 7; i++){
        while (true){
            let max_x = 3;
            let max_y = 5;
            let y = Math.floor(Math.random() * (max_y));
            let x = Math.floor(Math.random() * (max_x));
            if (i === 0){
                console.log(x, y, "2");
                map[y][x] = 2;
                answer = returnclass(y);
                break;
            }
            else if(i === 1 || i === 2|| i === 3 && map[y][x] === 0){
                console.log(x, y, "1");
                map[y][x] = 1;
                my_hund[i - 1] = returnclass(y);
                break;
            }
            else if (i === 4 || i === 5 || i === 6 && map[y][x] === 0){
                console.log(x, y, "-1");
                map[y][x] = -1;
                // enemy_hund[i - 4] = returnclass(y);
                break;
            }
        }
    }
    console.log(map);
}

function changehund() {
    console.log("change");
    for (let i = 0; i < selected_card.length; i++){
        if (selected_card[i]){
            while (true){
                let max_x = 3;
                let max_y = 5;
                let y = Math.floor(Math.random() * (max_y));
                let x = Math.floor(Math.random() * (max_x));
                if (map[y][x] === 0){
                    console.log(x, y, "1");
                    map[y][x] = 1;
                    my_hund[i] = returnclass(y);
                    selected_card[i] = false;
                    break;
                }
            }
        }
    }
    console.log(map);
}

function judge() {
    console.log("judge");
    for (let i = 0; i < selected_class.length; i++){
        if (selected_class[i]){
            if (map[i].includes(2)){
                console.log("正解！");
            }
            else{
                console.log("不正解！");
            }
            selected_class[i] = false;
            return;
        }
    }
}

function returnclass(y) {
    if (y === 0) return "★";
    else if (y === 1) return "●";
    else if (y === 2) return "■";
    else if (y === 3) return "▲";
    else if (y === 4) return "✖";
}



/**
 * キャンバスへのマウスクリック
 */
function onCanvasClick(e) {
    let loc = windowToCanvas(e.clientX, e.clientY);
    switch (phase) {
    case 2:     // 以下を追加
        if (context.isPointInPath(decision, loc.x, loc.y) && selected) {
            console.log("decision");
            selected = false;
            if (selected_card.includes(true)){
                // selected_card = [false, false, false];
                changehund();
                changed = true;
            } else if (selected_class.includes(true)) {
                // selected_class = [false, false, false, false, false];
                judge();
            }
            break;
        }

        if (!selected_card.includes(true) && !selected_class.includes(true)){
            for (let i = 0; i < classdata.length; i++) {
                drawclass(classdata[i][0], classdata[i][1], selected_class[i]);
                if (context.isPointInPath(loc.x, loc.y)) {
                    console.log("class", i);
                    selected = true;
                    if (selected_class[i]) {
                        selected_class[i] = false;
                        selected = false;
                    } else {
                        selected_class[i] = true;
                    }
                    break;
                }
            }
        }

        if (!selected_class.includes(true) && !changed) {
            for (let i = 0; i < carddata.length; i++) {
                drawcard(my_hund[i], carddata[i], selected_card[i]);
                if (context.isPointInPath(loc.x, loc.y)) {
                    console.log("card", i);
                    selected = true;
                    if (selected_card[i]) {
                        selected_card[i] = false;
                        selected = false;
                    } else {
                        selected_card[i] = true;
                    }
                    break;
                }
            }
        }

        break;
    }
}

/**
 * **** **** **** **** **** **** **** ****
 * ビュー関連
 * **** **** **** **** **** **** **** ****
 */
function drawMap() {
    drawcard(enemy_hund[0], carddata[0], false, 110);
    drawcard(enemy_hund[1], carddata[1], false, 110);
    drawcard(enemy_hund[2], carddata[2], false, 110);

    drawcard(my_hund[0], carddata[0], selected_card[0]);
    drawcard(my_hund[1], carddata[1], selected_card[1]);
    drawcard(my_hund[2], carddata[2], selected_card[2]);

    drawanswer(my_answer[0], 10, 310);
    drawanswer(my_answer[1], 10, 350);
    drawanswer(my_answer[2], 10, 390);

    drawanswer(enemy_answer[0], 600, 130);
    drawanswer(enemy_answer[1], 600, 170);
    drawanswer(enemy_answer[2], 600, 210);

    drawclass(classdata[0][0], classdata[0][1], selected_class[0]);
    drawclass(classdata[1][0], classdata[1][1], selected_class[1]);
    drawclass(classdata[2][0], classdata[2][1], selected_class[2]);
    drawclass(classdata[3][0], classdata[3][1], selected_class[3]);
    drawclass(classdata[4][0], classdata[4][1], selected_class[4]);

    drawline(90);
    drawline(270);
    drawline(450);

    drawbutton(decision,273);
}

function drawcard(word, x, f, y = 290, h= 140) {
    context.beginPath();
    context.rect(x, y, 100, h);
    if(f) {
        context.fillStyle = 'gray';
    }
    else{
        context.fillStyle = 'white';
    }
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = 'coral';
    context.stroke();
    context.fillStyle = "blue";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "50px serif";
    context.fillText(word, x + 50, y + h / 2);
}

function drawclass(word, x, f, y = 480) {
    context.beginPath();
    context.rect(x, y, 60, 60);
    if(f) {
        context.fillStyle = 'gray';
    }
    else{
        context.fillStyle = 'white';
    }
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = 'coral';
    context.stroke();
    context.fillStyle = "blue";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "30px serif";
    context.fillText(word, x + 30, y + 30);
}

function drawline(y) {
    context.beginPath();
    context.moveTo(50, y);
    context.lineTo(590, y);
    context.closePath();
    context.strokeStyle = 'black';
    context.stroke();
}

function drawbutton(contex, x, y = 570) {
    context.beginPath();
    contex.rect(x, y, 80, 40);
    context.fillStyle = 'white';
    context.fill(contex);
    context.lineWidth = 2;
    context.strokeStyle = 'coral';
    context.stroke(contex);
    context.fillStyle = "blue";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "30px serif";
    context.fillText("決定", x + 40, y + 20);
}

function drawanswer(word, x, y) {
    context.beginPath();
    context.rect(x, y, 30, 30);
    context.fillStyle = 'white';
    context.fill();
    context.lineWidth = 1;
    context.strokeStyle = 'coral';
    context.stroke();
    context.fillStyle = "blue";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "20px serif";
    context.fillText(word, x + 15, y + 15);
}

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
    context.fillText("FiveOne", 320, 100);

    context.fillStyle = "white";
    context.font = "45px arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("vs　" + enemy_name, 320, 250);
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

function drawBackground() {
    context.fillStyle = '#66FFFF';
    context.fillRect(0, 0, 640, 640);
}

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
    context.fillText(String(str) + "のターンです", 320, 50);

    context.fillStyle = "red";
    context.font = "30px arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("turn " + String(turn), 60,50);
}

function drawround() {
    context.fillStyle = "red";
    context.font = "30px arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("round " + String(round), 60, 20);
}

function writeDB(x, y) {
    const subject_num= new Number(turn).toString();
    console.log("set " + subject_num);
    roomref.collection("mapdata").doc(subject_num)
        .set({"x" : x, "y" : y});
}

async function enter_detector(){
    console.log("enter_detector");
    let x, y;
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
                        x = querySnapshot.docs[i].data().x;
                        y = querySnapshot.docs[i].data().y;
                        put(x, y);
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


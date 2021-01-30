INTERVAL = 64;          // 30FPS（1フレームを32ms間隔で処理）
CELL_SIZE = 64;        // セルサイズ

STAGE_LEFT = 104;
STAGE_TOP = 104;
STAGE_WIDTH = 640;
STAGE_HEIGHT = 640;

let canvas = null;              // キャンバス
let context = null;             // 描画用コンテキスト
let phase = -1;                 // ゲームフェーズフラグ
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
const carddata = [110, 270, 430];
const classdata = [["★", 65], ["●", 175], ["■", 285], ["▲", 395], ["✖", 505]];
let enemy = null;
let my_open = null;

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
    // roomref = casualref.doc("d");
    await get_data();
}

function runMainLoop() {
    // ゲームフェーズをタイトルフェーズに移行する。
    phase = 0;

	// メインループを開始する。
    setTimeout(mainLoop, 0);
    lastTitleTime = Date.now();
}

async function mainLoop() {
    let mainLoopTimer = setTimeout(mainLoop, INTERVAL);
    let now = -1;

    switch (phase) {
    case 0:
        // タイトルフェーズ
        now = Date.now();
        if (now - lastTitleTime >= 3000) {
            await resetData();
            // lastCountDownTime = Date.now();
            // phase = 1;
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
        if (now - lastTimeUpTime >= 5000) {
            if (round === 1) {
                lastTitleTime = Date.now();
                if (my_num === 1) {
                    roomref.delete().then(function () {
                        console.log("Document successfully deleted!");
                    }).catch(function (error) {
                        console.error("Error removing document: ", error);
                    });
                }
                window.location.href = "../../title.html";
                phase = 0;
            } else {
                lastTitleTime = Date.now();
                phase = 0;
            }
        }
        drawBackground();
        drawMap();
        drawResult();
        drawround();
        break;
    }
}

$(function() {
    // 全体の初期化処理
    init();
    // メインループの開始
    runMainLoop();
});

function windowToCanvas(wx, wy) {
	let bbox = canvas.getBoundingClientRect();
	return {
		x: (wx - bbox.left) * (canvas.width / bbox.width),
		y: (wy - bbox.top)  * (canvas.height / bbox.height)
	};
}

async function resetData() {
    count = 3;
    turn = 1;
    player = 1;
    resetMap();
    round += 1;
    select = [false, false, false];
    selected = false;
    changed = false;
    selected_card = [false, false, false];
    selected_class = [false, false, false, false, false];
    enemy = ["?", "?", "?"];
    my_open = ["?", "?", "?"];
    if (my_num === 1) {
        console.log("create");
        await createhund();
        await writehund();
    }
    await enter_detector();
    lastCountDownTime = Date.now();
    phase = 1;
}

function resetMap() {
    map = new Array(5);       // セル
    for (let y = 0; y < map.length; y++) {
        map[y] = new Array(3);
        for (let x = 0; x < map[0].length; x++) {
            map[y][x] = 0;
        }
    }
}

function createhund() {
    for (let i = 0; i < 7; i++){
        while (true){
            let max_x = 3;
            let max_y = 5;
            let y = Math.floor(Math.random() * (max_y));
            let x = Math.floor(Math.random() * (max_x));
            if (i === 0){
                map[y][x] = 2;
                answer = returnclass(y);
                break;
            }
            else if((i === 1 || i === 2|| i === 3) && map[y][x] === 0){
                map[y][x] = 1;
                my_hund[i - 1] = returnclass(y);
                break;
            }
            else if ((i === 4 || i === 5 || i === 6) && map[y][x] === 0){
                map[y][x] = -1;
                enemy[i - 4] = returnclass(y);
                break;
            }
        }
    }
    console.log(map);
}

function changehund() {
    for (let i = 0; i < selected_card.length; i++){
        if (selected_card[i]){
            console.log("change");
            my_open[i] = my_hund[i];
            if (my_num === 1){
                while (true){
                    let max_x = 3;
                    let max_y = 5;
                    let y = Math.floor(Math.random() * (max_y));
                    let x = Math.floor(Math.random() * (max_x));
                    if (map[y][x] === 0){
                        map[y][x] = 1;
                        my_hund[i] = returnclass(y);
                        selected_card[i] = false;
                        break;
                    }
                }
            }
        }
    }
    writeopen();
}

function change_enemy() {
    while (true){
        let max_x = 3;
        let max_y = 5;
        let y = Math.floor(Math.random() * (max_y));
        let x = Math.floor(Math.random() * (max_x));
        if (map[y][x] === 0){
            return returnclass(y);
        }
    }
}

function judge() {
    console.log("judge");
    for (let i = 0; i < selected_class.length; i++){
        if (selected_class[i]){
            if (answer === returnclass(i)){
                console.log("正解！");
                winner[round] = player;
                lastTimeUpTime = Date.now();
                phase = 3;
            }
            else{
                console.log("不正解！");
            }
            selected_class[i] = false;
            writeDB(returnclass(i));
            my_answer[returnindex()] = returnclass(i);
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

function returnindex() {
    if (turn === 1 || turn === 2){
        return 0;
    }
    else if (turn === 3 || turn === 4){
        return 1;
    }
    else{
        return 2;
    }
}

function onCanvasClick(e) {
    let loc = windowToCanvas(e.clientX, e.clientY);
    switch (phase) {
    case 2:     // 以下を追加
        if (player === my_num){
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
                    console.log("next");
                    player *= -1;
                    turn += 1;
                }
                break;
            }

            if (!selected_card.includes(true)){
                for (let i = 0; i < classdata.length; i++) {
                    drawclass(classdata[i][0], classdata[i][1], selected_class[i]);
                    if (context.isPointInPath(loc.x, loc.y)) {
                        if (selected_class[i]) {
                            selected_class[i] = false;
                            selected = false;
                        } else if (!selected_class.includes(true)){
                            selected_class[i] = true;
                            selected = true;
                        }
                        break;
                    }
                }
            }

            if (!selected_class.includes(true) && !changed && (turn === 1 || turn === 2)) {
                for (let i = 0; i < carddata.length; i++) {
                    drawcard(my_hund[i], carddata[i], selected_card[i]);
                    if (context.isPointInPath(loc.x, loc.y)) {
                        if (selected_card[i]) {
                            selected_card[i] = false;
                            selected = false;
                        } else {
                            selected_card[i] = true;
                            selected = true;
                        }
                        break;
                    }
                }
            }
        }
        break;
    }
}

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
    if (winner[round] === my_num){
        str = "You Win!";
    }
    else if (winner[round] === 0){
        str = "Draw";
    }
    else{
        str = "You Lose!";
    }
    context.fillStyle = "black";
    context.font = "40px arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = null;
    context.shadowOffsetX = null;
    context.shadowOffsetY = null;
    context.shadowBlur = null;
    context.fillText(str, 320, 60);
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

function writeDB(str) {
    const subject_num= new Number(turn).toString();
    console.log("set " + subject_num);
    roomref.collection("mapdata" + round).doc(subject_num)
        .set({"type" : str});
}

function writeopen() {
    console.log("open");
    roomref.collection("mapdata" + round).doc("open" + my_num)
        .set({"zero" : my_open[0], "one" : my_open[1], "two" : my_open[2],});
}

function writehund(){
    console.log("write hund");
    roomref.collection("mapdata" + round).doc("hund")
        .set({"zero" : enemy[0], "one" : enemy[1], "two" : enemy[2], "answer" : answer});
}

function writechange(x){
    console.log("change enemy");
    for (let i = 0; i < 3; i ++){
        if (x > 0){
            enemy[i] = change_enemy();
            x -= 1;
        }else{
            enemy[i] = "?";
        }
    }
    roomref.collection("mapdata" + round).doc("change")
        .set({"zero" : enemy[0], "one" : enemy[1], "two" : enemy[2]});
}

async function enter_detector(){
    console.log("enter_detector");
    let z, o, t, n;
    let c = -1;
    let x = 0;
    let unsubscribe = await roomref.collection("mapdata" + round).onSnapshot(function(querySnapshot){
        if (my_num === 1 && c === -1 && turn === 1){
            console.log("enemy hund");
            c += 1;
        }
        else if (my_num === -1 && turn === 2 && selected_card.includes(true)){
            for (let i = 0; i < querySnapshot.size; i++) {
                // console.log(querySnapshot.docs[i].id);
                if (querySnapshot.docs[i].id === "change") {
                    console.log(querySnapshot.docs[i].data());
                    z = querySnapshot.docs[i].data().zero;
                    o = querySnapshot.docs[i].data().one;
                    t = querySnapshot.docs[i].data().two;
                    if (z !== "?") my_hund[0] = z;
                    if (o !== "?") my_hund[1] = o;
                    if (t !== "?") my_hund[2] = t;
                    selected_card = [false, false, false];
                }
            }
        }
        else if (player !== my_num){
            for (let i = 0; i < querySnapshot.size; i++){
                // console.log(querySnapshot.docs[i].id);
                if (querySnapshot.docs[i].id == turn){
                    if (player !== my_num){
                        console.log(querySnapshot.docs[i].data());
                        // console.log(querySnapshot.docs[i].id);
                        s = querySnapshot.docs[i].data().type;
                        enemy_answer[returnindex()] = s;
                        if (answer === s){
                            winner[round] = player;
                            lastTimeUpTime = Date.now();
                            phase = 3;
                        }
                        console.log("next");
                        player *= -1;
                        turn += 1;
                    }
                    else{
                        console.log("enemy");
                    }
                    return;
                }
                else if ( c >= 0 && c <  3 && player !== my_num &&
                    querySnapshot.docs[i].id === "open" + my_num * -1 * (c + 1) && (turn === 1 || turn === 2)){
                    console.log(querySnapshot.docs[i].data());
                    z = querySnapshot.docs[i].data().zero;
                    o = querySnapshot.docs[i].data().one;
                    t = querySnapshot.docs[i].data().two;
                    if (z !== "?") {
                        enemy_hund[0] = z;
                        x += 1;
                    }
                    if (o !== "?") {
                        enemy_hund[1] = o;
                        x += 1;
                    }
                    if (t !== "?") {
                        enemy_hund[2] = t;
                        x += 1;
                    }
                    c += 1;
                    if (my_num === 1){
                        writechange(x);
                    }
                    return;
                }
                else if (querySnapshot.docs[i].id === "hund" && my_num === -1 && c === -1){
                    console.log("my hund");
                    console.log(querySnapshot.docs[i].data());
                    my_hund[0] = querySnapshot.docs[i].data().zero;
                    my_hund[1] = querySnapshot.docs[i].data().one;
                    my_hund[2] = querySnapshot.docs[i].data().two;
                    answer = querySnapshot.docs[i].data().answer;
                    c += 1;
                }
            }
        }
        else if (player === my_num) console.log("enemy turn");
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


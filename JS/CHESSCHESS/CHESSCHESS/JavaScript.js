var script = document.createElement('script');
script.type = 'text/javascript';
script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js';
document.getElementsByTagName('head')[0].appendChild(script);
var num = 8;
var color;
var team = false;
var choiceField;
var newField;
var temp_x;
var temp_y;
var new_x;
var new_y;
var choice;
var boardState;
var socket;
var figures;
var myTeam;

var ROOK=5;
var HORSE=4;
var ELEPHANT=3;
var QUEEN=11;
var KING=10;
var PAWN=1;

function newGame(){
    socket = io.connect('http://localhost:8080');

    socket.on('connect', function () {
        //$status.text('Connected!');
        socket.on('start', function(figures){
            alert('You playing: ' + figures);
            this.figures = figures;
            myTeam = figures=='white';
        });
        socket.on('step', function(oldX, oldY, newX, newY){
            changePlaceHere(oldX, oldY, newX, newY);
            if (checkForKingShah(0, 0, 0, 0, myTeam)) {
                alert("Ваш соперник ставит вам шах!");
            }
        });
        socket.on('disconnect', function(){
            alert("Ваш соперник отсоединился");
            location.reload();
        });
        socket.on('finish', function(){
            alert("Вы проиграли!");
            location.reload();
        });
    });
    $("input").remove();
    $("img").remove();

    team = true;
    boardState = [[ROOK, HORSE, ELEPHANT, QUEEN, KING, ELEPHANT, HORSE, ROOK],
             [PAWN, PAWN, PAWN, PAWN, PAWN, PAWN, PAWN, PAWN],
             [0, 0, 0, 0, 0, 0, 0, 0],
             [0, 0, 0, 0, 0, 0, 0, 0],
             [0, 0, 0, 0, 0, 0, 0, 0],
             [0, 0, 0, 0, 0, 0, 0, 0],
             [-PAWN, -PAWN, -PAWN, -PAWN, -PAWN, -PAWN, -PAWN, -PAWN],
             [-ROOK, -HORSE, -ELEPHANT, -QUEEN, -KING, -ELEPHANT, -HORSE, -ROOK]];
    choice = false;
    document.getElementById('board').innerHTML = '';
    document.getElementById('board').style.width = num * 80;
    for (var i = 0; i < num; i++) {
        for (var j = 0; j < num; j++) {
            if ((i % 2 === 0 && j % 2 === 0) || (i % 2 !== 0 && j % 2 !== 0)) {
                $("#board").append('<div class="DarkField" x = "' + j.toString() + '" y = "' + i.toString() + '" onclick = "clickField(this);"></div>');
            }
            else {
                $("#board").append('<div class="LightField" x = "' + j.toString() + '" y = "' + i.toString() + '" onclick = "clickField(this);"></div>');
            }
        }
    }

    //init white side
    for (var j=0; j<2; j++) {
        for (var i=0; i<8; i++) {
            drawFigureByCoordinates (i, j);
        }
    }

    //init black side
    for (var j=6; j<8; j++) {
        for (var i=0; i<8; i++) {
            drawFigureByCoordinates (i, j);
        }
    }
}
function clickField(field){
    if (choice) DoStep(field);
    else chooseField(field);
}

function chooseField(field){
    if (team!=myTeam) {
        alert ("Ожидайте выбора цвета");
        return;
    }
    choiceField = field;
    temp_x = parseInt($(choiceField).attr("x"));
    temp_y = parseInt($(choiceField).attr("y"));

    if (boardState[temp_y][temp_x] !== 0){
        if (team && boardState[temp_y][temp_x] > 0 || !team && boardState[temp_y][temp_x] < 0){
            color = $(choiceField).css("background-color");
            $(choiceField).css("background-color", "#379d62");
            choice = true;
        }
    }
}

function DoStep(field){
    newField = field;
    new_x = parseInt($(newField).attr("x"));
    new_y = parseInt($(newField).attr("y"));
    if (temp_x === new_x && temp_y === new_y){
        $(choiceField).css("background-color", color);
        choice = false;
        return;
    }
    if (canGo(temp_x, temp_y, new_x, new_y)) {
        if (checkForKingShah(temp_x, temp_y, new_x, new_y, myTeam)) {
            alert("Такой ход невозможен, так как ваш король под атакой");
        } else {
            changePlace();
            if (checkForKingShah(0, 0, 0, 0, !myTeam)) {
                alert("Вы сделали шах!");
            }
        }
    }
}

function checkForKingShah (oldX, oldY, newX, newY, team) {
    var tmpNewFigure = boardState[newY][newX];
    var tmpOldFigure = boardState[oldY][oldX];

    boardState[newY][newX] = boardState[oldY][oldX];
    boardState[oldY][oldX] = 0;

    var y=0;
    var x=0;
    var foundFlag=0;

    for (y=0; y<8; y++) {
        for (x=0; x<8; x++) {
            if(Math.abs(boardState[y][x])===KING) {

                if (boardState[y][x]>0 && team || boardState[y][x]<0 && (!team)) {
                    foundFlag=1;
                    break;
                }
            }
        }
        if (foundFlag) {
            break;
        }
    }

    if (x>=8||y>=8) {
        alert("notFoundKing");
    }

    var checkResult = checkForShah(x,y);

    if (checkResult) {
        if (team!=myTeam) {
            if (scanForTheMate(x,y)) {
                socket.emit('finish');
                alert("Вы выиграли!");
                location.reload()
            }
        }

    }

    boardState[newY][newX]=tmpNewFigure;
    boardState[oldY][oldX]=tmpOldFigure;

    return checkResult;
}

//very complex for all cases
function scanForTheMate(x,y) {
    for (var i=-1;i<=1;i++) {
        if (y+i<0||y+i>7) {
            continue;
        }
        for (var j=-1;j<=1;j++) {
            if (x+j<0||x+j>7) {
                continue;
            }
            if (i==0&&j==0) {
                continue;
            }

            if (!canGo(x, y, x+j, y+i)) {
                continue;
            }

            var tmpNewFigure = boardState[y+i][x+j];
            var tmpOldFigure = boardState[y][x];

            boardState[y+i][x+j] = tmpOldFigure;
            boardState[y][x] = 0;
            var isShah = checkForShah(x+j,y+i);
            boardState[y+i][x+j]= tmpNewFigure;
            boardState[y][x] = tmpOldFigure;
            if (!isShah) {
                return false;
            }
        }
    }


    return broodForceMat(x, y, !myTeam);
}

function broodForceMat (kingX, kingY, team) {
    for (var x=0; x<7; x++) {
        for (var y=0; y<7; y++) {
            var figure = boardState[y][x];
            if (Math.abs(figure)==KING) {
                continue;
            }
            if (team&&figure>0 || (!team)&&figure<0) {
                for (var x1=0; x1<7; x1++) {
                    for (var y1=0; y1<7; y1++) {
                        if (canGo(x,y, x1, y1)) {
                            var tmpNewFigure = boardState[y1][x1];
                            var tmpOldFigure = boardState[y][x];
                            boardState[y1][x1] = tmpOldFigure;
                            boardState[y][x] = 0;
                            var isShah = checkForShah(kingX,kingY);
                            boardState[y1][x1]= tmpNewFigure;
                            boardState[y][x] = tmpOldFigure;
                            if (!isShah) return false;
                        }
                    }
                }
            }
        }
    }
    return true;
}

function canGo(oldX, oldY, newX, newY) {
    switch(Math.abs(boardState[oldY][oldX])){
        case ROOK:
            return canGoRook(oldX, oldY, newX, newY);
            break;
        case HORSE:
            return canGoHorse(oldX, oldY, newX, newY);
            break;
        case ELEPHANT:
            return canGoElefant(oldX, oldY, newX, newY);
            break;
        case PAWN:
            return canGoPawn(oldX, oldY, newX, newY);
            break;
        case QUEEN:
            return canGoQueen(oldX, oldY, newX, newY);
            break;
        case KING:
            return canGoKing(oldX, oldY, newX, newY);
            break;
    }
}

function canGoPawn(oldX, oldY, newX, newY){
    var distance = getDistance(oldX, oldY, newX, newY);
    var isAttacking=boardState[oldY][oldX] * boardState[newY][newX] < 0;

    if ((newY-oldY)*boardState[oldY][oldX]<=0) { //check for direction
        return false;
    }

    if (boardState[oldY][oldX] * boardState[newY][newX] > 0) { //exclude friendly fire
        return false;
    }

    if (distance==2) { //first long move
        if (isAttacking) {
            return false;
        }
        if (oldX != newX) {
            return false;
        }
        if (!checkLinearPath(oldX, oldY, newX, newY)) {
            return false;
        }
        if (boardState[newY][newX]!=0) {
            return false;
        }
        return boardState[oldY][oldX] > 0 && oldY==1 || boardState[oldY][oldX] < 0 && oldY==6;
    } else if (distance!=1) { //check for distance
        return false;
    }

    if (isAttacking) {
        return Math.abs(newX-oldX)==1 && Math.abs(newY-oldY)==1;
    }

    return newX==oldX && Math.abs(newY-oldY)==1;
}

function canGoRook(oldX, oldY, newX, newY){
    var flag = false;
    var count_x = oldX-newX;
    var count_y = oldY-newY;

    if(count_x == 0 && count_y == 0) {
        return false;
    }

    if(Math.abs(count_x) > 0 && Math.abs(count_y) > 0) {
        return false;
    }

    if (!checkLinearPath(oldX, oldY, newX, newY)) {
        return false;
    }

    return checkDestinationField(oldX, oldY, newX, newY);
}

function canGoHorse(oldX, oldY, newX, newY){
    var count_x = newX - oldX;
    var count_y = newY - oldY;

    if(Math.abs(count_x)==1&&Math.abs(count_y)==2 || Math.abs(count_x)==2&&Math.abs(count_y)==1) {
        return checkDestinationField(oldX, oldY, newX, newY);
    } else {
        return false;
    }
}

function canGoElefant(oldX, oldY, newX, newY)
{
    var count_x = newX - oldX;
    var count_y = newY - oldY;

    if (!(Math.abs(count_x) === Math.abs(count_y))) {
        return false;
    }

    //check for figures on the way
    if (!checkLinearPath(oldX, oldY, newX, newY)) {
        return false;
    }

    return checkDestinationField(oldX, oldY, newX, newY);
}

function canGoQueen(oldX, oldY, newX, newY){
    return canGoRook(oldX, oldY, newX, newY) || canGoElefant(oldX, oldY, newX, newY);
}
function canGoKing(oldX, oldY, newX, newY){
    var distance = getDistance(oldX, oldY, newX, newY);
    if (!(distance==1)) {
        return false;
    }

    if (!checkDestinationField(oldX, oldY, newX, newY)) {
        return false;
    }


    var tmpFigure = boardState[newY][newX];
    var tmpKing = boardState[oldY][oldX];
    boardState[newY][newX]=boardState[oldY][oldX];
    boardState[oldY][oldX]=0;
    var destinationUnderShah = checkForShah(newX, newY);
    boardState[newY][newX]=tmpFigure;
    boardState[oldY][oldX]=tmpKing;

    if (destinationUnderShah) {
        return false;
    }

    return true;
}


function checkDestinationField (oldX, oldY, newX, newY) {
    //if empty field
    if (boardState[newY][newX] === 0) {
        return true;
    } else {
        return boardState[newY][newX] * boardState[oldY][oldX] < 0; //is opposite side figure
    }
}

function checkLinearPath (oldX, oldY, newX, newY) {
    var count_x = newX - oldX;
    var count_y = newY - oldY;
    var commonCount = getDistance(oldX, oldY, newX, newY);


    for (var i = 1; i < commonCount; i++){
        var coord_x=0;

        if (count_x > 0) {
            coord_x = i;
        } else if (count_x < 0) {
            coord_x = -i;
        }

        var coord_y=0;

        if (count_y > 0) {
            coord_y = i;
        } else if (count_y < 0) {
            coord_y = -i;
        }

        if (boardState[oldY+coord_y][oldX+coord_x] !== 0)
        {
            return false;
        }
    }

    return true;
}

function getDistance (oldX, oldY, newX, newY) {
    return Math.max(Math.abs(newX-oldX), Math.abs(newY-oldY));
}

function checkForShah(kingX, kingY){
    for (var y=0;y<8;y++) {
        for (var x=0;x<8;x++) {
            if (boardState[y][x] != 0) {
                if (x==kingX && y==kingY) {
                    continue;
                }
                if (canGo(x, y, kingX, kingY)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function changePlace() {
    socket.emit('step', temp_x, temp_y, new_x, new_y);
    changePlaceHere(temp_x, temp_y, new_x, new_y)
}
    
function changePlaceHere(old_x, old_y, new_x, new_y)
{
    boardState[new_y][new_x] = boardState[old_y][old_x];
    boardState[old_y][old_x] = 0;

    if (choice) {
        getFieldByCoordinates(old_x, old_y).css("background-color", color);
    }
    drawFigureByCoordinates(old_x, old_y);
    drawFigureByCoordinates(new_x, new_y);


    team = !team;
    choice = false;
}

function getFieldByCoordinates(x, y) {
    var sliceNo = y*8 +x + 1;
    return $("div").slice(sliceNo, sliceNo+1);
}

function drawFigureByCoordinates (x, y) {
    var field = getFieldByCoordinates(x, y);
    field.empty();

    if (boardState[y][x]==0) {
        return;
    }
    field.append(getImageElementByFigureId(boardState[y][x]));
}

function getImageElementByFigureId(figureId) {
    var figurePrefix;
    if (figureId > 0) {
        figurePrefix = 'Light';
    } else if (figureId < 0) {
        figurePrefix = 'Dark';
    } else {
        return null;
    }

    switch (Math.abs(figureId)) {
        case ROOK:
            return '<img src="' + figurePrefix + 'Rook.ico">';
            break;
        case HORSE:
            return '<img src="' + figurePrefix + 'Horse.ico">';
            break;
        case ELEPHANT:
            return '<img src="' + figurePrefix + 'Elefant.ico">';
            break;
        case QUEEN:
            return '<img src="' + figurePrefix + 'Ferz.ico">';
            break;
        case KING:
            return '<img src="' + figurePrefix + 'King.ico">';
            break;
        case PAWN:
            return '<img src="' + figurePrefix + 'Pown.ico">';
            break;
    }
}
var currentPlayer = "X";//global variable, stores the current players symbol(x or o)

var checkedBoxes = [];//stores information about marked boxes

var turnCount = 0;//tracks the total number of moves played

var gameMode = 'PvP';//stores the current game mode(PvP or PvC)

//Added event listener to each box
document.querySelectorAll('.box').forEach((value, key) => {
    value.addEventListener("click", () => {
        onCheckBox(value);//handle box clicks
    });
});
//handle game mode change
function onGameModeChange(mode, _el) {
    if (_el.classList.contains('mode-selected'))
        return;//prevent mutliple selections
    _el.classList.add('mode-selected');//mark the selected mode

    if (mode == 'PvP') {
        document.querySelector(`.mode.PvC`).classList.remove('mode-selected');//deselect PvC mode
    }
    else if (mode == 'PvC') {
        document.querySelector(`.mode.PvP`).classList.remove('mode-selected');//deselect PvP mode
    }
    gameMode = mode;//update game mode
    newGame();//start a new game
}
//handle box clicks
function onCheckBox(element) {
    checkedBoxes.push({ box: element.id, player: currentPlayer });//record the move
    checkElement(element);//mark the box on the ui
    turnCount++;//increment move count
    var gameStatus = checkWinner();//click for a winner or draw
    switchPlayer();//switch to next player
    if (turnCount % 2 == 1 && gameStatus != 'game over' && gameStatus != 'game drawn' && gameMode == "PvC"){//c
        computerPlays();
    }//computers turn in PvC mode
}
//mark the box on ui
function checkElement(element){
    element.value = currentPlayer;
    element.disabled = "disabled";
}
//remove a mark from the box
function onUncheckBox(element, isImplicit = false) {
    checkedBoxes = checkedBoxes.filter(b => b.box != element.id);
    if (!isImplicit) {
        element.value = '';
        element.removeAttribute("disabled");
        turnCount--;
        switchPlayer();
    }
}
//switch to current player
function switchPlayer() {
    currentPlayer = currentPlayer == "X" ? "O" : "X";
    document.querySelector('.current-player').textContent = currentPlayer;
}

//check for winner or draw
function checkWinner(isCheckOnly = false) {
    if (currentPlayer == "X") {
        var xs = checkedBoxes.filter(item => {
            return item.player == "X";
        }).map(value => {
            return { x: Number(value.box.split("-")[0]), y: Number(value.box.split("-")[1]) }
        });

        return calculateScore(xs, isCheckOnly);
    }
    else if (currentPlayer == "O") {
        var os = checkedBoxes.filter(item => {
            return item.player == "O";
        }).map(value => {
            return { x: Number(value.box.split("-")[0]), y: Number(value.box.split("-")[1]) }
        });

        return calculateScore(os, isCheckOnly);
    }


}

//calculate the score based on current player's positions
function calculateScore(positions, isCheckOnly) {

    if (positions.filter(i => { return i.x == i.y }).length == 3) {//diagonal win
        if (!isCheckOnly)
            showWinner();
        return 'game over';
    }

    if (positions.filter(i => { return (i.x == 0 && i.y == 2) || (i.x == 1 && i.y == 1) || (i.x == 2 && i.y == 0) }).length == 3) {//other diagonal win
        if (!isCheckOnly)
            showWinner();
        return 'game over';
    }

    for (var i = 0; i < 3; i++) {
        var consecutiveHorizontal = positions.filter(p => {
            return p.x == i;
        });
        if (consecutiveHorizontal.length == 3) {//horizontal win
            if (!isCheckOnly)
                showWinner();
            return 'game over';
        }
        var consecutiveVertical = positions.filter(p => {
            return p.y == i;
        });
        if (consecutiveVertical.length == 3) {//vertical win
            if (!isCheckOnly)
                showWinner();
            return 'game over';
        }
    }
    if (positions.length == 5) {//draw
        if (!isCheckOnly)
            showWinner(true);
        return 'game drawn';
    }
    return 'game on';
}
//clear the gameboard
function clearBoard() {
    document.querySelectorAll('.box').forEach((value, index) => {
        value.value = '';
        value.removeAttribute("disabled");
        checkedBoxes = [];
        turnCount = 0;
    })
}
//display the winner or draw message
function showWinner(noWinner = false) {

    if (noWinner) {
        document.querySelector('.winner-screen .body').innerHTML = 'Its a Draw!';
        document.querySelector('.winner-screen').classList.toggle('fade-in');
        document.querySelector('.winner-screen').classList.toggle('fade-out');
        //updateModel('draw');
        return;
    }
    else {
        document.querySelector('.winner-screen .body').innerHTML = 'Player ' + currentPlayer + ' Won!';
        document.querySelector('.winner-screen').classList.toggle('fade-in');
        document.querySelector('.winner-screen').classList.toggle('fade-out');
        document.querySelector('#score-' + currentPlayer).textContent = Number(document.querySelector('#score-' + currentPlayer).textContent) + 1;
        return;
    }
}


document.querySelectorAll('.okay-button').forEach((value, key) => {
    value.addEventListener('click', () => {
        newGame();
    });
})

function newGame() {
    showLoader();
    clearBoard();
    document.querySelector('.winner-screen').classList.remove('fade-in');
    document.querySelector('.winner-screen').classList.add('fade-out');
    switchPlayer();
    setTimeout(hideLoader, 500);
}
//coputers turn in PvC mode
function computerPlays() {
    var nextBoxCoords;

    if(turnCount == 1){
        nextBoxCoords = computeFirstMove();
    }
    if (!nextBoxCoords){
        nextBoxCoords = computeFinishingMove();
    }

    if (!nextBoxCoords) {
        nextBoxCoords = computeSavingMove();
    }
    if (!nextBoxCoords)
        nextBoxCoords = predictTrappingMove();
    
    if (!nextBoxCoords) {
        nextBoxCoords = computeRandomMove();
    }

    var nextBox = document.querySelector(`[id='${nextBoxCoords}']`);
    onCheckBox(nextBox);
}
//computers first move strategy
function computeFirstMove(){
    var playedMove = checkedBoxes.map(b => b.box)[0];
    var edgeMoves = ['0-1', '1-0', '1-2', '2-1'];
    var cornerMoves = ['0-0', '0-2', '2-0', '2-2'];
    var centerMove = ['1-1'];
    if(edgeMoves.find(m => m == playedMove))
        return edgeMoveResponse(playedMove);
    else if(cornerMoves.find(m => m == playedMove))
        return '1-1';
    else if(centerMove.find(m => m == playedMove))
        return cornerMoves[Math.floor(Math.random()*cornerMoves.length)];
}
//computers response to edge moves
function edgeMoveResponse(playedMove){
    if(playedMove == '1-2') 
        return '0-2';
    else if (playedMove == "0-1") 
        return "0-0";
    else if (playedMove == "1-0") 
        return "2-0";
    else if(playedMove == '2-1') 
        return '2-0';
}
//computers move to prevent opponets win
function computeSavingMove() {
    var remainingMoves = getRemainingMoves();
    switchPlayer();
    var savingMoveCoords;
    for (var move of remainingMoves) {
        checkedBoxes.push({ box: move, player: currentPlayer });
        var nextBox = document.querySelector(`[id='${move}']`)
        if (checkWinner(true) == 'game over') { 
            savingMoveCoords = move;
            onUncheckBox(nextBox, true);
            break;
        }
        onUncheckBox(nextBox, true);
    }
    switchPlayer();
    if(savingMoveCoords){
        console.log('Playing Saving Move')
        return savingMoveCoords;
    }
}
//computers move to win the game
function computeFinishingMove() {
    var remainingMoves = getRemainingMoves();
    var finishingMoveCoords;
    for (var move of remainingMoves) {
        checkedBoxes.push({ box: move, player: currentPlayer });
        var nextBox = document.querySelector(`[id='${move}']`)
        if (checkWinner(true) == 'game over') {
            finishingMoveCoords = move;
            onUncheckBox(nextBox, true);
            break;
        }
        onUncheckBox(nextBox, true);
    }
    if(finishingMoveCoords){
        console.log('Playing Finishing Move')
        return finishingMoveCoords;
    }
    else{
        return '';
    }
    
}
//computers move to set up a trap
function predictTrappingMove() {
    var checkedBoxesBackup = checkedBoxes.slice();
    var remainingMoves = getRemainingMoves();
    var nextMove;
    var moveFound;
    for(var move of remainingMoves){
        checkedBoxes.push({box: move, player: currentPlayer})
        switchPlayer();

        //Check if the opponent needs to play a saving move

        var savingMove =  computeSavingMove();
        if(savingMove){
            checkedBoxes.push({box: savingMove, player: currentPlayer});
            if(checkTrap() == 'no trap'){
                checkedBoxes.pop();
                switchPlayer();
                nextMove = move;
                break;
            }
            checkedBoxes.pop();
            switchPlayer();
            continue;
        }

        //If no saving move is required, check each position
        else{
            switchPlayer();
            for(var opponentMove of getRemainingMoves()){
                switchPlayer();
                moveFound = true;
                
                checkedBoxes.push({box: opponentMove, player: currentPlayer});
                if(checkTrap() == 'trapped'){
                    moveFound = false;
                    checkedBoxes.pop();
                    switchPlayer();
                    break;
                }
                checkedBoxes.pop();
                switchPlayer();
            }
        }

        checkedBoxes.pop();
        if(moveFound){
            nextMove = move;
            break;
        }
    }
    checkedBoxes = checkedBoxesBackup;
    return nextMove;
}

function checkTrap(){

    var boxes = getRemainingMoves();
    var winningMoveCount = 0;
    for(var freeMove of boxes){
        checkedBoxes.push({box: freeMove, player: currentPlayer});
        var result = checkWinner(true);
        if(result == 'game over')
            winningMoveCount++
        checkedBoxes.pop();
    }
    if(winningMoveCount > 1){
        return 'trapped';
    }
    else{
        return 'no trap';
    }
}

function computeRandomMove() {
    var remainingMoves = getRemainingMoves();
    return remainingMoves[Math.floor(Math.random()*remainingMoves.length)]
}

function getRemainingMoves() {
    var allMoves = ['0-0', '0-1', '0-2',
        '1-0', '1-1', '1-2',
        '2-0', '2-1', '2-2',]
    var playedMoves = checkedBoxes.map(b => b.box);
    return allMoves.filter(m => !playedMoves.find(move => move == m));
}



function showLoader(){
    document.querySelector('.loader-overlay').style.display = 'block';
}




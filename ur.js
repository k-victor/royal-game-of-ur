import {drop, take, curry, compose, concat} from 'ramda';
// Utgå ifrån gameState (bådas med), turn, och typ moveValue?
// utifrån ovan kan vi använda alla funktioner som behövs?

const player1 = () => 1;
const player2 = () => 2;
const isPlayer1Turn = (turn) => turn === player1();

const getCurrentPlayerBoard = (turn, board) => (isPlayer1Turn(turn) ? take(board.length / 2, board) : drop(board.length / 2, board));
const getOtherPlayerBoard = (turn, board) => (isPlayer1Turn(turn) ? drop(board.length / 2, board) : take(board.length / 2, board));
// const curriedGetCurrentPlayerBoard = (turn, state) => isPlayer1Turn(turn) ? take(state.length / 2, state) : drop(state.length / 2, state);


export const add = (value1, value2) => value1 + value2;
export const addTo = curry(add);
export const subtract = (value1, value2) => (value1 - value2 >= 0 ? value1 - value2 : 0);
export const multiply = (value1, value2) => value1 * value2;
export const endSquare = () => createArrayFromValue(0);
export const inverseValue = (value) => (value === 0 ? 1 : 0);
export const inverse = (array) => array.map(inverseValue);
export const multiplyArrays = curry((array1, array2) => zipWith(array1, array2, multiply));
export const addArrays = curry((array1, array2) => zipWith(array1, array2, add));
export const subtractArrays = curry((array1, array2) => zipWith(array1, array2, subtract));
export const createArrayFromValue = (value) => [value];
// CUrry behövs ej?
// const multiplyArrayWith = curry(multiplyArrays);
// Curry it.
export const multiplyWithSharedFlowers = (board) => multiplyArrays(maskWithFlowers(sharedTiles()), board);
export const maskWithSharedTiles = (board) => multiplyArrays(sharedTiles(), board);
export const maskWithFlowers = (board) => multiplyArrays(flowers(), board);
// Ovan returnerar funktion maskWithFlowers()(array). Gör det möjligt att komponera

export const sumUpBoard = (array) => array.reduce((sum, value) => sum + value);
export const removePiecesFromBoard = curry((board, piecesArray) => subtractArrays(board, piecesArray));
export const addPiecesToBoard = curry((board, piecesArray) => addArrays(board, piecesArray));

export const zipWith = (arr1, arr2, mappingFn) => {
    if(arr1.length && arr2.length && mappingFn) {
        const arr1Value = arr1[0];
        const arr2Value = arr2[0];
        return [mappingFn(arr1Value, arr2Value)].concat(zipWith(drop(1, arr1), drop(1, arr2), mappingFn));
    } else {
        return [];
    }
};

// nextTurn: inverse(player1Before) * flowers * player1After
export const getNextTurn = (turn) => (isPlayer1Turn(turn) ? player2() : player1());
export const nextTurn = (turn, currentPlayerBoardBeforeMove, currentPlayerBoardAfterMove) => (compose(
    sumUpBoard,
    multiplyArrays(maskWithFlowers(currentPlayerBoardAfterMove)),
    inverse
)(currentPlayerBoardBeforeMove) > 0 ? turn : getNextTurn(turn));

export const calcAvailableMoves = (playerGameState, moveValue) => {
    const board = playerGameState.concat(endSquare());
    const fromArr = take(board.length - moveValue, board);
    const toArr = drop(moveValue, board);

    return compose(
        multiplyArrays(fromArr),
        inverse
    )(toArr);
};

// availMoves:  validMoves(player1 + flowers * sharedTiles * player2)
export const getAvailableMoves = (currentPlayer, otherPlayer, moveValue) => calcAvailableMoves(addArrays(currentPlayer, multiplyWithSharedFlowers(otherPlayer)), moveValue);

// Always start with 0 and drop one less than the move value. Otherwise the shifted value that "spills over" returns to the 0 index.
export const getMoveToVector = (moveFromVector, moveValue) => [0].concat(drop(moveFromVector.length - moveValue + 1, moveFromVector)).concat(take(moveFromVector.length - moveValue, moveFromVector));
export const canMove = (moveFromVector, availableMoves) => compose(
    sumUpBoard,
    multiplyArrays(availableMoves)
)(moveFromVector) > 0;

export const reverseConcat = curry((arr1, arr2) => concat(arr2, arr1));

// take: player2 - player1After * sharedTiles
export const takePiece = (currentPlayerBoard, otherPlayerBoard) => {
    // takeFromBoard(otherPlayersBoard)(currentPlayersSharedBoard)
    const otherPlayerBoardAfterTake = compose(
        // addArray [noTakes,0,0...]
        multiplyArrays(otherPlayerBoard),
        inverse,
        maskWithSharedTiles
    )(currentPlayerBoard);

    // Kan nedan kombineras med ovan?
    return compose(
        reverseConcat(drop(1, otherPlayerBoardAfterTake)),
        createArrayFromValue,
        addTo(otherPlayerBoard[0]),
        sumUpBoard,
        removePiecesFromBoard(otherPlayerBoard)
    )(otherPlayerBoardAfterTake);
};


export const move = (currentPlayerBoard, moveFromVector, moveValue, availableMoves) => {
    if(canMove(moveFromVector, availableMoves)) {
        return compose(
            addPiecesToBoard(getMoveToVector(moveFromVector, moveValue)),
            removePiecesFromBoard
        )(currentPlayerBoard, moveFromVector);
    } else {
        return currentPlayerBoard;
    }
};

let nextPlayerToMove = 0;
const playATurn = (boardState, diceThrow, moveVector, turn) => {
    const currentPlayer = getCurrentPlayerBoard(turn, boardState);
    const otherPlayer = getOtherPlayerBoard(turn, boardState);

    // / Can this be composed?
    const currentPlayerAfterMove = move(currentPlayer, moveVector, diceThrow, getAvailableMoves(currentPlayer, otherPlayer, diceThrow));
    const otherPlayerAfterMove = takePiece(currentPlayerAfterMove, otherPlayer);

    const fusedPlayerStates = isPlayer1Turn(turn) ? currentPlayerAfterMove.concat(otherPlayerAfterMove) : otherPlayerAfterMove.concat(currentPlayerAfterMove);
    nextPlayerToMove = nextTurn(turn, currentPlayer, currentPlayerAfterMove);

    printState(fusedPlayerStates, nextPlayerToMove);

    return fusedPlayerStates;
};

const playSeq = (someMoves, boardState, turn) => {
    if(someMoves.length) {
        const playedTurn = playATurn(boardState, someMoves[0].moveValue, someMoves[0].move, turn);
        return playSeq(drop(1, someMoves), playedTurn, nextPlayerToMove);
    } else {
        console.log('Done');
        printState(boardState, 0);
        console.log(arraysEqual(boardState, [0, 1, 1, 0, 1, 1, 1, 1, 0, 5, 0, 1, 0, 0, 0, 0, 0, 1]));
    }
};


const player1Board = [2, 1, 0, 0, 0, 1, 1, 1, 1];
const player2Board = [5, 0, 1, 1, 0, 0, 0, 0, 0];
const flowers = () => [0, 0, 0, 0, 1, 0, 0, 0, 0];
const sharedTiles = () => [0, 0, 0, 1, 1, 1, 0, 0, 0];
// const board = gameState.concat(endSquare());

// Combine move and take?

const someMoves = [
    {
        moveValue: 2,
        move: [1, 0, 0, 0, 0, 0, 0, 0, 0]
        // 1,1,1,0,0,1,1,1,1
        // 5,0,1,1,0,0,0,0,0
    },
    {
        moveValue: 1,
        move: [0, 0, 0, 1, 0, 0, 0, 0, 0]
        // 1,1,1,0,0,1,1,1,1
        // 5,0,1,0,1,0,0,0,0
    },
    {
        moveValue: 3,
        move: [1, 0, 0, 0, 0, 0, 0, 0, 0]
        // 1,1,1,0,0,1,1,1,1
        // 4,0,1,1,1,0,0,0,0
    },
    {
        moveValue: 3,
        move: [1, 0, 0, 0, 0, 0, 0, 0, 0]
        // 0,1,1,1,0,1,1,1,1
        // 5,0,1,0,1,0,0,0,0
    },
    {
        moveValue: 4,
        move: [0, 0, 0, 0, 1, 0, 0, 0, 0]
        // 0,1,1,1,0,1,1,1,1
        // 5,0,1,0,0,0,0,0,1
    },
    {
        moveValue: 1,
        move: [0, 0, 0, 1, 0, 0, 0, 0, 0]
        // 0,1,1,0,1,1,1,1,1
        // 5,0,1,0,0,0,0,0,1
    },
    {
        moveValue: 1,
        move: [0, 0, 0, 0, 0, 0, 0, 0, 1]
        // 0,1,1,0,1,1,1,1,0
        // 5,0,1,0,0,0,0,0,1
    }
];

// Temp fn used to test
function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;

    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.

    for (let i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

const printState = (gameState, nextPlayerToMove) => {
    console.log(take(gameState.length / 2, gameState));
    console.log(drop(gameState.length / 2, gameState));
    console.log(flowers());
    console.log(sharedTiles());
    console.log('Next to move ', nextPlayerToMove);
    console.log('---------------------------------');
};
printState(player1Board.concat(player2Board));

playSeq(someMoves, player1Board.concat(player2Board), 1);

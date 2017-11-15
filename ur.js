import {drop, take, curry, compose, concat} from 'ramda';
import {addTo, inverse, addArrays, subtractArrays, multiplyArrays, createArrayFromValue, reverseConcat, sumUpBoard} from './utils';

// Struktur:
// moveMonad
// turnMonad
// gameMonad (play a turn)

const player1 = () => 1;
const player2 = () => 2;
const isPlayer1Turn = (turn) => turn === player1();

const getCurrentPlayerBoard = (turn, board) => (isPlayer1Turn(turn) ? take(board.length / 2, board) : drop(board.length / 2, board));
const getOtherPlayerBoard = (turn, board) => (isPlayer1Turn(turn) ? drop(board.length / 2, board) : take(board.length / 2, board));

export const endSquare = () => createArrayFromValue(0);
export const maskWithSharedFlowers = (board) => multiplyArrays(maskWithFlowers(sharedTiles()), board);
export const maskWithSharedTiles = (board) => multiplyArrays(sharedTiles(), board);
export const maskWithFlowers = (board) => multiplyArrays(flowers(), board);

export const removePiecesFromBoard = curry(subtractArrays);
export const addPiecesToBoard = curry(addArrays);
export const multiplyWithArray = curry(multiplyArrays);

const player1Board = [2, 1, 0, 0, 0, 1, 1, 1, 1];
const player2Board = [5, 0, 1, 1, 0, 0, 0, 0, 0];
const flowers = () => [0, 0, 0, 0, 1, 0, 0, 0, 0];
const sharedTiles = () => [0, 0, 0, 1, 1, 1, 0, 0, 0];

// nextTurn: inverse(player1Before) * flowers * player1After
export const getNextTurn = (turn) => (isPlayer1Turn(turn) ? player2() : player1());
export const nextTurn = (turn, currentPlayerBoardBeforeMove, currentPlayerBoardAfterMove) => (compose(
    sumUpBoard,
    multiplyWithArray(maskWithFlowers(currentPlayerBoardAfterMove)),
    inverse
)(currentPlayerBoardBeforeMove) > 0 ? turn : getNextTurn(turn));

// availMoves:  validMoves(player1 + flowers * sharedTiles * player2)
export const getAvailableMoves = (currentPlayerBoard, otherPlayerBoard, moveValue) => {
    const cPlayerBoard = concat(currentPlayerBoard, endSquare());
    const fromVector = take(cPlayerBoard.length - moveValue, cPlayerBoard);
    return compose(
        multiplyWithArray(fromVector), // Multiply the from vector with the inverse of the to vector. This way, only when from is 1 and to is 0 it's a valid move!
        inverse,
        reverseConcat(endSquare()), // Concat the end square
        drop(moveValue), // Shift the board to the right
        addPiecesToBoard(cPlayerBoard), // Add it to current player's board
        maskWithSharedFlowers // Get other player's pieces on shared flowers
    )(otherPlayerBoard);
};


export const getMoveToVector = (moveFromVector, moveValue) => compose(
    concat(createArrayFromValue(0)), // Always start with 0 (you can never move to the first board position) and drop one less than the move value. Otherwise the shifted value that "spills over" returns to the 0 index.
    concat(drop(moveFromVector.length - moveValue + 1, moveFromVector)),
    take(moveFromVector.length - moveValue)
)(moveFromVector);

export const canMove = (moveFromVector, availableMoves) => compose(
    sumUpBoard,
    multiplyWithArray(availableMoves)
)(moveFromVector) > 0;


export const takePiece = (currentPlayerBoard, otherPlayerBoard) => compose(
    removePiecesFromBoard(otherPlayerBoard),
    maskWithSharedTiles
)(currentPlayerBoard);

export const numberOfPiecesTaken = (currentPlayerBoard, otherPlayerBoard) => compose(
    sumUpBoard,
    removePiecesFromBoard(otherPlayerBoard)
)(takePiece(currentPlayerBoard, otherPlayerBoard));

export const addTakenPieceToStartTile = (currentPlayerBoard, otherPlayerBoard) => compose(
    createArrayFromValue,
    addTo(otherPlayerBoard[0]),
)(numberOfPiecesTaken(currentPlayerBoard, otherPlayerBoard));

export const takePieceAndPutBack = (currentPlayerBoard, otherPlayerBoard) => compose(
    concat(addTakenPieceToStartTile(currentPlayerBoard, otherPlayerBoard)),
    drop(1),
)(takePiece(currentPlayerBoard, otherPlayerBoard));

export const move = (currentPlayerBoard, moveFromVector, moveValue, availableMoves) => {
    if(canMove(moveFromVector, availableMoves)) {
        const moveToVector = getMoveToVector(moveFromVector, moveValue);
        return compose(
            addPiecesToBoard(moveToVector),
            removePiecesFromBoard(currentPlayerBoard)
        )(moveFromVector);
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
    const otherPlayerAfterMove = takePieceAndPutBack(currentPlayerAfterMove, otherPlayer);

    const fusedPlayerStates = isPlayer1Turn(turn) ? concat(currentPlayerAfterMove, otherPlayerAfterMove) : concat(otherPlayerAfterMove, currentPlayerAfterMove);
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

console.log(arraysEqual(getAvailableMoves([0, 0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0, 0], 2), [0, 0, 0, 0, 0, 0, 0, 0]));
console.log(arraysEqual(getAvailableMoves([0, 0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0, 0], 4), [0, 0, 1, 0, 0, 0]));
console.log(arraysEqual(getAvailableMoves([0, 0, 1, 0, 0, 0, 0, 0, 1], [0, 0, 0, 0, 1, 0, 0, 0, 0], 1), [0, 0, 1, 0, 0, 0, 0, 0, 1]));
console.log(arraysEqual(getAvailableMoves([2, 0, 1, 0, 0, 0, 0, 0, 1], [0, 0, 0, 0, 1, 0, 0, 0, 0], 3), [2, 0, 1, 0, 0, 0, 0]));
console.log(arraysEqual(getMoveToVector([0, 0, 0, 1], 1), [0, 0, 0, 0]));
console.log(arraysEqual(getMoveToVector([0, 0, 1, 0], 1), [0, 0, 0, 1]));
console.log(arraysEqual(getMoveToVector([1, 0, 0, 0, 0], 4), [0, 0, 0, 0, 1]));
console.log(arraysEqual(getMoveToVector([0, 1, 0, 0, 0], 4), [0, 0, 0, 0, 0]));
console.log(arraysEqual(getMoveToVector([0, 0, 1, 0, 0], 2), [0, 0, 0, 0, 1]));
console.log(arraysEqual(getMoveToVector([0, 0, 0, 0, 0], 2), [0, 0, 0, 0, 0]));
console.log(arraysEqual(getMoveToVector([1, 0, 0, 0, 0], 3), [0, 0, 0, 1, 0]));

import {drop, take, curry, compose, concat} from 'ramda';
//test
// Utgå ifrån gameState (bådas med), turn, och typ moveValue?
// utifrån ovan kan vi använda alla funktioner som behövs?

const player1 = () => 1;
const player2 = () => 2;
const isPlayer1Turn = (turn) => turn === player1();
const isPlayer2Turn = (turn) => turn === player2();

const getCurrentPlayerBoard = (turn, board) => isPlayer1Turn(turn) ? take(board.length / 2, board) : drop(board.length / 2, board);
const getOtherPlayerBoard = (turn, board) => isPlayer1Turn(turn) ? drop(board.length / 2, board) : take(board.length / 2, board);
//const curriedGetCurrentPlayerBoard = (turn, state) => isPlayer1Turn(turn) ? take(state.length / 2, state) : drop(state.length / 2, state);


export const add = (value1, value2) => value1 + value2;
export const subtract = (value1, value2) => value1 - value2 >= 0 ? value1 - value2 : 0;
export const multiply = (value1, value2) => value1 * value2;
export const endSquare = () => [0];
export const inverseValue = (value) => value === 0 ? 1 : 0;
export const inverse = (array) => array.map(inverseValue);
export const multiplyArrays = (array1, array2) => zipWith(array1, array2, multiply);
export const addArrays = (array1, array2) => zipWith(array1, array2, add);
export const subtractArrays = (array1, array2) => zipWith(array1, array2, subtract);
const multiplyArrayWith = curry(multiplyArrays);
// Curry it.
export const multiplyWithSharedFlowers = (array) => multiplyArrays(multiplyWithFlowers(sharedTiles()), array);
export const multiplyWithSharedTiles = (array) => multiplyArrays(sharedTiles(), array);
export const multiplyWithFlowers = (array) => multiplyArrays(flowers(), array);
// Ovan returnerar funktion multiplyWithFlowers()(array). Gör det möjligt att komponera

export const sumUpArray = (array) => array.reduce((sum, value) => sum + value);

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
export const getNextTurn = (turn) => isPlayer1Turn(turn) ? player2() : player1();
export const nextTurn = (turn, currentPlayerBoardBeforeMove, currentPlayerBoardAfterMove) => sumUpArray(multiplyArrays(multiplyWithFlowers(currentPlayerBoardAfterMove), inverse(currentPlayerBoardBeforeMove))) > 0 ? turn : getNextTurn(turn);

export const calcAvailableMoves = (playerGameState, moveValue) => {
    const board = playerGameState.concat(endSquare());
    const fromArr = take(board.length - moveValue, board);
    const toArr = drop(moveValue, board);

    return multiplyArrays(fromArr, inverse(toArr));
};

// availMoves:  validMoves(player1 + flowers * sharedTiles * player2)
export const getAvailableMoves = (currentPlayer, otherPlayer, moveValue) => calcAvailableMoves(addArrays(currentPlayer, multiplyWithSharedFlowers(otherPlayer)), moveValue);


// Always start with 0 and drop one less than the move value. Otherwise the shifted value that "spills over" returns to the 0 index.
export const moveToArray = (moveFromArray, moveValue) => [0].concat(drop(moveFromArray.length - moveValue + 1, moveFromArray)).concat(take(moveFromArray.length - moveValue, moveFromArray));
export const verifyMove = (moveFromArray, availableMoves) => sumUpArray(multiplyArrays(moveFromArray, availableMoves)) > 0;

// take: player2 - player1After * sharedTiles
export const takePiece = (currentPlayerBoard, otherPlayerBoard) => {
    // takeFromBoard(otherPlayersBoard)(currentPlayersSharedBoard)
    const otherPlayerBoardAfterTake = multiplyArrays(otherPlayerBoard, inverse(multiplyWithSharedTiles(currentPlayerBoard)));
    const numberOfPiecesTaken = sumUpArray(subtractArrays(otherPlayerBoard, otherPlayerBoardAfterTake));

    return [otherPlayerBoard[0] + numberOfPiecesTaken].concat(drop(1, otherPlayerBoardAfterTake));
};


export const removePieceFromBoard = curry((board, pieceArray) => subtractArrays(board, pieceArray));

export const addPiece = (board, pieceArray) => {console.log("ADD", board, pieceArray); return addArrays(board, pieceArray);}
const addPieceToBoard = curry(addPiece);

export const move = (currentPlayerBoard, moveFromArray, moveValue, availableMoves) => {
    if(verifyMove(moveFromArray, availableMoves)) {
        // move: inverse(moveFromArr) * player1Before + moveToArr (any order possible)
        // multiplyWithGameState = curry(multiplyArrays)(gameState)
        //
        // multiplyWithGameState
        // inverse
        // addToBoard, takeFromBoard
        // return addArrays(subtractArrays(currentPlayerBoard, moveFromArray), moveToArray(moveFromArray, moveValue));
        const doAMove = compose(
            addPieceToBoard(moveToArray(moveFromArray, moveValue)),
            removePieceFromBoard
        );
        console.log("COMPO", doAMove(currentPlayerBoard, moveFromArray))

        return addPieceToBoard(removePieceFromBoard(currentPlayerBoard)(moveFromArray))(moveToArray(moveFromArray, moveValue));
    } else {
        return currentPlayerBoard;
    }
};


const playATurn = (boardState, diceThrow, moveArray, turn) => {
    const moves = [1];
    if(moves.length) {
        const currentPlayer = getCurrentPlayerBoard(turn, boardState);
        const otherPlayer = getOtherPlayerBoard(turn, boardState);

        const currentPlayerAfterMove = move(currentPlayer, moveArray, diceThrow, getAvailableMoves(currentPlayer, otherPlayer, diceThrow));
        const otherPlayerAfterMove = takePiece(currentPlayerAfterMove, otherPlayer);

        const fusedPlayerStates = isPlayer1Turn(turn) ? currentPlayerAfterMove.concat(otherPlayerAfterMove) : otherPlayerAfterMove.concat(currentPlayerAfterMove);
        const nextPlayerToMove = nextTurn(turn, currentPlayer, currentPlayerAfterMove);

        printState(fusedPlayerStates, nextPlayerToMove);
    } else {
        return state;
    }
};


const player1Board =      [2, 1, 0, 0, 0, 1, 1, 1, 1];
const player2Board =      [5, 0, 1, 1, 0, 0, 0, 0, 0];
const flowers = () =>     [0, 0, 0, 0, 0, 0, 0, 0, 0];
const sharedTiles = () => [0, 0, 0, 1, 1, 1, 0, 0, 0];
//const board = gameState.concat(endSquare());
const diceThrow = 3;
const moveArray = [1, 0, 0, 0, 0, 0, 0, 0, 0];

// Combine move and take?

const someMoves = [
    {
        moveValue: 2,
        move: [1, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    {
        moveValue: 1,
        move: [0, 0, 0, 1, 0, 0, 0, 0, 0]
    },
    {
        moveValue: 1,
        move: [0, 0, 1, 0, 0, 0, 0, 0, 0]
    },
    {
        moveValue: 4,
        move: [1, 0, 0, 0, 0, 0, 0, 0, 0]
    }
];

const printState = (gameState, nextPlayerToMove) => {
    console.log(take(gameState.length / 2, gameState));
    console.log(drop(gameState.length / 2, gameState));
    console.log(flowers());
    console.log(sharedTiles());
    console.log("Next to move ", nextPlayerToMove);
    console.log('---------------------------------')
};
printState(player1Board.concat(player2Board));
playATurn(player1Board.concat(player2Board), someMoves[0].moveValue, someMoves[0].move, 1);

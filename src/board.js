import {drop, take, curry, compose, concat, map} from 'ramda';
import {inverse, addArrays, subtractArrays, multiplyArrays, createArrayFromValue, flippedConcat, sumUpBoard, largerThanOneToOne} from './utils';
import {isPlayer1Turn} from './turn';

// All move vectors are assumed being the length of the board.

// [a] -> [a] -> Int -> [a]
export const getAvailableMoves = (currentPlayerBoard, otherPlayerBoard, moveValue) => {
    // +1 since we can move from that one to the last square.
    const fromVector = take(currentPlayerBoard.length - moveValue + 1, currentPlayerBoard);

    return moveValue === 0 ? emptyBoard() : compose(
        map(largerThanOneToOne), // Map >1 values to 1 (you can only move one piece at a time)
        multiplyWithArray(fromVector), // Multiply the from vector with the inverse of the to vector. This way, only when from is 1 and to is 0 it's a valid move!
        inverse,
        flippedConcat(endSquare()), // Concat the end square. We need it to check pieces going out
        drop(moveValue), // Shift the board to the right
        addPiecesToBoard(currentPlayerBoard), // Add it to current player's board
        maskWithSharedFlowers // Get other player's pieces on shared flowers
    )(otherPlayerBoard);
};

// [a] -> Int -> [a]
export const getMoveToVector = (moveFromVector, moveValue) => compose(
    concat(createArrayFromValue(0)), // Always start with 0 (you can never move to the first board position) and drop one less than the move value. Otherwise the shifted value that "spills over" returns to the 0 index.
    concat(drop(moveFromVector.length - moveValue + 1, moveFromVector)),
    take(moveFromVector.length - moveValue)
)(moveFromVector);

// [a] -> Boolean
export const boardIsEmpty = (board) => sumUpBoard(board) === 0;

// Int -> [a] -> [a]
export const getCurrentPlayerBoard = (turn, board) => (isPlayer1Turn(turn) ? take(board.length / 2, board) : drop(board.length / 2, board));

// Int -> [a] -> [a]
export const getOtherPlayerBoard = (turn, board) => (isPlayer1Turn(turn) ? drop(board.length / 2, board) : take(board.length / 2, board));

// [a] -> [a]
export const maskWithSharedFlowers = (board) => multiplyArrays(maskWithFlowers(sharedTiles()), board);

// [a] -> [a]
export const maskWithSharedTiles = (board) => multiplyArrays(sharedTiles(), board);

// [a] -> [a]
export const maskWithFlowers = (board) => multiplyArrays(flowers(), board);

// [a] -> [a] -> [a]
export const removePiecesFromBoard = curry(subtractArrays);

// [a] -> [a] -> [a]
export const addPiecesToBoard = curry(addArrays);

// [a] -> [a] -> [a]
export const multiplyWithArray = curry(multiplyArrays);

// [a] -> [a]
export const sumUpBoard = (array) => array.reduce((sum, value) => sum + value);

// Int -> [a] -> [a] -> [a]
export const mergeBoards = curry((turn, otherPlayerBoard, currentPlayerBoard) => (isPlayer1Turn(turn) ? concat(currentPlayerBoard, otherPlayerBoard) : concat(otherPlayerBoard, currentPlayerBoard)));
export const flippedMergeBoards = curry((turn, currentPlayerBoard, otherPlayerBoard) => (isPlayer1Turn(turn) ? concat(currentPlayerBoard, otherPlayerBoard) : concat(otherPlayerBoard, currentPlayerBoard)));

export const startingBoard = () => [7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1];
export const flowers = () => [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1];
export const sharedTiles = () => [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0];
export const endSquare = () => createArrayFromValue(0);
export const emptyBoard = () => [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

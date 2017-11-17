import {curry, drop, compose, concat} from 'ramda';
import {maskWithSharedTiles, sumUpBoard, addPiecesToBoard, removePiecesFromBoard, getCurrentPlayerBoard, getOtherPlayerBoard, mergeBoards, flippedMergeBoards, multiplyWithArray} from './board-monad';
import {createArrayFromValue, addTo} from './utils';

// All move vectors are assumed being the length of the board.

// [a] -> [a] -> Boolean
export const canMove = (moveFromVector, availableMoves) => compose(
    sumUpBoard,
    multiplyWithArray(availableMoves)
)(moveFromVector) > 0;

// [a] -> [a] -> [a]
export const takePiece = curry((currentPlayerBoard, otherPlayerBoard) => compose(
    removePiecesFromBoard(otherPlayerBoard),
    maskWithSharedTiles
)(currentPlayerBoard));

// [a] -> [a] -> Int
export const numberOfPiecesTaken = curry((currentPlayerBoard, otherPlayerBoard) => compose(
    sumUpBoard,
    removePiecesFromBoard(otherPlayerBoard),
    takePiece(currentPlayerBoard)
)(otherPlayerBoard));

// [a] -> [a] -> [a]
// Adds the taken piece to the start tile of the taken player's board.
export const addTakenPieceToStartTile = (currentPlayerBoard, otherPlayerBoard) => compose(
    createArrayFromValue,
    addTo(otherPlayerBoard[0]),
    numberOfPiecesTaken(currentPlayerBoard)
)(otherPlayerBoard);

// Int -> [a] -> [a]
// Removes a piece from the board, and adds it back to the starting tile.
export const takePieceAndPutBack = curry((turn, board) => {
    const currentBoard = getCurrentPlayerBoard(turn, board);
    const otherBoard = getOtherPlayerBoard(turn, board);

    return compose(
        flippedMergeBoards(turn, currentBoard),
        concat(addTakenPieceToStartTile(currentBoard, otherBoard)),
        drop(1),
        takePiece(currentBoard)
    )(otherBoard);
});

// [a] -> [a] -> [a] -> Int -> [a] -> [a]
export const move = curry((moveFromVector, moveToVector, availableMoves, turn, board) => {
    if(canMove(moveFromVector, availableMoves)) {
        const currentPlayerBoard = getCurrentPlayerBoard(turn, board);
        const otherPlayerBoard = getOtherPlayerBoard(turn, board);

        return compose(
            mergeBoards(turn, otherPlayerBoard),
            addPiecesToBoard(moveToVector),
            removePiecesFromBoard(currentPlayerBoard),
        )(moveFromVector);
    } else {
        return board;
    }
});

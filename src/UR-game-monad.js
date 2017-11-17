import {drop, take, compose, curry} from 'ramda';
import {nextTurn} from './turn-monad';
import {takePieceAndPutBack, move} from './action-monad';
import {getCurrentPlayerBoard, getOtherPlayerBoard, startingBoard, getMoveToVector, getAvailableMoves, sumUpBoard, addPiecesToBoard, emptyBoard} from './board-monad';

// Our only shared states!
let currentAvailableMoves = [];
let gameOver = false;

export const playATurn = (boardPreMove, diceThrow, moveFromVector, turn) => {
    const currentPlayerPreMove = getCurrentPlayerBoard(turn, boardPreMove);
    const otherPlayerPreMove = getOtherPlayerBoard(turn, boardPreMove);
    const moveToVector = getMoveToVector(moveFromVector, diceThrow);
    const availableMoves = getAvailableMoves(currentPlayerPreMove, otherPlayerPreMove, diceThrow);

    const boardAfterTurn = compose(
        takePieceAndPutBack(turn),
        move(moveFromVector, moveToVector, availableMoves, turn)
    )(boardPreMove);

    return boardAfterTurn;
};

function* play(board, turn) {
    const diceThrow = yield;

    const currentPlayerPreMove = getCurrentPlayerBoard(turn, board);
    const otherPlayerPreMove = getOtherPlayerBoard(turn, board);
    currentAvailableMoves = getAvailableMoves(currentPlayerPreMove, otherPlayerPreMove, diceThrow);
    console.log('Avaliable moves', currentAvailableMoves);
    const move = yield;
    // Play the turn
    const boardAfterTurn = playATurn(board, diceThrow, move, turn);

    const currentPlayerAfterMove = getCurrentPlayerBoard(turn, boardAfterTurn);
    const nextPlayerToMove = nextTurn(turn, currentPlayerPreMove, currentPlayerAfterMove);

    printState(boardAfterTurn, diceThrow, move, turn);

    if(nextPlayerToMove === 0) {
        gameOver = true;
        console.log(`Player ${turn} has won!`);
        return;
    } else {
        yield* play(boardAfterTurn, nextPlayerToMove);
    }
}

const printState = (gameState, diceThrow, move, turn) => {
    console.log('Player ', turn);
    console.log('Moving', diceThrow, move);
    console.log(take(gameState.length / 2, gameState));
    console.log(drop(gameState.length / 2, gameState));
    console.log('---------------------------------');
};

const throwDice = () => Math.round(Math.random()) + Math.round(Math.random()) + Math.round(Math.random()) + Math.round(Math.random());

// Temporary and not very nice function to just pick a move from available ones. For testing purposes.
const pickAMove = (availableMoves) => {
    if(sumUpBoard(availableMoves) === 0) {
        return availableMoves;
    } else {
        let hasPicked = false;
        return take(15, availableMoves.map((moveCell) => {
            if(hasPicked) {
                return 0;
            } else if(moveCell > 0) {
                hasPicked = true;
                return 1;
            } else {
                return moveCell;
            }
            return hasPicked && moveCell > 0 ? 0 : moveCell;
        }));
    }
};

const playAGame = play(startingBoard().concat(startingBoard()), 1);
playAGame.next();

// Temporary gameloop for testing
while(!gameOver) {
    playAGame.next(throwDice());
    playAGame.next(addPiecesToBoard(emptyBoard(), pickAMove(currentAvailableMoves)));
}

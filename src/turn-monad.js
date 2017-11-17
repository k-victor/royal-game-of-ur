import {compose} from 'ramda';
import {sumUpBoard, maskWithFlowers, multiplyWithArray, boardIsEmpty} from './board-monad';
import {inverse} from './utils';

export const player1 = () => 1;
export const player2 = () => 2;
export const isPlayer1Turn = (turn) => turn === player1();

export const getNextTurn = (turn, currentPlayerBoardAfterMove) => {
    if(playerHasWon(currentPlayerBoardAfterMove)) {
        return 0;
    } else {
        return isPlayer1Turn(turn) ? player2() : player1();
    }
};

export const playerHasWon = (playerBoard) => boardIsEmpty(playerBoard);

// Int -> [a] -> [a] -> Int
// Checks if the player moved to a flower tile by masking the board after move with the flowers, and multiplying that with the inverse of the board before the move.
// If the remaining array has a 1 in it, it means the player moved to a flower and should play again.
// Otherwise, return other player's turn.
export const nextTurn = (turn, currentPlayerBoardBeforeMove, currentPlayerBoardAfterMove) => (compose(
    sumUpBoard,
    multiplyWithArray(maskWithFlowers(currentPlayerBoardAfterMove)),
    inverse
)(currentPlayerBoardBeforeMove) > 0 ? turn : getNextTurn(turn, currentPlayerBoardAfterMove));

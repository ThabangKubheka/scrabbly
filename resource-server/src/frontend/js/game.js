import {
  getSquares,
  getTiles,
  getGame,
  postGame,
  putMove,
} from './helpers/gameInterface.js';

//constants
const BOARD_SIZE = 15;
const RACK_SIZE = 7;
const SQUARES = await getSquares();
const TILES = await getTiles();
const urlParams = new URLSearchParams(window.location.search);

//DOM elements
const board = document.querySelector('.board');
const confirmButton = document.getElementById('confirm-word');
const clearButton = document.getElementById('clear-button');
const playerOneScoreLabel = document.getElementById('player-one-score');
const playerTwoScoreLabel = document.getElementById('player-two-score');
const playerOneRack = document.querySelector('.rack-row.player-one');
const playerTwoRack = document.querySelector('.rack-row.player-two');

const placingBoardCells = [];
const placingRackCells = [];
const placingTiles = [];
const playerOneRackCells = [];
const playerOneRackTiles = [];
const playerTwoRackCells = [];
const playerTwoRackTiles = [];

//state trackers
let turnCounter = 1;
let playerOneTurn = true;
let numTilesRemaining = 100;
let selectedRackCellIndex = -1;
let scores = [0, 0];
let gameID = urlParams.get('id');

//event listeners
confirmButton.addEventListener('click', () => {

  const score = calculateWordScore();
  if (playerOneTurn) {
    scores[0] += score;
    playerOneScoreLabel.innerText = `Score: ${scores[0]} points`;
  } else {
    scores[1] += score;
    playerTwoScoreLabel.innerText = `Score: ${scores[1]} points`;
  }

  const placedTiles = [];

  for (const index in placingBoardCells) {
    placedTiles.push({
      letter: placingBoardCells[index].cell.lastChild.innerText,
      location: placingBoardCells[index].index,
      playerOne: playerOneTurn,
    })

    placingBoardCells[index].cell.classList.remove('placing');
    placingTiles[index].classList.remove('placing');
    placingRackCells[index].classList.remove('inactive');
    placingTiles[index].innerText = getRandomTile();
  }

  if (selectedRackCellIndex !== -1) {
    playerOneTurn ? playerOneRackCells[selectedRackCellIndex].classList.remove('selected') : playerTwoRackCells[selectedRackCellIndex].classList.remove('selected');
  }

  //TODO: make sure correct GAME_ID if new game
  putMove(gameID, turnCounter, score, placedTiles);

  placingBoardCells.length = 0;
  placingRackCells.length = 0;
  placingTiles.length = 0;
  playerOneTurn = !playerOneTurn;
  turnCounter += 1;
});

clearButton.addEventListener('click', () => {

  for (const index in placingBoardCells) {
    placingBoardCells[index].cell.classList.remove('placing', 'player-one', 'player-two');
    placingBoardCells[index].cell.removeChild(placingBoardCells[index].cell.lastChild);

    placingTiles[index].classList.remove('placing');
    placingRackCells[index].classList.remove('inactive');
  }

  placingBoardCells.length = 0;
  placingRackCells.length = 0;
  placingTiles.length = 0;
});

//helper functions
const calculateTileScore = (letter, multiplier) => {
  for (const tile of TILES) {
    if (tile.letter.toUpperCase() === letter) {
      if (multiplier === '2L') {
        return tile.points * 2;
      }
      if (multiplier === '3L') {
        return tile.points * 3;
      }
      return tile.points;
    }
  }
  return 0;
};

const calculateWordScore = () => {
  let score = 0;
  let multiplier = 1;
  for (const index in placingBoardCells) {
    let cellType = '';
    for (const child of placingBoardCells[index].cell.children) {

      if (child.classList.contains('type-label')) {

        if (child.innerText === '2W') {
          multiplier = 2;
        } else if (child.innerText === '3W') {
          multiplier = 3;
        }
        cellType = child.innerText;

      } else if (child.classList.contains('tile-label')) {

        score += calculateTileScore(child.innerText, cellType);

      }
    }
  }
  return score * multiplier;
};

const formatType = (type) => {
  switch (type) {
    case '2L':
      return 'double-letter';
    case '3L':
      return 'triple-letter';
    case '2W':
      return 'double-word';
    case '3W':
      return 'triple-word';
    default:
      return 'normal';
  }
};

const removeTileFromRack = (index) => {
  if (playerOneTurn) {
    playerOneRackCells[index].classList.remove('selected');
    playerOneRackCells[index].classList.add('inactive');
    playerOneRackTiles[index].classList.add('placing');
    placingTiles.push(playerOneRackTiles[index]);
    placingRackCells.push(playerOneRackCells[index]);

  } else {
    playerTwoRackCells[index].classList.remove('selected');
    playerTwoRackCells[index].classList.add('inactive');
    playerTwoRackTiles[index].classList.add('placing');
    placingTiles.push(playerTwoRackTiles[index]);
    placingRackCells.push(playerTwoRackCells[index]);
  }
};

const moveTileToBoard = (td, index) => {
  if (selectedRackCellIndex === -1) {
    return;
  }
  const tile = document.createElement('p');
  tile.classList.add('tile-label', playerOneTurn ? 'player-one' : 'player-two');
  tile.innerText = playerOneTurn ? playerOneRackTiles[selectedRackCellIndex].innerText : playerTwoRackTiles[selectedRackCellIndex].innerText;
  td.appendChild(tile);
  td.classList.add('placing', playerOneTurn ? 'player-one' : 'player-two');
  placingBoardCells.push({
    index,
    cell: td,
  });

  removeTileFromRack(selectedRackCellIndex);
  selectedRackCellIndex = -1;
};

const getRandomTile = () => {
  if (numTilesRemaining === 0) {
    return '';
  }

  let tileNumber = Math.floor(Math.random() * numTilesRemaining) + 1;

  for (const index in TILES) {

    if (tileNumber <= TILES[index].amount) {
      numTilesRemaining--;
      TILES[index] = {
        ...TILES[index],
        amount: TILES[index].amount - 1,
      };
      return (TILES[index].letter).toUpperCase();
    }
    tileNumber -= TILES[index].amount;
  }

  return '';
};

const selectRackCell = (index, playerOne) => {

  if (playerOne !== playerOneTurn) {
    return;
  }

  if (selectedRackCellIndex !== -1) {
    playerOneTurn ? playerOneRackCells[selectedRackCellIndex].classList.remove('selected') : playerTwoRackCells[selectedRackCellIndex].classList.remove('selected');
  }

  if (playerOneTurn ? playerOneRackCells[index].classList.contains('inactive') : playerTwoRackCells[index].classList.contains('inactive')) {
    return;
  }

  playerOneTurn ? playerOneRackCells[index].classList.add('selected') : playerTwoRackCells[index].classList.add('selected');

  selectedRackCellIndex = index;
};

const fillRack = (index, playerOne) => {
  const rackCell = document.createElement('td');
  const rackTile = document.createElement('p');

  rackTile.classList.add('tile-label', `player-${playerOne ? 'one' : 'two'}`);
  rackTile.innerText = getRandomTile();
  rackCell.appendChild(rackTile);
  rackCell.classList.add(`player-${playerOne ? 'one' : 'two'}`);
  rackCell.addEventListener('click', () => selectRackCell(index, playerOne));

  playerOne ? playerOneRack.appendChild(rackCell) : playerTwoRack.appendChild(rackCell);

  playerOne ? playerOneRackCells.push(rackCell) : playerTwoRackCells.push(rackCell);
  playerOne ? playerOneRackTiles.push(rackTile) : playerTwoRackTiles.push(rackTile);
};

const initBoard = () => {
  for (let row = 0; row < BOARD_SIZE; row++) {

    const boardRow = document.createElement('tr');
    boardRow.classList.add('board-row');

    for (let col = 0; col < BOARD_SIZE; col++) {

      const type = SQUARES[row * BOARD_SIZE + col].multiplier;
      const boardCell = document.createElement('td');

      if (type !== 'N') {
        const typeLabel = document.createElement('p');
        typeLabel.classList.add('type-label');
        typeLabel.innerText = type;
        boardCell.appendChild(typeLabel);
      }

      boardCell.classList.add('board-cell', formatType(type));
      boardCell.addEventListener('click', () => moveTileToBoard(boardCell, row * BOARD_SIZE + col));
      boardRow.appendChild(boardCell);
    }
    board.appendChild(boardRow);
  }
};

const initRacks = () => {
  for (let tile = 0; tile < RACK_SIZE; tile++) {
    fillRack(tile, true);
    fillRack(tile, false);
  }
};

//set up game
if (!!gameID) {

  //load game

  //TODO: getGame

  initBoard();
  initRacks();
} else {

  //create new game

  initBoard();
  initRacks();

  const newGame = await postGame();
  //TODO: update gameID
}

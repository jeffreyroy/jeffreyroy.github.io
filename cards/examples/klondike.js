// Generate new game
game = new Game();

// Variable to hold group of cards being moved
game.activeGroup = [];
game.activeCell = null;


// Functions for moving cards

Deck.prototype.deal = function(tableau) {
  var cellList = tableau.cellList();
  var cardList = this.list;
  // Deal cards onto tableau
  for(var column = 0; column < 7; column++) {
    for(var row = 0; row <= column; row++) {
      var cell = tableau.cellByCoordinates(column, row);
      var card = this.getNextCard();
      // Deal bottom card face up
      if(row == column) {
        addDraggableCard(cell, card);
      }
      // Deal other cards face down
      else {
        var hidden = new HiddenCard(card);
        addClickableCard(cell, hidden);
      }
    }
  }
  // Put next card onto top of draw pile
  refreshDrawPile();
}

// Check for win
won = function() {
  return drawPile.empty() && discardPile.empty() && gameBoard.empty();
}

// Returns card image obstructing (i.e. immediately covering)
// a specified card image on the board
obstructor = function(cardImage) {
  var lowerCell = gameBoard.cellBelow(cardImage.parentElement);
  return lowerCell.firstChild;
}

// Check whether card is obstructed (i.e. is under another card)
obstructed = function(cardImage) {
  return obstructor(cardImage) != null;
}

predecessor = function(card) {
  suit = card.suit;
  // console.log(card.rank.number);
  rankNumber = card.rank.number - 1;
  return fullDeck.findCard(suit, rankNumber)
}

playableOn = function(card, targetCard) {
  return ( targetCard != null && card.suit.color() != targetCard.suit.color() 
    && card.rank.number == targetCard.rank.number - 1);
}

// // Recursive function to check whether card is part of sequence
// inSequence(cardImage) {
//   // Base case:  Card is at bottom of column
//   var nextCardImage = obstructor(cardImage);
//   if(nextCardImage == null) { return true; }

//   // Recursive case:  Card is obstructed
//   // Check to see whether obstruction is in sequence
//   else {
//     var card = fullDeck.findCardById(cardImage.id);
//     var nextCard = fullDeck.findCardById(nextCardImage.id);
//     // If next card is in sequence, recur
//     if(playableOn(nextCard, card)) { return inSequence(nextCard); }
//     // Otherwise, return false
//     else { return false; }
//   }
// }


// Find color of suit
Suit.prototype.color = function() {
  switch(this.name) {
    case "spade":
    case "club":
      return "black";
    case "heart":
    case "diamond":
      return "red";
  }
}

// Adds next card in deck to top of draw pile
refreshDrawPile = function() {
  clearCell(drawCell);
  var card = deck.getNextCard();
  drawPileCard = card;
  if(card) {
    var hidden = new HiddenCard(card);
    addClickableCard(drawCell, hidden);
  }
}

// Move card from draw pile to discard pile
drawNextCard = function(cardImage) {
  var card = drawPileCard;
  // Add card to discard pile
  discardList.push(card);
  // Add card to discard tableau
  clearCell(discardCell);
  addDraggableCard(discardCell, card);
  // Put next card on top of draw pile
  refreshDrawPile();
}

// Turn over facedown card at bottom of column
turnOver = function(cardImage) {
  var card = fullDeck.findCardById(cardImage.id);
  var cell = cardImage.parentElement;
  clearCell(cell);
  addDraggableCard(cell, card);
}

// Get cards below specified card
getGroup = function(cardImage) {
  var currentCard = cardImage;
  var group = [];
  while(obstructed(currentCard)) {
    var nextCard = obstructor(currentCard);
    group.push(nextCard);
    currentCard = nextCard;
  }
  return group;
}

// This is run when user clicks a face down card
game.click = function(event) {
  var card = event.target;
  // If on draw pile, turn face up and put in discard pile
  if(drawPile.contains(card)) {
    drawNextCard(card);
  }
  // If at bottom of column in tableau, turn it over
  else if(gameBoard.contains(card) && !obstructed(card)) {
    turnOver(card);
  }
  else {
    alert("That card can't be moved yet. ");
  }
};

// This is run when user drags a card
game.dragstart = function(event) {
  card = event.target;
  // Check to make sure card can be moved
  if(foundation.contains(card)) {
    alert("That card can't move.");
  }
  else {
    // Set active card and store data
    game.activeCard = this;
    event.dataTransfer.setData("text", event.target.id);
      game.activeCell = card.parentElement;
    // Get type of move (single card or stack)
    // if(gameBoard.contains(card)
      // && (obstructed(card))) {
    // }
    // else {
      // game.activeGroup = [];
    // }
  }
};

// Find valid target cells for a card
validTarget = function(card, destination) {
  // Ace on empty foundation
  if(destination == foundation.firstEmptyCell()
    && card.rank.number == 1) { return true; }
  // Top of empty column
  if(destination == gameBoard.firstEmptyCell()) { return true; }
  // On foundation, counting upward
  if(foundation.contains(destination)
    && destination.tagName == "IMG") {
      targetCard = fullDeck.findCardById(destination.id);
      if(targetCard == predecessor(card)) { return true; }
  }
  // Below card on board, counting downward
  if(gameBoard.contains(destination)
    && destination.tagName == "IMG"
    && !obstructed(destination)) {
      targetCard = fullDeck.findCardById(destination.id);
      if(playableOn(card, targetCard)) { return true; }
  }  
  return false;
}

// This is run when user drags a card over a tableau
game.dragover = function(event) {
  if(validTarget(game.activeCard, event.target)) {
    event.preventDefault();
  }
};

// This is run when user tries to drop a card
game.drop = function(event) {
  var cell = event.target;
  // If building onto card on foundation, remove existing card
  if(foundation.contains(cell) && cell.tagName == "IMG") {
    cell = cell.parentElement;
    // cell.removeChild(cell.firstChild);
    clearCell(cell);
  }
  // If cell is an image on the board, place card below it
  if(gameBoard.contains(cell) && cell.tagName == "IMG") {
    cell = gameBoard.cellBelow(cell.parentElement);
  }
  // Put card in new location
  var data = event.dataTransfer.getData("text");
  cell.appendChild(document.getElementById(data));
  // If moving stack, move remainder of stack
  // Note: This seems extremely inelegant.
  // Can cells be selected and moved as a group
  // using drag and drop?  I haven't found a way
  if(gameBoard.contains(cell)
    && gameBoard.contains(game.activeCell)) {
    var startCell = gameBoard.cellBelow(game.activeCell);
    var destCell = gameBoard.cellBelow(cell);
    while(!cellEmpty(startCell)) {
      moveCard(startCell.firstChild, destCell);
      startCell = gameBoard.cellBelow(startCell);
      destCell = gameBoard.cellBelow(destCell);
    }
  }

  // If moving from discard pile, replace with next card
  var l = discardList.length;
  if(l > 0 && discardList[l - 1] == game.activeCard) {
    discardList.pop();
    if(l > 1) {
      nextCard = discardList[l - 2]
      addDraggableCard(discardPile.firstCell(), nextCard);
    }
  }
  if(won()) { alert("You win!!"); };
};

// Card data for standard 52 card deck
const SUITS = ["spade", "heart", "diamond", "club"];
const RANKS = ["ace", "2", "3", "4", "5", "6", "7", "8",
                "9", "ten", "jack", "queen", "king"];

// Generate new deck
// Full deck for card lookup
fullDeck = Deck.generate(SUITS, RANKS);

// Current deck for use in game
// Need to use slice to return a new copy of array
deck = new Deck(fullDeck.list.slice());

// Add tableaux to DOM
gameBoard = Tableau.generate("board", 0, 100, 7, 20, 60, 20);
drawPile = Tableau.generate("drawpile", 0, 0, 1, 1, 60, 80);
discardPile = Tableau.generate("discardpile", 63, 0, 1, 1, 60, 80);
foundation = Tableau.generate("foundation", 189, 0, 4, 1, 60, 80);

// Initialize draw and discard piles
var drawCell = drawPile.firstCell();
var discardCell = discardPile.firstCell();
var drawPileCard = null;
var discardList = [];

// Start the game!
deck.shuffle();
deck.deal(gameBoard);


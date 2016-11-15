// Generate new game
game = new Game();

// type = "baker" for Baker's Game or "freecell" for FreeCell
var type = "baker";

// Functions for moving cards

// Check for win
won = function() {
  return freeCells.empty() && gameBoard.empty();
}

// Check whether card is obstructed (i.e. is under another card)
obstructed = function(cardImage) {
  lowerCell = gameBoard.cellBelow(cardImage.parentElement);
  // console.log(lowerCell);
  return !cellEmpty(lowerCell);
}

predecessor = function(card) {
  suit = card.suit;
  // console.log(card.rank.number);
  rankNumber = card.rank.number - 1;
  return deck.findCard(suit, rankNumber)
}

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

playableOn = function(card, targetCard) {
  // Baker's Game
  if(type == "baker") {
    return card == predecessor(targetCard);
  }
  // Freecell
  else {
    return ( card.suit.color() != targetCard.suit.color() 
      && card.rank.number == targetCard.rank.number - 1);
  }
}

// This is run when user drags a card
game.dragstart = function(event) {
  card = event.target;
  // Check to make sure card can be moved
  if(gameBoard.contains(card)
    && (obstructed(card))) {
    alert("That card can't move.");
  }
  if(foundation.contains(card)) {
    alert("That card can't move.");
  }
  else {
    // If movable, set active card and store data
    game.activeCard = this;
    event.dataTransfer.setData("text", event.target.id);
  }
};

// Find valid target cells for a card
validTarget = function(card, destination) {
  // First empty freecell
  if(destination == freeCells.firstEmptyCell()) { return true; }
  // Ace on empty foundation
  if(destination == foundation.firstEmptyCell()
    && card.rank.number == 1) { return true; }
  // Top of empty column
  if(destination == gameBoard.firstEmptyCell()) { return true; }
  // On foundation, counting upward
  if(foundation.contains(destination)
    && destination.tagName == "IMG") {
      targetCard = deck.findCardById(destination.id);
      if(targetCard == predecessor(card)) { return true; }
  }
  // Below card on board, counting downward
  if(gameBoard.contains(destination)
    && destination.tagName == "IMG"
    && !obstructed(destination)) {
      targetCard = deck.findCardById(destination.id);
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
  if(won()) { alert("You win!!"); };
};

// Deal deck into tableau
Deck.prototype.deal = function(tableau) {
  // console.log(game);
  // Get list of cells from tableau
  var cellList = tableau.cellList();
  var cardList = this.list;
  // Warning if cards don't fit into tableau
  if(cardList.length > cellList.length) {
    alert("Too many cards for tableau " + tableau.name);
  }
  // Deal cards onto tableau
  for(var i in cardList) {
    addDraggableCard(cellList[i], cardList[i]);
  }
}




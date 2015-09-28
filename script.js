
var game = new Phaser.Game(700, 700, Phaser.AUTO, '', {preload: preload,
                                              create: create, update: update});

var towerGroup;

var diceRoll;

var selectedTower = null;

var jail = {"#ffffff": {checkers: 0}, "#FF0000": {checkers: 0}};

var currentPlayer = "#ffffff";
var actionsTaken = 0;

var player1 = "#ffffff";

var player2 = "#FF0000";

// I feel mad sneaky about this
var remainingCheckers = {"#ffffff": 0, "#FF0000": 0}

function actionTaken() {
      // Record an action taken, switch players if currentPlayer has taken 2 actions
      actionsTaken++;
      if(actionsTaken >= 2) {
        currentPlayer = (currentPlayer == player2) ? player1 : player2;
        actionsTaken = 0;
      }
}

function addChecker(sprite){
  sprite.checkers += 1;
  sprite.text.setText(sprite.checkers);
}

function removeChecker(sprite){
  if(sprite.checkers == 0){
    return;
  }
  sprite.checkers -= 1;
  sprite.text.setText(sprite.checkers);
}

function selectTower(sprite, pointer) {
      // Move checkers from one tower to another
      if(selectedTower != null){
        if(sprite.text.fill == selectedTower.text.fill){
            addChecker(sprite);
            sprite.text.fill = selectedTower.text.fill;
            removeChecker(selectedTower);
            selectedTower = null;
            actionTaken();
          }
        // Capture checkers
        else if(sprite.checkers <= 1) {
          removeChecker(sprite);
          addChecker(sprite);
          jail[sprite.text.fill].checkers += 1;
          console.log(jail);
          sprite.text.fill = currentPlayer;
          removeChecker(selectedTower);
          selectedTower = null;
          actionTaken();
        }
      }
      // If player has jailed checkers
      else if(jail[currentPlayer].checkers > 0){
        if(sprite.text.fill == currentPlayer){
            addChecker(sprite);
            jail[currentPlayer].checkers -= 1;
            actionTaken();
          }
        // Capture checkers
        else if(sprite.checkers <= 1) {
          removeChecker(sprite);
          addChecker(sprite);
          jail[sprite.text.fill].checkers += 1;
          jail[currentPlayer].checkers -= 1;
          console.log(jail);
          sprite.text.fill = currentPlayer;
          actionTaken();
        }
      }
      // Select a tower if it has checkers
      else if(sprite.checkers > 0){
        // If attempting to bear off your troops
        if((towerGroup.children[0] == sprite && currentPlayer == player1) ||
              towerGroup.children[towerGroup.children.length - 1] == sprite && currentPlayer == player2)
        {
            //removeChecker(sprite);
            bearOff(sprite);
            actionTaken();
        }
        else if(sprite.text.fill == currentPlayer){
        selectedTower = sprite;
        }
      }
}

function bearOff(sprite){
    removeChecker(sprite);
    remainingCheckers[currentPlayer] -= 1;
    if(remainingCheckers[currentPlayer] == 0)
    {
      currentPlayer == player1 ? game.state.start('p1Wins') : game.state.start('p2Wins');
    }
}

function preload() {
  game.load.image('wallTexture', 'wallTexture.png');
}

function create() {
  towerGroup = game.add.group();

  for(var i = 0; i < 600; i += 130)
  {
    var tower = towerGroup.create(i + 50, 350, 'wallTexture');
    tower.checkers = Math.round(Math.random() * 5);
    tower.inputEnabled = true;
    tower.events.onInputDown.add(selectTower, this);
  }
  for(var i = 0; i < towerGroup.children.length; i++){
    var tower = towerGroup.children[i];
    if(i < towerGroup.children.length / 2){
    tower.text = game.add.text(tower.x + 50, 330, "",
                        { font: "20px Arial", fill: player1, align: "center" });
    remainingCheckers["#ffffff"] += tower.checkers;
    }
    else {
      tower.text = game.add.text(tower.x + 50, 330, "",
                          { font: "20px Arial", fill: player2, align: "center" });
      remainingCheckers["#FF0000"] += tower.checkers;
    }
    tower.text.anchor.setTo(0.5, 0.5);
    tower.text.setText(tower.checkers);
  }
}

function update() {

}

game.state.add('p1Wins', {
      preload: function() {},
      create: function (){
              game.add.text(400, 300, 'Player 1 Wins', { fontSize: '32px', fill: '#FFF' });
              player1.rounds += 1;
              if(player1.rounds < 2){
              game.time.events.add(Phaser.Timer.SECOND * 2, function() {game.state.start('fight')}, this);
              }
            },
      update: function() {}
    });
game.state.add('p2Wins', {
  preload: function() {},
  create: function (){
          game.add.text(400, 300, 'Player 2 Wins', { fontSize: '32px', fill: '#FFF' });
          player2.rounds += 1;
          if(player2.rounds < 2) {
                game.time.events.add(Phaser.Timer.SECOND * 2, function() { game.state.start('fight')}, this);
          }
        },
  update: function() {}
});

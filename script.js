
var game = new Phaser.Game(700, 700, Phaser.AUTO, '', {preload: preload,
                                              create: create, update: update});

var towerGroup;

var diceRoll;

var selectedTower = null;

var currentPlayer = "#ffffff";
var actionsTaken = 0;

var player1 = "#ffffff";

var player2 = "#FF0000";

function selectTower(sprite, pointer) {
      // Move checkers from one tower to another
      if(selectedTower != null && (sprite.checkers <= 1 || sprite.text.fill == selectedTower.text.fill)){
        sprite.checkers += 1;
        selectedTower.checkers -= 1;
        sprite.text.fill = selectedTower.text.fill;
        sprite.text.setText(sprite.checkers);
        selectedTower.text.setText(selectedTower.checkers);
        selectedTower = null;
        // Record an action taken, switch players if currentPlayer has taken 2 actions
        actionsTaken++;
        if(actionsTaken >= 2) {
          currentPlayer = (currentPlayer == player2) ? player1 : player2;
          console.log(currentPlayer);
          actionsTaken = 0;
        }
      }
      // Select a tower if it has checkers
      else if(sprite.checkers > 0){
        // If attempting to bear off your troops
        if((towerGroup.children[0] == sprite && currentPlayer == player1) ||
              towerGroup.children[towerGroup.children.length - 1] == sprite && currentPlayer == player2)
        {
            sprite.checkers -=1;
            sprite.text.setText(sprite.checkers);
            actionsTaken++;
            if(actionsTaken >= 2) {
              currentPlayer = (currentPlayer == player2) ? player1 : player2;
              actionsTaken = 0;
            }
        }
        else if(sprite.text.fill == currentPlayer){
        selectedTower = sprite;
        }
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
    }
    else {
      tower.text = game.add.text(tower.x + 50, 330, "",
                          { font: "20px Arial", fill: player2, align: "center" });
    }
    tower.text.anchor.setTo(0.5, 0.5);
    tower.text.setText(tower.checkers);
  }
}

function update() {

}

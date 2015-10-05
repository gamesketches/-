
var game = new Phaser.Game(800, 500, Phaser.AUTO, '', {preload: preload,
                                              create: create, update: update});

var towerGroup, soldierGroup;

var diceRoll;

var selectedTower = null;

var jail = {"#ffffff": {checkers: 0}, "#FF0000": {checkers: 0}};

var currentPlayer = "#ffffff";
var actionsTaken = 0;

// Remove this later
var cursors;

var player1 = "#ffffff";

var player2 = "#FF0000";

var wrongSound;

var grassTiles = [];

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
  drawFlags(sprite);
}

function removeChecker(sprite){
  if(sprite.checkers == 0){
    return;
  }
  sprite.checkers -= 1;
  sprite.text.setText(sprite.checkers);
  drawFlags(sprite);
}

function selectTower(sprite, pointer) {
      // Move checkers from one tower to another
      if(selectedTower != null){
        if(sprite.text.fill == selectedTower.text.fill){
            addChecker(sprite);
            sprite.text.fill = selectedTower.text.fill;
            removeChecker(selectedTower);
            moveTroop(selectedTower, sprite);
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
              towerGroup.children[towerGroup.children.length - 1] == sprite && currentPlayer == player2){
            bearOff(sprite);
            actionTaken();
        }
        else if(sprite.text.fill == currentPlayer){
        selectedTower = sprite;
        }
        else {
          wrongSound.play();
        }
      }
    else {
      wrongSound.play();
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

function moveTroop(startTower, targetTower) {
  var soldier = soldierGroup.create(startTower.x,
    startTower.y, 'soldier');
  soldier.targetX = targetTower.x;
  soldier.body.velocity.x = (targetTower.x - startTower.x) / 2;
}

function makeGrass() {
  var ground = game.add.bitmapData(2000, 32);
  ground.addToWorld(0, game.world.height - 32);

  grassTiles[0] = new Phaser.Rectangle(0, 0, 32, 32);
  grassTiles[1] = new Phaser.Rectangle(32, 0, 32, 32);
  grassTiles[2] = new Phaser.Rectangle(0, 32, 32, 32);
  grassTiles[3] = new Phaser.Rectangle(32, 32, 32, 32);
  for(var i = 0; i < 2000; i += 32){
    var grassNum = Math.floor(Math.random() * 3);
    ground.copyRect('grass', grassTiles[grassNum], i, 0);
  }
}

function drawFlags(tower) {
  if(tower.flagMap) {
    tower.flagMap.cls();
    tower.flagMap.update();
    }
  tower.flagMap = game.add.bitmapData(16, tower.checkers * 16);
  tower.flagMap.addToWorld(tower.x + (tower.width / 2), tower.y - (tower.checkers * 16));
  area = new Phaser.Rectangle(0, 0, 16, 16);
  flagImage = (tower.text.fill == player1) ? 'whiteFlag' : 'redFlag';
  for(var i = 0; i < tower.checkers; i++){
    tower.flagMap.copyRect(flagImage, area, 0, i * 16);
  }

}

function preload() {
  game.load.image('wallTexture', 'wallTexture.png');
  game.load.image('soldier', 'soldier.png');

  game.load.audio('wrong', 'wrong.wav');

  game.load.image('grass', 'grassTiles.png');
  game.load.image('redFlag', 'redFlag.png');
  game.load.image('whiteFlag', 'whiteFlag.png');
}

function create() {
  game.stage.backgroundColor = '#00CCFF';

  makeGrass();

  towerGroup = game.add.group();

  for(var i = 0; i < 600; i += 150)
  {
    var tower = towerGroup.create(i + 50, game.world.height - 95, 'wallTexture');
    tower.checkers = 5;
    tower.inputEnabled = true;
    tower.events.onInputDown.add(selectTower, this);
    tower.flagMap = null;
  }
  for(var i = 0; i < towerGroup.children.length; i++){
    var tower = towerGroup.children[i];
    if(i % 2){
    tower.text = game.add.text(tower.x + 50, tower.y - 40, "",
                        { font: "20px Arial", fill: player1, align: "center" });
    remainingCheckers[player1] += tower.checkers;
    }
    else {
      tower.text = game.add.text(tower.x + 50, tower.y - 40, "",
                          { font: "20px Arial", fill: player2, align: "center" });
      remainingCheckers[player2] += tower.checkers;
    }
    tower.text.anchor.setTo(0.5, 0.5);
    tower.text.setText(tower.checkers);
    drawFlags(tower);
  }

  soldierGroup = game.add.group();
  soldierGroup.enableBody = true;

  cursors = game.input.keyboard.createCursorKeys();

  game.world.setBounds(0, 0, 2000, 2000);

  wrongSound = game.add.audio('wrong');

}

function update() {
  for(var i = 0; i < soldierGroup.children.length; i++){
    var soldier = soldierGroup.children[i];
    if((soldier.body.velocity.x > 0 && soldier.targetX < soldier.body.x) ||
      (soldier.body.velocity.x < 0 && soldier.targetX > soldier.body.x)) {
      soldier.destroy();
    }
  }

  if(cursors.right.isDown) {
    game.camera.x += 4;
  }
  else if(cursors.left.isDown) {
    game.camera.x -= 4;
  }
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

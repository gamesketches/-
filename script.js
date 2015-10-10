
var game = new Phaser.Game(800, 500, Phaser.AUTO, '', {preload: preload,
                                              create: create, update: update});

var towerGroup, soldierGroup;

var diceRoll;

var selectedTower = null;
var cursorPos = 1;

var jail = {"#ffffff": {checkers: 0}, "#FF0000": {checkers: 0}};

var currentPlayer = "#ffffff";
var actionsTaken = 0;

// Remove this later
var cursors;

var player1 = "#ffffff";

var player2 = "#FF0000";

var flavorText, turnNumber;

var sideBar, speechBubble;

var wrongSound;

// I feel mad sneaky about this
var remainingCheckers = {"#ffffff": 0, "#FF0000": 0}

function actionTaken() {
      // Record an action taken, switch players if currentPlayer has taken 2 actions
      actionsTaken++;
      toggleIcons(false);
      if(actionsTaken >= 2) {
        actionsTaken = 0;
        turnNumber += 1;
        if(currentPlayer == player2){
          currentPlayer = player1;
          flavorText.setText("Day " + turnNumber + ", White moves out");
          cursorPos = 1;
        }
        else {
          currentPlayer = player2;
          flavorText.setText("Day " + turnNumber + ", Red moves out");
          cursorPos = 0;
        }
        towerGroup.forEach(function(child){
          checkers = child.checkers;
          for(var i = 0; i < checkers.length; i++){
            checkers[i] -= 1;
            if(checkers[i] < 0) {
              checkers[i] = 0;
            }
          }
        });
        updateSideBar();
      }

      switchOnPointers();
}

function switchOnPointers() {
    towerGroup.forEach(function(child) {
      child.pointer.visible = false;
    }, this, true);
    towerGroup.children[cursorPos].pointer.visible = true;
}

function toggleIcons(status) {
  towerGroup.forEach(
    function(child) {
      if(child != selectedTower && child.text.fill == currentPlayer) {
        child.icon.loadTexture('addSoldierIcon');
        child.icon.visible = status;
      }
      if(child.text.fill != currentPlayer && child.checkers <= 1) {
        child.icon.loadTexture('conquerIcon');
        child.icon.visible = status;
      }
    },
      this, true);
}

function selectTowerPointer() {
  towerGroup.forEach(
    function(child) {
      if(child != selectedTower) {
        child.pointer.visible = false;
      }
    },
  this, true);

  toggleIcons(true);

}

function addChecker(sprite, hungerVal){
  sprite.checkers.push(hungerVal);
  //sprite.text.setText(sprite.checkers);
  drawFlags(sprite);
}

function removeChecker(sprite){
  if(sprite.checkers.length == 0){
    return;
  }
  sprite.checkers.pop();
  //sprite.text.setText(sprite.checkers);
  drawFlags(sprite);
}

function transferChecker(giver, receiver) {
  receiver.checkers.push(giver.checkers.pop());
}

function selectTower(sprite, pointer) {
      // Move checkers from one tower to another
      if(selectedTower != null){
        if(sprite.text.fill == selectedTower.text.fill){
            //addChecker(sprite);
            transferChecker(selectedTower, sprite);
            sprite.text.fill = selectedTower.text.fill;
            //removeChecker(selectedTower);
            moveTroop(selectedTower, sprite);
            selectedTower = null;
            actionTaken();
          }
      }
      // Select a tower if it has checkers
      else if(sprite.checkers.length > 0){
        // If attempting to bear off your troops
        if((towerGroup.children[0] == sprite && currentPlayer == player1) ||
              towerGroup.children[towerGroup.children.length - 1] == sprite && currentPlayer == player2){
            bearOff(sprite);
            actionTaken();
        }
        else if(sprite.text.fill == currentPlayer){
        selectedTower = sprite;
        updateSideBar();
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
    startTower.y + 64, 'soldier');
  soldier.animations.add('run', null, 15, true);
  soldier.animations.play('run');
  soldier.targetX = targetTower.x;
  soldier.body.velocity.x = (targetTower.x - startTower.x) / 2;
}

function makeGrass() {
  var grassTiles = [];
  var ground = game.add.bitmapData(1600, 32);
  ground.addToWorld(0, game.world.height - 32);

  grassTiles[0] = new Phaser.Rectangle(0, 0, 32, 32);
  grassTiles[1] = new Phaser.Rectangle(32, 0, 32, 32);
  grassTiles[2] = new Phaser.Rectangle(0, 32, 32, 32);
  grassTiles[3] = new Phaser.Rectangle(32, 32, 32, 32);
  for(var i = 0; i < 1600; i += 32){
    var grassNum = Math.floor(Math.random() * 6);
    if(grassNum >= 4)
        grassNum = 3;
    ground.copyRect('grass', grassTiles[grassNum], i, 0);
  }
}

function makeSideBar() {
  sideBar = game.add.bitmapData(200, game.world.height);
  sideBar.addToWorld(game.world.width - 200, 0);

  sideBar.fill(0, 0, 0);

  speechBubble = game.add.sprite(game.world.width - 150, 400, 'speechBubble');
  speechBubble.textContent = game.add.text(speechBubble.x + 10, speechBubble.y + 40, "Select a Tower",
                                              { font: "10px Arial", fill: "black", align: "center" });
  speechBubble.buddy = game.add.sprite(speechBubble.x, speechBubble.y - 10, "standingSoldier");
}

function updateSideBar(){
  if(selectedTower) {
    var area = new Phaser.Rectangle(0, 0, 13, 21);
    for(var i = 0; i < selectedTower.checkers.length; i++){
      sideBar.copyRect('standingSoldier', area, 20, i * 25);
      sideBar.rect(40, i * 25, selectedTower.checkers[i] * 10, 21, "#FF99FF");
    }
  }
  else {
    sideBar.cls();
    sideBar.update();
    sideBar.fill(0, 0, 0);
  }
}

function makeTowers() {
  towerGroup = game.add.group();

  for(var i = 0; i < 600; i += 100)
  {
    var tower = towerGroup.create(i + 20, game.world.height - 95, 'wallTexture');
    tower.checkers = [10, 10, 10, 10, 10];
    console.log(tower.checkers.length);
    tower.inputEnabled = true;
    tower.events.onInputDown.add(selectTower, this);
    tower.flagMap = null;
  }
  for(var i = 0; i < towerGroup.children.length; i++){
    var tower = towerGroup.children[i];
    if(i % 2){
    tower.text = game.add.text(tower.x + 50, tower.y - 40, "",
                        { font: "20px Arial", fill: player1, align: "center" });
    remainingCheckers[player1] += tower.checkers.length;
    }
    else {
      tower.text = game.add.text(tower.x + 50, tower.y - 40, "",
                          { font: "20px Arial", fill: player2, align: "center" });
      remainingCheckers[player2] += tower.checkers.length;
    }
    tower.text.anchor.setTo(0.5, 0.5);
    //tower.text.setText(tower.checkers);
    drawFlags(tower);
  }
}

function drawFlags(tower) {
  if(tower.flagMap) {
    tower.flagMap.cls();
    tower.flagMap.update();
    }
  tower.flagMap = game.add.bitmapData(16, tower.checkers.length * 16);
  tower.flagMap.addToWorld(tower.x + (tower.width / 2), tower.y - (tower.checkers.length * 16));
  area = new Phaser.Rectangle(0, 0, 16, 16);
  flagImage = (tower.text.fill == player1) ? 'whiteFlag' : 'redFlag';
  for(var i = 0; i < tower.checkers.length; i++){
    tower.flagMap.copyRect(flagImage, area, 0, i * 16);
  }

}

function preload() {
  game.load.image('standingSoldier', 'assets/soldier.png');
  game.load.image('speechBubble', 'assets/speechBubble.png');
  game.load.image('wallTexture', 'assets/wallTexture.png');
  game.load.spritesheet('soldier', 'assets/runningSoldier.png', 13, 21);
  game.load.image('addSoldierIcon', 'assets/addSoldierIcon.png');
  game.load.image('conquerIcon', 'assets/conquerIcon.png');

  game.load.audio('wrong', 'assets/wrong.wav');

  game.load.image('grass', 'assets/grassTiles.png');
  game.load.image('redFlag', 'assets/redFlag.png');
  game.load.image('whiteFlag', 'assets/whiteFlag.png');
  game.load.spritesheet('whitePointer', 'assets/whitePointerSheet.png', 32, 64);
  game.load.spritesheet('redPointer', 'assets/redPointerSheet.png', 32, 64);
}

function create() {
  game.stage.backgroundColor = '#00CCFF';

  makeGrass();

  makeTowers();

  towerGroup.forEach(function(child) {
    pointerColor = (child.text.fill == player1) ? 'whitePointer' : 'redPointer';
    child.pointer = game.add.sprite(child.x + 20, child.y - (70 + (child.checkers.length * 16)), pointerColor);
    child.pointer.animations.add('go', null, 15, true);
    child.pointer.animations.play('go');
    child.pointer.visible = false;
    child.icon = game.add.sprite(child.x + 20, child.y - (50 + (child.checkers.length * 16)), 'addSoldierIcon');
    child.icon.visible = false;
  }, this, true);

  switchOnPointers();

  soldierGroup = game.add.group();
  soldierGroup.enableBody = true;

  var rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
  rightKey.onDown.add(function() {
                if(cursorPos < towerGroup.length - 1)
                      cursorPos += 1; switchOnPointers();});

  var leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
  leftKey.onDown.add(function() {
                if(cursorPos > 0)
                    cursorPos -= 1; switchOnPointers();});

  game.world.setBounds(0, 0, 800, 800);

  turnNumber = 1;

  flavorText = game.add.text(350, 150, "Day " + turnNumber + ", White moves out",
                      { font: "20px Arial", fill: player1, align: "center" });

  wrongSound = game.add.audio('wrong');

  makeSideBar();

}

function update() {
  soldierGroup.forEach(
    function(child){
      if((child.body.velocity.x > 0 && child.targetX < child.body.x) ||
        (child.body.velocity.x < 0 && child.targetX > child.body.x)) {
        child.destroy();}}
                        , this, true);
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

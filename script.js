
var game = new Phaser.Game(800, 500, Phaser.AUTO, '', {preload: preload,
                                              create: create, update: update});

var towerGroup, soldierGroup;

var selectedTower = null;
var cursorPos = 0;

var currentPlayer = "#ffffff";
var actionsTaken = 0;

var player1 = "#ffffff";

var player2 = "#FF0000";

var turnNumber;

var sideBar, speechBubble;

var wrongSound;
var moveSound;

// I feel mad sneaky about this
var scoredCheckers = {"#ffffff": 0, "#FF0000": 0};

function switchPlayerScreen(text) {
    var bmd = game.add.bitmapData(game.world.width, game.world.height);

    // draw to the canvas context like normal
    bmd.ctx.beginPath();
    bmd.ctx.rect(0,0,game.world.width, game.world.height);
    bmd.ctx.fillStyle = '#ffffff';
    bmd.ctx.fill();

    var line = game.make.text(350, 150, text, { font: "bold 32px Arial", fill: "#ff0044" });
    line.anchor.set(0.5);

    bmd.draw(line, 350, 150);

    // use the bitmap data as the texture for the sprite
    var sprite = game.add.sprite(0, 0, bmd);
    sprite.alpha = 0;

    //  Create our tween. This will fade the sprite to alpha 1 over the duration of 2 seconds
   var tween = game.add.tween(sprite).to( { alpha: 1 }, 1000, "Linear", true, 0);

   //  And this tells it to yoyo, i.e. fade back to zero again before repeating.
   //  The 3000 tells it to wait for 3 seconds before starting the fade back.
   tween.chain(game.add.tween(sprite).from( {alpha: 1}, 1000, "Linear", true, 2000));
}

function actionTaken() {
      // Record an action taken, switch players if currentPlayer has taken 2 actions
      actionsTaken++;
      if(actionsTaken >= 2) {
        actionsTaken = 0;
        turnNumber += 1;
        if(currentPlayer == player2){
          currentPlayer = player1;
          switchPlayerScreen("Day " + turnNumber + ", White moves out\n (Please switch seats)");
          cursorPos = towerGroup.length - 1;
        }
        else {
          currentPlayer = player2;
          switchPlayerScreen("Day " + turnNumber + ", Red moves out\n (Please switch seats)");
          cursorPos = 0;
        }
        // Inflict hunger on the masses
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
      child.pointers[player1].visible = false;
      child.pointers[player2].visible = false;
      child.pointer = child.pointers[currentPlayer];
    }, this, true);
    towerGroup.children[cursorPos].pointer.visible = true;
    if(selectedTower)
      selectedTower.pointer.visible = true;
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
        if(sprite == selectedTower){
          selectedTower.checkers.push(Math.random() * 10);
          selectedTower.pointer.animations.play('go');
          selectedTower = null;
          actionTaken();
          updateSideBar();
        }
        else if(sprite.owner == selectedTower.owner){
            transferChecker(selectedTower, sprite);
            sprite.owner = selectedTower.owner;
            moveTroop(selectedTower, sprite, 0);
            selectedTower.pointer.animations.play('go');
            selectedTower = null;
            actionTaken();
            updateSideBar();
          }
      }
      // Select a tower if it has checkers
      else if(sprite.checkers.length > 0){
        // If attempting to bear off your troops
        if((towerGroup.children[0] == sprite && currentPlayer == player2) ||
              towerGroup.children[towerGroup.children.length - 1] == sprite && currentPlayer == player1){
            bearOff(sprite);
            actionTaken();
        }
        else if(sprite.owner == currentPlayer){
        selectedTower = sprite;
        updateSideBar();
        selectedTower.pointer.animations.stop(null, true);
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
    scoredCheckers[currentPlayer] += 1;
    if(scoredCheckers[currentPlayer] == 0)
    {
      currentPlayer == player1 ? game.state.start('p1Wins') : game.state.start('p2Wins');
    }
    if(sprite.checkers.length <= 0) {
      // Check if this player has any more actions available to them
      for(var i = 0; i < towerGroup.length; i++) {
        if(towerGroup.children[i].owner == currentPlayer && towerGroup.children[i].length > 0) {
          return;
        }
      }
      // This code scores the enemy checkers
      var totalEnemyCheckers = currentPlayer == player1 ? scoredCheckers[player2] : scoredCheckers[player1];
      for(var i = 0; i < towerGroup.length; i++) {
        if(towerGroup.children[i].owner != currentPlayer) {
          totalEnemyCheckers += towerGroup.children[i].checkers.length;
        }
      }
      if(scoredCheckers[currentPlayer] > totalEnemyCheckers) {
        currentPlayer == player1 ? game.state.start('p1Wins') : game.state.start('p2Wins');
      }
      else {
        currentPlayer != player1 ? game.state.start('p1Wins') : game.state.start('p2Wins');
      }
  }
}

function moveTroop(startTower, targetTower, yCorrection) {
  var soldier = soldierGroup.create(startTower.x,
    startTower.y + 64 - yCorrection, 'soldier');
  soldier.animations.add('run', null, 15, true);
  soldier.animations.play('run');
  soldier.targetX = targetTower.x;
  soldier.body.velocity.x = (targetTower.x - startTower.x) / 2;
}

function chargeAnimation(startTower, targetTower) {
  for(var i = 0; i < startTower.checkers.length; i++){
    moveTroop(startTower, targetTower, i * 21);
  }
}

function resolveTowerAttack(startTower, targetTower) {
  // Here's the actual battle loop
  for(var i = 0, k = 0; i < startTower.checkers.length &&
                        k < targetTower.checkers.length;) {
                  if(startTower.checkers[i] > targetTower.checkers[k]) {
                    startTower.checkers[i] -= targetTower.checkers[k];
                    k++;
                  }
                  else {
                    targetTower.checkers[k] -= startTower.checkers[i];
                    i++;
                  }
              }
  // Now we tallly up the winner
  var attackSum = 0;
  for(var i = 0; i < startTower.checkers.length; i++){
    if(startTower.checkers[i] < 0) {
      startTower.checkers.shift();
      i--;
      continue;
    }
    attackSum += startTower.checkers[i];
  }
  var defenseSum = 0;
  for(var i = 0; i < targetTower.checkers.length; i++){
    if(targetTower.checkers[i] < 0) {
      targetTower.checkers.shift();
      i--;
      continue;
    }
    defenseSum += targetTower.checkers[i];
  }

  if(attackSum > defenseSum) {
    targetTower.checkers = startTower.checkers;
    targetTower.owner = startTower.owner;
  }
  startTower.checkers = [];
  drawFlags(startTower);
  drawFlags(targetTower);
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
  speechBubble.textContent = game.add.text(speechBubble.x + 5, speechBubble.y + 25, "Welcome back Player1!",
                                              { font: "bold 10px Arial", fill: "black", align: "center" });
  speechBubble.buddy = game.add.sprite(speechBubble.x, speechBubble.y - 10, "standingSoldier");

  updateSideBar();
}

function updateSideBar(){
  sideBar.cls();
  sideBar.update();
  sideBar.fill(0, 0, 0);
  var highlightedTower = towerGroup.children[cursorPos];
  var area = new Phaser.Rectangle(0, 0, 13, 21);
  for(var i = 0; i < highlightedTower.checkers.length; i++){
    sideBar.copyRect('standingSoldier', area, 20, i * 25);
    sideBar.rect(40, i * 25, highlightedTower.checkers[i] * 10, 21, "#FF99FF");
  }
  // helper text for player's towers
  if(highlightedTower.owner == currentPlayer) {
    if(selectedTower == null) {
      speechBubble.textContent.setText("Select this tower \nwith SPACE");
    }
    else if(highlightedTower == selectedTower) {
      speechBubble.textContent.setText("Add a soldier \nwith SPACE");
    }
    else {
      speechBubble.textContent.setText("Transfer a soldier \nfrom selectedTower");
    }
  }
  // helper text for opponent's towers
  else {
    if(selectedTower == null) {
      speechBubble.textContent.setText("Opponent's tower, \ncan't be selected");
    }
    else{
      speechBubble.textContent.setText("Attempt a charge \nwith C button");
    }
  }
}

function makeTowers() {
  towerGroup = game.add.group();

  var scalar = 1.5;
  var deltaY = 10;
  for(var i = 0; i < 600; i += 100)
  {
    if(i <= 200) {
      scalar -= 0.3;
      deltaY += 15;
      deltaY *= 1.5
    }
    else if(i >= 400){
      scalar += 0.3;
      deltaY *= 0.5;
    }
    var tower = towerGroup.create(i + 20, game.world.height - (150 + deltaY), 'wallTexture');
    tower.scale.setTo(scalar, scalar);
    tower.checkers = [];
    for(var k = 0; k < 5; k++)
    {
      tower.checkers.push(Math.random() * 9 + 1);
    }
    tower.flagMap = null;
  }
  for(var i = 0; i < towerGroup.children.length; i++){
    var tower = towerGroup.children[i];
    if(i % 2){
    tower.owner = player1;
    scoredCheckers[player1] += tower.checkers.length;
    }
    else {
      tower.owner = player2;
      scoredCheckers[player2] += tower.checkers.length;
    }
    drawFlags(tower);
  }
}

function makePointers(child) {
    child.pointers = {};
    var whitePointer = game.add.sprite(child.x + 20, child.y - (70 + (child.checkers.length * 16)), 'whitePointer');
    whitePointer.animations.add('go', null, 15, true);
    whitePointer.visible = false;
    var redPointer = game.add.sprite(child.x + 20, child.y - (70 + (child.checkers.length * 16)), 'redPointer');
    redPointer.animations.add('go', null, 15, true);
    redPointer.visible = false;
    child.pointers[player1] = whitePointer;
    child.pointers[player2] = redPointer;
    child.pointer = child.pointers[child.owner];
    child.pointer.animations.play('go');
  }

function drawFlags(tower) {
  if(tower.flagMap) {
    tower.flagMap.cls();
    tower.flagMap.update();
    }
  tower.flagMap = game.add.bitmapData(16, tower.checkers.length * 16);
  tower.flagMap.addToWorld(tower.x + (tower.width / 2), tower.y - (tower.checkers.length * 16));
  area = new Phaser.Rectangle(0, 0, 16, 16);
  flagImage = (tower.owner == player1) ? 'whiteFlag' : 'redFlag';
  for(var i = 0; i < tower.checkers.length; i++){
    tower.flagMap.copyRect(flagImage, area, 0, i * 16);
  }

}

function preload() {
  game.load.image('standingSoldier', 'assets/soldier.png');
  game.load.image('speechBubble', 'assets/speechBubble.png');
  game.load.image('wallTexture', 'assets/towerSprite.png');
  game.load.spritesheet('soldier', 'assets/runningSoldier.png', 13, 21);

  game.load.audio('wrong', 'assets/wrong.wav');
  game.load.audio('move', 'assets/blip.wav');

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

  towerGroup.forEach(makePointers, this, true);

  switchOnPointers();

  soldierGroup = game.add.group();
  soldierGroup.enableBody = true;

  var rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
  rightKey.onDown.add(function() {
                moveSound.play();
                if(cursorPos < towerGroup.length - 1)
                      cursorPos += 1;
                else {
                  cursorPos = 0;
                }
                switchOnPointers();
                updateSideBar();});

  var leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
  leftKey.onDown.add(function() {
                moveSound.play();
                if(cursorPos > 0)
                    cursorPos -= 1;
                else
                    cursorPos = towerGroup.length - 1;
                 switchOnPointers();
                updateSideBar();});

  var spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
  spaceKey.onDown.add(function() {
                selectTower(towerGroup.children[cursorPos], null);
  }, this, true);

  var cKey = game.input.keyboard.addKey(Phaser.Keyboard.C);
  cKey.onDown.add(function() {
                if(selectedTower && selectedTower != towerGroup.children[cursorPos] &&
                        selectedTower.owner != towerGroup.children[cursorPos].owner){
                  chargeAnimation(selectedTower, towerGroup.children[cursorPos]);
                  resolveTowerAttack(selectedTower, towerGroup.children[cursorPos]);
                  actionTaken();
                  selectedTower = null;
                  switchOnPointers();
                  updateSideBar();
                }
                else {
                  wrongSound.play();
                }
  })

  game.world.setBounds(0, 0, 800, 500);

  turnNumber = 1;

  wrongSound = game.add.audio('wrong');
  moveSound = game.add.audio('move');

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
              game.time.events.add(Phaser.Timer.SECOND * 2, function() {game.state.start('titleScreen')}, this);
            },
      update: function() {}
    });
game.state.add('p2Wins', {
  preload: function() {},
  create: function (){
          game.add.text(400, 300, 'Player 2 Wins', { fontSize: '32px', fill: '#FFF' });
          game.time.events.add(Phaser.Timer.SECOND * 2, function() { game.state.start('titleScreen')}, this);
        },
  update: function() {}
});


function createTitlePage() {
  game.stage.backgroundColor = '#000000';
  var title = game.add.text(game.world.centerX, game.world.centerY,
                                          'TOWER RUNNERS', {fontSize: 'italic 40px', fill: '#FFF'});
  title.anchor.set(0.8, 0.8);

  var spaceText = game.add.text(game.world.centerX, game.world.centerY + 130,
                                          'Space Bar to continue', {fontSize: '30px', fill: '#FFF'});
  spaceText.anchor.set(0.5, 0.5);
  var copyright = game.add.text(game.world.centerX, game.world.height - 30,
                                          'NYU GAME CENTER 2015', {fontSize: '20px', fill: '#FFF'});

  var spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
  spaceKey.onDown.add(function() {
                game.world.removeAll();
                if(cursorPos == 0) {
                  game.add.text(70, 100, 'Tower Runners is a two player strategy game\n Players are commanders of warring factions\ngearing up for an upcoming battle. Your goal\nis to bring more troops home than your opponent\nbut that doesn\'t mean you can\'t or shouldn\'t\ndo some damage to the enemy troops in the\n meantime. The player with the most troops\n rescued is the winner.',
                                {fontSize: '30px', fill: '#FFF'});
                  game.add.text(game.world.centerX, game.world.height - 30, 'Space Bar to continue',
                                {fontSize: '20px', fill:'#FFF'});
                  cursorPos++;
                }
                else {
                  game.world.removeAll();
                  game.state.start('mainScreen');
                }
  }, this, true);
}

game.state.add('titleScreen', {preload: function() {}, create: createTitlePage, update: function(){}});

game.state.add('mainScreen', {preload: preload, create: create, update: update});

game.state.start('titleScreen');

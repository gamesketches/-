
var game = new Phaser.Game(700, 700, Phaser.AUTO, '', {preload: preload,
                                              create: create, update: update});

var towerGroup;

var diceRoll;

var selectedTower = null;

function selectTower(sprite, pointer) {
      if(selectedTower != null && (sprite.checkers <= 1 || sprite.text.fill == selectedTower.text.fill)){
        sprite.checkers += 1;
        selectedTower.checkers -= 1;
        sprite.text.fill = selectedTower.text.fill;
        sprite.text.setText(sprite.checkers);
        selectedTower.text.setText(selectedTower.checkers);
        selectedTower = null;
      }
      else if(sprite.checkers > 0){
        selectedTower = sprite;
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
                        { font: "20px Arial", fill: "#ff0000", align: "center" });
    }
    else {
      tower.text = game.add.text(tower.x + 50, 330, "",
                          { font: "20px Arial", fill: "#ffffFF", align: "center" });
    }
    tower.text.anchor.setTo(0.5, 0.5);
    tower.text.setText(tower.checkers);
  }
}

function update() {

}

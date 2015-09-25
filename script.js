
var game = new Phaser.Game(700, 700, Phaser.AUTO, '', {preload: preload,
                                              create: create, update: update});

var towerGroup;

function preload() {
  game.load.image('wallTexture', 'wallTexture.png');
}

function create() {
  towerGroup = game.add.group();

  for(var i = 0; i < 600; i += 130)
  {
    var tower = towerGroup.create(i + 50, 350, 'wallTexture');
    tower.checkers = Math.round(Math.random() * 5);
  }
  for(var i = 0; i < towerGroup.children.length; i++){
    var tower = towerGroup.children[i];
    var text = game.add.text(tower.x + 50, 330, "",
                        { font: "20px Arial", fill: "#ffFFFF", align: "center" });
    text.anchor.setTo(0.5, 0.5);
    text.setText(tower.checkers);
  }
}

function update() {

}

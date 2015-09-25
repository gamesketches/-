
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
  }
}

function update() {

}

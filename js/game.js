var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);
var player;
var ground;
var obstacles;
var scoringZones;
var score = 0;
var scoreText;
var timer;
var timerText;
var gameOver = false;
var gameStarted = false;

function preload ()
{
}

function create ()
{
    // Sky
    this.cameras.main.setBackgroundColor('#87CEEB');

    // Sun
    var sun = this.add.circle(100, 100, 50, 0xFFFF00);

    // Clouds
    var cloud1 = this.add.group();
    cloud1.add(this.add.circle(250, 150, 30, 0xFFFFFF));
    cloud1.add(this.add.circle(280, 150, 35, 0xFFFFFF));
    cloud1.add(this.add.circle(310, 150, 30, 0xFFFFFF));

    var cloud2 = this.add.group();
    cloud2.add(this.add.circle(550, 200, 40, 0xFFFFFF));
    cloud2.add(this.add.circle(590, 200, 45, 0xFFFFFF));
    cloud2.add(this.add.circle(630, 200, 40, 0xFFFFFF));

    // Ground
    ground = this.physics.add.staticGroup();
    ground.create(400, 580, null).setSize(800, 40).setVisible(false);

    // Player
    player = this.add.rectangle(100, 450, 40, 40, 0xFF6347);
    this.physics.add.existing(player);
    player.body.setCollideWorldBounds(true);


    // Collision
    this.physics.add.collider(player, ground);

    // Controls
    this.input.on('pointerdown', function (pointer) {
        if (player.body.touching.down) {
            player.setVelocityY(-330);
        }
    }, this);

    // UI
    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });
    timerText = this.add.text(550, 16, 'Time: 60', { fontSize: '32px', fill: '#000' });

    // Start Button
    const startButton = this.add.text(400, 300, 'Start Game', { fontSize: '48px', fill: '#000' })
        .setOrigin(0.5)
        .setInteractive();

    startButton.on('pointerdown', () => {
        startButton.destroy();
        startGame.call(this);
    });

    this.physics.pause();
}

function startGame() {
    gameStarted = true;
    this.physics.resume();

    // Timer
    timer = this.time.addEvent({
        delay: 60000,
        callback: endGame,
        callbackScope: this
    });

    // Obstacles
    obstacles = this.physics.add.group();
    scoringZones = this.physics.add.group();
    this.physics.add.collider(player, obstacles, endGame, null, this);
    this.physics.add.overlap(player, scoringZones, (player, zone) => {
        zone.destroy();
        updateScore.call(this);
    }, null, this);

    this.time.addEvent({
        delay: 1500,
        callback: addObstacleRow,
        callbackScope: this,
        loop: true
    });
}

function update ()
{
    if (gameOver || !gameStarted) {
        return;
    }

    timerText.setText('Time: ' + Math.ceil(60 - timer.getElapsedSeconds()));

    if (this.input.activePointer.isDown) {
        if (this.input.activePointer.x < player.x) {
            player.body.setVelocityX(-160);
        } else if (this.input.activePointer.x > player.x) {
            player.body.setVelocityX(160);
        } else {
            player.body.setVelocityX(0);
        }
    } else {
        player.body.setVelocityX(0);
    }

    // Recycle obstacles
    obstacles.getChildren().forEach(obstacle => {
        if (obstacle.x < -100) {
            obstacle.destroy();
        } else {
            obstacle.body.setVelocityX(-200);
        }
    });
    scoringZones.getChildren().forEach(zone => {
        if (zone.x < -100) {
            zone.destroy();
        } else {
            zone.body.setVelocityX(-200);
        }
    });
}

function addObstacle(x, y, width, height) {
    const obstacle = this.add.rectangle(x, y, width, height, 0x2E8B57);
    this.physics.add.existing(obstacle);
    obstacle.body.setAllowGravity(false);
    obstacle.body.setImmovable(true);
    obstacles.add(obstacle);
}

function addObstacleRow() {
    const gapHeight = 200;
    const obstacleWidth = 80;
    const gameHeight = 600;

    const gapPosition = Math.random() * (gameHeight - gapHeight);
    const topObstacleHeight = gapPosition;
    const bottomObstacleHeight = gameHeight - (gapPosition + gapHeight);

    addObstacle.call(this, 800, topObstacleHeight / 2, obstacleWidth, topObstacleHeight);
    addObstacle.call(this, 800, gameHeight - bottomObstacleHeight / 2, obstacleWidth, bottomObstacleHeight);

    const scoringZone = this.add.zone(800 + obstacleWidth / 2, gameHeight / 2, 10, gameHeight);
    this.physics.add.existing(scoringZone);
    scoringZone.body.setAllowGravity(false);
    scoringZones.add(scoringZone);
}

function endGame() {
    if (gameOver) {
        return;
    }
    gameOver = true;
    this.physics.pause();
    player.setTint(0xff0000);

    // Stop all timers
    this.time.removeAllEvents();

    // Show game over panel
    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.7);
    panel.fillRect(200, 150, 400, 300);

    this.add.text(400, 200, 'Game Over', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);
    this.add.text(400, 280, 'Score: ' + score, { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);

    const restartButton = this.add.text(400, 380, 'Restart', { fontSize: '32px', fill: '#fff' })
        .setOrigin(0.5)
        .setInteractive();

    restartButton.on('pointerdown', () => {
        gameOver = false;
        gameStarted = false;
        score = 0;
        this.scene.restart();
    });
}

function updateScore() {
    score++;
    scoreText.setText('Score: ' + score);
}

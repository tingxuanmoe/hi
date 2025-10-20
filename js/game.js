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
    player = this.physics.add.sprite(100, 450, null).setSize(40, 40).setCollideWorldBounds(true);
    player.displayOriginX = 0;
    player.displayOriginY = 0;
    const playerGraphics = this.add.graphics();
    playerGraphics.fillStyle(0xFF6347, 1.0);
    playerGraphics.fillRect(0, 0, 40, 40);
    playerGraphics.x = player.x;
    playerGraphics.y = player.y;
    player.playerGraphics = playerGraphics;


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

    if (player) {
        player.playerGraphics.x = player.x;
        player.playerGraphics.y = player.y;

        if (this.input.activePointer.isDown) {
            if (this.input.activePointer.x < player.x) {
                player.setVelocityX(-160);
            } else if (this.input.activePointer.x > player.x) {
                player.setVelocityX(160);
            } else {
                player.setVelocityX(0);
            }
        } else {
            player.setVelocityX(0);
        }
    }

    // Update obstacles
    obstacles.getChildren().forEach(obstacle => {
        if (obstacle.obstacleGraphics) {
            obstacle.obstacleGraphics.x = obstacle.x;
            obstacle.obstacleGraphics.y = obstacle.y;
        }

        if (obstacle.x < -100) {
            if (obstacle.obstacleGraphics) {
                obstacle.obstacleGraphics.destroy();
            }
            obstacle.destroy();
        }
    });
}

function addObstacle(x, y, width, height) {
    const obstacle = this.add.graphics();
    obstacle.fillStyle(0x2E8B57, 1.0);
    obstacle.fillRect(0, 0, width, height);

    const obstacleBody = this.physics.add.image(x, y).setOrigin(0, 0);
    obstacleBody.body.setSize(width, height);
    obstacleBody.body.setAllowGravity(false);
    obstacleBody.body.setImmovable(true);
    obstacleBody.setVelocityX(-200);

    obstacleBody.obstacleGraphics = obstacle;
    obstacles.add(obstacleBody);
}

function addObstacleRow() {
    const hole = Math.floor(Math.random() * 5) + 1;
    const holeHeight = 200;
    const obstacleWidth = 80;
    const totalHeight = 600;

    for (let i = 0; i < 10; i++) {
        if (i !== hole && i !== hole + 1) {
            const y = i * (totalHeight / 10);
            addObstacle.call(this, 800, y, obstacleWidth, totalHeight / 10);
        }
    }

    const scoringZone = this.physics.add.image(800 + obstacleWidth, 0).setOrigin(0, 0);
    scoringZone.body.setSize(10, totalHeight);
    scoringZone.body.setAllowGravity(false);
    scoringZone.body.setImmovable(true);
    scoringZone.setVelocityX(-200);
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

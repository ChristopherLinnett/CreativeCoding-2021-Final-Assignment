let canvasWidth = 1500;
let canvasHeight = 1000;
let highScore;
let screenScale = (canvasWidth / 1920 + canvasHeight / 1080) / 2;
//Game Modifiers
let difficulty = 0;
let level = 0;
let maxAmmo = 10;
let maxExplosion = 0.1 * screenScale;
let cityHealth = 1;
let firingCoolDown = 60;
let turrets = 3;
//Game tracking
let enemiesRemain = 0;
let score = 0;
let cost = {
    firingCooldown: 200,
    maxAmmo: 200,
    explosion: 200,
    armour: 200
}
let defaultCost = {
    firingCooldown: 200,
    maxAmmo: 200,
    explosion: 200,
    armour: 200
}
let countStarted = false;
let transitioning = false;
let go = false;
let coolDown = 0;
//Screen Setup

let menu = "splashScreen";

function preload() {
    //loading in images
    projectileImg = loadImage('assets/projectile/default.png');
    turretImg = loadImage('assets/platform/turret.png');
    crosshairImg = loadImage('assets/crosshair/ready.png');
    enemyImg = loadImage('assets/projectile/edefault1.png');
    explosionImg = loadAnimation('assets/explosion/star_red01.png', 'assets/explosion/star_red02.png', 'assets/explosion/star_red03.png', 'assets/explosion/star_red04.png');
    protectImg = loadImage('assets/platform/protect.png');
    saucerImg = loadImage('assets/platform/saucer.png');
    settingsImg = loadImage('assets/gui/Settings.png');
    playImg = loadImage('assets/gui/Play.png');
    menuBG = loadImage('assets/gui/BG.png');
    returnImg = loadImage('assets/gui/return.png');
    highScoreImg = loadImage('assets/gui/highScore.png');
    titleImg = loadImage('assets/gui/title.png');
    //loading in audio
    menuMusic = loadSound('assets/audio/music_BG.mp3');
    shootAudio = loadSound('assets/audio/MissileMini.wav');
    explosionAudio = loadSound('assets/audio/GreaterHit.wav');
    playingAudio = loadSound('assets/audio/bgm_0.mp3');
    victoryAudio = loadSound('assets/audio/bgm_12.mp3');
    gameOverSound = loadSound('assets/audio/gameover_loud.mp3');
    //loading in video
    backgroundImg = createVideo('assets/background/Starfield.mp4');
    backgroundImg.hide();                   //initially hiding from view
    backgroundImg.isPlaying = false;        //creating a property that will mirror the play state of the video
    //loading in high score file
    highScore = loadJSON('assets/highscore.json');
}

function setup() {
    angleMode(DEGREES);
    projectiles = new Group();            //creating groups for objects/sprites that will be stored
    enemies = new Group();
    explosions = new Group();
    saucerG = new Group();
    explosionImg.frameDelay = 8;
    createCanvas(canvasWidth, canvasHeight);
    background(0);
    SetupTurret();                        //initialising the game objects
    setupCities();
    setupCrosshair();

    setupSplash();
}
function draw() {
    background(0);
    splashMenu();
    mainMenu();
    endGameMenu();
    settingsMenu();
    playingGame();
    gameOverMenu();
    highScoreMenu();
}

function keyPressed() {
    if (transitioning && menu == "playing") {
        //fire rate
        if (keyCode === 65 && score > cost.firingCooldown) {
            firingCoolDown *= 0.75;
            score -= cost.firingCooldown;
            cost.firingCooldown += int(cost.firingCooldown * 0.35)
        }
        //max ammo
        if (keyCode === 68 && score > cost.maxAmmo) {
            maxAmmo += round(maxAmmo / 5)
            score -= cost.maxAmmo;
            cost.maxAmmo += int(cost.maxAmmo * 0.15)
        }
        //explosion size
        if (keyCode === 67 && score > cost.explosion) {
            maxExplosion *= 1.1;
            score -= cost.explosion;
            cost.explosion += int(cost.explosion * 0.25)
        }
        //armour
        if (keyCode === 90 && score > cost.armour) {
            cityHealth++;
            score -= cost.armour;
            cost.armour += int(cost.armour * 0.5)
        }
    }
}



function mousePressed() {
    if (menu == "highScoreMenu" || menu == "endGame") {
        if (mouseX > canvasWidth - 210 && mouseY > canvasHeight - 210) {
            if (menuMusic.isPlaying) {
                menuMusic.pause();
            }
            resetGame();
        }
    }
    if (menu == "playing") {
        if (cities.length > 0 && (enemiesRemain > 0 || enemies.length > 0)) {
            compare = 10000
            firingTurret = 0
            for (let i = 0; i < turretGroup.length; i++) {
                distance = dist(turretGroup[i].position.x, turretGroup[i].position.y, crosshair.position.x, crosshair.position.y);
                if (turretGroup[i].ammo > 0 && distance < compare) {
                    compare = distance
                    firingTurret = i
                }
            }
            if (coolDown < 1) {
                if (turretGroup[firingTurret].ammo > 0) {
                    createProjectile(turretGroup[firingTurret].position.x, turretGroup[firingTurret].position.y)
                    shootAudio.play();
                    turretGroup[firingTurret].ammo--;
                    coolDown = firingCoolDown;
                }
            }
        } if (transitioning) {
            //fire rate
            if (dist(crosshair.position.x, crosshair.position.y, canvasWidth / 10, canvasHeight / 10) < 50 && score > cost.firingCooldown) {
                firingCoolDown *= 0.75;
                score -= cost.firingCooldown;
                cost.firingCooldown += int(cost.firingCooldown * 0.35)
            }
            //max ammo
            if (dist(crosshair.position.x, crosshair.position.y, canvasWidth * 9 / 10, canvasHeight / 10) < 50 && score > cost.maxAmmo) {
                maxAmmo += round(maxAmmo / 5)
                score -= cost.maxAmmo;
                cost.maxAmmo += int(cost.maxAmmo * 0.15)
            }
            //explosion size
            if (dist(crosshair.position.x, crosshair.position.y, canvasWidth * 9 / 10, canvasHeight / 2) < 50 && score > cost.explosion) {
                maxExplosion *= 1.1;
                score -= cost.explosion;
                cost.explosion += int(cost.explosion * 0.25)
            }
            //armour
            if (dist(crosshair.position.x, crosshair.position.y, canvasWidth / 10, canvasHeight / 2) < 50 && score > cost.armour) {
                cityHealth++;
                score -= cost.armour;
                cost.armour += int(cost.armour * 0.5)
            }
        }
    } else if (menu == "mainMenu") {
        if (dist(mouseX, mouseY, canvasWidth / 3, canvasHeight * 2 / 3) < 100) {
            clear();
            menu = "playing"
            if (!playingAudio.isPlaying()) {
                menuMusic.stop();
                playingAudio.setLoop(true);
                playingAudio.play();
            }
            enemiesRemain = 10 * (1 + difficulty / 2) * (1 + level / 10);
            level = 0;
            maxAmmo = 10;
            firingCoolDown = 60;
            go = false;
        } else if (dist(mouseX, mouseY, canvasWidth * 2 / 3, canvasHeight * 2 / 3) < 100) {
            clear();
            menu = 'settings'
        } else if ((dist(mouseX, mouseY, canvasWidth / 2, canvasHeight * 2 / 3) < 100)) {
            menu = 'highScoreMenu'
        }
    } else if (menu == "settings") {
        if (dist(mouseX, mouseY, canvasWidth / 4, canvasHeight / 5) < 50) {
            difficulty = 0;
        } else if (dist(mouseX, mouseY, canvasWidth / 3, canvasHeight / 5) < 50) {
            difficulty = 1;
        } else if (dist(mouseX, mouseY, canvasWidth / 2.4, canvasHeight / 5) < 50) {
            difficulty = 2;
        } else if (mouseX > canvasWidth - 210 && mouseY > canvasHeight - 210) {
            clear();
            menu = "mainMenu"
        }
    }
}
//functions to decide which menu to show
function splashMenu() {
    if (menu == "splashScreen") {
        textAlign(CENTER, CENTER);
        fill(255, 255, 255);
        text("Enter Your Name to Begin", canvasWidth / 2, canvasHeight / 4);
    }
}
function mainMenu() {
    if (menu == "mainMenu") {
        background(menuBG);
        drawMenu();
    }
}
function endGameMenu() {
    if (menu == 'endGame') {
        showScore()
        image(returnImg, canvasWidth - 210, canvasHeight - 210);
    }
}
function settingsMenu() {
    if (menu == 'settings') {
        drawSettings();
    }
}
function playingGame() {
    if (menu == "playing") {
        if (transitioning == false && backgroundImg.isPlaying == false) {
            backgroundImg.loop();
            backgroundImg.isPlaying = true;
        }
        image(backgroundImg, 0, 0, canvasWidth, canvasHeight);
        drawTail();
        drawSprites();
        directTurrets();
        controlCrosshair();
        controlEnemy();
        governExplosion();
        controlProjectile();
        resetCoolDown();
        showCooldown();
        scoreBoard();
    }
}
function gameOverMenu() {
    if (menu == 'gameover') {
        cursor()
        showScore();
        if (checkHighScore()) {
            menu = "highScoreMenu"
        } else {
            menu = "endGame"
        }
    }
}
function highScoreMenu() {
    if (menu == "highScoreMenu") {
        image(backgroundImg, 0, 0, canvasWidth, canvasHeight);
        if (backgroundImg.isPlaying) {
            backgroundImg.pause();
            backgroundImg.isPlaying = false;
        }
        drawScores();
        image(returnImg, canvasWidth - 210, canvasHeight - 210);
    }
}
//menu drawing functions
function drawMenu() {
    imageMode(CENTER)
    image(titleImg, canvasWidth / 2, canvasHeight / 3)
    image(playImg, canvasWidth / 3, canvasHeight * 2 / 3);
    image(settingsImg, canvasWidth * 2 / 3, canvasHeight * 2 / 3);
    image(highScoreImg, canvasWidth / 2, canvasHeight * 2 / 3);
}
function drawSettings() {
    textSize(36);
    textAlign(CENTER, CENTER);
    fill(255);
    text("Difficulty", canvasWidth / 15, canvasHeight / 5);
    textSize(36)

    text("Easy", canvasWidth / 4, canvasHeight / 5);
    text("Medium", canvasWidth / 3, canvasHeight / 5);
    text("Hard", canvasWidth / 2.4, canvasHeight / 5);
    textSize(24)
    imageMode(CENTER)
    image(returnImg, canvasWidth - 105, canvasHeight * 9 / 10);
    textSize(48);
    if (difficulty == 0) {
        fill('green');
        text("EASY", canvasWidth * 2 / 3, canvasHeight / 5);
    }
    if (difficulty == 1) {
        fill('yellow');
        text("MEDIUM", canvasWidth * 2 / 3, canvasHeight / 5);
    }
    if (difficulty == 2) {
        fill('red');
        text("HARD", canvasWidth * 2 / 3, canvasHeight / 5);
    }
}
//setup functions
function setupSplash() {
    textSize(36);
    inputName = createInput('name');
    inputName.position(canvasWidth / 2 - 200, canvasHeight / 2);
    inputName.size(200, 50);
    inputName.style('font-size', '48px');
    saveName = createButton('Save');
    saveName.position(canvasWidth / 2, canvasHeight / 2);
    saveName.size(200, 56);
    saveName.mouseClicked(startGame);
}
function startGame() {
    menu = "mainMenu"
    inputName.hide();
    playerName = inputName.value();
    saveName.hide();
    menuMusic.setLoop(true);
    menuMusic.play();
}
//turns mouse into a crosshair with movement limitations
function setupCrosshair() {
    crosshair = createSprite(mouseX, mouseY, 75, 75);
    crosshairImg.resize(150, 150);
    crosshair.addImage(crosshairImg);
    crosshair.scale = screenScale;
}
function controlCrosshair() {
    crosshair.position.x = constrain(mouseX, 25, canvasWidth - 25);
    crosshair.position.y = constrain(mouseY, 40, 800);
    noCursor();
}
//turrets and cities functions
function SetupTurret() {
    turretGroup = new Group();
    saucer = createSprite(canvasWidth / 2, canvasHeight * 1.025, canvasWidth * 1.15, canvasWidth / 2.5)
    saucerImg.resize(canvasWidth * .9, canvasHeight / 2.75)
    saucer.addImage(saucerImg);
    saucer.setCollider('circle', 0, 1175, 1350)
    saucer.debug = false;
    saucer.depth = 0
    saucerG.add(saucer);
    for (let i = 0; i < turrets; i++) {
        let x = canvasWidth / (turrets + 1) * (i + 1)
        let sinValue = map(x, 0, canvasWidth, 0, 180)
        let y = canvasHeight - sin(sinValue) * 150;
        turret = createSprite(x, y, 100, 100);
        turret.ammo = maxAmmo;
        turret._rotation = 270;
        turret.setCollider('circle', 0, -10, 40);
        turretImg.resize(125, 100);
        turret.addImage(turretImg)
        // turret.rotateToDirection = true;
        turret.friction = 0.1;
        turret.debug = false;
        turretGroup.add(turret);
    }
}
function setupCities() {
    cities = new Group();
    for (let i = 0; i < turrets + 1; i++) {
        let x = canvasWidth / (turrets + 1) * (i + 0.5)
        let sinValue = map(x, 0, canvasWidth, 0, 180)
        let y = canvasHeight - sin(sinValue) * 150;
        city = createSprite(x, y, 100, 100);
        city.health = cityHealth;
        protectImg.resize(100, 100);
        city.addImage(protectImg);
        city.setCollider('circle', 0, 0, 10)
        city.debug = false;
        cities.add(city);
    }
}
function directTurrets() {
    if (cities.length > 0) {
        for (let i = cities.length - 1; i >= 0; i--) {
            cities[i].rotation += (cities[i].health - 1) ** 2
            for (let j = 0; j < enemies.length; j++) {
                if (dist(cities[i].position.x, cities[i].position.y, enemies[j].position.x, enemies[j].position.y) < 50 && cities[i].life < 0 && enemies[j].armed == true) {
                    let boomPos = createVector(enemies[j].position.x, enemies[j].position.y);
                    enemies[j].armed = false;
                    enemies[j].remove();
                    if (cities[i].health > 1) {
                        cities[i].health--;
                    } else {
                        if (cities.length > 0) {
                            createExplosion(boomPos.x, boomPos.y);
                            explosions[explosions.length - 1].positive = false;
                            cities[i].life = 1;
                        }
                    }
                }
            }
        }
        if (turretGroup.length > 0) {
            let compare = 10000
            let firingTurret = 0
            for (let i = 0; i < turretGroup.length; i++) {
                fill(0, 0, 0, 125);
                noStroke();
                rect(turretGroup[i].position.x - turretGroup[i].ammo * 5 - 5, turretGroup[i].position.y + 30, turretGroup[i].ammo * 10, 40);
                for (let k = 0; k < turretGroup[i].ammo; k++) {
                    push();
                    translate(turretGroup[i].position.x - turretGroup[i].ammo * 5 + (k * 10), turretGroup[i].position.y + 50)
                    rotate(270)
                    imageMode(CENTER);
                    image(projectileImg, 0, 0, 50, 10);
                    pop();
                }
                for (let j = 0; j < enemies.length; j++) {
                    if (turretGroup.length > 0) {
                        if (dist(turretGroup[i].position.x, turretGroup[i].position.y, enemies[j].position.x, enemies[j].position.y) < 30 && turretGroup[i].life < 0) {
                            createExplosion(turretGroup[i].position.x, turretGroup[i].position.y);
                            explosions[explosions.length - 1].positive = false;
                            turretGroup[i].life = 20;
                            break;
                        }
                    }
                }
            }
            for (let i = 0; i < turretGroup.length; i++) {
                let distance = dist(turretGroup[i].position.x, turretGroup[i].position.y, crosshair.position.x, crosshair.position.y);
                if (distance < compare && turretGroup[i].ammo > 0) {
                    compare = distance
                    firingTurret = i
                } else if (turretGroup[i].ammo == 0) {
                    turretGroup[firingTurret]._rotation = 0;
                }
            }
            if (turretGroup.length > 0) {
                let angle;
                angle = atan2(crosshair.position.y - turretGroup[firingTurret].position.y, crosshair.position.x - turretGroup[firingTurret].position.x)
                if (turretGroup[firingTurret].ammo > 0) {
                    turretGroup[firingTurret]._rotation = angle;
                }
            }
        }
    } else {
        if (transitioning == false) {
            if (go == false) {
                gameOverSound.play();
                playingAudio.stop();
            }
            go = true;
            if (explosions.length == 0) {
                endGame();
            }
        }
    }
}
//functions for creating/controlling enemy targets
function controlEnemy() {
    if (enemies.length < 10 && frameCount % 10 == 0 && enemiesRemain > 0) {
        createEnemy(50 * random(canvasWidth / 50), random(-100, -10));
        enemiesRemain--;
    }
    if (enemies.length == 0 && enemiesRemain < 1 && explosions.length == 0 && go == false) {
        if (cities.length > 0 && transitioning == false) {
            transitioning = true;
        }
        endLevel();

    }
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (saucer) {
            if (enemies[i].collide(saucer)) {
                enemies[i].life = 1;
                break;
            }
        }
        if (enemies[i].position.y >= canvasHeight + 30) {
            enemies[i].life = 1;
        }
        if (int(enemies[i].position.y) == int(canvasHeight / 3) && enemies[i].doubleUp < 0.1 * (1 + (difficulty / 10 + level / 10) / 2)) {
            createEnemy(enemies[i].position.x, enemies[i].position.y)
            enemies[i].doubleUp = 1
        }
        for (let j = explosions.length - 1; j >= 0; j--) {
            if (dist(enemies[i].position.x, enemies[i].position.y, explosions[j].position.x, explosions[j].position.y) < explosions[j].scale * 500 * screenScale) {
                let x = enemies[i].position.x
                let y = enemies[i].position.y
                enemies[i].life = 1;
                if (explosions[j].positive) {
                    score += round(10 * (1 + difficulty / 10 + level / 10))
                    createExplosion(x, y);
                }
            }
        }
    }
}
function createEnemy(x, y) {
    let startpoint = createVector(x, y)
    enemy = createSprite(startpoint.x, startpoint.y, 46.6, 26.8);
    chooseTarget = random(1);
    if (turretGroup.length > 0 && chooseTarget < 0.1) {
        targetID = int(random(turretGroup.length));
        targetW = turretGroup[targetID].position.x;
        targetH = turretGroup[targetID].position.y;
    } else if (cities.length > 0) {
        targetID = int(random(cities.length));
        targetW = cities[targetID].position.x;
        targetH = cities[targetID].position.y;
    } else {
        targetW = random(canvasWidth);
        targetH = canvasHeight;
    }
    enemy.armed = true;
    enemy.mass = 1000
    enemy.doubleUp = random(1);
    angle = atan2(targetH - startpoint.y, targetW - startpoint.x);
    enemy.setCollider('circle', 0, 0, 8);
    enemy.collided = false;
    enemy.startpoint = startpoint
    enemyImg.resize(46.6, 26.8);
    enemy.addImage(enemyImg);
    enemy.addAnimation('dead', explosionImg);
    enemy.rotateToDirection = true;
    enemy.attractionPoint(1 * (1 + level / 10), targetW, targetH)
    enemy.debug = false;
    enemies.add(enemy)
}
//functions related to the projectiles being fired
function resetCoolDown() {
    if (coolDown > 0) {
        coolDown--;
    }
}
function drawTail() {
    strokeWeight(3)
    for (let i = 0; i < projectiles.length; i++) {
        stroke(0, 0, 255, 60);
        line(projectiles[i].position.x, projectiles[i].position.y, projectiles[i].startpoint.x, projectiles[i].startpoint.y);
    }
    for (let i = 0; i < enemies.length; i++) {
        stroke(255, 0, 0, 60);
        line(enemies[i].position.x, enemies[i].position.y, enemies[i].startpoint.x, enemies[i].startpoint.y)
    }
}
function createProjectile(x, y) {
    let angle = atan2(crosshair.position.y - y, crosshair.position.x - x)
    let cx = x + 70 * cos(angle);
    let cy = y + 70 * sin(angle);
    projectile = createSprite(cx, cy, 25.1, 14.4);
    projectile.targetX = crosshair.position.x
    projectile.targetY = crosshair.position.y
    projectile.setCollider('circle', 14 * cos(angle), 14 * sin(angle), 5)
    projectileImg.resize(60, 28.8);
    projectile.addImage(projectileImg);
    projectile.rotateToDirection = true;
    projectile.setSpeed(10, angle);
    projectile.startpoint = createVector(cx, cy);
    projectile.debug = false;
    projectile.life = 300
    projectiles.add(projectile);
}
function showCooldown() {
    let CD = coolDown / firingCoolDown * canvasHeight
    fill(0, 0, 0);
    noStroke();
    rect(0, 55, 10, canvasHeight - 55);
    fill(255 * (coolDown / firingCoolDown), 255 - (coolDown / firingCoolDown) * 255, 0);
    rect(0, CD + 55, 10, canvasHeight - CD - 55);
}
function controlProjectile() {
    for (let i = 0; i < projectiles.length; i++) {
        if (projectiles[i].overlap(explosions) || projectiles[i].overlap(enemies)) {
            projectiles[i].targetX = projectiles[i].position.x
            projectiles[i].targetY = projectiles[i].position.y
        }
        if (dist(projectiles[i].position.x, projectiles[i].position.y, projectiles[i].targetX, projectiles[i].targetY) < 10 || projectiles[i].position.y < projectiles[i].targetY) {
            let x = projectiles[i].position.x
            let y = projectiles[i].position.y
            projectiles[i].life = 1;
            createExplosion(x, y);
        }
    }
}
//Creating and controlling explosions
function createExplosion(x, y) {
    explosionAudio.play();
    explosion = createSprite(x, y, 100, 100);
    explosion.addAnimation('bang', explosionImg);
    explosion.positive = true;
    explosion.max = false;
    explosion.mScale = maxExplosion;
    explosion.setCollider('circle', 0, 0, 300)
    explosion.scale = 0.01 * screenScale;
    explosion.debug = false;
    explosion.changeAnimation('bang');
    explosions.add(explosion);
}
function governExplosion() {
    for (let i = 0; i < explosions.length; i++) {
        if (explosions[i].max == false) {
            explosions[i].scale += .0025 * screenScale
            explosions[i].life = 150;
            if (explosions[i].scale >= explosions[i].mScale && frameCount % 30 == 0) {
                explosions[i].max = true;
            }
        } else { explosions[i].scale -= explosions[i].scale / explosions[i].life }
        if (explosions[i].life == 10) {
        }
    }
}
//scorekeeping and showing functions
function scoreBoard() {
    fill(0, 0, 0, 85);
    noStroke();
    rect(0, 0, canvasWidth, 55);
    textSize(36);
    fill(255, 255, 255, 255);
    push();
    textAlign(LEFT, CENTER);
    text('Score ' + score, 0, canvasHeight / 30);
    pop();
    push();
    textAlign(RIGHT, CENTER);
    text("Wave " + (level + 1), canvasWidth, canvasHeight / 30);
    pop();
    push();
    textAlign(CENTER, CENTER);
    textSize(48);
    if (difficulty == 0) {
        fill('green');
        text("EASY", canvasWidth / 2, canvasHeight / 30);
    }
    if (difficulty == 1) {
        fill('yellow');
        text("MEDIUM", canvasWidth / 2, canvasHeight / 30);
    }
    if (difficulty == 2) {
        fill('red');
        text("HARD", canvasWidth / 2, canvasHeight / 30);
    }
    pop();
    if (transitioning) {
        fill(255, 255, 255, 75);
        if (backgroundImg.isPlaying == true) {
            backgroundImg.pause();
            backgroundImg.isPlaying = false;
        }
        rectMode(CENTER);
        rect(canvasWidth / 10, canvasHeight / 10, 150, 50);
        rect(canvasWidth / 10, canvasHeight / 2, 150, 50);
        rect(canvasWidth * 9 / 10, canvasHeight / 10, 150, 50);
        rect(canvasWidth * 9 / 10, canvasHeight / 2, 150, 50);
        textAlign(CENTER, CENTER);
        textSize(16);
        if (cost.firingCooldown > score) {
            fill(255, 0, 0);
        } else {
            fill(0, 255, 0);
        }
        text('- Cooldown' + cost.firingCooldown + ' [a]', canvasWidth / 10, canvasHeight / 10)
        if (cost.armour > score) {
            fill(255, 0, 0);
        } else {
            fill(0, 255, 0);
        }
        text('+ Armour ' + cost.armour + ' [z]', canvasWidth / 10, canvasHeight / 2)
        if (cost.maxAmmo > score) {
            fill(255, 0, 0);
        } else {
            fill(0, 255, 0);
        }
        text('+ Ammo ' + cost.maxAmmo + ' [d]', canvasWidth * 9 / 10, canvasHeight / 10);
        if (cost.explosion > score) {
            fill(255, 0, 0);
        } else {
            fill(0, 255, 0);
        }
        text("+Explosion " + cost.explosion + ' [c]', canvasWidth * 9 / 10, canvasHeight / 2);
    }
}
function drawScores() {
    fill(255, 255, 255);
    textSize(36)
    for (let i = 0; i < 10; i++) {
        if (highScore[i].name == playerName && highScore[i].score == score) {
            fill(255, 0, 0);
            textAlign(RIGHT, CENTER);
            text("New High Score         ", width / 3 - 100, height / 5 + (i * 60))
        } else {
            fill(255, 255, 255);
        }
        textAlign(LEFT, CENTER)
        text(highScore[i].position, width / 3 - 100, height / 5 + (i * 60))
        text(highScore[i].name, width / 3, height / 5 + (i * 60))
        text(highScore[i].score, width * 2 / 3, height / 5 + (i * 60))
    }
}
function showScore() {
    textSize(36)
    fill(255, 255, 255);
    textAlign(CENTER, CENTER);
    text("score " + score, canvasWidth / 2, canvasHeight / 2)
}
function checkHighScore() {
    let position;
    for (let i = 9; i >= 0; i--) {
        if (score > highScore[i].score) {
            position = i
        }
    }
    if (position >= 0 && position < 10) {
        for (let i = 9; i > position; i--) {
            highScore[i].name = highScore[i - 1].name;
            highScore[i].score = highScore[i - 1].score;
        }
        highScore[position].name = playerName;
        highScore[position].score = score;
        return true;
    } else {
        return false;
    }
}
//sets variables back to default and goes to main menu
function resetGame() {
    for (let i = turretGroup.length - 1; i >= 0; i--) {
        turretGroup[i].remove();
    }
    for (let i = cities.length - 1; i >= 0; i--) {
        cities[i].remove();
    }
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].remove();
    }
    if (saucerG.length > 0) {
        saucer.remove();
    }
    cost = defaultCost;
    score = 0;
    firingCoolDown = 60;
    maxAmmo = 10;
    maxExplosion = 0.1 * screenScale
    cityHealth = 1;
    go = false;
    menu = "mainMenu";
    SetupTurret();
    setupCities();
    level = 0;
    menuMusic.play();
}
//progression events that happen outside of a level
function endLevel() {
    if (frameCount > 0) {
        // image(backgroundImg, 0, 0, canvasWidth, canvasHeight);
        let ammoImg = 0;
        saucer.addSpeed(0.1, 90);
        for (let i = 0; i < turretGroup.length; i++) {
            ammoImg += turretGroup[i].ammo;
            turretGroup[i].addSpeed(0.5, 90)
        }
        for (let i = 0; i < cities.length; i++) {
            cities[i].addSpeed(0.1, 90)
        }
        for (let i = ammoImg - 1; i > 0; i--) {
            push();
            translate(canvasWidth / 2 + i * 10, canvasHeight / 2 - 50)
            rotate(270)
            imageMode(CENTER);
            image(projectileImg, 0, 0, 50, 10);
            pop();
        }
        for (let i = 0; i < turretGroup.length; i++) {
            push();
            translate(canvasWidth / 2 - 25, canvasHeight / 2 - turretGroup.length * 50 + 100 * i)
            rotate(270);
            imageMode(CENTER);
            image(turretImg, 0, 0, 100, 100);
            pop();
        }
        for (let i = 0; i < cities.length; i++) {
            imageMode(CENTER);
            image(protectImg, canvasWidth / 2 - 100, canvasHeight / 2 - cities.length * 50 + 100 * i);
        }
        if (frameCount % 10 == 0 && cities.length > 0) {
            if (turretGroup.length > 0) {
                if (turretGroup[turretGroup.length - 1].ammo > 0) {
                    score += round(5 * (1 + difficulty / 10 + level / 10))
                    turretGroup[turretGroup.length - 1].ammo--;
                } else if (turretGroup.length > 0 && frameCount % 20 == 0) {
                    score += round(10 * (1 + difficulty / 10 + level / 10))
                    turretGroup[turretGroup.length - 1].remove();
                    if (cities.length > 1 && frameCount % 40 == 0) {
                        score += round(15 * (1 + difficulty / 10 + level / 10))
                        cities[cities.length - 1].life = 1;
                    }
                }
            } else if (frameCount % 50 == 0 && cities.length > 0) {
                score += round(15 * (1 + difficulty / 10 + level / 10))
                cities[cities.length - 1].remove();
            }
        }
    } if (turretGroup.length == 0 && cities.length == 0) {
        fill(0, 0, 0, 125);
        noStroke();
        rect(0, canvasHeight / 2 - 90, canvasWidth, 150);
        textSize(36);
        textAlign(CENTER, CENTER);
        fill(255, 255, 255, 255);
        text('NEXT WAVE IN', canvasWidth / 2, canvasHeight / 2)
        if (countStarted == false) {
            levelTimer = 330;
        }
        levelCountDown();
    }
}
function levelCountDown() {
    countStarted = true;
    if (levelTimer > 0) {
        drawSprites();
        levelTimer--;
        fill(255, 255, 255, 150)
        textSize(150)
        text(int(levelTimer / 60), canvasWidth / 2, canvasHeight / 2)
    } else {
        newLevel();
        level++;
        countStarted = false;
    }
}
function endGame() {
    menu = "gameover"
}
function newLevel() {
    backgroundImg.loop();
    backgroundImg.isPlaying = true;
    setupCities();
    SetupTurret();
    enemiesRemain = 10 * (1 + difficulty / 2) * (1 + level / 3);
    transitioning = false;
}
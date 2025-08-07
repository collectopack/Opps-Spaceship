let spaceshipImg, enemyImg;
let spaceship;
let bullets = [];
let enemies = [];
let stars = [];
let fireParticles = [];
let explosions = [];
let deathExplosion = null;
let score = 0;
let highScore = 0;
let gameState = "start";
let enemySpeed = 2;
let speedTimer = 0;

let shootSound, hitSound, musicOsc, musicInterval, menuOsc, menuLoopInterval, gameOverSound;

let scaleFactor;

function preload() {
  spaceshipImg = loadImage("https://i.ibb.co/39gHbZDg/spaceship.png");
  enemyImg = loadImage("https://i.ibb.co/jkcsTM2n/enemy.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  scaleFactor = min(width, height) / 500; // Zoom factor based on screen size
  spaceship = new Spaceship();
  for (let i = 0; i < 100; i++) stars.push(new Star());
  setupSounds();
  loopMenuMusic();
  textFont("Courier New");
  noStroke();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(0);
  for (let s of stars) s.update();

  if (gameState === "start") {
    drawTitleScreen();
  } else if (gameState === "playing") {
    runGame();
  } else if (gameState === "gameover") {
    drawGameOver();
  }

  for (let fx of fireParticles) fx.update();
  fireParticles = fireParticles.filter(f => !f.done);

  for (let ex of explosions) ex.update();
  explosions = explosions.filter(e => !e.done);

  if (deathExplosion) {
    deathExplosion.update();
    deathExplosion.show();
    if (deathExplosion.done) deathExplosion = null;
  }
}

function drawTitleScreen() {
  fill("rgb(165,255,0)");
  textAlign(CENTER);
  textSize(40 * scaleFactor);
  text("✦", width / 2, height / 2 - 160 * scaleFactor);
  fill(255);
  textSize(36 * scaleFactor);
  textStyle(BOLD);
  text("OOPS SPACESHIP", width / 2, height / 2 - 100 * scaleFactor);
  fill("rgb(255,215,0)");
  textSize(40 * scaleFactor);
  text("✦", width / 2, height / 2 - 40 * scaleFactor);
  fill(255);
  textSize(28 * scaleFactor);
  text("TAP TO START", width / 2, height / 2 + 20 * scaleFactor);
  textStyle(NORMAL);
}

function drawGameOver() {
  fill("rgb(184,255,53)");
  textAlign(CENTER);
  textSize(40 * scaleFactor);
  textStyle(BOLD);
  text("✦", width / 2, height / 2 - 160 * scaleFactor);
  text("GAME OVER", width / 2, height / 2 - 100 * scaleFactor);
  textSize(30 * scaleFactor);
  text("OOPS SPACESHIP", width / 2, height / 2 - 40 * scaleFactor);
  textSize(24 * scaleFactor);
  text("SCORE: " + score, width / 2, height / 2 + 10 * scaleFactor);
  text("HIGH SCORE: " + highScore, width / 2, height / 2 + 50 * scaleFactor);
  fill("yellow");
  text("TAP TO RESTART", width / 2, height / 2 + 100 * scaleFactor);
  textStyle(NORMAL);
}

function runGame() {
  spaceship.update();
  spaceship.show();

  if (millis() - speedTimer > 2000) {
    enemySpeed += 0.2;
    speedTimer = millis();
  }

  if (frameCount % 6 === 0 && enemies.length < 10) {
    enemies.push(new Enemy());
  }

  for (let bullet of bullets) {
    bullet.update();
    bullet.show();
  }
  bullets = bullets.filter(b => !b.offscreen());

  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    e.update();
    e.show();

    for (let j = bullets.length - 1; j >= 0; j--) {
      if (e.hits(bullets[j])) {
        explosions.push(new Explosion(e.x, e.y));
        hitSound.start();
        hitSound.freq(600);
        setTimeout(() => hitSound.stop(), 100);
        bullets.splice(j, 1);
        enemies.splice(i, 1);
        score++;
        if (score > highScore) highScore = score;
        break;
      }
    }

    if (e.hitsShip(spaceship) && !deathExplosion) {
      deathExplosion = new Explosion(spaceship.x, spaceship.y);
      gameState = "gameover";
      stopMusic();
      stopMenuMusic();
      gameOverSound.start();
      gameOverSound.freq(200);
      setTimeout(() => gameOverSound.stop(), 500);
    }
  }

  fill(255);
  textAlign(LEFT);
  textSize(20 * scaleFactor);
  textStyle(BOLD);
  text("SCORE: " + score, 10, 30);
  text("HIGH: " + highScore, 10, 60);
  textStyle(NORMAL);
}

function shoot() {
  bullets.push(new Bullet(spaceship.x, spaceship.y - 30 * scaleFactor));
  for (let i = 0; i < 100; i++) {
    fireParticles.push(new FireParticle(spaceship.x, spaceship.y - 30 * scaleFactor));
  }
  shootSound.start();
  shootSound.freq(880);
  setTimeout(() => shootSound.stop(), 100);
}

function mousePressed() { handleInput(); }
function touchStarted() { handleInput(); }

function touchMoved() {
  if (touches.length > 0) {
    spaceship.x = touches[0].x;
  }
  return false;
}

function mouseDragged() {
  spaceship.x = mouseX;
}

function handleInput() {
  if (gameState === "start") {
    gameState = "playing";
    resetGame();
    stopMenuMusic();
    loopMusic();
  } else if (gameState === "gameover") {
    gameState = "playing";
    resetGame();
    loopMusic();
  } else {
    shoot();
  }
}

class Spaceship {
  constructor() {
    this.x = width / 2;
    this.y = height - 240 * scaleFactor;
    this.size = 80 * scaleFactor;
  }
  update() {
    if (mouseIsPressed) {
      this.x = constrain(mouseX, this.size / 2, width - this.size / 2);
    } else if (touches.length > 0) {
      this.x = constrain(touches[0].x, this.size / 2, width - this.size / 2);
    }
  }
  show() {
    imageMode(CENTER);
    image(spaceshipImg, this.x, this.y, this.size, this.size);
  }
}

class Enemy {
  constructor() {
    this.x = random(50, width - 50);
    this.y = -30;
    this.size = 47 * scaleFactor;
  }
  update() {
    this.y += enemySpeed;
    if (this.y > height + 100) {
      enemies.splice(enemies.indexOf(this), 1);
    }
  }
  show() {
    imageMode(CENTER);
    image(enemyImg, this.x, this.y, this.size, this.size);
  }
  hits(bullet) {
    return dist(this.x, this.y, bullet.x, bullet.y) < this.size / 2;
  }
  hitsShip(ship) {
    return dist(this.x, this.y, ship.x, ship.y) < (this.size + ship.size) / 2.5;
  }
}

class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  update() {
    this.y -= 10 * scaleFactor;
  }
  show() {
    fill(255, 100, 0);
    ellipse(this.x, this.y, 10 * scaleFactor, 20 * scaleFactor);
  }
  offscreen() {
    return this.y < 0;
  }
}

class FireParticle {
  constructor(x, y) {
    this.x = x + random(-10, 10);
    this.y = y + random(-10, 10);
    this.alpha = 255;
    this.size = random(4, 9) * scaleFactor;
    this.dx = random(-0.5, 0.5);
    this.dy = random(-2, -1);
  }
  update() {
    this.x += this.dx;
    this.y += this.dy;
    this.alpha -= 6;
    this.show();
  }
  get done() {
    return this.alpha <= 0;
  }
  show() {
    noStroke();
    fill(255, 120, 0, this.alpha);
    ellipse(this.x, this.y, this.size);
  }
}

class Explosion {
  constructor(x, y) {
    this.particles = [];
    for (let i = 0; i < 50; i++) {
      this.particles.push({
        x: x,
        y: y,
        dx: random(-4, 4),
        dy: random(-4, 4),
        alpha: 255
      });
    }
  }
  update() {
    for (let p of this.particles) {
      p.x += p.dx;
      p.y += p.dy;
      p.alpha -= 7;
      fill(255, 50, 0, p.alpha);
      ellipse(p.x, p.y, 10 * scaleFactor);
    }
  }
  get done() {
    return this.particles.every(p => p.alpha <= 0);
  }
  show() {
    for (let p of this.particles) {
      fill(255, 50, 0, p.alpha);
      ellipse(p.x, p.y, 10 * scaleFactor);
    }
  }
}

class Star {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.size = random(1, 3) * scaleFactor;
  }
  update() {
    this.y += 2 * scaleFactor;
    if (this.y > height) this.y = 0;
    fill(255);
    noStroke();
    ellipse(this.x, this.y, this.size);
  }
}

function resetGame() {
  spaceship = new Spaceship();
  spaceship.y = height - 240 * scaleFactor; // 👈 Force new Y position
  bullets = [];
  enemies = [];
  explosions = [];
  fireParticles = [];
  deathExplosion = null;
  score = 0;
  enemySpeed = 2;
  speedTimer = millis();
}

function setupSounds() {
  shootSound = new p5.Oscillator('triangle');
  hitSound = new p5.Oscillator('square');
  musicOsc = new p5.Oscillator('sine');
  menuOsc = new p5.Oscillator('triangle');
  gameOverSound = new p5.Oscillator('sine');
}

function loopMusic() {
  musicOsc.start();
  musicInterval = setInterval(() => {
    musicOsc.freq(random(300, 500));
    setTimeout(() => musicOsc.freq(200), 100);
  }, 400);
}

function stopMusic() {
  musicOsc.stop();
  clearInterval(musicInterval);
}

function loopMenuMusic() {
  menuOsc.start();
  menuLoopInterval = setInterval(() => {
    menuOsc.freq(random(150, 300));
    setTimeout(() => menuOsc.freq(100), 120);
  }, 600);
}

function stopMenuMusic() {
  menuOsc.stop();
  clearInterval(menuLoopInterval);
}

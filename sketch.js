// Tank Arcade Game
// All assets and sprites are created programmatically with p5.js

let player;
let enemies = [];
let bullets = [];
let explosions = [];
let obstacles = [];
let gameState = "start"; // start, playing, gameOver
let score = 0;
let spawnTimer = 0;
let difficultyTimer = 0;
let difficulty = 1;
let sounds = {};

// Map configuration
const gridSize = 20;
const mapWidth = 40;
const mapHeight = 30;
let gameMap = [];

function setup() {
  createCanvas(800, 600);
  angleMode(DEGREES);
  
  // Initialize sound objects
  sounds.shoot = {
    play: function() {
      let osc = new p5.Oscillator('sine');
      osc.freq(880);
      osc.amp(0.1);
      osc.start();
      osc.amp(0, 0.2);
      setTimeout(() => osc.stop(), 200);
    }
  };
  
  sounds.explosion = {
    play: function() {
      let osc = new p5.Oscillator('sawtooth');
      osc.freq(150);
      osc.amp(0.2);
      osc.start();
      osc.freq(50, 0.3);
      osc.amp(0, 0.3);
      setTimeout(() => osc.stop(), 300);
    }
  };
  
  sounds.hit = {
    play: function() {
      let osc = new p5.Oscillator('square');
      osc.freq(440);
      osc.amp(0.1);
      osc.start();
      osc.freq(220, 0.2);
      osc.amp(0, 0.2);
      setTimeout(() => osc.stop(), 200);
    }
  };
  
  resetGame();
}

function resetGame() {
  // Create the map
  createMap();
  
  // Create player
  player = new PlayerTank(width / 2, height / 2, 100);
  
  // Reset game variables
  enemies = [];
  bullets = [];
  explosions = [];
  score = 0;
  spawnTimer = 0;
  difficultyTimer = 0;
  difficulty = 1;
}

function createMap() {
  // Initialize empty map
  gameMap = Array(mapHeight).fill().map(() => Array(mapWidth).fill(0));
  obstacles = [];
  
  // Add border walls
  for (let x = 0; x < mapWidth; x++) {
    gameMap[0][x] = 1; // Top wall
    obstacles.push({x: x * gridSize, y: 0, type: 1});
    
    gameMap[mapHeight - 1][x] = 1; // Bottom wall
    obstacles.push({x: x * gridSize, y: (mapHeight - 1) * gridSize, type: 1});
  }
  
  for (let y = 0; y < mapHeight; y++) {
    gameMap[y][0] = 1; // Left wall
    obstacles.push({x: 0, y: y * gridSize, type: 1});
    
    gameMap[y][mapWidth - 1] = 1; // Right wall
    obstacles.push({x: (mapWidth - 1) * gridSize, y: y * gridSize, type: 1});
  }
  
  // Add random obstacles
  for (let i = 0; i < 60; i++) {
    let x = floor(random(2, mapWidth - 2));
    let y = floor(random(2, mapHeight - 2));
    
    // Avoid placing obstacles too close to player spawn
    if (dist(x * gridSize, y * gridSize, width / 2, height / 2) < 100) continue;
    
    // Random obstacle type (1=wall, 2=destructible)
    let type = random() < 0.3 ? 1 : 2;
    gameMap[y][x] = type;
    obstacles.push({x: x * gridSize, y: y * gridSize, type: type});
  }
}

function draw() {
  background(20);
  
  if (gameState === "start") {
    drawStartScreen();
  } else if (gameState === "playing") {
    updateGame();
    drawGame();
  } else if (gameState === "gameOver") {
    drawGameOverScreen();
  }
}

function drawStartScreen() {
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(40);
  text("TANK ARCADE", width / 2, height / 3);
  
  textSize(20);
  text("WASD or Arrow Keys to move", width / 2, height / 2 - 20);
  text("Mouse to aim, Click to shoot", width / 2, height / 2 + 10);
  text("Press ENTER to start", width / 2, height / 2 + 60);
}

function drawGameOverScreen() {
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(40);
  text("GAME OVER", width / 2, height / 3);
  
  textSize(30);
  text("Score: " + score, width / 2, height / 2);
  
  textSize(20);
  text("Press ENTER to restart", width / 2, height / 2 + 60);
}

function updateGame() {
  // Update player
  player.update();
  
  // Spawn enemies
  spawnTimer++;
  if (spawnTimer > 180 / difficulty) { // Spawn every 3 seconds at difficulty 1, faster at higher difficulties
    spawnEnemy();
    spawnTimer = 0;
  }
  
  // Increase difficulty over time
  difficultyTimer++;
  if (difficultyTimer > 1800) { // Every 30 seconds
    difficulty = min(difficulty + 0.5, 5); // Cap at difficulty 5
    difficultyTimer = 0;
  }
  
  // Update enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].update();
    
    // Remove dead enemies
    if (enemies[i].health <= 0) {
      score += 10;
      createExplosion(enemies[i].x, enemies[i].y);
      sounds.explosion.play();
      enemies.splice(i, 1);
    }
  }
  
  // Update bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update();
    
    // Remove bullets that have expired or hit something
    if (bullets[i].expired) {
      bullets.splice(i, 1);
    }
  }
  
  // Update explosions
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].update();
    
    // Remove finished explosions
    if (explosions[i].finished) {
      explosions.splice(i, 1);
    }
  }
  
  // Check if player is dead
  if (player.health <= 0 && gameState === "playing") {
    createExplosion(player.x, player.y);
    sounds.explosion.play();
    gameState = "gameOver";
  }
}

function drawGame() {
  // Draw map
  drawMap();
  
  // Draw bullets
  for (let bullet of bullets) {
    bullet.draw();
  }
  
  // Draw enemies
  for (let enemy of enemies) {
    enemy.draw();
  }
  
  // Draw player
  player.draw();
  
  // Draw explosions
  for (let explosion of explosions) {
    explosion.draw();
  }
  
  // Draw UI
  drawUI();
}

function drawMap() {
  for (let obstacle of obstacles) {
    if (obstacle.type === 1) {
      // Solid wall
      fill(80);
      stroke(40);
      rect(obstacle.x, obstacle.y, gridSize, gridSize);
      
      // Add detail to walls
      fill(90);
      noStroke();
      rect(obstacle.x + 2, obstacle.y + 2, gridSize - 4, gridSize - 4);
    } else if (obstacle.type === 2) {
      // Destructible wall
      fill(139, 69, 19); // Brown
      stroke(40);
      rect(obstacle.x, obstacle.y, gridSize, gridSize);
      
      // Brick pattern
      stroke(60, 30, 10);
      line(obstacle.x + gridSize/2, obstacle.y, obstacle.x + gridSize/2, obstacle.y + gridSize);
      line(obstacle.x, obstacle.y + gridSize/2, obstacle.x + gridSize, obstacle.y + gridSize/2);
    }
  }
}

function drawUI() {
  // Health bar
  fill(0, 0, 0, 150);
  rect(20, 20, 150, 20);
  
  let healthWidth = map(player.health, 0, 100, 0, 146);
  fill(255, 0, 0);
  rect(22, 22, healthWidth, 16);
  
  // Score
  fill(255);
  textAlign(LEFT, TOP);
  textSize(16);
  text("SCORE: " + score, 20, 45);
  
  // Difficulty
  text("LEVEL: " + floor(difficulty), 20, 65);
}

function spawnEnemy() {
  let spawnX, spawnY;
  let validSpawn = false;
  
  // Try to find a valid spawn position away from player
  while (!validSpawn) {
    // Random position along the edges of the map, but not on the very edge
    if (random() < 0.5) {
      // Spawn on top or bottom
      spawnX = floor(random(2, mapWidth - 2)) * gridSize;
      spawnY = random() < 0.5 ? 2 * gridSize : (mapHeight - 3) * gridSize;
    } else {
      // Spawn on left or right
      spawnX = random() < 0.5 ? 2 * gridSize : (mapWidth - 3) * gridSize;
      spawnY = floor(random(2, mapHeight - 2)) * gridSize;
    }
    
    // Check if spawn point is far enough from player
    if (dist(spawnX, spawnY, player.x, player.y) > 200) {
      validSpawn = true;
      
      // Check if spawn point collides with obstacles
      let gridX = floor(spawnX / gridSize);
      let gridY = floor(spawnY / gridSize);
      
      if (gameMap[gridY][gridX] !== 0) {
        validSpawn = false;
      }
    }
  }
  
  // Create enemy
  let health = 30 + difficulty * 10; // Enemies get stronger with difficulty
  let enemy = new EnemyTank(spawnX, spawnY, health);
  enemies.push(enemy);
}

function createExplosion(x, y) {
  explosions.push(new Explosion(x, y));
}

function keyPressed() {
  if (gameState === "start" && (keyCode === ENTER || keyCode === RETURN)) {
    gameState = "playing";
  } else if (gameState === "gameOver" && (keyCode === ENTER || keyCode === RETURN)) {
    resetGame();
    gameState = "playing";
  }
}

// Base Tank class
class Tank {
  constructor(x, y, health) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.speed = 0;
    this.maxSpeed = 2;
    this.rotationSpeed = 3;
    this.heading = 0; // Direction the tank is facing
    this.turretAngle = 0; // Direction the turret is facing
    this.health = health;
    this.maxHealth = health;
    this.reloadTime = 0;
  }
  
  update() {
    // Update position based on heading and speed
    this.x += cos(this.heading) * this.speed;
    this.y += sin(this.heading) * this.speed;
    
    // Handle collisions with obstacles
    this.handleObstacleCollisions();
    
    // Update reload timer
    if (this.reloadTime > 0) {
      this.reloadTime--;
    }
  }
  
  handleObstacleCollisions() {
    // Make sure tank stays within the canvas
    this.x = constrain(this.x, this.width/2, width - this.width/2);
    this.y = constrain(this.y, this.height/2, height - this.height/2);
    
    // Check collisions with obstacles
    for (let obstacle of obstacles) {
      if (this.collidesWith(obstacle.x, obstacle.y, gridSize, gridSize)) {
        // Push tank away from obstacle
        let dx = this.x - (obstacle.x + gridSize/2);
        let dy = this.y - (obstacle.y + gridSize/2);
        let angle = atan2(dy, dx);
        
        this.x = obstacle.x + gridSize/2 + cos(angle) * (this.width/2 + gridSize/2 + 1);
        this.y = obstacle.y + gridSize/2 + sin(angle) * (this.height/2 + gridSize/2 + 1);
      }
    }
  }
  
  collidesWith(x, y, w, h) {
    return (
      this.x - this.width/2 < x + w &&
      this.x + this.width/2 > x &&
      this.y - this.height/2 < y + h &&
      this.y + this.height/2 > y
    );
  }
  
  shoot() {
    if (this.reloadTime <= 0) {
      // Create bullet at the end of the turret
      let bulletX = this.x + cos(this.turretAngle) * 20;
      let bulletY = this.y + sin(this.turretAngle) * 20;
      
      // Create a new bullet
      let bullet = new Bullet(bulletX, bulletY, this.turretAngle, this === player);
      bullets.push(bullet);
      
      // Reset reload timer
      this.reloadTime = 30; // Half a second at 60fps
      
      // Play shoot sound
      sounds.shoot.play();
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    sounds.hit.play();
  }
  
  draw() {
    push();
    translate(this.x, this.y);
    
    // Draw tank body
    rotate(this.heading);
    this.drawBody();
    
    // Draw turret
    rotate(-this.heading); // Undo body rotation
    rotate(this.turretAngle);
    this.drawTurret();
    
    pop();
    
    // Draw health bar above tank
    this.drawHealthBar();
  }
  
  drawBody() {
    // Override in subclasses
  }
  
  drawTurret() {
    // Override in subclasses
  }
  
  drawHealthBar() {
    let healthWidth = map(this.health, 0, this.maxHealth, 0, 30);
    fill(0, 0, 0, 150);
    rect(this.x - 15, this.y - 25, 30, 5);
    
    fill(255, 0, 0);
    rect(this.x - 15, this.y - 25, healthWidth, 5);
  }
}

// Player Tank class
class PlayerTank extends Tank {
  constructor(x, y, health) {
    super(x, y, health);
    this.maxSpeed = 2.5;
    this.rotationSpeed = 3;
  }
  
  update() {
    // Handle player input
    this.handleInput();
    
    // Update turret angle based on mouse position
    let dx = mouseX - this.x;
    let dy = mouseY - this.y;
    this.turretAngle = atan2(dy, dx);
    
    super.update();
  }
  
  handleInput() {
    // Movement
    let moving = false;
    
    if (keyIsDown(UP_ARROW) || keyIsDown(87)) { // Up arrow or W
      this.speed = this.maxSpeed;
      moving = true;
    } else if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) { // Down arrow or S
      this.speed = -this.maxSpeed * 0.7; // Slower backward movement
      moving = true;
    }
    
    if (!moving) {
      // Apply friction when not actively moving
      this.speed *= 0.8;
    }
    
    // Rotation
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { // Left arrow or A
      this.heading -= this.rotationSpeed;
    }
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { // Right arrow or D
      this.heading += this.rotationSpeed;
    }
    
    // Shoot with mouse
    if (mouseIsPressed && mouseButton === LEFT) {
      this.shoot();
    }
  }
  
  drawBody() {
    // Tank body
    fill(30, 100, 180); // Blue for player
    stroke(20, 60, 120);
    strokeWeight(1);
    rect(-15, -15, 30, 30, 3);
    
    // Tank treads
    fill(50);
    stroke(30);
    rect(-17, -12, 4, 24, 2); // Left tread
    rect(13, -12, 4, 24, 2);  // Right tread
    
    // Tank details
    fill(40, 120, 200);
    noStroke();
    rect(-10, -10, 20, 20, 2);
  }
  
  drawTurret() {
    // Turret base
    fill(40, 130, 220);
    stroke(20, 80, 160);
    strokeWeight(1);
    ellipse(0, 0, 16, 16);
    
    // Cannon
    fill(30, 90, 180);
    rect(0, -3, 20, 6, 1);
  }
}

// Enemy Tank class
class EnemyTank extends Tank {
  constructor(x, y, health) {
    super(x, y, health);
    this.maxSpeed = 1 + random(0.5); // Slightly random speed
    this.rotationSpeed = 2;
    this.shootCooldown = floor(random(60, 120)); // Random initial cooldown
    this.behavior = random(["chase", "patrol"]);
    this.patrolAngle = random(360);
    this.patrolTimer = 0;
    this.patrolDuration = random(60, 180);
  }
  
  update() {
    // Update AI behavior
    if (this.behavior === "chase") {
      this.chasePlayer();
    } else {
      this.patrol();
    }
    
    // Occasionally change behavior
    if (random(1000) < 5) {
      this.behavior = this.behavior === "chase" ? "patrol" : "chase";
    }
    
    // Update shoot cooldown
    this.shootCooldown--;
    if (this.shootCooldown <= 0) {
      // Try to shoot at player
      let dx = player.x - this.x;
      let dy = player.y - this.y;
      this.turretAngle = atan2(dy, dx);
      
      // Only shoot if facing generally towards the player
      let angleDiff = abs((this.turretAngle - this.heading + 360) % 360 - 180);
      if (angleDiff < 45 && random() < 0.7) {
        this.shoot();
      }
      
      // Reset cooldown
      this.shootCooldown = floor(random(90, 150) / difficulty);
    }
    
    super.update();
  }
  
  chasePlayer() {
    // Calculate angle to player
    let dx = player.x - this.x;
    let dy = player.y - this.y;
    let angleToPlayer = atan2(dy, dx);
    
    // Smoothly rotate towards player
    let angleDiff = (angleToPlayer - this.heading + 360) % 360;
    if (angleDiff > 180) angleDiff -= 360;
    
    if (abs(angleDiff) > 5) {
      this.heading += angleDiff > 0 ? this.rotationSpeed : -this.rotationSpeed;
    } else {
      this.heading = angleToPlayer;
    }
    
    // Move forward if facing player
    if (abs(angleDiff) < 30) {
      this.speed = this.maxSpeed;
    } else {
      this.speed *= 0.9; // Slow down when turning
    }
    
    // Point turret at player
    this.turretAngle = angleToPlayer;
  }
  
  patrol() {
    this.patrolTimer++;
    
    if (this.patrolTimer > this.patrolDuration) {
      // Change patrol direction
      this.patrolAngle = random(360);
      this.patrolTimer = 0;
      this.patrolDuration = random(60, 180);
    }
    
    // Rotate towards patrol angle
    let angleDiff = (this.patrolAngle - this.heading + 360) % 360;
    if (angleDiff > 180) angleDiff -= 360;
    
    if (abs(angleDiff) > 5) {
      this.heading += angleDiff > 0 ? this.rotationSpeed : -this.rotationSpeed;
    } else {
      this.heading = this.patrolAngle;
    }
    
    // Move forward if not turning much
    if (abs(angleDiff) < 30) {
      this.speed = this.maxSpeed * 0.7; // Move slower when patrolling
    } else {
      this.speed *= 0.9;
    }
    
    // Rotate turret
    this.turretAngle += 1;
    
    // Still look at player occasionally
    if (random(100) < 20) {
      let dx = player.x - this.x;
      let dy = player.y - this.y;
      this.turretAngle = atan2(dy, dx);
    }
  }
  
  drawBody() {
    // Tank body
    fill(180, 60, 60); // Red for enemy
    stroke(120, 40, 40);
    strokeWeight(1);
    rect(-15, -15, 30, 30, 3);
    
    // Tank treads
    fill(50);
    stroke(30);
    rect(-17, -12, 4, 24, 2); // Left tread
    rect(13, -12, 4, 24, 2);  // Right tread
    
    // Tank details
    fill(200, 70, 70);
    noStroke();
    rect(-10, -10, 20, 20, 2);
  }
  
  drawTurret() {
    // Turret base
    fill(220, 80, 80);
    stroke(160, 40, 40);
    strokeWeight(1);
    ellipse(0, 0, 16, 16);
    
    // Cannon
    fill(180, 60, 60);
    rect(0, -3, 20, 6, 1);
  }
}

// Bullet class
class Bullet {
  constructor(x, y, angle, isPlayerBullet) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = 6;
    this.size = 5;
    this.expired = false;
    this.isPlayerBullet = isPlayerBullet;
    this.damage = isPlayerBullet ? 15 : 10;
  }
  
  update() {
    // Move bullet
    this.x += cos(this.angle) * this.speed;
    this.y += sin(this.angle) * this.speed;
    
    // Check if bullet is out of bounds
    if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
      this.expired = true;
      return;
    }
    
    // Check collisions with obstacles
    this.checkObstacleCollisions();
    
    // Check collisions with tanks
    if (this.isPlayerBullet) {
      this.checkEnemyCollisions();
    } else {
      this.checkPlayerCollision();
    }
  }
  
  checkObstacleCollisions() {
    let gridX = floor(this.x / gridSize);
    let gridY = floor(this.y / gridSize);
    
    // Check bounds
    if (gridX < 0 || gridX >= mapWidth || gridY < 0 || gridY >= mapHeight) {
      return;
    }
    
    if (gameMap[gridY][gridX] !== 0) {
      // Bullet hit an obstacle
      this.expired = true;
      
      // If destructible wall, damage it
      if (gameMap[gridY][gridX] === 2) {
        gameMap[gridY][gridX] = 0;
        
        // Remove the obstacle from the obstacles array
        for (let i = obstacles.length - 1; i >= 0; i--) {
          if (obstacles[i].x === gridX * gridSize && obstacles[i].y === gridY * gridSize) {
            obstacles.splice(i, 1);
            break;
          }
        }
      }
      
      // Create small explosion effect
      let explosion = new Explosion(this.x, this.y, 0.5);
      explosions.push(explosion);
    }
  }
  
  checkEnemyCollisions() {
    for (let enemy of enemies) {
      let d = dist(this.x, this.y, enemy.x, enemy.y);
      if (d < enemy.width / 2 + this.size / 2) {
        // Hit an enemy
        enemy.takeDamage(this.damage);
        this.expired = true;
        return;
      }
    }
  }
  
  checkPlayerCollision() {
    let d = dist(this.x, this.y, player.x, player.y);
    if (d < player.width / 2 + this.size / 2) {
      // Hit the player
      player.takeDamage(this.damage);
      this.expired = true;
      
      // Add screen shake
      // (would need to implement a screen shake system)
    }
  }
  
  draw() {
    fill(255);
    noStroke();
    ellipse(this.x, this.y, this.size, this.size);
    
    // Add trail effect
    fill(255, 200);
    ellipse(this.x - cos(this.angle) * this.speed * 0.5, 
            this.y - sin(this.angle) * this.speed * 0.5, 
            this.size * 0.7, this.size * 0.7);
  }
}

// Explosion class
class Explosion {
  constructor(x, y, scale = 1.0) {
    this.x = x;
    this.y = y;
    this.size = 5;
    this.maxSize = 40 * scale;
    this.growthRate = 2;
    this.alpha = 255;
    this.finished = false;
    this.stage = 0; // 0 = growing, 1 = fading
    this.particles = [];
    
    // Create particles
    let particleCount = floor(10 * scale);
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: random(-3, 3) * scale,
        vy: random(-3, 3) * scale,
        size: random(2, 6) * scale,
        alpha: 255,
        decay: random(3, 7)
      });
    }
  }
  
  update() {
    if (this.stage === 0) {
      // Growing stage
      this.size += this.growthRate;
      if (this.size >= this.maxSize) {
        this.stage = 1;
      }
    } else {
      // Fading stage
      this.alpha -= 10;
      if (this.alpha <= 0) {
        this.finished = true;
      }
    }
    
    // Update particles
    for (let particle of this.particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.alpha -= particle.decay;
    }
  }
  
  draw() {
    // Draw explosion circle
    noStroke();
    fill(255, 150, 50, this.alpha);
    ellipse(this.x, this.y, this.size, this.size);
    
    // Draw inner circle
    fill(255, 200, 50, this.alpha * 0.8);
    ellipse(this.x, this.y, this.size * 0.7, this.size * 0.7);
    
    // Draw core
    fill(255, this.alpha);
    ellipse(this.x, this.y, this.size * 0.3, this.size * 0.3);
    
    // Draw particles
    for (let particle of this.particles) {
      if (particle.alpha > 0) {
        fill(255, 150, 50, particle.alpha);
        ellipse(particle.x, particle.y, particle.size, particle.size);
      }
    }
  }
}

function mousePressed() {
  if (gameState === "playing") {
    player.shoot();
    return false; // Prevent default
  }
}
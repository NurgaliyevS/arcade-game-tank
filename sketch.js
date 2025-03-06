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

// Leaderboard variables
let leaderboard = [];
let showEmailInput = false;
let emailInput = "";
let isSubmittingScore = false;
let submitMessage = "";
let submitMessageTimer = 0;

// Sound variables
let soundEnabled = false;
let laserOsc;
let explosionOsc;
let thrusterOsc;  // Thruster sound
let rotationOsc;  // Rotation sound
let brakeOsc;     // Brake sound
let gameOverOsc;

// Map configuration
const gridSize = 20;
const mapWidth = 40;
const mapHeight = 30;
let gameMap = [];

// Add to global variables
let soundButton = { x: 750, y: 20, width: 30, height: 30 };

// Ensure audio context is started on user interaction
window.addEventListener("click", function () {
  if (typeof getAudioContext === "function") {
    getAudioContext().resume();
    soundEnabled = true;
  }
});

// Also try to enable sound on keypress
window.addEventListener("keydown", function () {
  if (typeof getAudioContext === "function") {
    getAudioContext().resume();
    soundEnabled = true;
  }
});

function setup() {
  createCanvas(1000, 600); // Increased width to accommodate leaderboard
  angleMode(DEGREES);

  setupSound();
  resetGame();
  fetchLeaderboard();
  
  // Start the game immediately
  gameState = "playing";
}

function setupSound() {
  try {
    // Try to initialize audio context
    if (typeof getAudioContext === "function") {
      getAudioContext().resume();
    }
    
    soundEnabled = true;
    console.log("Setting up sound system...");
    
    // Laser sound oscillator
    laserOsc = new p5.Oscillator("square");
    laserOsc.amp(0);

    // Explosion sound
    explosionOsc = new p5.Noise();
    explosionOsc.amp(0);

    // Thruster sound
    thrusterOsc = new p5.Oscillator("square");
    thrusterOsc.freq(200);
    thrusterOsc.amp(0);

    // Rotation sound
    rotationOsc = new p5.Oscillator("sawtooth");
    rotationOsc.amp(0);

    // Brake sound
    brakeOsc = new p5.Oscillator("triangle");
    brakeOsc.amp(0);

    // Game over sound
    gameOverOsc = new p5.Oscillator("square");
    gameOverOsc.amp(0);

    // Start all oscillators if sound is enabled
    if (soundEnabled) {
      console.log("Starting sound oscillators...");
      laserOsc.start();
      explosionOsc.start();
      thrusterOsc.start();
      rotationOsc.start();
      brakeOsc.start();
      gameOverOsc.start();
      
      // Test sound to verify it's working
      setTimeout(function() {
        console.log("Playing test sound...");
        playTestSound();
      }, 1000);
    }
  } catch (e) {
    console.error("Sound system not available:", e);
    soundEnabled = false;
  }
}

// Play a test sound to verify sound is working
function playTestSound() {
  if (soundEnabled && gameOverOsc) {
    gameOverOsc.freq(440);
    gameOverOsc.amp(0.1, 0.1);
    setTimeout(() => gameOverOsc.amp(0, 0.5), 300);
  }
}

// Play laser sound
function playLaserSound() {
  if (soundEnabled && laserOsc) {
    try {
      laserOsc.freq(880);
      laserOsc.amp(0.2, 0.01); // Increased volume and faster attack
      laserOsc.amp(0, 0.1);
      console.log("Playing laser sound");
    } catch (e) {
      console.error("Error playing laser sound:", e);
    }
  }
}

// Play explosion sound
function playExplosionSound() {
  if (soundEnabled && explosionOsc) {
    try {
      explosionOsc.amp(0.4, 0.01); // Increased volume and faster attack
      explosionOsc.amp(0, 0.3);
      console.log("Playing explosion sound");
    } catch (e) {
      console.error("Error playing explosion sound:", e);
    }
  }
}

// Update engine sounds based on movement
function updateEngineSound() {
  if (soundEnabled) {
    try {
      // Thruster sound (Up/W key) with frequency modulation
      if (keyIsDown(UP_ARROW) || keyIsDown(87)) {
        let baseFreq = 200;
        let modulation = 20 * sin(millis() * 0.01);
        thrusterOsc.freq(baseFreq + modulation);
        thrusterOsc.amp(0.1, 0.1); // Increased volume
      } else {
        thrusterOsc.amp(0, 0.1);
      }
      
      // Rotation sound (Left/Right Arrow or A/D)
      if (keyIsDown(LEFT_ARROW) || keyIsDown(RIGHT_ARROW) || keyIsDown(65) || keyIsDown(68)) {
        rotationOsc.freq(400);
        rotationOsc.amp(0.06, 0.1); // Increased volume
      } else {
        rotationOsc.amp(0, 0.1);
      }
      
      // Brake sound (Down Arrow or S)
      if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) {
        brakeOsc.freq(300);
        brakeOsc.amp(0.08, 0.1); // Increased volume
      } else {
        brakeOsc.amp(0, 0.1);
      }
    } catch (e) {
      console.error("Error updating engine sounds:", e);
    }
  }
}

// Play game over sound sequence
function playGameOverSound() {
  if (soundEnabled && gameOverOsc) {
    try {
      console.log("Playing game over sound");
      const sequence = [
        { freq: 440, duration: 100 },
        { freq: 349.23, duration: 100 },
        { freq: 293.66, duration: 100 },
        { freq: 261.63, duration: 300 },
        { freq: 207.65, duration: 400 }
      ];
      let totalDelay = 0;
      sequence.forEach(({ freq, duration }) => {
        setTimeout(() => {
          gameOverOsc.freq(freq);
          gameOverOsc.amp(0.3, 0.05); // Increased volume and faster attack
          setTimeout(() => gameOverOsc.amp(0, 0.1), duration - 50);
        }, totalDelay);
        totalDelay += duration;
      });
    } catch (e) {
      console.error("Error playing game over sound:", e);
    }
  }
}

// Stop all sounds
function stopAllSounds() {
  if (soundEnabled) {
    thrusterOsc.amp(0, 0.1);
    rotationOsc.amp(0, 0.1);
    brakeOsc.amp(0, 0.1);
    gameOverOsc.amp(0, 0.1);
  }
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
  showEmailInput = false;
  emailInput = '';
  isSubmittingScore = false;
  submitMessage = '';
  submitMessageTimer = 0;
  
  // Set game state to playing (in case this is called from game over)
  gameState = "playing";
}

// Fetch leaderboard data from our API
function fetchLeaderboard() {
  const apiUrl =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? "http://localhost:3000/api/leaderboard"
      : window.location.origin + "/api/leaderboard";

  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      leaderboard = data;
      console.log("Leaderboard data loaded:", data);
    })
    .catch((error) => {
      console.error("Error fetching leaderboard:", error);
    });
}

// Submit score to the leaderboard
function submitScore(email, score) {
  isSubmittingScore = true;

  const apiUrl =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? "http://localhost:3000/api/submit-score"
      : window.location.origin + "/api/submit-score";

  fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, score }),
  })
    .then((response) => response.json())
    .then((data) => {
      isSubmittingScore = false;
      submitMessage = data.message || "Score submitted!";
      submitMessageTimer = 120; // Show message for 2 seconds
      fetchLeaderboard(); // Refresh leaderboard
    })
    .catch((error) => {
      console.error("Error submitting score:", error);
      isSubmittingScore = false;
      submitMessage = "Error submitting score";
      submitMessageTimer = 120;
    });
}

// Add this function to check if email is valid
function isValidEmail(email) {
  // Simple email validation - must contain @ and at least one dot after @
  return (
    email.includes("@") &&
    email.indexOf(".", email.indexOf("@")) > email.indexOf("@")
  );
}

function createMap() {
  // Initialize empty map
  gameMap = Array(mapHeight)
    .fill()
    .map(() => Array(mapWidth).fill(0));
  obstacles = [];

  // Add border walls
  for (let x = 0; x < mapWidth; x++) {
    gameMap[0][x] = 1; // Top wall
    obstacles.push({ x: x * gridSize, y: 0, type: 1 });

    gameMap[mapHeight - 1][x] = 1; // Bottom wall
    obstacles.push({ x: x * gridSize, y: (mapHeight - 1) * gridSize, type: 1 });
  }

  for (let y = 0; y < mapHeight; y++) {
    gameMap[y][0] = 1; // Left wall
    obstacles.push({ x: 0, y: y * gridSize, type: 1 });

    gameMap[y][mapWidth - 1] = 1; // Right wall
    obstacles.push({ x: (mapWidth - 1) * gridSize, y: y * gridSize, type: 1 });
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
    obstacles.push({ x: x * gridSize, y: y * gridSize, type: type });
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

  // Show submit message if needed
  if (submitMessageTimer > 0) {
    fill(255);
    textAlign(CENTER);
    textSize(20);
    text(submitMessage, width / 2, height - 50);
    submitMessageTimer--;
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

  // Draw leaderboard
  drawLeaderboard();
}

function drawGameOverScreen() {
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(40);
  text("GAME OVER", width / 2, height / 3);

  textSize(30);
  text("Score: " + score, width / 2, height / 2);

  // Email input for leaderboard
  if (showEmailInput) {
    // Draw input box background
    fill(0, 50, 100);
    rect(width / 2 - 150, height / 2 + 40, 300, 40, 5);

    // Draw input box border
    strokeWeight(2);
    stroke(0, 150, 255);
    noFill();
    rect(width / 2 - 150, height / 2 + 40, 300, 40, 5);

    // Draw email text with cursor
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(18);
    noStroke();
    text(
      emailInput + (frameCount % 60 < 30 ? "" : ""),
      width / 2,
      height / 2 + 60
    );

    // Show validation status
    if (emailInput.length > 0) {
      if (isValidEmail(emailInput)) {
        fill(0, 255, 0);
        text("✓", width / 2 + 160, height / 2 + 60);
      } else {
        fill(255, 0, 0);
        text("✗", width / 2 + 160, height / 2 + 60);
      }
    }

    // Instructions
    textSize(14);
    fill(0, 200, 255);
    text("Enter your email and press ENTER", width / 2, height / 2 + 100);
    text("Press ESC to cancel", width / 2, height / 2 + 120);

    if (isSubmittingScore) {
      fill(255);
      textSize(16);
      text("Submitting score...", width / 2, height / 2 + 150);
    } else if (submitMessage && submitMessageTimer > 0) {
      fill(submitMessage.includes('Error') ? '#ff5555' : '#55ff55');
      textSize(16);
      text(submitMessage, width / 2, height / 2 + 190);
    }
  } else {
    textSize(20);
    text("Press ENTER to restart", width / 2, height / 2 + 60);
    text("Press E to submit score", width / 2, height / 2 + 90);
  }

  // Draw leaderboard
  drawLeaderboard();
}

// Draw leaderboard
function drawLeaderboard() {
  // Draw leaderboard background
  fill(0, 50, 100, 150);
  rect(800, 0, 200, height);

  // Draw leaderboard title
  fill(0, 200, 255);
  textSize(20);
  textAlign(CENTER);
  text("LEADERBOARD", 900, 30);

  // Draw leaderboard entries
  fill(255);
  textSize(16);
  textAlign(LEFT);
  for (let i = 0; i < leaderboard.length && i < 10; i++) {
    let entry = leaderboard[i];
    // Only show the part before @ symbol
    let displayEmail = entry.email.split("@")[0];
    if (displayEmail.length > 12) {
      displayEmail = displayEmail.substring(0, 9) + "...";
    }
    text(`${i + 1}. ${displayEmail}`, 820, 70 + i * 30);
    textAlign(RIGHT);
    text(entry.score, 980, 70 + i * 30);
    textAlign(LEFT);
  }
}

function updateGame() {
  // Update player
  player.update();

  // Update engine sounds
  updateEngineSound();

  // Spawn enemies
  spawnTimer++;
  if (spawnTimer > 180 / difficulty) {
    // Spawn every 3 seconds at difficulty 1, faster at higher difficulties
    spawnEnemy();
    spawnTimer = 0;
  }

  // Increase difficulty over time
  difficultyTimer++;
  if (difficultyTimer > 1800) {
    // Every 30 seconds
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
      playExplosionSound();
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
    playExplosionSound();
    stopAllSounds();
    playGameOverSound();
    gameState = "gameOver";
    showEmailInput = true; // Automatically show email input when game over
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

  // Draw leaderboard
  drawLeaderboard();
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
      line(
        obstacle.x + gridSize / 2,
        obstacle.y,
        obstacle.x + gridSize / 2,
        obstacle.y + gridSize
      );
      line(
        obstacle.x,
        obstacle.y + gridSize / 2,
        obstacle.x + gridSize,
        obstacle.y + gridSize / 2
      );
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
  
  // Sound toggle button
  fill(0, 0, 0, 150);
  rect(soundButton.x, soundButton.y, soundButton.width, soundButton.height, 5);
  
  if (soundEnabled) {
    // Speaker icon with sound waves
    fill(0, 255, 0);
    // Speaker body
    rect(soundButton.x + 8, soundButton.y + 10, 6, 10);
    // Speaker cone
    triangle(
      soundButton.x + 14, soundButton.y + 10,
      soundButton.x + 20, soundButton.y + 5,
      soundButton.x + 20, soundButton.y + 25
    );
    // Sound waves
    noFill();
    stroke(0, 255, 0);
    strokeWeight(1);
    arc(soundButton.x + 20, soundButton.y + 15, 10, 10, -QUARTER_PI, QUARTER_PI);
    arc(soundButton.x + 20, soundButton.y + 15, 15, 15, -QUARTER_PI, QUARTER_PI);
    noStroke();
  } else {
    // Speaker icon with X
    fill(255, 0, 0);
    // Speaker body
    rect(soundButton.x + 8, soundButton.y + 10, 6, 10);
    // Speaker cone
    triangle(
      soundButton.x + 14, soundButton.y + 10,
      soundButton.x + 20, soundButton.y + 5,
      soundButton.x + 20, soundButton.y + 25
    );
    // X over speaker
    stroke(255, 0, 0);
    strokeWeight(2);
    line(soundButton.x + 5, soundButton.y + 5, soundButton.x + 25, soundButton.y + 25);
    line(soundButton.x + 25, soundButton.y + 5, soundButton.x + 5, soundButton.y + 25);
    noStroke();
  }
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
  if (gameState === "gameOver") {
    if ((keyCode === ENTER || keyCode === RETURN)) {
      if (showEmailInput && isValidEmail(emailInput)) {
        // Submit score
        submitScore(emailInput, score);
        showEmailInput = false;
      } else if (!showEmailInput) {
        resetGame();
      }
    } else if (keyCode === 69 && !showEmailInput) { // 'E' key
      // Show email input
      showEmailInput = true;
      emailInput = '';
    } else if (keyCode === ESCAPE && showEmailInput) {
      // Cancel email input
      showEmailInput = false;
    } else if (keyCode === BACKSPACE && showEmailInput) {
      // Handle backspace
      emailInput = emailInput.slice(0, -1);
    } else if (keyCode === 32 && !showEmailInput) { // Space key
      resetGame();
    }
  }
}

// Add keyTyped function for better character handling
function keyTyped() {
  if (gameState === "gameOver" && showEmailInput && emailInput.length < 30) {
    // This captures the actual typed character including dots
    if (key.length === 1) {
      emailInput += key;
    }
    return false; // Prevent default behavior
  }
  return true;
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
    this.x = constrain(this.x, this.width / 2, width - this.width / 2);
    this.y = constrain(this.y, this.height / 2, height - this.height / 2);

    // Check collisions with obstacles
    for (let obstacle of obstacles) {
      if (this.collidesWith(obstacle.x, obstacle.y, gridSize, gridSize)) {
        // Push tank away from obstacle
        let dx = this.x - (obstacle.x + gridSize / 2);
        let dy = this.y - (obstacle.y + gridSize / 2);
        let angle = atan2(dy, dx);

        this.x =
          obstacle.x +
          gridSize / 2 +
          cos(angle) * (this.width / 2 + gridSize / 2 + 1);
        this.y =
          obstacle.y +
          gridSize / 2 +
          sin(angle) * (this.height / 2 + gridSize / 2 + 1);
      }
    }
  }

  collidesWith(x, y, w, h) {
    return (
      this.x - this.width / 2 < x + w &&
      this.x + this.width / 2 > x &&
      this.y - this.height / 2 < y + h &&
      this.y + this.height / 2 > y
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
      playLaserSound();
      
      // Add a small screen shake effect
      if (this === player) {
        // Screen shake could be implemented here
      }
    }
  }

  takeDamage(amount) {
    this.health -= amount;
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

    if (keyIsDown(UP_ARROW) || keyIsDown(87)) {
      // Up arrow or W
      this.speed = this.maxSpeed;
      moving = true;
    } else if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) {
      // Down arrow or S
      this.speed = -this.maxSpeed * 0.7; // Slower backward movement
      moving = true;
    }

    if (!moving) {
      // Apply friction when not actively moving
      this.speed *= 0.8;
    }

    // Rotation
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
      // Left arrow or A
      this.heading -= this.rotationSpeed;
    }
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
      // Right arrow or D
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
    rect(13, -12, 4, 24, 2); // Right tread

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
      let angleDiff = abs(
        ((this.turretAngle - this.heading + 360) % 360) - 180
      );
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
    rect(13, -12, 4, 24, 2); // Right tread

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
          if (
            obstacles[i].x === gridX * gridSize &&
            obstacles[i].y === gridY * gridSize
          ) {
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
    ellipse(
      this.x - cos(this.angle) * this.speed * 0.5,
      this.y - sin(this.angle) * this.speed * 0.5,
      this.size * 0.7,
      this.size * 0.7
    );
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
        decay: random(3, 7),
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
    // Check if sound button was clicked
    if (mouseX >= soundButton.x && mouseX <= soundButton.x + soundButton.width &&
        mouseY >= soundButton.y && mouseY <= soundButton.y + soundButton.height) {
      soundEnabled = !soundEnabled;
      
      if (soundEnabled) {
        // Try to restart sound system
        setupSound();
      } else {
        // Stop all sounds
        stopAllSounds();
      }
      
      return false; // Prevent default
    }
    
    player.shoot();
    return false; // Prevent default
  }
}

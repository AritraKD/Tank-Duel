// Enhanced Tank Duel Game - Best of 3, Scoreboard, Retro Theme with Reset + Match Stats

const container = document.createElement('div');
container.style.background = 'white';
container.style.display = 'flex';
container.style.flexDirection = 'column';
container.style.alignItems = 'center';
container.style.justifyContent = 'center';
container.style.height = '100vh';
document.body.style.margin = '0';
document.body.style.fontFamily = 'monospace';
document.body.appendChild(container);

const title = document.createElement('h1');
title.innerText = 'TANK DUEL';
title.style.fontFamily = 'monospace';
title.style.fontSize = '72px';
title.style.color = 'lime';
title.style.textShadow = '0 0 10px lime';
title.style.textAlign = 'center';
container.appendChild(title);

const canvas = document.createElement('canvas');
canvas.width = 640;
canvas.height = 480;
canvas.style.border = '8px solid black';
container.appendChild(canvas);

const matchResults = document.createElement('div');
matchResults.style.fontFamily = 'monospace';
matchResults.style.marginTop = '16px';
matchResults.style.fontSize = '16px';
matchResults.style.textAlign = 'center';
container.appendChild(matchResults);

const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

let scores = { lime: 0, magenta: 0 };
let matches = [];
let gameOver = false;
let winner = '';

const tanks = [
  { x: 100, y: 100, angle: 0, color: 'lime', health: 3, keys: { left: 'a', right: 'd', up: 'w', shoot: ' ' }, bullets: [], alive: true, cooldown: 0, shots: 0, hits: 0 },
  { x: 500, y: 380, angle: Math.PI, color: 'magenta', health: 3, keys: { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', shoot: 'Enter' }, bullets: [], alive: true, cooldown: 0, shots: 0, hits: 0 }
];

const shootSound = new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_27ab4b2332.mp3?filename=laser-gun-81874.mp3');
const hitSound = new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_4c85a5e064.mp3?filename=explosion-81870.mp3');

function drawTank(t) {
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.rotate(t.angle);
  ctx.fillStyle = t.color;
  ctx.fillRect(-15, -10, 30, 20);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, -3, 20, 6);
  ctx.restore();
  drawHealthBar(t);
}

function drawHealthBar(t) {
  ctx.fillStyle = '#0f0';
  ctx.fillRect(t.x - 15, t.y - 20, 10 * t.health, 5);
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(t.x - 15, t.y - 20, 30, 5);
}

function moveTank(t) {
  if (!t.alive) return;
  if (keys[t.keys.left]) t.angle -= 0.05;
  if (keys[t.keys.right]) t.angle += 0.05;
  if (keys[t.keys.up]) {
    const newX = t.x + Math.cos(t.angle) * 2;
    const newY = t.y + Math.sin(t.angle) * 2;
    if (newX > 10 && newX < WIDTH - 10 && newY > 30 && newY < HEIGHT - 10) {
      t.x = newX;
      t.y = newY;
    }
  }
  if (keys[t.keys.shoot]) shoot(t);
}

function shoot(t) {
  if (t.cooldown <= 0) {
    t.bullets.push({ x: t.x + Math.cos(t.angle) * 20, y: t.y + Math.sin(t.angle) * 20, angle: t.angle, life: 60 });
    t.cooldown = 20;
    t.shots++;
    shootSound.currentTime = 0;
    shootSound.play();
  }
}

function updateBullets(t) {
  t.bullets.forEach(b => {
    b.x += Math.cos(b.angle) * 5;
    b.y += Math.sin(b.angle) * 5;
    b.life--;
  });
  t.bullets = t.bullets.filter(b => b.life > 0);
}

function drawBullets(t) {
  ctx.fillStyle = 'yellow';
  t.bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function checkHits() {
  tanks.forEach((t, i) => {
    if (!t.alive) return;
    tanks.forEach((enemy, j) => {
      if (i === j || !enemy.alive) return;
      t.bullets.forEach(b => {
        const dx = b.x - enemy.x;
        const dy = b.y - enemy.y;
        if (Math.sqrt(dx * dx + dy * dy) < 15) {
          enemy.health--;
          b.life = 0;
          t.hits++;
          hitSound.currentTime = 0;
          hitSound.play();
          if (enemy.health <= 0) {
            enemy.alive = false;
            winner = t.color;
            scores[winner]++;
            matches.push(winner);
            gameOver = true;
            setTimeout(() => drawGameOverScreen(), 500);
          }
        }
      });
    });
  });
}

function drawScoreboard() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, WIDTH, 30);
  ctx.fillStyle = 'lime';
  ctx.font = '16px monospace';
  ctx.fillText(`LIME: ${scores.lime}`, 20, 20);
  ctx.fillText(`MAGENTA: ${scores.magenta}`, WIDTH - 160, 20);
}

function drawGameOverScreen() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = 'lime';
  ctx.font = '32px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${winner.toUpperCase()} WINS!`, WIDTH / 2, HEIGHT / 2 - 60);

  let btnText = 'Continue';

  if (matches.length >= 3) {
    const limeWins = matches.filter(m => m === 'lime').length;
    const magentaWins = matches.filter(m => m === 'magenta').length;
    const finalWinner = limeWins > magentaWins ? 'LIME' : 'MAGENTA';
    ctx.fillText(`${finalWinner} WINS BEST OF 3!`, WIDTH / 2, HEIGHT / 2 - 20);

    const limeStats = tanks[0];
    const magentaStats = tanks[1];
    const limeAcc = limeStats.shots > 0 ? (limeStats.hits / limeStats.shots * 100).toFixed(1) : 0;
    const magentaAcc = magentaStats.shots > 0 ? (magentaStats.hits / magentaStats.shots * 100).toFixed(1) : 0;
    ctx.font = '16px monospace';
    ctx.fillText(`LIME - Shots: ${limeStats.shots}, Hits: ${limeStats.hits}, Accuracy: ${limeAcc}%`, WIDTH / 2, HEIGHT / 2 + 20);
    ctx.fillText(`MAGENTA - Shots: ${magentaStats.shots}, Hits: ${magentaStats.hits}, Accuracy: ${magentaAcc}%`, WIDTH / 2, HEIGHT / 2 + 40);

    // Reset everything for the next best of 3
    scores = { lime: 0, magenta: 0 };
    matches = [];
    tanks.forEach(t => { t.shots = 0; t.hits = 0; });

    btnText = 'New Match';
  }

  const btn = document.createElement('button');
  btn.innerText = btnText;
  btn.style.position = 'absolute';
  btn.style.top = '70%';
  btn.style.left = '50%';
  btn.style.transform = 'translate(-50%, -50%)';
  btn.style.padding = '10px 20px';
  btn.style.fontSize = '16px';
  btn.style.fontFamily = 'monospace';
  btn.style.color = '#0f0';
  btn.style.background = 'black';
  btn.style.border = '2px solid #0f0';
  btn.onclick = () => {
    document.body.removeChild(btn);
    resetGame();
    gameOver = false;
    updateMatchResults();
    gameLoop();
  };
  document.body.appendChild(btn);
}

function resetGame() {
  tanks[0].x = 100; tanks[0].y = 100; tanks[0].angle = 0; tanks[0].alive = true; tanks[0].health = 3; tanks[0].bullets = []; tanks[0].cooldown = 0;
  tanks[1].x = 500; tanks[1].y = 380; tanks[1].angle = Math.PI; tanks[1].alive = true; tanks[1].health = 3; tanks[1].bullets = []; tanks[1].cooldown = 0;
}

function updateMatchResults() {
  matchResults.innerHTML = `Match Results: ${matches.map((m, i) => `Game ${i + 1}: ${m.toUpperCase()}`).join(' | ')}`;
}

function drawWalls() {
  ctx.fillStyle = '#333';
  ctx.fillRect(0, 30, 10, HEIGHT - 30);
  ctx.fillRect(WIDTH - 10, 30, 10, HEIGHT - 30);
}

function gameLoop() {
  if (gameOver) return;

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawWalls();
  drawScoreboard();

  tanks.forEach(t => {
    moveTank(t);
    updateBullets(t);
  });

  checkHits();

  tanks.forEach(t => {
    drawTank(t);
    drawBullets(t);
    if (t.cooldown > 0) t.cooldown--;
  });

  requestAnimationFrame(gameLoop);
}

updateMatchResults();
gameLoop();

// Server-side Tank Duel Game (WebSocket Multiplayer)

const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 3000 });

const WIDTH = 640;
const HEIGHT = 480;

let clients = [];
let inputs = [{}, {}];

let state = {
  tanks: [
    { x: 100, y: 100, angle: 0, color: 'lime', health: 3, bullets: [] },
    { x: 500, y: 380, angle: Math.PI, color: 'magenta', health: 3, bullets: [] }
  ],
  scores: { lime: 0, magenta: 0 }
};

server.on('connection', (socket) => {
  if (clients.length >= 2) {
    socket.close();
    return;
  }
  const playerIndex = clients.length;
  clients.push(socket);

  socket.on('message', (msg) => {
    const data = JSON.parse(msg);
    if (data.type === 'input') {
      inputs[playerIndex][data.key] = data.state;
    }
  });

  socket.on('close', () => {
    clients = clients.filter(s => s !== socket);
    inputs[playerIndex] = {};
  });
});

function update() {
  state.tanks.forEach((tank, i) => {
    const input = inputs[i];
    if (input['a'] && i === 0 || input['ArrowLeft'] && i === 1) tank.angle -= 0.05;
    if (input['d'] && i === 0 || input['ArrowRight'] && i === 1) tank.angle += 0.05;
    if (input['w'] && i === 0 || input['ArrowUp'] && i === 1) {
      const nx = tank.x + Math.cos(tank.angle) * 2;
      const ny = tank.y + Math.sin(tank.angle) * 2;
      if (nx > 10 && nx < WIDTH - 10 && ny > 30 && ny < HEIGHT - 10) {
        tank.x = nx;
        tank.y = ny;
      }
    }
    if ((input[' '] && i === 0) || (input['Enter'] && i === 1)) {
      if (tank.bullets.length < 3) {
        tank.bullets.push({ x: tank.x, y: tank.y, angle: tank.angle });
      }
    }
  });

  state.tanks.forEach((tank, i) => {
    tank.bullets = tank.bullets.map(b => ({
      ...b,
      x: b.x + Math.cos(b.angle) * 5,
      y: b.y + Math.sin(b.angle) * 5
    })).filter(b => b.x > 0 && b.x < WIDTH && b.y > 0 && b.y < HEIGHT);
  });

  checkHits();

  broadcast({ type: 'state', state });
}

function checkHits() {
  const [a, b] = state.tanks;

  b.bullets.forEach(bullet => {
    if (hitTank(a, bullet)) {
      a.health--;
      bullet.hit = true;
      if (a.health <= 0) {
        state.scores.magenta++;
        reset();
      }
    }
  });

  a.bullets.forEach(bullet => {
    if (hitTank(b, bullet)) {
      b.health--;
      bullet.hit = true;
      if (b.health <= 0) {
        state.scores.lime++;
        reset();
      }
    }
  });

  a.bullets = a.bullets.filter(b => !b.hit);
  b.bullets = b.bullets.filter(b => !b.hit);
}

function hitTank(tank, bullet) {
  const dx = tank.x - bullet.x;
  const dy = tank.y - bullet.y;
  return Math.sqrt(dx * dx + dy * dy) < 20;
}

function reset() {
  state.tanks = [
    { x: 100, y: 100, angle: 0, color: 'lime', health: 3, bullets: [] },
    { x: 500, y: 380, angle: Math.PI, color: 'magenta', health: 3, bullets: [] }
  ];
}

setInterval(update, 1000 / 60);

function broadcast(msg) {
  const json = JSON.stringify(msg);
  clients.forEach(c => c.readyState === WebSocket.OPEN && c.send(json));
}
